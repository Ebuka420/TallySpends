import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  Platform,
  PanResponder,
  Animated,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../src/store";

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
    })
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

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const {
    transactions: transactionsRaw,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    loading,
  } = useAppStore();
  const transactions = (transactionsRaw || []) as any[];

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  
  // Form states
  const [txTitle, setTxTitle] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txCategory, setTxCategory] = useState("Food & Dining");

  // Categories list for transaction form
  const categories = [
    "Food & Dining",
    "Transport",
    "Shopping",
    "Bills & Utilities",
    "Entertainment",
    "Others",
  ];

  const handleAddSubmit = () => {
    const value = parseFloat(txAmount);
    if (!txTitle.trim() || isNaN(value) || value <= 0) return;

    addTransaction({
      title: txTitle.trim(),
      amount: value,
      category: txType === "income" ? "Income" : txCategory,
      type: txType,
      date: new Date().toISOString().slice(0, 10),
    });

    // Reset form
    setTxTitle("");
    setTxAmount("");
    setTxType("expense");
    setTxCategory("Food & Dining");
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = () => {
    const value = parseFloat(txAmount);
    if (!txTitle.trim() || isNaN(value) || value <= 0 || !selectedTx) return;

    updateTransaction({
      ...selectedTx,
      title: txTitle.trim(),
      amount: value,
      category: txType === "income" ? "Income" : txCategory,
      type: txType,
    });

    // Reset
    setTxTitle("");
    setTxAmount("");
    setSelectedTx(null);
    setIsEditModalOpen(false);
  };

  const openEditTx = (tx: any) => {
    setSelectedTx(tx);
    setTxTitle(tx.title);
    setTxAmount(String(tx.amount));
    setTxType(tx.type);
    setTxCategory(tx.category === "Income" ? "Food & Dining" : tx.category);
    setIsEditModalOpen(true);
  };

  const filteredTransactions = transactions.filter((tx) =>
    `${tx.title} ${tx.category}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return `$${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity
          style={styles.headerBtnAdd}
          onPress={() => setIsAddModalOpen(true)}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* --- SEARCH BAR --- */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#888" style={{ marginRight: 8 }} />
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

      {/* --- TRANSACTIONS LIST --- */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ledgerCard}>
          {filteredTransactions.map((tx) => {
            const catStyle = getCategoryColor(tx.category);
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
                      { text: "Delete", style: "destructive", onPress: () => deleteTransaction(tx.id) },
                    ]
                  );
                }}
              >
                <View style={styles.row}>
                  <View style={[styles.initialBox, { backgroundColor: catStyle.bg }]}>
                    <Text style={[styles.initialText, { color: catStyle.color }]}>
                      {tx.category ? tx.category.charAt(0) : "T"}
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.txTitleText}>{tx.title}</Text>
                    <Text style={styles.txMeta}>
                      {tx.date} • {tx.category}
                    </Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text
                      style={[
                        styles.txAmount,
                        tx.type === "income" && styles.incomeText,
                      ]}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </Text>
                  </View>
                </View>
              </SwipeableRow>
            );
          })}

          {filteredTransactions.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loading ? "Loading transactions..." : "No matching logs found."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* --- ADD TRANSACTION MODAL --- */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsAddModalOpen(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Transaction</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Type Selector Tabs */}
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

              {/* Title input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description / Title</Text>
                <TextInput
                  placeholder="e.g. Starbucks, Groceries..."
                  value={txTitle}
                  onChangeText={setTxTitle}
                  style={styles.textInput}
                  placeholderTextColor="#888"
                />
              </View>

              {/* Amount input */}
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

              {/* Category picker tags (only for Expense) */}
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

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddSubmit}>
                <Text style={styles.saveBtnText}>Save Transaction</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* --- EDIT TRANSACTION MODAL --- */}
      <Modal visible={isEditModalOpen} transparent animationType="slide">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsEditModalOpen(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Transaction</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Type Selector Tabs */}
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

              {/* Title input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description / Title</Text>
                <TextInput
                  placeholder="e.g. Starbucks, Groceries..."
                  value={txTitle}
                  onChangeText={setTxTitle}
                  style={styles.textInput}
                  placeholderTextColor="#888"
                />
              </View>

              {/* Amount input */}
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

              {/* Category picker tags (only for Expense) */}
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

              <TouchableOpacity style={styles.saveBtn} onPress={handleEditSubmit}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
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
    paddingHorizontal: 14,
    paddingVertical: 14,
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
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  rightCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  incomeText: {
    color: "#2ECC71",
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
  modalSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
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
  /* Swipeable Row Styles */
  swipeContainer: {
    position: "relative",
    overflow: "hidden",
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
    width: 120,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 1,
  },
  swipeActionBtn: {
    width: 60,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

