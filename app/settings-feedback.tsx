import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useAppStore } from "../src/store";

const THEME_PALETTES = {
  aurora: { accent: "#5B4E91", soft: "#F0EEFA", border: "#E7DFF8" },
  sage: { accent: "#34A853", soft: "#EEF7F1", border: "#DCEFE2" },
  sunset: { accent: "#C47C49", soft: "#FAF2EC", border: "#F3E1D4" },
};

export default function SettingsFeedbackScreen() {
  const router = useRouter();
  const { themePreference } = useAppStore();
  const theme = THEME_PALETTES[themePreference] ?? THEME_PALETTES.aurora;
  const accent = theme.accent;
  const [message, setMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState("idea");
  const [followUp, setFollowUp] = useState(true);
  const [contactMethod, setContactMethod] = useState("email");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </Pressable>
        <Text style={styles.headerTitle}>Feedback</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color="#5B4E91"
            />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Tell us what you think</Text>
            <Text style={styles.heroSubtitle}>
              A few thoughtful details help us shape a better experience for
              you.
            </Text>
          </View>
        </View>

        <View
          style={[styles.card, { borderColor: `${accent}16`, borderWidth: 1 }]}
        >
          <Text style={styles.label}>What kind of note is this?</Text>
          <View style={styles.chipsRow}>
            {[
              { id: "idea", label: "Idea" },
              { id: "bug", label: "Bug" },
              { id: "appreciation", label: "Appreciation" },
            ].map((option) => (
              <Pressable
                key={option.id}
                style={({ pressed }) => [
                  styles.chip,
                  feedbackType === option.id && {
                    backgroundColor: "#5B4E91",
                    borderColor: "#5B4E91",
                  },
                  pressed && styles.chipPressed,
                ]}
                onPress={() => setFeedbackType(option.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    feedbackType === option.id && { color: "#FFFFFF" },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View
          style={[styles.card, { borderColor: `${accent}16`, borderWidth: 1 }]}
        >
          <Text style={styles.label}>How would you like us to follow up?</Text>
          <View style={styles.chipsRow}>
            {[
              { id: "email", label: "Email" },
              { id: "none", label: "No follow-up" },
            ].map((option) => (
              <Pressable
                key={option.id}
                style={({ pressed }) => [
                  styles.chip,
                  contactMethod === option.id && {
                    backgroundColor: "#5B4E91",
                    borderColor: "#5B4E91",
                  },
                  pressed && styles.chipPressed,
                ]}
                onPress={() => setContactMethod(option.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    contactMethod === option.id && { color: "#FFFFFF" },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.toggleRow,
              pressed && styles.toggleRowPressed,
            ]}
            onPress={() => setFollowUp((prev) => !prev)}
          >
            <Text style={styles.toggleText}>
              {followUp
                ? "You’ll be contacted when appropriate"
                : "No follow-up requested"}
            </Text>
            <Ionicons
              name={followUp ? "checkmark-circle" : "ellipse-outline"}
              size={18}
              color="#5B4E91"
            />
          </Pressable>
        </View>

        <View
          style={[styles.card, { borderColor: `${accent}16`, borderWidth: 1 }]}
        >
          <Text style={styles.label}>Share your thoughts</Text>
          <TextInput
            multiline
            numberOfLines={6}
            style={styles.input}
            placeholder="What should we improve?"
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryAction,
            pressed && styles.primaryActionPressed,
          ]}
          onPress={() =>
            Alert.alert("Thanks!", "Your feedback has been captured.")
          }
        >
          <Text style={styles.primaryActionText}>Send Feedback</Text>
        </Pressable>
      </ScrollView>
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
  scrollContent: { paddingBottom: 28, paddingHorizontal: 20 },
  heroCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
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
    color: "#1C1C1E",
    marginBottom: 4,
  },
  heroSubtitle: { fontSize: 12.5, color: "#8E8E93", lineHeight: 18 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 10,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  chipPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  chipText: { fontSize: 13, color: "#1C1C1E", fontWeight: "600" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  toggleRowPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  toggleText: { flex: 1, fontSize: 13.5, fontWeight: "600" },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#1C1C1E",
  },
  primaryAction: {
    backgroundColor: "#5B4E91",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
    alignItems: "center",
  },
  primaryActionPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  primaryActionText: { color: "#FFFFFF", fontWeight: "700" },
});
