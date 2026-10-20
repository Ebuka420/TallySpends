import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import DynamicLogo from "../components/DynamicLogo";
import { useReducedMotion } from "../components/AuthBackdrop";
import { useAppStore } from "../src/store";
import { getThemePalette, THEME_IDS, THEME_IDENTITIES, type ThemeId, type ThemeMode } from "../src/theme";
function ThemePreview({ id, mode, selected, onPress }: { id: ThemeId; mode: ThemeMode; selected: boolean; onPress: () => void }) {
  const theme = getThemePalette(id, mode);
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: reduced !== false ? 1 : scale.value }] }));
  return <Animated.View style={animated}><Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`${theme.identity.name}. ${theme.identity.mood}`} onPress={onPress}
    onPressIn={() => { if (reduced === false) scale.set(withTiming(.985, { duration: 90 })); }}
    onPressOut={() => { scale.set(reduced !== false ? 1 : withSpring(1, { damping: theme.identity.motion.damping, stiffness: theme.identity.motion.stiffness })); }}
    style={[s.card, { backgroundColor: theme.surface, borderColor: selected ? theme.accent : theme.border, shadowColor: theme.shadow, shadowOpacity: theme.identity.depth }]}>
    <View style={s.top}>
      <DynamicLogo size={50} palette={theme} />
      <View style={{ flex: 1, gap: 5 }}><Text style={[s.name, { color: theme.textPrimary }]}>{theme.identity.name}{id === "aurora" ? " · Default" : ""}</Text><Text style={[s.mood, { color: theme.textSecondary }]}>{theme.identity.mood}</Text></View>
      <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={23} color={selected ? theme.accent : theme.textSecondary} />
    </View>
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[s.mini, { backgroundColor: theme.background }]}>
      <View style={[s.hero, { backgroundColor: theme.surface }]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 200 60"><Defs><LinearGradient id={`preview${id}`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={theme.surface} /><Stop offset="1" stopColor={theme.surfaceSoft} /></LinearGradient></Defs><Rect width={200} height={60} fill={`url(#preview${id})`} /><Path d="M130 70 Q110 20 200 -10 M150 85 Q120 20 220 0" stroke={theme.logoMiddle} strokeOpacity={.2} fill="none" /></Svg>
        <View style={[s.line, { width: "35%", backgroundColor: theme.textSecondary }]} /><View style={[s.line, { width: "65%", height: 6, backgroundColor: theme.textPrimary }]} />
      </View>
      <View style={{ flex: 1, gap: 9 }}><View style={[s.line, { backgroundColor: theme.border, width: "70%" }]} /><View style={[s.line, { backgroundColor: theme.accentSoft, width: "100%", height: 8 }]} /><View style={[s.line, { backgroundColor: theme.accent, width: "52%" }]} /></View>
    </View>
    <View style={s.palette}>{[theme.background, theme.surfaceSoft, theme.accentSecondary, theme.accent, theme.hero].map((color, i) => <View key={i} style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: color, borderWidth: 1, borderColor: theme.border }} />)}<Text style={[s.previewLabel, { color: theme.textSecondary }]}>UI preview</Text></View>
  </Pressable></Animated.View>;
}
export default function SettingsThemesScreen() {
  const router = useRouter();
  const { theme, themeMode, themePreference, darkModePreference, setThemePreference, setDarkModePreference } = useAppStore();
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={24} color={theme.textPrimary} /></Pressable><Text style={[s.title, { color: theme.textPrimary }]}>Themes</Text><View style={{ width: 44 }} /></View>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={[s.heading, { color: theme.textPrimary }]}>Make it feel like you.</Text><Text style={[s.description, { color: theme.textSecondary }]}>Eight expressions. The same TallySpends.</Text>
      <Text style={[s.section, { color: theme.textSecondary }]}>APPEARANCE</Text>
      <View style={[s.modes, { backgroundColor: theme.surfaceSoft }]}>{(["light", "dark", "system"] as const).map(mode => <Pressable key={mode} accessibilityRole="radio" accessibilityState={{ checked: darkModePreference === mode }} accessibilityLabel={mode === "system" ? "System default appearance" : `${mode} appearance`} onPress={() => { void setDarkModePreference(mode).catch(() => Alert.alert("Could not save appearance", "Your preview is active. Please select it again to retry saving.")); }} style={[s.mode, { backgroundColor: darkModePreference === mode ? theme.surface : "transparent" }]}><Ionicons name={mode === "light" ? "sunny-outline" : mode === "dark" ? "moon-outline" : "phone-portrait-outline"} size={17} color={darkModePreference === mode ? theme.accent : theme.textSecondary} /><Text style={{ fontSize: 12, color: theme.textPrimary }}>{mode === "system" ? "System" : mode === "light" ? "Light" : "Dark"}</Text></Pressable>)}</View>
      <Text style={[s.section, { color: theme.textSecondary }]}>YOUR ATMOSPHERE</Text>
      {THEME_IDS.map(id => <ThemePreview key={id} id={id} mode={themeMode} selected={themePreference === id} onPress={() => { void setThemePreference(id).catch(() => Alert.alert("Could not save theme", `${THEME_IDENTITIES[id].name} is previewing. Please select it again to retry saving.`)); }} />)}
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 5 }, back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, title: { fontSize: 20, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingBottom: 35 }, heading: { fontSize: 25, fontWeight: "600", letterSpacing: -.7, marginTop: 18 }, description: { fontSize: 13, lineHeight: 21, marginTop: 7, marginBottom: 5 },
  section: { fontSize: 10, letterSpacing: 1.5, fontWeight: "600", marginTop: 22, marginBottom: 12 }, modes: { flexDirection: "row", borderRadius: 16, padding: 4, gap: 3 }, mode: { flex: 1, minHeight: 44, padding: 6, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", flexWrap: "wrap", gap: 6 },
  card: { padding: 16, borderRadius: 21, borderWidth: 1, marginBottom: 13, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 1 }, top: { flexDirection: "row", alignItems: "center", gap: 12 }, name: { fontSize: 14, fontWeight: "600" }, mood: { fontSize: 11, lineHeight: 17 },
  mini: { marginTop: 14, padding: 10, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 12 }, hero: { width: "57%", height: 60, borderRadius: 9, overflow: "hidden", padding: 12, gap: 10, justifyContent: "center" }, line: { height: 3, borderRadius: 4 }, palette: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 12 }, previewLabel: { fontSize: 9, marginLeft: 5 },
});
