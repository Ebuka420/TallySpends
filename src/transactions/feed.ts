import type { Transaction } from "../budget/ledger";
import type { AuthenticatedBankRequest } from "../banking/backend";
import { getTransactions } from "./api";

export type TransactionFeedState = "idle" | "loading" | "ready" | "error";
export type TransactionFeedSnapshot = {
  owner: string | null;
  state: TransactionFeedState;
  transactions: Transaction[];
  error: string | null;
  refreshedAt: number | null;
};

const empty: TransactionFeedSnapshot = { owner: null, state: "idle", transactions: [], error: null, refreshedAt: null };
let snapshot = empty;
let generation = 0;
let inFlight: { owner: string; generation: number; promise: Promise<Transaction[]> } | null = null;
const listeners = new Set<() => void>();

export const getTransactionFeedSnapshot = () => snapshot;
export function subscribeTransactionFeed(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function publish(next: TransactionFeedSnapshot) {
  snapshot = next;
  listeners.forEach(listener => listener());
}

export function clearTransactionFeed() {
  generation++;
  inFlight = null;
  publish(empty);
}

export async function refreshTransactionFeed(owner: string, request: AuthenticatedBankRequest, force = false): Promise<Transaction[]> {
  if (!owner.trim()) throw new Error("Sign in before refreshing transactions.");
  if (snapshot.owner !== owner) {
    generation++;
    inFlight = null;
    publish({ owner, state: "loading", transactions: [], error: null, refreshedAt: null });
  }
  while (inFlight?.owner === owner) {
    if (!force) return inFlight.promise;
    const current = inFlight.promise;
    await current.catch(() => {});
    if (snapshot.owner !== owner) throw new Error("Your account changed while transactions were loading. Please refresh again.");
  }
  if (!force && snapshot.owner === owner && snapshot.state === "ready" && snapshot.refreshedAt && Date.now() - snapshot.refreshedAt < 30000) return snapshot.transactions;

  const currentGeneration = generation;
  publish({ ...snapshot, owner, state: "loading", error: null });
  const promise = getTransactions(request).then(transactions => {
    if (generation !== currentGeneration || snapshot.owner !== owner) throw new Error("Your account changed while transactions were loading. Please refresh again.");
    publish({ owner, state: "ready", transactions, error: null, refreshedAt: Date.now() });
    return transactions;
  }).catch(error => {
    if (generation === currentGeneration && snapshot.owner === owner) {
      publish({ ...snapshot, owner, state: "error", error: error instanceof Error ? error.message : "Couldn't load transactions. Please try again." });
    }
    throw error;
  }).finally(() => {
    if (inFlight?.generation === currentGeneration) inFlight = null;
  });
  inFlight = { owner, generation: currentGeneration, promise };
  return promise;
}
