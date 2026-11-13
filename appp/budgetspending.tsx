import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

const categories = [
  {
    name: "Food & Dining",
    icon: "fast-food-outline" as const,
    fallback: 72000,
  },
  { name: "Transport", icon: "car-outline" as const, fallback: 32000 },
  { name: "Shopping", icon: "bag-handle-outline" as const, fallback: 45000 },
  {
    name: "Bills & Utilities",
    icon: "document-text-outline" as const,
    fallback: 47000,
  },
  { name: "Entertainment", icon: "film-outline" as const, fallback: 22000 },
  { name: "Others", icon: "grid-outline" as const, fallback: 12000 },
];

export default function BudgetSpendingScreen() {
  const router = useRouter();
  const {
    transactions: rawTransactions = [],
    budgets = {},
    updateBudget,
    themePreference,
    themeMode,
  } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";
  const [editing, setEditing] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const recommendationsRef = useRef<ScrollView>(null);
  const recommendationOffset = useRef(0);
  const data = useMemo(() => {
    const spending: Record<string, number> = {};
    (rawTransactions as any[]).forEach((item) => {
      if (item.type === "expense")
        spending[item.category] =
          (spending[item.category] || 0) + (Number(item.amount) || 0);
    });
    const hasTransactions = Object.values(spending).some(Boolean);
    const items = categories.map((item) => {
      const spent = hasTransactions ? spending[item.name] || 0 : item.fallback;
      const limit =
        budgets[item.name] ||
        Math.max(Math.ceil((spent * 1.25) / 1000) * 1000, 30000);
      return {
        ...item,
        spent,
        limit,
        progress: Math.round((spent / limit) * 100),
      };
    });
    return {
      items,
      spent: items.reduce((sum, item) => sum + item.spent, 0),
      limit: items.reduce((sum, item) => sum + item.limit, 0),
    };
  }, [rawTransactions, budgets]);
  const progress = Math.round((data.spent / data.limit) * 100);
  const remaining = Math.max(data.limit - data.spent, 0);
  const daysLeft = Math.max(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() -
      new Date().getDate(),
    1,
  );
  const dailyGuide = Math.floor(remaining / daysLeft);
  useEffect(() => {
    const cardWidth = 217;
    const timer = setInterval(() => {
      recommendationOffset.current += 0.45;
      if (recommendationOffset.current >= cardWidth * 3)
        recommendationOffset.current = 0;
      recommendationsRef.current?.scrollTo({
        x: recommendationOffset.current,
        animated: false,
      });
    }, 32);
    return () => clearInterval(timer);
  }, []);
  const save = () => {
    const value = Number(amount.replace(/[^0-9.]/g, ""));
    if (editing && value > 0) updateBudget(editing, value);
    setEditing(null);
    setAmount("");
  };
  const open = (name: string) => {
    setEditing(name);
    setAmount(
      String(
        budgets[name] ||
          data.items.find((item) => item.name === name)?.limit ||
          "",
      ),
    );
  };
  const month = new Date()
    .toLocaleString("en-US", { month: "long" })
    .toUpperCase();
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.background }]}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            s.back,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="chevron-back" size={23} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.textPrimary }]}>Budget</Text>
        <TouchableOpacity
          onPress={() => open("Others")}
          style={[s.add, { borderColor: theme.accent }]}
        >
          <Ionicons name="add" size={19} color={theme.accent} />
          <Text style={[s.addText, { color: theme.accent }]}>Add</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            s.totalCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[s.overline, { color: theme.textSecondary }]}>
            MONTHLY TOTAL · {month}
          </Text>
          <View style={s.amountRow}>
            <Text style={[s.total, { color: theme.textPrimary }]}>
              ₦{data.limit.toLocaleString()}
            </Text>
            <Text
              style={[
                s.percent,
                { color: progress > 100 ? theme.danger : theme.accent },
              ]}
            >
              {progress}%
            </Text>
          </View>
          <Text style={[s.spent, { color: theme.textSecondary }]}>
            Spent ₦{data.spent.toLocaleString()}
          </Text>
          <View style={[s.track, { backgroundColor: theme.surfaceSoft }]}>
            <View
              style={[
                s.fill,
                {
                  backgroundColor: progress > 100 ? theme.danger : theme.accent,
                  width: `${Math.min(progress, 100)}%`,
                },
              ]}
            />
          </View>
          <View style={[s.budgetStats, { borderTopColor: theme.border }]}>
            <View style={s.budgetStat}>
              <Text style={[s.budgetStatLabel, { color: theme.textSecondary }]}>
                REMAINING
              </Text>
              <Text style={[s.budgetStatValue, { color: theme.textPrimary }]}>
                ₦{remaining.toLocaleString()}
              </Text>
            </View>
            <View style={s.budgetStat}>
              <Text style={[s.budgetStatLabel, { color: theme.textSecondary }]}>
                DAILY GUIDE
              </Text>
              <Text style={[s.budgetStatValue, { color: theme.accent }]}>
                ₦{dailyGuide.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
        <View style={s.aiHead}>
          <View style={s.aiHeading}>
            <Ionicons name="sparkles" size={15} color={theme.accent} />
            <Text style={[s.section, { color: theme.textSecondary }]}>
              AI RECOMMENDED
            </Text>
          </View>
          <Text style={[s.aiHint, { color: theme.textSecondary }]}>
            Based on spending
          </Text>
        </View>
        <ScrollView
          ref={recommendationsRef}
          horizontal
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.recommendations}
        >
          {[...data.items.slice(0, 3), ...data.items.slice(0, 3)].map(
            (item, index) => (
              <View
                key={`${item.name}-${index}`}
                style={[
                  s.recommendation,
                  { backgroundColor: theme.accentSoft },
                ]}
              >
                <Text style={[s.recName, { color: theme.textPrimary }]}>
                  {item.name}
                </Text>
                <Text style={[s.recAmount, { color: theme.accent }]}>
                  ₦{item.limit.toLocaleString()}
                </Text>
                <Text style={[s.recCopy, { color: theme.textSecondary }]}>
                  A comfortable limit for this month.
                </Text>
                <TouchableOpacity
                  onPress={() => updateBudget(item.name, item.limit)}
                  style={[s.useButton, { backgroundColor: theme.surface }]}
                >
                  <Text style={[s.useText, { color: theme.accent }]}>
                    Use this limit
                  </Text>
                </TouchableOpacity>
              </View>
            ),
          )}
        </ScrollView>
        <View style={s.sectionHead}>
          <Text style={[s.section, { color: theme.textSecondary }]}>
            CATEGORY BUDGETS
          </Text>
          <TouchableOpacity onPress={() => open("Others")}>
            <Text style={[s.adjust, { color: theme.accent }]}>Adjust</Text>
          </TouchableOpacity>
        </View>
        <View
          style={[
            s.list,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {data.items.map((item, index) => {
            const color = item.progress > 100 ? theme.danger : theme.accent;
            return (
              <TouchableOpacity
                key={item.name}
                onPress={() => open(item.name)}
                style={[
                  s.row,
                  index < data.items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <View style={[s.icon, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name={item.icon} size={19} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.rowTitle, { color: theme.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[s.rowSub, { color: theme.textSecondary }]}>
                    ₦{item.spent.toLocaleString()} of ₦
                    {item.limit.toLocaleString()}
                  </Text>
                  <View
                    style={[s.rowTrack, { backgroundColor: theme.surfaceSoft }]}
                  >
                    <View
                      style={[
                        s.rowFill,
                        {
                          backgroundColor: color,
                          width: `${Math.min(item.progress, 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text style={[s.rowPercent, { color }]}>{item.progress}%</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={[s.note, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="bulb-outline" size={17} color={theme.accent} />
          <Text style={[s.noteText, { color: theme.textSecondary }]}>
            Tap a category to set a limit that works for your month.
          </Text>
        </View>
      </ScrollView>
      <Modal
        transparent
        visible={!!editing}
        animationType="fade"
        onRequestClose={() => setEditing(null)}
      >
        <TouchableWithoutFeedback onPress={() => setEditing(null)}>
          <View style={s.overlay}>
            <TouchableWithoutFeedback>
              <View style={[s.modal, { backgroundColor: theme.surface }]}>
                <Text style={[s.modalTitle, { color: theme.textPrimary }]}>
                  Set a budget
                </Text>
                <Text style={[s.modalSub, { color: theme.textSecondary }]}>
                  {editing}
                </Text>
                <View
                  style={[
                    s.inputRow,
                    {
                      backgroundColor: isDark
                        ? theme.surfaceSoft
                        : theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[s.naira, { color: theme.textPrimary }]}>₦</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    autoFocus
                    placeholder="Amount"
                    placeholderTextColor={theme.textSecondary}
                    style={[s.input, { color: theme.textPrimary }]}
                  />
                </View>
                <View style={s.buttons}>
                  <TouchableOpacity
                    onPress={() => setEditing(null)}
                    style={[s.cancel, { backgroundColor: theme.surfaceSoft }]}
                  >
                    <Text
                      style={[s.cancelText, { color: theme.textSecondary }]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={save}
                    style={[s.save, { backgroundColor: theme.accent }]}
                  >
                    <Text style={s.saveText}>Save budget</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  back: {
    height: 42,
    width: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  add: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 11,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { fontSize: 12, fontWeight: "800" },
  content: { padding: 20, paddingTop: 12, paddingBottom: 110 },
  totalCard: { borderRadius: 25, padding: 21, borderWidth: 1 },
  overline: { fontSize: 10.5, fontWeight: "800", letterSpacing: 1 },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 17,
  },
  total: { fontSize: 31, fontWeight: "800", letterSpacing: -0.8 },
  percent: { fontSize: 18, fontWeight: "800" },
  spent: { fontSize: 13, marginTop: 5 },
  track: { height: 8, borderRadius: 5, overflow: "hidden", marginTop: 19 },
  fill: { height: "100%", borderRadius: 5 },
  budgetStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 14,
  },
  budgetStat: { flex: 1 },
  budgetStatLabel: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.8 },
  budgetStatValue: { fontSize: 14, fontWeight: "800", marginTop: 5 },
  aiHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 11,
    paddingHorizontal: 3,
  },
  aiHeading: { flexDirection: "row", alignItems: "center", gap: 6 },
  aiHint: { fontSize: 10.5 },
  recommendations: { gap: 10, paddingRight: 20 },
  recommendation: { width: 207, borderRadius: 19, padding: 15 },
  recName: { fontSize: 13, fontWeight: "800" },
  recAmount: { fontSize: 19, fontWeight: "800", marginTop: 8 },
  recCopy: { fontSize: 11, lineHeight: 15, marginTop: 3 },
  useButton: {
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  useText: { fontSize: 11.5, fontWeight: "800" },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 11,
    paddingHorizontal: 3,
  },
  section: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  adjust: { fontSize: 12, fontWeight: "800" },
  list: { borderRadius: 21, borderWidth: 1, paddingHorizontal: 15 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 14,
  },
  icon: {
    height: 42,
    width: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 14, fontWeight: "800" },
  rowSub: { fontSize: 11.5, marginTop: 3 },
  rowTrack: { height: 4, borderRadius: 2, marginTop: 8, overflow: "hidden" },
  rowFill: { height: "100%", borderRadius: 2 },
  rowPercent: { fontSize: 12, fontWeight: "800" },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  noteText: { fontSize: 11.5, lineHeight: 16, flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.42)",
    justifyContent: "center",
    padding: 20,
  },
  modal: { borderRadius: 23, padding: 21 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSub: { fontSize: 12, marginTop: 4 },
  inputRow: {
    height: 58,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginTop: 20,
  },
  naira: { fontSize: 20, fontWeight: "800", marginRight: 7 },
  input: { fontSize: 18, fontWeight: "800", height: "100%", flex: 1 },
  buttons: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancel: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  cancelText: { fontSize: 13, fontWeight: "800" },
  save: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flex: 1.2,
  },
  saveText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
