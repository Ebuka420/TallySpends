import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { MOCK_RECIPIENTS, useAppStore } from "../src/store";

export default function TransactionDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { transactions: rawTransactions = [] } = useAppStore();
  const transactions = rawTransactions as any[];
  const transaction = useMemo(
    () => transactions.find((tx) => tx.id === params.id),
    [params.id, transactions],
  );

  const normalizedTitle = transaction?.title
    ? transaction.title.replace(
        /(Transfer to\s+)@([a-zA-Z0-9_]+)/i,
        (_, prefix, username) => {
          const recipient = MOCK_RECIPIENTS.find(
            (r) => r.username.toLowerCase() === username.toLowerCase(),
          );
          return recipient
            ? `${prefix}${recipient.name}`
            : `Transfer to @${username}`;
        },
      )
    : "Transaction Receipt";

  const formatCurrency = (value: number) =>
    `₦${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formattedDate = transaction
    ? new Date(transaction.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const formattedTime = transaction
    ? new Date(transaction.date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleShareDetails = async () => {
    if (!transaction) return;
    const message = `TallySpends receipt\n\n${normalizedTitle}\nAmount: ${formatCurrency(transaction.amount)}\nCategory: ${transaction.category ?? "-"}\nType: ${transaction.type?.toUpperCase() ?? "-"}\nDate: ${formattedDate}\nTime: ${formattedTime}\nTransaction ID: ${transaction.id}`;
    try {
      await Share.share({
        title: "TallySpends Receipt",
        message,
      });
    } catch (error) {
      console.error("Unable to share receipt", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#20142A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt</Text>
        <TouchableOpacity
          onPress={handleShareDetails}
          style={styles.headerAction}
        >
          <Ionicons name="share-outline" size={22} color="#4B2C40" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.receiptCard}>
          <View style={[styles.edgeNotch, styles.edgeBottomLeft]} />
          <View style={[styles.edgeNotch, styles.edgeBottomRight]} />

          <View style={styles.chipArea}>
            <View style={styles.chip}>
              <Ionicons name="receipt-outline" size={18} color="#7D5B8A" />
              <Text style={styles.chipText}>Transaction successful</Text>
            </View>
          </View>

          <View style={styles.heroIcon}>
            <Ionicons name="checkmark-circle" size={48} color="#4B2C40" />
          </View>

          <Text style={styles.heroTitle}>Thank you!</Text>
          <Text style={styles.heroSubtitle}>Your payment was completed.</Text>

          <View style={styles.divider} />

          <View style={styles.detailGrid}>
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Title</Text>
              <Text
                style={styles.detailValue}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {normalizedTitle}
              </Text>
            </View>
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>
                {transaction ? formatCurrency(transaction.amount) : "-"}
              </Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formattedDate}</Text>
            </View>
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{formattedTime}</Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>
                {transaction?.category ?? "-"}
              </Text>
            </View>
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>
                {transaction?.type?.toUpperCase() ?? "-"}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.accountRow}>
              <View style={styles.accountIcon}>
                <Ionicons name="card-outline" size={18} color="#4B2C40" />
              </View>
              <View style={styles.accountCopy}>
                <Text style={styles.accountLabel}>Payment method</Text>
                <Text style={styles.accountValue}>
                  Tally Wallet • • • • 8234
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.barcodeArea}>
            <View style={styles.barcodeLine} />
            <View style={styles.barcodeTextRow}>
              <Text style={styles.barcodeText}>2</Text>
              <Text style={styles.barcodeText}>8</Text>
              <Text style={styles.barcodeText}>9</Text>
              <Text style={styles.barcodeText}>3</Text>
              <Text style={styles.barcodeText}>7</Text>
              <Text style={styles.barcodeText}>2</Text>
              <Text style={styles.barcodeText}>6</Text>
              <Text style={styles.barcodeText}>1</Text>
              <Text style={styles.barcodeText}>2</Text>
              <Text style={styles.barcodeText}>7</Text>
              <Text style={styles.barcodeText}>3</Text>
              <Text style={styles.barcodeText}>6</Text>
              <Text style={styles.barcodeText}>1</Text>
              <Text style={styles.barcodeText}>0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9FB",
  },
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EDF4",
  },
  backBtn: {
    width: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#20142A",
  },
  headerPlaceholder: {
    width: 40,
  },
  headerAction: {
    width: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  receiptCard: {
    position: "relative",
    backgroundColor: "#FFF",
    borderRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1ECF5",
    overflow: "visible",
  },
  edgeNotch: {
    position: "absolute",
    width: 34,
    height: 18,
    backgroundColor: "#FAF9FB",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  edgeBottomLeft: {
    left: 24,
    bottom: -9,
  },
  edgeBottomRight: {
    right: 24,
    bottom: -9,
  },
  chipArea: {
    alignItems: "center",
    marginBottom: 18,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5EFF8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chipText: {
    color: "#7D5B8A",
    fontSize: 12,
    fontWeight: "700",
  },
  heroIcon: {
    alignSelf: "center",
    backgroundColor: "#EEF3F8",
    borderRadius: 36,
    height: 72,
    width: 72,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  heroTitle: {
    textAlign: "center",
    color: "#251A2B",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  heroSubtitle: {
    textAlign: "center",
    color: "#817687",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0EDF4",
    marginVertical: 18,
  },
  detailGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  detailBlock: {
    flex: 1,
    minWidth: 0,
  },
  detailLabel: {
    color: "#8E7A9A",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.75,
    marginBottom: 8,
  },
  detailValue: {
    color: "#2C2033",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  cardFooter: {
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#FCF8FF",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accountIcon: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: "#E9E0F2",
    justifyContent: "center",
    alignItems: "center",
  },
  accountCopy: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7B6390",
    marginBottom: 6,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#20142A",
  },
  barcodeArea: {
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "#F0EDF4",
  },
  barcodeLine: {
    width: "100%",
    height: 68,
    backgroundColor: "#F4EFF4",
    borderRadius: 14,
    marginBottom: 10,
  },
  barcodeTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  barcodeText: {
    color: "#9A8EA3",
    fontSize: 10,
    letterSpacing: 1,
  },
});
