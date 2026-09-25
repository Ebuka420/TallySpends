import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  applyBudgetCommand,
  createWallet,
  removeTransaction,
  upsertTransaction,
  validateWallet,
} from "./ledger";
import type { BudgetCommand, Transaction, Wallet } from "./ledger";
import {
  applyPlanCommand,
  migrateAjoTracking,
  type PlanCommand,
} from "./planning";

// A single document commits feed + allocations together. Legacy ts_txs is retained as a migration backup.
const KEY = "ts_demo_wallet_v1";
let snapshot: Wallet | null = null;
let queue: Promise<unknown> = Promise.resolve();
const listeners = new Set<(wallet: Wallet) => void>();
export const getWalletSnapshot = () => snapshot;
export function subscribeWallet(listener: (wallet: Wallet) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function serial<T>(work: () => Promise<T>): Promise<T> {
  const task = queue.then(work);
  queue = task.catch(() => {});
  return task;
}
async function commit(next: Wallet) {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  snapshot = next;
  listeners.forEach((listener) => listener(next));
  return next;
}
export function loadWallet(defaultTransactions: Transaction[]) {
  return serial(async () => {
    if (snapshot) return snapshot;
    const saved = await AsyncStorage.getItem(KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      validateWallet(parsed);
      const migrated = migrateAjoTracking(parsed);
      if (migrated !== parsed) {
        const backupKey = "ts_demo_wallet_v1_before_ajo_tracking";
        if (!(await AsyncStorage.getItem(backupKey)))
          await AsyncStorage.setItem(backupKey, saved);
        return commit(migrated);
      }
      snapshot = parsed as Wallet;
      return snapshot;
    }
    const legacy = await AsyncStorage.getItem("ts_txs");
    return commit(
      createWallet(legacy ? JSON.parse(legacy) : defaultTransactions),
    );
  });
}
function mutate(change: (wallet: Wallet) => Wallet) {
  return serial(async () => {
    if (!snapshot)
      throw new Error("Your balance is still loading. Please try again.");
    const next = change(snapshot);
    return next === snapshot ? snapshot : commit(next);
  });
}
export const runBudgetCommand = (command: BudgetCommand, id: string) =>
  mutate((wallet) => applyBudgetCommand(wallet, command, id));
export const runPlanCommand = (command: PlanCommand, id: string) =>
  mutate((wallet) => applyPlanCommand(wallet, command, id));
export const saveWalletTransaction = (tx: Transaction) =>
  mutate((wallet) => upsertTransaction(wallet, tx));
export const deleteWalletTransaction = (id: string) =>
  mutate((wallet) => removeTransaction(wallet, id));
export const resetWallet = (transactions: Transaction[]) =>
  serial(() => commit(createWallet(transactions)));
export const operationId = () =>
  `budget-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
