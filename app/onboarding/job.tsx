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

type EmploymentStatus = "employed" | "unemployed" | "student";

const OPTIONS: {
  id: EmploymentStatus;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: "employed",
    title: "Employed",
    subtitle: "I currently have a job",
    icon: "briefcase-outline",
  },
  {
    id: "unemployed",
    title: "Unemployed",
    subtitle: "I'm currently not working",
    icon: "time-outline",
  },
  {
    id: "student",
    title: "Student",
    subtitle: "I'm currently studying",
    icon: "school-outline",
  },
];

export default function JobScreen() {
  const router = useRouter();

  const { employmentStatus, setEmploymentStatus, theme } = useAppStore();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleContinue = () => {
    if (!employmentStatus) return;

    router.push("/onboarding/complete");
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

          <Text style={styles.progressText}>2 of 3</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>A LITTLE ABOUT YOU</Text>

          <Text style={styles.title}>
            What best describes{"\n"}your current status?
          </Text>

          <Text style={styles.description}>
            This helps TallySpends personalize your experience.
          </Text>
        </View>

        {/* Employment Options */}
        <View style={styles.optionsContainer}>
          {OPTIONS.map((option) => {
            const selected = employmentStatus === option.id;

            return (
              <Pressable
                key={option.id}
                onPress={() => setEmploymentStatus(option.id)}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                {/* Icon */}
                <View
                  style={[
                    styles.iconContainer,
                    selected && styles.iconContainerSelected,
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={23}
                    color={selected ? theme.accent : theme.textSecondary}
                  />
                </View>

                {/* Text */}
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{option.title}</Text>

                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>

                {/* Radio */}
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && (
                    <View
                      style={[
                        styles.radioDot,
                        {
                          backgroundColor: theme.accent,
                        },
                      ]}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Bottom */}
        <View style={styles.bottomContainer}>
          <Pressable
            onPress={handleContinue}
            disabled={!employmentStatus}
            style={({ pressed }) => [
              styles.continueButton,
              {
                backgroundColor: employmentStatus
                  ? theme.accent
                  : theme.surface,
                borderColor: employmentStatus ? theme.accent : theme.border,
              },
              pressed && employmentStatus && styles.buttonPressed,
            ]}
          >
            <Text
              style={[
                styles.continueText,
                {
                  color: employmentStatus ? "#FFFFFF" : theme.textSecondary,
                },
              ]}
            >
              Continue
            </Text>

            <Ionicons
              name="arrow-forward"
              size={19}
              color={employmentStatus ? "#FFFFFF" : theme.textSecondary}
            />
          </Pressable>

          <Text style={styles.helperText}>
            You can change your preferences later.
          </Text>
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
      width: "66.66%",
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
       HEADER
    ------------------------- */

    header: {
      marginTop: 46,
      marginBottom: 34,
    },

    eyebrow: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.5,
      color: theme.accent,
      marginBottom: 13,
    },

    title: {
      fontSize: width < 380 ? 29 : 32,
      lineHeight: width < 380 ? 36 : 39,
      fontWeight: "700",
      color: theme.textPrimary,
      letterSpacing: -0.7,
    },

    description: {
      marginTop: 15,
      maxWidth: 340,
      fontSize: 15,
      lineHeight: 22,
      color: theme.textSecondary,
    },

    /* -------------------------
       OPTIONS
    ------------------------- */

    optionsContainer: {
      gap: 13,
    },

    option: {
      minHeight: 82,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 17,
      paddingVertical: 14,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },

    optionSelected: {
      borderColor: theme.accent,
    },

    optionPressed: {
      transform: [{ scale: 0.985 }],
      opacity: 0.9,
    },

    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },

    iconContainerSelected: {
      borderColor: theme.accent,
    },

    optionText: {
      flex: 1,
      marginLeft: 14,
    },

    optionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.textPrimary,
      marginBottom: 4,
    },

    optionSubtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.textSecondary,
    },

    /* -------------------------
       RADIO
    ------------------------- */

    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 12,
    },

    radioSelected: {
      borderColor: theme.accent,
    },

    radioDot: {
      width: 11,
      height: 11,
      borderRadius: 6,
    },

    /* -------------------------
       BOTTOM
    ------------------------- */

    bottomContainer: {
      marginTop: "auto",
    },

    continueButton: {
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

    continueText: {
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
