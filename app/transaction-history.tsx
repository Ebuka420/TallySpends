import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
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
import { MOCK_RECIPIENTS, useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { transactions: transactionsRaw, themePreference, themeMode } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const transactions = (transactionsRaw || []) as any[];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    params.category ?? null,
  );
  const [filterMode, setFilterMode] = useState<
    "all" | "day" | "month" | "year"
  >("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setSelectedCategory(params.category ?? null);
  }, [params.category]);

  // Block horizontal pan gestures inside the transactions list
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
    return transactions
      .filter((tx) => {
        const normalizedTitle = normalizeTransferTitle(tx.title);
        const matchesSearch = `${normalizedTitle} ${tx.category}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesCategory =
          !selectedCategory || tx.category === selectedCategory;
        if (!matchesSearch || !matchesCategory) return false;

        if (filterMode === "day") {
          return (
            new Date(tx.date).toDateString() === selectedDate.toDateString()
          );
        }

        if (filterMode === "month") {
          const txDate = new Date(tx.date);
          return (
            txDate.getMonth() === selectedDate.getMonth() &&
            txDate.getFullYear() === selectedDate.getFullYear()
          );
        }

        if (filterMode === "year") {
          return new Date(tx.date).getFullYear() === selectedDate.getFullYear();
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    transactions,
    normalizeTransferTitle,
    searchQuery,
    selectedCategory,
    filterMode,
    selectedDate,
  ]);

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
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Food & Dining":
        return { bg: isDark ? "#3A2113" : "#FEF5ED", color: "#E67E22" };
      case "Transport":
        return { bg: isDark ? "#281D33" : "#F5EEF8", color: "#8E44AD" };
      case "Shopping":
        return { bg: isDark ? "#3D1719" : "#FDEDEC", color: "#E74C3C" };
      case "Bills & Utilities":
        return { bg: isDark ? "#133E23" : "#EAF6EC", color: "#2ECC71" };
      case "Entertainment":
        return { bg: isDark ? "#27292C" : "#F4F6F7", color: "#95A5A6" };
      case "Income":
        return { bg: isDark ? "#133E23" : "#EAF6EC", color: "#2ECC71" };
      default:
        return { bg: isDark ? "#25262B" : "#F5F5F5", color: theme.textSecondary };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- TOP HEADER BAR --- */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          My Transactions
        </Text>
        <View style={styles.headerBtnPlaceholder} />
      </View>

      {/* Search & Filter Section */}
      <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
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
            placeholder="Search transactions"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholderTextColor={theme.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(["all", "day", "month", "year"] as const).map((mode) => {
            const isActive = filterMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                onPress={() => setFilterMode(mode)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive
                      ? theme.accent
                      : isDark ? theme.surfaceSoft : "#FFFFFF",
                    borderColor: isActive ? theme.accent : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isActive ? "#FFFFFF" : theme.textPrimary,
                      fontWeight: isActive ? "700" : "500",
                    },
                  ]}
                >
                  {mode === "all"
                    ? "All"
                    : mode === "day"
                    ? "Day"
                    : mode === "month"
                    ? "Month"
                    : "Year"}
                </Text>
              </TouchableOpacity>
            );
          })}

          {filterMode !== "all" && (
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isDark ? theme.surfaceSoft : "#FFFFFF",
                  borderColor: theme.accent,
                },
              ]}
            >
              <Ionicons name="calendar-outline" size={12} color={theme.accent} style={{ marginRight: 4 }} />
              <Text style={[styles.filterChipText, { color: theme.accent, fontWeight: "700" }]}>
                {filterMode === "day"
                  ? selectedDate.toLocaleDateString("en-US")
                  : filterMode === "month"
                  ? selectedDate.toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : selectedDate.getFullYear()}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Date Picker Component */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* Transactions List */}
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
                  onPress={() =>
                    router.push({
                      pathname: "/transaction-details",
                      params: { id: tx.id },
                    })
                  }
                  activeOpacity={0.7}
                >
                  {/* Category initial / icon box */}
                  <View
                    style={[
                      styles.initialBox,
                      { backgroundColor: catStyle.bg },
                    ]}
                  >
                    <Text
                      style={[styles.initialText, { color: catStyle.color }]}
                    >
                      {tx.category ? tx.category.charAt(0) : "T"}
                    </Text>
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
                      {tx.date} • {tx.category}
                    </Text>
                  </View>

                  {/* Amount Column */}
                  <View style={styles.rightCol}>
                    <Text
                      style={[
                        styles.amountText,
                        {
                          color: isIncome
                            ? isDark ? "#4ADE80" : "#15803D"
                            : theme.textPrimary,
                        },
                      ]}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(Math.abs(Number(tx.amount || 0)))}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={44} color={theme.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
                No transactions found
              </Text>
              <Text style={[styles.emptyStateSub, { color: theme.textSecondary }]}>
                {searchQuery
                  ? "Try searching for a different keyword or category."
                  : "You have no transactions for the selected period."}
              </Text>
            </View>
          )}
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
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerBtnPlaceholder: {
    width: 36,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
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
    fontSize: 14,
    height: "100%",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12.5,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  initialBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  initialText: {
    fontSize: 16,
    fontWeight: "800",
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  txTitleText: {
    fontSize: 14.5,
    fontWeight: "700",
    marginBottom: 3,
  },
  txMeta: {
    fontSize: 11.5,
  },
  rightCol: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 14.5,
    fontWeight: "800",
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
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
