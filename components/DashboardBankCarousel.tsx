import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { ScrollViewInstance } from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { bankCardPalette } from "../src/banking/branding";
import BankLogo from "./BankLogo";
import { cardIndexAtOffset, carouselMetrics, OVERVIEW_ID } from "../src/banking/carousel";
import type { LinkedBankAccount } from "../src/banking/backend";
import { dashboardBankAccounts } from "../src/banking/dashboard";
import type { ThemePalette } from "../src/theme";
import { getDashboardPalette } from "../src/theme";
import BrandMark from "./BrandMark";
import { useReducedMotion } from "./AuthBackdrop";
import { TutorialTarget } from "./SmartCoachTutorialLayer";

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
  const brand = account ? bankCardPalette(account, "#20142A") : undefined;
  const color = brand ? brand.background : props.dark ? appearance.surface : "#FEFDFE";
  const ink = brand ? brand.ink : props.dark ? appearance.textPrimary : "#20142A";
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
    <Pressable accessibilityRole="button" accessibilityLabel={account ? `Open ${account.bankName} account insights` : "Open sandbox wallet"}
      onPress={() => props.onOpenAccounts(account?.id)}
      style={[styles.card, { width, height, backgroundColor: color, borderColor: brand?.border ?? appearance.border }]}>
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
          <Text style={[styles.overview, { color: ink }]}>{account ? account.status === "Disconnected" ? "Disconnected" : "Sandbox account" : "Sandbox wallet"}</Text>
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
        <TutorialTarget id={account ? `home-account-arrow-${account.id}` : "home-wallet-arrow"}><Pressable accessibilityRole="button" accessibilityLabel={account ? "View linked account insights" : "Open sandbox wallet"}
          onPress={event => { event.stopPropagation(); props.onOpenAccounts(account?.id); }}
          style={[styles.currencyBadge, { backgroundColor: brand?.badge ?? appearance.accentSoft }]}>
          <Ionicons name="arrow-forward" size={20} color={ink} />
        </Pressable></TutorialTarget>
      </View>
    </Pressable>
  );
}

export default function DashboardBankCarousel(props: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const { width, height, stride, inset, trailingInset } = carouselMetrics(screenWidth);
  const cards = useMemo<Card[]>(() => [{ id: OVERVIEW_ID }, ...dashboardBankAccounts(props.accounts).filter(account => account.id !== OVERVIEW_ID).map(account => ({ id: account.id, account }))], [props.accounts]);
  const count = cards.length;
  const signature = cards.map(card => card.id).join("|");
  const reduced = useReducedMotion();
  const list = useRef<FlatList<Card>>(null);
  const indicators = useRef<ScrollViewInstance>(null);
  const visibleIndex = useRef(0);
  const layout = useRef("");
  const selectedIndex = Math.max(0, cards.findIndex(card => card.id === props.selectedId));
  const indicatorWidth = Math.min(count * 36, screenWidth - 96);
  const indicatorOffset = Math.max(0, Math.min(count * 36 - indicatorWidth, selectedIndex * 36 - (indicatorWidth - 36) / 2));
  useEffect(() => { indicators.current?.scrollTo({ x: indicatorOffset, animated: reduced === false }); }, [indicatorOffset, reduced]);
  useEffect(() => {
    const nextLayout = `${signature}:${stride}`;
    // Preserve the selected account when records arrive, are reordered/removed,
    // or the screen changes size. Ordinary swipes must not trigger scroll resets.
    if (layout.current !== nextLayout || visibleIndex.current !== selectedIndex) {
      layout.current = nextLayout;
      visibleIndex.current = selectedIndex;
      list.current?.scrollToOffset({ offset: selectedIndex * stride, animated: false });
    }
  }, [signature, stride, selectedIndex]);

  const commit = useCallback((index: number) => {
    if (visibleIndex.current === index) return;
    visibleIndex.current = index;
    props.onSelect(cards[index]?.id || OVERVIEW_ID);
    if (reduced === false) void Haptics.selectionAsync().catch(() => {});
  }, [cards, props.onSelect, reduced]);
  const select = (index: number) => {
    const next = Math.max(0, Math.min(count - 1, index));
    list.current?.scrollToOffset({ offset: next * stride, animated: reduced === false });
  };
  return (
    <View style={[styles.container, { width: screenWidth, marginLeft: -20 }]}>
      <FlatList ref={list} data={cards} horizontal keyExtractor={card => card.id}
        extraData={props} showsHorizontalScrollIndicator={false} scrollEnabled={count > 1}
        snapToInterval={stride} snapToAlignment="start" decelerationRate="fast" disableIntervalMomentum
        directionalLockEnabled bounces={false} nestedScrollEnabled removeClippedSubviews={false}
        style={{ width: screenWidth, height: height + 18 }}
        contentContainerStyle={{ paddingLeft: inset, paddingRight: trailingInset, paddingTop: 6, paddingBottom: 12 }}
        ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
        getItemLayout={(_, index) => ({ length: stride, offset: stride * index, index })}
        renderItem={({ item }) => <CardFace {...props} card={item} width={width} height={height} />}
        scrollEventThrottle={16}
        onScroll={event => commit(cardIndexAtOffset(event.nativeEvent.contentOffset.x, stride, count))}
        onContentSizeChange={() => list.current?.scrollToOffset({ offset: selectedIndex * stride, animated: false })}
      />
      {count > 1 && <>
        <View style={styles.dots}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous account" disabled={selectedIndex === 0} onPress={() => select(selectedIndex - 1)} style={[styles.selector, { opacity: selectedIndex === 0 ? 0.3 : 1 }]}><Ionicons name="chevron-back" size={18} color={props.theme.accent} /></Pressable>
          <ScrollView ref={indicators} horizontal showsHorizontalScrollIndicator={false}
            style={{ width: indicatorWidth, flexGrow: 0, flexShrink: 0 }} contentContainerStyle={{ alignItems: "center" }}
            onContentSizeChange={() => indicators.current?.scrollTo({ x: indicatorOffset, animated: false })}>
          {cards.map((card, index) => <Pressable key={card.id} accessibilityRole="button"
            accessibilityLabel={`Show ${card.account?.bankName || "TallySpends wallet"}, card ${index + 1} of ${count}`}
            accessibilityState={{ selected: index === selectedIndex }} onPress={() => select(index)} style={styles.selector}>
            <View style={{ height: 5, width: index === selectedIndex ? 15 : 5, borderRadius: 3, backgroundColor: index === selectedIndex ? props.theme.accent : props.theme.border }} />
          </Pressable>)}
          </ScrollView>
          <Pressable accessibilityRole="button" accessibilityLabel="Next account" disabled={selectedIndex === count - 1} onPress={() => select(selectedIndex + 1)} style={[styles.selector, { opacity: selectedIndex === count - 1 ? 0.3 : 1 }]}><Ionicons name="chevron-forward" size={18} color={props.theme.accent} /></Pressable>
        </View>
        <Text style={{ color: props.theme.textSecondary, textAlign: "center", fontSize: 11, marginBottom: 8 }}>Swipe left or right · {selectedIndex + 1} of {count}</Text>
      </>}
      {(props.loading || props.error) && <Pressable onPress={props.onRetry} disabled={props.loading} style={styles.status} accessibilityRole="button">
        {props.loading ? <ActivityIndicator size="small" color={props.theme.accent} /> : null}
        <Text style={{ color: props.theme.textSecondary, fontSize: 11 }}>{props.loading ? "Refreshing linked accounts…" : props.error}</Text>
      </Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
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
  dots: { flexDirection: "row", flexWrap: "nowrap", justifyContent: "center", alignItems: "center", height: 44 },
  selector: { width: 36, height: 44, flexShrink: 0, alignItems: "center", justifyContent: "center" },
  status: { minHeight: 26, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
});


