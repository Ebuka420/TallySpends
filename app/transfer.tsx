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
  FlatList,
} from "react-native";
import { useAppStore } from "../src/store";

export default function TransferScreen() {
  const router = useRouter();
  const { addTransaction, transactions } = useAppStore();
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [customRecipient, setCustomRecipient] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState("rec-1");
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const transactionsRaw = transactions || [];
  const totalIncome = transactionsRaw
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalExpenses = transactionsRaw
    .filter((t: any) => t.type === "expense")
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const currentBalance = 2926.78 + totalIncome - totalExpenses;

  const recipients = [
    { id: "rec-1", name: "Sarah Jenkins", initial: "SJ", color: "#F3E5F5", textColor: "#7B1FA2" },
    { id: "rec-2", name: "David Kalu", initial: "DK", color: "#E1F5FE", textColor: "#0288D1" },
    { id: "rec-3", name: "Jessica Smith", initial: "JS", color: "#E8F8F5", textColor: "#2ECC71" },
    { id: "rec-4", name: "Michael Chen", initial: "MC", color: "#FFF9C4", textColor: "#F57F17" },
  ];

  const activeRecipient = recipients.find((r) => r.id === selectedRecipientId);
  const recipientName = customRecipient.trim() || (activeRecipient ? activeRecipient.name : "Someone");

  const parsedAmount = parseFloat(amount);
  const isOverBalance = !isNaN(parsedAmount) && parsedAmount > currentBalance;

  const handleTransfer = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to transfer.");
      return;
    }

    if (value > currentBalance) {
      Alert.alert(
        "Insufficient Funds",
        "You do not have enough funds to complete this transfer."
      );
      return;
    }

    addTransaction({
      title: `Transfer to ${recipientName}`,
      amount: value,
      category: "Others",
      type: "expense",
      date: new Date().toISOString().slice(0, 10),
    });

    Alert.alert(
      "Success 🎉",
      `Successfully transferred $${value.toFixed(2)} to ${recipientName}!`,
      [{ text: "Great", onPress: () => router.back() }]
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
        <Text style={styles.headerTitle}>Transfer Money</Text>
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

        {/* Recipients Row */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Recent Recipient</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recipientsRow}>
            {recipients.map((rec) => {
              const isSelected = selectedRecipientId === rec.id && !customRecipient;
              return (
                <TouchableOpacity
                  key={rec.id}
                  style={[styles.recipientCard, isSelected && styles.recipientCardSelected]}
                  onPress={() => {
                    setSelectedRecipientId(rec.id);
                    setCustomRecipient("");
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatarBox, { backgroundColor: rec.color }]}>
                    <Text style={[styles.avatarText, { color: rec.textColor }]}>{rec.initial}</Text>
                  </View>
                  <Text style={[styles.recName, isSelected && styles.recNameSelected]} numberOfLines={1}>
                    {rec.name.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Custom Recipient Input */}
        <View style={[styles.section, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Or Send to Account/Username</Text>
          <View style={styles.inputFieldWrapper}>
            <Ionicons name="at-outline" size={18} color="#7C7C7C" style={styles.fieldIcon} />
            <TextInput
              style={styles.fieldInput}
              placeholder="Enter name, email or @username"
              placeholderTextColor="#A0A0A0"
              value={customRecipient}
              onChangeText={setCustomRecipient}
            />
          </View>
        </View>

        {/* Amount Input */}
        <View style={[styles.section, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Enter Transfer Amount</Text>
          <View style={[styles.amountInputWrapper, isOverBalance && styles.amountInputWrapperError]}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#A0A0A0"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
          {isOverBalance && (
            <Text style={styles.errorText}>
              ⚠️ Amount exceeds available balance
            </Text>
          )}
        </View>

        {/* Memo Input */}
        <View style={[styles.section, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Memo (Optional)</Text>
          <View style={styles.inputFieldWrapper}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#7C7C7C" style={styles.fieldIcon} />
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Dinner bills, rent contribution"
              placeholderTextColor="#A0A0A0"
              value={memo}
              onChangeText={setMemo}
            />
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmButton, (isOverBalance || !amount) && styles.confirmButtonDisabled]}
          onPress={handleTransfer}
          activeOpacity={0.8}
          disabled={isOverBalance || !amount}
        >
          <Text style={styles.confirmButtonText}>
            Confirm Transfer {recipientName ? `to ${recipientName.split(" ")[0]}` : ""}
          </Text>
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
  recipientsRow: {
    gap: 12,
    paddingVertical: 4,
  },
  recipientCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    width: 76,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  recipientCardSelected: {
    borderColor: "#20142A",
    backgroundColor: "rgba(32, 20, 42, 0.02)",
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  recName: {
    fontSize: 11,
    color: "#534B52",
    fontWeight: "500",
  },
  recNameSelected: {
    color: "#20142A",
    fontWeight: "700",
  },
  inputFieldWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  fieldIcon: {
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: "#20142A",
  },
  amountInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  amountInputWrapperError: {
    borderColor: "#EF4444",
    borderWidth: 1.5,
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: "600",
    color: "#20142A",
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: "600",
    color: "#20142A",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
    marginLeft: 4,
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
  confirmButtonDisabled: {
    backgroundColor: "#A0A0A0",
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
