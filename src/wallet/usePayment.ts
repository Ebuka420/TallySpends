import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Crypto from "expo-crypto";
import { useSecurity } from "../../components/SecurityGate";
import { getProfileSnapshot } from "../profile/repository";
import { useApi } from "../useApi";
import type { PaymentDraft } from "./api";
import { loadPayment, paymentUnresolved, preparePayment, submitPayment, type SavedPayment } from "./payments";

export function useWalletPayment(onSettled: () => Promise<void>) {
  const api = useApi();
  const security = useSecurity();
  const [payment, setPayment] = useState<SavedPayment | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoaded(false); setPayment(null); setOwner(api.owner); setError(null);
    if (api.owner) void loadPayment(api.owner).then(value => { if (active) { setPayment(value); setLoaded(true); } })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [api.owner]));
  const perform = useCallback(async (draft?: PaymentDraft, checkOnly = false) => {
    if (lock.current || !api.owner || !loaded) return;
    lock.current = true; setBusy(true); setError(null);
    const scope = api.owner;
    const currentOwner = () => mounted.current && getProfileSnapshot().scope === scope;
    try {
      // Polling only reads status. Every POST, including an uncertain retry,
      // requires the user's transfer authorization.
      if (!checkOnly && !await security.authorizeTransfer()) return;
      if (!currentOwner()) return;
      const saved = draft ? await preparePayment(scope, draft, Crypto.randomUUID()) : await loadPayment(scope);
      if (!saved) throw new Error("No saved payment to check.");
      if (currentOwner()) setPayment(saved);
      const result = await api.run(request => submitPayment(scope, saved, request, checkOnly));
      if (currentOwner()) {
        setPayment(result);
        if (!paymentUnresolved(result) || result.state === "Pending" && saved.state !== "Pending") await onSettled();
      }
    } catch (e) {
      if (currentOwner()) {
        setError(e instanceof Error ? e.message : "Couldn't confirm this payment.");
        const saved = await loadPayment(scope).catch(() => null);
        if (saved) setPayment(saved);
      }
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  }, [api.owner, api.run, loaded, security, onSettled]);
  const performRef = useRef(perform); performRef.current = perform;
  useFocusEffect(useCallback(() => {
    if (owner !== api.owner || payment?.draft.kind !== "bank" || payment.state !== "Pending") return;
    let attempts = 0;
    const timer = setInterval(() => {
      if (AppState.currentState !== "active" || lock.current) return;
      if (++attempts > 20) { clearInterval(timer); return; }
      void performRef.current(undefined, true);
    }, 3000);
    return () => clearInterval(timer);
  }, [api.owner, owner, payment?.key, payment?.state, payment?.draft.kind]));
  return { payment: owner === api.owner ? payment : null, busy, error, ready: loaded && owner === api.owner,
    send: (draft: PaymentDraft) => perform(draft), retry: () => perform(), check: () => perform(undefined, true) };
}
