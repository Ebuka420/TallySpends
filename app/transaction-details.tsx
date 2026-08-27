import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useMemo, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { MOCK_RECIPIENTS, useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

export default function TransactionDetailsScreen() {
  const router = useRouter();
  const receiptRef = useRef<View>(null);
  const params = useLocalSearchParams<{ id?: string }>();
  const { transactions: rawTransactions = [], themePreference, themeMode } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const transactions = rawTransactions as any[];
  const transaction = useMemo(
    () => transactions.find((tx) => tx.id === params.id),
    [params.id, transactions],
  );

  const normalizedTitle = transaction?.title
    ? transaction.title.replace(
        /(Transfer to\s+)@([a-zA-Z0-9_]+)/i,
        (_: string, prefix: string, username: string) => {
          const recipient = MOCK_RECIPIENTS.find(
            (r) => r.username.toLowerCase() === username.toLowerCase(),
          );
          return recipient
            ? `${prefix}${recipient.name}`
            : `Transfer to @${username}`;
        },
      )
    : "Transaction Receipt";

  const recipientUsername = transaction?.title?.match(
    /Transfer to\s+@([a-zA-Z0-9_]+)/i,
  )?.[1];

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
    if (!transaction || !receiptRef.current) return;
    try {
      if (!(await Sharing.isAvailableAsync())) return;
      const uri = await captureRef(receiptRef.current, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        width: 1080,
      });
      await Sharing.shareAsync(uri, {
        dialogTitle: "Share TallySpends receipt",
        mimeType: "image/png",
        UTI: "public.png",
      });
    } catch {
      // Keep the receipt on screen when sharing is cancelled or unavailable.
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Receipt</Text>
        <TouchableOpacity
          onPress={handleShareDetails}
          style={styles.headerAction}
        >
          <Ionicons name="share-outline" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View
          ref={receiptRef}
          collapsable={false}
          style={[
            styles.receiptCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View
            style={[
              styles.edgeNotch,
              styles.edgeBottomLeft,
              { backgroundColor: theme.background },
            ]}
          />
          <View
            style={[
              styles.edgeNotch,
              styles.edgeBottomRight,
              { backgroundColor: theme.background },
            ]}
          />

          <View style={styles.chipArea}>
            <View
              style={[
                styles.chip,
                { backgroundColor: isDark ? theme.surfaceSoft : "#F5EFF8" },
              ]}
            >
              <Ionicons name="receipt-outline" size={18} color={theme.accent} />
              <Text style={[styles.chipText, { color: theme.accent }]}>
                Transaction successful
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.heroIcon,
              { backgroundColor: isDark ? theme.surfaceSoft : "#EEF3F8" },
            ]}
          >
            <Ionicons name="checkmark-circle" size={48} color={theme.accent} />
          </View>

          <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
            Thank you!
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            Your payment was completed.
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.detailGrid}>
            <View style={styles.detailBlock}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                Title
              </Text>
              <Text
                style={[styles.detailValue, { color: theme.textPrimary }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {normalizedTitle}
              </Text>
            </View>
            <View style={styles.detailBlock}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                Amount
              </Text>
              <Text style={[styles.detailValue, { color: theme.accent, fontWeight: "800" }]}>
                {transaction ? formatCurrency(transaction.amount) : "-"}
              </Text>
            </View>
          </View>

          {recipientUsername ? (
            <View style={styles.detailGrid}>
              <View style={styles.detailBlock}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  Recipient
                </Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                  @{recipientUsername}
                </Text>
              </View>
              <View style={styles.detailBlock} />
            </View>
          ) : null}

          <View style={styles.detailGrid}>
            <View style={styles.detailBlock}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                Date
              </Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                {formattedDate}
              </Text>
            </View>
            <View style={styles.detailBlock}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                Time
              </Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                {formattedTime}
              </Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailBlock}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                Category
              </Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                {transaction?.category ?? "-"}
              </Text>
            </View>
            <View style={styles.detailBlock}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                Type
              </Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                {transaction?.type?.toUpperCase() ?? "-"}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.cardFooter,
              { backgroundColor: isDark ? theme.surfaceSoft : "#FCF8FF" },
            ]}
          >
            <View style={styles.accountRow}>
              <View
                style={[
                  styles.accountIcon,
                  { backgroundColor: isDark ? theme.surface : "#E9E0F2" },
                ]}
              >
                <Ionicons name="card-outline" size={18} color={theme.accent} />
              </View>
              <View style={styles.accountCopy}>
                <Text style={[styles.accountLabel, { color: theme.textSecondary }]}>
                  Payment method
                </Text>
                <Text style={[styles.accountValue, { color: theme.textPrimary }]}>
                  Tally Wallet • • • • 8234
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.barcodeArea, { borderTopColor: theme.border }]}>
            <View
              style={[
                styles.barcodeLine,
                { backgroundColor: isDark ? theme.surfaceSoft : "#F4EFF4" },
              ]}
            />
            <View style={styles.barcodeTextRow}>
              <Text style={[styles.barcodeText, { color: theme.textSecondary }]}>2</Text>
              <Text style={[styles.barcodeText, { color: theme.textSecondary }]}>8</Text>
              <Text style={[styles.barcodeText, { color: theme.textSecondary }]}>9</Text>
              <Text style={[styles.barcodeText, { color: theme.textSecondary }]}>3</Text>
              <Text style={[styles.barcodeText, { color: theme.textSecondary }]}>7</Text>
              <Text style={[styles.barcodeText, { color: theme.textSecondary }]}>2</Text>
              <Text style={[styles.barcodeText, { color: theme.textSecondary }]}>6</Text>
              <Text style={[styles.barcodeText, { color: theme.textSecondary }]}>1</Text>
              <Text style={[styles.barcodeText, { color: theme.textSecondary }]}>2</Text>
              <Text style={[styles.barcodeText, { color: theme.textSecondary }]}>7</Text>
              <Text style={[styles.barcodeText, { color: theme.textSecondary }]}>3</Text>
              <Text style={[styles.barcodeText, { color: theme.textSecondary }]}>6</Text>
              <Text style={[styles.barcodeText, { color: theme.textSecondary }]}>1</Text>
              <Text style={[styles.barcodeText, { color: theme.textSecondary }]}>0</Text>
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
  },
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
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
    borderRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    overflow: "visible",
  },
  edgeNotch: {
    position: "absolute",
    width: 34,
    height: 18,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  heroIcon: {
    alignSelf: "center",
    borderRadius: 36,
    height: 72,
    width: 72,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  heroTitle: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  heroSubtitle: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  divider: {
    height: 1,
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
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.75,
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  cardFooter: {
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
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
    justifyContent: "center",
    alignItems: "center",
  },
  accountCopy: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  barcodeArea: {
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 18,
    borderTopWidth: 1,
  },
  barcodeLine: {
    width: "100%",
    height: 68,
    borderRadius: 14,
    marginBottom: 10,
  },
  barcodeTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  barcodeText: {
    fontSize: 10,
    letterSpacing: 1,
  },
});
