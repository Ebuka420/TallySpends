import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { expenseDonutSlices, type ExpensePoint } from "../src/expenses/charts";
import type { ThemePalette } from "../src/theme";

const money = (amount: number) => `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExpenseChartDetails({ mode, points, categories, total, theme }: {
  mode: "bar" | "donut" | "table"; points: ExpensePoint[]; categories: [string, number][]; total: number; theme: ThemePalette;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const primary = { color: theme.textPrimary };
  const secondary = { color: theme.textSecondary };
  if (!points.some(point => point.count)) return <Text style={[secondary, { paddingVertical: 28, textAlign: "center" }]}>No expenses recorded for this period.</Text>;

  if (mode === "table") return <View style={{ marginTop: 16 }}>
    <View style={{ flexDirection: "row", gap: 8, paddingBottom: 10 }}>
      <Text style={[secondary, { flex: 1, fontSize: 11 }]}>Period</Text>
      <Text style={[secondary, { width: 46, fontSize: 11, textAlign: "right" }]}>Count</Text>
      <Text style={[secondary, { flex: 1, fontSize: 11, textAlign: "right" }]}>Amount</Text>
    </View>
    {points.map(point => <View key={point.label} accessible accessibilityLabel={`${point.range}, ${point.count} expenses, ${money(point.value)}`}
      style={{ flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderColor: theme.border, paddingVertical: 10 }}>
      <View style={{ flex: 1 }}><Text style={[primary, { fontSize: 12 }]}>{point.label}</Text><Text style={[secondary, { fontSize: 10, marginTop: 2 }]}>{point.range}</Text></View>
      <Text style={[secondary, { width: 46, textAlign: "right", fontSize: 12 }]}>{point.count}</Text>
      <Text style={[primary, { flex: 1, textAlign: "right", fontSize: 12 }]}>{money(point.value)}</Text>
    </View>)}
    <View style={{ flexDirection: "row", gap: 8, borderTopWidth: 1, borderColor: theme.border, paddingTop: 12 }}>
      <Text style={[primary, { flex: 1, fontWeight: "700" }]}>Total</Text>
      <Text style={[primary, { width: 46, textAlign: "right" }]}>{points.reduce((sum, point) => sum + point.count, 0)}</Text>
      <Text style={[primary, { flex: 1, textAlign: "right", fontWeight: "700" }]}>{money(total)}</Text>
    </View>
  </View>;

  if (mode === "donut") {
    const slices = expenseDonutSlices(categories);
    if (!slices.length) return <Text style={[secondary, { paddingVertical: 28, textAlign: "center" }]}>Recorded expenses total ₦0.00. There are no category shares to display.</Text>;
    const colors = [...theme.chart, theme.textSecondary];
    const circumference = 2 * Math.PI * 62;
    return <View style={{ marginTop: 16, gap: 12 }}>
      <View accessible accessibilityLabel={`Category breakdown, total ${money(total)}. Amounts and shares listed below.`} style={{ alignSelf: "center", width: 164, height: 164, alignItems: "center", justifyContent: "center" }}>
        <Svg width={164} height={164} viewBox="0 0 164 164" style={{ position: "absolute" }}>
          <Circle cx={82} cy={82} r={62} fill="none" stroke={theme.border} strokeWidth={22} />
          {slices.map((slice, index) => <Circle key={index} cx={82} cy={82} r={62} fill="none" stroke={colors[index % colors.length]}
            strokeWidth={22} strokeDasharray={`${slice.share * circumference} ${circumference}`}
            strokeDashoffset={-slice.offset * circumference} rotation={-90} origin="82, 82" />)}
        </Svg>
        <Text style={[secondary, { fontSize: 10 }]}>TOTAL SPENT</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[primary, { width: 110, textAlign: "center", fontSize: 15, fontWeight: "700", marginTop: 4 }]}>{money(total)}</Text>
      </View>
      {slices.map((slice, index) => <View key={index} style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors[index % colors.length] }} />
        <Text style={[primary, { flex: 1, fontSize: 12 }]}>{slice.label}</Text>
        <View style={{ alignItems: "flex-end" }}><Text style={[primary, { fontSize: 12 }]}>{money(slice.value)}</Text>
          <Text style={[secondary, { fontSize: 10 }]}>{(slice.share * 100).toFixed(1)}%</Text></View>
      </View>)}
    </View>;
  }

  const max = Math.max(...points.map(point => point.value), 1);
  const chosen = selected === null ? undefined : points[selected];
  return <View style={{ marginTop: 16, gap: 10 }}>
    <Text style={[secondary, { fontSize: 10 }]}>Scale: ₦0 – {money(max === 1 && total === 0 ? 0 : max)}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={points.length > 6} contentContainerStyle={{ flexGrow: 1, gap: 6, paddingBottom: 5 }}>
      {points.map((point, index) => <Pressable key={point.label} accessibilityRole="button"
        accessibilityLabel={`${point.range}: ${money(point.value)}, ${point.count} expenses`} accessibilityState={{ selected: selected === index }}
        onPress={() => setSelected(index)} style={{ flex: 1, minWidth: 36, alignItems: "center", gap: 7 }}>
        <View style={{ height: 112, width: "100%", justifyContent: "flex-end", alignItems: "center", borderBottomWidth: 1, borderColor: theme.border }}>
          <View style={{ height: point.value / max * 108, width: "70%", maxWidth: 36, borderTopLeftRadius: 5, borderTopRightRadius: 5,
            backgroundColor: theme.accent, opacity: selected === null || selected === index ? 1 : .45 }} />
        </View>
        <Text style={[selected === index ? primary : secondary, { fontSize: 11 }]}>{point.label}</Text>
      </Pressable>)}
    </ScrollView>
    <Text accessibilityLiveRegion="polite" style={[primary, { fontSize: 12, minHeight: 32 }]}>{chosen
      ? `${chosen.range}: ${money(chosen.value)} · ${chosen.count} ${chosen.count === 1 ? "expense" : "expenses"}`
      : "Tap a bar to see its amount and transaction count."}</Text>
  </View>;
}
