import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AppState, Platform } from "react-native";
import { registerForPushNotificationsAsync, syncPushTokenWithBackend } from "../services/pushNotificationService";
import { getProfileSnapshot, subscribeProfile } from "../profile/repository";

export interface UsePushNotificationsResult {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
}

/**
 * Custom hook to register, receive, and route Expo Push Notifications.
 * Integrates directly with Expo Router for deep linking.
 */
export function usePushNotifications(): UsePushNotificationsResult {
  const router = useRouter();
  const account = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileSnapshot);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    setIsRegistered(false);
    setExpoPushToken(null);
    const scope = account.scope;
    if (Platform.OS === "web" || !scope || !account.token) return;
    let active = true;
    let busy = false;
    let controller: AbortController | null = null;
    const sync = async () => {
      if (!active || busy || AppState.currentState !== "active") return;
      busy = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 20000);
      try {
        const token = await registerForPushNotificationsAsync();
        if (!active || controller.signal.aborted || getProfileSnapshot().scope !== scope) return;
        setExpoPushToken(token);
        const registered = token ? await syncPushTokenWithBackend(token, controller.signal, scope) : false;
        if (active) setIsRegistered(registered);
      } catch { if (active) setIsRegistered(false); }
      finally { clearTimeout(timeout); busy = false; }
    };
    void sync();
    const resume = AppState.addEventListener("change", state => { if (state === "active") void sync(); });
    // Native token rotation requires obtaining a fresh Expo token, not sending
    // the APNs/FCM token to an endpoint that expects an Expo token.
    const rotation = Notifications.addPushTokenListener(() => { void sync(); });
    return () => { active = false; controller?.abort(); resume.remove(); rotation.remove(); };
  }, [account.scope, account.token]);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    try {
      // 2. Foreground notification received listener
      notificationListener.current = Notifications.addNotificationReceivedListener((incoming) => {
        setNotification(incoming);
      });

      // 3. User tapped notification (background/foreground interaction)
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification?.request?.content?.data as Record<string, any> | undefined;

        if (data) {
          // Deep linking router destination
          if (data.route) {
            router.push(data.route as any);
          } else if (data.screen) {
            router.push(data.screen as any);
          } else if (data.transactionId || data.id) {
            router.push({
              pathname: "/transaction-details" as any,
              params: { id: data.transactionId || data.id },
            });
          } else if (data.url) {
            router.push(data.url as any);
          }
        }
      });
    } catch (listenerErr) {
      console.warn("⚠️ Push notification listener notice:", listenerErr);
    }

    // 4. Cleanup on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

  return {
    expoPushToken,
    notification,
    isRegistered,
  };
}
