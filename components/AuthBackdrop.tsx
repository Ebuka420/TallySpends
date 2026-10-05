import { useFocusEffect } from "expo-router";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from "react-native-svg";

export function useReducedMotion() {
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduced(value);
    }).catch(() => { if (mounted) setReduced(true); });
    return () => { mounted = false; subscription.remove(); };
  }, []);
  return reduced;
}

type SymbolKind = "coin" | "naira" | "bars" | "trend";
const symbols: { kind: SymbolKind; x: number; y: number; angle: number }[] = [
  { kind: "coin", x: 0.08, y: 0.30, angle: -30 },
  { kind: "bars", x: 0.24, y: 0.10, angle: 0 },
  { kind: "naira", x: 0.81, y: 0.11, angle: -24 },
  { kind: "coin", x: 0.91, y: 0.35, angle: 34 },
  { kind: "trend", x: 0.91, y: 0.57, angle: -12 },
];

function FinanceSymbol({ kind, color, dark }: { kind: SymbolKind; color: string; dark: boolean }) {
  if (kind === "naira") return <Text style={[styles.naira, { color }]}>₦</Text>;
  return (
    <Svg width={40} height={40} viewBox="0 0 32 32">
      {kind === "coin" ? <>
        <Defs>
          <LinearGradient id="coin" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={dark ? "#C7B9DE" : "#B1A2C1"} />
            <Stop offset="0.5" stopColor={color} />
            <Stop offset="1" stopColor={dark ? "#665278" : "#281B37"} />
          </LinearGradient>
        </Defs>
        <Ellipse cx="17" cy="25" rx="10" ry="3" fill={color} opacity={0.08} />
        <Ellipse cx="17" cy="15" rx="9" ry="12" fill={color} />
        <Ellipse cx="15" cy="14" rx="8" ry="11" fill="url(#coin)" />
        <Ellipse cx="15" cy="14" rx="6" ry="9" fill="none" stroke={dark ? "#E1D5EE" : "#D4C6E0"} strokeWidth={0.6} opacity={0.5} />
        <Path d="M13 19 V9 L17 19 V9 M11 13 H19 M11 15 H19" fill="none" stroke={dark ? "#33223F" : "#E6DBEE"} strokeWidth={0.8} />
      </> : kind === "bars" ? <>
        <Rect x="5" y="21" width="4" height="7" rx="1" fill={color} />
        <Rect x="13" y="15" width="4" height="13" rx="1" fill={color} />
        <Rect x="21" y="7" width="4" height="21" rx="1" fill={color} />
      </> : <Path d="M3 27 L12 16 L18 21 L28 6 M21 7 L28 6 L28 13" stroke={color} strokeWidth={1.3} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </Svg>
  );
}

function FloatingSymbol({ symbol, index, running, color, dark }: {
  symbol: typeof symbols[number]; index: number; running: boolean; color: string; dark: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!running) { progress.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 2300 + (index % 4) * 320, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(progress, { toValue: 0, duration: 2300 + (index % 4) * 320, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [running, progress, index]);
  return <Animated.View style={[
    styles.symbol,
    { left: `${symbol.x * 100}%`, top: `${symbol.y * 100}%`, opacity: 0.85,
      transform: [
        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, index % 2 ? 32 : -36] }) },
        { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, index % 2 ? -18 : 22] }) },
        { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: [`${symbol.angle}deg`, `${symbol.angle + 28}deg`] }) },
        { scaleX: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: symbol.kind === "coin" ? [1, 0.55, 1] : [1, 1.08, 1] }) },
      ],
    },
  ]}><FinanceSymbol kind={symbol.kind} color={color} dark={dark} /></Animated.View>;
}

function OrbitCorner({ bottom, running, color, dark }: { bottom?: boolean; running: boolean; color: string; dark: boolean }) {
  return <View style={[styles.corner, bottom ? styles.bottom : styles.top]}>
    <Svg width="100%" height="100%" viewBox="0 0 390 300" preserveAspectRatio="none">
      <Path d={bottom ? "M-60 42 C39 33 111 95 143 197 M-38 143 C43 139 83 194 111 287 M201 303 C227 193 300 118 440 106" : "M-59 -4 C42 18 98 72 119 173 M-42 128 C39 142 91 195 108 271 M287 159 C319 80 358 40 437 18 M281 300 C321 236 363 209 420 204"} stroke={color} strokeWidth={0.6} opacity={0.22} fill="none" />
      <Path d={bottom ? "M-23 54 C65 69 104 112 133 176" : "M-25 126 C41 139 82 178 100 227"} stroke={color} strokeWidth={0.7} strokeDasharray="2 5" opacity={0.28} fill="none" />
      {(bottom ? [[87, 90], [67, 220], [278, 192]] : [[65, 44], [25, 148], [350, 57]]).map(([x, y]) => <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.2} fill={color} opacity={0.55} />)}
    </Svg>
    {symbols.map((symbol, index) => <FloatingSymbol key={index} symbol={bottom ? { ...symbol, x: 1 - symbol.x, y: 1 - symbol.y } : symbol} index={index + (bottom ? 5 : 0)} running={running} color={color} dark={dark} />)}
  </View>;
}

/** Decorative only: stays behind the scroll view and never intercepts touches. */
export default function AuthBackdrop({ color, dark }: { color: string; dark: boolean }) {
  const reduced = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(AppState.currentState === "active");
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => setActive(state === "active"));
    return () => subscription.remove();
  }, []);
  const running = focused && active && reduced === false;
  return <View style={styles.backdrop} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <OrbitCorner running={running} color={color} dark={dark} />
    <OrbitCorner bottom running={running} color={color} dark={dark} />
  </View>;
}

export function AuthEntrance({ children, trigger, style, delay = 0, fromY = 0 }: {
  children: ReactNode;
  trigger?: string;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  fromY?: number;
}) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced === null) return;
    if (reduced) { progress.setValue(1); return; }
    progress.setValue(0);
    const entrance = Animated.timing(progress, {
      toValue: 1,
      duration: 620,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    entrance.start();
    return () => entrance.stop();
  }, [trigger, reduced, progress, delay, fromY]);
  return (
    <Animated.View style={[style, {
      opacity: progress,
      transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" },
  corner: { position: "absolute", left: 0, right: 0, height: "34%", maxHeight: 310 },
  top: { top: 0 },
  bottom: { bottom: 0 },
  symbol: { position: "absolute", width: 40, height: 40, marginLeft: -20, marginTop: -20, alignItems: "center", justifyContent: "center" },
  naira: { fontSize: 27, fontWeight: "500" },
});
