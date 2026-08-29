import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    LayoutAnimation,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";
import TransactionReceiptModal from "../components/TransactionReceiptModal";
import { useAppStore } from "../src/store";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const depositOptions = [
  {
    id: "bank-transfer",
    icon: "business-outline",
    title: "Bank Transfer",
    subtitle: "Transfer from your bank account",
  },
  {
    id: "debit-card",
    icon: "card-outline",
    title: "Debit/Credit Card",
    subtitle: "Use your card to deposit instantly",
  },
  {
    id: "auto-save",
    icon: "repeat-outline",
    title: "Auto Save (Recurring)",
    subtitle: "Schedule automatic deposits",
  },
];

export default function DepositScreen() {
  const router = useRouter();
  const { addTransaction, transactions, savedCards = [], theme } = useAppStore();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const [amount, setAmount] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [generatedBank, setGeneratedBank] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState<any | null>(
    null,
  );
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const selectDepositOption = (optionId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedOption(optionId);
  };

  const transactionsRaw = transactions || [];
  const totalIncome = transactionsRaw
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  const totalExpenses = transactionsRaw
    .filter((t: any) => t.type === "expense")
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  const currentBalance = 2926.78 + totalIncome - totalExpenses;

  const recentDeposits = transactionsRaw
    .filter((tx: any) => tx.type === "income")
    .sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    .slice(0, 3);

  const handleDeposit = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid deposit amount.");
      return;
    }

    const option = depositOptions.find((item) => item.id === selectedOption);

    const newTx = {
      id: `tx-${Date.now()}`,
      title: `Deposit via ${option?.title ?? "Bank Transfer"}`,
      amount: value,
      category: "Income",
      type: "income",
      date: new Date().toISOString().slice(0, 10),
    };

    addTransaction(newTx);
    setReceiptTransaction(newTx);
    setShowReceiptModal(true);
    setAmount("");
  };

  const copyBankDetail = async (value: string) => {
    try {
      await Clipboard.setStringAsync(String(value));
      Alert.alert("Copied", "Bank detail copied to clipboard.");
    } catch (e) {
      Alert.alert("Error", "Could not copy to clipboard.");
    }
  };

  const generateBankDetails = () => {
    const ref = `TS${Math.floor(Math.random() * 900000) + 100000}`;
    const details = {
      bankName: "Tally Bank",
      accountNumber: String(
        Math.floor(1000000000 + Math.random() * 8999999999),
      ),
      accountName: "TALLYSPENDS",
      reference: ref,
    };
    setGeneratedBank(details);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <TouchableOpacity
            onPress={() => setIsBalanceVisible(!isBalanceVisible)}
            activeOpacity={0.8}
          >
            <Text style={styles.balanceAmount}>
              {isBalanceVisible
                ? `₦${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "₦•••••••"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.cardTitle}>How would you like to deposit?</Text>
          {depositOptions.map((option) => {
            const selected = selectedOption === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selected && styles.optionCardSelected,
                ]}
                onPress={() => selectDepositOption(option.id)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.optionIconBox,
                    selected && styles.optionIconBoxSelected,
                  ]}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={selected ? theme.accent : theme.textSecondary}
                  />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
              </TouchableOpacity>
            );
          })}
          {!selectedOption && (
            <Text style={styles.helperText}>
              Select a deposit option to continue.
            </Text>
          )}
        </View>

        {selectedOption === "bank-transfer" && (
          <View style={styles.actionBlock}>
            <View style={styles.amountSection}>
              <Text style={styles.sectionTitle}>Enter Amount to Deposit</Text>
              <View style={styles.amountInputRowAlt}>
                <Text style={styles.currencySymbol}>₦</Text>
                <TextInput
                  style={styles.amountInputField}
                  placeholder="Enter amount"
                  placeholderTextColor="#B0B0B0"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 12 }]}
              onPress={generateBankDetails}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>
                Generate Bank Details
              </Text>
            </TouchableOpacity>

            {generatedBank && (
              <View style={styles.bankDetailsCard}>
                <Text style={styles.bankLineLabel}>Bank</Text>
                <Text style={styles.bankLineValue}>
                  {generatedBank.bankName}
                </Text>
                <Text style={styles.bankLineLabel}>Account Number</Text>
                <TouchableOpacity
                  onPress={() => copyBankDetail(generatedBank.accountNumber)}
                >
                  <Text style={styles.bankLineValue}>
                    {generatedBank.accountNumber} (tap to copy)
                  </Text>
                </TouchableOpacity>
                <Text style={styles.bankLineLabel}>Account Name</Text>
                <Text style={styles.bankLineValue}>
                  {generatedBank.accountName}
                </Text>
                <Text style={styles.bankLineLabel}>Reference</Text>
                <TouchableOpacity
                  onPress={() => copyBankDetail(generatedBank.reference)}
                >
                  <Text style={styles.bankLineValue}>
                    {generatedBank.reference} (tap to copy)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {selectedOption === "debit-card" && (
          <View style={styles.actionBlock}>
            <View style={styles.amountSection}>
              <Text style={styles.sectionTitle}>Enter Amount to Deposit</Text>
              <View style={styles.amountInputRowAlt}>
                <Text style={styles.currencySymbol}>₦</Text>
                <TextInput
                  style={styles.amountInputField}
                  placeholder="Enter amount"
                  placeholderTextColor="#B0B0B0"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Select a saved card</Text>
            {savedCards.length === 0 ? (
              <View style={styles.emptyNotice}>
                <Text style={styles.emptyNoticeText}>
                  No saved cards found. Add a card in Settings to use this
                  option.
                </Text>
              </View>
            ) : (
              savedCards.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.cardRow,
                    selectedCard === c.id && styles.cardRowSelected,
                  ]}
                  onPress={() => setSelectedCard(c.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardIconBox}>
                    <Ionicons name="card-outline" size={20} color="#6B5B8B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardRowTitle}>{`${c.brand} •••• ${c.last4}`}</Text>
                    <Text style={styles.cardSubtitle}>{c.holder}</Text>
                  </View>
                  {selectedCard === c.id && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!selectedOption ||
              !amount ||
              (selectedOption === "debit-card" && !selectedCard)) && {
              opacity: 0.6,
            },
          ]}
          onPress={handleDeposit}
          activeOpacity={0.85}
          disabled={
            !selectedOption ||
            !amount ||
            (selectedOption === "debit-card" && !selectedCard)
          }
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>

        <View style={styles.noteCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color={theme.accent} />
          <Text style={styles.noteText}>
            Your money is safe with us. All deposits are secure and encrypted.
          </Text>
        </View>

        <View style={styles.cardSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Recent Deposits</Text>
            <TouchableOpacity onPress={() => null} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentDeposits.length > 0 ? (
            recentDeposits.map((tx: any) => (
              <View key={tx.id} style={styles.depositRow}>
                <View style={styles.depositIconBox}>
                  <Ionicons
                    name="arrow-down-circle"
                    size={20}
                    color={theme.accent}
                  />
                </View>
                <View style={styles.depositInfo}>
                  <Text style={styles.depositTitle}>{tx.title}</Text>
                  <Text style={styles.depositSubtitle}>
                    From {tx.title.replace(/Deposit via\s*/i, "")}
                  </Text>
                </View>
                <View style={styles.depositMeta}>
                  <Text style={styles.depositAmount}>
                    +₦
                    {Number(tx.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  <Text style={styles.depositDate}>
                    {new Date(tx.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyNotice}>
              <Text style={styles.emptyNoticeText}>
                No recent deposits yet.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TransactionReceiptModal
        visible={showReceiptModal}
        transaction={receiptTransaction}
        onClose={() => setShowReceiptModal(false)}
        onViewReceipt={() => {
          if (!receiptTransaction) return;
          setShowReceiptModal(false);
          router.push({
            pathname: "/transaction-details",
            params: { id: receiptTransaction.id },
          });
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  balanceCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 18,
  },
  balanceLabel: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  cardSection: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.textPrimary,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.surfaceSoft,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  optionCardSelected: {
    backgroundColor: theme.accentSoft,
  },
  optionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  optionIconBoxSelected: {
    backgroundColor: theme.accentSoft,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  optionSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.accent,
  },
  depositRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  depositIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#F5F0F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  depositInfo: {
    flex: 1,
  },
  depositTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  depositSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  depositMeta: {
    alignItems: "flex-end",
  },
  depositAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  depositDate: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 4,
  },
  emptyNotice: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyNoticeText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surfaceSoft,
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.border,
  },
  noteText: {
    marginLeft: 10,
    fontSize: 13,
    color: theme.textPrimary,
    lineHeight: 20,
    flex: 1,
  },
  amountSection: {
    marginBottom: 20,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 18,
    height: 68,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "800",
    marginRight: 10,
    color: theme.textPrimary,
  },
  amountInputField: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  primaryButton: {
    backgroundColor: theme.accent,
    borderRadius: 20,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  helperText: {
    marginTop: 14,
    color: theme.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  actionBlock: {
    marginBottom: 18,
  },
  amountInputRowAlt: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    height: 60,
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  secondaryButtonText: {
    color: theme.accent,
    fontWeight: "700",
  },
  bankDetailsCard: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  bankLineLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 8,
  },
  bankLineValue: {
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: "700",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardRowSelected: {
    borderWidth: 1,
    borderColor: theme.accent,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: theme.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
});
