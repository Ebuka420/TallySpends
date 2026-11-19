import React, { useRef, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BudgetFrame, BudgetCard, BudgetCopy, BudgetButton, BudgetAmount, BudgetLoading, AmountPad, ui } from './BudgetUI';
import { AddAction, PlanProgress, PlanTabs, usePlanAction } from './PlanningUI';
import { useAppStore } from '../src/store';
import { minor, money } from '../src/budget/ledger';
import { operationId, runPlanCommand } from '../src/budget/repository';
const trackerCopy = 'Savings goals track contributions you record. They do not lock, hold, or transfer wallet money.';

export function SavingsList({ kind }: { kind: 'personal' | 'joint' }) {
  const router = useRouter(); const { theme, budgetWallet: wallet, budgetError, reloadBudgetWallet } = useAppStore();
  const [filter, setFilter] = useState('active');
  const plans = wallet?.savings || [];
  const create = () => router.push({ pathname: '/savings-lock', params: { mode: kind } });
  return <BudgetFrame title="Savings" theme={theme} backTo="/(tabs)/budget" backLabel="Budget" action={kind === 'personal' ? <AddAction theme={theme} onPress={create} /> : undefined}>
    <PlanTabs theme={theme} values={['My savings', 'Joint savings']} selected={kind === 'personal' ? 'My savings' : 'Joint savings'} onChange={value => router.replace(value === 'My savings' ? '/savingsprogress' : '/joint-savings')} />
    {kind === 'joint' ? <BudgetCard theme={theme}><Text style={[ui.heading, { color: theme.textPrimary }]}>Joint savings · Coming soon</Text><BudgetCopy theme={theme}>Shared goals and invitations are not available yet. You can create a personal savings tracker.</BudgetCopy></BudgetCard> : !wallet || budgetError ? <BudgetLoading theme={theme} error={budgetError} retry={reloadBudgetWallet} /> : <>
      <BudgetCard theme={theme}><BudgetCopy theme={theme}>TOTAL RECORDED SAVINGS</BudgetCopy><BudgetAmount theme={theme} amount={plans.reduce((sum, p) => sum + p.saved, 0)} /><BudgetCopy theme={theme}>{plans.length} {plans.length === 1 ? 'goal' : 'goals'}</BudgetCopy></BudgetCard>
      <BudgetCopy theme={theme}>{trackerCopy}</BudgetCopy>
      <BudgetButton theme={theme} title="Start a savings goal" onPress={create} />
      <PlanTabs theme={theme} values={['active', 'completed']} selected={filter} onChange={setFilter} />
      {!plans.some(p => p.status === filter) && <BudgetCard theme={theme}><BudgetCopy theme={theme}>No {filter} goals yet.</BudgetCopy></BudgetCard>}
      {plans.filter(p => p.status === filter).map(plan => <Pressable key={plan.id} onPress={() => router.push({ pathname: '/savings-details', params: { id: plan.id } })}><BudgetCard theme={theme}><Text style={[ui.heading, { color: theme.textPrimary }]}>{plan.name}</Text><BudgetAmount theme={theme} amount={plan.saved} /><BudgetCopy theme={theme}>of {money(plan.target)}</BudgetCopy><PlanProgress theme={theme} current={plan.saved} target={plan.target} /></BudgetCard></Pressable>)}
      <BudgetButton theme={theme} secondary title="Refresh goals" onPress={reloadBudgetWallet} />
    </>}
  </BudgetFrame>;
}
export function CreateSavingsScreen() {
  const { mode } = useLocalSearchParams<{ mode: string }>(); const router = useRouter();
  const { theme, budgetWallet: wallet, budgetError, reloadBudgetWallet, profileTallyTag } = useAppStore();
  const [name, setName] = useState(''), [target, setTarget] = useState(''); const [pad, setPad] = useState(false);
  const action = usePlanAction(); const operation = useRef(operationId()); let amount = 0; try { amount = minor(target); } catch {}
  return <BudgetFrame title="New savings goal" theme={theme} backTo="/savingsprogress" backLabel="My savings">
    {mode === 'joint' ? <BudgetCopy theme={theme}>Joint savings is coming soon.</BudgetCopy> : !wallet || budgetError ? <BudgetLoading theme={theme} error={budgetError} retry={reloadBudgetWallet} /> : <>
      <Text style={[ui.heading, { color: theme.textPrimary }]}>Give your next goal a name.</Text>
      <TextInput accessibilityLabel="Savings goal name" placeholder="e.g. A new laptop" placeholderTextColor={theme.textSecondary} maxLength={50} value={name} onChangeText={setName} style={[ui.input, { color: theme.textPrimary, borderColor: theme.border }]} />
      <Pressable onPress={() => setPad(true)}><BudgetCard theme={theme}><BudgetCopy theme={theme}>Savings target · Tap to edit</BudgetCopy><BudgetAmount theme={theme} amount={amount} /></BudgetCard></Pressable>
      <BudgetCopy theme={theme}>{trackerCopy} After creating your goal, you can record your first contribution.</BudgetCopy>
      {action.error ? <BudgetCopy theme={theme} error>{action.error}</BudgetCopy> : null}
      <BudgetButton theme={theme} title={action.busy ? 'Creating…' : 'Create goal'} disabled={!name.trim() || !amount || action.busy} onPress={() => action.run(async () => {
        const result = await runPlanCommand({ type: 'create-savings', name, kind: 'personal', target: amount, initial: 0, unlockDate: '', owner: profileTallyTag, tags: [] }, operation.current);
        if (!result.createdId) throw new Error('Refresh your goals to see the saved record.');
        router.replace({ pathname: '/savings-details', params: { id: result.createdId } });
      })} />
      <BudgetButton theme={theme} secondary title="Refresh goals" onPress={reloadBudgetWallet} />
      <AmountPad theme={theme} title="Savings target" visible={pad} value={target} onChange={setTarget} onClose={() => setPad(false)} onDone={() => setPad(false)} />
    </>}
  </BudgetFrame>;
}
export function SavingsDetails({ kind = 'personal' }: { kind?: 'personal' | 'joint' }) {
  const { id } = useLocalSearchParams<{ id: string }>(); const router = useRouter();
  const { theme, budgetWallet: wallet, budgetError, reloadBudgetWallet } = useAppStore();
  const plan = wallet?.savings?.find(p => p.id === id);
  const [amount, setAmount] = useState(''), [pad, setPad] = useState(false);
  const action = usePlanAction(); const operation = useRef(operationId()); let value = 0; try { value = minor(amount); } catch {}
  const remove = () => Alert.alert('Delete savings goal?', 'This removes the tracker. No wallet money is moved.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => action.run(() => runPlanCommand({ type: 'archive-savings', id }, operationId()), () => router.replace('/savingsprogress')) }]);
  return <BudgetFrame title={plan?.name || 'Savings goal'} theme={theme} backTo="/savingsprogress" backLabel="My savings">
    {kind === 'joint' ? <BudgetCopy theme={theme}>Joint savings is coming soon.</BudgetCopy> : !wallet || budgetError ? <BudgetLoading theme={theme} error={budgetError} retry={reloadBudgetWallet} /> : !plan ? <BudgetCopy theme={theme}>This goal could not be found.</BudgetCopy> : <>
      <BudgetCard theme={theme}><BudgetCopy theme={theme}>Recorded savings</BudgetCopy><BudgetAmount theme={theme} amount={plan.saved} /><BudgetCopy theme={theme}>Target {money(plan.target)}</BudgetCopy><PlanProgress theme={theme} current={plan.saved} target={plan.target} /></BudgetCard>
      <BudgetCopy theme={theme}>{trackerCopy}</BudgetCopy>
      <BudgetButton theme={theme} title="Record a contribution" disabled={action.busy} onPress={() => { setAmount(''); operation.current = operationId(); setPad(true); }} />
      {value > 0 && !pad && <BudgetButton theme={theme} title={action.busy ? 'Saving…' : `Record ${money(value)}`} disabled={action.busy} onPress={() => action.run(() => runPlanCommand({ type: 'save', id, amount: value }, operation.current), () => { setAmount(''); operation.current = operationId(); })} />}
      {action.error ? <BudgetCopy theme={theme} error>{action.error}</BudgetCopy> : null}
      <BudgetButton theme={theme} secondary title="Refresh goal" onPress={reloadBudgetWallet} />
      <BudgetButton theme={theme} secondary title="Delete goal" disabled={action.busy} onPress={remove} />
      <AmountPad theme={theme} title="Recorded contribution" visible={pad} value={amount} onChange={setAmount} onClose={() => setPad(false)} onDone={() => setPad(false)} />
    </>}
  </BudgetFrame>;
}
