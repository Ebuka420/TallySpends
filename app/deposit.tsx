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

export default function DepositScreen() {
  const router = useRouter();
  const { addTransaction, transactions } = useAppStore();
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("Zenith Bank");
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const transactionsRaw = transactions || [];
  const totalIncome = transactionsRaw
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalExpenses = transactionsRaw
    .filter((t: any) => t.type === "expense")
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const currentBalance = 2926.78 + totalIncome - totalExpenses;

  const quickAmounts = ["50", "100", "200", "500"];
  const paymentMethods = [
    { id: "zenith", name: "Zenith Bank", subtitle: "**** 8392", icon: "wallet-outline" },
    { id: "access", name: "Access Bank", subtitle: "**** 1093", icon: "wallet-outline" },
    { id: "gtb", name: "GTBank", subtitle: "**** 4829", icon: "wallet-outline" },
    { id: "kuda", name: "Kuda Bank", subtitle: "**** 9512", icon: "wallet-outline" },
  ];

  const handleDeposit = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid deposit amount.");
      return;
    }

    addTransaction({
      title: `Deposit via ${selectedMethod}`,
      amount: value,
      category: "Income",
      type: "income",
      date: new Date().toISOString().slice(0, 10),
    });

    Alert.alert(
      "Success 🎉",
      `Successfully deposited $${value.toFixed(2)} into your account!`,
      [{ text: "Awesome", onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#20142A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit Funds</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.balanceLabel}>Current Available Balance</Text>
            <TouchableOpacity 
              onPress={() => setIsBalanceVisible(!isBalanceVisible)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isBalanceVisible ? "eye-outline" : "eye-off-outline"} 
                size={14} 
                color="#A0A0A0" 
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {isBalanceVisible 
              ? `$${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
              : "$••••••"}
          </Text>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Deposit Amount</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#A0A0A0"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>
        </View>

        {/* Quick Amount Selection */}
        <View style={styles.quickAmountRow}>
          {quickAmounts.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[styles.quickAmountChip, amount === amt && styles.quickAmountChipSelected]}
              onPress={() => setAmount(amt)}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickAmountText, amount === amt && styles.quickAmountTextSelected]}>
                +${amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Methods */}
        <View style={[styles.section, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Select Deposit Source</Text>
          <View style={styles.methodsContainer}>
            {paymentMethods.map((method) => {
              const isSelected = selectedMethod === method.name;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.methodCard, isSelected && styles.methodCardSelected]}
                  onPress={() => setSelectedMethod(method.name)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.methodIconBox, isSelected && styles.methodIconBoxSelected]}>
                    <Ionicons
                      name={method.icon as any}
                      size={18}
                      color={isSelected ? "#FFFFFF" : "#20142A"}
                    />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={[styles.methodName, isSelected && styles.methodNameSelected]}>
                      {method.name}
                    </Text>
                    <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#20142A" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleDeposit}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>Confirm Deposit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#F0F0F2",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#20142A",
  },
  headerRightPlaceholder: {
    width: 32,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: "#20142A",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  balanceLabel: {
    color: "#A0A0A0",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 6,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7C7C7C",
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 64,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: "600",
    color: "#20142A",
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    color: "#20142A",
  },
  quickAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  quickAmountChip: {
    flex: 1,
    backgroundColor: "#F3F3F5",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  quickAmountChipSelected: {
    backgroundColor: "#20142A",
  },
  quickAmountText: {
    fontSize: 13,
    color: "#534B52",
    fontWeight: "600",
  },
  quickAmountTextSelected: {
    color: "#FFFFFF",
  },
  methodsContainer: {
    gap: 12,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
  },
  methodCardSelected: {
    borderColor: "#20142A",
    backgroundColor: "rgba(32, 20, 42, 0.02)",
  },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F3F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  methodIconBoxSelected: {
    backgroundColor: "#20142A",
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#20142A",
  },
  methodNameSelected: {
    fontWeight: "700",
  },
  methodSubtitle: {
    fontSize: 11,
    color: "#7C7C7C",
    marginTop: 2,
  },
  checkIcon: {
    marginLeft: "auto",
  },
  confirmButton: {
    backgroundColor: "#20142A",
    borderRadius: 16,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    shadowColor: "#20142A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
