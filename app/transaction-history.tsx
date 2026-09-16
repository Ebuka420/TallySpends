import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import TransactionReceiptModal from "../components/TransactionReceiptModal";
import { MOCK_RECIPIENTS, useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

const CATEGORY_LIST = [
  "All",
  "Food & Dining",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Income",
  "Others",
];

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { transactions: transactionsRaw, themePreference, themeMode } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const transactions = (transactionsRaw || []) as any[];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    params.category || "All",
  );
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
    }
  }, [params.category]);

  const blockPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 8
        );
      },
      onPanResponderMove: () => {},
      onPanResponderRelease: () => {},
    }),
  ).current;

  const normalizeTransferTitle = (title: string) => {
    const transferRegex = /(Transfer to\s+)@([a-zA-Z0-9_]+)/i;
    return title.replace(transferRegex, (_, prefix, username) => {
      const recipient = MOCK_RECIPIENTS.find(
        (r) => r.username.toLowerCase() === username.toLowerCase(),
      );
      return recipient
        ? `${prefix}${recipient.name}`
        : `Transfer to @${username}`;
    });
  };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return transactions
      .filter((tx) => {
        const normalizedTitle = normalizeTransferTitle(tx.title || "");
        const matchesSearch = `${normalizedTitle} ${tx.category || ""}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        // Type filter
        if (typeFilter !== "all" && tx.type !== typeFilter) return false;

        // Category filter
        if (selectedCategory !== "All" && tx.category !== selectedCategory) return false;

        // Time filter
        const txTime = new Date(tx.date || 0).getTime();
        if (timeFilter === "today" && txTime < startOfToday) return false;
        if (timeFilter === "week" && txTime < oneWeekAgo) return false;
        if (timeFilter === "month" && txTime < startOfMonth) return false;
        if (timeFilter === "custom") {
          return new Date(tx.date).toDateString() === selectedDate.toDateString();
        }

        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(a.date || 0).getTime();
        const bTime = new Date(b.date || 0).getTime();
        const aAmt = Number(a.amount || 0);
        const bAmt = Number(b.amount || 0);

        if (sortOrder === "newest") return bTime - aTime;
        if (sortOrder === "oldest") return aTime - bTime;
        if (sortOrder === "highest") return bAmt - aAmt;
        if (sortOrder === "lowest") return aAmt - bAmt;
        return bTime - aTime;
      });
  }, [
    transactions,
    searchQuery,
    typeFilter,
    selectedCategory,
    timeFilter,
    sortOrder,
    selectedDate,
  ]);

  // Aggregate metrics for filtered data
  const metrics = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    filteredTransactions.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      if (tx.type === "income") {
        totalIn += amt;
      } else {
        totalOut += amt;
      }
    });
    return {
      totalIn,
      totalOut,
      net: totalIn - totalOut,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const formatCurrency = (val: number) => {
    return `₦${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selected) {
      setSelectedDate(selected);
      setTimeFilter("custom");
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Food & Dining":
        return { bg: isDark ? "#3A2113" : "#FEF5ED", color: "#E67E22", icon: "restaurant-outline" };
      case "Transport":
        return { bg: isDark ? "#1E293B" : "#EFF6FF", color: "#3B82F6", icon: "car-outline" };
      case "Shopping":
        return { bg: isDark ? "#3D1719" : "#FDEDEC", color: "#EC4899", icon: "bag-handle-outline" };
      case "Bills & Utilities":
        return { bg: isDark ? "#133E23" : "#EAF6EC", color: "#10B981", icon: "document-text-outline" };
      case "Entertainment":
        return { bg: isDark ? "#281D33" : "#F5EEF8", color: "#8B5CF6", icon: "film-outline" };
      case "Income":
        return { bg: isDark ? "#133E23" : "#EAF6EC", color: "#22C55E", icon: "arrow-down-outline" };
      default:
        return { bg: isDark ? "#25262B" : "#F5F5F5", color: theme.textSecondary, icon: "grid-outline" };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Bar */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Transaction History
        </Text>
        <TouchableOpacity
          onPress={() => {
            // Cycle sort order
            const nextSort =
              sortOrder === "newest"
                ? "highest"
                : sortOrder === "highest"
                  ? "lowest"
                  : sortOrder === "lowest"
                    ? "oldest"
                    : "newest";
            setSortOrder(nextSort);
          }}
          style={[styles.sortBtn, { backgroundColor: theme.surfaceSoft }]}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-vertical" size={16} color={theme.accent} />
          <Text style={[styles.sortBtnText, { color: theme.accent }]}>
            {sortOrder.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Section */}
      <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
        {/* Search Bar */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
          <TextInput
            placeholder="Search by name, note, or category..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholderTextColor={theme.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Type Filter Segmented Control */}
        <View style={styles.typeSegmentRow}>
          {[
            { id: "all", label: "All Types" },
            { id: "expense", label: "Expenses" },
            { id: "income", label: "Income" },
          ].map((item) => {
            const isActive = typeFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setTypeFilter(item.id as any)}
                style={[
                  styles.typeSegmentBtn,
                  {
                    backgroundColor: isActive ? theme.accent : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.typeSegmentText,
                    { color: isActive ? "#FFFFFF" : theme.textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Horizontal Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContainer}
        >
          {CATEGORY_LIST.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryFilterChip,
                  {
                    backgroundColor: isSelected ? theme.accent : theme.surface,
                    borderColor: isSelected ? theme.accent : theme.border,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.categoryFilterChipText,
                    { color: isSelected ? "#FFFFFF" : theme.textPrimary },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Timeframe Chips */}
        <View style={styles.timeframeRow}>
          {[
            { id: "all", label: "All Time" },
            { id: "today", label: "Today" },
            { id: "week", label: "This Week" },
            { id: "month", label: "This Month" },
          ].map((t) => {
            const isActive = timeFilter === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTimeFilter(t.id as any)}
                style={[
                  styles.timeChip,
                  {
                    backgroundColor: isActive ? theme.accentSoft : "transparent",
                    borderColor: isActive ? theme.accent : theme.border,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.timeChipText,
                    { color: isActive ? theme.accent : theme.textSecondary },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.timeChip,
              {
                backgroundColor: timeFilter === "custom" ? theme.accentSoft : "transparent",
                borderColor: timeFilter === "custom" ? theme.accent : theme.border,
              },
            ]}
            activeOpacity={0.75}
          >
            <Ionicons name="calendar-outline" size={13} color={theme.accent} />
            <Text
              style={[
                styles.timeChipText,
                { color: timeFilter === "custom" ? theme.accent : theme.textSecondary },
              ]}
            >
              {timeFilter === "custom"
                ? selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "Pick Date"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Summary Strip */}
        <View style={[styles.metricsStrip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View>
            <Text style={[styles.metricsStripLabel, { color: theme.textSecondary }]}>
              {metrics.count} Transactions
            </Text>
            <Text style={[styles.metricsStripNet, { color: theme.textPrimary }]}>
              Net: {formatCurrency(metrics.net)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.metricsStripLabel, { color: theme.textSecondary }]}>Inflow</Text>
              <Text style={[styles.metricsStripIn, { color: theme.success }]}>
                +{formatCurrency(metrics.totalIn)}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.metricsStripLabel, { color: theme.textSecondary }]}>Outflow</Text>
              <Text style={[styles.metricsStripOut, { color: theme.danger || "#EF4444" }]}>
                -{formatCurrency(metrics.totalOut)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* Transactions Scroll List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.ledgerCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          {...blockPanResponder.panHandlers}
        >
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx, idx) => {
              const catStyle = getCategoryColor(tx.category);
              const displayTitle = normalizeTransferTitle(tx.title);
              const isIncome = tx.type === "income";

              return (
                <TouchableOpacity
                  key={tx.id || idx}
                  style={[
                    styles.row,
                    {
                      borderBottomColor: theme.border,
                      borderBottomWidth: idx === filteredTransactions.length - 1 ? 0 : 1,
                    },
                  ]}
                  onPress={() => setSelectedTx(tx)}
                  activeOpacity={0.72}
                >
                  {/* Category icon circle */}
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: catStyle.bg },
                    ]}
                  >
                    <Ionicons name={catStyle.icon as any} size={18} color={catStyle.color} />
                  </View>

                  {/* Info Column */}
                  <View style={styles.infoCol}>
                    <Text
                      style={[styles.txTitleText, { color: theme.textPrimary }]}
                      numberOfLines={1}
                    >
                      {displayTitle}
                    </Text>
                    <Text style={[styles.txMeta, { color: theme.textSecondary }]}>
                      {tx.date || "Today"} • {tx.category || "General"}
                    </Text>
                  </View>

                  {/* Amount Column */}
                  <View style={styles.rightCol}>
                    <Text
                      style={[
                        styles.amountText,
                        {
                          color: isIncome
                            ? theme.success
                            : theme.textPrimary,
                        },
                      ]}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(Math.abs(Number(tx.amount || 0)))}
                    </Text>
                    <View style={styles.receiptActionHint}>
                      <Text style={[styles.receiptActionHintText, { color: theme.accent }]}>
                        Receipt
                      </Text>
                      <Ionicons name="chevron-forward" size={11} color={theme.accent} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
                No transactions found
              </Text>
              <Text style={[styles.emptyStateSub, { color: theme.textSecondary }]}>
                {searchQuery
                  ? "No records match your search keyword."
                  : "No transactions found under the selected filters."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        visible={!!selectedTx}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sortBtnText: {
    fontSize: 10,
    fontWeight: "800",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    height: "100%",
  },
  typeSegmentRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  typeSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  typeSegmentText: {
    fontSize: 12,
    fontWeight: "700",
  },
  categoryScrollContainer: {
    gap: 8,
    paddingVertical: 10,
  },
  categoryFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryFilterChipText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  timeframeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  metricsStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 2,
  },
  metricsStripLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  metricsStripNet: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  metricsStripIn: {
    fontSize: 12,
    fontWeight: "700",
  },
  metricsStripOut: {
    fontSize: 12,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  ledgerCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  txTitleText: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  txMeta: {
    fontSize: 11,
  },
  rightCol: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 14,
    fontWeight: "800",
  },
  receiptActionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  receiptActionHintText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  emptyState: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateSub: {
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
  },
});

