import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, AppState, BackHandler, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { cancelAnimation, Easing, Extrapolation, FadeIn, FadeOut, interpolate, useAnimatedReaction, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming, type SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { completeIntro, INTRO_PAGES, introAuthRoute, useIntroStatus } from "../../src/onboarding/intro";
import { useReducedMotion } from "../AuthBackdrop";
import AnimatedBackground from "./AnimatedBackground";
import OnboardingVisual from "./OnboardingVisual";
import { useIntroColors, type IntroColors } from "./motion";
import BrandMark from "../BrandMark";
import { ONBOARDING_THEME } from "../../src/onboarding/brand";

function CopyReveal({ children, progress, page, delay, reduced }: { children: ReactNode; progress: SharedValue<number>; page: number; delay: number; reduced: boolean }) {
  const entered = useSharedValue(reduced || page !== 0 ? 1 : 0);
  useEffect(() => {
    entered.value = reduced || page !== 0 ? 1 : withDelay(delay, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    return () => cancelAnimation(entered);
  }, [reduced, page, delay, entered]);
  const style = useAnimatedStyle(() => {
    const distance = Math.min(1, Math.abs(progress.value - page));
    return { opacity: entered.value * (1 - distance * 0.55), transform: [{ translateY: reduced ? 0 : (1 - entered.value) * 15 + distance * (10 + delay / 50) }] };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}
function ProgressDot({ index, progress, selected, onPress }: { index: number; progress: SharedValue<number>; selected: boolean; onPress: () => void }) {
  const c = useIntroColors(); const s = getStyles(c);
  const style = useAnimatedStyle(() => {
    const strength = Math.max(0, 1 - Math.abs(progress.value - index));
    return { width: 7 + 20 * strength, opacity: 0.3 + 0.7 * strength };
  });
  return <Pressable accessibilityRole="button" accessibilityLabel={`Introduction ${index + 1} of 4`} accessibilityState={{ selected }} onPress={onPress} style={s.dotTouch}>
    <Animated.View style={[s.dot, style]} />
  </Pressable>;
}
function Page({ index, selected, width, visualHeight, motion, reduced, progress, fontScale }: { index: number; selected: number; width: number; visualHeight: number; motion: boolean; reduced: boolean; progress: SharedValue<number>; fontScale: number }) {
  const c = useIntroColors(); const s = getStyles(c);
  const page = INTRO_PAGES[index];
  const scale = Math.min(1, (width - 48) / 320, (visualHeight - 18) / 310);
  const visualMotion = useAnimatedStyle(() => ({ opacity: interpolate(Math.abs(progress.value - index), [0, 0.8, 1], [1, 0.5, 0.12], Extrapolation.CLAMP), transform: [{ translateX: reduced ? 0 : (index - progress.value) * 25 }] }));
  return <ScrollView style={{ width, flexShrink: 0 }} contentContainerStyle={[s.page, { minHeight: "100%" }]} showsVerticalScrollIndicator={false} nestedScrollEnabled
    accessibilityElementsHidden={index !== selected} importantForAccessibility={index === selected ? "auto" : "no-hide-descendants"}>
    <View style={{ height: visualHeight, alignItems: "center", justifyContent: "center" }} accessible accessibilityRole="image" accessibilityLabel={[
      "TallySpends brand mark", "Illustrative spending chart and transaction preview. No account data is shown.", "Illustrative budget categories and planning progress. No account data is shown.", "Smart Coach illustration and example insight card. No personal advice is shown.",
    ][index]}>
      <Animated.View pointerEvents="none" style={[{ width: 320, height: 310, transform: [{ scale }] }]}>
        <Animated.View style={visualMotion}><OnboardingVisual index={index} active={motion && index === selected} reduced={reduced} /></Animated.View>
      </Animated.View>
      {index > 0 && <Text allowFontScaling={false} style={{ position: "absolute", bottom: 0, color: c.subtle, fontSize: 9, letterSpacing: 1.3 }}>ILLUSTRATIVE PREVIEW</Text>}
    </View>
    <View style={[s.copy, { paddingTop: visualHeight < 200 ? 6 : 15 }]}>
      <CopyReveal page={index} progress={progress} delay={430} reduced={reduced}><Text style={s.label}>{page.label}</Text></CopyReveal>
      <CopyReveal page={index} progress={progress} delay={510} reduced={reduced}><Text accessibilityRole="header" style={[s.headline, { fontSize: width < 360 ? 36 : width < 400 ? 40 : 43, lineHeight: (width < 360 ? 40 : width < 400 ? 45 : 49) * Math.min(fontScale, 1.1) }]}>{page.title}</Text></CopyReveal>
      <CopyReveal page={index} progress={progress} delay={620} reduced={reduced}><Text style={s.description}>{page.description}</Text></CopyReveal>
    </View>
  </ScrollView>;
}
export default function OnboardingScreen({ preview = false }: { preview?: boolean }) {
  const c = useIntroColors(); const s = getStyles(c);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const reducedSetting = useReducedMotion();
  const reduced = reducedSetting !== false;
  const status = useIntroStatus();
  const [index, setIndex] = useState(0);
  const selected = useRef(0);
  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submission = useRef(false);
  const alive = useRef(true);
  const pager = useRef<ScrollView>(null);
  const progress = useSharedValue(0);
  const press = useSharedValue(1);
  const exit = useSharedValue(1);
  const updateIndex = useCallback((next: number) => { selected.current = next; setIndex(next); }, []);
  useAnimatedReaction(() => Math.max(0, Math.min(3, Math.round(progress.value))), (next, previous) => {
    if (next !== previous) scheduleOnRN(updateIndex, next);
  });
  const scroll = useAnimatedScrollHandler(event => { progress.set(event.contentOffset.x / width); }, [width]);
  const go = useCallback((next: number) => {
    if (submission.current) return;
    const page = Math.max(0, Math.min(3, next));
    updateIndex(page); pager.current?.scrollTo({ x: page * width, animated: !reduced });
  }, [width, reduced, updateIndex]);
  useEffect(() => { pager.current?.scrollTo({ x: selected.current * width, animated: false }); progress.set(selected.current); }, [width, progress]);
  useEffect(() => {
    alive.current = true;
    const listener = AppState.addEventListener("change", state => setForeground(state === "active"));
    return () => { alive.current = false; listener.remove(); cancelAnimation(exit); };
  }, [exit]);
  useFocusEffect(useCallback(() => {
    setFocused(true);
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (submission.current) return true;
      if (selected.current > 0) { go(selected.current - 1); return true; }
      return false;
    });
    return () => { setFocused(false); listener.remove(); };
  }, [go]));
  const finish = async (mode: "signup" | "login") => {
    if (submission.current) return;
    submission.current = true; setBusy(true); setError("");
    try {
      if (!preview) await completeIntro();
      if (!reduced && alive.current) await new Promise<void>(resolve => {
        exit.set(withTiming(0, { duration: 180 }, () => { scheduleOnRN(resolve); }));
      });
      if (alive.current) {
        if (preview) {
          if (router.canGoBack()) router.back();
          else router.replace("/(tabs)");
        } else router.replace(introAuthRoute(mode));
      }
    }
    catch (e) { if (alive.current) setError(e instanceof Error ? e.message : "Couldn't continue. Please try again."); }
    finally { submission.current = false; if (alive.current) setBusy(false); }
  };
  useEffect(() => {
    if (!preview && status.seen && !submission.current) router.replace(introAuthRoute("login"));
  }, [preview, status.seen, router]);
  const brand = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0, 0.75], [0, 1], Extrapolation.CLAMP) }));
  const button = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));
  const leaving = useAnimatedStyle(() => ({ opacity: exit.value }));
  const available = height - insets.top - Math.max(insets.bottom, 12) - 56 - 174;
  const visualHeight = Math.max(120, Math.min(340, available - (fontScale > 1.3 ? 310 : 245)));
  const motion = focused && foreground;
  if (reducedSetting === null || (!preview && status.seen && !busy)) return <View style={s.screen}><StatusBar style={c.mode === "dark" ? "light" : "dark"} /></View>;
  return <View style={s.screen}>
    <StatusBar style={c.mode === "dark" ? "light" : "dark"} />
    <AnimatedBackground progress={progress} active={motion} reduced={reduced} />
    <Animated.View style={[s.safe, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) }, leaving]}>
      <View style={s.header}>
        <Animated.View style={[s.brand, brand]} accessible={false}><BrandMark size={23} palette={ONBOARDING_THEME} /><Text style={s.brandName}>TallySpends</Text></Animated.View>
        <Pressable accessibilityRole="button" accessibilityLabel={preview ? "Close introduction preview" : "Skip introduction and sign in"} disabled={busy} onPress={() => void finish("login")} style={s.skip}><Text style={s.skipText}>{preview ? "Close" : "Skip"}</Text></Pressable>
      </View>
      <Animated.ScrollView ref={pager} horizontal pagingEnabled bounces={false} scrollEnabled={!busy} directionalLockEnabled showsHorizontalScrollIndicator={false} onScroll={scroll} scrollEventThrottle={16} style={{ flex: 1 }}>
        {INTRO_PAGES.map((page, i) => <Page key={page.label} index={i} selected={index} width={width} visualHeight={visualHeight} motion={motion} reduced={reduced} progress={progress} fontScale={fontScale} />)}
      </Animated.ScrollView>
      <View style={s.footer}>
        <View style={s.progress} accessibilityLabel={`Introduction ${index + 1} of 4`}>{INTRO_PAGES.map((page, i) => <ProgressDot key={page.label} index={i} progress={progress} selected={index === i} onPress={() => go(i)} />)}</View>
        {!!(error || (!preview && status.error)) && <Text accessibilityLiveRegion="polite" style={s.error}>{error || status.error}</Text>}
        <Animated.View style={button}><Pressable accessibilityRole="button" accessibilityLabel={index === 3 ? (preview ? "Done. Return to app." : "Get Started. Create an account.") : "Next introduction"} accessibilityState={{ disabled: busy, busy }} disabled={busy}
          onPressIn={() => { if (!reduced) press.set(withTiming(0.985, { duration: 100 })); }}
          onPressOut={() => { press.set(reduced ? 1 : withSpring(1, { damping: 24, stiffness: 220 })); }}
          onPress={() => {
            if (index === 3) void finish("signup");
            else { if (!reduced) void Haptics.selectionAsync().catch(() => {}); go(index + 1); }
          }} style={s.primary}>
          {busy ? <ActivityIndicator color={c.brand} /> : <><Animated.Text key={index === 3 ? "start" : "next"} entering={reduced ? undefined : FadeIn.duration(160)} exiting={reduced ? undefined : FadeOut.duration(100)} style={s.primaryText}>{index === 3 ? (preview ? "Done" : "Get Started") : "Next"}</Animated.Text><Ionicons name="arrow-forward" size={19} color={c.brand} /></>}
        </Pressable></Animated.View>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void finish("login")} style={s.secondary}><Text style={s.secondaryText}>{preview ? "Back to app" : "I already have an account"}</Text></Pressable>
      </View>
    </Animated.View>
  </View>;
}
const getStyles = (c: IntroColors) => StyleSheet.create({ screen: { flex: 1, backgroundColor: c.base }, safe: { flex: 1 }, header: { height: 56, paddingLeft: 28, paddingRight: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, brand: { flexDirection: "row", alignItems: "center", gap: 8 }, brandName: { color: c.text, fontSize: 13, letterSpacing: -0.3, fontWeight: "500" }, skip: { minWidth: 52, minHeight: 44, alignItems: "center", justifyContent: "center" }, skipText: { color: c.muted, fontSize: 12 }, page: { paddingHorizontal: 28, paddingBottom: 18, flexGrow: 1 }, copy: { gap: 16, maxWidth: 500, width: "100%", alignSelf: "center" }, label: { color: c.lavender, fontSize: 9, letterSpacing: 1.8, fontWeight: "600" }, headline: { color: c.text, fontWeight: "500", letterSpacing: -1.7 }, description: { color: c.muted, fontSize: 15, lineHeight: 24, maxWidth: 340 }, footer: { paddingHorizontal: 28, gap: 10, maxWidth: 556, width: "100%", alignSelf: "center" }, progress: { flexDirection: "row", justifyContent: "flex-start", alignItems: "center", height: 44, marginLeft: -10, marginBottom: 5 }, dotTouch: { minWidth: 44, height: 44, alignItems: "center", justifyContent: "center" }, dot: { height: 4, backgroundColor: c.lavender, borderRadius: 3 }, primary: { height: 55, borderRadius: 18, backgroundColor: c.button, borderWidth: 1, borderColor: "rgba(255,255,255,.2)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 }, primaryText: { color: c.brand, fontSize: 14, fontWeight: "600" }, secondary: { minHeight: 44, alignItems: "center", justifyContent: "center" }, secondaryText: { color: c.muted, fontSize: 12 }, error: { color: c.danger, fontSize: 11, lineHeight: 17 } });


