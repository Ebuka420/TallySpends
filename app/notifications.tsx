import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Define the structure for notifications
interface NotificationItem {
  id: string;
  type: "alert" | "insight" | "bill" | "system";
  title: string;
  description: string;
  timestamp: string;
  isUnread: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<
    "all" | "alerts" | "insights"
  >("all");

  // Realistic notification seed data for TallySpends
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      type: "alert",
      title: "Budget Warning!",
      description:
        "You have used 85% of your 'Food & Dining' budget for this month. Only $90.00 remaining.",
      timestamp: "10m ago",
      isUnread: true,
    },
    {
      id: "2",
      type: "insight",
      title: "Weekly Smart Insight",
      description:
        "Nice job! You spent 12% less on shopping this week compared to your average baseline.",
      timestamp: "2h ago",
      isUnread: true,
    },
    {
      id: "3",
      type: "bill",
      title: "Upcoming Subscription",
      description:
        "Your Adobe Creative Cloud subscription ($54.99) is scheduled for automatic renewal tomorrow.",
      timestamp: "1d ago",
      isUnread: false,
    },
    {
      id: "4",
      type: "alert",
      title: "Unusual Transaction Flag",
      description:
        "A larger-than-normal debit of $430.00 was categorized under Transport (Uber).",
      timestamp: "2d ago",
      isUnread: false,
    },
    {
      id: "5",
      type: "system",
      title: "Account Security Update",
      description:
        "Your budgeting account credentials were successfully updated from a new device layout.",
      timestamp: "4d ago",
      isUnread: false,
    },
  ]);

  // Handle filtering logic
  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === "alerts") return item.type === "alert";
    if (activeFilter === "insights") return item.type === "insight";
    return true;
  });

  // Mark all as read action
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  // Helper to fetch matching contextual icons
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <Ionicons name="warning-outline" size={18} color="#EC7063" />;
      case "insight":
        return (
          <Ionicons name="trending-up-outline" size={18} color="#2ECC71" />
        );
      case "bill":
        return <Ionicons name="card-outline" size={18} color="#F5B041" />;
      default:
        return (
          <Ionicons name="shield-checkmark-outline" size={18} color="#5DADE2" />
        );
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        item.isUnread && styles.unreadCardBackground,
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeaderRow}>
        <View style={styles.iconAndTitleGroup}>
          <View
            style={[
              styles.iconCircleFrame,
              { backgroundColor: item.isUnread ? "#FFFFFF" : "#F4F5F7" },
            ]}
          >
            {getNotificationIcon(item.type)}
          </View>
          <Text
            style={[
              styles.notificationTitleText,
              item.isUnread && styles.unreadTextWeight,
            ]}
          >
            {item.title}
          </Text>
        </View>
        <View style={styles.rightMetaGroup}>
          <Text style={styles.timestampText}>{item.timestamp}</Text>
          {item.isUnread && <View style={styles.unreadActiveIndicatorDot} />}
        </View>
      </View>
      <Text style={styles.descriptionText}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* --- TOP HEADER NAVIGATION --- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#2D232E" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Notifications</Text>
        <TouchableOpacity
          style={styles.markReadTextButton}
          onPress={markAllAsRead}
        >
          <Text style={styles.markReadActionLabel}>Clear unread</Text>
        </TouchableOpacity>
      </View>

      {/* --- SEGMENTED FILTER CONTROLS --- */}
      <View style={styles.filterBarTabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabItemButton,
            activeFilter === "all" && styles.activeTabItemButton,
          ]}
          onPress={() => setActiveFilter("all")}
        >
          <Text
            style={[
              styles.tabLabelText,
              activeFilter === "all" && styles.activeTabLabelText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabItemButton,
            activeFilter === "alerts" && styles.activeTabItemButton,
          ]}
          onPress={() => setActiveFilter("alerts")}
        >
          <Text
            style={[
              styles.tabLabelText,
              activeFilter === "alerts" && styles.activeTabLabelText,
            ]}
          >
            Alerts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabItemButton,
            activeFilter === "insights" && styles.activeTabItemButton,
          ]}
          onPress={() => setActiveFilter("insights")}
        >
          <Text
            style={[
              styles.tabLabelText,
              activeFilter === "insights" && styles.activeTabLabelText,
            ]}
          >
            Insights
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- NOTIFICATION FEED LIST --- */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listScrollContentContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyStateCenteringWrapper}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color="#A6ACAF"
            />
            <Text style={styles.emptyStateHeadingTitle}>All caught up!</Text>
            <Text style={styles.emptyStateSubtextBlurb}>
              No recent notifications fit your selected filters.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#EFEFEF",
    paddingTop: Platform.OS === "android" ? 10 : 0,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D232E",
  },
  markReadTextButton: {
    paddingVertical: 6,
  },
  markReadActionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6442E5",
  },
  filterBarTabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#EFEFEF",
  },
  tabItemButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#F0F0F2",
  },
  activeTabItemButton: {
    backgroundColor: "#2D232E",
  },
  tabLabelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#534B52",
  },
  activeTabLabelText: {
    color: "#FFFFFF",
  },
  listScrollContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    padding: 14,
    marginBottom: 12,
  },
  unreadCardBackground: {
    backgroundColor: "#F7F5FF",
    borderColor: "#E1DBFF",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  iconAndTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  iconCircleFrame: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  notificationTitleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2D232E",
    flex: 1,
  },
  unreadTextWeight: {
    fontWeight: "700",
  },
  rightMetaGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  timestampText: {
    fontSize: 11,
    color: "#A6ACAF",
  },
  unreadActiveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6442E5",
    marginLeft: 6,
  },
  descriptionText: {
    fontSize: 12,
    color: "#534B52",
    lineHeight: 18,
    paddingLeft: 40,
  },
  emptyStateCenteringWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyStateHeadingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D232E",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtextBlurb: {
    fontSize: 12,
    color: "#534B52",
    textAlign: "center",
    lineHeight: 18,
  },
});
