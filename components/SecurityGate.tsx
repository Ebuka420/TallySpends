import * as LocalAuthentication from "expo-local-authentication";
import { createContext, useContext, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ActivityIndicator, Alert, AppState, Modal, Pressable, Text, View } from "react-native";
import { getProfileSnapshot, loadAccountProfile, subscribeProfile } from "../src/profile/repository";
import { verifyAccountPassword } from "../src/security/api";
import { createPin, readPin, verifyPin, writePin } from "../src/security/pin";
import { createConfirmation } from "../src/security/confirmation";
import { createAwayPolicy } from "../src/security/away";
import { BIOMETRIC_BUILD_ISSUE } from "../src/security/biometrics";
import { onDeviceScreenOff, takeDeviceLockSnapshot } from "../modules/tally-device-lock";
import { useAppStore } from "../src/store";
import PinScreen from "./PinScreen";

type Security = { unlocked: boolean; lockScreen: ReactNode; biometrics: boolean; biometricIssue: string | null; setBiometrics: (enabled: boolean) => Promise<void>; lock: () => void; authorizeTransfer: () => Promise<boolean> };
const Context = createContext<Security | null>(null);
export function useSecurity() { const value = useContext(Context); if (!value) throw new Error("Security provider unavailable"); return value; }
export default function SecurityGate({ children, authenticated }: { children: ReactNode; authenticated: boolean }) {
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileSnapshot);
  // An account change must start with a new, locked security session.
  return <SecuritySession key={authenticated ? profile.scope || "preparing" : "signed-out"} authenticated={authenticated}>{children}</SecuritySession>;
}
function SecuritySession({ children, authenticated }: { children: ReactNode; authenticated: boolean }) {
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileSnapshot);
  const owner = profile.scope;
  const { theme, logout, login } = useAppStore();
  const [loadedOwner, setLoadedOwner] = useState<string | null>(null);
  const [locked, setLocked] = useState(true);
  const [exists, setExists] = useState(false);
  const [biometrics, setBiometricState] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [transfer, setTransfer] = useState(false);
  const [suspended, setSuspended] = useState(AppState.currentState !== "active");
  const confirmation = useRef(createConfirmation());
  const recovering = useRef<string | null>(null);
  const autoAttempted = useRef(false);
  const biometricBusy = useRef(false);
  const unlockGeneration = useRef(0);
  const alive = useRef(true);
  const away = useRef(createAwayPolicy());
  const nativePrompting = useRef(0);
  const liveAccess = useRef(false);
  const unlocked = authenticated && !!owner && loadedOwner === owner && !locked && !suspended;
  useLayoutEffect(() => { liveAccess.current = unlocked; }, [unlocked]);
  const finishTransfer = (allowed: boolean, challenge: number | null = null) => {
    if (allowed && !confirmation.current.complete(challenge)) return false;
    if (!allowed) confirmation.current.cancel();
    setTransfer(false); return true;
  };
  useEffect(() => {
    let active = true;
    liveAccess.current = false; away.current.clear(); unlockGeneration.current++; recovering.current = null; autoAttempted.current = false; confirmation.current.cancel();
    if (authenticated && owner) void readPin(owner).then(record => {
      if (active) { setError(""); setExists(!!record); setBiometricState(!!record?.biometrics); setLoadedOwner(owner); }
    }).catch(() => { if (active) setError("Couldn't load secure app access. Retry to unlock your account."); });
    return () => { active = false; };
  }, [authenticated, owner, revision]);
  useEffect(() => {
    alive.current = true;
    const currentConfirmation = confirmation.current;
    const requireUnlock = () => {
      liveAccess.current = false; unlockGeneration.current++; setLocked(true); autoAttempted.current = false; recovering.current = null; finishTransfer(false);
    };
    const screen = onDeviceScreenOff(requireUnlock);
    const listener = AppState.addEventListener("change", state => {
      if (state === "background" || (state === "inactive" && nativePrompting.current === 0)) {
        away.current.leave(Date.now(), performance.now());
        liveAccess.current = false; setSuspended(true); unlockGeneration.current++; recovering.current = null; finishTransfer(false);
      }
      if (state === "active") {
        const shouldLock = away.current.resume(Date.now(), performance.now(), takeDeviceLockSnapshot());
        if (shouldLock) { requireUnlock(); setRevision(value => value + 1); }
        setSuspended(false);
      }
    });
    return () => { alive.current = false; listener.remove(); screen.remove(); currentConfirmation.cancel(); };
  }, []);
  const assertCurrent = (expected: string, generation: number) => {
    if (!alive.current || getProfileSnapshot().scope !== expected || unlockGeneration.current !== generation) throw new Error("Your app session changed. Please try again.");
  };
  const biometricCheck = async () => {
    if (BIOMETRIC_BUILD_ISSUE) throw new Error(BIOMETRIC_BUILD_ISSUE);
    nativePrompting.current++;
    try {
    if (!await LocalAuthentication.hasHardwareAsync() || !await LocalAuthentication.isEnrolledAsync()) throw new Error("Set up Face ID or fingerprint in your phone settings first. You can use your app PIN instead.");
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Verify it's you in TallySpends", cancelLabel: "Use PIN", disableDeviceFallback: true, fallbackLabel: "", biometricsSecurityLevel: "strong" });
    if (!result.success) throw new Error("Biometric verification wasn't completed. Try again or use your PIN.");
    } finally { nativePrompting.current--; }
  };
  const unlockBiometric = async (forTransfer = false) => {
    if (!owner || !biometrics || biometricBusy.current) return;
    biometricBusy.current = true;
    const generation = unlockGeneration.current;
    const challenge = confirmation.current.challenge;
    try {
      await biometricCheck(); assertCurrent(owner, generation);
      if (forTransfer) { if (!finishTransfer(true, challenge)) throw new Error("This confirmation was cancelled. Please try again."); }
      else { takeDeviceLockSnapshot(); setLocked(false); }
    }
    finally { biometricBusy.current = false; }
  };
  const attemptAppUnlock = useEffectEvent(() => unlockBiometric());
  const attemptTransferUnlock = useEffectEvent(() => unlockBiometric(true));
  useEffect(() => {
    if (!BIOMETRIC_BUILD_ISSUE && !suspended && AppState.currentState === "active" && authenticated && owner && loadedOwner === owner && locked && exists && biometrics && !autoAttempted.current) {
      autoAttempted.current = true;
      void attemptAppUnlock().catch(() => {});
    }
  }, [authenticated, owner, loadedOwner, locked, exists, biometrics, suspended]);
  useEffect(() => { if (transfer && biometrics && !BIOMETRIC_BUILD_ISSUE) void attemptTransferUnlock().catch(() => {}); }, [transfer, biometrics]);
  const submit = async (pin: string, reset: boolean, forTransfer = false) => {
    if (!owner) throw new Error("Sign in again to set your app PIN.");
    const generation = unlockGeneration.current;
    const challenge = confirmation.current.challenge;
    if (!exists || reset) {
      if (exists && recovering.current !== owner) throw new Error("Verify your account password before resetting the PIN.");
      await createPin(owner, pin); assertCurrent(owner, generation); recovering.current = null; setExists(true); setBiometricState(false);
    } else { await verifyPin(owner, pin); assertCurrent(owner, generation); }
    if (forTransfer) { if (!finishTransfer(true, challenge)) throw new Error("This confirmation was cancelled. Please try again."); } else { takeDeviceLockSnapshot(); setLocked(false); }
  };
  const recover = async (password: string) => {
    if (!owner) throw new Error("Sign in again to recover your PIN.");
    const generation = unlockGeneration.current;
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const session = await verifyAccountPassword(owner, profile.profile.email || profile.profile.tallyTag, password, controller.signal);
      assertCurrent(owner, generation);
      await login(session.token, session.refreshToken || profile.refreshToken || undefined);
      assertCurrent(owner, generation); recovering.current = owner;
    } finally { clearTimeout(timeout); }
  };
  const security: Security = {
    unlocked,
    lockScreen: null,
    biometrics,
    biometricIssue: BIOMETRIC_BUILD_ISSUE,
    async setBiometrics(enabled) {
      if (!owner) throw new Error("Sign in first.");
      const generation = unlockGeneration.current;
      if (enabled) await biometricCheck();
      else if (!await security.authorizeTransfer()) throw new Error("Verification cancelled. Biometric access is unchanged.");
      assertCurrent(owner, generation);
      const record = await readPin(owner);
      if (!record) throw new Error("Set your app PIN first.");
      await writePin(owner, { ...record, biometrics: enabled }); assertCurrent(owner, generation); setBiometricState(enabled);
    },
    lock() { liveAccess.current = false; unlockGeneration.current++; autoAttempted.current = true; recovering.current = null; setLocked(true); finishTransfer(false); },
    authorizeTransfer() {
      if (!liveAccess.current || !owner || getProfileSnapshot().scope !== owner || AppState.currentState !== "active" || confirmation.current.active) return Promise.resolve(false);
      const promise = confirmation.current.begin(); setTransfer(true); return promise;
    },
  };
  const signOut = () => { void logout().catch(() => Alert.alert("Couldn't sign out", "Please try again.")); };
  if (authenticated && suspended) security.lockScreen = <View style={{ flex: 1, backgroundColor: theme.background }} />;
  else if (authenticated && (!owner || loadedOwner !== owner)) security.lockScreen = <View style={{ flex: 1, backgroundColor: theme.background, padding: 30, gap: 20, justifyContent: "center", alignItems: "center" }}>
    {!error && <ActivityIndicator color={theme.accent} />}<Text style={{ color: theme.textPrimary }}>{error || "Preparing secure access…"}</Text>
    <Pressable onPress={() => { void loadAccountProfile(true); setRevision(value => value + 1); }}><Text style={{ color: theme.accent }}>Retry</Text></Pressable>
    <Pressable onPress={signOut}><Text style={{ color: theme.textSecondary }}>Sign out</Text></Pressable>
  </View>;
  else if (authenticated && locked) security.lockScreen = <PinScreen key={`${owner}-${exists}`} theme={theme} setup={!exists} biometric={biometrics && !BIOMETRIC_BUILD_ISSUE}
    onSubmit={submit} onRecover={exists ? recover : undefined} onBiometric={() => unlockBiometric()} onSignOut={signOut} />;
  return <Context.Provider value={security}>{children}
    <Modal visible={unlocked && transfer} animationType="slide" onRequestClose={() => finishTransfer(false)}>
      {transfer && <PinScreen theme={theme} transfer biometric={biometrics && !BIOMETRIC_BUILD_ISSUE} onBiometric={() => unlockBiometric(true)} onSubmit={(pin, reset) => submit(pin, reset, true)} onRecover={recover} onCancel={() => finishTransfer(false)} />}
    </Modal>
  </Context.Provider>;
}
