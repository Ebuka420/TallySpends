import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { registerForPushNotificationsAsync } from "../services/pushNotificationService";

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
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    try {
      // 1. Register device & obtain token
      registerForPushNotificationsAsync()
        .then((token) => {
          setExpoPushToken(token);
          setIsRegistered(!!token);
        })
        .catch(() => {});

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
