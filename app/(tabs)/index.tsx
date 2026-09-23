import { HomeCarousel } from "../../components/HomeCarousel";
import TransactionReceiptModal from "../../components/TransactionReceiptModal";
import { getCompletedTransaction, subscribeCompletedTransaction, clearCompletedTransaction } from "../../src/transactionCompletion";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MOCK_RECIPIENTS, useAppStore } from "../../src/store";
import { getThemePalette } from "../../src/theme";
import { usePlanningPeople } from "../../components/BudgetPeople";
import { PlanningCarousels } from "../../components/PlanningCarousels";

const normalizeTransferTitle = (title: string) => {
  const transferRegex = /(Transfer to\s+)@([a-zA-Z0-9_]+)/i;

  return title.replace(transferRegex, (_, prefix: string, username: string) => {
    const recipient = MOCK_RECIPIENTS.find(
      (r) => r.username.toLowerCase() === username.toLowerCase(),
    );

    return recipient
      ? `${prefix}${recipient.name}`
      : `Transfer to @${username}`;
  });
};

const insights = [
  {
    icon: "restaurant-outline" as const,
    title: "Food spending is up",
    text: "You've spent more on food in the past week than you did last month.",
    tint: "#F3EBF1",
    color: "#4B2C40",
  },
  {
    icon: "leaf-outline" as const,
    title: "A calmer week",
    text: "Your overall spending is 18% lower than your weekly average.",
    tint: "#F8F2F7",
    color: "#6C4C7A",
  },
  {
    icon: "sparkles-outline" as const,
    title: "A small win",
    text: "You are just ₦96 away from this month's savings goal.",
    tint: "#EEE4F0",
    color: "#4B2C40",
  },
  {
    icon: "card-outline" as const,
    title: "Linked Cards",
    text: "Your Netflix subscription is due tomorrow on your linked Access Bank card.",
    tint: "#EAF2FF",
    color: "#315A92",
  },
];

const categoryMeta: Record<
  string,
  {
    icon: any;
    color: string;
    soft: string;
  }
> = {
  "Food & Dining": {
    icon: "restaurant-outline",
    color: "#A9622C",
    soft: "#F7EEE7",
  },
  Transport: {
    icon: "car-outline",
    color: "#59728F",
    soft: "#EAF0F6",
  },
  Shopping: {
    icon: "bag-handle-outline",
    color: "#846590",
    soft: "#F2ECF5",
  },
  "Bills & Utilities": {
    icon: "document-text-outline",
    color: "#5B7A67",
    soft: "#EAF2EA",
  },
  Entertainment: {
    icon: "film-outline",
    color: "#8A7067",
    soft: "#F4EEEB",
  },
  Others: {
    icon: "ellipsis-horizontal",
    color: "#70706B",
    soft: "#EFEFEB",
  },
};

const formatCurrency = (amount: number) =>
  `₦${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getTimeLabel = (value?: string) => {
  if (!value) return "Recently added";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently added";
  }

  const today = new Date();
  const yesterday = new Date(today);

  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export default function App() {
  const router = useRouter();

  const store = useAppStore();
  const people = usePlanningPeople(store);
  const {
    transactions,
    availableBalance,
    unreadNotificationCount,
    themePreference,
    themeMode,
    username,
    profileFullName,
    profileNickname,
    profileImage,
    budgetWallet,
    budgetError,
    reloadBudgetWallet,
  } = store;

  const theme = getThemePalette(themePreference, themeMode);

  const isNicknameSet =
    profileNickname &&
    profileNickname.trim() !== "" &&
    profileNickname.trim().toLowerCase() !== "enter nickname";
  const displayName = isNicknameSet
    ? profileNickname.trim()
    : profileFullName?.trim() || username || "User";

  const [balanceVisible, setBalanceVisible] = useState(true);
  const receiptId = useSyncExternalStore(subscribeCompletedTransaction, getCompletedTransaction, getCompletedTransaction);
  const receipt = transactions.find(tx => tx.id === receiptId) || null;
  const [receiptReady, setReceiptReady] = useState(false);
  useFocusEffect(useCallback(() => {
    setReceiptReady(false);
    if (!receiptId) return;
    // Let the previous native sheet dismiss and the dashboard transition finish.
    const timer = setTimeout(() => setReceiptReady(true), 450);
    return () => { clearTimeout(timer); setReceiptReady(false); };
  }, [receiptId]));

  const transactionsRaw = useMemo(
    () => (transactions || []) as any[],
    [transactions],
  );

  const currentBalance = availableBalance;

  const recentTransactions = useMemo(() => {
    return [...transactionsRaw]
      .sort((a, b) => {
        const aTime = new Date(a.date || 0).getTime();
        const bTime = new Date(b.date || 0).getTime();

        return bTime - aTime;
      })
      .slice(0, 3);
  }, [transactionsRaw]);

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Container */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.profileContainer}
            onPress={() => router.push("/profile")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.avatarWrapper,
                {
                  backgroundColor: theme.accentSoft,
                  overflow: "hidden",
                },
              ]}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
              ) : (
                <Ionicons name="person" size={20} color={theme.textPrimary} />
              )}
            </View>

            <View style={styles.greetingTextWrap}>
              <Text
                style={[
                  styles.greetingText,
                  {
                    color: theme.textPrimary,
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Welcome, {displayName}
              </Text>

              <Text
                style={[
                  styles.subGreetingText,
                  {
                    color: theme.textSecondary,
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Where did your money go today?
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => router.push("/request")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="qr-code-outline"
                size={18}
                color={theme.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  position: "relative",
                },
              ]}
              onPress={() => router.push("/notifications")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={theme.textPrimary}
              />
              {unreadNotificationCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -3,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: theme.accent,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 3,
                    borderWidth: 1.5,
                    borderColor: theme.surface,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 9,
                      fontWeight: "800",
                    }}
                  >
                    {unreadNotificationCount > 9
                      ? "9+"
                      : unreadNotificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => router.push("/customerservice")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="headset-outline"
                size={20}
                color={theme.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Section */}
        <View style={styles.balance}>
          <Text
            style={[
              styles.balanceLabel,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            AVAILABLE BALANCE
          </Text>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              balanceVisible ? "Hide balance" : "Show balance"
            }
            onPress={() => setBalanceVisible((visible) => !visible)}
            activeOpacity={0.68}
            style={styles.balanceAmountButton}
          >
            <Text
              style={[
                styles.balanceAmount,
                {
                  color: theme.textPrimary,
                },
                !balanceVisible && styles.hiddenBalanceAmount,
              ]}
            >
              {balanceVisible
                ? `₦${currentBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "********"}
            </Text>
          </TouchableOpacity>

          <View style={styles.trend}>
            <Ionicons name="arrow-up" size={12} color={theme.accentSecondary} />

            <Text
              style={[
                styles.trendText,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              8.5% from last month
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.action}
            onPress={() => router.push("/deposit")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                {
                  backgroundColor: theme.accent,
                  shadowColor: theme.accent,
                },
              ]}
            >
              <Ionicons name="download-outline" size={22} color="#FFFFFF" />
            </View>

            <Text
              style={[
                styles.actionText,
                {
                  color: theme.textPrimary,
                },
              ]}
            >
              Deposit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            onPress={() => router.push("/withdraw")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                {
                  backgroundColor: theme.accent,
                  shadowColor: theme.accent,
                },
              ]}
            >
              <Ionicons name="arrow-up-outline" size={20} color="#FFFFFF" />
            </View>

            <Text
              style={[
                styles.actionText,
                {
                  color: theme.textPrimary,
                },
              ]}
            >
              Withdraw
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            onPress={() => router.push("/transfer")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                {
                  backgroundColor: theme.accent,
                  shadowColor: theme.accent,
                },
              ]}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={21}
                color="#FFFFFF"
              />
            </View>

            <Text
              style={[
                styles.actionText,
                {
                  color: theme.textPrimary,
                },
              ]}
            >
              Transfer
            </Text>
          </TouchableOpacity>
        </View>

        <HomeCarousel title="Smart insights" link="See all" onViewAll={() => router.push("/insightssum")}
          theme={theme} themeMode={themeMode} themePreference={themePreference}
          cards={insights.map(insight => ({ ...insight, id: insight.title, onPress: () => router.push("/insightssum") }))} />

        <PlanningCarousels
          wallet={budgetWallet}
          themeMode={themeMode}
          themePreference={themePreference}
          theme={theme}
          people={people}
          error={budgetError}
          retry={reloadBudgetWallet}
        />

        {/* Recent Transactions */}
        <View
          style={[
            styles.sectionHeader,
            {
              marginTop: 24,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.textPrimary,
              },
            ]}
          >
            Recent transactions
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/transaction-history")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.viewAllText,
                {
                  color: theme.accentSecondary,
                },
              ]}
            >
              View all
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.transactionsContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx, index) => {
              const isIncome = tx.type === "income";

              const meta =
                categoryMeta[tx.category || "Others"] || categoryMeta.Others;

              return (
                <View key={tx.id || `${tx.title}-${index}`}>
                  <Transaction
                    icon={isIncome ? "arrow-down-outline" : meta.icon}
                    tint={isIncome ? theme.accentSoft : meta.soft}
                    color={isIncome ? theme.success : meta.color}
                    name={normalizeTransferTitle(tx.title || "Transaction")}
                    category={tx.category || "Others"}
                    amount={`${isIncome ? "+" : "-"}${formatCurrency(
                      Number(tx.amount || 0),
                    )}`}
                    time={getTimeLabel(tx.date)}
                    positive={isIncome}
                    theme={theme}
                  />

                  {index < recentTransactions.length - 1 && (
                    <View
                      style={[
                        styles.rowDivider,
                        {
                          backgroundColor: theme.border,
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })
          ) : (
            <View
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyStateText,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                No transactions yet.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <TransactionReceiptModal visible={receiptReady && !!receipt} transaction={receipt} onClose={clearCompletedTransaction}
        onViewReceipt={() => { if (!receipt) return; clearCompletedTransaction(); router.push({ pathname: "/transaction-details", params: { id: receipt.id } }); }} />
    </View>
  );
}

function Transaction({
  icon,
  tint,
  color,
  name,
  category,
  amount,
  time,
  positive = false,
  theme,
}: {
  icon: any;
  tint: string;
  color: string;
  name: string;
  category: string;
  amount: string;
  time: string;
  positive?: boolean;
  theme: ReturnType<typeof getThemePalette>;
}) {
  return (
    <TouchableOpacity activeOpacity={0.72} style={styles.transactionItem}>
      <View style={styles.transLeft}>
        <View
          style={[
            styles.transIconCircle,
            {
              backgroundColor: tint,
            },
          ]}
        >
          <Ionicons name={icon} size={18} color={color} />
        </View>

        <View style={styles.transTextWrap}>
          <Text
            style={[
              styles.transName,
              {
                color: theme.textPrimary,
              },
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {name}
          </Text>

          <Text
            style={[
              styles.transCategory,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            {category}
          </Text>
        </View>
      </View>

      <View style={styles.transRight}>
        <Text
          style={[
            styles.transAmount,
            {
              color: theme.textPrimary,
            },
            positive && {
              color: theme.success,
            },
          ]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
        >
          {amount}
        </Text>

        <Text
          style={[
            styles.transTime,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          {time}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 110,
  },

  headerContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  profileContainer: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },

  greetingTextWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  avatarWrapper: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    marginRight: 10,
    width: 40,
    flexShrink: 0,
  },

  greetingText: {
    fontSize: 14,
    fontWeight: "700",
  },

  subGreetingText: {
    fontSize: 11,
    marginTop: 2,
  },

  headerIcons: {
    flexDirection: "row",
    gap: 8,
    flexShrink: 0,
    alignItems: "center",
  },

  iconButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
    // subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  balance: {
    alignItems: "center",
    paddingBottom: 27,
    paddingTop: 48,
  },

  balanceLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  balanceAmountButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 7,
    minWidth: 210,
  },

  balanceAmount: {
    fontSize: 45,
    fontWeight: "700",
    letterSpacing: -2.1,
  },

  hiddenBalanceAmount: {
    letterSpacing: 3,
    transform: [{ translateY: -1 }],
  },

  trend: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 9,
  },

  trendText: {
    fontSize: 13,
  },

  quickActions: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 26,
  },

  action: {
    alignItems: "center",
    marginHorizontal: 16,
  },

  actionIcon: {
    alignItems: "center",
    borderRadius: 31,
    elevation: 4,
    height: 58,
    justifyContent: "center",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    width: 58,
  },

  actionText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },

  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 23,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.35,
  },

  viewAllText: {
    fontSize: 12,
    fontWeight: "600",
  },

  insightCarousel: {
    gap: 12,
    paddingRight: 20,
  },

  insightCard: {
    borderRadius: 21,
    flexDirection: "row",
    minHeight: 122,
    padding: 16,
    width: 306,
  },

  insightIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    marginRight: 12,
    width: 42,
  },

  insightCopy: {
    flex: 1,
    paddingRight: 5,
  },

  insightTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },

  insightText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },

  insightChevron: {
    alignSelf: "center",
  },

  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    marginTop: 13,
  },

  dot: {
    borderRadius: 3,
    height: 5,
    width: 5,
  },

  activeDot: {
    width: 16,
  },

  groupSection: {
    marginTop: 18,
  },

  groupCarousel: {
    gap: 12,
    paddingRight: 20,
  },

  groupCard: {
    alignItems: "flex-start",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    padding: 12,
    width: 260,
  },

  groupAvatar: {
    borderRadius: 24,
    height: 48,
    marginRight: 12,
    width: 48,
  },

  groupCardCopy: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },

  groupCardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  groupCardSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },

  groupCardMeta: {
    fontSize: 11,
    marginTop: 3,
  },

  transactionsContainer: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },

  transactionItem: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 74,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
  },

  transLeft: {
    alignItems: "flex-start",
    flexDirection: "row",
    flex: 1,
    minWidth: 0,
  },

  transIconCircle: {
    alignItems: "center",
    borderRadius: 13,
    height: 40,
    justifyContent: "center",
    marginRight: 12,
    width: 40,
  },

  transTextWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },

  transName: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    flexWrap: "wrap",
  },

  transCategory: {
    fontSize: 11,
    marginTop: 3,
    flexWrap: "wrap",
  },

  transRight: {
    alignItems: "flex-end",
    flexShrink: 1,
    marginLeft: 8,
    maxWidth: 112,
    minWidth: 0,
  },

  transAmount: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
    flexWrap: "wrap",
  },

  transTime: {
    fontSize: 11,
    marginTop: 3,
  },

  rowDivider: {
    height: 1,
    marginLeft: 67,
  },

  emptyStateCard: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 18,
    width: "100%",
  },

  emptyStateText: {
    fontSize: 13,
    textAlign: "center",
  },
});
