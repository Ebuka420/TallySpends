import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
// Fallback: avoid requiring `expo-blur` so builds succeed when it's not installed
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAppStore } from "../src/store";

export default function SettingsDashboardScreen() {
  const router = useRouter();
  const { tabBarOpacity, setTabBarOpacity, theme } = useAppStore();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const [showInsights, setShowInsights] = useState(true);
  const [showBudgets, setShowBudgets] = useState(true);
  const [showSavings, setShowSavings] = useState(true);
  const [autoAdjustLayout, setAutoAdjustLayout] = useState(true);
  const [isTransparencyExpanded, setIsTransparencyExpanded] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="grid-outline" size={22} color={theme.accent} />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Your dashboard, your way</Text>
            <Text style={styles.heroSubtitle}>
              Choose the insights that matter most on the home screen.
            </Text>
          </View>
        </View>

        {[
          {
            title: "Insights cards",
            subtitle: "Show spending trends and smart summaries",
            value: showInsights,
            onChange: setShowInsights,
          },
          {
            title: "Budgets panel",
            subtitle: "Show budget health and category limits",
            value: showBudgets,
            onChange: setShowBudgets,
          },
          {
            title: "Savings highlights",
            subtitle: "Surface savings goals and progress",
            value: showSavings,
            onChange: setShowSavings,
          },
          {
            title: "Auto-adjust layout",
            subtitle:
              "Let the dashboard reorganize cards around what you use most",
            value: autoAdjustLayout,
            onChange: setAutoAdjustLayout,
          },
        ].map((item) => (
          <View key={item.title} style={styles.card}>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Switch
              value={item.value}
              onValueChange={item.onChange}
              thumbColor={theme.surface}
              trackColor={{ false: theme.border, true: theme.accent }}
            />
          </View>
        ))}

        <View style={styles.controlCard}>
          <TouchableOpacity
            style={styles.controlHeader}
            activeOpacity={0.85}
            onPress={() => setIsTransparencyExpanded((value) => !value)}
          >
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Tab bar transparency</Text>
              <Text style={styles.cardSubtitle}>
                Tune the glassy bottom bar to match your preferred look.
              </Text>
            </View>
            <View style={styles.controlMeta}>
              <View style={styles.opacityBadge}>
                <Text style={styles.opacityBadgeText}>
                  {Math.round(tabBarOpacity * 100)}%
                </Text>
              </View>
              <Ionicons
                name={isTransparencyExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={theme.textSecondary}
              />
            </View>
          </TouchableOpacity>

          {isTransparencyExpanded && (
            <>
              <View style={styles.previewCard}>
                <View style={styles.previewScreen}>
                  <View style={styles.previewContent} />
                  <View style={styles.previewTabBar}>
                    <View style={StyleSheet.absoluteFill} />
                    <View
                      style={[
                        styles.previewTabBarOverlay,
                        {
                          backgroundColor: `rgba(255,255,255,${Math.max(0.02, tabBarOpacity * 0.92)})`,
                        },
                      ]}
                    />
                    <View style={[styles.previewTab, styles.previewTabActive]}>
                      <Ionicons name="home" size={16} color={theme.surface} />
                    </View>
                    <View style={styles.previewTab}>
                      <Ionicons name="wallet" size={16} color={theme.accent} />
                    </View>
                    <View style={styles.previewTab}>
                      <Ionicons name="analytics" size={16} color={theme.accent} />
                    </View>
                  </View>
                </View>
              </View>

              <Slider
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                value={tabBarOpacity}
                onValueChange={(value) => setTabBarOpacity(value)}
                minimumTrackTintColor={theme.accent}
                maximumTrackTintColor={theme.accentSoft}
                thumbTintColor={theme.surface}
              />
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => Alert.alert("Saved", "Dashboard preferences updated.")}
        >
          <Text style={styles.primaryActionText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 32 },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: "700", color: theme.textPrimary },
    headerSpacer: { width: 32 },
    heroCard: {
      flexDirection: "row",
      backgroundColor: theme.surface,
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
    heroIconCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
    heroTextWrap: { flex: 1 },
    heroTitle: { fontSize: 15, fontWeight: "700", color: theme.textPrimary, marginBottom: 4 },
    heroSubtitle: { fontSize: 12.5, color: theme.textSecondary, lineHeight: 18 },
    card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    controlCard: { backgroundColor: theme.surface, borderRadius: 18, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    controlHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 2 },
    controlMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
    opacityBadge: { backgroundColor: theme.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    opacityBadgeText: { color: theme.accent, fontSize: 12, fontWeight: "700" },
    previewCard: { borderRadius: 20, padding: 8, marginHorizontal: 6, marginBottom: 12, backgroundColor: theme.mutedBackground },
    previewScreen: { borderRadius: 14, overflow: "hidden", backgroundColor: theme.surfaceSoft, borderWidth: 1, borderColor: theme.border },
    previewContent: { height: 96, backgroundColor: theme.surfaceSoft },
    previewTabBar: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 10, backgroundColor: "transparent", borderTopWidth: 1, borderTopColor: `rgba(0,0,0,0.06)` },
    previewTabBarOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 0 },
    previewTab: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.24)" },
    previewTabActive: { backgroundColor: theme.accent, shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
    cardTextWrap: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: "600", color: theme.textPrimary },
    cardSubtitle: { fontSize: 12.5, color: theme.textSecondary, marginTop: 4 },
    primaryAction: { backgroundColor: theme.accent, paddingVertical: 14, borderRadius: 14, marginHorizontal: 20, marginTop: 12, alignItems: "center" },
    primaryActionText: { color: theme.surface, fontWeight: "700" },
  });
