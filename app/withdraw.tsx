import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
import { getThemePalette } from "../src/theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WITHDRAWAL_DESTINATIONS = [
  {
    id: "gtbank",
    bankName: "Guaranty Trust Bank",
    accountNumber: "•••• 4821",
    accountName: "Ebuka Daniel",
    icon: "business-outline" as const,
  },
  {
    id: "zenith",
    bankName: "Zenith Bank",
    accountNumber: "•••• 8912",
    accountName: "Ebuka Daniel",
    icon: "business-outline" as const,
  },
  {
    id: "kuda",
    bankName: "Kuda Microfinance Bank",
    accountNumber: "•••• 1044",
    accountName: "Ebuka Daniel",
    icon: "phone-portrait-outline" as const,
  },
];

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export default function WithdrawScreen() {
  const router = useRouter();
  const {
    addTransaction,
    transactions,
    themePreference,
    themeMode,
  } = useAppStore();

  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const [amount, setAmount] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<string>("gtbank");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState<any | null>(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [step, setStep] = useState<"input" | "review">("input");

  const transactionsRaw = (transactions || []) as any[];
  const totalIncome = transactionsRaw
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  const totalExpenses = transactionsRaw
    .filter((t: any) => t.type === "expense")
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  const currentBalance = 2926.78 + totalIncome - totalExpenses;

  const selectDestination = (destId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDestination(destId);
  };

  const parsedAmount = parseFloat(amount);
  const isOverBalance = !isNaN(parsedAmount) && parsedAmount > currentBalance;
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0 && !isOverBalance;

  const handleWithdraw = () => {
    if (!isValidAmount) {
      Alert.alert("Invalid Amount", "Please enter a valid amount within your available balance.");
      return;
    }

    const dest = WITHDRAWAL_DESTINATIONS.find((item) => item.id === selectedDestination);

    const newTx = {
      id: `tx-${Date.now()}`,
      title: `Withdrawal to ${dest?.bankName ?? "GTBank"}`,
      amount: parsedAmount,
      category: "Others",
      type: "expense",
      date: new Date().toISOString().slice(0, 10),
    };

    addTransaction(newTx);
    setReceiptTransaction(newTx);
    setShowReceiptModal(true);
    setAmount("");
    setStep("input");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Bar matching Transfer */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (step === "review" ? setStep("input") : router.back())}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {step === "review" ? "Confirm Withdrawal" : "Withdraw Funds"}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/linkbank")}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === "input" ? (
            <>
              {/* Balance Section styled like Home Page */}
              <View style={styles.homeStyleBalanceContainer}>
                <Text style={[styles.homeStyleBalanceLabel, { color: theme.textSecondary }]}>
                  AVAILABLE BALANCE
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={isBalanceVisible ? "Hide balance" : "Show balance"}
                  onPress={() => setIsBalanceVisible(!isBalanceVisible)}
                  activeOpacity={0.7}
                  style={styles.homeStyleBalanceAmountBtn}
                >
                  <Text
                    style={[
                      styles.homeStyleBalanceAmount,
                      { color: theme.textPrimary },
                      !isBalanceVisible && styles.hiddenBalanceAmount,
                    ]}
                  >
                    {isBalanceVisible
                      ? `₦${currentBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "********"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Destination Bank Selection */}
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeaderLabel, { color: theme.textSecondary }]}>
                  WITHDRAW TO BANK ACCOUNT
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/linkbank")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sectionActionLink, { color: theme.accent }]}>
                    + Add New
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ gap: 10, marginBottom: 20 }}>
                {WITHDRAWAL_DESTINATIONS.map((dest) => {
                  const isSelected = selectedDestination === dest.id;
                  return (
                    <TouchableOpacity
                      key={dest.id}
                      style={[
                        styles.methodCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? theme.surfaceSoft
                              : "#FDF9FE"
                            : theme.surface,
                          borderColor: isSelected ? theme.accent : theme.border,
                        },
                      ]}
                      onPress={() => selectDestination(dest.id)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.methodIconBox,
                          {
                            backgroundColor: isSelected
                              ? theme.accent
                              : isDark
                              ? theme.surfaceSoft
                              : "#F3EBF8",
                          },
                        ]}
                      >
                        <Ionicons
                          name={dest.icon}
                          size={20}
                          color={isSelected ? "#FFFFFF" : theme.accent}
                        />
                      </View>

                      <View style={styles.methodInfoCol}>
                        <Text
                          style={[
                            styles.methodTitle,
                            {
                              color: isSelected ? theme.accent : theme.textPrimary,
                            },
                          ]}
                        >
                          {dest.bankName}
                        </Text>
                        <Text style={[styles.methodSubtitle, { color: theme.textSecondary }]}>
                          {dest.accountName} · {dest.accountNumber}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.radioIndicator,
                          {
                            borderColor: isSelected ? theme.accent : theme.border,
                            backgroundColor: isSelected ? theme.accent : "transparent",
                          },
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Amount Input Block */}
              <View
                style={[
                  styles.amountCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: isOverBalance ? "#EF4444" : theme.border,
                  },
                ]}
              >
                <Text style={[styles.amountCardLabel, { color: theme.textSecondary }]}>
                  ENTER WITHDRAWAL AMOUNT
                </Text>

                <View style={styles.amountInputRow}>
                  <Text style={[styles.currencyPrefix, { color: theme.accent }]}>₦</Text>
                  <TextInput
                    style={[styles.amountInput, { color: theme.textPrimary }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    maxLength={10}
                  />
                </View>

                {isOverBalance && (
                  <View style={styles.errorBannerRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>
                      Amount exceeds available wallet balance.
                    </Text>
                  </View>
                )}

                {/* Quick Amounts Chips */}
                <Text
                  style={[
                    styles.quickAmountsTitle,
                    { color: theme.textSecondary, marginTop: 14, marginBottom: 8 },
                  ]}
                >
                  Quick Amounts
                </Text>
                <View style={styles.quickPillsRow}>
                  {QUICK_AMOUNTS.map((val) => {
                    const isPillActive = amount === String(val);
                    return (
                      <TouchableOpacity
                        key={val}
                        style={[
                          styles.quickPill,
                          {
                            backgroundColor: isPillActive
                              ? theme.accent
                              : isDark
                              ? theme.surfaceSoft
                              : "#F4EBF8",
                            borderColor: isPillActive ? theme.accent : theme.border,
                          },
                        ]}
                        onPress={() => setAmount(String(val))}
                      >
                        <Text
                          style={[
                            styles.quickPillText,
                            {
                              color: isPillActive ? "#FFFFFF" : theme.textPrimary,
                            },
                          ]}
                        >
                          ₦{val.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity
                style={[
                  styles.primaryActionButton,
                  {
                    backgroundColor: isValidAmount ? theme.accent : isDark ? "#333338" : "#CCCCCC",
                  },
                ]}
                disabled={!isValidAmount}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setStep("review");
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionButtonText}>
                  Continue to Review
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          ) : (
            /* Review Step View */
            <View style={{ gap: 16 }}>
              <View
                style={[
                  styles.reviewHeroCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.reviewHeroLabel, { color: theme.textSecondary }]}>
                  WITHDRAWAL AMOUNT
                </Text>
                <Text style={[styles.reviewHeroAmount, { color: theme.textPrimary }]}>
                  ₦{parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>

                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />

                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewRowLabel, { color: theme.textSecondary }]}>
                    Destination Bank
                  </Text>
                  <Text style={[styles.reviewRowValue, { color: theme.textPrimary }]}>
                    {WITHDRAWAL_DESTINATIONS.find((d) => d.id === selectedDestination)?.bankName}
                  </Text>
                </View>

                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewRowLabel, { color: theme.textSecondary }]}>
                    Account Number
                  </Text>
                  <Text style={[styles.reviewRowValue, { color: theme.textPrimary }]}>
                    {WITHDRAWAL_DESTINATIONS.find((d) => d.id === selectedDestination)?.accountNumber}
                  </Text>
                </View>

                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewRowLabel, { color: theme.textSecondary }]}>
                    Account Name
                  </Text>
                  <Text style={[styles.reviewRowValue, { color: theme.textPrimary }]}>
                    {WITHDRAWAL_DESTINATIONS.find((d) => d.id === selectedDestination)?.accountName}
                  </Text>
                </View>

                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewRowLabel, { color: theme.textSecondary }]}>
                    Transfer Fee
                  </Text>
                  <Text style={[styles.reviewRowValue, { color: "#15803D", fontWeight: "700" }]}>
                    ₦0.00 (Free)
                  </Text>
                </View>

                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewRowLabel, { color: theme.textSecondary }]}>
                    Delivery Speed
                  </Text>
                  <Text style={[styles.reviewRowValue, { color: theme.accent }]}>
                    Instant Credit (within 2 mins)
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryActionButton, { backgroundColor: theme.accent }]}
                onPress={handleWithdraw}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.primaryActionButtonText}>
                  Authorize & Withdraw Funds
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  { borderColor: theme.border, backgroundColor: theme.surface },
                ]}
                onPress={() => setStep("input")}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>
                  Edit Amount
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <TransactionReceiptModal
        visible={showReceiptModal}
        transaction={receiptTransaction}
        onClose={() => {
          setShowReceiptModal(false);
          router.back();
        }}
        onViewReceipt={() => {
          setShowReceiptModal(false);
          if (receiptTransaction?.id) {
            router.push({
              pathname: "/transaction-details",
              params: { id: receiptTransaction.id },
            });
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  homeStyleBalanceContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 22,
  },
  homeStyleBalanceLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  homeStyleBalanceAmountBtn: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    minWidth: 180,
  },
  homeStyleBalanceAmount: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  hiddenBalanceAmount: {
    letterSpacing: 3,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  sectionActionLink: {
    fontSize: 12,
    fontWeight: "700",
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
  },
  methodIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  methodInfoCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  methodTitle: {
    fontSize: 14.5,
    fontWeight: "700",
  },
  methodSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  radioIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  amountCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  amountCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  currencyPrefix: {
    fontSize: 26,
    fontWeight: "800",
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: "800",
    paddingVertical: 4,
  },
  errorBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  errorText: {
    fontSize: 11.5,
    color: "#EF4444",
    fontWeight: "600",
  },
  quickAmountsTitle: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  quickPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  primaryActionButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryActionButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  reviewHeroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  reviewHeroLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  reviewHeroAmount: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 4,
    marginBottom: 16,
  },
  dividerLine: {
    height: 1,
    marginBottom: 16,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  reviewRowLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  reviewRowValue: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  cancelBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
