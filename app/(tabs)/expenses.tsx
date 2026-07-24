import { Ionicons, Octicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
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
import { useAppStore } from "../../src/store";

type TimePeriod = "today" | "week" | "month" | "custom";

interface Transaction {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  type: "income" | "expense";
}

// SwipeableRow Component using PanResponder and Animated
const SwipeableRow = ({
  children,
  onEdit,
  onDelete,
}: {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = gestureState.dx;
        if (newX < 0) {
          translateX.setValue(Math.max(-120, newX));
        } else {
          translateX.setValue(Math.min(0, newX));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -60) {
          Animated.spring(translateX, {
            toValue: -120,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  const closeRow = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.swipeActionsBackground}>
        <TouchableOpacity
          style={[styles.swipeActionBtn, { backgroundColor: "#F5EBDF" }]}
          onPress={() => {
            closeRow();
            onEdit();
          }}
        >
          <Ionicons name="pencil" size={16} color="#A04000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeActionBtn, { backgroundColor: "#FADBD8" }]}
          onPress={() => {
            closeRow();
            onDelete();
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#C0392B" />
        </TouchableOpacity>
      </View>
      <Animated.View
        style={{ transform: [{ translateX }], backgroundColor: "#FFF" }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

export default function ExpensesScreen() {
  const router = useRouter();
  const {
    transactions: transactionsRaw,
    addTransaction,
    deleteTransaction,
    updateTransaction,
  } = useAppStore();
  const transactions = (transactionsRaw || []) as any[];

  const [activeTab, setActiveTab] = useState<TimePeriod>("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2024, 4, 1)); // May 2024 baseline
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Filter/Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "latest" | "oldest" | "highest" | "lowest"
  >("latest");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Add / Edit transaction modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  // Modal Form States
  const [txTitle, setTxTitle] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txCategory, setTxCategory] = useState("Food & Dining");

  const categories = [
    "Food & Dining",
    "Transport",
    "Shopping",
    "Bills & Utilities",
    "Entertainment",
    "Others",
  ];

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  // --- DRAGGABLE FAB PAN RESPONDER ---
  const pan = useRef(new Animated.ValueXY()).current;
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const listenerId = pan.addListener((value) => {
      offsetRef.current = value;
    });
    return () => pan.removeListener(listenerId);
  }, [pan]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: offsetRef.current.x,
          y: offsetRef.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          setIsAddModalOpen(true);
        }
      },
    }),
  ).current;

  // Filter transactions by activeTime period and category and search query
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search query filter
        const matchesSearch =
          tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.category.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        // Category filter
        if (selectedCategory && tx.category !== selectedCategory) return false;

        // Date-based filter
        const txDate = new Date(tx.date);
        const today = new Date();

        if (activeTab === "today") {
          return (
            txDate.getDate() === today.getDate() &&
            txDate.getMonth() === today.getMonth() &&
            txDate.getFullYear() === today.getFullYear()
          );
        }

        if (activeTab === "week") {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(today.getDate() - 7);
          return txDate >= oneWeekAgo && txDate <= today;
        }

        if (activeTab === "month") {
          const baselineMonth = selectedDate.getMonth();
          const baselineYear = selectedDate.getFullYear();
          return (
            txDate.getMonth() === baselineMonth &&
            txDate.getFullYear() === baselineYear
          );
        }

        if (activeTab === "custom") {
          // Filter by selected baseline date (month)
          const targetMonth = selectedDate.getMonth();
          const targetYear = selectedDate.getFullYear();
          return (
            txDate.getMonth() === targetMonth &&
            txDate.getFullYear() === targetYear
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "latest") {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortBy === "oldest") {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (sortBy === "highest") {
          return b.amount - a.amount;
        } else {
          return a.amount - b.amount;
        }
      });
  }, [
    transactions,
    activeTab,
    selectedDate,
    searchQuery,
    selectedCategory,
    sortBy,
  ]);

  const previewTransactions = filteredTransactions.slice(0, 3);

  // Compute category breakdown totals for the active month
  const categorySummary = useMemo(() => {
    const summary: { [key: string]: number } = {
      "Food & Dining": 0,
      Transport: 0,
      Shopping: 0,
      "Bills & Utilities": 0,
      Entertainment: 0,
      Others: 0,
    };

    let total = 0;
    transactions.forEach((tx) => {
      // Limit category breakdown to transactions in current filtered range/baseline
      const txDate = new Date(tx.date);
      if (
        tx.type === "expense" &&
        txDate.getMonth() === selectedDate.getMonth() &&
        txDate.getFullYear() === selectedDate.getFullYear()
      ) {
        total += tx.amount;
        if (summary[tx.category] !== undefined) {
          summary[tx.category] += tx.amount;
        } else {
          summary["Others"] += tx.amount;
        }
      }
    });

    return { summary, total };
  }, [transactions, selectedDate]);

  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case "Food & Dining":
        return {
          icon: "fast-food-outline" as any,
          color: "#E67E22",
          bg: "#FDF2E9",
        };
      case "Transport":
        return { icon: "car-outline" as any, color: "#8E44AD", bg: "#F4ECF7" };
      case "Shopping":
        return {
          icon: "bag-handle-outline" as any,
          color: "#E74C3C",
          bg: "#FDEDEC",
        };
      case "Bills & Utilities":
        return {
          icon: "document-text-outline" as any,
          color: "#2ECC71",
          bg: "#EAF6EC",
        };
      case "Entertainment":
        return { icon: "film-outline" as any, color: "#7F8C8D", bg: "#F4F6F7" };
      default:
        return {
          icon: "ellipsis-horizontal-outline" as any,
          color: "#5DADE2",
          bg: "#EBF5FB",
        };
    }
  };

  const handleAddSubmit = () => {
    const amountVal = parseFloat(txAmount);
    if (!txTitle.trim() || isNaN(amountVal) || amountVal <= 0) {
      Alert.alert("Error", "Please fill in all transaction fields correctly.");
      return;
    }

    addTransaction({
      title: txTitle.trim(),
      amount: amountVal,
      category: txType === "income" ? "Income" : txCategory,
      type: txType,
      date: new Date().toISOString().slice(0, 10),
    });

    setIsAddModalOpen(false);
    setTxTitle("");
    setTxAmount("");
    setTxType("expense");
    setTxCategory("Food & Dining");
  };

  const handleEditSubmit = () => {
    const amountVal = parseFloat(txAmount);
    if (!txTitle.trim() || isNaN(amountVal) || amountVal <= 0 || !selectedTx) {
      Alert.alert("Error", "Please fill in all transaction fields correctly.");
      return;
    }

    updateTransaction({
      ...selectedTx,
      title: txTitle.trim(),
      amount: amountVal,
      category: txType === "income" ? "Income" : txCategory,
      type: txType,
    });

    setIsEditModalOpen(false);
    setSelectedTx(null);
    setTxTitle("");
    setTxAmount("");
  };

  const openEditTx = (tx: any) => {
    setSelectedTx(tx);
    setTxTitle(tx.title);
    setTxAmount(String(tx.amount));
    setTxType(tx.type);
    setTxCategory(tx.category === "Income" ? "Food & Dining" : tx.category);
    setIsEditModalOpen(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- TOP NAVIGATION BAR --- */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Expenses</Text>
        <View style={styles.headerRightIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsSortOpen(true)}
          >
            <Octicons name="sliders" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- TIME PERIOD TABS --- */}
        <View style={styles.tabContainer}>
          {(["today", "week", "month", "custom"] as TimePeriod[]).map(
            (period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.tabButton,
                  activeTab === period && styles.activeTabButton,
                ]}
                onPress={() => {
                  setActiveTab(period);
                  if (period === "custom" || period === "month") {
                    setShowDatePicker(true);
                  }
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === period && styles.activeTabText,
                  ]}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>

        {/* --- SEARCH BAR --- */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={18}
              color="#888"
              style={{ marginRight: 8 }}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search items, categories..."
              placeholderTextColor="#888"
              style={styles.searchInput}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color="#BBB" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* --- TOTAL EXPENSES CARD --- */}
        <View style={styles.summaryCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={styles.summaryAmount}>
                $
                {categorySummary.total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text style={styles.summaryTrend}>🔹 Current Baseline</Text>
            </View>
            <TouchableOpacity
              style={styles.monthDropdown}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.monthDropdownText}>
                {formatMonthYear(selectedDate)}
              </Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color="#666"
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Transactions</Text>
              <Text style={styles.metricValue}>
                {filteredTransactions.length}
              </Text>
              <Text style={styles.metricSubText}>Total matching logs</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Average Purchase</Text>
              <Text style={styles.metricValue}>
                $
                {filteredTransactions.length > 0
                  ? (
                      filteredTransactions.reduce(
                        (sum, tx) => sum + tx.amount,
                        0,
                      ) / filteredTransactions.length
                    ).toFixed(2)
                  : "0.00"}
              </Text>
              <Text style={styles.metricSubText}>Per transaction</Text>
            </View>
          </View>
        </View>

        {/* --- EXPENSE CATEGORIES SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expense Categories</Text>
          {selectedCategory && (
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <Text
                style={{ fontSize: 12, color: "#E74C3C", fontWeight: "600" }}
              >
                Clear Filter
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesRow}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {categories.map((cat) => {
            const amt = categorySummary.summary[cat] || 0;
            const pctVal =
              categorySummary.total > 0
                ? (amt / categorySummary.total) * 100
                : 0;
            const details = getCategoryDetails(cat);
            const isSelected = selectedCategory === cat;

            return (
              <TouchableOpacity
                key={cat}
                onPress={() =>
                  router.push({
                    pathname: "/transaction-history",
                    params: { category: cat },
                  })
                }
                style={[
                  styles.categoryCard,
                  isSelected && {
                    borderColor: details.color,
                    borderWidth: 1.5,
                  },
                ]}
              >
                <View
                  style={[styles.iconFrame, { backgroundColor: details.bg }]}
                >
                  <Ionicons
                    name={details.icon}
                    size={18}
                    color={details.color}
                  />
                </View>
                <Text style={styles.catName} numberOfLines={1}>
                  {cat}
                </Text>
                <Text style={styles.catAmount}>${amt.toFixed(2)}</Text>
                <Text style={styles.catPercent}>{Math.round(pctVal)}%</Text>
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${pctVal}%`, backgroundColor: details.color },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* --- TRANSACTION HISTORY PREVIEW --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Transactions</Text>
          <TouchableOpacity
            style={styles.sortDropdown}
            onPress={() => router.push("/transaction-history")}
          >
            <Text style={styles.sortDropdownText}>View all</Text>
            <Ionicons name="chevron-forward" size={12} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.previewCard}>
          {previewTransactions.map((tx) => {
            const details = getCategoryDetails(tx.category);
            return (
              <SwipeableRow
                key={tx.id}
                onEdit={() => openEditTx(tx)}
                onDelete={() => {
                  Alert.alert(
                    "Delete Transaction",
                    `Are you sure you want to delete "${tx.title}"?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => deleteTransaction(tx.id),
                      },
                    ],
                  );
                }}
              >
                <View style={styles.txRow}>
                  <View
                    style={[
                      styles.txIconBox,
                      {
                        backgroundColor:
                          tx.type === "income" ? "#EAF6EC" : details.bg,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        tx.type === "income"
                          ? "arrow-up-circle-outline"
                          : details.icon
                      }
                      size={16}
                      color={tx.type === "income" ? "#2ECC71" : details.color}
                    />
                  </View>
                  <View style={styles.txDetails}>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <Text style={styles.txSub}>
                      {tx.category} • {tx.date}
                    </Text>
                  </View>
                  <View style={styles.txAmountBox}>
                    <Text
                      style={[
                        styles.txAmount,
                        tx.type === "income"
                          ? styles.incomeAmount
                          : styles.expenseAmount,
                      ]}
                    >
                      {tx.type === "income"
                        ? `+$${tx.amount.toFixed(2)}`
                        : `-$${tx.amount.toFixed(2)}`}
                    </Text>
                  </View>
                </View>
              </SwipeableRow>
            );
          })}

          {previewTransactions.length === 0 && (
            <Text
              style={{
                textAlign: "center",
                color: "#888",
                paddingVertical: 24,
              }}
            >
              No matching transactions found.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* --- DATE PICKER MODAL --- */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* --- ADD TRANSACTION MODAL --- */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsAddModalOpen(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            style={styles.modalKeyboardView}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Transaction</Text>
                  <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.typeTabs}>
                    <TouchableOpacity
                      style={[
                        styles.typeTab,
                        txType === "expense" && styles.typeTabActive,
                      ]}
                      onPress={() => setTxType("expense")}
                    >
                      <Text
                        style={[
                          styles.typeTabText,
                          txType === "expense" && styles.typeTabTextActive,
                        ]}
                      >
                        Expense
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeTab,
                        txType === "income" && styles.typeTabActive,
                      ]}
                      onPress={() => setTxType("income")}
                    >
                      <Text
                        style={[
                          styles.typeTabText,
                          txType === "income" && styles.typeTabTextActive,
                        ]}
                      >
                        Income
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Title</Text>
                    <TextInput
                      placeholder="e.g. Starbucks, Salary..."
                      value={txTitle}
                      onChangeText={setTxTitle}
                      style={styles.textInput}
                      placeholderTextColor="#888"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Amount ($)</Text>
                    <TextInput
                      placeholder="0.00"
                      value={txAmount}
                      onChangeText={setTxAmount}
                      keyboardType="numeric"
                      style={styles.textInput}
                      placeholderTextColor="#888"
                    />
                  </View>

                  {txType === "expense" && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Category</Text>
                      <View style={styles.tagsContainer}>
                        {categories.map((cat) => (
                          <TouchableOpacity
                            key={cat}
                            onPress={() => setTxCategory(cat)}
                            style={[
                              styles.tagBtn,
                              txCategory === cat && styles.tagBtnActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.tagText,
                                txCategory === cat && styles.tagTextActive,
                              ]}
                            >
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleAddSubmit}
                  >
                    <Text style={styles.saveBtnText}>Save Transaction</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* --- EDIT TRANSACTION MODAL --- */}
      <Modal visible={isEditModalOpen} transparent animationType="slide">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsEditModalOpen(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            style={styles.modalKeyboardView}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Transaction</Text>
                  <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.typeTabs}>
                    <TouchableOpacity
                      style={[
                        styles.typeTab,
                        txType === "expense" && styles.typeTabActive,
                      ]}
                      onPress={() => setTxType("expense")}
                    >
                      <Text
                        style={[
                          styles.typeTabText,
                          txType === "expense" && styles.typeTabTextActive,
                        ]}
                      >
                        Expense
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeTab,
                        txType === "income" && styles.typeTabActive,
                      ]}
                      onPress={() => setTxType("income")}
                    >
                      <Text
                        style={[
                          styles.typeTabText,
                          txType === "income" && styles.typeTabTextActive,
                        ]}
                      >
                        Income
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Title</Text>
                    <TextInput
                      placeholder="e.g. Starbucks, Salary..."
                      value={txTitle}
                      onChangeText={setTxTitle}
                      style={styles.textInput}
                      placeholderTextColor="#888"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Amount ($)</Text>
                    <TextInput
                      placeholder="0.00"
                      value={txAmount}
                      onChangeText={setTxAmount}
                      keyboardType="numeric"
                      style={styles.textInput}
                      placeholderTextColor="#888"
                    />
                  </View>

                  {txType === "expense" && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Category</Text>
                      <View style={styles.tagsContainer}>
                        {categories.map((cat) => (
                          <TouchableOpacity
                            key={cat}
                            onPress={() => setTxCategory(cat)}
                            style={[
                              styles.tagBtn,
                              txCategory === cat && styles.tagBtnActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.tagText,
                                txCategory === cat && styles.tagTextActive,
                              ]}
                            >
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleEditSubmit}
                  >
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* --- SORT BY MODAL --- */}
      <Modal visible={isSortOpen} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsSortOpen(false)}
        >
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Sort Transactions By</Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              {[
                { id: "latest", label: "📅 Latest Date" },
                { id: "oldest", label: "📅 Oldest Date" },
                { id: "highest", label: "💰 Highest Amount" },
                { id: "lowest", label: "💰 Lowest Amount" },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => {
                    setSortBy(opt.id as any);
                    setIsSortOpen(false);
                  }}
                  style={[
                    styles.optionMenuBtn,
                    sortBy === opt.id && {
                      borderColor: "#4B2C40",
                      backgroundColor: "#F6F3F5",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionMenuBtnText,
                      sortBy === opt.id && { color: "#4B2C40" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* --- DRAGGABLE FAB --- */}
      <Animated.View
        style={[
          styles.fabWrapper,
          styles.fabButton,
          { transform: pan.getTranslateTransform() },
        ]}
        {...panResponder.panHandlers}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </Animated.View>

      {/* --- STICKY FOOTER NAVIGATION --- */}
      <View style={styles.footerNav}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/expenses" as any)}
        >
          <Ionicons name="home-outline" size={22} color="#666666" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/expenses")}
        >
          <Ionicons name="document-text-sharp" size={22} color="#4B2C40" />
          <Text style={[styles.footerText, styles.activeFooterText]}>
            Expenses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/budget")}
        >
          <Ionicons name="wallet-outline" size={22} color="#666666" />
          <Text style={styles.footerText}>Budget</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/analytics")}
        >
          <Ionicons name="bar-chart-outline" size={22} color="#666666" />
          <Text style={styles.footerText}>Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/more")}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#666666" />
          <Text style={styles.footerText}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    paddingBottom: 140,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
  },
  headerSpacer: {
    width: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
    justifyContent: "flex-end",
  },
  iconButton: {
    marginLeft: 14,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: "#4B2C40",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666666",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 6,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A1A",
    paddingVertical: 8,
  },
  summaryCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginVertical: 4,
  },
  summaryTrend: {
    fontSize: 12,
    color: "#27AE60",
    fontWeight: "500",
  },
  monthDropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  monthDropdownText: {
    fontSize: 12,
    color: "#4A4A4A",
    fontWeight: "500",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#FAFAFA",
    paddingTop: 12,
    marginTop: 12,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: "#888",
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginVertical: 2,
  },
  metricSubText: {
    fontSize: 9,
    color: "#AAA",
  },
  metricDivider: {
    width: 1,
    backgroundColor: "#EAEAEA",
    marginHorizontal: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  categoriesRow: {
    paddingLeft: 16,
  },
  categoryCard: {
    width: 110,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  iconFrame: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  catName: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  catAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 2,
  },
  catPercent: {
    fontSize: 10,
    color: "#AAA",
    marginTop: 4,
  },
  progressBg: {
    height: 3,
    backgroundColor: "#F0F0F0",
    borderRadius: 2,
    marginTop: 4,
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  sortDropdown: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortDropdownText: {
    fontSize: 12,
    color: "#666",
    marginRight: 4,
  },
  previewCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 16,
  },
  txRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingRight: 104,
    alignItems: "center",
  },
  txIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  txDetails: {
    flex: 1,
    marginLeft: 12,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  txSub: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  txAmountBox: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  incomeAmount: {
    color: "#2ECC71",
  },
  expenseAmount: {
    color: "#E74C3C",
  },
  txMethod: {
    fontSize: 10,
    color: "#AAA",
    marginTop: 2,
  },
  fabWrapper: {
    position: "absolute",
    bottom: 90,
    right: 16,
    zIndex: 999,
  },
  fabButton: {
    backgroundColor: "#4B2C40",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  footerNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 74,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
    paddingBottom: Platform.OS === "ios" ? 15 : 0,
  },
  footerItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    flex: 1,
  },
  footerText: {
    fontSize: 11,
    color: "#666666",
    marginTop: 4,
    fontWeight: "500",
  },
  activeFooterText: {
    color: "#4B2C40",
    fontWeight: "600",
  },
  /* Custom Swipe Row Styles */
  swipeContainer: {
    position: "relative",
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    backgroundColor: "#FFF",
  },
  swipeActionsBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 94,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 1,
    paddingRight: 8,
  },
  swipeActionBtn: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EADFD9",
    marginLeft: 6,
  },
  /* Modal backdrop & sheets styles */
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
    paddingTop: 20,
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
  alertBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    alignSelf: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  optionMenuBtn: {
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 10,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  optionMenuBtnText: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "600",
  },
});
