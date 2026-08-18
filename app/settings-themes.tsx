import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppStore } from "../src/store";

const themes = [
  {
    id: "aurora",
    title: "Aurora Violet",
    subtitle: "Soft, premium, and calm",
    accent: "#5B4E91",
  },
  {
    id: "sage",
    title: "Sage Green",
    subtitle: "Fresh and focused",
    accent: "#34A853",
  },
  {
    id: "sunset",
    title: "Sunset Peach",
    subtitle: "Warm and expressive",
    accent: "#C47C49",
  },
  {
    id: "ocean",
    title: "Ocean Breeze",
    subtitle: "Deep, crisp blue tones",
    accent: "#1E40AF",
  },
  {
    id: "forest",
    title: "Forest Pine",
    subtitle: "Focused and organic green",
    accent: "#15803D",
  },
  {
    id: "crimson",
    title: "Crimson Rose",
    subtitle: "Elegant and passionate rose",
    accent: "#BE123C",
  },
  {
    id: "midnight",
    title: "Midnight Gold",
    subtitle: "Deep obsidian with gold accents",
    accent: "#F59E0B",
  },
];

export default function SettingsThemesScreen() {
  const router = useRouter();
  const {
    themePreference,
    setThemePreference,
    darkModePreference,
    setDarkModePreference,
    theme,
  } = useAppStore();
  const [selected, setSelected] = useState(themePreference || "aurora");

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Themes
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
          <View
            style={[
              styles.heroIconCircle,
              { backgroundColor: theme.accentSoft },
            ]}
          >
            <Ionicons
              name="color-palette-outline"
              size={22}
              color={theme.accent}
            />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
              Choose a look
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Pick an aesthetic that suits your mood and style.
            </Text>
          </View>
        </View>

        {themes.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.card,
              { backgroundColor: theme.surface },
              selected === t.id && [
                styles.cardActive,
                { borderColor: theme.accent },
              ],
            ]}
            onPress={async () => {
              setSelected(t.id as any);
              await setThemePreference(t.id as any);
            }}
          >
            <View style={[styles.colorSwatch, { backgroundColor: t.accent }]} />
            <View style={styles.cardTextWrap}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                {t.title}
              </Text>
              <Text
                style={[styles.cardSubtitle, { color: theme.textSecondary }]}
              >
                {t.subtitle}
              </Text>
            </View>
            {selected === t.id ? (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={theme.accent}
              />
            ) : (
              <Ionicons name="ellipse-outline" size={22} color={theme.border} />
            )}
          </TouchableOpacity>
        ))}

        {/* Appearance Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            APPEARANCE
          </Text>
        </View>

        <View style={styles.appearanceContainer}>
          {(["light", "dark", "system"] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.appearanceCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
                darkModePreference === mode && {
                  borderColor: theme.accent,
                  borderWidth: 1,
                },
              ]}
              onPress={() => setDarkModePreference(mode)}
            >
              <View style={styles.appearanceCardContent}>
                <Ionicons
                  name={
                    mode === "light"
                      ? "sunny-outline"
                      : mode === "dark"
                        ? "moon-outline"
                        : "phone-portrait-outline"
                  }
                  size={20}
                  color={
                    darkModePreference === mode
                      ? theme.accent
                      : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.appearanceText,
                    { color: theme.textPrimary },
                    darkModePreference === mode && {
                      fontWeight: "700",
                      color: theme.accent,
                    },
                  ]}
                >
                  {mode === "light"
                    ? "Light mode"
                    : mode === "dark"
                      ? "Dark mode"
                      : "System default"}
                </Text>
              </View>
              {darkModePreference === mode ? (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.accent}
                />
              ) : (
                <Ionicons
                  name="ellipse-outline"
                  size={20}
                  color={theme.border}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { paddingBottom: 32 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSpacer: { width: 32 },
  heroCard: {
    flexDirection: "row",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroTextWrap: { flex: 1 },
  heroTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  heroSubtitle: { fontSize: 12.5, lineHeight: 18 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  cardActive: { borderWidth: 1 },
  colorSwatch: { width: 18, height: 18, borderRadius: 9, marginRight: 12 },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600" },
  cardSubtitle: { fontSize: 12.5, marginTop: 4 },
  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  appearanceContainer: {
    marginHorizontal: 20,
  },
  appearanceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  appearanceCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  appearanceText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
