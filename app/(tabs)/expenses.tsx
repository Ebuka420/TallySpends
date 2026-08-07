import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppStore } from "../../src/store";

const categoryMeta: Record<string, { icon: any; color: string; soft: string }> =
  {
    "Food & Dining": {
      icon: "fast-food-outline",
      color: "#A9622C",
      soft: "#F7EEE5",
    },
    Transport: { icon: "car-outline", color: "#586E8D", soft: "#EAF0F6" },
    Shopping: { icon: "bag-handle-outline", color: "#846590", soft: "#F2ECF5" },
    "Bills & Utilities": {
      icon: "document-text-outline",
      color: "#5B7A67",
      soft: "#EAF2EA",
    },
    Entertainment: { icon: "film-outline", color: "#8A7067", soft: "#F4EEEB" },
    Others: { icon: "ellipsis-horizontal", color: "#70706B", soft: "#EFEFEB" },
  };
const money = (amount: number) =>
  `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExpensesScreen() {
  const router = useRouter();
  const { transactions: rawTransactions = [] } = useAppStore();
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [period, setPeriod] = useState<"month" | "year">("month");
  const transactions = rawTransactions as any[];
  const periodTransactions = useMemo(
    () =>
      transactions
        .filter((tx) => {
          if (tx.type !== "expense") return false;
          const transactionDate = new Date(tx.date);
          return period === "year"
            ? transactionDate.getFullYear() === date.getFullYear()
            : transactionDate.getMonth() === date.getMonth() &&
                transactionDate.getFullYear() === date.getFullYear();
        })
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [transactions, date, period],
  );
  const total = periodTransactions.reduce(
    (sum, tx) => sum + Number(tx.amount || 0),
    0,
  );
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    periodTransactions.forEach((tx) => {
      totals[tx.category] = (totals[tx.category] || 0) + Number(tx.amount || 0);
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [periodTransactions]);
  const grouped = useMemo(
    () =>
      periodTransactions
        .slice(0, 8)
        .reduce<Record<string, any[]>>((result, tx) => {
          const key =
            new Date(tx.date).toDateString() === new Date().toDateString()
              ? "Today"
              : new Date(tx.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                });
          (result[key] ||= []).push(tx);
          return result;
        }, {}),
    [periodTransactions],
  );
  const dateLabel =
    period === "year"
      ? String(date.getFullYear())
      : date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowCalendar(Platform.OS === "ios");
    if (selected) setDate(selected);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topbar}>
          <Text style={styles.title}>Expenses</Text>
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={() => setShowCalendar(true)}
              style={styles.dateControl}
            >
              <Ionicons name="calendar-outline" size={14} color="#66625E" />
              <Text style={styles.dateControlText}>{dateLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPeriodMenu(true)}
              style={styles.dropButton}
            >
              <Ionicons name="chevron-down" size={16} color="#4B2C40" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.hero}>
          <Text style={styles.overline}>
            {period === "month"
              ? "TOTAL SPENT THIS MONTH"
              : "TOTAL SPENT THIS YEAR"}
          </Text>
          <Text style={styles.total}>{money(total)}</Text>
          <View style={styles.trend}>
            <Ionicons name="arrow-down" size={13} color="#63806A" />
            <Text style={styles.trendText}>
              Your spending is calmly on track
            </Text>
          </View>
        </View>
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Spending overview</Text>
            <Text style={styles.chartTotal}>{money(total)}</Text>
          </View>
          <View style={styles.chart}>
            <View style={styles.grid} />
            {[0.24, 0.42, 0.32, 0.6, 0.52, 0.77, 1].map((height, index) => (
              <View key={index} style={[styles.bar, { height: height * 96 }]} />
            ))}
          </View>
          <View style={styles.axis}>
            <Text>Start</Text>
            <Text>Today</Text>
          </View>
        </View>
        <View style={styles.quietStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>TRANSACTIONS</Text>
            <Text style={styles.statValue}>{periodTransactions.length}</Text>
            <Text style={styles.statHint}>In this period</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>AVERAGE PURCHASE</Text>
            <Text style={styles.statValue}>
              {money(
                periodTransactions.length
                  ? total / periodTransactions.length
                  : 0,
              )}
            </Text>
            <Text style={styles.statHint}>Per transaction</Text>
          </View>
        </View>
        <Heading title="By category" action="See all" />
        <View style={styles.surface}>
          {categoryTotals.slice(0, 4).map(([category, amount]) => (
            <Pressable
              key={category}
              onPress={() =>
                router.push({
                  pathname: "/transaction-history" as any,
                  params: { category },
                })
              }
              style={styles.row}
            >
              {(() => {
                const meta = categoryMeta[category] || categoryMeta.Others;
                return (
                  <>
                    <View
                      style={[styles.iconBox, { backgroundColor: meta.soft }]}
                    >
                      <Ionicons name={meta.icon} size={18} color={meta.color} />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle}>{category}</Text>
                      <Text style={styles.rowSub}>
                        {total
                          ? `${Math.round((amount / total) * 100)}% of spending`
                          : "No spending"}
                      </Text>
                    </View>
                    <Text style={styles.rowAmount}>{money(amount)}</Text>
                  </>
                );
              })()}
            </Pressable>
          ))}
        </View>
        <Heading title="Transactions" action="View all" />
        <View style={styles.transactions}>
          {Object.entries(grouped).map(([day, items]) => (
            <View key={day} style={styles.surface}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupDay}>{day}</Text>
                <Text style={styles.groupTotal}>
                  {money(
                    items.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
                  )}
                </Text>
              </View>
              {items.map((tx) => {
                const meta = categoryMeta[tx.category] || categoryMeta.Others;
                return (
                  <Pressable
                    key={tx.id}
                    onPress={() => router.push("/transaction-history" as any)}
                    style={styles.row}
                  >
                    <View
                      style={[styles.iconBox, { backgroundColor: meta.soft }]}
                    >
                      <Ionicons name={meta.icon} size={18} color={meta.color} />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle}>{tx.title}</Text>
                      <Text style={styles.rowSub}>{tx.category}</Text>
                    </View>
                    <Text style={styles.rowAmount}>
                      {money(Number(tx.amount))}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
        {!periodTransactions.length && (
          <Text style={styles.empty}>
            No expenses recorded for this period.
          </Text>
        )}
      </ScrollView>
      {showCalendar && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
        />
      )}
      <Modal
        transparent
        visible={showPeriodMenu}
        animationType="fade"
        onRequestClose={() => setShowPeriodMenu(false)}
      >
        <Pressable
          style={styles.modal}
          onPress={() => setShowPeriodMenu(false)}
        >
          <View style={styles.menu}>
            {(["month", "year"] as const).map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setPeriod(item);
                  setShowPeriodMenu(false);
                }}
                style={styles.menuItem}
              >
                <Text
                  style={[
                    styles.menuText,
                    period === item && styles.menuActive,
                  ]}
                >
                  {item === "month" ? "This month" : "This year"}
                </Text>
                {period === item && (
                  <Ionicons name="checkmark" size={16} color="#4B2C40" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
function Heading({ title, action }: { title: string; action: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.headingTitle}>{title}</Text>
      <Text style={styles.action}>{action}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF8" },
  content: { padding: 20, paddingBottom: 120 },
  topbar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: -0.7,
    color: "#201D1B",
  },
  controls: { flexDirection: "row", gap: 7 },
  dateControl: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "#EAE7E3",
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  dateControlText: { fontSize: 12, fontWeight: "600", color: "#514C48" },
  dropButton: {
    alignItems: "center",
    backgroundColor: "#F4EFF2",
    borderRadius: 17,
    justifyContent: "center",
    width: 34,
    height: 34,
  },
  hero: { alignItems: "center", paddingVertical: 39 },
  overline: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.15,
    color: "#928D88",
  },
  total: {
    fontSize: 46,
    fontWeight: "700",
    letterSpacing: -2.1,
    color: "#1C1917",
    marginTop: 7,
  },
  trend: { alignItems: "center", flexDirection: "row", gap: 5, marginTop: 9 },
  trendText: { fontSize: 13, color: "#85807B" },
  chartCard: {
    backgroundColor: "#FFF",
    borderColor: "#ECE9E5",
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  chartHeader: { flexDirection: "row", justifyContent: "space-between" },
  chartTitle: { fontSize: 13, fontWeight: "500", color: "#77716C" },
  chartTotal: { fontSize: 13, fontWeight: "700", color: "#2B2724" },
  chart: {
    alignItems: "flex-end",
    borderBottomColor: "#EEEAE6",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 112,
    justifyContent: "space-between",
    marginTop: 18,
    paddingHorizontal: 3,
  },
  grid: {
    backgroundColor: "#F1EEEA",
    height: 1,
    left: 0,
    position: "absolute",
    right: 0,
    top: 44,
  },
  bar: {
    backgroundColor: "#4B2C40",
    borderRadius: 3,
    opacity: 0.9,
    width: "8%",
  },
  axis: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  quietStats: {
    backgroundColor: "#F2F0ED",
    borderRadius: 20,
    flexDirection: "row",
    marginTop: 14,
    padding: 17,
  },
  stat: { flex: 1 },
  divider: { backgroundColor: "#DDD8D3", marginHorizontal: 12, width: 1 },
  statLabel: {
    color: "#948E89",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  statValue: {
    color: "#332E2A",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 5,
  },
  statHint: { color: "#8C8681", fontSize: 10, marginTop: 4 },
  heading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 31,
  },
  headingTitle: { color: "#2B2724", fontSize: 18, fontWeight: "700" },
  action: { color: "#756E69", fontSize: 12, fontWeight: "600" },
  surface: {
    backgroundColor: "#FFF",
    borderColor: "#ECE9E5",
    borderRadius: 21,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 70,
    paddingHorizontal: 15,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: 13,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  rowCopy: { flex: 1, marginLeft: 12 },
  rowTitle: { color: "#302B27", fontSize: 14, fontWeight: "600" },
  rowSub: { color: "#9C9691", fontSize: 11, marginTop: 3 },
  rowAmount: { color: "#37312D", fontSize: 14, fontWeight: "700" },
  transactions: { gap: 15 },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 14,
  },
  groupDay: { color: "#7D7671", fontSize: 12, fontWeight: "600" },
  groupTotal: { color: "#7D7671", fontSize: 12, fontWeight: "600" },
  empty: { color: "#99938E", fontSize: 13, textAlign: "center", marginTop: 22 },
  modal: {
    backgroundColor: "rgba(25,20,18,.18)",
    flex: 1,
    justifyContent: "flex-start",
    paddingRight: 20,
    paddingTop: 74,
  },
  menu: {
    alignSelf: "flex-end",
    backgroundColor: "#FFF",
    borderRadius: 16,
    elevation: 5,
    overflow: "hidden",
    width: 160,
  },
  menuItem: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
  },
  menuText: { color: "#716A65", fontSize: 13 },
  menuActive: { color: "#4B2C40", fontWeight: "700" },
  axisText: { color: "#A29B96", fontSize: 11 },
});
