import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useReducedMotion } from "./AuthBackdrop";
import type { ThemeId, ThemeMode, ThemePalette } from "../src/theme";
import { getDashboardPalette } from "../src/theme";

export type HomeCard = {
  id: string; title: string; text: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tint?: string; color?: string; onPress: () => void;
};

/** Smart Insights, Ajo and savings share the exact same visual component. */
export function HomeCarousel({ title, link, onViewAll, cards, theme, themeMode, interval = 5000 }: {
  title: string; link: string; onViewAll: () => void; cards: HomeCard[];
  theme: ThemePalette; themeMode: ThemeMode; themePreference: ThemeId; interval?: number;
}) {
  const cardTheme = getDashboardPalette(themeMode);
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(306, width - 40);
  const stride = cardWidth + 12;
  const [viewport, setViewport] = useState(0);
  const [index, setIndex] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const pausedUntil = useRef(0);
  const position = Math.min(index, Math.max(0, cards.length - 1));
  useEffect(() => {
    if (cards.length < 2 || reduced !== false) return;
    const timer = setInterval(() => {
      if (Date.now() >= pausedUntil.current) setIndex(value => (value + 1) % cards.length);
    }, interval);
    return () => clearInterval(timer);
  }, [cards.length, interval, reduced]);
  useEffect(() => { scroll.current?.scrollTo({ x: position * stride, animated: reduced === false }); }, [position, stride, reduced]);
  return <View>
    <View style={s.header}>
      <Text style={[s.heading, { color: theme.textPrimary }]}>{title}</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${link}: ${title}`} onPress={onViewAll} hitSlop={10}>
        <Text style={[s.link, { color: theme.accentSecondary }]}>{link}</Text>
      </TouchableOpacity>
    </View>
    <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} snapToInterval={stride} decelerationRate="fast"
      onLayout={event => setViewport(event.nativeEvent.layout.width)}
      contentContainerStyle={{ gap: 12, paddingRight: Math.max(20, viewport - cardWidth) }}
      onScrollBeginDrag={() => { pausedUntil.current = Date.now() + 10000; }}
      onMomentumScrollEnd={({ nativeEvent }) => setIndex(Math.max(0, Math.min(cards.length - 1, Math.round(nativeEvent.contentOffset.x / stride))))}>
      {cards.map(card => <TouchableOpacity key={card.id} accessibilityRole="button" activeOpacity={0.85} onPress={card.onPress}
        style={[s.card, { width: cardWidth, backgroundColor: themeMode === "dark" ? cardTheme.surface : card.tint || cardTheme.accentSoft, borderWidth: themeMode === "dark" ? 1 : 0, borderColor: cardTheme.border }]}>
        <View style={[s.icon, { backgroundColor: themeMode === "dark" ? cardTheme.surfaceSoft : cardTheme.surface }]}>
          <Ionicons name={card.icon} size={18} color={themeMode === "dark" ? cardTheme.accent : card.color || cardTheme.accent} />
        </View>
        <View style={s.copy}>
          <Text numberOfLines={2} style={[s.title, { color: cardTheme.textPrimary }]}>{card.title}</Text>
          <Text numberOfLines={3} style={[s.text, { color: cardTheme.textSecondary }]}>{card.text}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={cardTheme.accentSecondary} style={{ alignSelf: "center" }} />
      </TouchableOpacity>)}
    </ScrollView>
    <View style={s.dots} accessibilityLabel={`Card ${position + 1} of ${cards.length}`}>
      {cards.map((card, i) => <TouchableOpacity key={card.id} accessibilityRole="button" accessibilityLabel={`Show ${card.title}`} accessibilityState={{ selected: i === position }} hitSlop={{ top: 10, bottom: 10, left: 2, right: 2 }}
        onPress={() => { pausedUntil.current = Date.now() + 10000; setIndex(i); }}
        style={{ height: 5, width: i === position ? 16 : 5, borderRadius: 3, backgroundColor: i === position ? theme.accent : theme.border }} />)}
    </View>
  </View>;
}
const s = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12, marginTop: 23 },
  heading: { fontSize: 18, fontWeight: "700", letterSpacing: -0.35 },
  link: { fontSize: 12, fontWeight: "600" },
  card: { borderRadius: 21, flexDirection: "row", minHeight: 122, padding: 16 },
  icon: { alignItems: "center", borderRadius: 14, height: 42, justifyContent: "center", marginRight: 12, width: 42 },
  copy: { flex: 1, paddingRight: 5 },
  title: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  text: { fontSize: 12, lineHeight: 17, marginTop: 6 },
  dots: { alignItems: "center", flexDirection: "row", gap: 5, justifyContent: "center", marginTop: 13 },
});



