import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { useAppStore } from "../src/store";

export default function BudgetScreen() {
  const router = useRouter();
  const {
    transactions: transactionsRaw,
    budgets: budgetsRaw,
    savingsGoals: savingsGoalsRaw,
    updateBudget,
    deleteBudget,
    addSavingsGoal,
    deleteSavingsGoal,
    updateSavingsGoal,
  } = useAppStore();

  const transactions = (transactionsRaw || []) as any[];
  const savingsGoals = (savingsGoalsRaw || []) as any[];
  const budgets = (budgetsRaw || {}) as any;

  // Add budget state
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [addBudgetCateg, setAddBudgetCateg] = useState("Food & Dining");
  const [addBudgetLimit, setAddBudgetLimit] = useState("");

  // Add savings goal state
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalSaved, setGoalSaved] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCategory, setGoalCategory] = useState("gift"); // gift, party, health, other

  // Edit / Action modal states
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string | null>(null);
  const [isBudgetOptionsOpen, setIsBudgetOptionsOpen] = useState(false);
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [editBudgetLimit, setEditBudgetLimit] = useState("");

  // Goal options
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isGoalOptionsOpen, setIsGoalOptionsOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [editGoalSaved, setEditGoalSaved] = useState("");
  const [editGoalTarget, setEditGoalTarget] = useState("");

  // View All Goals list state
  const [isViewAllGoalsOpen, setIsViewAllGoalsOpen] = useState(false);

  // Dynamic calculations
  const categorySpending = useMemo(() => {
    const spending: { [key: string]: number } = {
      "Food & Dining": 0,
      "Transport": 0,
      "Shopping": 0,
      "Bills & Utilities": 0,
      "Entertainment": 0,
      "Others": 0,
    };
    transactions.forEach((t) => {
      if (t.type === "expense") {
        if (spending[t.category] !== undefined) {
          spending[t.category] += t.amount;
        } else {
          spending["Others"] += t.amount;
        }
      }
    });
    return spending;
  }, [transactions]);

  const totalSpent = useMemo(() => {
    return Object.values(categorySpending).reduce((sum: number, v: any) => sum + (v || 0), 0);
  }, [categorySpending]);

  const totalBudgetLimit = useMemo(() => {
    return Object.values(budgets).reduce((sum: number, v: any) => sum + (v || 0), 0);
  }, [budgets]);

  const remainingBudget = Math.max(0, totalBudgetLimit - totalSpent);
  const usedPercentage = totalBudgetLimit > 0 ? Math.min(100, Math.round((totalSpent / totalBudgetLimit) * 100)) : 0;
  const remainingPercentage = 100 - usedPercentage;

  const formatCurrency = (val: number) => {
    return `$${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case "Food & Dining":
        return { icon: "fast-food-outline" as any, color: "#E67E22", bg: "#FEF5ED" };
      case "Transport":
        return { icon: "car-outline" as any, color: "#8E44AD", bg: "#F5EEF8" };
      case "Shopping":
        return { icon: "bag-handle-outline" as any, color: "#E74C3C", bg: "#FDEDEC" };
      case "Bills & Utilities":
        return { icon: "document-text-outline" as any, color: "#2ECC71", bg: "#EAF6EC" };
      case "Entertainment":
        return { icon: "film-outline" as any, color: "#7F8C8D", bg: "#F4F6F7" };
      default:
        return { icon: "ellipsis-horizontal-outline" as any, color: "#5DADE2", bg: "#EBF5FB" };
    }
  };

  const getGoalIconDetails = (cat: string) => {
    switch (cat) {
      case "gift":
        return { icon: "gift-outline" as any, color: "#8E44AD", bg: "#F4ECF7" };
      case "party":
        return { icon: "wine-outline" as any, color: "#E74C3C", bg: "#FDEDEC" };
      case "health":
        return { icon: "heart-outline" as any, color: "#27AE60", bg: "#E8F8F5" };
      default:
        return { icon: "wallet-outline" as any, color: "#34495E", bg: "#EAECEE" };
    }
  };

  const handleAddBudgetSubmit = () => {
    const limit = parseFloat(addBudgetLimit);
    if (isNaN(limit) || limit < 0) {
      Alert.alert("Error", "Please enter a valid budget limit.");
      return;
    }
    updateBudget(addBudgetCateg, limit);
    setIsAddBudgetOpen(false);
    setAddBudgetLimit("");
  };

  const handleEditBudgetSubmit = () => {
    const limit = parseFloat(editBudgetLimit);
    if (isNaN(limit) || limit < 0 || !selectedBudgetCategory) {
      Alert.alert("Error", "Please enter a valid budget limit.");
      return;
    }
    updateBudget(selectedBudgetCategory, limit);
    setIsEditBudgetOpen(false);
    setSelectedBudgetCategory(null);
  };

  const handleAddGoalSubmit = () => {
    const saved = parseFloat(goalSaved);
    const target = parseFloat(goalTarget);
    if (!goalTitle.trim() || isNaN(saved) || isNaN(target) || target <= 0) {
      Alert.alert("Error", "Please fill in all goal fields correctly.");
      return;
    }
    addSavingsGoal({
      title: goalTitle.trim(),
      saved,
      target,
      category: goalCategory,
    });
    setIsAddGoalOpen(false);
    setGoalTitle("");
    setGoalSaved("");
    setGoalTarget("");
    setGoalCategory("gift");
  };

  const handleEditGoalSubmit = () => {
    const saved = parseFloat(editGoalSaved);
    const target = parseFloat(editGoalTarget);
    if (isNaN(saved) || isNaN(target) || target <= 0 || !selectedGoal) {
      Alert.alert("Error", "Please enter valid amounts.");
      return;
    }
    updateSavingsGoal(selectedGoal.id, saved, target);
    setIsEditGoalOpen(false);
    setSelectedGoal(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- TOP NAVIGATION BAR --- */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Budget</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push("/settings" as any)}
        >
          <Ionicons name="settings-outline" size={22} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- BUDGET OVERVIEW CARD --- */}
        <View style={styles.overviewCard}>
          <Text style={styles.usageLabel}>You&apos;ve used</Text>
          <View style={styles.usageRow}>
            <Text style={styles.usageMainAmount}>
              {formatCurrency(totalSpent)}{" "}
              <Text style={styles.usageSubAmount}>of your {formatCurrency(totalBudgetLimit)} budget</Text>
            </Text>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>{remainingPercentage}%</Text>
              <Text style={styles.percentageSub}>remaining</Text>
            </View>
          </View>

          {/* Master Progress Bar */}
          <View style={styles.masterProgressBg}>
            <View style={[styles.masterProgressBar, { width: `${usedPercentage}%` }]} />
          </View>

          {/* Metrics Breakdowns */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <View
                style={[styles.metricIconBox, { backgroundColor: "#F9F3F6" }]}
              >
                <Ionicons name="briefcase-outline" size={14} color="#4B2C40" />
              </View>
              <View>
                <Text style={styles.metricItemLabel}>Total Budget</Text>
                <Text style={styles.metricItemValue}>{formatCurrency(totalBudgetLimit)}</Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <View
                style={[styles.metricIconBox, { backgroundColor: "#F5EEF0" }]}
              >
                <MaterialCommunityIcons
                  name="arrow-top-right"
                  size={14}
                  color="#A04000"
                />
              </View>
              <View>
                <Text style={styles.metricItemLabel}>Spent</Text>
                <Text style={styles.metricItemValue}>{formatCurrency(totalSpent)}</Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <View
                style={[styles.metricIconBox, { backgroundColor: "#EBF5FB" }]}
              >
                <Ionicons name="arrow-up-outline" size={14} color="#27AE60" />
              </View>
              <View>
                <Text style={styles.metricItemLabel}>Remaining</Text>
                <Text style={[styles.metricItemValue, { color: "#27AE60" }]}>
                  {formatCurrency(remainingBudget)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- BUDGET CATEGORIES SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Budget Categories</Text>
          <TouchableOpacity
            style={styles.addSectionButton}
            onPress={() => setIsAddBudgetOpen(true)}
          >
            <Ionicons name="add-circle" size={16} color="#4B2C40" />
            <Text style={styles.addSectionText}>Add Budget</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalRow}
        >
          {Object.keys(budgets).map((cat) => {
            const limit = budgets[cat] || 0;
            const spent = categorySpending[cat] || 0;
            const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
            const statusLabel = percentage >= 100 ? "Exceeded" : percentage >= 75 ? "Near limit" : "On track";
            const statusColor = percentage >= 100 ? "#E74C3C" : percentage >= 75 ? "#F39C12" : "#2ECC71";
            const details = getCategoryDetails(cat);

            return (
              <View key={cat} style={styles.categoryCard}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.catIconFrame, { backgroundColor: details.bg }]}>
                    <Ionicons name={details.icon} size={16} color={details.color} />
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedBudgetCategory(cat);
                      setEditBudgetLimit(String(limit));
                      setIsBudgetOptionsOpen(true);
                    }}
                  >
                    <Ionicons name="ellipsis-vertical" size={14} color="#BBB" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.catName} numberOfLines={1}>
                  {cat}
                </Text>
                <Text style={styles.catSplit}>
                  {formatCurrency(spent)}{" "}
                  <Text style={styles.catTotal}>/ {formatCurrency(limit)}</Text>
                </Text>
                <View style={styles.catProgressBg}>
                  <View
                    style={[
                      styles.catProgressBar,
                      { width: `${percentage}%`, backgroundColor: details.color },
                    ]}
                  />
                </View>
                <View style={styles.cardStatusRow}>
                  <Text style={styles.cardStatusPercent}>{percentage}%</Text>
                  <View style={styles.statusDotRow}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusDotText, percentage >= 100 && { color: "#E74C3C" }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* --- SAVINGS GOALS SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Savings Goals</Text>
          <TouchableOpacity
            style={styles.addSectionButton}
            onPress={() => setIsAddGoalOpen(true)}
          >
            <Ionicons name="add-circle" size={16} color="#4B2C40" />
            <Text style={styles.addSectionText}>Add Goal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.goalsContainer}>
          {savingsGoals.map((goal) => {
            const details = getGoalIconDetails(goal.category);
            return (
              <View key={goal.id} style={styles.goalRow}>
                <View style={[styles.goalIconBox, { backgroundColor: details.bg }]}>
                  <Ionicons name={details.icon} size={18} color={details.color} />
                </View>
                <View style={styles.goalMainInfo}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalSub}>Saved {formatCurrency(goal.saved)} of {formatCurrency(goal.target)}</Text>
                </View>
                <View style={styles.goalProgressContainer}>
                  <View style={styles.goalProgressBg}>
                    <View
                      style={[
                        styles.goalProgressBar,
                        { width: `${goal.percentage}%`, backgroundColor: "#4B2C40" },
                      ]}
                    />
                  </View>
                  <Text style={styles.goalPercentText}>{goal.percentage}%</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedGoal(goal);
                    setEditGoalSaved(String(goal.saved));
                    setEditGoalTarget(String(goal.target));
                    setIsGoalOptionsOpen(true);
                  }}
                  style={{ marginLeft: 8 }}
                >
                  <Ionicons name="ellipsis-vertical" size={14} color="#BBB" />
                </TouchableOpacity>
              </View>
            );
          })}
          {savingsGoals.length === 0 && (
            <Text style={{ textAlign: "center", color: "#888", paddingVertical: 20 }}>
              No savings goals set yet.
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.viewAllGoalsButton}
          onPress={() => setIsViewAllGoalsOpen(true)}
        >
          <Text style={styles.viewAllGoalsText}>View all savings goals</Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color="#666"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        {/* --- AJO PROMOTIONAL PANEL --- */}
        <View style={styles.ajoCard}>
          <View style={styles.ajoLeftColumn}>
            <Text style={styles.ajoTitle}>Ajo</Text>
            <Text style={styles.ajoSubtitle}>Save with family and friends</Text>
            <Text style={styles.ajoDescription}>
              Pool money together, stay consistent and achieve your goals
              faster.
            </Text>
            <TouchableOpacity
              style={styles.ajoButton}
              onPress={() => router.push("/ajo" as any)}
            >
              <Text style={styles.ajoButtonText}>Start an Ajo</Text>
              <Ionicons
                name="chevron-forward"
                size={12}
                color="#FFF"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </View>

          {/* Custom Illustration Placement Placeholder matches design context asset */}
          <View style={styles.ajoImageContainer}>
            <View style={styles.circleAvatarGroupPlaceholder} />
          </View>
        </View>
      </ScrollView>

      {/* --- ADD BUDGET MODAL --- */}
      <Modal visible={isAddBudgetOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.modalBackdropPress} onPress={() => setIsAddBudgetOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Category Budget</Text>
              <TouchableOpacity onPress={() => setIsAddBudgetOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Category</Text>
                <View style={styles.tagsContainer}>
                  {["Food & Dining", "Transport", "Shopping", "Bills & Utilities", "Entertainment", "Others"].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setAddBudgetCateg(cat)}
                      style={[
                        styles.tagBtn,
                        addBudgetCateg === cat && styles.tagBtnActive,
                      ]}
                    >
                      <Text style={[styles.tagText, addBudgetCateg === cat && styles.tagTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Monthly Limit ($)</Text>
                <TextInput
                  placeholder="0.00"
                  value={addBudgetLimit}
                  onChangeText={setAddBudgetLimit}
                  keyboardType="numeric"
                  style={styles.textInput}
                  placeholderTextColor="#888"
                />
              </View>

              <TouchableOpacity onPress={handleAddBudgetSubmit} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save Budget</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- BUDGET OPTIONS MODAL --- */}
      <Modal visible={isBudgetOptionsOpen} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setIsBudgetOptionsOpen(false)}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>{selectedBudgetCategory}</Text>
            <Text style={styles.alertSub}>Choose what you want to do with this budget category.</Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setIsBudgetOptionsOpen(false);
                  setIsEditBudgetOpen(true);
                }}
                style={styles.optionMenuBtn}
              >
                <Text style={styles.optionMenuBtnText}>✏️ Edit Limit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (selectedBudgetCategory) {
                    deleteBudget(selectedBudgetCategory);
                  }
                  setIsBudgetOptionsOpen(false);
                  setSelectedBudgetCategory(null);
                }}
                style={[styles.optionMenuBtn, { borderColor: "#E74C3C" }]}
              >
                <Text style={[styles.optionMenuBtnText, { color: "#E74C3C" }]}>🗑️ Delete Budget</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsBudgetOptionsOpen(false)}
                style={styles.optionMenuBtn}
              >
                <Text style={styles.optionMenuBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* --- EDIT BUDGET MODAL --- */}
      <Modal visible={isEditBudgetOpen} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setIsEditBudgetOpen(false)}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Set Budget Limit</Text>
            <Text style={styles.alertSub}>Enter the new cap for {selectedBudgetCategory}.</Text>
            <TextInput
              value={editBudgetLimit}
              onChangeText={setEditBudgetLimit}
              keyboardType="numeric"
              style={styles.alertInput}
              autoFocus
            />
            <View style={styles.alertActions}>
              <TouchableOpacity onPress={() => setIsEditBudgetOpen(false)}>
                <Text style={styles.alertCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditBudgetSubmit} style={styles.alertSaveBtn}>
                <Text style={styles.alertSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* --- ADD SAVINGS GOAL MODAL --- */}
      <Modal visible={isAddGoalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropPress} onPress={() => setIsAddGoalOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
            style={styles.keyboardContainer}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Savings Goal</Text>
                <TouchableOpacity onPress={() => setIsAddGoalOpen(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Goal Name</Text>
                  <TextInput
                    placeholder="e.g. Tim's Birthday, New Laptop..."
                    value={goalTitle}
                    onChangeText={setGoalTitle}
                    style={styles.textInput}
                    placeholderTextColor="#888"
                  />
                </View>

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.inputLabel}>Already Saved ($)</Text>
                    <TextInput
                      placeholder="0.00"
                      value={goalSaved}
                      onChangeText={setGoalSaved}
                      keyboardType="numeric"
                      style={styles.textInput}
                      placeholderTextColor="#888"
                    />
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.inputLabel}>Target Amount ($)</Text>
                    <TextInput
                      placeholder="0.00"
                      value={goalTarget}
                      onChangeText={setGoalTarget}
                      keyboardType="numeric"
                      style={styles.textInput}
                      placeholderTextColor="#888"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Goal Theme / Icon</Text>
                  <View style={styles.tagsContainer}>
                    {[
                      { id: "gift", label: "🎁 Gift" },
                      { id: "party", label: "🎉 Party" },
                      { id: "health", label: "💚 Health" },
                      { id: "other", label: "🐷 Piggy" },
                    ].map((theme) => (
                      <TouchableOpacity
                        key={theme.id}
                        onPress={() => setGoalCategory(theme.id)}
                        style={[
                          styles.tagBtn,
                          goalCategory === theme.id && styles.tagBtnActive,
                        ]}
                      >
                        <Text style={[styles.tagText, goalCategory === theme.id && styles.tagTextActive]}>
                          {theme.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity onPress={handleAddGoalSubmit} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Save Goal</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* --- GOAL OPTIONS MODAL --- */}
      <Modal visible={isGoalOptionsOpen} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setIsGoalOptionsOpen(false)}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Goal: {selectedGoal?.title}</Text>
            <Text style={styles.alertSub}>Select an action to perform.</Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setIsGoalOptionsOpen(false);
                  setIsEditGoalOpen(true);
                }}
                style={styles.optionMenuBtn}
              >
                <Text style={styles.optionMenuBtnText}>✏️ Edit Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (selectedGoal) {
                    deleteSavingsGoal(selectedGoal.id);
                  }
                  setIsGoalOptionsOpen(false);
                  setSelectedGoal(null);
                }}
                style={[styles.optionMenuBtn, { borderColor: "#E74C3C" }]}
              >
                <Text style={[styles.optionMenuBtnText, { color: "#E74C3C" }]}>🗑️ Delete Goal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsGoalOptionsOpen(false)}
                style={styles.optionMenuBtn}
              >
                <Text style={styles.optionMenuBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* --- EDIT GOAL PROGRESS MODAL --- */}
      <Modal visible={isEditGoalOpen} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setIsEditGoalOpen(false)}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Edit Savings Goal</Text>
            <Text style={styles.alertSub}>Update values for {selectedGoal?.title}</Text>

            <View style={{ gap: 8, marginVertical: 10 }}>
              <Text style={styles.inputLabel}>Saved Amount ($)</Text>
              <TextInput
                value={editGoalSaved}
                onChangeText={setEditGoalSaved}
                keyboardType="numeric"
                style={styles.alertInput}
              />
              <Text style={styles.inputLabel}>Target Goal ($)</Text>
              <TextInput
                value={editGoalTarget}
                onChangeText={setEditGoalTarget}
                keyboardType="numeric"
                style={styles.alertInput}
              />
            </View>

            <View style={styles.alertActions}>
              <TouchableOpacity onPress={() => setIsEditGoalOpen(false)}>
                <Text style={styles.alertCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditGoalSubmit} style={styles.alertSaveBtn}>
                <Text style={styles.alertSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* --- VIEW ALL GOALS MODAL --- */}
      <Modal visible={isViewAllGoalsOpen} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setIsViewAllGoalsOpen(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Savings Goals</Text>
              <TouchableOpacity onPress={() => setIsViewAllGoalsOpen(false)}>
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 12 }}>
                {savingsGoals.map((goal) => {
                  const details = getGoalIconDetails(goal.category);
                  return (
                    <View key={goal.id} style={{
                      backgroundColor: "#FAFAFA",
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: "#F0F0F0"
                    }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontSize: 14, fontWeight: "700" }}>{goal.title}</Text>
                        <Text style={{ fontSize: 10, color: "#888", fontWeight: "600" }}>{goal.category.toUpperCase()}</Text>
                      </View>
                      <View style={{
                        height: 4,
                        backgroundColor: "#F0F0F0",
                        borderRadius: 2,
                        marginTop: 10,
                        overflow: "hidden"
                      }}>
                        <View style={{ height: "100%", width: `${goal.percentage}%`, backgroundColor: "#4B2C40" }} />
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                        <Text style={{ fontSize: 11, color: "#666" }}>Saved: {formatCurrency(goal.saved)}</Text>
                        <Text style={{ fontSize: 11, color: "#666" }}>Target: {formatCurrency(goal.target)} ({goal.percentage}%)</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* --- GLOBAL RESPONSIVE FOOTER NAVIGATION --- */}
      <View style={styles.footerNav}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push("/")}
        >
          <Ionicons name="home-outline" size={22} color="#666666" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/expenses")}
        >
          <Ionicons name="document-text-outline" size={22} color="#666666" />
          <Text style={styles.footerText}>Expenses</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace("/budget")}
        >
          <Ionicons name="wallet-sharp" size={22} color="#4B2C40" />
          <Text style={[styles.footerText, styles.activeFooterText]}>
            Budget
          </Text>
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
    paddingBottom: 110,
  },
  /* Top Nav Styling */
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  settingsButton: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  /* Overview Card */
  overviewCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  usageLabel: {
    fontSize: 12,
    color: "#888",
  },
  usageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  usageMainAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  usageSubAmount: {
    fontSize: 13,
    fontWeight: "400",
    color: "#666",
  },
  percentageBadge: {
    backgroundColor: "#F2EFEF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  percentageText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  percentageSub: {
    fontSize: 9,
    color: "#888",
  },
  masterProgressBg: {
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    marginTop: 16,
    overflow: "hidden",
  },
  masterProgressBar: {
    height: "100%",
    backgroundColor: "#4B2C40",
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#FAFAFA",
    paddingTop: 14,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  metricItemLabel: {
    fontSize: 10,
    color: "#888",
  },
  metricItemValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 1,
  },
  /* Section Layouts */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  addSectionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addSectionText: {
    fontSize: 12,
    color: "#4B2C40",
    fontWeight: "600",
    marginLeft: 4,
  },
  horizontalRow: {
    paddingLeft: 16,
    flexDirection: "row",
  },
  categoryCard: {
    width: 135,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  catIconFrame: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  catSplit: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 4,
  },
  catTotal: {
    fontSize: 11,
    fontWeight: "400",
    color: "#999",
  },
  catProgressBg: {
    height: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 2,
    marginTop: 10,
  },
  catProgressBar: {
    height: "100%",
    borderRadius: 2,
  },
  cardStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  cardStatusPercent: {
    fontSize: 10,
    color: "#888",
    fontWeight: "500",
  },
  statusDotRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusDotText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  /* Savings Goals Architecture */
  goalsContainer: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#FDFDFD",
  },
  goalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  goalMainInfo: {
    flex: 1,
    marginLeft: 12,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  goalSub: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  goalProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 90,
    justifyContent: "flex-end",
  },
  goalProgressBg: {
    width: 50,
    height: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 2,
    marginRight: 8,
  },
  goalProgressBar: {
    height: "100%",
    borderRadius: 2,
  },
  goalPercentText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4A4A4A",
    width: 26,
    textAlign: "right",
  },
  viewAllGoalsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
  },
  viewAllGoalsText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  /* Ajo Promotional Banner */
  ajoCard: {
    backgroundColor: "#F6F3F5",
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EFEAEF",
  },
  ajoLeftColumn: {
    flex: 0.65,
  },
  ajoTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  ajoSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 2,
  },
  ajoDescription: {
    fontSize: 11,
    color: "#666",
    marginTop: 6,
    lineHeight: 15,
  },
  ajoButton: {
    backgroundColor: "#4B2C40",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    marginTop: 14,
  },
  ajoButtonText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  ajoImageContainer: {
    flex: 0.35,
    alignItems: "center",
    justifyContent: "center",
  },
  circleAvatarGroupPlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "#E5DCE2", // Abstract backing mockup for layered vector/PNG group
  },
  /* Sticky Navigation Footer */
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
  /* Modal backdrop & sheets styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalBackdropPress: {
    flex: 1,
    backgroundColor: "transparent",
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
  inputGroup: {
    gap: 6,
    marginBottom: 16,
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
    marginTop: 4,
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
  /* Alert options menu style */
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
  alertSub: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
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
  alertInput: {
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
    textAlign: "center",
    marginVertical: 10,
  },
  alertActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 12,
  },
  alertCancel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  alertSaveBtn: {
    backgroundColor: "#4B2C40",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  alertSaveText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
