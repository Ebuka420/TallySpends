import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Mock data for trackable milestone missions
const MISSIONS = [
  {
    id: "m1",
    title: "Download Partner App",
    description:
      "Download and sign up on our verified partner financial terminal.",
    reward: "₦500 Cash",
    icon: "download-circle-outline",
    completed: false,
    type: "partner",
  },
  {
    id: "m2",
    title: "Set & Complete a Budget",
    description:
      "Create a monthly budget constraint and hit your savings benchmark.",
    reward: "₦1,000 Bonus",
    icon: "wallet-outline",
    completed: true,
    type: "budget",
  },
  {
    id: "m3",
    title: "Start an Ajo Cycle",
    description:
      "Launch a traditional rotating savings circle with at least 3 friends.",
    reward: "Unlocked Feature + ₦1,500",
    icon: "account-group-outline",
    completed: false,
    type: "ajo",
  },
];

export default function InvitationScreen() {
  const router = useRouter();

  // Track mock invites (up to 5 max)
  const [completedInvites, setCompletedInvites] = useState(3);
  const maxInvites = 5;
  const rewardPerFriend = 1000;

  // Generate an native share sheet
  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Join me on TallySpends to automate your budget and track your expenses! Use my referral code: TALLY503`,
      });
    } catch (error) {
      console.error("Error sharing system link:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards & Missions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.giftIconContainer}>
            <Ionicons name="gift" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>Invite Friends, Earn Cash</Text>
          <Text style={styles.heroSubtitle}>
            Get ₦{rewardPerFriend.toLocaleString()} for every friend who
            registers using your unique token. Valid for up to {maxInvites}{" "}
            referrals!
          </Text>
        </View>

        {/* Referral Tracker Milestones */}
        <Text style={styles.sectionLabel}>Referral Milestone Progress</Text>
        <View style={styles.trackerCard}>
          <View style={styles.trackerTextRow}>
            <Text style={styles.progressText}>
              {completedInvites} of {maxInvites} Friends Joined
            </Text>
            <Text style={styles.earningsText}>
              Earned: ₦{(completedInvites * rewardPerFriend).toLocaleString()}
            </Text>
          </View>

          {/* Progress Bar Indicators */}
          <View style={{ flex: 1 }}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(completedInvites / maxInvites) * 100}%` },
                ]}
              />
            </View>
          </View>

          {/* Node Milestones */}
          <View style={styles.nodeRow}>
            {[1, 2, 3, 4, 5].map((node) => {
              const isPassed = node <= completedInvites;
              return (
                <View key={node} style={styles.nodeContainer}>
                  <View
                    style={[
                      styles.nodeCircle,
                      isPassed && styles.nodeCircleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.nodeText,
                        isPassed && styles.nodeTextActive,
                      ]}
                    >
                      ₦1k
                    </Text>
                  </View>
                  <Text style={styles.nodeLabel}>Friend {node}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Additional Operational Tasks / Missions */}
        <Text style={styles.sectionLabel}>Available Missions</Text>
        <View style={styles.missionsContainer}>
          {MISSIONS.map((mission) => (
            <View key={mission.id} style={styles.missionCard}>
              <View style={styles.missionLeft}>
                <View
                  style={[
                    styles.missionIconWrapper,
                    mission.completed && styles.missionIconCompleted,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={mission.icon as any}
                    size={26}
                    color={mission.completed ? "#10B981" : "#20142A"}
                  />
                </View>
                <View style={styles.missionTextContent}>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <Text style={styles.missionDescription}>
                    {mission.description}
                  </Text>
                  <View style={styles.rewardBadge}>
                    <Text style={styles.rewardBadgeText}>{mission.reward}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.missionActionButton,
                  mission.completed && styles.missionButtonCompleted,
                ]}
                disabled={mission.completed}
              >
                <Text
                  style={[
                    styles.missionActionText,
                    mission.completed && styles.missionActionTextCompleted,
                  ]}
                >
                  {mission.completed ? "Claimed" : "Start"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Sticky Invite Mechanism */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={handleShareInvite}
        >
          <Ionicons
            name="share-social"
            size={20}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.inviteButtonText}>Share Invite Link</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: "#20142A",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    textAlign: "center",
    marginBottom: 24,
    shadowColor: "#20142A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  giftIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "#E0E7FF",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trackerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },
  trackerTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  earningsText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10B981",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 4,
  },
  nodeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nodeContainer: {
    alignItems: "center",
  },
  nodeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 4,
  },
  nodeCircleActive: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
  },
  nodeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  nodeTextActive: {
    color: "#065F46",
  },
  nodeLabel: {
    fontSize: 10,
    color: "#6B7280",
  },
  missionsContainer: {
    gap: 12,
  },
  missionCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    alignItems: "center",
    justifyContent: "space-between",
  },
  missionLeft: {
    flexDirection: "row",
    flex: 1,
    marginRight: 12,
  },
  missionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  missionIconCompleted: {
    backgroundColor: "#D1FAE5",
  },
  missionTextContent: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  missionDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    marginBottom: 6,
  },
  rewardBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rewardBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#20142A",
  },
  missionActionButton: {
    backgroundColor: "#20142A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  missionButtonCompleted: {
    backgroundColor: "#F3F4F6",
  },
  missionActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  missionActionTextCompleted: {
    color: "#9CA3AF",
  },
  footer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  inviteButton: {
    backgroundColor: "#20142A",
    height: 52,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  inviteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
