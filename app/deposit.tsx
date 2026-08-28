import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
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

const DEPOSIT_METHODS = [
  {
    id: "bank-transfer",
    icon: "business-outline" as const,
    title: "Direct Bank Transfer",
    subtitle: "Send via your bank app with instant reference",
  },
  {
    id: "debit-card",
    icon: "card-outline" as const,
    title: "Debit / Credit Card",
    subtitle: "Instant deposit from linked Mastercard/Visa",
  },
  {
    id: "auto-save",
    icon: "repeat-outline" as const,
    title: "Auto-Save Recurring",
    subtitle: "Schedule automatic daily or weekly stash",
  },
];

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export default function DepositScreen() {
  const router = useRouter();
  const {
    addTransaction,
    transactions,
    savedCards = [],
    themePreference,
    themeMode,
  } = useAppStore();

  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const [amount, setAmount] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>("bank-transfer");
  const [generatedBank, setGeneratedBank] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
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

  const selectDepositOption = (optionId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedOption(optionId);
  };

  const handleDeposit = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid deposit amount.");
      return;
    }

    const option = DEPOSIT_METHODS.find((item) => item.id === selectedOption);

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
    setStep("input");
  };

  const copyBankDetail = async (value: string) => {
    try {
      await Clipboard.setStringAsync(String(value));
      Alert.alert("Copied", "Copied to clipboard.");
    } catch {
      Alert.alert("Error", "Could not copy to clipboard.");
    }
  };

  const generateBankDetails = () => {
    const ref = `TS${Math.floor(Math.random() * 900000) + 100000}`;
    const details = {
      bankName: "Tally Virtual Bank",
      accountNumber: String(
        Math.floor(1000000000 + Math.random() * 8999999999),
      ),
      accountName: "TallySpends - User Account",
      reference: ref,
      expiryMinutes: 30,
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setGeneratedBank(details);
  };

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

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
          {step === "review" ? "Confirm Deposit" : "Add Funds"}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/linkbank")}
          activeOpacity={0.7}
        >
          <Ionicons name="card-outline" size={22} color={theme.accent} />
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

              {/* Deposit Method Selection */}
              <Text style={[styles.sectionHeaderLabel, { color: theme.textSecondary }]}>
                SELECT DEPOSIT METHOD
              </Text>

              <View style={{ gap: 10, marginBottom: 20 }}>
                {DEPOSIT_METHODS.map((method) => {
                  const isSelected = selectedOption === method.id;
                  return (
                    <TouchableOpacity
                      key={method.id}
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
                      onPress={() => selectDepositOption(method.id)}
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
                          name={method.icon}
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
                          {method.title}
                        </Text>
                        <Text style={[styles.methodSubtitle, { color: theme.textSecondary }]}>
                          {method.subtitle}
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

              {/* Method-Specific Configuration Area */}
              {selectedOption === "bank-transfer" && (
                <View
                  style={[
                    styles.configContainer,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.configTitle, { color: theme.textPrimary }]}>
                    Bank Transfer Details
                  </Text>
                  <Text style={[styles.configSub, { color: theme.textSecondary }]}>
                    Transfer from your bank to this dedicated virtual account. Your balance will update in seconds.
                  </Text>

                  {generatedBank ? (
                    <View
                      style={[
                        styles.bankDetailsBox,
                        {
                          backgroundColor: isDark ? theme.surfaceSoft : "#F9F6FA",
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <View style={styles.bankDetailRow}>
                        <Text style={[styles.bankDetailLabel, { color: theme.textSecondary }]}>
                          Bank Name
                        </Text>
                        <Text style={[styles.bankDetailVal, { color: theme.textPrimary }]}>
                          {generatedBank.bankName}
                        </Text>
                      </View>

                      <View style={styles.bankDetailRow}>
                        <Text style={[styles.bankDetailLabel, { color: theme.textSecondary }]}>
                          Account Number
                        </Text>
                        <TouchableOpacity
                          onPress={() => copyBankDetail(generatedBank.accountNumber)}
                          style={styles.copyValueRow}
                        >
                          <Text
                            style={[
                              styles.bankDetailVal,
                              { color: theme.accent, fontWeight: "800" },
                            ]}
                          >
                            {generatedBank.accountNumber}
                          </Text>
                          <Ionicons name="copy-outline" size={15} color={theme.accent} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.bankDetailRow}>
                        <Text style={[styles.bankDetailLabel, { color: theme.textSecondary }]}>
                          Beneficiary
                        </Text>
                        <Text style={[styles.bankDetailVal, { color: theme.textPrimary }]}>
                          {generatedBank.accountName}
                        </Text>
                      </View>

                      <View style={styles.bankDetailRow}>
                        <Text style={[styles.bankDetailLabel, { color: theme.textSecondary }]}>
                          Payment Ref
                        </Text>
                        <TouchableOpacity
                          onPress={() => copyBankDetail(generatedBank.reference)}
                          style={styles.copyValueRow}
                        >
                          <Text style={[styles.bankDetailVal, { color: theme.textPrimary }]}>
                            {generatedBank.reference}
                          </Text>
                          <Ionicons name="copy-outline" size={14} color={theme.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.generateAccBtn, { backgroundColor: theme.accent }]}
                      onPress={generateBankDetails}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="flash-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.generateAccBtnText}>
                        Generate Virtual Transfer Account
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Amount Input Block */}
              <View
                style={[
                  styles.amountCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.amountCardLabel, { color: theme.textSecondary }]}>
                  ENTER DEPOSIT AMOUNT
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
                  DEPOSIT TOTAL
                </Text>
                <Text style={[styles.reviewHeroAmount, { color: theme.textPrimary }]}>
                  ₦{parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>

                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />

                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewRowLabel, { color: theme.textSecondary }]}>
                    Deposit Method
                  </Text>
                  <Text style={[styles.reviewRowValue, { color: theme.textPrimary }]}>
                    {DEPOSIT_METHODS.find((m) => m.id === selectedOption)?.title}
                  </Text>
                </View>

                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewRowLabel, { color: theme.textSecondary }]}>
                    Destination
                  </Text>
                  <Text style={[styles.reviewRowValue, { color: theme.textPrimary }]}>
                    Main Tally Wallet
                  </Text>
                </View>

                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewRowLabel, { color: theme.textSecondary }]}>
                    Processing Fee
                  </Text>
                  <Text style={[styles.reviewRowValue, { color: "#15803D", fontWeight: "700" }]}>
                    ₦0.00 (Free)
                  </Text>
                </View>

                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewRowLabel, { color: theme.textSecondary }]}>
                    Estimated Arrival
                  </Text>
                  <Text style={[styles.reviewRowValue, { color: theme.accent }]}>
                    Instant
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryActionButton, { backgroundColor: theme.accent }]}
                onPress={handleDeposit}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.primaryActionButtonText}>
                  Confirm & Complete Deposit
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
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
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
  configContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  configTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  configSub: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 14,
  },
  bankDetailsBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  bankDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bankDetailLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  bankDetailVal: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  copyValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  generateAccBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    height: 48,
  },
  generateAccBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
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
