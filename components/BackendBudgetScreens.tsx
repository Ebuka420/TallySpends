import React, { useRef, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BudgetFrame, BudgetCard, BudgetCopy, BudgetButton, BudgetAmount, BudgetLoading, AmountPad, ui } from './BudgetUI';
import { AddAction, PlanProgress, PlanTabs, usePlanAction } from './PlanningUI';
import { useAppStore } from '../src/store';
import { minor, money, today } from '../src/budget/ledger';
import { operationId, runBudgetCommand } from '../src/budget/repository';
import { manualCategories } from '../src/transactions/manual';

export function BudgetListScreen() {
  const router = useRouter();
  const { theme, budgetWallet: wallet, budgetError, reloadBudgetWallet } = useAppStore();
  return <BudgetFrame title="My budgets" theme={theme} backTo="/(tabs)/budget" backLabel="Budget" action={<AddAction theme={theme} onPress={() => router.push('/add-budget')} />}>
    {!wallet || budgetError ? <BudgetLoading theme={theme} error={budgetError} retry={reloadBudgetWallet} /> : <>
      <BudgetCard theme={theme}><BudgetCopy theme={theme}>{wallet.backend?.period} · Monthly spending plan</BudgetCopy><BudgetAmount theme={theme} amount={wallet.backend?.totalAmount || 0} /><BudgetCopy theme={theme}>{money(wallet.backend?.totalSpent || 0)} spent · {money(wallet.backend?.remaining || 0)} remaining</BudgetCopy></BudgetCard>
      <BudgetCopy theme={theme}>Category limits track your expenses. They do not hold or move wallet money.</BudgetCopy>
      {!wallet.budgets.length && <BudgetCard theme={theme}><Text style={[ui.heading, { color: theme.textPrimary }]}>Create your first category limit</Text><BudgetCopy theme={theme}>Choose a monthly total and add the categories you want to track.</BudgetCopy></BudgetCard>}
      {wallet.budgets.map(b => <Pressable key={b.id} onPress={() => router.push({ pathname: '/budget-details', params: { id: b.id } })}><BudgetCard theme={theme}><Text style={[ui.heading, { color: theme.textPrimary }]}>{b.name}</Text><BudgetAmount theme={theme} amount={b.remainingAmount} /><BudgetCopy theme={theme}>{money(b.spentAmount)} spent of {money(b.allocatedAmount)}</BudgetCopy><PlanProgress theme={theme} current={b.spentAmount} target={b.allocatedAmount} /></BudgetCard></Pressable>)}
      <BudgetButton theme={theme} title="Set a category limit" onPress={() => router.push('/add-budget')} />
      <BudgetButton theme={theme} secondary title="Refresh budgets" onPress={reloadBudgetWallet} />
    </>}
  </BudgetFrame>;
}
export function CreateBudgetScreen() {
  const router = useRouter();
  const { theme, budgetWallet: wallet, budgetError, reloadBudgetWallet } = useAppStore();
  const [category, setCategory] = useState<string>(manualCategories[0]);
  const [amount, setAmount] = useState(''); const [total, setTotal] = useState('');
  const [pad, setPad] = useState<'limit' | 'total' | null>(null); const [review, setReview] = useState(false);
  const action = usePlanAction(); const operation = useRef(operationId());
  let limit = 0, totalAmount = 0; try { limit = minor(amount); } catch {} try { totalAmount = minor(total); } catch {}
  const newMonth = !wallet?.backend?.budgetId;
  const valid = limit > 0 && (!newMonth || totalAmount >= limit);
  const save = () => action.run(async () => {
    const next = await runBudgetCommand({ type: 'allocate', totalAmount: newMonth ? totalAmount : undefined, allocations: [{ name: category, category, amount: limit, startDate: today(), frequency: 'monthly' }] }, operation.current);
    const created = next.budgets.find(b => b.category === category);
    if (!created) throw new Error('Saved, but this category was not returned. Refresh your budgets before trying again.');
    router.replace({ pathname: '/budget-details', params: { id: created.id } });
  });
  return <BudgetFrame title={review ? 'Review your budget' : 'Create Budget'} theme={theme} backTo="/budgetspending" backLabel="My budgets">
    {!wallet || budgetError ? <BudgetLoading theme={theme} error={budgetError} retry={reloadBudgetWallet} /> : <>
      <BudgetCopy theme={theme}>{wallet.backend?.period} · One budget per month</BudgetCopy>
      {!review && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{manualCategories.map(c => <Pressable key={c} onPress={() => { setCategory(c); operation.current = operationId(); }} style={{ width: '48%', padding: 20, borderRadius: 18, borderWidth: 1, borderColor: category === c ? theme.accent : theme.border, backgroundColor: category === c ? theme.accentSoft : theme.surface }}><Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{c}</Text></Pressable>)}</View>}
      {newMonth && <Pressable disabled={review} onPress={() => setPad('total')}><BudgetCard theme={theme}><BudgetCopy theme={theme}>Overall monthly budget</BudgetCopy><BudgetAmount theme={theme} amount={totalAmount} /></BudgetCard></Pressable>}
      <Pressable disabled={review} onPress={() => setPad('limit')}><BudgetCard theme={theme}><BudgetCopy theme={theme}>{category} · Category limit</BudgetCopy><BudgetAmount theme={theme} amount={limit} /><BudgetCopy theme={theme}>{review ? 'Existing limits for this category will be updated.' : 'Tap to enter an amount'}</BudgetCopy></BudgetCard></Pressable>
      <BudgetCopy theme={theme}>This is a spending limit, not a transfer. Your wallet balance stays the same. The overall monthly total cannot be changed after creation yet.</BudgetCopy>
      {action.error ? <BudgetCopy theme={theme} error>{action.error}</BudgetCopy> : null}
      <BudgetButton theme={theme} disabled={!valid || action.busy} title={action.busy ? 'Saving…' : review ? 'Save budget' : 'Review budget'} onPress={() => review ? save() : setReview(true)} />
      {review && <BudgetButton theme={theme} secondary title="Edit" disabled={action.busy} onPress={() => { operation.current = operationId(); setReview(false); }} />}
      <AmountPad theme={theme} title={pad === 'total' ? 'Monthly total' : 'Category limit'} visible={pad !== null} value={pad === 'total' ? total : amount} onChange={pad === 'total' ? setTotal : setAmount} onClose={() => setPad(null)} onDone={() => { operation.current = operationId(); setPad(null); }} />
    </>}
  </BudgetFrame>;
}
export function BudgetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, budgetWallet: wallet, budgetError, reloadBudgetWallet } = useAppStore();
  const budget = wallet?.budgets.find(b => b.id === id);
  const action = usePlanAction(); const [amount, setAmount] = useState(''); const [pad, setPad] = useState(false);
  const operation = useRef(operationId()); let limit = 0; try { limit = minor(amount); } catch {}
  return <BudgetFrame theme={theme} title={budget?.name || 'Budget details'} backTo="/budgetspending" backLabel="My budgets">
    {!wallet || budgetError ? <BudgetLoading theme={theme} error={budgetError} retry={reloadBudgetWallet} /> : !budget ? <BudgetCopy theme={theme}>This month's category budget could not be found.</BudgetCopy> : <>
      <BudgetCard theme={theme}><BudgetCopy theme={theme}>Remaining this month</BudgetCopy><BudgetAmount theme={theme} amount={budget.remainingAmount} /><BudgetCopy theme={theme}>{money(budget.spentAmount)} spent of {money(budget.allocatedAmount)} · {wallet.backend?.period}</BudgetCopy><PlanProgress theme={theme} current={budget.spentAmount} target={budget.allocatedAmount} /></BudgetCard>
      <BudgetCopy theme={theme}>Spending comes from your tracked expenses in this category. Budget limits do not reserve money, and payments are made from your wallet.</BudgetCopy>
      <BudgetButton theme={theme} title="Update category limit" onPress={() => { setAmount(String(budget.allocatedAmount / 100)); setPad(true); }} />
      {action.error ? <BudgetCopy theme={theme} error>{action.error}</BudgetCopy> : null}
      {amount && !pad ? <BudgetButton theme={theme} disabled={!limit || action.busy} title={action.busy ? 'Saving…' : `Save limit ${money(limit)}`} onPress={() => action.run(() => runBudgetCommand({ type: 'allocate', allocations: [{ name: budget.name, category: budget.category, amount: limit, startDate: budget.startDate, frequency: 'monthly' }] }, operation.current), () => setAmount(''))} /> : null}
      <BudgetButton theme={theme} secondary title="Refresh" onPress={reloadBudgetWallet} />
      <AmountPad theme={theme} title="Category limit" visible={pad} value={amount} onChange={setAmount} onClose={() => setPad(false)} onDone={() => { operation.current = operationId(); setPad(false); }} />
    </>}
  </BudgetFrame>;
}
