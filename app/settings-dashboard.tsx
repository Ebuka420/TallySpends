import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { BlurView } from "expo-blur";
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
  const { tabBarOpacity, setTabBarOpacity } = useAppStore();
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
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
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
            <Ionicons name="grid-outline" size={22} color="#5B4E91" />
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
              thumbColor="#FFFFFF"
              trackColor={{ false: "#D9D9E3", true: "#5B4E91" }}
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
                color="#8E8E93"
              />
            </View>
          </TouchableOpacity>

          {isTransparencyExpanded && (
            <>
              <View style={styles.previewCard}>
                <View style={styles.previewScreen}>
                  <View style={styles.previewContent} />
                  <View style={styles.previewTabBar}>
                    <BlurView
                      tint="light"
                      intensity={90}
                      style={StyleSheet.absoluteFill}
                    />
                    <View
                      style={[
                        styles.previewTabBarOverlay,
                        {
                          backgroundColor: `rgba(255,255,255,${Math.max(0.02, tabBarOpacity * 0.92)})`,
                        },
                      ]}
                    />
                    <View style={[styles.previewTab, styles.previewTabActive]}>
                      <Ionicons name="home" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.previewTab}>
                      <Ionicons name="wallet" size={16} color="#5B4E91" />
                    </View>
                    <View style={styles.previewTab}>
                      <Ionicons name="analytics" size={16} color="#5B4E91" />
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
                minimumTrackTintColor="#5B4E91"
                maximumTrackTintColor="#E7DFF8"
                thumbTintColor="#FFFFFF"
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9FB" },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingBottom: 32,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1C1C1E" },
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
    backgroundColor: "#F0EEFA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroTextWrap: { flex: 1 },
  heroTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  heroSubtitle: { fontSize: 12.5, color: "#8E8E93", lineHeight: 18 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  controlCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  controlHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  controlMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  opacityBadge: {
    backgroundColor: "#F0EEFA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  opacityBadgeText: {
    color: "#5B4E91",
    fontSize: 12,
    fontWeight: "700",
  },
  previewCard: {
    borderRadius: 20,
    padding: 8,
    marginHorizontal: 6,
    marginBottom: 12,
    backgroundColor: "#F6F3FB",
  },
  previewScreen: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#FBF9FF",
    borderWidth: 1,
    borderColor: "#E7DFF8",
  },
  previewContent: {
    height: 96,
    backgroundColor: "#F7F2FF",
  },
  previewTabBar: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderTopColor: "rgba(91, 78, 145, 0.12)",
  },
  previewTabBarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },
  previewTab: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  previewTabActive: {
    backgroundColor: "rgba(91, 78, 145, 0.95)",
    shadowColor: "#5B4E91",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1C1C1E" },
  cardSubtitle: { fontSize: 12.5, color: "#8E8E93", marginTop: 4 },
  primaryAction: {
    backgroundColor: "#5B4E91",
    paddingVertical: 14,
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 12,
    alignItems: "center",
  },
  primaryActionText: { color: "#FFFFFF", fontWeight: "700" },
});
