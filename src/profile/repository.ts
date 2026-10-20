import AsyncStorage from "@react-native-async-storage/async-storage";
import { preparePhotoUpload } from "./upload";
import { createProfileRequest } from "./api";
import { cachedProfile, emptyProfile, parseProfile, profileScope, type Profile, type ProfileUser } from "./model";
let snapshot = { profile: { ...emptyProfile }, scope: null as string | null, loading: false, error: null as string | null, saving: false, token: null as string | null, refreshToken: null as string | null };
const listeners = new Set<() => void>();
const controllers = new Set<AbortController>();
let epoch = 0;
let hydration: Promise<void> | null = null;
let lastSync = 0;
let signedOut = false;
export const getProfileSnapshot = () => snapshot;
export function subscribeProfile(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function publish(patch: Partial<typeof snapshot>) { snapshot = { ...snapshot, ...patch }; listeners.forEach(listener => listener()); }
export function publishProfileTokens(token: string, refreshToken?: string) { publish({ token, ...(refreshToken ? { refreshToken } : {}) }); }
const cacheKey = (scope: string) => "ts_account_profile_v1_" + encodeURIComponent(scope);
export function clearProfileSession(disable = false) {
  signedOut = disable;
  epoch++; controllers.forEach(controller => controller.abort()); hydration = null; lastSync = 0;
  publish({ profile: { ...emptyProfile }, scope: null, loading: false, error: null, saving: false, token: null, refreshToken: null });
}
async function withRequest<T>(operation: (request: ReturnType<typeof createProfileRequest>) => Promise<T>, expected: number) {
  const controller = new AbortController(); controllers.add(controller);
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const token = await AsyncStorage.getItem("ts_access_token");
    const refreshToken = await AsyncStorage.getItem("ts_refresh_token");
    if (epoch !== expected) throw new Error("Your account changed. Please try again.");
    return await operation(createProfileRequest({ token, refreshToken, saveTokens: async (access, refresh) => {
      if (epoch !== expected) throw new Error("Your account changed. Please try again.");
      await AsyncStorage.multiSet([["ts_access_token", access], ["ts_refresh_token", refresh]]);
      if (epoch === expected) publishProfileTokens(access, refresh);
    } }, controller.signal));
  } finally { clearTimeout(timer); controllers.delete(controller); }
}
async function commit(profile: Profile, expected: number, scope: string) {
  if (epoch !== expected) throw new Error("Your account changed. Please try again.");
  await AsyncStorage.setItem(cacheKey(scope), JSON.stringify(profile));
  if (epoch === expected) publish({ profile });
}
export async function loadAccountProfile(force = false) {
  if (signedOut) return;
  const started = epoch;
  const stored = await AsyncStorage.multiGet(["ts_user", "ts_access_token", "ts_refresh_token"]);
  if (epoch !== started || signedOut) return;
  const raw = stored[0][1];
  const token = stored[1][1];
  let user: ProfileUser | null = null;
  try { user = raw ? JSON.parse(raw) : null; } catch { /* An unknown owner must never inherit a cache. */ }
  const scope = token ? profileScope(user) : null;
  if (!scope) { if (snapshot.scope) clearProfileSession(); return; }
  if (scope !== snapshot.scope) { clearProfileSession(); publish({ scope, loading: true }); }
  if (token) publish({ token, refreshToken: stored[2][1] });
  if (snapshot.saving) return;
  if (hydration) return hydration;
  if (!force && lastSync && Date.now() - lastSync < 30000) return;
  const expected = epoch;
  publish({ loading: true, error: null });
  const task = (async () => {
    try {
      if (!lastSync) {
        const rawCache = await AsyncStorage.getItem(cacheKey(scope));
        let cached: Profile | null = null;
        try { if (rawCache) cached = cachedProfile(JSON.parse(rawCache)); } catch { /* Ignore corrupt cache. */ }
        const seeded = cached || { ...emptyProfile, ...parseProfile({ fullName: user?.fullName || "", email: user?.email || "", ...(user?.tallyTag ? { tallyTag: user.tallyTag } : {}), ...(user?.phoneNumber ? { phoneNumber: user.phoneNumber } : {}) }) };
        if (epoch !== expected) return;
        publish({ profile: seeded });
      }
      const result = await withRequest(request => request("/api/users/me"), expected);
      const fields = parseProfile(result);
      if (epoch !== expected) return;
      await commit({ ...snapshot.profile, ...fields }, expected, scope);
      lastSync = Date.now();
    } catch (error) { if (epoch === expected) publish({ error: error instanceof Error ? error.message : "Couldn't load your profile." }); }
    finally { if (epoch === expected) { publish({ loading: false }); hydration = null; } }
  })();
  hydration = task;
  return task;
}
export async function updateAccountProfile(patch: Partial<Profile>, photo?: { uri: string; name: string; type: string }, expectedScope = snapshot.scope) {
  const scope = snapshot.scope;
  if (!scope || scope !== expectedScope) throw new Error("Your account changed. Sign in again before updating your profile.");
  if (snapshot.loading) throw new Error("Your profile is still loading. Please try again in a moment.");
  if (snapshot.saving) throw new Error("Please wait for your current profile change to finish.");
  const expected = epoch;
  publish({ saving: true, error: null });
  try {
    if ("email" in patch || "tallyTag" in patch) throw new Error("Changing email or TallyTag isn't supported by the backend yet. Your account details have not changed.");
    if (Object.keys(patch).some(key => !["fullName", "phoneNumber", "avatarUrl"].includes(key))) throw new Error("These profile fields are not supported by the backend sync contract yet. No device-only change has been saved.");
    if (photo || "fullName" in patch || "phoneNumber" in patch || "avatarUrl" in patch) {
      await withRequest(async request => {
        if (photo) {
          const body = await preparePhotoUpload(photo);
          await request("/api/users/me/avatar", { method: "POST", body });
        } else {
          const body = { ...(patch.fullName !== undefined ? { fullName: patch.fullName } : {}), ...(patch.phoneNumber !== undefined ? { phoneNumber: patch.phoneNumber } : {}), ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl } : {}) };
          await request("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        }
        let refreshed: unknown;
        try { refreshed = await request("/api/users/me"); }
        catch (error) {
          if (photo) throw new Error("The upload was accepted, but your updated profile couldn't be loaded. Refresh your profile before uploading again.");
          throw error;
        }
        const fields = parseProfile(refreshed);
        if (photo && !fields.avatarUrl) throw new Error("The upload was accepted, but the backend hasn't returned your saved photo URL. Refresh your profile before uploading again.");
        if (patch.fullName !== undefined && fields.fullName !== patch.fullName || patch.phoneNumber !== undefined && fields.phoneNumber !== patch.phoneNumber) throw new Error("The server hasn't confirmed your profile change yet. Refresh your profile and try again.");
        await commit({ ...snapshot.profile, ...fields }, expected, scope);
      }, expected);
    } else throw new Error("These profile fields are not supported by the backend sync contract yet. No device-only change has been saved.");
  } catch (error) { if (epoch === expected) publish({ error: error instanceof Error ? error.message : "Couldn't save your profile." }); throw error; }
  finally { if (epoch === expected) publish({ saving: false }); }
}
