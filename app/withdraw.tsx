import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { useAppStore } from "../src/store";

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
  const [selectedOption, setSelectedOption] = useState("gtbank");
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

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
  const receiveAmount = isNaN(parsedAmount) ? 0 : Math.max(parsedAmount - withdrawalFee, 0);

  const handleWithdraw = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to withdraw.");
      return;
    }

    if (value > currentBalance) {
      Alert.alert("Insufficient Funds", "You do not have enough funds to complete this withdrawal.");
      return;
    }

    const option = withdrawOptions.find((item) => item.id === selectedOption);

    addTransaction({
      title: `Withdraw to ${option?.title ?? "GTBank"}`,
      amount: value,
      category: "Others",
      type: "expense",
      date: new Date().toISOString().slice(0, 10),
    });

    Alert.alert("Success 🎉", `Successfully withdrew ₦${value.toFixed(2)} to your bank!`, [
      { text: "Done", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <TouchableOpacity onPress={() => setIsBalanceVisible(!isBalanceVisible)} activeOpacity={0.8}>
            <Text style={styles.balanceAmount}>
              {isBalanceVisible
                ? `₦${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "₦•••••••"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.cardTitle}>How much do you want to withdraw?</Text>
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
              <TouchableOpacity onPress={() => setAmount("")} style={styles.clearButton} activeOpacity={0.7}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.hintText}>Minimum withdrawal is ₦1,000</Text>
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.cardTitle}>Withdraw to</Text>
          {withdrawOptions.map((option) => {
            const selected = selectedOption === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.destinationCard, selected && styles.destinationCardSelected]}
                onPress={() => setSelectedOption(option.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.destinationIcon, selected && styles.destinationIconSelected]}>
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={selected ? "#4B2C40" : "#6B5B8B"}
                  />
                </View>
                <View style={styles.destinationInfo}>
                  <Text style={styles.destinationTitle}>{option.title}</Text>
                  <Text style={styles.destinationSubtitle}>{option.subtitle}</Text>
                </View>
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Withdrawal Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Amount</Text>
            <Text style={styles.summaryAmount}>₦{isNaN(parsedAmount) ? "0.00" : parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Fee</Text>
            <Text style={styles.summaryAmount}>₦{withdrawalFee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRowTotal}>
            <Text style={styles.summaryTotalLabel}>You will receive</Text>
            <Text style={styles.summaryTotalAmount}>₦{receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, (isOverBalance || !amount) && styles.primaryButtonDisabled]}
          onPress={handleWithdraw}
          activeOpacity={0.85}
          disabled={isOverBalance || !amount}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F2FF",
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C112D",
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
    borderRadius: 28,
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    marginBottom: 18,
  },
  balanceLabel: {
    color: "#7D7D7D",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1C112D",
  },
  cardSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C112D",
    marginBottom: 16,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F5FF",
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 64,
  },
  prefix: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C112D",
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#1C112D",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7D5AF7",
  },
  hintText: {
    marginTop: 10,
    fontSize: 12,
    color: "#7D7D7D",
  },
  destinationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#F8F5FF",
    marginBottom: 12,
  },
  destinationCardSelected: {
    backgroundColor: "#F3EDFF",
  },
  destinationIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  destinationIconSelected: {
    backgroundColor: "#E5DBF7",
  },
  destinationInfo: {
    flex: 1,
  },
  destinationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  destinationSubtitle: {
    fontSize: 13,
    color: "#7A6F8B",
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
    borderColor: "#4B2C40",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4B2C40",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C112D",
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 13,
    color: "#7D7D7D",
  },
  summaryAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C112D",
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
    color: "#1A1A1A",
  },
  summaryTotalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4B2C40",
  },
  primaryButton: {
    backgroundColor: "#4B2C40",
    borderRadius: 20,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4B2C40",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
  primaryButtonDisabled: {
    backgroundColor: "#BFB8D6",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
