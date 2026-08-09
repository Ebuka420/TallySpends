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
  const { addTransaction, transactions } = useAppStore();
  const [amount, setAmount] = useState("");
  const [selectedOption, setSelectedOption] = useState("bank-transfer");
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

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
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const handleDeposit = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid deposit amount.");
      return;
    }

    const option = depositOptions.find((item) => item.id === selectedOption);

    addTransaction({
      title: `Deposit via ${option?.title ?? "Bank Transfer"}`,
      amount: value,
      category: "Income",
      type: "income",
      date: new Date().toISOString().slice(0, 10),
    });

    Alert.alert(
      "Success 🎉",
      `Successfully deposited ₦${value.toFixed(2)} into your account!`,
      [{ text: "Awesome", onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
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
          <Text style={styles.cardTitle}>How would you like to deposit?</Text>
          {depositOptions.map((option) => {
            const selected = selectedOption === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, selected && styles.optionCardSelected]}
                onPress={() => setSelectedOption(option.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.optionIconBox, selected && styles.optionIconBoxSelected]}>
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={selected ? "#4B2C40" : "#6B5B8B"}
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
                  <Ionicons name="arrow-down-circle" size={20} color="#4B2C40" />
                </View>
                <View style={styles.depositInfo}>
                  <Text style={styles.depositTitle}>{tx.title}</Text>
                  <Text style={styles.depositSubtitle}>From {tx.title.replace(/Deposit via\s*/i, "")}</Text>
                </View>
                <View style={styles.depositMeta}>
                  <Text style={styles.depositAmount}>+₦{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  <Text style={styles.depositDate}>{new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyNotice}>
              <Text style={styles.emptyNoticeText}>No recent deposits yet.</Text>
            </View>
          )}
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#4B2C40" />
          <Text style={styles.noteText}>Your money is safe with us. All deposits are secure and encrypted.</Text>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.sectionTitle}>Deposit Amount</Text>
          <View style={styles.amountInputRow}>
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

        <TouchableOpacity style={styles.primaryButton} onPress={handleDeposit} activeOpacity={0.85}>
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
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#F8F5FF",
    marginBottom: 12,
  },
  optionCardSelected: {
    backgroundColor: "#F3EDFF",
  },
  optionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  optionIconBoxSelected: {
    backgroundColor: "#E5DBF7",
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  optionSubtitle: {
    fontSize: 13,
    color: "#7A6F8B",
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
    color: "#7D5AF7",
  },
  depositRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#F2EDF8",
  },
  depositIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#E9F8EE",
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
    color: "#1A1A1A",
  },
  depositSubtitle: {
    fontSize: 12,
    color: "#7A6F8B",
    marginTop: 4,
  },
  depositMeta: {
    alignItems: "flex-end",
  },
  depositAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E7D32",
  },
  depositDate: {
    fontSize: 11,
    color: "#8A8A8A",
    marginTop: 4,
  },
  emptyNotice: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyNoticeText: {
    fontSize: 13,
    color: "#7A6F8B",
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECF6F1",
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
  },
  noteText: {
    marginLeft: 10,
    fontSize: 13,
    color: "#395B3A",
    lineHeight: 20,
    flex: 1,
  },
  amountSection: {
    marginBottom: 20,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E1F5",
    paddingHorizontal: 18,
    height: 68,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "800",
    marginRight: 10,
    color: "#1A1A1A",
  },
  amountInputField: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
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
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
