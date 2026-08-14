import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useAppStore } from "../src/store";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Quick tags to help users pick feedback categories fast
const FEEDBACK_TAGS = [
  "Budgeting Tools",
  "Expense Tracking",
  "Ajo Circles",
  "User Interface",
  "App Performance",
  "Customer Support",
];

export default function RateUsScreen() {
  const router = useRouter();
  const { theme } = useAppStore();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const [rating, setRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comments, setComments] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Toggle quick-select improvement tags
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      alert("Please select a star rating before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate sending the telemetry/feedback payload to the backend
      setTimeout(() => {
        setIsSubmitting(false);
        alert("Thank you for your feedback! We appreciate your suggestions.");
        router.back();
      }, 2000);

      /*
      // When your backend guy builds the endpoint, toggle this fetch setup:
      const response = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: rating,
          tags: selectedTags,
          suggestions: comments
        })
      });
      */
    } catch (error) {
      setIsSubmitting(false);
      console.error("Error sending feedback:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Us</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro Hero Context */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Your Opinion Matters!</Text>
            <Text style={styles.heroSubtitle}>
              Help us build the absolute best financial platform for you. Rate
              your experience and share your suggestions.
            </Text>
          </View>

          {/* Interactive Star Row */}
          <View style={styles.ratingCard}>
            <Text style={styles.cardLabel}>Tap to Rate</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={40}
                    color={star <= rating ? theme.warning : theme.border}
                    style={{ marginHorizontal: 6 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingStatusText}>
                {rating === 5
                  ? "Love it! 🤩"
                  : rating === 4
                    ? "Great! 😊"
                    : rating === 3
                      ? "Good 🙂"
                      : "Could be better 😕"}
              </Text>
            )}
          </View>

          {/* Quick Selection Tags */}
          <Text style={styles.sectionLabel}>What can we improve?</Text>
          <View style={styles.tagsContainer}>
            {FEEDBACK_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, isSelected && styles.tagChipSelected]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      isSelected && styles.tagTextSelected,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explicit Custom Suggestions Block */}
          <Text style={styles.sectionLabel}>
            Detailed Suggestions & Feedback
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Tell us what features you want, bugs you noticed, or changes you'd like to see..."
              placeholderTextColor={theme.textSecondary}
              multiline={true}
              numberOfLines={5}
              value={comments}
              onChangeText={setComments}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Submit Bar Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              rating === 0 && styles.submitButtonDisabled,
            ]}
            disabled={rating === 0 || isSubmitting}
            onPress={handleSubmitFeedback}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.surface} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    scrollContent: {
      padding: 16,
    },
    heroSection: {
      alignItems: "center",
      marginBottom: 24,
      marginTop: 8,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      paddingHorizontal: 12,
    },
    ratingCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 24,
    },
    cardLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 12,
    },
    starsRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 8,
    },
    ratingStatusText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textPrimary,
      marginTop: 4,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 24,
    },
    tagChip: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    tagChipSelected: {
      borderColor: theme.accent,
      backgroundColor: theme.accentSoft,
    },
    tagText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: "500",
    },
    tagTextSelected: {
      color: theme.textPrimary,
      fontWeight: "600",
    },
    inputContainer: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
      marginBottom: 24,
    },
    textArea: {
      fontSize: 15,
      color: theme.textPrimary,
      height: 120,
    },
    footer: {
      backgroundColor: theme.surface,
      padding: 16,
      borderTopWidth: 1,
      borderColor: theme.border,
    },
    submitButton: {
      backgroundColor: theme.accent,
      height: 52,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    submitButtonDisabled: {
      backgroundColor: theme.border,
    },
    submitButtonText: {
      color: theme.surface,
      fontSize: 16,
      fontWeight: "600",
    },
  });
