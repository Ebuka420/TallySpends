import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '../src/store';
export default function InvitationScreen() {
  const router = useRouter(); const { theme } = useAppStore(); const styles = React.useMemo(() => getStyles(theme), [theme]);
  return <SafeAreaView style={styles.container}>
    <View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={theme.textPrimary} /></TouchableOpacity><Text style={styles.headerTitle}>Rewards & Missions</Text><View style={{ width: 40 }} /></View>
    <ScrollView contentContainerStyle={styles.scrollContent}><View style={styles.heroCard}><View style={styles.giftIconContainer}><Ionicons name="gift" size={32} color={theme.surface} /></View><Text style={styles.heroTitle}>Invitation rewards</Text><Text style={styles.heroSubtitle}>Coming soon. Referral codes, reward earnings, and missions are not available yet.</Text></View></ScrollView>
  </SafeAreaView>;
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
      heroCard: {
        backgroundColor: theme.accent,
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        textAlign: "center",
        marginBottom: 24,
        shadowColor: theme.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      giftIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.accentSoft,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
      },
      heroTitle: {
        color: theme.surface,
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 8,
      },
      heroSubtitle: {
        color: theme.surfaceSoft,
        fontSize: 13,
        textAlign: "center",
        lineHeight: 18,
      },
      sectionLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.textSecondary,
        marginBottom: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      },
      trackerCard: {
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border,
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
        color: theme.textPrimary,
      },
      earningsText: {
        fontSize: 14,
        fontWeight: "700",
        color: theme.success,
      },
      progressTrack: {
        height: 8,
        backgroundColor: theme.border,
        borderRadius: 4,
        marginBottom: 16,
        overflow: "hidden",
      },
      progressFill: {
        height: "100%",
        backgroundColor: theme.success,
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
        backgroundColor: theme.mutedBackground,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: 4,
      },
  nodeCircleActive: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
  },
      nodeText: {
        fontSize: 11,
        fontWeight: "600",
        color: theme.textSecondary,
      },
      nodeTextActive: {
        color: theme.success,
      },
      nodeLabel: {
        fontSize: 10,
        color: theme.textSecondary,
      },
  missionsContainer: {
    gap: 12,
  },
      missionCard: {
        flexDirection: "row",
        backgroundColor: theme.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
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
        backgroundColor: theme.accentSoft,
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
        color: theme.textPrimary,
        marginBottom: 2,
      },
      missionDescription: {
        fontSize: 12,
        color: theme.textSecondary,
        lineHeight: 16,
        marginBottom: 6,
      },
      rewardBadge: {
        alignSelf: "flex-start",
        backgroundColor: theme.mutedBackground,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.border,
      },
      rewardBadgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: theme.textPrimary,
      },
      missionActionButton: {
        backgroundColor: theme.accent,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
      },
      missionButtonCompleted: {
        backgroundColor: theme.mutedBackground,
      },
      missionActionText: {
        color: theme.surface,
        fontSize: 13,
        fontWeight: "600",
      },
      missionActionTextCompleted: {
        color: theme.textSecondary,
      },
      footer: {
        backgroundColor: theme.surface,
        padding: 16,
        borderTopWidth: 1,
        borderColor: theme.border,
      },
      inviteButton: {
        backgroundColor: theme.accent,
        height: 52,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      },
      inviteButtonText: {
        color: theme.surface,
        fontSize: 16,
        fontWeight: "600",
      },
    });
