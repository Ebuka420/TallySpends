import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function SettingsSavingsScreen() {
  const router = useRouter();
  const [autoSave, setAutoSave] = useState(true);
  const [roundUps, setRoundUps] = useState(false);
  const [goalAlerts, setGoalAlerts] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saving Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIconCircle}>
          <Ionicons name="wallet-outline" size={22} color="#5B4E91" />
        </View>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>Savings habits</Text>
          <Text style={styles.heroSubtitle}>
            Build better savings rhythms with optional automation.
          </Text>
        </View>
      </View>

      {[
        {
          id: "auto",
          title: "Auto-save from income",
          subtitle: "Automatically move a portion to savings",
          value: autoSave,
          onChange: setAutoSave,
        },
        {
          id: "round",
          title: "Round-up savings",
          subtitle: "Save spare change from purchases",
          value: roundUps,
          onChange: setRoundUps,
        },
        {
          id: "alerts",
          title: "Goal reminders",
          subtitle: "Receive nudges when savings goals are near target",
          value: goalAlerts,
          onChange: setGoalAlerts,
        },
      ].map((item) => (
        <View key={item.id} style={styles.card}>
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

      <TouchableOpacity
        style={styles.primaryAction}
        onPress={() => Alert.alert("Saved", "Savings settings updated.")}
      >
        <Text style={styles.primaryActionText}>Save Changes</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9FB" },
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
    backgroundColor: "#EEF7F1",
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
