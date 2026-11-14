import { useThemeTokens } from "../src/ThemeExperience";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import { scheduleInstantLocalNotification } from "../src/services/pushNotificationService";
import { type NotificationItem, useAppStore } from "../src/store";

type FilterTab = "all" | "transactions" | "alerts" | "updates";
type Direction = "incoming" | "outgoing" | null;
type FeedEntry = { kind: "heading"; id: string; label: string } | { kind: "notification"; id: string; notification: NotificationItem };

function dayGroup(timestamp: string) {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "Earlier";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const daysAgo = Math.round((today - dateDay) / 86400000);
  return daysAgo <= 0 ? "Today" : daysAgo === 1 ? "Yesterday" : "Earlier";
}

function timestampLabel(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Recently";
  return `${date.toLocaleDateString("en-NG", { month: "short", day: "numeric" })} · ${date.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const store = useAppStore();
  const { notifications, unreadNotificationCount, addNotification, markNotificationAsRead,
    markAllNotificationsAsRead, deleteNotification, clearAllNotifications, clearReadNotifications } = store;
  const theme = useThemeTokens();
  const dark = store.themeMode === "dark";
  const { expoPushToken } = usePushNotifications();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [showMenu, setShowMenu] = useState(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);

  const directionOf = (item: NotificationItem): Direction => {
    if (item.transactionDirection) return item.transactionDirection;
    const linked = item.referenceId && store.transactions.find((tx: any) => String(tx.id) === item.referenceId);
    if (linked?.type === "income") return "incoming";
    if (linked?.type === "expense") return "outgoing";
    const copy = `${item.title} ${item.description}`.toLowerCase();
    if (/\b(sent|withdraw|debit|outgoing|money sent|transfer successful)\b/.test(copy)) return "outgoing";
    if (/\b(received|credited|deposit|income|money received|inbound)\b/.test(copy)) return "incoming";
    return null;
  };

  const counts = useMemo(() => ({
    all: notifications.length,
    transactions: notifications.filter(item => item.type === "transaction").length,
    alerts: notifications.filter(item => item.type === "alert").length,
    updates: notifications.filter(item => ["insight", "bill", "system"].includes(item.type)).length,
  }), [notifications]);

  const feed = useMemo<FeedEntry[]>(() => {
    const filtered = notifications.filter(item => activeFilter === "all"
      || activeFilter === "transactions" && item.type === "transaction"
      || activeFilter === "alerts" && item.type === "alert"
      || activeFilter === "updates" && ["insight", "bill", "system"].includes(item.type));
    filtered.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    const entries: FeedEntry[] = [];
    let previous = "";
    for (const notification of filtered) {
      const heading = dayGroup(notification.timestamp);
      if (heading !== previous) {
        entries.push({ kind: "heading", id: `heading-${heading}`, label: heading });
        previous = heading;
      }
      entries.push({ kind: "notification", id: notification.id, notification });
    }
    return entries;
  }, [notifications, activeFilter]);

  const handleNotificationPress = (item: NotificationItem) => {
    void Haptics.selectionAsync().catch(() => {});
    if (item.isUnread) void markNotificationAsRead(item.id);
    const route = item.route || (item.type === "transaction" && item.referenceId
      ? `/transaction-details?id=${encodeURIComponent(item.referenceId)}` : undefined);
    if (route) router.push(route as any);
  };

  const handleDelete = (item: NotificationItem) => Alert.alert("Delete notification?", "This removes the notification from this device.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => { void deleteNotification(item.id); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } },
  ]);

  const confirmClearRead = () => {
    const readCount = notifications.filter(item => !item.isUnread).length;
    setShowMenu(false);
    if (!readCount) { Alert.alert("Nothing to clear", "You have no read notifications."); return; }
    Alert.alert("Clear read notifications?", `${readCount} read ${readCount === 1 ? "notification" : "notifications"} will be removed.`, [
      { text: "Cancel", style: "cancel" }, { text: "Clear read", style: "destructive", onPress: () => { void clearReadNotifications(); } },
    ]);
  };

  const confirmClearAll = () => {
    setShowMenu(false);
    if (!notifications.length) return;
    Alert.alert("Clear all notifications?", "This removes all notifications from this device.", [
      { text: "Cancel", style: "cancel" }, { text: "Clear all", style: "destructive", onPress: () => { void clearAllNotifications(); } },
    ]);
  };

  const handleSendTestPush = async (type: NotificationItem["type"]) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setShowSimulatorModal(false);
    let title: string;
    let description: string;
    let route: string | undefined;
    let direction: Direction;
    if (type === "transaction") {
      title = "Money Received";
      description = "₦15,000.00 was credited to your TallySpends account from @chioma_k.";
      route = "/(tabs)/expenses";
      direction = "incoming";
    } else if (type === "alert") {
      title = "Security Alert";
      description = "A new device signed into your TallySpends account.";
      route = "/settings-security";
      direction = null;
    } else if (type === "insight") {
      title = "App Update";
      description = "A new TallySpends feature is now available.";
      route = "/insightssum";
      direction = null;
    } else {
      title = "Upcoming Subscription";
      description = "Your monthly internet subscription is due in 2 days.";
      route = undefined;
      direction = null;
    }
    await addNotification({ type, title, description, ...(route ? { route } : {}), ...(direction ? { transactionDirection: direction } : {}), ...(type === "transaction" ? { amount: 15000 } : {}) });
    await scheduleInstantLocalNotification({ title: `🔔 ${title}`, body: description, data: { route }, delaySeconds: 2 });
  };

  const iconFor = (item: NotificationItem) => {
    if (item.type === "transaction") {
      const direction = directionOf(item);
      if (direction === "incoming") return { name: "arrow-down-outline" as const, rotation: "45deg" as const, color: dark ? "#7CD992" : "#16803D", bg: dark ? "#173924" : "#E8F5EB" };
      if (direction === "outgoing") return { name: "arrow-up-outline" as const, rotation: "45deg" as const, color: dark ? "#FF9393" : "#C83E4D", bg: dark ? "#442329" : "#FCEAEC" };
      return { name: "swap-horizontal-outline" as const, rotation: "0deg" as const, color: theme.accent, bg: theme.accentSoft };
    }
    if (item.type === "alert") return { name: "notifications-outline" as const, rotation: "0deg" as const, color: dark ? "#F4CC62" : "#A67300", bg: dark ? "#44391B" : "#FFF4D6" };
    return { name: "alert-circle-outline" as const, rotation: "0deg" as const, color: dark ? "#B9B6C2" : "#777580", bg: dark ? "#303038" : "#F0EFF2" };
  };

  const displayTitle = (item: NotificationItem) => {
    if (item.type !== "transaction") return item.title;
    const direction = directionOf(item);
    return direction === "incoming" ? "Money Received" : direction === "outgoing" ? "Money Sent" : item.title;
  };

  const filters: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "transactions", label: "Transactions", count: counts.transactions },
    { key: "alerts", label: "Alerts", count: counts.alerts },
    { key: "updates", label: "Updates", count: counts.updates },
  ];

  return <SafeAreaView style={[s.safe, { backgroundColor: theme.background }]}>
    <View style={[s.header, { borderBottomColor: theme.border }]}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" style={[s.headerButton, { backgroundColor: theme.surface }]} onPress={() => router.back()}><Ionicons name="chevron-back" size={21} color={theme.textPrimary} /></TouchableOpacity>
      <View style={s.headerCenter}><Text style={[s.headerTitle, { color: theme.textPrimary }]}>Notifications</Text>{unreadNotificationCount > 0 && <View style={[s.unreadCount, { backgroundColor: theme.accent }]}><Text style={s.unreadCountText}>{unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}</Text></View>}</View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notification actions" style={[s.headerButton, { backgroundColor: theme.surface }]} onPress={() => setShowMenu(true)}><Ionicons name="ellipsis-horizontal" size={21} color={theme.textPrimary} /></TouchableOpacity>
    </View>

    {__DEV__ && <View style={[s.testStrip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[s.testIcon, { backgroundColor: theme.accentSoft }]}><Ionicons name="notifications-outline" size={15} color={theme.accent} /></View>
      <View style={{ flex: 1 }}><Text style={{ color: theme.textPrimary, fontSize: 11, fontWeight: "700" }}>Test notifications</Text><Text style={{ color: theme.textSecondary, fontSize: 9, marginTop: 2 }}>{expoPushToken ? "Push token ready" : "Local test alert"}</Text></View>
      <TouchableOpacity accessibilityRole="button" onPress={() => void handleSendTestPush("transaction")} style={[s.testButton, { backgroundColor: theme.accent }]}><Ionicons name="paper-plane-outline" size={12} color={theme.onAccent} /><Text style={{ color: theme.onAccent, fontSize: 10, fontWeight: "700" }}>Test (2s)</Text></TouchableOpacity>
      {expoPushToken && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Copy push token" onPress={async () => { await Clipboard.setStringAsync(expoPushToken); Alert.alert("Copied", "Expo push token copied."); }} style={s.copyButton}><Ionicons name="copy-outline" size={15} color={theme.textSecondary} /></TouchableOpacity>}
    </View>}

    <FlatList
      horizontal
      data={filters}
      keyExtractor={item => item.key}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.filters}
      renderItem={({ item }) => {
        const selected = activeFilter === item.key;
        return <TouchableOpacity accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={`${item.label}, ${item.count} notifications`} onPress={() => { setActiveFilter(item.key); void Haptics.selectionAsync().catch(() => {}); }} style={[s.filter, { backgroundColor: selected ? theme.accent : theme.surface, borderColor: selected ? theme.accent : theme.border }]}>
          <Text style={{ color: selected ? theme.onAccent : theme.textPrimary, fontWeight: selected ? "700" : "500", fontSize: 11 }}>{item.label}</Text>
          <Text style={{ color: selected ? theme.onAccent : theme.textSecondary, fontSize: 9, opacity: selected ? .82 : .9 }}>{item.count}</Text>
        </TouchableOpacity>;
      }}
    />

    <FlatList
      data={feed}
      keyExtractor={entry => entry.id}
      contentContainerStyle={s.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: entry }) => {
        if (entry.kind === "heading") return <Text style={[s.groupHeading, { color: theme.textSecondary }]}>{entry.label}</Text>;
        const item = entry.notification;
        const icon = iconFor(item);
        return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${displayTitle(item)}. ${item.description}. ${timestampLabel(item.timestamp)}${item.isUnread ? ". Unread" : ""}`} accessibilityHint="Double tap to open. Long press for notification actions." onPress={() => handleNotificationPress(item)} onLongPress={() => handleDelete(item)} delayLongPress={450} activeOpacity={.75} style={[s.card, { backgroundColor: item.isUnread ? (dark ? theme.surfaceSoft : "#FFFEFF") : theme.surface, borderColor: theme.border }]}>
          <View style={[s.iconBox, { backgroundColor: icon.bg }]}><Ionicons name={icon.name} size={18} color={icon.color} style={{ transform: [{ rotate: icon.rotation }] }} /></View>
          <View style={s.cardBody}>
            <View style={s.titleLine}><Text numberOfLines={1} style={{ flex: 1, color: theme.textPrimary, fontSize: 12, fontWeight: item.isUnread ? "700" : "600" }}>{displayTitle(item)}</Text>{item.isUnread && <View style={[s.unreadDot, { backgroundColor: theme.accent }]} />}</View>
            <Text numberOfLines={3} style={{ color: theme.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 4 }}>{item.description}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 9, marginTop: 7 }}>{timestampLabel(item.timestamp)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} style={{ marginLeft: 5, marginTop: 3 }} />
        </TouchableOpacity>;
      }}
      ListEmptyComponent={store.notificationsLoading ? <View style={s.empty}><ActivityIndicator color={theme.accent} /><Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 10 }}>Loading notifications…</Text></View> : store.notificationsError ? <View style={s.empty}><View style={[s.emptyIcon, { backgroundColor: theme.accentSoft }]}><Ionicons name="cloud-offline-outline" size={24} color={theme.accent} /></View><Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700" }}>Couldn’t load notifications</Text><Text style={{ color: theme.textSecondary, fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: 6 }}>{store.notificationsError}</Text><TouchableOpacity accessibilityRole="button" onPress={() => void store.retryNotifications()} style={{ padding: 12 }}><Text style={{ color: theme.accent, fontSize: 12, fontWeight: "700" }}>Try again</Text></TouchableOpacity></View> : <View style={s.empty}><View style={[s.emptyIcon, { backgroundColor: theme.accentSoft }]}><Ionicons name="notifications-off-outline" size={24} color={theme.accent} /></View><Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700" }}>{activeFilter === "all" ? "You’re all caught up" : `No ${activeFilter} notifications`}</Text><Text style={{ color: theme.textSecondary, fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: 6 }}>New transactions, alerts, and app updates will appear here.</Text></View>}
    />

    <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
      <Pressable style={s.menuBackdrop} onPress={() => setShowMenu(false)}>
        <View style={[s.menu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[s.menuLabel, { color: theme.textSecondary }]}>NOTIFICATION ACTIONS</Text>
          <MenuAction icon="checkmark-done-outline" label="Mark all as read" theme={theme} onPress={() => { setShowMenu(false); void markAllNotificationsAsRead(); }} />
          <MenuAction icon="mail-open-outline" label="Clear read notifications" theme={theme} onPress={confirmClearRead} />
          <MenuAction icon="trash-outline" label="Clear all notifications" destructive theme={theme} onPress={confirmClearAll} />
          {__DEV__ && <MenuAction icon="flask-outline" label="Simulate a notification" theme={theme} onPress={() => { setShowMenu(false); setShowSimulatorModal(true); }} />}
        </View>
      </Pressable>
    </Modal>

    <Modal visible={showSimulatorModal} transparent animationType="fade" onRequestClose={() => setShowSimulatorModal(false)}>
      <Pressable style={s.modalBackdrop} onPress={() => setShowSimulatorModal(false)}>
        <View style={[s.simulator, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={s.simulatorHeading}><Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: "800" }}>Simulate notification</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Close" onPress={() => setShowSimulatorModal(false)}><Ionicons name="close" size={22} color={theme.textPrimary} /></TouchableOpacity></View>
          <Text style={{ color: theme.textSecondary, fontSize: 11, lineHeight: 17, marginBottom: 13 }}>Create a local sample and show a device notification.</Text>
          {([
            ["transaction", "Money received", "Incoming payment sample", "arrow-down-outline", "#16803D"],
            ["alert", "Security alert", "Account safety sample", "notifications-outline", "#A67300"],
            ["insight", "App update", "Feature announcement sample", "alert-circle-outline", "#777580"],
            ["bill", "Reminder", "Upcoming subscription sample", "alert-circle-outline", "#777580"],
          ] as const).map(([type, title, subtitle, icon, color]) => <TouchableOpacity key={type} accessibilityRole="button" onPress={() => void handleSendTestPush(type)} style={[s.simulatorOption, { borderColor: theme.border, backgroundColor: theme.background }]}><Ionicons name={icon} size={19} color={color} /><View style={{ flex: 1 }}><Text style={{ color: theme.textPrimary, fontSize: 12, fontWeight: "700" }}>{title}</Text><Text style={{ color: theme.textSecondary, fontSize: 10, marginTop: 3 }}>{subtitle}</Text></View><Ionicons name="chevron-forward" size={15} color={theme.textSecondary} /></TouchableOpacity>)}
        </View>
      </Pressable>
    </Modal>
  </SafeAreaView>;
}

function MenuAction({ icon, label, onPress, theme, destructive = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; theme: ReturnType<typeof useThemeTokens>; destructive?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={s.menuAction}><Ionicons name={icon} size={18} color={destructive ? theme.danger : theme.accent} /><Text style={{ color: destructive ? theme.danger : theme.textPrimary, fontSize: 12, fontWeight: "600" }}>{label}</Text></TouchableOpacity>;
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerButton: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: "700", letterSpacing: -.2 },
  unreadCount: { minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: "center", justifyContent: "center" },
  unreadCountText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  testStrip: { marginHorizontal: 16, marginTop: 9, borderWidth: 1, borderRadius: 15, paddingHorizontal: 10, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 9 },
  testIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  testButton: { minHeight: 30, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 11, paddingHorizontal: 10 },
  copyButton: { padding: 7 },
  filters: { paddingHorizontal: 16, paddingTop: 11, paddingBottom: 10, gap: 7 },
  filter: { minHeight: 30, borderWidth: 1, borderRadius: 20, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 6 },
  list: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 28, gap: 8 },
  groupHeading: { fontSize: 10, fontWeight: "700", marginTop: 8, marginBottom: 1 },
  card: { borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, padding: 11, minHeight: 76, flexDirection: "row", alignItems: "center" },
  iconBox: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", marginRight: 10 },
  cardBody: { flex: 1, minWidth: 0 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 7 },
  unreadDot: { width: 6, height: 6, borderRadius: 3 },
  empty: { alignItems: "center", padding: 32, marginTop: 30 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 13 },
  menuBackdrop: { flex: 1, backgroundColor: "rgba(12,10,18,0.18)", alignItems: "flex-end", paddingTop: 54, paddingRight: 14 },
  menu: { width: 244, borderWidth: 1, borderRadius: 17, paddingHorizontal: 14, paddingVertical: 12, shadowColor: "#20142A", shadowOpacity: .12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  menuLabel: { fontSize: 8, fontWeight: "800", letterSpacing: 1, paddingHorizontal: 7, paddingBottom: 8 },
  menuAction: { minHeight: 43, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 7 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(12,10,18,0.38)", justifyContent: "center", padding: 22 },
  simulator: { width: "100%", maxWidth: 380, alignSelf: "center", borderWidth: 1, borderRadius: 22, padding: 17, gap: 9 },
  simulatorHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  simulatorOption: { minHeight: 55, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 11 },
});
