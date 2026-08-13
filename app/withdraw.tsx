import { Ionicons } from "@expo/vector-icons";
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

const withdrawOptions = [
  {
    id: "gtbank",
    icon: "business-outline",
    title: "GTBank",
    subtitle: "**** 1234",
  },
  {
    id: "access",
    icon: "business-outline",
    title: "Access Bank",
    subtitle: "**** 5678",
  },
  {
    id: "add-account",
    icon: "add-circle-outline",
    title: "Add New Account",
    subtitle: "Add a new bank account",
  },
];

export default function WithdrawScreen() {
  const router = useRouter();
  const { addTransaction, transactions } = useAppStore();
  const [amount, setAmount] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState<any | null>(
    null,
  );
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const selectWithdrawalOption = (optionId: string) => {
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

  const parsedAmount = parseFloat(amount);
  const isOverBalance = !isNaN(parsedAmount) && parsedAmount > currentBalance;
  const withdrawalFee = 0;
  const receiveAmount = isNaN(parsedAmount)
    ? 0
    : Math.max(parsedAmount - withdrawalFee, 0);

  const handleWithdraw = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to withdraw.");
      return;
    }

    if (value > currentBalance) {
      Alert.alert(
        "Insufficient Funds",
        "You do not have enough funds to complete this withdrawal.",
      );
      return;
    }

    const option = withdrawOptions.find((item) => item.id === selectedOption);

    const newTx = {
      id: `tx-${Date.now()}`,
      title: `Withdraw to ${option?.title ?? "GTBank"}`,
      amount: value,
      category: "Others",
      type: "expense",
      date: new Date().toISOString().slice(0, 10),
    };

    addTransaction(newTx);
    setReceiptTransaction(newTx);
    setShowReceiptModal(true);
    setAmount("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw</Text>
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
          <Text style={styles.cardTitle}>Withdraw to</Text>
          {withdrawOptions.map((option) => {
            const selected = selectedOption === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.destinationCard,
                  selected && styles.destinationCardSelected,
                ]}
                onPress={() => selectWithdrawalOption(option.id)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.destinationIcon,
                    selected && styles.destinationIconSelected,
                  ]}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={selected ? "#20142A" : "#6B5B8B"}
                  />
                </View>
                <View style={styles.destinationInfo}>
                  <Text style={styles.destinationTitle}>{option.title}</Text>
                  <Text style={styles.destinationSubtitle}>
                    {option.subtitle}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    selected && styles.radioOuterSelected,
                  ]}
                >
                  {selected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
          {!selectedOption && (
            <Text style={styles.helperText}>
              Select a withdrawal destination to continue.
            </Text>
          )}
        </View>

        {selectedOption && (
          <>
            <View style={styles.cardSection}>
              <Text style={styles.cardTitle}>
                How much do you want to withdraw?
              </Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.prefix}>₦</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount"
                  placeholderTextColor="#B0B0B0"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
                {amount !== "" && (
                  <TouchableOpacity
                    onPress={() => setAmount("")}
                    style={styles.clearButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.quickAmountRow}>
                {[100, 1000, 5000, 10000].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={styles.quickAmountButton}
                    onPress={() => setAmount(String(value))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.quickAmountText}>
                      ₦{value.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.hintText}>Minimum withdrawal is ₦1,000</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Withdrawal Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Amount</Text>
                <Text style={styles.summaryAmount}>
                  ₦
                  {isNaN(parsedAmount)
                    ? "0.00"
                    : parsedAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Fee</Text>
                <Text style={styles.summaryAmount}>
                  ₦{withdrawalFee.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRowTotal}>
                <Text style={styles.summaryTotalLabel}>You will receive</Text>
                <Text style={styles.summaryTotalAmount}>
                  ₦
                  {receiveAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (isOverBalance || !amount) && styles.primaryButtonDisabled,
          ]}
          onPress={handleWithdraw}
          activeOpacity={0.85}
          disabled={isOverBalance || !amount}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF9FB",
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
    backgroundColor: "#FFFFFF",
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
    color: "#1C1C1E",
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  balanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDE8F3",
    marginBottom: 18,
  },
  balanceLabel: {
    color: "#6F6876",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1C1C1E",
  },
  cardSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EDE8F3",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 16,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDE8F3",
    paddingHorizontal: 14,
    height: 60,
  },
  prefix: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5B4E91",
  },
  quickAmountRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  quickAmountButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#EDE8F3",
  },
  quickAmountText: {
    color: "#1C1C1E",
    fontWeight: "700",
    fontSize: 13,
  },
  helperText: {
    marginTop: 14,
    color: "#6F6876",
    fontSize: 13,
    textAlign: "center",
  },
  hintText: {
    marginTop: 10,
    fontSize: 12,
    color: "#6F6876",
  },
  destinationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EDE8F3",
  },
  destinationCardSelected: {
    backgroundColor: "#FAF9FB",
    borderColor: "#20142A",
  },
  destinationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FAF9FB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  destinationIconSelected: {
    backgroundColor: "#F5F0F8",
  },
  destinationInfo: {
    flex: 1,
  },
  destinationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  destinationSubtitle: {
    fontSize: 13,
    color: "#6F6876",
    marginTop: 4,
    lineHeight: 18,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D8D2E6",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#20142A",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#20142A",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#EDE8F3",
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 13,
    color: "#6F6876",
  },
  summaryAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  summaryRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  summaryTotalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#20142A",
  },
  primaryButton: {
    backgroundColor: "#20142A",
    borderRadius: 20,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#20142A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: "#D8D2E6",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
