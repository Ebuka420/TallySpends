import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// ============================================================================
// 1. GLOBAL FOREGROUND NOTIFICATION HANDLER
// ============================================================================
// Configures how incoming notifications are presented while the app is active
if (Platform.OS !== "web") {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      }),
    });
  } catch (err) {
    console.warn("⚠️ Could not initialize NotificationHandler:", err);
  }
}

export const STORAGE_KEY_PUSH_TOKEN = "ts_expo_push_token";

export interface PushNotificationPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

// ============================================================================
// 2. PERMISSION REQUEST & TOKEN REGISTRATION
// ============================================================================
/**
 * Registers the device for Expo Push Notifications.
 * Handles Android Notification Channels, permission checks, and token retrieval.
 *
 * @returns {Promise<string | null>} The ExpoPushToken string or null if unpermitted/simulator.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") {
    return null;
  }

  let token: string | null = null;

  // 1. Android Specific Channel Configuration (Required for Android 8.0+)
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "TallySpends Transactions & Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#8B5CF6", // TallySpends Purple
        enableLights: true,
        enableVibrate: true,
        sound: "default",
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync("budget-alerts", {
        name: "Budget & Savings Warnings",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: "#EF4444",
        sound: "default",
        showBadge: true,
      });
    } catch (channelErr) {
      console.warn("⚠️ Could not configure Android notification channels:", channelErr);
    }
  }

  // 2. Physical Device Validation
  if (!Device.isDevice) {
    console.info("ℹ️ Push notifications: Running on simulator/emulator (Token registration skipped).");
    return null;
  }

  // 3. Permission Negotiation
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.info("ℹ️ Push notifications: Permission was not granted by user.");
      return null;
    }

    // 4. Retrieve EAS Project ID & Push Token safely
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.projectId;

    try {
      const tokenResponse = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      token = tokenResponse.data;
    } catch (tokenErr: any) {
      console.warn(
        "⚠️ Notice: Expo Push Token retrieval skipped or EAS project not configured yet:",
        tokenErr?.message || tokenErr
      );
    }

    if (token) {
      console.log("✅ Expo Push Token Generated:", token);
      await AsyncStorage.setItem(STORAGE_KEY_PUSH_TOKEN, token);
      
      // Sync with your Railway / Backend database
      await syncPushTokenWithBackend(token);
    }
  } catch (error: any) {
    console.warn("⚠️ Push notification registration notice:", error?.message || error);
  }

  return token;
}

// ============================================================================
// 3. SYNC TOKEN WITH BACKEND DATABASE
// ============================================================================
/**
 * Persists the user's push token to your backend database (e.g. Railway / Supabase / PostgreSQL).
 */
export async function syncPushTokenWithBackend(pushToken: string): Promise<boolean> {
  try {
    const authToken = await AsyncStorage.getItem("ts_access_token");
    if (!authToken) {
      // User not logged in yet; token will be synced upon login
      return false;
    }

    const response = await fetch("https://tallyspendapi-production.up.railway.app/api/users/push-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        pushToken,
        platform: Platform.OS,
        deviceName: Device.modelName ?? "Unknown Device",
      }),
    });

    if (response.ok) {
      console.log("✅ Push token registered with backend successfully.");
      return true;
    } else {
      console.warn("⚠️ Backend responded with status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Error syncing push token with backend:", error);
    return false;
  }
}

// ============================================================================
// 4. LOCAL OFFLINE SCHEDULED NOTIFICATIONS (NO BACKEND REQUIRED)
// ============================================================================

/**
 * Schedules a daily recurring notification at a specific time (e.g. 8:00 PM)
 * to remind the user to log daily receipts and expenses.
 *
 * @param {number} [hour=20] - Hour in 24h format (20 = 8:00 PM)
 * @param {number} [minute=0] - Minute (0 = 8:00 PM)
 */
export async function scheduleDailyExpenseReminder(hour = 20, minute = 0): Promise<string> {
  // Cancel any existing daily reminder first
  await cancelScheduledNotificationById("daily-expense-reminder");

  const identifier = await Notifications.scheduleNotificationAsync({
    identifier: "daily-expense-reminder",
    content: {
      title: "📝 Daily Expense Check-In",
      body: "Did you spend anything today? Log your receipts now to keep your budgets on track!",
      sound: "default",
      badge: 1,
      data: {
        route: "/(tabs)/expenses",
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  console.log(`⏰ Daily expense reminder scheduled for ${hour}:${minute.toString().padStart(2, "0")}`);
  return identifier;
}

/**
 * Fires a local notification after a few seconds delay (ideal for testing alert banners offline).
 */
export async function scheduleInstantLocalNotification({
  title = "🔔 Test Notification",
  body = "This is a local offline notification from TallySpends.",
  data = {},
  delaySeconds = 2,
}: {
  title?: string;
  body?: string;
  data?: Record<string, any>;
  delaySeconds?: number;
}): Promise<string | null> {
  if (Platform.OS === "web") {
    return null;
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      if (req.status !== "granted") {
        console.warn("⚠️ Notification permissions denied.");
        return null;
      }
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
        badge: 1,
        data,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, delaySeconds),
        repeats: false,
      },
    });

    console.log("✅ Local notification scheduled:", identifier);
    return identifier;
  } catch (error) {
    console.error("❌ Failed to schedule local notification:", error);
    return null;
  }
}

/**
 * Cancels a specific scheduled notification by identifier.
 */
export async function cancelScheduledNotificationById(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Ignore if not found
  }
}

/**
 * Cancels all scheduled local notifications.
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
