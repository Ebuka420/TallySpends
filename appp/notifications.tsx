import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NotificationItem, useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

type FilterTab = "all" | "unread" | "transaction" | "alert" | "insight";

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadNotificationCount,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    themePreference,
    themeMode,
  } = useAppStore();

  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === "unread") return item.isUnread;
      if (activeFilter === "transaction") return item.type === "transaction";
      if (activeFilter === "alert") return item.type === "alert";
      if (activeFilter === "insight") return item.type === "insight";
      return true;
    });
  }, [notifications, activeFilter]);

  // Format relative timestamp
  const formatTimeAgo = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    Haptics.selectionAsync();
    if (item.isUnread) {
      markNotificationAsRead(item.id);
    }
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    deleteNotification(id);
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to remove all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            clearAllNotifications();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  const handleSendTestPush = (type: NotificationItem["type"]) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSimulatorModal(false);

    if (type === "transaction") {
      addNotification({
        type: "transaction",
        title: "Inbound Payment Received",
        description: "₦15,000.00 was credited to your TallySpends account from @chioma_k.",
        amount: 15000,
        route: "/(tabs)/expenses",
      });
    } else if (type === "alert") {
      addNotification({
        type: "alert",
        title: "Budget Threshold Warning",
        description: "You have exceeded 90% of your Shopping budget for this month. ₦1,200 remaining.",
        route: "/budgetspending",
      });
    } else if (type === "insight") {
      addNotification({
        type: "insight",
        title: "AI Smart Insight",
        description: "Great news! You saved 18% on transport this week by tracking your ride-shares.",
        route: "/insightssum",
      });
    } else {
      addNotification({
        type: "bill",
        title: "Scheduled Utility Bill",
        description: "Your monthly Internet Subscription of ₦12,500 is due in 2 days.",
      });
    }
  };

  const getNotificationIconDetails = (type: NotificationItem["type"]) => {
    switch (type) {
      case "transaction":
        return {
          icon: "swap-horizontal-outline" as const,
          color: isDark ? "#4ADE80" : "#15803D",
          bg: isDark ? "#133E23" : "#EAF6EC",
        };
      case "alert":
        return {
          icon: "warning-outline" as const,
          color: isDark ? "#F87171" : "#DC2626",
          bg: isDark ? "#3D1719" : "#FEE2E2",
        };
      case "insight":
        return {
          icon: "sparkles-outline" as const,
          color: isDark ? "#C084FC" : "#7C3AED",
          bg: isDark ? "#281D33" : "#F3E8FF",
        };
      case "bill":
        return {
          icon: "calendar-outline" as const,
          color: isDark ? "#60A5FA" : "#2563EB",
          bg: isDark ? "#1E293B" : "#EFF6FF",
        };
      default:
        return {
          icon: "shield-checkmark-outline" as const,
          color: theme.textSecondary,
          bg: theme.surfaceSoft,
        };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Bar */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Notifications
          </Text>
          {unreadNotificationCount > 0 && (
            <View style={[styles.unreadBadgePill, { backgroundColor: theme.accent }]}>
              <Text style={styles.unreadBadgePillText}>{unreadNotificationCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActionsRow}>
          {unreadNotificationCount > 0 && (
            <TouchableOpacity
              style={styles.headerActionIcon}
              onPress={() => {
                markAllNotificationsAsRead();
                Haptics.selectionAsync();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-done" size={21} color={theme.accent} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.headerActionIcon}
            onPress={() => setShowSimulatorModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
          </TouchableOpacity>

          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.headerActionIcon}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={19} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { borderBottomColor: theme.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: "all", label: "All", count: notifications.length },
            { key: "unread", label: "Unread", count: unreadNotificationCount },
            {
              key: "transaction",
              label: "Transactions",
              count: notifications.filter((n) => n.type === "transaction").length,
            },
            {
              key: "alert",
              label: "Alerts",
              count: notifications.filter((n) => n.type === "alert").length,
            },
            {
              key: "insight",
              label: "Insights",
              count: notifications.filter((n) => n.type === "insight").length,
            },
          ]}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterListContent}
          renderItem={({ item }) => {
            const isSelected = activeFilter === item.key;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? theme.accent
                      : isDark
                      ? theme.surfaceSoft
                      : theme.surface,
                    borderColor: isSelected ? theme.accent : theme.border,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveFilter(item.key as FilterTab);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipLabel,
                    {
                      color: isSelected ? "#FFFFFF" : theme.textPrimary,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {item.label}
                </Text>
                {item.count > 0 && (
                  <View
                    style={[
                      styles.filterChipCount,
                      {
                        backgroundColor: isSelected
                          ? "rgba(255,255,255,0.25)"
                          : isDark
                          ? theme.surface
                          : "#F3EBF8",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipCountText,
                        { color: isSelected ? "#FFFFFF" : theme.textSecondary },
                      ]}
                    >
                      {item.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const iconDetails = getNotificationIconDetails(item.type);
          return (
            <TouchableOpacity
              style={[
                styles.notificationCard,
                {
                  backgroundColor: item.isUnread
                    ? isDark
                      ? theme.surfaceSoft
                      : "#FCFAFE"
                    : theme.surface,
                  borderColor: item.isUnread ? theme.accent + "50" : theme.border,
                },
              ]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.75}
            >
              {/* Left Icon Box */}
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: iconDetails.bg },
                ]}
              >
                <Ionicons
                  name={iconDetails.icon}
                  size={20}
                  color={iconDetails.color}
                />
              </View>

              {/* Center Details Column */}
              <View style={styles.cardInfoCol}>
                <View style={styles.cardTitleRow}>
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color: theme.textPrimary,
                        fontWeight: item.isUnread ? "800" : "700",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {item.isUnread && (
                    <View
                      style={[styles.unreadDot, { backgroundColor: theme.accent }]}
                    />
                  )}
                </View>

                <Text
                  style={[styles.cardDescription, { color: theme.textSecondary }]}
                  numberOfLines={3}
                >
                  {item.description}
                </Text>

                <View style={styles.cardBottomMetaRow}>
                  <Text
                    style={[styles.timeAgoText, { color: theme.textSecondary }]}
                  >
                    {formatTimeAgo(item.timestamp)}
                  </Text>

                  {item.route && (
                    <View style={styles.tapToViewTag}>
                      <Text
                        style={[styles.tapToViewText, { color: theme.accent }]}
                      >
                        View Details →
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Right Delete Button */}
              <TouchableOpacity
                style={styles.cardDeleteBtn}
                onPress={() => handleDelete(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close"
                  size={16}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyStateContainer}>
            <View
              style={[
                styles.emptyIconBox,
                { backgroundColor: isDark ? theme.surfaceSoft : "#F3EBF8" },
              ]}
            >
              <Ionicons
                name="notifications-off-outline"
                size={40}
                color={theme.accent}
              />
            </View>
            <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
              {activeFilter === "unread"
                ? "No unread notifications"
                : "No notifications found"}
            </Text>
            <Text
              style={[styles.emptyStateSub, { color: theme.textSecondary }]}
            >
              {activeFilter === "unread"
                ? "You are completely caught up! We'll alert you when there are new updates."
                : "Transactions, budget alerts, and smart insights will appear here in real-time."}
            </Text>
          </View>
        )}
      />

      {/* Test Push Simulator Modal */}
      <Modal
        visible={showSimulatorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSimulatorModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowSimulatorModal(false)}
        >
          <View
            style={[
              styles.simulatorCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.simulatorHeader}>
              <Text style={[styles.simulatorTitle, { color: theme.textPrimary }]}>
                Simulate Push Notification
              </Text>
              <TouchableOpacity onPress={() => setShowSimulatorModal(false)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text
              style={[styles.simulatorSub, { color: theme.textSecondary }]}
            >
              Trigger live real-time notifications to test updates, sounds, and badges:
            </Text>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={[
                  styles.simOptionBtn,
                  { backgroundColor: isDark ? theme.surfaceSoft : "#F4EEF8", borderColor: theme.border },
                ]}
                onPress={() => handleSendTestPush("transaction")}
              >
                <Ionicons name="wallet-outline" size={20} color={theme.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.simOptionTitle, { color: theme.textPrimary }]}>
                    Payment & Transfer Alert
                  </Text>
                  <Text style={[styles.simOptionDesc, { color: theme.textSecondary }]}>
                    Incoming ₦15,000 credit notification
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.simOptionBtn,
                  { backgroundColor: isDark ? theme.surfaceSoft : "#F4EEF8", borderColor: theme.border },
                ]}
                onPress={() => handleSendTestPush("alert")}
              >
                <Ionicons name="warning-outline" size={20} color="#DC2626" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.simOptionTitle, { color: theme.textPrimary }]}>
                    Budget Warning
                  </Text>
                  <Text style={[styles.simOptionDesc, { color: theme.textSecondary }]}>
                    Over 90% budget spending limit
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.simOptionBtn,
                  { backgroundColor: isDark ? theme.surfaceSoft : "#F4EEF8", borderColor: theme.border },
                ]}
                onPress={() => handleSendTestPush("insight")}
              >
                <Ionicons name="sparkles-outline" size={20} color="#7C3AED" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.simOptionTitle, { color: theme.textPrimary }]}>
                    Weekly AI Smart Insight
                  </Text>
                  <Text style={[styles.simOptionDesc, { color: theme.textSecondary }]}>
                    Spending reduction analysis
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.simOptionBtn,
                  { backgroundColor: isDark ? theme.surfaceSoft : "#F4EEF8", borderColor: theme.border },
                ]}
                onPress={() => handleSendTestPush("bill")}
              >
                <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.simOptionTitle, { color: theme.textPrimary }]}>
                    Subscription Due Reminder
                  </Text>
                  <Text style={[styles.simOptionDesc, { color: theme.textSecondary }]}>
                    Upcoming bill renewal
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  unreadBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgePillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  headerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerActionIcon: {
    padding: 4,
  },
  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterListContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterChipLabel: {
    fontSize: 12.5,
  },
  filterChipCount: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  filterChipCountText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardInfoCol: {
    flex: 1,
    paddingRight: 6,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14.5,
    flex: 1,
    marginRight: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  cardDescription: {
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 8,
  },
  cardBottomMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeAgoText: {
    fontSize: 11,
    fontWeight: "500",
  },
  tapToViewTag: {
    paddingVertical: 1,
  },
  tapToViewText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  cardDeleteBtn: {
    padding: 2,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyStateSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  simulatorCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  simulatorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  simulatorTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  simulatorSub: {
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 16,
  },
  simOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  simOptionTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    marginBottom: 2,
  },
  simOptionDesc: {
    fontSize: 11.5,
  },
});
