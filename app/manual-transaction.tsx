import React, { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BudgetButton, BudgetCopy, BudgetFrame } from '../components/BudgetUI';
import { WalletInput } from '../components/WalletScreens';
import { useAppStore } from '../src/store';
import { useApi } from '../src/useApi';
import { confirmManualTransaction, createManualTransaction, manualCategories, manualMethods, ManualSaveError } from '../src/transactions/manual';
import { localDate, validDate } from '../src/budget/ledger';
export default function ManualTransactionScreen() {
  const { theme, refreshTransactions } = useAppStore(); const api = useApi(); const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string; description?: string; category?: string; date?: string; fromReceipt?: string }>();
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [amount, setAmount] = useState(typeof params.amount === 'string' ? params.amount : '');
  const [description, setDescription] = useState(typeof params.description === 'string' ? params.description.slice(0, 200) : '');
  const [date, setDate] = useState(typeof params.date === 'string' ? params.date : localDate(new Date()));
  const [category, setCategory] = useState(manualCategories.findIndex(value => value === params.category) + 1 || 6);
  const [method, setMethod] = useState(0);
  const [busy, setBusy] = useState(false); const lock = useRef(false); const [message, setMessage] = useState<string | null>(null); const [uncertain, setUncertain] = useState(false); const [createdId, setCreatedId] = useState<number | null>(null); const [saved, setSaved] = useState(false);
  const submit = async () => {
    if (lock.current || saved || uncertain && !createdId) return;
    lock.current = true; setBusy(true); setMessage(null);
    try {
      if (!/^\d+(\.\d{1,2})?$/.test(amount)) throw new Error('Enter a naira amount with at most two decimal places.');
      if (!validDate(date)) throw new Error('Enter a valid transaction date in YYYY-MM-DD format.');
      const result = await api.run(request => createdId ? confirmManualTransaction(createdId, request) : createManualTransaction({ amount: Number(amount), transactionType: type, categoryId: category, paymentMethodId: method, description, date, isRecurring: false }, request));
      setCreatedId(Number(result.id)); setSaved(true); setMessage(`${type} saved and confirmed in your transaction history.`);
      await refreshTransactions(true).catch(() => {});
    } catch (error) { setMessage((error as Error).message); if (error instanceof ManualSaveError) { setUncertain(error.uncertain); setCreatedId(error.createdId); } }
    finally { lock.current = false; setBusy(false); }
  };
  const disabled = busy || uncertain || saved;
  const choices = (labels: readonly string[], selected: number, choose: (id: number) => void) => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{labels.map((label, index) => <Pressable key={label} accessibilityRole="radio" accessibilityState={{ checked: selected === index + 1, disabled }} disabled={disabled} onPress={() => choose(index + 1)} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: selected === index + 1 ? theme.accent : theme.border, backgroundColor: selected === index + 1 ? theme.accentSoft : theme.surface }}><Text style={{ color: theme.textPrimary }}>{label}</Text></Pressable>)}</View>;
  return <BudgetFrame title="Record a transaction" theme={theme}>
    <BudgetCopy theme={theme}>Record income or an expense that already happened. This updates your spending tracker; it does not move wallet money.</BudgetCopy>
    {params.fromReceipt === 'true' && <BudgetCopy theme={theme}>Check the scanned details and choose the payment method. Only these transaction details are saved; the receipt image is not uploaded.</BudgetCopy>}
    {choices(['Expense', 'Income'], type === 'Expense' ? 1 : 2, id => setType(id === 1 ? 'Expense' : 'Income'))}
    <WalletInput theme={theme} label="Amount (₦)" value={amount} onChange={setAmount} numeric editable={!disabled} />
    <WalletInput theme={theme} label="Description" value={description} onChange={setDescription} maxLength={200} editable={!disabled} />
    <WalletInput theme={theme} label="Transaction date (YYYY-MM-DD)" value={date} onChange={setDate} maxLength={10} editable={!disabled} />
    <BudgetCopy theme={theme}>Category</BudgetCopy>{choices(manualCategories, category, setCategory)}
    <BudgetCopy theme={theme}>Payment method</BudgetCopy>{choices(manualMethods, method, setMethod)}
    {message && <BudgetCopy theme={theme} error={!saved}>{message}</BudgetCopy>}
    {!saved && <BudgetButton theme={theme} title={busy ? 'Saving…' : createdId ? 'Check saved entry' : 'Save transaction'} disabled={busy || !method || uncertain && !createdId} onPress={() => void submit()} />}
    <BudgetButton theme={theme} title="View transaction history" secondary onPress={() => router.push('/transaction-history')} />
  </BudgetFrame>;
}
