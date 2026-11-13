import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
// Legacy card component retained independently of the linked-account route.
export interface LinkedCard {
  id: string; bank: string; type: string; network: "mastercard" | "visa" | "verve";
  fullCardNumber: string; last4: string; expiry: string; cvv: string; cardHolder: string;
  spentThisMonth: number; monthlyBudget: number; txnCount: number;
  status: "Active" | "Frozen"; isPrimary?: boolean; brandColor: string;
  cardBgGradient: [string, string]; tiltAngle: string;
  smartInsight: { headline: string; subtext: string; category: string; icon: keyof typeof Ionicons.glyphMap };
  recentTxns: { name: string; amt: string; date: string }[];
}
import type { ThemePalette } from "../src/theme";
import { useReducedMotion } from "./AuthBackdrop";

export default function LinkedCardCarousel({ cards, selectedId, onSelect, onOpen, theme, revealed = false }: {
  cards: LinkedCard[];
  selectedId: string;
  revealed?: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  theme: ThemePalette;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const [viewport, setViewport] = useState(screenWidth - 40);
  const cardWidth = Math.min(230, Math.max(176, viewport * 0.62));
  const cardHeight = cardWidth * 1.5;
  const stride = cardWidth + 28;
  const scroll = useRef(new Animated.Value(0)).current;
  const list = useRef<FlatList<LinkedCard>>(null);
  const reduced = useReducedMotion();
  const selectedIndex = Math.max(0, cards.findIndex(card => card.id === selectedId));

  // Recenter when linking a card or changing device orientation.
  useEffect(() => {
    const frame = requestAnimationFrame(() => list.current?.scrollToOffset({ offset: selectedIndex * stride, animated: false }));
    return () => cancelAnimationFrame(frame);
  }, [cards.length, stride]);

  const choose = (index: number) => {
    const card = cards[index];
    if (!card) return;
    onSelect(card.id);
    list.current?.scrollToOffset({ offset: index * stride, animated: reduced === false });
  };

  return (
    <View onLayout={event => setViewport(event.nativeEvent.layout.width)}>
      <View style={styles.selection}>
        <Text style={[styles.bank, { color: theme.textPrimary }]} numberOfLines={1}>{cards[selectedIndex]?.bank}</Text>
        <Text style={[styles.type, { color: theme.textSecondary }]}>{cards[selectedIndex]?.type}</Text>
      </View>
      <Animated.FlatList
        ref={list}
        data={cards}
        keyExtractor={card => card.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={stride}
        decelerationRate="fast"
        disableIntervalMomentum
        bounces={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: Math.max(0, (viewport - stride) / 2) }}
        getItemLayout={(_, index) => ({ length: stride, offset: stride * index, index })}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scroll } } }], {
          useNativeDriver: true,
          listener: (event: any) => {
            const index = Math.max(0, Math.min(cards.length - 1, Math.round(event.nativeEvent.contentOffset.x / stride)));
            if (cards[index] && cards[index].id !== selectedId) onSelect(cards[index].id);
          },
        })}
        renderItem={({ item: card, index }) => {
          const range = [(index - 1) * stride, index * stride, (index + 1) * stride];
          const selected = card.id === selectedId;
          return (
            <View style={{ width: stride, height: cardHeight + 40, alignItems: "center", justifyContent: "center" }}>
              <Animated.View style={{
                opacity: scroll.interpolate({ inputRange: range, outputRange: [0.55, 1, 0.55], extrapolate: "clamp" }),
                transform: reduced === false ? [
                  { perspective: 900 },
                  { scale: scroll.interpolate({ inputRange: range, outputRange: [0.86, 1, 0.86], extrapolate: "clamp" }) },
                  { rotateY: scroll.interpolate({ inputRange: range, outputRange: ["12deg", "0deg", "-12deg"], extrapolate: "clamp" }) },
                  { translateY: scroll.interpolate({ inputRange: range, outputRange: [12, 0, 12], extrapolate: "clamp" }) },
                ] : [],
              }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${card.bank}, card ending ${card.last4}${selected ? ', selected. Open details' : '. Select card'}`}
                  accessibilityState={{ selected }}
                  onPress={() => selected ? onOpen(card.id) : choose(index)}
                  style={[styles.card, { width: cardWidth, height: cardHeight, backgroundColor: card.cardBgGradient[0], borderColor: card.brandColor }]}
                >
                  <View style={styles.topRow}>
                    <View style={[styles.chip, { backgroundColor: "#D8C79E" }]}>
                      <View style={styles.chipLine} />
                      <View style={[styles.chipLine, { transform: [{ rotate: "90deg" }] }]} />
                    </View>
                    <Ionicons name="wifi" size={23} color="#FFFFFFBB" style={{ transform: [{ rotate: "90deg" }] }} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardBank} numberOfLines={2}>{card.bank}</Text>
                    <Text style={styles.cardType}>{card.type}</Text>
                    <Text style={[styles.number, selected && revealed && { fontSize: 12, letterSpacing: 1 }]}>{selected && revealed ? card.fullCardNumber : `••••  ${card.last4}`}</Text>
                  </View>
                  <View>
                    <Text style={styles.holder} numberOfLines={1}>{card.cardHolder}</Text>
                    <View style={styles.footer}>
                      <Text style={styles.network}>{card.network.toUpperCase()}</Text>
                      <Text style={styles.status}>{card.status === "Frozen" ? "FROZEN" : card.isPrimary ? "PRIMARY" : card.expiry}</Text>
                    </View>
                  </View>
                  <View pointerEvents="none" style={[styles.arc, { borderColor: `${card.brandColor}35` }]} />
                </Pressable>
              </Animated.View>
            </View>
          );
        }}
      />
      <View style={styles.pagination}>
        <Pressable onPress={() => choose(selectedIndex - 1)} disabled={selectedIndex === 0} accessibilityRole="button" accessibilityLabel="Previous card" style={styles.arrow}>
          <Ionicons name="chevron-back" size={20} color={selectedIndex === 0 ? theme.border : theme.accent} />
        </Pressable>
        <Text style={[styles.count, { color: theme.textSecondary }]}>{selectedIndex + 1} / {cards.length}</Text>
        <Pressable onPress={() => choose(selectedIndex + 1)} disabled={selectedIndex === cards.length - 1} accessibilityRole="button" accessibilityLabel="Next card" style={styles.arrow}>
          <Ionicons name="chevron-forward" size={20} color={selectedIndex === cards.length - 1 ? theme.border : theme.accent} />
        </Pressable>
      </View>
      <Text style={[styles.hint, { color: theme.textSecondary }]}>Swipe to browse · Tap a card to manage it</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  selection: { alignItems: "center", marginBottom: 8 },
  bank: { fontSize: 21, fontWeight: "700", letterSpacing: -0.5 },
  type: { fontSize: 12, marginTop: 5 },
  card: { borderRadius: 22, borderWidth: 1, padding: 22, justifyContent: "space-between", overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowRadius: 16, shadowOpacity: 0.2, elevation: 6 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chip: { width: 32, height: 25, borderRadius: 6, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  chipLine: { position: "absolute", height: 1, width: 32, backgroundColor: "#8D805E" },
  cardBody: { gap: 10 },
  cardBank: { color: "#FFF", fontSize: 19, fontWeight: "700" },
  cardType: { color: "#FFFFFFAA", fontSize: 10, lineHeight: 15 },
  number: { color: "#FFFFFFCC", fontSize: 15, letterSpacing: 3, marginTop: 12 },
  holder: { color: "#FFFFFFAA", fontSize: 9, letterSpacing: 1.1, marginBottom: 12 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  network: { color: "#FFF", fontSize: 18, fontWeight: "800", fontStyle: "italic" },
  status: { color: "#FFFFFFAA", fontSize: 8, fontWeight: "700" },
  arc: { position: "absolute", width: 280, height: 280, borderRadius: 140, borderWidth: 1, right: -170, top: 70 },
  pagination: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 20 },
  count: { fontSize: 12, fontWeight: "600", minWidth: 36, textAlign: "center" },
  arrow: { padding: 10 },
  hint: { fontSize: 11, textAlign: "center", marginBottom: 20 },
});
