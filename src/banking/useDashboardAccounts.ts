import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { bankBackend, createBankRequest, type BankSession, type LinkedBankAccount } from "./backend";

// Returning from Mono and returning from any unlink flow refreshes server records.
// No fabricated records, sums of balances, or guessed account-filter endpoints.
export function useDashboardAccounts(owner: string, session: BankSession) {
  const latestSession = useRef(session);
  latestSession.current = session;
  const [snapshot, setSnapshot] = useState<{ owner: string; accounts: LinkedBankAccount[]; loading: boolean; error: string | null }>({ owner, accounts: [], loading: false, error: null });
  const [revision, setRevision] = useState(0);
  const authenticated = Boolean(session.token || session.refreshToken);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    let active = true;
    const current = latestSession.current;
    if (!current.token && !current.refreshToken) {
      setSnapshot({ owner, accounts: [], loading: false, error: null });
      return () => controller.abort();
    }
    setSnapshot(previous => ({ owner, accounts: previous.owner === owner ? previous.accounts : [], loading: true, error: null }));
    const timeout = setTimeout(() => controller.abort(), 15000);
    void bankBackend.listAccounts(createBankRequest(current, controller.signal)).then(accounts => {
      if (active) setSnapshot({ owner, accounts, loading: false, error: null });
    }).catch(error => {
      // Do not continue showing stale bank balances after a failed refresh.
      if (active) setSnapshot(previous => ({ owner,
        accounts: previous.owner === owner ? previous.accounts.map(account => ({ ...account, availableBalance: undefined, transactions: undefined })) : [],
        loading: false, error: error instanceof Error ? error.message : "Linked accounts unavailable. Tap to retry." }));
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [owner, revision, authenticated]));
  return { ...(snapshot.owner === owner ? snapshot : { owner, accounts: [], loading: true, error: null }), retry: () => setRevision(value => value + 1) };
}
