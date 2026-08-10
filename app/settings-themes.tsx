import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useAppStore } from "../src/store";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { APP_COLORS } from "../src/theme";

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
];

export default function SettingsThemesScreen() {
  const router = useRouter();
  const { themePreference, setThemePreference } = useAppStore();
  const [selected, setSelected] = useState(themePreference || "aurora");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Themes</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIconCircle}>
          <Ionicons name="color-palette-outline" size={22} color="#C47C49" />
        </View>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>Choose a look</Text>
          <Text style={styles.heroSubtitle}>
            Pick an aesthetic that suits your mood and style.
          </Text>
        </View>
      </View>

      {themes.map((theme) => (
        <TouchableOpacity
          key={theme.id}
          style={[styles.card, selected === theme.id && styles.cardActive]}
          onPress={async () => {
            setSelected(theme.id);
            await setThemePreference(theme.id);
          }}
        >
          <View
            style={[styles.colorSwatch, { backgroundColor: theme.accent }]}
          />
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>{theme.title}</Text>
            <Text style={styles.cardSubtitle}>{theme.subtitle}</Text>
          </View>
          {selected === theme.id ? (
            <Ionicons name="checkmark-circle" size={22} color="#5B4E91" />
          ) : (
            <Ionicons name="ellipse-outline" size={22} color="#C7C7CC" />
          )}
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: APP_COLORS.textPrimary },
  headerSpacer: { width: 32 },
  heroCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  heroIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: APP_COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroTextWrap: { flex: 1 },
  heroTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: APP_COLORS.textPrimary,
    marginBottom: 4,
  },
  heroSubtitle: { fontSize: 12.5, color: APP_COLORS.textSecondary, lineHeight: 18 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  cardActive: { borderWidth: 1, borderColor: "#5B4E91" },
  colorSwatch: { width: 18, height: 18, borderRadius: 9, marginRight: 12 },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: APP_COLORS.textPrimary },
  cardSubtitle: { fontSize: 12.5, color: APP_COLORS.textSecondary, marginTop: 4 },
});
