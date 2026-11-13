import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet, Text, View, type TextProps } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";
import { useIntroColors, useAmbient, type IntroColors } from "./motion";
import BrandMark from "../BrandMark";
import { ONBOARDING_THEME } from "../../src/onboarding/brand";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = { active: boolean; reduced: boolean };
// These labels are part of a decorative product illustration. The page's real
// heading/body/buttons still follow system text size and can scroll vertically.
function PreviewText(props: TextProps) { return <Text {...props} allowFontScaling={false} />; }
function useReveal(active: boolean, reduced: boolean, delay = 0) {
  const value = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    cancelAnimation(value);
    if (reduced) value.value = 1;
    else if (active) value.value = withDelay(delay, withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) }));
    else value.value = 0;
    return () => cancelAnimation(value);
  }, [active, reduced, delay, value]);
  return value;
}
function WelcomeVisual({ active, reduced }: Props) {
  const c = useIntroColors(); const s = getStyles(c);
  const symbol = useReveal(active, reduced);
  const wordmark = useReveal(active, reduced, 220);
  const symbolStyle = useAnimatedStyle(() => ({ opacity: symbol.value, transform: [{ translateY: reduced ? 0 : (1 - symbol.value) * 12 }, { scale: reduced ? 1 : 0.96 + symbol.value * 0.04 }] }));
  const wordmarkStyle = useAnimatedStyle(() => ({ opacity: wordmark.value, transform: [{ translateY: reduced ? 0 : (1 - wordmark.value) * 8 }] }));
  return <View style={s.welcome}>
    <Animated.View style={symbolStyle}><BrandMark size={122} palette={ONBOARDING_THEME} /></Animated.View>
    <Animated.Text allowFontScaling={false} style={[s.wordmark, wordmarkStyle]}>TallySpends</Animated.Text>
    <View style={s.hairline} />
  </View>;
}
function ChartVisual({ active, reduced }: Props) {
  const c = useIntroColors(); const s = getStyles(c);
  const reveal = useReveal(active, reduced, 80);
  const float = useAmbient(active, reduced, 5000);
  const line = useAnimatedProps(() => ({ strokeDashoffset: 450 * (1 - reveal.value) }));
  const transaction = useAnimatedStyle(() => ({ opacity: reveal.value, transform: [{ translateY: reduced ? 0 : 16 * (1 - reveal.value) + float.value * -4 }] }));
  return <View style={s.visual}>
    <View style={[s.chart, s.card]}>
      <View style={s.cardHeader}><PreviewText style={s.eyebrow}>SPENDING PATTERNS</PreviewText><View style={s.period}><PreviewText style={s.tiny}>A clearer picture</PreviewText></View></View>
      <Svg width="100%" height={126} viewBox="0 0 300 145" accessible={false}>
        {[36, 80, 124].map(y => <Path key={y} d={`M4 ${y} H296`} stroke={c.lavender} strokeOpacity={0.08} strokeWidth={1} />)}
        <AnimatedPath d="M6 111 C28 112 30 78 56 84 S88 114 110 88 S142 31 166 47 S200 92 220 62 S253 33 293 19" fill="none" stroke={c.lavender} strokeWidth={2.6} strokeLinecap="round" strokeDasharray={[450, 450]} animatedProps={line} />
      </Svg>
      <View style={s.axis}><PreviewText style={s.tiny}>Your everyday choices</PreviewText><PreviewText style={s.tiny}>In perspective</PreviewText></View>
    </View>
    <Animated.View style={[s.transaction, s.card, transaction]}><View style={s.icon}><Ionicons name="receipt-outline" color={c.lavender} size={19} /></View><View style={{ flex: 1, gap: 5 }}><PreviewText style={s.cardTitle}>Everyday spending</PreviewText><PreviewText style={s.tiny}>The details, in one place.</PreviewText></View><Ionicons name="arrow-up-right-box-outline" color={c.subtle} size={17} /></Animated.View>
    
  </View>;
}
function BudgetRow({ active, reduced, index, title, fraction }: Props & { index: number; title: string; fraction: number }) {
  const c = useIntroColors(); const s = getStyles(c);
  const position = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    cancelAnimation(position);
    position.value = reduced ? 1 : active ? withDelay(index * 85, withSpring(1, { damping: 23, stiffness: 125, mass: 1 })) : 0;
    return () => cancelAnimation(position);
  }, [active, reduced, index, position]);
  const style = useAnimatedStyle(() => ({ opacity: 0.25 + position.value * 0.75, transform: [{ translateX: reduced ? 0 : (1 - position.value) * (index % 2 ? -18 : 18) }, { translateY: reduced ? 0 : (1 - position.value) * 12 }] }));
  return <Animated.View style={[s.budgetRow, style]}><View style={{ flexDirection: "row", justifyContent: "space-between" }}><PreviewText style={s.cardTitle}>{title}</PreviewText><View style={[s.budgetDot, { opacity: fraction }]} /></View><View style={s.track}><View style={[s.fill, { width: `${fraction * 100}%` }]} /></View></Animated.View>;
}
function BudgetVisual(props: Props) {
  const c = useIntroColors(); const s = getStyles(c);
  const reveal = useReveal(props.active, props.reduced);
  const ring = useAnimatedProps(() => ({ strokeDashoffset: 226.2 * (1 - reveal.value * 0.72) }));
  return <View style={s.visual}>
    <View style={[s.budget, s.card]}>
      <View style={s.cardHeader}><View style={{ gap: 7 }}><PreviewText style={s.eyebrow}>A PLAN THAT FITS</PreviewText><PreviewText style={s.budgetTitle}>Your priorities.</PreviewText></View>
        <View style={s.ring}><Svg width={84} height={84} viewBox="0 0 84 84" accessible={false}><Circle cx={42} cy={42} r={36} fill="none" stroke={c.lavender} strokeOpacity={0.09} strokeWidth={3} /><AnimatedCircle cx={42} cy={42} r={36} fill="none" stroke={c.lavender} strokeWidth={3} strokeLinecap="round" strokeDasharray={[226.2, 226.2]} animatedProps={ring} rotation={-90} origin="42, 42" /></Svg><Ionicons style={{ position: "absolute" }} name="checkmark" size={23} color={c.lavender} /></View>
      </View>
      <BudgetRow {...props} index={0} title="Everyday essentials" fraction={0.72} />
      <BudgetRow {...props} index={1} title="Something to save for" fraction={0.46} />
      <BudgetRow {...props} index={2} title="Room to enjoy" fraction={0.3} />
    </View>
  </View>;
}
function CoachVisual({ active, reduced }: Props) {
  const c = useIntroColors(); const s = getStyles(c);
  const phase = useAmbient(active, reduced, 6000);
  const reveal = useReveal(active, reduced, 120);
  const orb = useAnimatedStyle(() => ({ opacity: 0.85 + phase.value * 0.15, transform: [{ scale: reduced ? 1 : 1 + phase.value * 0.035 }] }));
  const insight = useAnimatedStyle(() => ({ opacity: reveal.value, transform: [{ translateY: reduced ? 0 : 10 * (1 - reveal.value) }] }));
  return <View style={s.visual}>
    <Animated.View style={[s.orb, orb]}><Svg width={230} height={230} viewBox="0 0 230 230" accessible={false}>
      <Defs><RadialGradient id="intro-coach"><Stop offset="0" stopColor={c.lavender} stopOpacity={0.28} /><Stop offset="0.48" stopColor={c.lavender} stopOpacity={0.13} /><Stop offset="1" stopColor={c.lavender} stopOpacity={0} /></RadialGradient></Defs>
      <Circle cx={115} cy={115} r={114} fill="url(#intro-coach)" />
      {[98, 76, 53].map((r, i) => <Circle key={r} cx={115} cy={115} r={r} fill="none" stroke={c.lavender} strokeOpacity={0.07 + i * 0.035} strokeWidth={1} />)}
      <Circle cx={115} cy={115} r={28} fill={c.lavender} fillOpacity={0.08} stroke={c.lavender} strokeOpacity={0.2} />
    </Svg><Ionicons style={{ position: "absolute" }} name="sparkles-outline" color={c.lavender} size={26} /></Animated.View>
    <Animated.View style={[s.insight, s.card, insight]}><View style={s.cardHeader}><PreviewText style={s.eyebrow}>SMART COACH</PreviewText><View style={s.smallDot} /></View><PreviewText style={s.insightTitle}>A little clarity.</PreviewText><PreviewText style={s.insightCopy}>A thoughtful next step for your money.</PreviewText></Animated.View>
    
  </View>;
}
export default function OnboardingVisual({ index, ...props }: Props & { index: number }) {
  switch (index) { case 0: return <WelcomeVisual {...props} />; case 1: return <ChartVisual {...props} />; case 2: return <BudgetVisual {...props} />; default: return <CoachVisual {...props} />; }
}
const getStyles = (c: IntroColors) => StyleSheet.create({
  welcome: { alignItems: "center", justifyContent: "center", gap: 21, width: 320, height: 310 }, wordmark: { color: c.text, fontSize: 28, letterSpacing: -0.8, fontWeight: "600" }, hairline: { width: 30, height: 1, backgroundColor: c.border, marginTop: 5 },
  visual: { width: 320, height: 310, alignItems: "center", justifyContent: "center" }, card: { backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: 23 }, cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, eyebrow: { color: c.muted, fontSize: 8, letterSpacing: 1.5, fontWeight: "600" }, tiny: { color: c.subtle, fontSize: 9 },
  chart: { width: 302, padding: 19, paddingBottom: 24, transform: [{ rotate: "-2deg" }] }, period: { borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 6 }, axis: { flexDirection: "row", justifyContent: "space-between" },
  transaction: { position: "absolute", top: 199, right: 0, width: 250, padding: 15, borderRadius: 18, flexDirection: "row", gap: 12, alignItems: "center" }, icon: { width: 35, height: 35, backgroundColor: c.soft, borderRadius: 12, justifyContent: "center", alignItems: "center" }, cardTitle: { fontSize: 11, color: c.text, fontWeight: "500" }, preview: { position: "absolute", bottom: 0, fontSize: 7, letterSpacing: 1.8, color: c.subtle },
  budget: { width: 285, padding: 20, gap: 17, transform: [{ rotate: "1deg" }] }, budgetTitle: { fontSize: 20, color: c.text, letterSpacing: -0.5, fontWeight: "500" }, ring: { width: 84, height: 84, justifyContent: "center", alignItems: "center", marginRight: -5, marginTop: -7, marginBottom: -8 }, budgetRow: { gap: 10 }, budgetDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.lavender }, track: { height: 3, backgroundColor: c.soft, borderRadius: 3 }, fill: { height: 3, borderRadius: 3, backgroundColor: c.lavender },
  orb: { position: "absolute", top: -6, width: 230, height: 230, justifyContent: "center", alignItems: "center" }, insight: { position: "absolute", top: 202, width: 274, padding: 19, gap: 10 }, insightTitle: { color: c.text, fontSize: 18, letterSpacing: -0.3, fontWeight: "500" }, insightCopy: { color: c.muted, fontSize: 10 }, smallDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.lavender },
});

