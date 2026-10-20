import { useCallback, useRef, useEffect, useState, useSyncExternalStore } from "react";
import { useFocusEffect } from "expo-router";
import { useAppStore } from "../store";
import { createQrRequest, qrApi, type QrRequest } from "./api";
import { accountQrIdentity, type PaymentIdentity } from "./model";
import { getProfileSnapshot, subscribeProfile } from "../profile/repository";
export function useQrClient() {
  const store = useAppStore();
  const latest = useRef(store);
  latest.current = store;
  const controllers = useRef(new Set<AbortController>());
  const cancel = useCallback(() => { controllers.current.forEach(c => c.abort()); }, []);
  useEffect(() => cancel, [cancel]);
  const run = useCallback(async <T,>(action: (request: QrRequest) => Promise<T>) => {
    const s = latest.current;
    if (!s.isAuthenticated) throw new Error("Sign in to use payment QR codes.");
    const controller = new AbortController(); controllers.current.add(controller);
    const timer = setTimeout(() => controller.abort(), 15000);
    try { return await action(createQrRequest({ token: s.token, refreshToken: s.refreshToken, saveTokens: async (token, refresh) => { await s.login(token, refresh); } }, controller.signal)); }
    finally { clearTimeout(timer); controllers.current.delete(controller); }
  }, []);
  return { run, cancel, ready: !store.loading && store.isAuthenticated };
}
export function usePaymentIdentity() {
  const client = useQrClient();
  const store = useAppStore();
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileSnapshot);
  const [identity, setIdentity] = useState<PaymentIdentity | null>(null);
  const [identityScope, setIdentityScope] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setIdentity(null); setError(null); setLoading(true);
    const local = client.ready ? accountQrIdentity(profile.scope, store.profileFullName, store.profileTallyTag) : null;
    if (local) { setIdentity(local); setIdentityScope(profile.scope); setLoading(false); }
    else if (client.ready) void client.run(qrApi.identity).then(result => { if (active) { setIdentity(result); setIdentityScope(profile.scope); } })
      .catch(error => { if (active) setError(error instanceof Error ? error.message : "Your personal QR is not available yet. Please try again later."); })
      .finally(() => { if (active) setLoading(false); });
    else if (!store.loading) { setError("Sign in to generate your personal QR."); setLoading(false); }
    return () => { active = false; client.cancel(); };
  }, [client.run, client.cancel, client.ready, profile.scope, store.profileFullName, store.profileTallyTag, store.loading, revision]));
  const retry = useCallback(() => {
    // Refresh the real profile/session state as well as retrying the QR adapter.
    // Repository refresh retains the authenticated owner and handles token expiry.
    setError(null); setLoading(true);
    void store.refreshProfile().finally(() => setRevision(v => v + 1));
  }, [store.refreshProfile]);
  return { identity: client.ready && identityScope === profile.scope ? identity : null, error, loading, retry };
}
