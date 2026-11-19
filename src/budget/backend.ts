import type { ApiRequest } from '../network';
import { localDate, type Wallet, type BudgetCommand, type AjoCircle } from './ledger';
import type { PlanCommand } from './planning';
import { manualCategories } from '../transactions/manual';

const object = (value: unknown): Record<string, any> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The planning service returned an invalid response.');
  return value as Record<string, any>;
};
const list = (value: unknown): any[] => { if (!Array.isArray(value)) throw new Error('The planning service returned an invalid list.'); return value; };
const str = (value: unknown) => { if (typeof value !== 'string') throw new Error('The planning service returned invalid text.'); return value; };
const id = (value: unknown) => { if (!Number.isSafeInteger(value) || Number(value) <= 0) throw new Error('The planning service returned an invalid ID.'); return Number(value); };
const kobo = (value: unknown) => { if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isSafeInteger(Math.round(value * 100))) throw new Error('The planning service returned an invalid amount.'); return Math.round(value * 100); };
const naira = (value: number, zero = false) => { if (!Number.isSafeInteger(value) || value < (zero ? 0 : 1)) throw new Error('Enter a valid amount.'); return value / 100; };
const name = (value: string) => { if (!value.trim() || value.trim().length > 50) throw new Error('Use a name of 1–50 characters.'); return value.trim(); };
const json = (method: string, body?: unknown) => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
export async function planningRequest(request: ApiRequest, path: string, init?: RequestInit, allowMissing = false): Promise<any> {
  const response = await request(path, init);
  if (allowMissing && response.status === 404) return null;
  if (response.status < 200 || response.status >= 300) {
    const message = response.data && typeof response.data === 'object' && 'message' in response.data && typeof response.data.message === 'string' ? response.data.message : `Couldn't load or save this plan (${response.status}).`;
    throw new Error(message);
  }
  return response.data;
}
export function decodePlanning(owner: string, tag: string, budgetValue: unknown, goalsValue: unknown, groups: { group: any; status: any }[], balanceValue: unknown, now = new Date()): Wallet {
  const period = localDate(now).slice(0, 7);
  const budget = budgetValue === null ? null : object(budgetValue);
  if (budget && (!/^\d{4}-\d{2}$/.test(str(budget.period)) || budget.period !== period)) throw new Error('The service returned a budget for a different month. Refresh to try again.');
  const balance = object(balanceValue);
  if (balance.currency !== 'NGN' || !Number.isSafeInteger(balance.balanceKobo) || kobo(balance.balance) !== balance.balanceKobo) throw new Error('The wallet returned an invalid naira balance.');
  const budgetId = budget ? id(budget.budgetId) : null;
  const startDate = period + '-01', endDate = localDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const wallet: Wallet = { version: 1, userId: owner, openingBalance: balance.balanceKobo, transactions: [], activity: [], operations: [], deductions: {}, review: {},
    backend: { budgetId, period, totalAmount: budget ? kobo(budget.totalAmount) : 0, totalSpent: budget ? kobo(budget.totalSpent) : 0, remaining: budget ? kobo(budget.remaining) : 0 },
    budgets: budget ? list(budget.categories).map(raw => {
      const row = object(raw), categoryId = id(row.categoryId), allocatedAmount = kobo(row.limitAmount), spentAmount = kobo(row.spentAmount);
      return { id: `budget-${budgetId}-category-${categoryId}`, userId: owner, name: str(row.categoryName), category: str(row.categoryName), allocatedAmount, spentAmount, remainingAmount: allocatedAmount - spentAmount, period: 'custom', frequency: 'monthly', startDate, endDate, status: 'active', createdAt: '', updatedAt: '' };
    }) : [],
    savings: list(goalsValue).map(raw => { const row = object(raw), saved = kobo(row.savedAmount), target = kobo(row.targetAmount); return {
      id: String(id(row.id)), name: str(row.name), kind: 'personal', ownerTag: tag, target, saved, unlockDate: '', status: saved >= target ? 'completed' : 'active', participants: [], activity: [], createdAt: '', updatedAt: ''
    }; }),
    circles: groups.map(({ group: raw, status: rawStatus }): AjoCircle => {
      const group = object(raw), status = object(rawStatus);
      if (id(group.id) !== id(status.groupId) || !['Weekly', 'Monthly'].includes(status.frequency) || typeof status.isGroupFullyFormed !== 'boolean') throw new Error('The Ajo service returned an invalid group status.');
      const members = list(status.members).map(rawMember => {
        const member = object(rawMember);
        if (!['Awaiting group to fill', 'Pending', 'Paid', 'Missed'].includes(member.contributionStatus) || member.paidAt !== null && (typeof member.paidAt !== 'string' || !Number.isFinite(Date.parse(member.paidAt)))) throw new Error('The Ajo service returned an invalid contribution.');
        return { userId: id(member.userId), fullName: str(member.fullName), tallyTag: str(member.tallyTag), payoutPosition: id(member.payoutPosition), contributionStatus: member.contributionStatus, paidAt: member.paidAt, missedCount: Number(member.missedCount) };
      }).sort((a, b) => a.payoutPosition - b.payoutPosition);
      return { id: String(group.id), trackingMode: 'external', name: str(status.name), ownerTag: tag, contribution: kobo(status.contributionAmount), frequency: status.frequency === 'Weekly' ? 'weekly' : 'monthly', nextDate: '', round: 0, status: 'active',
        participants: members.map(m => ({ tag: m.tallyTag, displayName: m.fullName, userId: String(m.userId), status: 'accepted' })), contributions: [], payouts: [], activity: [], createdAt: str(group.createdAt), updatedAt: '',
        serverStatus: { currentPeriod: str(status.currentPeriod), isGroupFullyFormed: status.isGroupFullyFormed, currentPayoutRecipientUserId: Number(status.currentPayoutRecipientUserId), maxMembers: id(group.maxMembers), memberCount: members.length, members }
      };
    }) };
  return wallet;
}
export async function fetchPlanning(request: ApiRequest, owner: string, tag: string) {
  const [budget, goals, groups, balance] = await Promise.all([
    planningRequest(request, '/api/budgets/current/status', undefined, true), planningRequest(request, '/api/savings-goals'),
    planningRequest(request, '/api/ajo/groups/my'), planningRequest(request, '/api/wallet/balance')
  ]);
  const statuses = await Promise.all(list(groups).map(async raw => { const group = object(raw); return { group, status: await planningRequest(request, `/api/ajo/groups/${id(group.id)}/status`) }; }));
  return decodePlanning(owner, tag, budget, goals, statuses, balance);
}
export async function saveBudget(request: ApiRequest, wallet: Wallet, command: BudgetCommand) {
  let budgetId = wallet.backend?.budgetId;
  if (!wallet.backend) throw new Error('Refresh your budgets first.');
  if (command.type === 'allocate') {
    if (!command.allocations.length) throw new Error('Choose a category.');
    const entries = command.allocations.map(a => {
      const categoryId = manualCategories.findIndex(c => c === a.category || c === 'Other' && a.category === 'Others') + 1;
      if (!categoryId) throw new Error('Choose one of the supported budget categories.');
      return { categoryId, limitAmount: naira(a.amount) };
    });
    if (!budgetId) {
      const result = await planningRequest(request, '/api/budgets', json('POST', { period: wallet.backend.period, totalAmount: naira(command.totalAmount ?? command.allocations.reduce((sum, a) => sum + a.amount, 0)) }));
      budgetId = id(result);
    }
    for (const entry of entries) await planningRequest(request, `/api/budgets/${budgetId}/categories/${entry.categoryId}`, json('PUT', entry));
    return;
  }
  if (command.type === 'add' || command.type === 'release') {
    const budget = wallet.budgets.find(b => b.id === command.budgetId);
    if (!budget || !budgetId) throw new Error('Refresh this budget first.');
    naira(command.amount);
    const categoryId = Number(budget.id.split('-').pop());
    const limitAmount = naira(budget.allocatedAmount + (command.type === 'add' ? command.amount : -command.amount), true);
    await planningRequest(request, `/api/budgets/${budgetId}/categories/${categoryId}`, json('PUT', { categoryId, limitAmount }));
    return;
  }
  throw new Error('This budget action is not supported yet. You can update the category limit.');
}
export async function savePlan(request: ApiRequest, wallet: Wallet, command: PlanCommand): Promise<string | null> {
  if (command.type === 'create-savings') {
    if (command.kind !== 'personal') throw new Error('Joint savings is coming soon.');
    if (command.initial !== 0) throw new Error('Create the goal first, then record a contribution.');
    return String(id(await planningRequest(request, '/api/savings-goals', json('POST', { name: name(command.name), icon: 'flag', targetAmount: naira(command.target) }))));
  }
  if (command.type === 'save') {
    id(Number(command.id));
    await planningRequest(request, `/api/savings-goals/${command.id}/contribute`, json('PUT', { amount: naira(command.amount) })); return null;
  }
  if (command.type === 'archive-savings') {
    id(Number(command.id));
    await planningRequest(request, `/api/savings-goals/${command.id}`, json('DELETE')); return null;
  }
  if (command.type === 'create-ajo') {
    if (!['weekly', 'monthly'].includes(command.frequency)) throw new Error('Choose weekly or monthly.');
    const group = object(await planningRequest(request, '/api/ajo/groups', json('POST', { name: name(command.name), contributionAmount: naira(command.amount), frequency: command.frequency === 'weekly' ? 'Weekly' : 'Monthly', maxMembers: 5 })));
    return String(id(group.id));
  }
  if (command.type === 'record-ajo-contribution') {
    const circle = wallet.circles?.find(c => c.id === command.id);
    if (!circle?.serverStatus?.isGroupFullyFormed) throw new Error('The group needs at least five members before contributions can be recorded.');
    if (command.tag.replace(/^@/, '').toLowerCase() !== circle.ownerTag.replace(/^@/, '').toLowerCase()) throw new Error('You can only mark your own contribution as paid.');
    await planningRequest(request, `/api/ajo/groups/${id(Number(command.id))}/contributions/mark-paid`, json('PUT')); return null;
  }
  throw new Error('This action is not available from the planning service yet.');
}
export async function joinAjo(request: ApiRequest, groupId: string) {
  if (!/^\d+$/.test(groupId)) throw new Error('Enter a numeric group ID.');
  await planningRequest(request, `/api/ajo/groups/${id(Number(groupId))}/join`, json('POST', { acceptedTerms: true }));
}
