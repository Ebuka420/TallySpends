import React, { useEffect, useMemo, useState } from "react";
import { Text, TextInput, View, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { BudgetButton, BudgetCard, BudgetCopy, BudgetFrame } from "./BudgetUI";
import { useAppStore } from "../src/store";
import { useWallet } from "../src/wallet/hooks";
import { useWalletPayment } from "../src/wallet/usePayment";
import { amountKobo, walletApi, type BankItem } from "../src/wallet/api";
import { paymentUnresolved } from "../src/wallet/payments";
import type { ThemePalette } from "../src/theme";

export const walletMoney = (naira: number) =>
  "₦" + naira.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function WalletInput({
  label,
  value,
  onChange,
  theme,
  numeric,
  maxLength,
  editable = true,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  theme: ThemePalette;
  numeric?: boolean;
  maxLength?: number;
  editable?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: theme.textSecondary }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        editable={editable}
        maxLength={maxLength}
        keyboardType={numeric ? "decimal-pad" : "default"}
        autoCapitalize="none"
        style={{
          color: theme.textPrimary,
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 14,
          padding: 16,
        }}
      />
    </View>
  );
}

export function PaymentStatus({
  flow,
  theme,
}: {
  flow: ReturnType<typeof useWalletPayment>;
  theme: ThemePalette;
}) {
  const p = flow.payment;
  return (
    <>
      {flow.error && <BudgetCopy theme={theme} error>{flow.error}</BudgetCopy>}
      {p && (
        <BudgetCard theme={theme}>
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: theme.textPrimary, fontSize: 20, fontWeight: "700" }}
          >
            {p.state === "unknown"
              ? "Payment not yet confirmed"
              : p.state === "ready"
                ? "Payment ready to retry"
                : p.state === "Rejected"
                  ? "Payment not sent"
                  : p.state === "Failed"
                    ? "Transfer failed — funds returned"
                    : p.state === "Pending"
                      ? "Transfer pending"
                      : "Payment completed"}
          </Text>
          <BudgetCopy theme={theme}>
            {walletMoney(p.draft.amountKobo / 100)} ·{" "}
            {p.receipt?.recipientName ||
              (p.draft.kind === "user" ? p.draft.paymentId : p.draft.accountNumber)}
          </BudgetCopy>
          <Text selectable style={{ color: theme.textSecondary }}>
            Reference: {p.receipt?.reference || p.key}
          </Text>
          {p.error && <BudgetCopy theme={theme} error>{p.error}</BudgetCopy>}
          {p.receipt?.status === "InsufficientFunds" && (
            <BudgetCopy theme={theme} error>Insufficient wallet balance.</BudgetCopy>
          )}
          {p.receipt?.status === "RecipientNotVerified" && (
            <BudgetCopy theme={theme} error>
              The bank could not verify this recipient. Check the account details.
            </BudgetCopy>
          )}
          {paymentUnresolved(p) && (
            <>
              <BudgetCopy theme={theme}>
                Keep this payment reference until the result is confirmed. Retrying uses the same payment details.
              </BudgetCopy>
              {p.draft.kind === "bank" && p.state !== "ready" && (
                <BudgetButton
                  theme={theme}
                  title={flow.busy ? "Checking…" : "Check status"}
                  disabled={flow.busy}
                  onPress={() => void flow.check()}
                />
              )}
              {p.state !== "Pending" && (
                <BudgetButton
                  theme={theme}
                  title={flow.busy ? "Please wait…" : "Retry saved payment"}
                  disabled={flow.busy}
                  onPress={() => void flow.retry()}
                />
              )}
            </>
          )}
        </BudgetCard>
      )}
    </>
  );
}

export function WalletScreen({ mode = "overview" }: { mode?: "overview" | "deposit" | "history" }) {
  const { theme } = useAppStore();
  const router = useRouter();
  const wallet = useWallet();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      await wallet.api.run((request) => walletApi.account(request, true));
      await wallet.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the account.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <BudgetFrame
      title={
        mode === "history"
          ? "Wallet history"
          : mode === "deposit"
            ? "Fund your wallet"
            : "Your wallet"
      }
      theme={theme}
    >
      <BudgetCopy theme={theme}>Sandbox · Test money only</BudgetCopy>
      <BudgetCard theme={theme}>
        <BudgetCopy theme={theme}>Available wallet balance</BudgetCopy>
        <Text style={{ color: theme.textPrimary, fontSize: 32, fontWeight: "700" }}>
          {wallet.balance ? walletMoney(wallet.balance.balanceKobo / 100) : "—"}
        </Text>
        {wallet.error && <BudgetCopy theme={theme} error>{wallet.error}</BudgetCopy>}
        <BudgetButton
          title={wallet.loading ? "Refreshing…" : "Refresh wallet"}
          disabled={wallet.loading}
          theme={theme}
          onPress={() => void wallet.reload().catch(() => {})}
        />
      </BudgetCard>
      {mode === "overview" && (
        <>
          <BudgetButton title="Fund wallet" theme={theme} onPress={() => router.push("/deposit")} />
          <BudgetButton title="Pay a TallySpend user" theme={theme} onPress={() => router.push("/transfer")} />
          <BudgetButton title="Send to a bank account" theme={theme} onPress={() => router.push("/withdraw")} />
          <BudgetButton title="View wallet history" theme={theme} onPress={() => router.push("/wallet-history")} />
        </>
      )}
      {mode === "deposit" && (
        <BudgetCard theme={theme}>
          {wallet.account ? (
            <>
              <Text selectable style={{ color: theme.textPrimary, fontSize: 28, fontWeight: "700" }}>
                {wallet.account.accountNumber}
              </Text>
              <BudgetCopy theme={theme}>
                {wallet.account.accountName}
                {"\n"}
                {wallet.account.bankName}
                {"\n"}
                {wallet.account.status}
              </BudgetCopy>
              <BudgetButton
                title="Copy account number"
                theme={theme}
                onPress={() => {
                  void Clipboard.setStringAsync(wallet.account!.accountNumber)
                    .then(() => Alert.alert("Copied", "Account number copied."))
                    .catch(() => Alert.alert("Couldn't copy", "Select the account number to copy it."));
                }}
              />
              <BudgetCopy theme={theme}>
                Use sandbox test funding only. Deposits normally appear within a minute; refresh to see your updated balance.
              </BudgetCopy>
            </>
          ) : (
            <>
              <BudgetCopy theme={theme}>Create your sandbox account number to receive test deposits.</BudgetCopy>
              <BudgetButton
                title={creating ? "Creating…" : "Create account number"}
                theme={theme}
                disabled={creating || wallet.loading || !!wallet.error}
                onPress={() => void create()}
              />
            </>
          )}
          {error && <BudgetCopy theme={theme} error>{error}</BudgetCopy>}
        </BudgetCard>
      )}
      {mode === "history" && (
        <>
          {!wallet.loading && !wallet.error && !wallet.ledger.length && (
            <BudgetCopy theme={theme}>No wallet activity yet.</BudgetCopy>
          )}
          {wallet.ledger.map((entry) => (
            <BudgetCard key={entry.id} theme={theme}>
              <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "700" }}>
                {entry.amount > 0 ? "+" : ""}
                {walletMoney(entry.amount)}
              </Text>
              <BudgetCopy theme={theme}>
                {entry.description || entry.source}
                {"\n"}
                {entry.entryType} · {entry.status}
                {"\n"}
                {new Date(entry.createdAt).toLocaleString()}
              </BudgetCopy>
              {entry.status === "Reversed" && (
                <BudgetCopy theme={theme}>Reversed — funds returned.</BudgetCopy>
              )}
            </BudgetCard>
          ))}
          <BudgetCopy theme={theme}>Showing the latest 50 wallet entries.</BudgetCopy>
        </>
      )}
    </BudgetFrame>
  );
}

export function BankTransferScreen() {
  const { theme } = useAppStore();
  const wallet = useWallet();
  const flow = useWalletPayment(wallet.reload);

  const [banks, setBanks] = useState<BankItem[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankItem | null>(null);

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [review, setReview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resolving, setResolving] = useState(false);
  const [resolvedName, setResolvedName] = useState<string | null>(null);

  const blocked = flow.busy || !flow.ready || (!!flow.payment && paymentUnresolved(flow.payment));

  // Load backend banks
  useEffect(() => {
    let active = true;
    setBanksLoading(true);
    wallet.api
      .run((request) => walletApi.banks(request))
      .then((items) => {
        if (active) setBanks(items);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setBanksLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return banks.slice(0, 20);
    const q = bankSearch.toLowerCase();
    return banks.filter((b) => b.name.toLowerCase().includes(q) || b.code.includes(q)).slice(0, 30);
  }, [banks, bankSearch]);

  const selectBank = (b: BankItem) => {
    setSelectedBank(b);
    setBankCode(b.code);
    setShowBankPicker(false);
    setResolvedName(null);
  };

  const handleResolve = async () => {
    const code = selectedBank?.code || bankCode;
    if (!/^\d+$/.test(code) || !/^\d{10}$/.test(accountNumber)) {
      setError("Select a bank and enter a 10-digit account number.");
      return;
    }
    setResolving(true);
    setError(null);
    try {
      const res = await wallet.api.run((request) => walletApi.resolveAccount(code, accountNumber, request));
      setResolvedName(res.accountName);
    } catch (e) {
      setResolvedName(null);
      setError(e instanceof Error ? e.message : "Could not verify recipient account name.");
    } finally {
      setResolving(false);
    }
  };

  const check = () => {
    try {
      const code = selectedBank?.code || bankCode;
      const value = amountKobo(amount);
      if (!/^\d+$/.test(code) || !/^\d{10}$/.test(accountNumber))
        throw new Error("Select a bank and enter a 10-digit account number.");
      if (!wallet.balance) throw new Error("Refresh your wallet balance first.");
      if (value > wallet.balance.balanceKobo) throw new Error("Insufficient wallet balance.");
      setError(null);
      setReview(true);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <BudgetFrame title="Send to a bank account" theme={theme}>
      <BudgetCopy theme={theme}>Available: {wallet.balance ? walletMoney(wallet.balance.balanceKobo / 100) : "—"}</BudgetCopy>
      {wallet.error && <BudgetCopy theme={theme} error>{wallet.error}</BudgetCopy>}
      <PaymentStatus flow={flow} theme={theme} />

      {/* Bank Picker */}
      <View style={{ gap: 6 }}>
        <Text style={{ color: theme.textSecondary }}>Bank</Text>
        <TouchableOpacity
          disabled={review || blocked}
          onPress={() => setShowBankPicker(!showBankPicker)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 14,
            padding: 16,
          }}
        >
          <Text style={{ color: selectedBank ? theme.textPrimary : theme.textSecondary }}>
            {selectedBank ? selectedBank.name : "Select recipient bank"}
          </Text>
          <Ionicons name={showBankPicker ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {showBankPicker && (
        <View
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 14,
            padding: 12,
            maxHeight: 240,
            gap: 8,
          }}
        >
          <TextInput
            placeholder="Search bank name or code"
            placeholderTextColor={theme.textSecondary}
            value={bankSearch}
            onChangeText={setBankSearch}
            style={{
              backgroundColor: theme.surfaceSoft,
              color: theme.textPrimary,
              borderRadius: 10,
              padding: 10,
              fontSize: 13,
            }}
          />
          {banksLoading ? (
            <ActivityIndicator color={theme.accent} />
          ) : (
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator style={{ maxHeight: 180 }}>
              {filteredBanks.map((b) => (
                <TouchableOpacity
                  key={b.code + b.name}
                  onPress={() => selectBank(b)}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  }}
                >
                  <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: "600" }}>{b.name}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Code: {b.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Account number */}
      <WalletInput
        label="Account number"
        value={accountNumber}
        onChange={(val) => {
          setAccountNumber(val);
          setResolvedName(null);
        }}
        theme={theme}
        numeric
        maxLength={10}
        editable={!review && !blocked}
      />

      {/* Account Verification Indicator */}
      {accountNumber.length === 10 && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: -6 }}>
          {resolvedName ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={{ color: theme.success, fontWeight: "700", fontSize: 13 }}>{resolvedName}</Text>
            </View>
          ) : (
            <TouchableOpacity
              disabled={resolving || review || blocked}
              onPress={handleResolve}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              {resolving && <ActivityIndicator size="small" color={theme.accent} />}
              <Text style={{ color: theme.accent, fontWeight: "600", fontSize: 12 }}>
                {resolving ? "Verifying account…" : "Verify account name"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <WalletInput
        label="Amount (₦)"
        value={amount}
        onChange={setAmount}
        theme={theme}
        numeric
        editable={!review && !blocked}
      />
      <WalletInput
        label="Narration"
        value={narration}
        onChange={setNarration}
        theme={theme}
        editable={!review && !blocked}
      />

      {error && <BudgetCopy theme={theme} error>{error}</BudgetCopy>}

      {review ? (
        <>
          <BudgetCopy theme={theme}>
            Confirm {walletMoney(amountKobo(amount) / 100)} to {resolvedName || `account ${accountNumber}`},{" "}
            {selectedBank?.name || `bank code ${bankCode}`}.
          </BudgetCopy>
          <BudgetButton
            theme={theme}
            title={flow.busy ? "Sending…" : "Confirm transfer"}
            disabled={blocked}
            onPress={() => {
              const code = selectedBank?.code || bankCode;
              void flow
                .send({
                  kind: "bank",
                  bankCode: code,
                  accountNumber,
                  amountKobo: amountKobo(amount),
                  narration,
                })
                .then(() => {
                  setReview(false);
                  setAmount("");
                  setResolvedName(null);
                });
            }}
          />
          <BudgetButton
            theme={theme}
            secondary
            title="Edit details"
            disabled={flow.busy}
            onPress={() => setReview(false)}
          />
        </>
      ) : (
        <BudgetButton theme={theme} title="Review transfer" disabled={blocked} onPress={check} />
      )}
    </BudgetFrame>
  );
}
