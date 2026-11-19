import { authenticated } from '../authenticated';
import { getProfileSnapshot } from '../profile/repository';
import { fetchPlanning, saveBudget, savePlan, joinAjo } from './backend';
import type { BudgetCommand, Transaction, Wallet } from './ledger';
import type { PlanCommand } from './planning';
import { createManualTransaction, manualCategories, manualMethods } from '../transactions/manual';

// Old local/demo records are preserved on disk but never used as backend data.
export const planningStorageKey = (owner: string) => 'ts_planning_wallet_v2_' + encodeURIComponent(owner);
let owner: string | null = null;
let generation = 0;
let snapshot: Wallet | null = null;
let queue: Promise<unknown> = Promise.resolve();
let loading: Promise<Wallet> | null = null;
let loadedAt = 0;
const completed = new Map<string, { wallet: Wallet; createdId: string | null }>();
const uncertain = new Set<string>();
const listeners = new Set<(wallet: Wallet | null) => void>();
export const getWalletSnapshot = () => snapshot;
export function setWalletOwner(next: string | null) {
  if (owner === next) return;
  owner = next; generation++; snapshot = null; loadedAt = 0; loading = null; completed.clear(); uncertain.clear();
  listeners.forEach(listener => listener(null));
}
export function subscribeWallet(listener: (wallet: Wallet | null) => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function context() {
  if (!owner) throw new Error('Sign in to load your plans.');
  return { owner, generation };
}
function check(started: ReturnType<typeof context>) { if (owner !== started.owner || generation !== started.generation) throw new Error('Your account changed. Please try again.'); }
function serial<T>(work: () => Promise<T>): Promise<T> { const task = queue.then(work); queue = task.catch(() => {}); return task; }
async function refresh(started: ReturnType<typeof context>) {
  check(started);
  const next = await authenticated(request => fetchPlanning(request, started.owner, getProfileSnapshot().profile.tallyTag || ''), started.owner);
  check(started); snapshot = next; loadedAt = Date.now(); listeners.forEach(listener => listener(next)); return next;
}
export async function loadWallet(_unused: Transaction[] = [], force = false): Promise<Wallet> {
  const started = context();
  if (loading) return loading;
  if (!force && snapshot && loadedAt > Date.now() - 15000) return snapshot;
  const job = serial(() => refresh(started)); loading = job;
  try { return await job; } finally { if (loading === job) loading = null; }
}
async function mutate(id: string, action: (wallet: Wallet) => Promise<string | null>) {
  const started = context();
  return serial(async () => {
    check(started);
    if (completed.has(id)) return completed.get(id)!;
    if (uncertain.has(id)) throw new Error('This save may already have reached the server. Refresh and check your records before creating another request.');
    if (!snapshot) throw new Error('Your plans are still loading. Please refresh.');
    // These tracker APIs have no idempotency key. Never replay an uncertain create/contribution.
    uncertain.add(id);
    let createdId: string | null;
    try { createdId = await action(snapshot); check(started); }
    catch (error) { loadedAt = 0; throw error; }
    try {
      const wallet = await refresh(started);
      const result = { wallet, createdId }; completed.set(id, result); uncertain.delete(id); return result;
    } catch { throw new Error('Saved on the server, but refresh failed. Refresh your plans to see the result; do not submit it again.'); }
  });
}
export async function runBudgetCommand(command: BudgetCommand, id: string) {
  return (await mutate(id, async wallet => { await authenticated(request => saveBudget(request, wallet, command), wallet.userId); return null; })).wallet;
}
export async function runPlanCommand(command: PlanCommand, id: string) {
  return mutate(id, wallet => authenticated(request => savePlan(request, wallet, command), wallet.userId));
}
export async function joinAjoGroup(groupId: string, id: string) {
  return mutate(id, async wallet => { await authenticated(request => joinAjo(request, groupId), wallet.userId); return groupId; });
}
export async function saveWalletTransaction(tx: Transaction) {
  const started = context();
  if (tx.demo || /^(wallet-|transfer-|deposit-|withdraw-)/.test(tx.id)) throw new Error('Use the wallet payment screen to move money. A manual record does not move funds.');
  const record = await authenticated(request => createManualTransaction({
    amount: Number(tx.amount), categoryId: manualCategories.findIndex(c => c === tx.category) + 1 || 6,
    paymentMethodId: Math.max(1, manualMethods.findIndex(m => m.toLowerCase() === String(tx.method).toLowerCase()) + 1),
    transactionType: tx.type === 'income' ? 'Income' : 'Expense', description: tx.title, date: tx.date, isRecurring: false
  }, request), started.owner);
  check(started); return record;
}
export async function deleteWalletTransaction(_id: string) {
  // The deployed contract exposes GET and PATCH, but no DELETE for transactions.
  throw new Error('Deleting transactions is not available from the service. No record was removed.');
}
export async function resetWallet(_unused: Transaction[] = []) { loadedAt = 0; return loadWallet([], true); }
export const operationId = () => `plan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
