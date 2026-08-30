import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAppStore } from "../../src/store";

type Goal = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const GOALS: Goal[] = [
  {
    id: "track_spending",
    title: "Track my spending",
    icon: "analytics-outline",
  },
  {
    id: "save_money",
    title: "Save more money",
    icon: "wallet-outline",
  },
  {
    id: "stick_to_budget",
    title: "Stick to a budget",
    icon: "pie-chart-outline",
  },
  {
    id: "manage_expenses",
    title: "Manage my expenses",
    icon: "receipt-outline",
  },
];

export default function GoalsOnboardingScreen() {
  const { onboardingGoals, setOnboardingGoals, theme, themeMode } =
    useAppStore();

  const selectedGoals = onboardingGoals ?? [];

  const isDark = themeMode === "dark";

  const glassTint = isDark ? "dark" : "light";

  const backgroundDecor = useMemo(
    () => ({
      top: isDark ? "rgba(82, 220, 174, 0.09)" : "rgba(82, 220, 174, 0.12)",
      bottom: isDark
        ? "rgba(116, 135, 255, 0.08)"
        : "rgba(116, 135, 255, 0.08)",
    }),
    [isDark],
  );

  const toggleGoal = async (goalId: string) => {
    const exists = selectedGoals.includes(goalId);

    const nextGoals = exists
      ? selectedGoals.filter((id: string) => id !== goalId)
      : [...selectedGoals, goalId];

    await setOnboardingGoals(nextGoals);
  };

  const handleContinue = () => {
    if (selectedGoals.length === 0) {
      return;
    }

    router.push("/onboarding/job");
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
        {/* Soft background glow */}
        <View
          pointerEvents="none"
          style={[
            styles.backgroundOrb,
            styles.topOrb,
            {
              backgroundColor: backgroundDecor.top,
            },
          ]}
        />

        <View
          pointerEvents="none"
          style={[
            styles.backgroundOrb,
            styles.bottomOrb,
            {
              backgroundColor: backgroundDecor.bottom,
            },
          ]}
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <View
              style={[
                styles.logoMark,
                {
                  backgroundColor: theme.accent,
                },
              ]}
            >
              <Ionicons name="wallet" size={16} color="#FFFFFF" />
            </View>

            <Text
              style={[
                styles.brandName,
                {
                  color: theme.textPrimary,
                },
              ]}
            >
              TallySpends
            </Text>
          </View>

          <Text
            style={[
              styles.stepText,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            1 of 3
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.accent,
                },
              ]}
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Intro */}
          <View style={styles.intro}>
            <View
              style={[
                styles.eyebrowContainer,
                {
                  backgroundColor: `${theme.accent}12`,
                  borderColor: `${theme.accent}25`,
                },
              ]}
            >
              <Ionicons
                name="sparkles-outline"
                size={14}
                color={theme.accent}
              />

              <Text
                style={[
                  styles.eyebrow,
                  {
                    color: theme.accent,
                  },
                ]}
              >
                LET'S PERSONALIZE YOUR EXPERIENCE
              </Text>
            </View>

            <Text
              style={[
                styles.title,
                {
                  color: theme.textPrimary,
                },
              ]}
            >
              What do you want to{"\n"}
              achieve with TallySpends?
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              Choose everything that matters to you. We'll use this to make
              TallySpends more useful for you.
            </Text>
          </View>

          {/* Goal Cards */}
          <View style={styles.goalsContainer}>
            {GOALS.map((goal, index) => {
              const selected = selectedGoals.includes(goal.id);

              return (
                <Pressable
                  key={goal.id}
                  onPress={() => toggleGoal(goal.id)}
                  style={({ pressed }) => [
                    styles.goalCardWrapper,
                    pressed && styles.pressed,
                  ]}
                >
                  <BlurView
                    intensity={isDark ? 22 : 35}
                    tint={glassTint}
                    style={[
                      styles.goalCard,
                      {
                        borderColor: selected
                          ? `${theme.accent}75`
                          : `${theme.border}AA`,
                        backgroundColor: selected
                          ? `${theme.accent}${isDark ? "20" : "12"}`
                          : isDark
                            ? "rgba(255,255,255,0.045)"
                            : "rgba(255,255,255,0.60)",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor: selected
                            ? theme.accent
                            : `${theme.accent}14`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={goal.icon}
                        size={22}
                        color={selected ? "#FFFFFF" : theme.accent}
                      />
                    </View>

                    <View style={styles.goalTextContainer}>
                      <Text
                        style={[
                          styles.goalTitle,
                          {
                            color: theme.textPrimary,
                          },
                        ]}
                      >
                        {goal.title}
                      </Text>

                      <Text
                        style={[
                          styles.goalHint,
                          {
                            color: theme.textSecondary,
                          },
                        ]}
                      >
                        {index === 0 && "Know where your money goes"}
                        {index === 1 && "Build better saving habits"}
                        {index === 2 && "Stay within your limits"}
                        {index === 3 && "Keep your finances organized"}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: selected ? theme.accent : theme.border,
                          backgroundColor: selected
                            ? theme.accent
                            : "transparent",
                        },
                      ]}
                    >
                      {selected && (
                        <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                      )}
                    </View>
                  </BlurView>
                </Pressable>
              );
            })}
          </View>

          {/* Selection hint */}
          <View style={styles.selectionHint}>
            <Ionicons
              name="information-circle-outline"
              size={15}
              color={theme.textSecondary}
            />

            <Text
              style={[
                styles.selectionHintText,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              You can choose more than one
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View
          style={[
            styles.bottomContainer,
            {
              borderTopColor: `${theme.border}55`,
            },
          ]}
        >
          <BlurView
            intensity={isDark ? 20 : 30}
            tint={glassTint}
            style={[
              styles.bottomGlass,
              {
                backgroundColor: isDark
                  ? "rgba(15, 20, 25, 0.72)"
                  : "rgba(255, 255, 255, 0.72)",
              },
            ]}
          >
            <Pressable
              disabled={selectedGoals.length === 0}
              onPress={handleContinue}
              style={({ pressed }) => [
                styles.continueButton,
                {
                  backgroundColor:
                    selectedGoals.length > 0
                      ? theme.accent
                      : `${theme.accent}45`,
                },
                pressed && selectedGoals.length > 0 && styles.continuePressed,
              ]}
            >
              <Text style={styles.continueText}>Continue</Text>

              <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            </Pressable>
          </BlurView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    overflow: "hidden",
  },

  backgroundOrb: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
  },

  topOrb: {
    top: -150,
    right: -80,
  },

  bottomOrb: {
    bottom: 100,
    left: -180,
  },

  header: {
    height: 54,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  brandName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  stepText: {
    fontSize: 13,
    fontWeight: "600",
  },

  progressContainer: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 6,
  },

  progressTrack: {
    height: 4,
    width: "100%",
    borderRadius: 4,
    overflow: "hidden",
    opacity: 0.6,
  },

  progressFill: {
    height: "100%",
    width: "33.333%",
    borderRadius: 4,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 150,
  },

  intro: {
    marginBottom: 28,
  },

  eyebrowContainer: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 17,
  },

  eyebrow: {
    marginLeft: 6,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.65,
  },

  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 13,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
    maxWidth: 350,
  },

  goalsContainer: {
    gap: 12,
  },

  goalCardWrapper: {
    width: "100%",
  },

  goalCard: {
    minHeight: 84,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 13,
    overflow: "hidden",
  },

  pressed: {
    transform: [{ scale: 0.985 }],
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  goalTextContainer: {
    flex: 1,
    paddingRight: 8,
  },

  goalTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 4,
  },

  goalHint: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "400",
  },

  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  selectionHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  selectionHintText: {
    fontSize: 12,
    marginLeft: 5,
  },

  bottomContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
  },

  bottomGlass: {
    borderRadius: 24,
    overflow: "hidden",
    padding: 5,
  },

  continueButton: {
    height: 57,
    borderRadius: 19,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  continuePressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },

  continueText: {
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  arrowContainer: {
    position: "absolute",
    right: 17,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
});
