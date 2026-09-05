/**
 * TallySpends Backend Push Notification Dispatcher (Node.js / TypeScript / Supabase Edge Function)
 *
 * This module demonstrates how to send push notifications via the Expo Push API
 * (https://exp.host/--/api/v2/push/send) with support for batching, custom sounds,
 * Android notification channels, and deep-link routing.
 */

export interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  priority?: "default" | "normal" | "high";
  badge?: number;
  channelId?: "default" | "budget-alerts";
  ttl?: number; // Time to live in seconds
}

export interface ExpoPushReceipt {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: "DeviceNotRegistered" | "InvalidCredentials" | "MessageTooBig" | "MessageRateExceeded" };
}

/**
 * Sends a single or array of push notifications through the Expo Push API.
 * 
 * @param {ExpoPushMessage[]} messages - Array of push messages
 * @returns {Promise<ExpoPushReceipt[]>}
 */
export async function sendExpoPushNotifications(messages: ExpoPushMessage[]): Promise<ExpoPushReceipt[]> {
  const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

  // Validate and sanitize tokens
  const validMessages = messages.filter((msg) => {
    const tokens = Array.isArray(msg.to) ? msg.to : [msg.to];
    return tokens.every((token) => typeof token === "string" && token.startsWith("ExponentPushToken"));
  });

  if (validMessages.length === 0) {
    console.warn("⚠️ No valid Expo Push Tokens provided.");
    return [];
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validMessages),
    });

    const result = await response.json();
    return result.data as ExpoPushReceipt[];
  } catch (error) {
    console.error("❌ Failed to dispatch push notification batch:", error);
    throw error;
  }
}

// ============================================================================
// REAL-WORLD EXAMPLES FOR TALLYSPENDS BACKEND
// ============================================================================

/**
 * Example 1: Notify user when a new debit/credit transaction is processed
 */
export async function sendTransactionPushNotification(
  userPushToken: string,
  transaction: { id: string; amount: number; title: string; type: "income" | "expense" }
) {
  const isExpense = transaction.type === "expense";
  const formattedAmount = `₦${transaction.amount.toLocaleString()}`;

  const message: ExpoPushMessage = {
    to: userPushToken,
    title: isExpense ? "💸 Expense Recorded" : "💰 Money Received!",
    body: `${isExpense ? "Debit" : "Credit"} of ${formattedAmount} for "${transaction.title}". Tap to view breakdown.`,
    sound: "default",
    priority: "high",
    channelId: "default",
    badge: 1,
    data: {
      route: "/transaction-details",
      transactionId: transaction.id,
      amount: transaction.amount,
      type: transaction.type,
    },
  };

  return sendExpoPushNotifications([message]);
}

/**
 * Example 2: Warn user when they reach 90% of category budget
 */
export async function sendBudgetThresholdAlert(
  userPushToken: string,
  category: string,
  percentUsed: number
) {
  const message: ExpoPushMessage = {
    to: userPushToken,
    title: "⚠️ Budget Warning",
    body: `You have reached ${Math.round(percentUsed)}% of your ${category} budget for this month!`,
    sound: "default",
    priority: "high",
    channelId: "budget-alerts",
    data: {
      route: "/budgetspending",
      category,
    },
  };

  return sendExpoPushNotifications([message]);
}
