import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type DimensionValue,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

type Timeframe = "weekly" | "monthly" | "yearly";
const options: Record<Timeframe, string[]> = {
  weekly: ["W1 May", "W2 May", "W3 May", "W4 May"],
  monthly: ["March 2026", "April 2026", "May 2026", "June 2026"],
  yearly: ["2024", "2025", "2026"],
};
type CategoryItem = [
  string,
  string,
  `${number}%`,
  typeof Ionicons.glyphMap extends Record<string, unknown>
    ? keyof typeof Ionicons.glyphMap
    : string,
  string,
];

const categories: CategoryItem[] = [
  ["Food & dining", "₦692.20", "32%", "fast-food-outline", "#F3EBF1"],
  ["Transport", "₦539.60", "25%", "car-outline", "#EEE5F2"],
  ["Shopping", "₦388.50", "18%", "bag-handle-outline", "#F7F0F8"],
];

export default function AnalyticsScreen() {
  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");
  const [period, setPeriod] = useState("May 2026");
  const [showPeriods, setShowPeriods] = useState(false);
  const chooseTimeframe = (next: Timeframe) => {
    setTimeframe(next);
    setPeriod(options[next][Math.min(1, options[next].length - 1)]);
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <TouchableOpacity style={styles.share}>
            <Ionicons name="share-outline" size={19} color="#20142A" />
          </TouchableOpacity>
        </View>
        <View style={styles.controls}>
          <View style={styles.segment}>
            {(["weekly", "monthly", "yearly"] as Timeframe[]).map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => chooseTimeframe(item)}
                style={[
                  styles.segmentOption,
                  timeframe === item && styles.segmentActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    timeframe === item && styles.segmentTextActive,
                  ]}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.periodButton}
            onPress={() => setShowPeriods(true)}
          >
            <Text style={styles.periodText}>{period}</Text>
            <Ionicons name="chevron-down" size={14} color="#624B6A" />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.overline}>FINANCIAL HEALTH</Text>
          <View style={styles.heroRow}>
            <Text style={styles.score}>82</Text>
            <Text style={styles.outOf}>/100</Text>
            <View style={styles.scoreBadge}>
              <Ionicons name="arrow-up" size={12} color="#624B6A" />
              <Text style={styles.scoreBadgeText}>8%</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>You’re building healthy habits.</Text>
          <Text style={styles.heroSubtitle}>
            Your spending efficiency improved compared with last month.
          </Text>
        </View>

        <View style={styles.trendCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>SPENDING OVERVIEW</Text>
              <Text style={styles.cardTitle}>Your monthly flow</Text>
            </View>
            <Text style={styles.cardAmount}>$2,158</Text>
          </View>
          <View style={styles.chart}>
            <View style={[styles.chartGuide, { top: 31 }]} />
            <View style={[styles.chartGuide, { top: 72 }]} />
            <Svg
              width="100%"
              height="112"
              viewBox="0 0 320 112"
              preserveAspectRatio="none"
            >
              <Path
                d="M0 91 C18 85 29 69 48 72 C67 75 78 51 98 57 C117 63 128 44 148 49 C167 55 181 29 201 35 C222 42 234 19 255 25 C276 31 288 12 320 17 L320 112 L0 112 Z"
                fill="#EEE5F0"
                opacity={0.72}
              />
              <Path
                d="M0 84 C18 80 29 72 48 74 C67 76 78 64 98 67 C117 71 128 58 148 60 C167 63 181 46 201 49 C222 52 234 37 255 40 C276 43 288 31 320 33"
                fill="none"
                stroke="#C79A00"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3.5"
              />
              <Path
                d="M0 73 C18 69 29 60 48 62 C67 64 78 53 98 56 C117 60 128 46 148 49 C167 53 181 38 201 41 C222 45 234 28 255 33 C276 37 288 24 320 24"
                fill="none"
                stroke="#2F8F4F"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.6"
              />
              <Path
                d="M0 95 C18 92 29 85 48 86 C67 87 78 78 98 80 C117 82 128 72 148 74 C167 76 181 64 201 66 C222 69 234 60 255 63 C276 66 288 57 320 58"
                fill="none"
                stroke="#20142A"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.6"
              />
              <Circle
                cx="255"
                cy="40"
                fill="#FFFFFF"
                r="5.5"
                stroke="#C79A00"
                strokeWidth="3"
              />
              <Circle
                cx="255"
                cy="33"
                fill="#FFFFFF"
                r="4.4"
                stroke="#2F8F4F"
                strokeWidth="2.2"
              />
              <Circle
                cx="255"
                cy="63"
                fill="#FFFFFF"
                r="4.4"
                stroke="#20142A"
                strokeWidth="2.2"
              />
            </Svg>
          </View>
          <View style={styles.chartAxis}>
            <Text style={styles.chartAxisText}>Week 1</Text>
            <Text style={styles.chartAxisText}>Week 4</Text>
          </View>
          <View style={styles.legend}>
            <Legend label="Spent" color="#20142A" />
            <Legend label="Income" color="#BDAAC5" />
            <Legend label="Saved" color="#E6DCE9" />
          </View>
        </View>

        <View style={styles.metrics}>
          <Metric label="INCOME" value="₦3,450" icon="arrow-down-outline" />
          <View style={styles.metricDivider} />
          <Metric label="SPENT" value="₦2,158" icon="arrow-up-outline" />
          <View style={styles.metricDivider} />
          <Metric label="SAVED" value="₦1,292" icon="leaf-outline" />
        </View>

        <Heading title="Where your money went." action="See details" />
        <View style={styles.surface}>
          {categories.map(([name, amount, share, icon, tint]) => (
            <TouchableOpacity key={name} style={styles.categoryRow}>
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: tint as string },
                ]}
              >
                <Ionicons name={icon as any} size={18} color="#624B6A" />
              </View>
              <View style={styles.categoryCopy}>
                <Text style={styles.categoryName}>{name}</Text>
                <View style={styles.categoryTrack}>
                  <View
                    style={[
                      styles.categoryFill,
                      { width: share as DimensionValue },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.categoryEnd}>
                <Text style={styles.categoryAmount}>{amount}</Text>
                <Text style={styles.categoryShare}>{share}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Heading title="Smart observations." action="View all" />
        <View style={styles.insight}>
          <View style={styles.insightIcon}>
            <Ionicons name="sparkles-outline" size={19} color="#624B6A" />
          </View>
          <View style={styles.insightCopy}>
            <Text style={styles.insightTitle}>A small shift to notice</Text>
            <Text style={styles.insightText}>
              Food spending was higher this week than it was last month. A ₦35
              weekly cap could keep you on track.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#8E7B95" />
        </View>

        <Heading title="Spending rhythm." action="This month" />
        <View style={styles.surface}>
          <Text style={styles.rhythmCaption}>
            Your busiest spending time is between 12 PM and 6 PM.
          </Text>
          <View style={styles.heatmap}>
            {[
              1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2,
              1, 0,
            ].map((intensity, index) => (
              <View
                key={index}
                style={[
                  styles.heatCell,
                  {
                    backgroundColor: [
                      "#F5F0F6",
                      "#E7DDE9",
                      "#CDBBD3",
                      "#8F729A",
                      "#624B6A",
                    ][intensity],
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.heatLabels}>
            <Text style={styles.heatLabelsText}>6 AM</Text>
            <Text style={styles.heatLabelsText}>12 PM</Text>
            <Text style={styles.heatLabelsText}>6 PM</Text>
          </View>
        </View>
      </ScrollView>
      <Modal
        transparent
        visible={showPeriods}
        animationType="fade"
        onRequestClose={() => setShowPeriods(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPeriods(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menu}>
                <Text style={styles.menuTitle}>Select period</Text>
                {options[timeframe].map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => {
                      setPeriod(item);
                      setShowPeriods(false);
                    }}
                    style={styles.menuItem}
                  >
                    <Text
                      style={[
                        styles.menuText,
                        period === item && styles.menuActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {period === item && (
                      <Ionicons name="checkmark" size={17} color="#20142A" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
function Heading({ title, action }: { title: string; action: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.headingTitle}>{title}</Text>
      <Text style={styles.headingAction}>{action}</Text>
    </View>
  );
}
function Legend({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}
function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={14} color="#20142A" />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF" },
  content: { padding: 20, paddingBottom: 120 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  title: {
    color: "#251A2B",
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  share: {
    alignItems: "center",
    backgroundColor: "#F3EBF1",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  controls: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  segment: {
    backgroundColor: "#F3F0F4",
    borderRadius: 14,
    flexDirection: "row",
    padding: 3,
  },
  segmentOption: {
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  segmentActive: { backgroundColor: "#20142A" },
  segmentText: { color: "#82778A", fontSize: 11, fontWeight: "600" },
  segmentTextActive: { color: "#FFF" },
  periodButton: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "#E9E1EB",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  periodText: { color: "#513C5B", fontSize: 11, fontWeight: "700" },
  hero: { paddingBottom: 29, paddingTop: 40 },
  overline: {
    color: "#8C7D93",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.15,
  },
  heroRow: { alignItems: "baseline", flexDirection: "row", marginTop: 4 },
  score: {
    color: "#20142A",
    fontSize: 50,
    fontWeight: "700",
    letterSpacing: -2,
  },
  outOf: { color: "#968A9B", fontSize: 16, fontWeight: "600", marginLeft: 3 },
  scoreBadge: {
    alignItems: "center",
    backgroundColor: "#F0E8F2",
    borderRadius: 13,
    flexDirection: "row",
    gap: 3,
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  scoreBadgeText: { color: "#624B6A", fontSize: 11, fontWeight: "700" },
  heroTitle: {
    color: "#302437",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  heroSubtitle: {
    color: "#817687",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  trendCard: {
    backgroundColor: "#FFF",
    borderColor: "#E9E1EB",
    borderRadius: 23,
    borderWidth: 1,
    padding: 18,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  cardLabel: {
    color: "#94899A",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  cardTitle: {
    color: "#33273A",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  cardAmount: { color: "#33273A", fontSize: 14, fontWeight: "700" },
  chart: {
    borderBottomColor: "#EFE9F0",
    borderBottomWidth: 1,
    height: 112,
    marginTop: 19,
    position: "relative",
  },
  chartGuide: {
    backgroundColor: "#F0EBF1",
    height: 1,
    left: 0,
    position: "absolute",
    right: 0,
  },
  chartAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  chartAxisText: { color: "#A399A6", fontSize: 10 },
  legend: { flexDirection: "row", gap: 15, marginTop: 15 },
  legendItem: { alignItems: "center", flexDirection: "row", gap: 5 },
  legendDot: { borderRadius: 4, height: 7, width: 7 },
  legendText: { color: "#817687", fontSize: 10 },
  metrics: {
    backgroundColor: "#F5F1F6",
    borderRadius: 20,
    flexDirection: "row",
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 17,
  },
  metric: { alignItems: "center", flex: 1 },
  metricIcon: {
    alignItems: "center",
    backgroundColor: "#E9DDEB",
    borderRadius: 11,
    height: 25,
    justifyContent: "center",
    width: 25,
  },
  metricDivider: { backgroundColor: "#DDD4E0", marginVertical: 3, width: 1 },
  metricLabel: {
    color: "#887C8D",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.65,
    marginTop: 7,
  },
  metricValue: {
    color: "#20142A",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.35,
    marginTop: 4,
  },
  heading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 31,
  },
  headingTitle: {
    color: "#2C2033",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.35,
  },
  headingAction: { color: "#6C4C7A", fontSize: 12, fontWeight: "600" },
  surface: {
    backgroundColor: "#FFF",
    borderColor: "#E9E1EB",
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  categoryRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 72,
    paddingHorizontal: 15,
  },
  categoryIcon: {
    alignItems: "center",
    borderRadius: 13,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  categoryCopy: { flex: 1, marginLeft: 12 },
  categoryName: { color: "#362B3D", fontSize: 14, fontWeight: "600" },
  categoryTrack: {
    backgroundColor: "#F0EBF1",
    borderRadius: 2,
    height: 4,
    marginTop: 8,
    overflow: "hidden",
    width: "88%",
  },
  categoryFill: { backgroundColor: "#624B6A", borderRadius: 2, height: "100%" },
  categoryEnd: { alignItems: "flex-end" },
  categoryAmount: { color: "#382C3F", fontSize: 13, fontWeight: "700" },
  categoryShare: { color: "#9A8FA0", fontSize: 10, marginTop: 3 },
  insight: {
    alignItems: "center",
    backgroundColor: "#F3EBF1",
    borderRadius: 21,
    flexDirection: "row",
    padding: 16,
  },
  insightIcon: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    marginRight: 12,
    width: 42,
  },
  insightCopy: { flex: 1, paddingRight: 8 },
  insightTitle: { color: "#34273B", fontSize: 14, fontWeight: "700" },
  insightText: { color: "#736779", fontSize: 12, lineHeight: 17, marginTop: 5 },
  rhythmCaption: {
    color: "#817687",
    fontSize: 12,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  heatmap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 15,
    paddingBottom: 10,
  },
  heatCell: { borderRadius: 5, height: 23, width: "14%" },
  heatLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  heatLabelsText: { color: "#A097A4", fontSize: 10 },
  overlay: {
    backgroundColor: "rgba(31,20,38,.18)",
    flex: 1,
    justifyContent: "flex-end",
  },
  menu: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: 35,
  },
  menuTitle: {
    color: "#302437",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  menuItem: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  menuText: { color: "#7E7284", fontSize: 14 },
  menuActive: { color: "#20142A", fontWeight: "700" },
});
