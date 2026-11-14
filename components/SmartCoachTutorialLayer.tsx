import { usePathname } from "expo-router";
import React, { useEffect, useState, useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Mask, Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getProfileSnapshot, subscribeProfile } from "../src/profile/repository";
import { consumeTutorialReplay, finishTutorial, getTutorialProgress, getTourSnapshot, startTutorial, stopTutorial, TUTORIALS, setTutorialStep, useTour, type TutorialPage } from "../src/coach/tutorials";
import type { ThemePalette } from "../src/theme";

type LayoutRect = { x: number; y: number; width: number; height: number };
const targets = new Map<string, LayoutRect>();
const targetListeners = new Set<() => void>();
function publishTargets() { targetListeners.forEach(listener => listener()); }
function setTarget(id: string, rect: LayoutRect) {
  const old = targets.get(id);
  if (old && Math.abs(old.x - rect.x) < 2 && Math.abs(old.y - rect.y) < 2 && Math.abs(old.width - rect.width) < 2 && Math.abs(old.height - rect.height) < 2) return;
  targets.set(id, rect); publishTargets();
}
const revealers = new Map<string, () => boolean>();
const measureTargets = new Map<string, () => void>();
export function setCoachTutorialAnchor(x: number, y: number, size = 58) { setTarget("coach", { x, y, width: size, height: size }); }
export function TutorialTarget({ id, children, style, scrollRef, scrollOffsetRef }: { id: string; children: React.ReactNode; style?: any; scrollRef?: React.RefObject<any>; scrollOffsetRef?: React.RefObject<number> }) {
  const ref = React.useRef<any>(null);
  const { height } = useWindowDimensions();
  const measure = () => ref.current?.measureInWindow((x: number, y: number, width: number, targetHeight: number) => {
    const rect = { x, y, width, height: targetHeight };
    setTarget(id, rect);
    revealers.set(id, () => {
      if (!scrollRef?.current || !scrollOffsetRef) return false;
      const top = 105, bottom = height - 200;
      const delta = y < top ? y - top : y + targetHeight > bottom ? y + targetHeight - bottom : 0;
      if (!delta) return false;
      scrollRef.current.scrollTo({ y: Math.max(0, (scrollOffsetRef.current || 0) + delta), animated: true });
      return true;
    });
  });
  useEffect(() => { measureTargets.set(id, measure); const timer = setTimeout(measure, 80); return () => { clearTimeout(timer); measureTargets.delete(id); revealers.delete(id); }; }, []);
  return <View ref={ref} collapsable={false} onLayout={measure} style={style}>{children}</View>;
}

function pageForPath(path: string): TutorialPage | null {
  if (path === "/" || path === "/(tabs)" || path === "/(tabs)/") return "home";
  if (path.endsWith("/expenses")) return "expenses";
  if (path.endsWith("/budget")) return "budget";
  if (path.endsWith("/analytics")) return "analytics";
  if (path === "/profile") return "profile";
  return null;
}

export default function SmartCoachTutorialLayer({ theme }: { theme: ThemePalette }) {
  const pathname = usePathname();
  const page = pageForPath(pathname);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tour = useTour();
  const [targetVersion, setTargetVersion] = useState(0);
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileSnapshot);
  const owner = profile.scope;
  const [target, setTargetRect] = useState<LayoutRect | null>(null);
  const [targetKey, setTargetKey] = useState<string | null>(null);
  const targetKeyRef = React.useRef<string | null>(null);
  const [bubbleHeight, setBubbleHeight] = useState(190);
  const [coach, setCoach] = useState<LayoutRect>({ x: width - 78, y: height - insets.bottom - 150, width: 58, height: 58 });

  useEffect(() => { return () => stopTutorial(); }, []);
  useEffect(() => {
    const listener = () => setTargetVersion(v => v + 1);
    targetListeners.add(listener);
    return () => { targetListeners.delete(listener); };
  }, []);
  useEffect(() => { setCoach(targets.get("coach") || { x: width - 78, y: height - insets.bottom - 150, width: 58, height: 58 }); }, [targetVersion, width, height, insets.bottom]);

  useEffect(() => {
    if (!owner || !page) return;
    let alive = true;
    void (async () => {
      if (await consumeTutorialReplay(owner, page)) return;
      const progress = await getTutorialProgress(owner);
      if (alive && !getTourSnapshot().page && !progress[page]) await startTutorial(owner, page, false);
    })();
    return () => { alive = false; };
  }, [owner, page]);

  const activePage = tour.page && tour.page === page;
  const step = activePage ? TUTORIALS[tour.page!][tour.step] : null;
  useEffect(() => {
    if (!activePage || !step?.target) { setTargetRect(null); setTargetKey(null); targetKeyRef.current = null; return; }
    if (targetKeyRef.current !== step.target) { setTargetRect(null); setTargetKey(null); targetKeyRef.current = null; }
    let alive = true;
    let attempt = 0;
    let scrollRequested = false;
    let freshlyMeasured = false;
    const locate = () => {
      if (!freshlyMeasured) {
        freshlyMeasured = true;
        measureTargets.get(step.target!)?.();
        setTimeout(locate, 60);
        return;
      }
      const value = targets.get(step.target!);
      if (alive && value) {
        setTargetRect(current => current && Math.abs(current.x - value.x) < 2 && Math.abs(current.y - value.y) < 2 && Math.abs(current.width - value.width) < 2 && Math.abs(current.height - value.height) < 2 ? current : value);
        targetKeyRef.current = step.target!;
        setTargetKey(step.target!);
        const reveal = revealers.get(step.target!);
        if (!scrollRequested && reveal?.()) { scrollRequested = true; setTimeout(() => { measureTargets.get(step.target!)?.(); setTimeout(() => {
          const moved = targets.get(step.target!);
          if (alive && moved) setTargetRect(moved);
        }, 120); }, 450); }
        return;
      }
      if (alive && attempt++ < 30) setTimeout(locate, 150);
    };
    locate();
    return () => { alive = false; setTargetRect(null); };
  }, [activePage, step?.target, tour.step]);

  if (!activePage || !step) return null;
  const highlight = step.target === "coach" ? coach : targetKey === step.target ? target : null;
  if (step.target && step.target !== "coach" && !highlight) return null;
  const bubbleWidth = Math.min(width - 24, 370);
  const bubbleLeft = Math.max(16, Math.min(width - bubbleWidth - 16, coach.x + coach.width / 2 - bubbleWidth / 2));
  const coachCenterX = coach.x + coach.width / 2;
  const coachCenterY = coach.y + coach.height / 2;
  const rawTops = [
    coach.y - bubbleHeight - 34,
    coach.y + coach.height + 34,
    insets.top + 12,
    height - insets.bottom - bubbleHeight - 12,
  ];
  const candidates = rawTops.map(top => Math.max(insets.top + 8, Math.min(height - insets.bottom - bubbleHeight - 8, top)));
  const overlaps = (top: number, box: LayoutRect | null) => !!box && bubbleLeft < box.x + box.width + 12 && bubbleLeft + bubbleWidth > box.x - 12 && top < box.y + box.height + 12 && top + bubbleHeight > box.y - 12;
  const bubbleTop = candidates.map((top, index) => ({ top, index,
    score: (overlaps(top, highlight) ? 100000 : 0) + (top < coach.y + coach.height && top + bubbleHeight > coach.y ? 100000 : 0) + Math.abs(top + bubbleHeight / 2 - coachCenterY) + index * .1,
  })).sort((a, b) => a.score - b.score)[0].top;
  const bubbleAboveCoach = bubbleTop + bubbleHeight <= coach.y;
  const pointerX = Math.max(bubbleLeft + 24, Math.min(bubbleLeft + bubbleWidth - 24, coachCenterX));
  const pointerStartY = bubbleAboveCoach ? bubbleTop + bubbleHeight : bubbleTop;
  const pointerEndY = bubbleAboveCoach ? coach.y : coach.y + coach.height;
  const connectorCrossesTarget = !!highlight && coachCenterX >= highlight.x - 10 && coachCenterX <= highlight.x + highlight.width + 10
    && Math.max(Math.min(pointerStartY, pointerEndY), highlight.y - 10) < Math.min(Math.max(pointerStartY, pointerEndY), highlight.y + highlight.height + 10);
  const detourX = highlight ? (highlight.x - 18 >= 16 ? highlight.x - 18 : highlight.x + highlight.width + 18) : coachCenterX;
  const connector = Math.abs(pointerEndY - pointerStartY) > 18 || connectorCrossesTarget
    ? connectorCrossesTarget
      ? `M ${pointerX} ${pointerStartY} Q ${detourX} ${pointerStartY}, ${detourX} ${(pointerStartY + pointerEndY) / 2} Q ${detourX} ${pointerEndY}, ${coachCenterX} ${pointerEndY}`
      : `M ${pointerX} ${pointerStartY} C ${pointerX} ${(pointerStartY + pointerEndY) / 2}, ${coachCenterX} ${(pointerStartY + pointerEndY) / 2}, ${coachCenterX} ${pointerEndY}`
    : null;
  const finalStep = tour.step === TUTORIALS[tour.page!].length - 1;
  const circularStep = step.target === "home-qr" || step.target === "home-wallet-arrow";

  return <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
    <Pressable accessibilityLabel="Tutorial background" onPress={() => {}} style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Mask id="coachSpotlightMask" x={0} y={0} width={width} height={height} maskUnits="userSpaceOnUse">
          <Rect x="0" y="0" width={width} height={height} fill="white" />
          {coach && <Rect x={coach.x - 6} y={coach.y - 6} width={coach.width + 12} height={coach.height + 12} rx={(coach.width + 12) / 2} fill="black" />}
          {highlight && step.target !== "coach" && <Rect x={highlight.x - 7} y={highlight.y - 7} width={highlight.width + 14} height={highlight.height + 14} rx={circularStep ? (Math.min(highlight.width, highlight.height) + 14) / 2 : 14} fill="black" />}
        </Mask>
        <Rect x="0" y="0" width={width} height={height} fill="rgba(17, 12, 22, 0.64)" mask="url(#coachSpotlightMask)" />
        {highlight && step.target !== "coach" && <Rect x={highlight.x - 4} y={highlight.y - 4} width={highlight.width + 8} height={highlight.height + 8} rx={circularStep ? (Math.min(highlight.width, highlight.height) + 8) / 2 : 13} fill="none" stroke={theme.accent} strokeWidth="2" />}
        {connector && <Path d={connector} fill="none" stroke={theme.accent} strokeWidth="2" strokeLinecap="round" opacity=".8" />}
        {!connector && <Path d={`M ${pointerX - 7} ${pointerStartY} L ${coachCenterX} ${pointerEndY} L ${pointerX + 7} ${pointerStartY} Z`} fill={theme.surface} />}
        {connector && <Circle cx={coachCenterX} cy={pointerEndY} r="3" fill={theme.accent} />}
      </Svg>
    </Pressable>
    <View accessibilityViewIsModal onLayout={event => { const next = event.nativeEvent.layout.height; if (Math.abs(next - bubbleHeight) > 2) setBubbleHeight(next); }} style={[s.bubble, { left: bubbleLeft, top: bubbleTop, width: bubbleWidth, backgroundColor: theme.surface }]}>
      <View style={s.bubbleHead}>
        <View style={[s.coachGlyph, { backgroundColor: theme.accentSoft }]}><Text style={{ color: theme.accent, fontSize: 12, fontWeight: "900" }}>✦</Text></View>
        <Text style={[s.eyebrow, { color: theme.textSecondary }]}>SMART COACH</Text>
        <View style={{ flex: 1 }} />
        <Text style={[s.progress, { color: theme.textSecondary }]}>{String(tour.step + 1).padStart(2, "0")} / {String(TUTORIALS[tour.page!].length).padStart(2, "0")}</Text>
      </View>
      <View style={s.progressTrack}>{TUTORIALS[tour.page!].map((_, index) => <View key={index} style={[s.progressSegment, { backgroundColor: index <= tour.step ? theme.accent : theme.border }]} />)}</View>
      <Text style={[s.copy, { color: theme.textPrimary }]}>{step.message}</Text>
      <View style={s.controls}>
        {tour.step > 0 ? <Pressable accessibilityRole="button" onPress={() => void setTutorialStep(tour.step - 1)}><Text style={[s.secondary, { color: theme.textSecondary }]}>Back</Text></Pressable> : <View />}
        <Pressable accessibilityRole="button" onPress={() => void finishTutorial("skipped")}><Text style={[s.secondary, { color: theme.textSecondary }]}>Skip tour</Text></Pressable>
        <Pressable accessibilityRole="button" style={[s.primary, { backgroundColor: theme.accent }]} onPress={() => void (finalStep ? finishTutorial("completed") : setTutorialStep(tour.step + 1))}>
          <Text style={{ color: theme.onAccent, fontWeight: "700" }}>{tour.page === "home" && tour.step === 0 ? "Show me around" : finalStep && tour.page === "profile" ? "Got it" : finalStep ? "Done" : "Next"}</Text>
        </Pressable>
      </View>
    </View>
  </View>;
}

const s = StyleSheet.create({
  bubble: { position: "absolute", zIndex: 10000, elevation: 30, padding: 14, borderRadius: 18, shadowColor: "#17101D", shadowOpacity: .15, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, gap: 8 },
  bubbleHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  coachGlyph: { height: 24, width: 24, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 9, fontWeight: "800", letterSpacing: 1.1 },
  progress: { fontSize: 10, fontWeight: "700", letterSpacing: .5 },
  progressTrack: { height: 3, flexDirection: "row", gap: 4 },
  progressSegment: { flex: 1, borderRadius: 2 },
  copy: { fontSize: 12.5, lineHeight: 18, letterSpacing: -.1 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 1 },
  secondary: { fontSize: 11, fontWeight: "600", paddingVertical: 8, paddingHorizontal: 4 },
  primary: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 11 },
});
