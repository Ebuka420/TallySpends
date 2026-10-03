import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAppStore } from "../../src/store";
import type { ThemePalette } from "../../src/theme";

const { width } = Dimensions.get("window");

export default function CompleteScreen() {
  const router = useRouter();

  const { completeOnboarding, theme } = useAppStore();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleGetStarted = async () => {
    await completeOnboarding();

    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <View style={styles.container}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={styles.progressActive} />
          </View>

          <Text style={styles.progressText}>3 of 3</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Success Icon */}
          <View style={styles.iconOuter}>
            <View
              style={[
                styles.iconInner,
                {
                  backgroundColor: theme.accent,
                },
              ]}
            >
              <Ionicons name="checkmark" size={42} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.eyebrow}>YOU'RE ALL SET</Text>

          <Text style={styles.title}>Welcome to{"\n"}TallySpends.</Text>

          <Text style={styles.description}>
            Your money, your goals, and your spending — all in one place.
          </Text>

          {/* Summary Glass Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={theme.accent}
                />
              </View>

              <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>
                  Your preferences are saved
                </Text>

                <Text style={styles.summarySubtitle}>
                  TallySpends is ready for you.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom */}
        <View style={styles.bottomContainer}>
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.getStartedButton,
              {
                backgroundColor: theme.accent,
                borderColor: theme.accent,
              },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.getStartedText}>Get Started</Text>

            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.helperText}>Let's make every naira count.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },

    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 18,
    },

    /* -------------------------
       PROGRESS
    ------------------------- */

    progressContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    progressTrack: {
      flex: 1,
      height: 5,
      borderRadius: 999,
      backgroundColor: theme.surface,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
    },

    progressActive: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.accent,
      borderRadius: 999,
    },

    progressText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
    },

    /* -------------------------
       CONTENT
    ------------------------- */

    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 30,
    },

    /* -------------------------
       SUCCESS ICON
    ------------------------- */

    iconOuter: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 28,
    },

    iconInner: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
    },

    /* -------------------------
       TEXT
    ------------------------- */

    eyebrow: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.6,
      color: theme.accent,
      marginBottom: 12,
    },

    title: {
      textAlign: "center",
      fontSize: width < 380 ? 32 : 36,
      lineHeight: width < 380 ? 39 : 43,
      fontWeight: "700",
      letterSpacing: -0.9,
      color: theme.textPrimary,
    },

    description: {
      maxWidth: 330,
      textAlign: "center",
      fontSize: 15,
      lineHeight: 23,
      color: theme.textSecondary,
      marginTop: 15,
    },

    /* -------------------------
       GLASS SUMMARY
    ------------------------- */

    summaryCard: {
      width: "100%",
      marginTop: 32,
      padding: 17,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },

    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    summaryIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },

    summaryText: {
      flex: 1,
      marginLeft: 13,
    },

    summaryTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textPrimary,
      marginBottom: 3,
    },

    summarySubtitle: {
      fontSize: 12.5,
      color: theme.textSecondary,
    },

    /* -------------------------
       BOTTOM
    ------------------------- */

    bottomContainer: {
      marginTop: "auto",
    },

    getStartedButton: {
      height: 56,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
    },

    buttonPressed: {
      transform: [{ scale: 0.985 }],
      opacity: 0.9,
    },

    getStartedText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },

    helperText: {
      textAlign: "center",
      marginTop: 13,
      fontSize: 11.5,
      color: theme.textSecondary,
    },
  });
