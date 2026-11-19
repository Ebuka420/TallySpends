import { useCallback, useEffect, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { useApi } from "../useApi";
import { walletApi, type VirtualAccount, type WalletBalance, type WalletEntry } from "./api";
import type { ApiRequest } from "../network";
type Snapshot = { owner: string | null; balance: WalletBalance | null; ledger: WalletEntry[]; account: VirtualAccount | null; loading: boolean; error: string | null };
const empty: Snapshot = { owner: null, balance: null, ledger: [], account: null, loading: false, error: null };
let snapshot = empty;
const listeners = new Set<() => void>();
let active: { owner: string; promise: Promise<void> } | null = null;
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const get = () => snapshot;
function publish(value: Snapshot) { snapshot = value; listeners.forEach(listener => listener()); }
async function refresh(owner: string, request: ApiRequest) {
  if (active?.owner === owner) return active.promise;
  publish({ ...(snapshot.owner === owner ? snapshot : empty), owner, loading: true, error: null });
  const job = { owner, promise: Promise.resolve() };
  job.promise = (async () => {
    try {
      const [balance, ledger, account] = await Promise.all([walletApi.balance(request), walletApi.ledger(request), walletApi.account(request)]);
      if (active === job) publish({ owner, balance, ledger, account, loading: false, error: null });
    } catch (error) {
      if (active === job) publish({ ...snapshot, owner, balance: null, loading: false, error: error instanceof Error ? error.message : "Couldn't refresh your wallet." });
    } finally { if (active === job) active = null; }
  })();
  active = job;
  return job.promise;
}
export function useWallet() {
  const api = useApi();
  const stored = useSyncExternalStore(subscribe, get, get);
  const reload = useCallback(async () => { if (api.owner) await api.run(request => refresh(api.owner!, request)); }, [api.owner, api.run]);
  useEffect(() => {
    if (snapshot.owner !== api.owner) { active = null; publish({ ...empty, owner: api.owner }); }
  }, [api.owner]);
  useFocusEffect(useCallback(() => {
    void reload().catch(() => {});
    const listener = AppState.addEventListener("change", state => { if (state === "active") void reload().catch(() => {}); });
    return () => listener.remove();
  }, [reload]));
  return { ...(stored.owner === api.owner ? stored : empty), reload, api };
}
