import React, { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BudgetFrame, BudgetCard, BudgetCopy, BudgetButton, BudgetAmount, BudgetLoading, AmountPad, ui } from './BudgetUI';
import { AddAction, PlanTabs, usePlanAction } from './PlanningUI';
import { useAppStore } from '../src/store';
import { minor, money, today } from '../src/budget/ledger';
import { operationId, runPlanCommand, joinAjoGroup } from '../src/budget/repository';
const trackerCopy = 'Ajo records membership and payments made outside TallySpend. No wallet money moves when you create, join, or mark a contribution paid.';

export function AjoList() {
  const router = useRouter(); const { theme, budgetWallet: wallet, budgetError, reloadBudgetWallet } = useAppStore();
  const [groupId, setGroupId] = useState(''), [accepted, setAccepted] = useState(false);
  const action = usePlanAction(); const operation = useRef(operationId());
  return <BudgetFrame title="Ajo Circles" theme={theme} backTo="/(tabs)/budget" backLabel="Budget" action={<AddAction theme={theme} onPress={() => router.push('/ajo-create')} />}>
    <BudgetCopy theme={theme}>{trackerCopy}</BudgetCopy>
    {!wallet || budgetError ? <BudgetLoading theme={theme} error={budgetError} retry={reloadBudgetWallet} /> : <>
      {!wallet.circles?.length && <BudgetCard theme={theme}><Text style={[ui.heading, { color: theme.textPrimary }]}>Your first circle starts here</Text><BudgetCopy theme={theme}>Create a group or join with a group ID. A group needs at least five members before contributions begin.</BudgetCopy></BudgetCard>}
      {wallet.circles?.map(circle => <Pressable key={circle.id} onPress={() => router.push({ pathname: '/ajo-details', params: { id: circle.id } })}><BudgetCard theme={theme}><Text style={[ui.heading, { color: theme.textPrimary }]}>{circle.name}</Text><BudgetAmount theme={theme} amount={circle.contribution} /><BudgetCopy theme={theme}>per member · {circle.frequency} · {circle.serverStatus?.memberCount}/{circle.serverStatus?.maxMembers} members</BudgetCopy><BudgetCopy theme={theme}>{circle.serverStatus?.isGroupFullyFormed ? circle.serverStatus.currentPeriod : 'Awaiting group to fill'}</BudgetCopy></BudgetCard></Pressable>)}
      <BudgetButton theme={theme} title="Create circle" onPress={() => router.push('/ajo-create')} />
      <BudgetCard theme={theme}><Text style={[ui.heading, { color: theme.textPrimary }]}>Join a circle</Text><TextInput accessibilityLabel="Ajo group ID" placeholder="Group ID from the organiser" placeholderTextColor={theme.textSecondary} keyboardType="number-pad" value={groupId} onChangeText={text => { setGroupId(text); setAccepted(false); operation.current = operationId(); }} style={[ui.input, { color: theme.textPrimary, borderColor: theme.border }]} />
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: accepted }} onPress={() => setAccepted(!accepted)} style={{ paddingVertical: 14 }}><Text style={{ color: theme.textPrimary }}>{accepted ? '☑' : '☐'} I agree to participate in this group's contribution and payout arrangement.</Text></Pressable>
        <BudgetCopy theme={theme}>Confirm the contribution amount and schedule with the organiser before joining.</BudgetCopy>
        <BudgetButton theme={theme} title={action.busy ? 'Joining…' : 'Join group'} disabled={!/^\d+$/.test(groupId) || !accepted || action.busy} onPress={() => action.run(() => joinAjoGroup(groupId, operation.current), () => router.push({ pathname: '/ajo-details', params: { id: groupId } }))} />
      </BudgetCard>
      {action.error ? <BudgetCopy theme={theme} error>{action.error}</BudgetCopy> : null}
      <BudgetButton theme={theme} secondary title="Refresh circles" onPress={reloadBudgetWallet} />
    </>}
  </BudgetFrame>;
}
export function AjoCreate() {
  const router = useRouter(); const { theme, budgetWallet: wallet, budgetError, reloadBudgetWallet, profileTallyTag } = useAppStore();
  const [name, setName] = useState(''), [amount, setAmount] = useState(''), [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly'), [pad, setPad] = useState(false);
  const action = usePlanAction(); const operation = useRef(operationId()); let value = 0; try { value = minor(amount); } catch {}
  return <BudgetFrame title="Create Ajo circle" theme={theme} backTo="/ajo" backLabel="Ajo Circles">
    {!wallet || budgetError ? <BudgetLoading theme={theme} error={budgetError} retry={reloadBudgetWallet} /> : <>
      <Text style={[ui.heading, { color: theme.textPrimary }]}>Save with your people.</Text>
      <TextInput accessibilityLabel="Circle name" placeholder="e.g. Office Ajo" placeholderTextColor={theme.textSecondary} value={name} maxLength={50} onChangeText={setName} style={[ui.input, { color: theme.textPrimary, borderColor: theme.border }]} />
      <Pressable onPress={() => setPad(true)}><BudgetCard theme={theme}><BudgetCopy theme={theme}>Contribution per member · Tap to edit</BudgetCopy><BudgetAmount theme={theme} amount={value} /></BudgetCard></Pressable>
      <PlanTabs theme={theme} values={['weekly', 'monthly']} selected={frequency} onChange={next => setFrequency(next as 'weekly' | 'monthly')} />
      <BudgetCopy theme={theme}>Five members per circle. Share the group ID after creation so others can join. The backend assigns payout positions and starts the cycle when the group is full.</BudgetCopy>
      <BudgetCopy theme={theme}>{trackerCopy}</BudgetCopy>
      {action.error ? <BudgetCopy theme={theme} error>{action.error}</BudgetCopy> : null}
      <BudgetButton theme={theme} title={action.busy ? 'Creating…' : 'Create circle'} disabled={!name.trim() || !value || action.busy} onPress={() => action.run(async () => {
        const result = await runPlanCommand({ type: 'create-ajo', name, amount: value, frequency, firstDate: '', owner: profileTallyTag, tags: [] }, operation.current);
        if (!result.createdId) throw new Error('Refresh your circles to see the saved group.');
        router.replace({ pathname: '/ajo-details', params: { id: result.createdId } });
      })} />
      <BudgetButton theme={theme} secondary title="Refresh circles" onPress={reloadBudgetWallet} />
      <AmountPad theme={theme} title="Contribution amount" visible={pad} value={amount} onChange={setAmount} onClose={() => setPad(false)} onDone={() => setPad(false)} />
    </>}
  </BudgetFrame>;
}
export function AjoDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, budgetWallet: wallet, budgetError, reloadBudgetWallet, profileTallyTag } = useAppStore();
  const circle = wallet?.circles?.find(c => c.id === id), status = circle?.serverStatus;
  const self = status?.members.find(m => m.tallyTag.replace(/^@/, '').toLowerCase() === profileTallyTag.replace(/^@/, '').toLowerCase());
  const recipient = status?.members.find(m => m.userId === status.currentPayoutRecipientUserId);
  const action = usePlanAction(); const operation = useRef(operationId());
  return <BudgetFrame title={circle?.name || 'Ajo circle'} theme={theme} backTo="/ajo" backLabel="Ajo Circles">
    {!wallet || budgetError ? <BudgetLoading theme={theme} error={budgetError} retry={reloadBudgetWallet} /> : !circle || !status ? <BudgetCopy theme={theme}>This circle could not be found.</BudgetCopy> : <>
      <BudgetCard theme={theme}><BudgetCopy theme={theme}>Group ID: {circle.id}</BudgetCopy><BudgetAmount theme={theme} amount={circle.contribution} /><BudgetCopy theme={theme}>per member · {circle.frequency} · {status.memberCount}/{status.maxMembers} members</BudgetCopy><BudgetCopy theme={theme}>{status.isGroupFullyFormed ? `Current period: ${status.currentPeriod}` : 'Awaiting group to fill'}</BudgetCopy><BudgetCopy theme={theme}>{recipient ? `Current recipient: ${recipient.fullName}` : 'No payout recipient assigned yet.'}</BudgetCopy></BudgetCard>
      <BudgetCopy theme={theme}>{trackerCopy}</BudgetCopy>
      <Text style={[ui.heading, { color: theme.textPrimary }]}>Members & contribution status</Text>
      {status.members.map(member => <BudgetCard key={member.userId} theme={theme}><Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{member.payoutPosition}. {member.fullName}</Text><BudgetCopy theme={theme}>@{member.tallyTag.replace(/^@/, '')} · {member.contributionStatus}</BudgetCopy>{member.paidAt && <BudgetCopy theme={theme}>Paid {new Date(member.paidAt).toLocaleDateString()}</BudgetCopy>}</BudgetCard>)}
      <BudgetButton theme={theme} title={action.busy ? 'Saving…' : self?.contributionStatus === 'Paid' ? 'Your contribution is recorded' : 'Mark my contribution paid'} disabled={!status.isGroupFullyFormed || !self || self.contributionStatus === 'Paid' || action.busy} onPress={() => action.run(() => runPlanCommand({ type: 'record-ajo-contribution', id, tag: profileTallyTag, paidOn: today() }, operation.current))} />
      {action.error ? <BudgetCopy theme={theme} error>{action.error}</BudgetCopy> : null}
      <BudgetButton theme={theme} secondary title="Refresh status" onPress={reloadBudgetWallet} />
    </>}
  </BudgetFrame>;
}
