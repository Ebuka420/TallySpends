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
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { MOCK_RECIPIENTS, useAppStore } from "../src/store";

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { transactions: transactionsRaw, loading } = useAppStore();
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
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(
    null,
  );

  useEffect(() => {
    setSelectedCategory(params.category ?? null);
  }, [params.category]);

  // Block horizontal pan gestures inside the transactions list so rows cannot swipe
  const blockPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // intercept horizontal moves larger than vertical moves
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
        return { bg: "#FEF5ED", color: "#E67E22" };
      case "Transport":
        return { bg: "#F5EEF8", color: "#8E44AD" };
      case "Shopping":
        return { bg: "#FDEDEC", color: "#E74C3C" };
      case "Bills & Utilities":
        return { bg: "#EAF6EC", color: "#2ECC71" };
      case "Entertainment":
        return { bg: "#F4F6F7", color: "#7F8C8D" };
      case "Income":
        return { bg: "#EAF6EC", color: "#2ECC71" };
      default:
        return { bg: "#F5F5F5", color: "#555" };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- TOP HEADER BAR --- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Transactions</Text>
        <View style={styles.headerBtnPlaceholder} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#999" />
          <TextInput
            placeholder="Search transactions"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.filterRow}>
          {(["all", "day", "month", "year"] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setFilterMode(mode)}
              style={[
                styles.filterChip,
                filterMode === mode && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterMode === mode && styles.filterChipTextActive,
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
          ))}
          {filterMode !== "all" && (
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.filterChip}
            >
              <Text style={styles.filterChipText}>
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.ledgerCard} {...blockPanResponder.panHandlers}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => {
              const catStyle = getCategoryColor(tx.category);
              const displayTitle = normalizeTransferTitle(tx.title);
              return (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.row}
                  onPress={() => setSelectedTransaction(tx)}
                >
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
                  <View style={styles.infoCol}>
                    <Text style={styles.txTitleText}>{displayTitle}</Text>
                    <Text style={styles.txMeta}>
                      {tx.date} • {tx.category}
                    </Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text
                      style={[
                        styles.txAmount,
                        tx.type === "income"
                          ? styles.incomeText
                          : styles.expenseText,
                      ]}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loading
                  ? "Loading transactions..."
                  : "No matching logs found."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(selectedTransaction)}
        transparent
        animationType="slide"
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedTransaction(null)}
        >
          <Pressable style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Receipt</Text>
            {selectedTransaction ? (
              <View style={styles.receiptBody}>
                <Text style={styles.receiptLabel}>Title</Text>
                <Text style={styles.receiptText}>
                  {normalizeTransferTitle(selectedTransaction.title)}
                </Text>
                <Text style={styles.receiptLabel}>Amount</Text>
                <Text style={styles.receiptText}>
                  {formatCurrency(selectedTransaction.amount)}
                </Text>
                <Text style={styles.receiptLabel}>Category</Text>
                <Text style={styles.receiptText}>
                  {selectedTransaction.category}
                </Text>
                <Text style={styles.receiptLabel}>Date</Text>
                <Text style={styles.receiptText}>
                  {new Date(selectedTransaction.date).toLocaleDateString(
                    "en-US",
                  )}
                </Text>
                <Text style={styles.receiptLabel}>Type</Text>
                <Text style={styles.receiptText}>
                  {selectedTransaction.type.toUpperCase()}
                </Text>
                <TouchableOpacity
                  style={styles.receiptCloseBtn}
                  onPress={() => setSelectedTransaction(null)}
                >
                  <Text style={styles.receiptCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerBtnAdd: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4B2C40",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    backgroundColor: "#FAFAFA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipActive: {
    borderColor: "#4B2C40",
    backgroundColor: "#F6F3F5",
  },
  filterChipText: {
    fontSize: 12,
    color: "#666",
  },
  filterChipTextActive: {
    color: "#4B2C40",
    fontWeight: "600",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A1A",
    paddingVertical: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  ledgerCard: {
    backgroundColor: "#FAFAFA",
    minHeight: 300,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    backgroundColor: "#FFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  initialBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  initialText: {
    fontSize: 14,
    fontWeight: "700",
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
  },
  txTitleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  txMeta: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  txDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 6,
  },
  rightCol: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  incomeText: {
    color: "#2ECC71",
  },
  expenseText: {
    color: "#E74C3C",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalKeyboardView: {
    justifyContent: "flex-end",
  },
  modalScrollContent: {
    justifyContent: "flex-end",
    paddingTop: 16,
  },
  modalSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  cancelText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  modalBody: {
    gap: 16,
  },
  typeTabs: {
    flexDirection: "row",
    backgroundColor: "#F2EFEF",
    borderRadius: 10,
    padding: 2,
    marginBottom: 8,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  typeTabActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  typeTabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  typeTabTextActive: {
    color: "#4B2C40",
    fontWeight: "700",
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
    color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tagBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    backgroundColor: "#FFF",
  },
  tagBtnActive: {
    borderColor: "#4B2C40",
    backgroundColor: "#F6F3F5",
  },
  tagText: {
    fontSize: 12,
    color: "#666",
  },
  tagTextActive: {
    color: "#4B2C40",
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#4B2C40",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
