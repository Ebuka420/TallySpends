import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { NIGERIAN_BANKS } from "../src/data/banks";
import BankLogo from "./BankLogo";
import { acceptsRightSwipe, BANK_COLORS, carouselSlotPosition, OVERVIEW_ID } from "../src/banking/carousel";
import type { LinkedBankAccount } from "../src/banking/backend";
import type { ThemePalette } from "../src/theme";
import { getDashboardPalette } from "../src/theme";
import BrandMark from "./BrandMark";
import { useReducedMotion } from "./AuthBackdrop";

type Card = { id: string; account?: LinkedBankAccount };
type Props = {
  accounts: LinkedBankAccount[]; selectedId: string; onSelect: (id: string) => void;
  balance: number | null; visible: boolean; onToggleBalance: () => void;
  onLink: () => void; onOpenAccounts: (accountId?: string) => void; theme: ThemePalette; dark: boolean;
  loading: boolean; error: string | null; onRetry: () => void;
};

function CardFace({ card, width, height, ...props }: Props & { card: Card; width: number; height: number }) {
  const appearance = getDashboardPalette(props.dark ? "dark" : "light");
  const account = card.account;
  // Logos come only from the existing local catalogue; never fetch a guessed URL.
  const bank = account ? NIGERIAN_BANKS.find(item => item.slug === account.bankSlug || item.name.toLowerCase() === account.bankName.toLowerCase()
    || (account.bankName.toLowerCase() === "gtbank" && item.slug === "guaranty-trust-bank")) : undefined;
  const color = account ? BANK_COLORS[bank?.slug || ""] || "#20142A" : props.dark ? appearance.surface : "#FEFDFE";
  const ink = account ? "#FFFFFF" : props.dark ? appearance.textPrimary : "#20142A";
  const amount = account ? account.availableBalance : props.balance;
  let formatted = "Balance unavailable";
  if (typeof amount === "number" && Number.isFinite(amount)) {
    if (!account || account.currency === "NGN") formatted = `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    else if (account.currency) {
      try { formatted = new Intl.NumberFormat(undefined, { style: "currency", currency: account.currency }).format(amount); }
      catch { formatted = "Balance unavailable"; }
    }
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={account ? `Open ${account.bankName} account insights` : "Open linked accounts"}
      onPress={() => props.onOpenAccounts(account?.id)}
      style={[styles.card, { width, height, backgroundColor: color, borderColor: account ? "#FFFFFF25" : appearance.border }]}>
      <Svg pointerEvents="none" width={width} height={height} style={styles.pattern} viewBox="0 0 360 220">
        <Path d="M286 -20 C140 22 176 133 350 166 M225 239 C82 21 342 57 390 149 M365 -20 C305 72 291 120 381 216" stroke={ink} opacity={account ? 0.18 : 0.11} strokeWidth="0.7" fill="none" />
        <Path d="M285 154 v-18 m7 18 v-27 m7 27 v-36" stroke={ink} opacity="0.08" strokeWidth="5" />
      </Svg>
      <View style={styles.cardHeader}>
        <View style={styles.brand}>
          {account ? <BankLogo bank={account} size={26} fallbackSize={22} color={ink} />
            : <BrandMark size={28} palette={props.theme} />}
          <Text numberOfLines={1} style={[styles.brandName, { color: ink }]}>{account?.bankName || "TallySpends"}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Link bank account" hitSlop={8} onPress={event => { event.stopPropagation(); props.onLink(); }} style={styles.link}>
          <Text style={[styles.overview, { color: ink }]}>{account ? "Linked account" : "Local demo overview"}</Text>
          <Ionicons name="add-circle-outline" size={16} color={ink} />
        </Pressable>
      </View>
      <View style={styles.middle}>
        <Svg width={39} height={29} viewBox="0 0 39 29" accessible={false}>
          <Defs><LinearGradient id="chip" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#D1C2A4" /><Stop offset="0.45" stopColor="#FAF1DF" /><Stop offset="1" stopColor="#BAA98D" /></LinearGradient></Defs>
          <Rect x="0.5" y="0.5" width="38" height="28" rx="5" fill="url(#chip)" stroke="#A49272" strokeWidth="0.5" />
          <Path d="M14 0 v7 l-4 4 v8 l4 3 v7 M25 0 v7 l4 4 v8 l-4 3 v7 M0 10 h10 M29 10 h10 M0 19 h10 M29 19 h10 M14 7 h11 M14 22 h11" fill="none" stroke="#9C896A" strokeWidth="0.6" />
        </Svg>
        {account?.maskedAccountNumber && <Text style={[styles.identifier, { color: ink }]}>{account.maskedAccountNumber}</Text>}
      </View>
      <View style={styles.amountRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={props.visible ? "Hide balance" : "Show balance"} onPress={event => { event.stopPropagation(); props.onToggleBalance(); }} style={styles.amountWrap}>
          <Text style={[styles.balanceLabel, { color: ink }]}>AVAILABLE BALANCE</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55} style={[styles.amount, { color: ink, fontSize: amount == null || (account && !account.currency) ? 18 : Math.min(38, width * 0.106) }]}>
            {props.visible ? formatted : "********"}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="View linked account insights"
          onPress={event => { event.stopPropagation(); props.onOpenAccounts(account?.id); }}
          style={[styles.currencyBadge, { backgroundColor: account ? "#FFFFFF18" : appearance.accentSoft }]}>
          <Ionicons name="arrow-forward" size={20} color={ink} />
        </Pressable>
      </View>
    </Pressable>
  );
}

function Slot({ index, count, mode, turn, stride, ...props }: Props & {
  card: Card; width: number; height: number; index: number; count: number;
  mode: "front" | "back" | "peek"; turn: SharedValue<number>; stride: number;
}) {
  const animated = useAnimatedStyle(() => {
    const { x, visible } = carouselSlotPosition(turn.value, index, count, stride, mode);
    return {
      transform: [{ translateX: x }],
      opacity: visible ? 1 : 0,
    };
  });
  const selected = props.card.id === props.selectedId && mode === "front";
  return (
    <Animated.View style={[styles.slot, animated]} pointerEvents={selected ? "auto" : "none"}
      accessibilityElementsHidden={!selected} importantForAccessibility={selected ? "auto" : "no-hide-descendants"}>
      <CardFace {...props} />
    </Animated.View>
  );
}

export default function DashboardBankCarousel(props: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const width = screenWidth * 0.91;
  const height = width / 1.8;
  const stride = width + 10;
  const cards = useMemo<Card[]>(() => [{ id: OVERVIEW_ID }, ...props.accounts.filter(account => account.id !== OVERVIEW_ID).map(account => ({ id: account.id, account }))], [props.accounts]);
  const count = cards.length;
  const signature = cards.map(card => card.id).join("|");
  const reduced = useReducedMotion();
  const turn = useSharedValue(0);
  const origin = useSharedValue(0);
  const busy = useSharedValue(false);
  const accepted = useSharedValue(false);
  const generation = useSharedValue(0);
  const selectedIndex = Math.max(0, cards.findIndex(card => card.id === props.selectedId));
  useEffect(() => {
    generation.value += 1;
    cancelAnimation(turn);
    if (Math.round(turn.value) % count !== selectedIndex || turn.value !== Math.round(turn.value)) turn.value = selectedIndex;
    busy.value = false;
    accepted.value = false;
    return () => { generation.value += 1; cancelAnimation(turn); busy.value = false; };
  }, [signature, stride, props.selectedId]);

  const commit = useCallback((index: number) => {
    props.onSelect(cards[index]?.id || OVERVIEW_ID);
    if (reduced === false) void Haptics.selectionAsync().catch(() => {});
  }, [cards, props.onSelect, reduced]);
  const settle = (target: number, advance: boolean) => {
    "worklet";
    const epoch = generation.value;
    const done = (finished?: boolean) => {
      "worklet";
      if (!finished || epoch !== generation.value) return;
      busy.value = false;
      if (advance) runOnJS(commit)(Math.round(target) % count);
    };
    turn.value = reduced !== false ? withTiming(target, { duration: 0 }, done)
      : withSpring(target, { damping: 25, stiffness: 220, mass: 0.85, overshootClamping: true }, done);
  };
  const pan = Gesture.Pan().enabled(count > 1).maxPointers(1)
    .activeOffsetX(12).failOffsetX(-12).failOffsetY([-12, 12])
    .onStart(() => {
      accepted.value = !busy.value;
      if (!accepted.value) return;
      busy.value = true;
      origin.value = Math.round(turn.value);
    }).onUpdate(event => {
      if (!accepted.value) return;
      // Resistance caps movement to a single step, regardless of swipe speed.
      if (reduced === false) turn.value = origin.value + Math.min(0.85, Math.max(0, event.translationX / stride) * 0.7);
    }).onEnd(event => {
      if (!accepted.value) return;
      accepted.value = false;
      const advance = acceptsRightSwipe(event.translationX, event.translationY, event.velocityX, width, count);
      settle(origin.value + (advance ? 1 : 0), advance);
    }).onFinalize(() => {
      if (accepted.value) { accepted.value = false; settle(origin.value, false); }
    });

  const accessibleNext = () => {
    if (count < 2 || busy.value) return;
    busy.value = true;
    settle(Math.round(turn.value) + 1, true);
  };
  return (
    <View style={[styles.container, { width: screenWidth, marginLeft: -20 }]}>
      <GestureDetector gesture={pan}>
        <Animated.View style={{ width: screenWidth, height: height + 18, overflow: "hidden" }}
          accessibilityActions={count > 1 ? [{ name: "increment", label: "Next account" }] : []}
          onAccessibilityAction={event => { if (event.nativeEvent.actionName === "increment") accessibleNext(); }}>
          <View style={{ marginLeft: 12, marginTop: 6, width: screenWidth - 12, height: height + 12, overflow: "hidden" }}>
            {count === 1 ? <CardFace {...props} card={cards[0]} width={width} height={height} /> : cards.flatMap((card, index) =>
              (["front", "back", "peek"] as const).map(mode => <Slot {...props} key={`${card.id}:${mode}`} card={card} index={index}
                count={count} mode={mode} turn={turn} stride={stride} width={width} height={height} />))}
          </View>
        </Animated.View>
      </GestureDetector>
      {count > 1 && <View style={styles.dots} accessibilityLabel={`Account ${selectedIndex + 1} of ${count}. Swipe right for the next account.`}>
        {cards.map((card, index) => <View key={card.id} style={{ height: 4, width: index === selectedIndex ? 13 : 4, borderRadius: 2, backgroundColor: index === selectedIndex ? props.theme.accent : props.theme.border }} />)}
      </View>}
      {(props.loading || props.error) && <Pressable onPress={props.onRetry} disabled={props.loading} style={styles.status} accessibilityRole="button">
        {props.loading ? <ActivityIndicator size="small" color={props.theme.accent} /> : null}
        <Text style={{ color: props.theme.textSecondary, fontSize: 11 }}>{props.loading ? "Refreshing linked accounts…" : props.error}</Text>
      </Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  slot: { position: "absolute", left: 0, top: 0 },
  card: { borderRadius: 19, borderWidth: 0.7, padding: 18, justifyContent: "space-between", shadowColor: "#20142A", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, overflow: "hidden" },
  pattern: { position: "absolute", top: 0, left: 0 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  brand: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  brandName: { fontWeight: "700", fontSize: 15, flexShrink: 1, letterSpacing: -0.5 },
  logo: { width: 26, height: 26, borderRadius: 5, backgroundColor: "#FFFFFF" },
  link: { flexDirection: "row", gap: 5, alignItems: "center", minHeight: 30 },
  overview: { fontSize: 8, opacity: 0.58 },
  middle: { flexDirection: "row", alignItems: "center", gap: 12 },
  identifier: { fontSize: 11, letterSpacing: 1, opacity: 0.75 },
  amountRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  amountWrap: { flex: 1, minHeight: 44, justifyContent: "flex-end" },
  balanceLabel: { fontSize: 8, letterSpacing: 1.8, opacity: 0.6, marginBottom: 5 },
  amount: { fontWeight: "700", letterSpacing: -1.3 },
  currencyBadge: { minWidth: 44, height: 44, paddingHorizontal: 6, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 5, paddingTop: 1, paddingBottom: 8 },
  status: { minHeight: 26, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
});


