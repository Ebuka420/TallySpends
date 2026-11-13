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
export default function SettingsFeedbackScreen() {
  const router = useRouter();
  const { theme } = useAppStore();
  const accent = theme.accent;
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const [message, setMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState("idea");
  const [followUp, setFollowUp] = useState(true);
  const [contactMethod, setContactMethod] = useState("email");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
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
                color={theme.accent}
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
                    backgroundColor: theme.accent,
                    borderColor: theme.accent,
                  },
                  pressed && styles.chipPressed,
                ]}
                onPress={() => setFeedbackType(option.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    feedbackType === option.id && { color: theme.surface },
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
                    backgroundColor: theme.accent,
                    borderColor: theme.accent,
                  },
                  pressed && styles.chipPressed,
                ]}
                onPress={() => setContactMethod(option.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    contactMethod === option.id && { color: theme.surface },
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
              color={theme.accent}
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
            placeholderTextColor={theme.textSecondary}
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
const getStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
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
    scrollContent: { paddingBottom: 28, paddingHorizontal: 20 },
    heroCard: {
      flexDirection: "row",
      backgroundColor: theme.surface,
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
    heroTitle: { fontSize: 15, fontWeight: "700", color: theme.textPrimary, marginBottom: 4 },
    heroSubtitle: { fontSize: 12.5, color: theme.textSecondary, lineHeight: 18 },
    card: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
    label: { fontSize: 14, fontWeight: "600", color: theme.textPrimary, marginBottom: 10 },
    chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chipPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
    chipText: { fontSize: 13, color: theme.textPrimary, fontWeight: "600" },
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
    toggleText: { flex: 1, fontSize: 13.5, fontWeight: "600", color: theme.textPrimary },
    input: {
      minHeight: 120,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 12,
      fontSize: 14,
      color: theme.textPrimary,
    },
    primaryAction: { backgroundColor: theme.accent, paddingVertical: 14, borderRadius: 14, marginTop: 10, alignItems: "center" },
    primaryActionPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
    primaryActionText: { color: theme.surface, fontWeight: "700" },
  });
