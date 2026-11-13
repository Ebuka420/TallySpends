import { Platform } from "react-native";
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesEntitlementInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import { subscriptionStatus } from "./model";

export type SubscriptionStatus = "unavailable" | "loading" | "inactive" | "active" | "verification-failed";
export type SubscriptionSnapshot = {
  configured: boolean;
  status: SubscriptionStatus;
  entitlement: PurchasesEntitlementInfo | null;
  offering: PurchasesOffering | null;
  error: string | null;
  busy: boolean;
};

const entitlementId = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || "";
const initial: SubscriptionSnapshot = { configured: false, status: "unavailable", entitlement: null, offering: null, error: null, busy: false };
let snapshot = initial;
const listeners = new Set<() => void>();
let configuredUserId: string | null = null;
let customerInfoListenerAdded = false;
let operation: Promise<void> | null = null;

export const getSubscriptionSnapshot = () => snapshot;
export function subscribeSubscription(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function publish(next: SubscriptionSnapshot) {
  snapshot = next;
  listeners.forEach(listener => listener());
}

function apiKey() {
  if (Platform.OS === "ios") return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() || "";
  if (Platform.OS === "android") return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() || "";
  return "";
}

function updateFromCustomerInfo(info: CustomerInfo) {
  const item = entitlementId ? info.entitlements.all[entitlementId] ?? null : null;
  const status = subscriptionStatus(item);
  if (status === "verification-failed") {
    publish({ ...snapshot, status: "verification-failed", entitlement: null, error: "Your purchase could not be verified. Please try again or restore purchases." });
    return;
  }
  publish({ ...snapshot, status, entitlement: item, error: null });
}

function configureListener() {
  if (customerInfoListenerAdded) return;
  Purchases.addCustomerInfoUpdateListener(updateFromCustomerInfo);
  customerInfoListenerAdded = true;
}

export async function initializeSubscription(userId: string | null) {
  if (operation) await operation.catch(() => {});
  if (!userId || !entitlementId || !apiKey() || !["ios", "android"].includes(Platform.OS)) {
    if (await Purchases.isConfigured()) {
      try { await Purchases.logOut(); } catch { /* The next account starts with no local entitlement until refreshed. */ }
    }
    configuredUserId = null;
    publish({ ...initial, status: "unavailable", error: !userId ? "A stable signed-in account ID is required for purchases." : "Store purchases are not configured for this build." });
    return;
  }
  if (configuredUserId === userId && await Purchases.isConfigured()) {
    await refreshSubscription();
    return;
  }

  // Clear the old customer's entitlement before switching RevenueCat identities.
  publish({ ...initial, configured: await Purchases.isConfigured(), status: "loading" });
  operation = (async () => {
    const configured = await Purchases.isConfigured();
    if (!configured) {
      Purchases.configure({
        apiKey: apiKey(),
        appUserID: userId,
        entitlementVerificationMode: Purchases.ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL,
      });
      configuredUserId = userId;
    } else if (configuredUserId !== userId || await Purchases.getAppUserID() !== userId) {
      const result = await Purchases.logIn(userId);
      configuredUserId = userId;
      updateFromCustomerInfo(result.customerInfo);
    }
    publish({ ...snapshot, configured: true });
    configureListener();
    await refreshSubscription();
  })().catch(() => {
    publish({ ...snapshot, status: "unavailable", error: "Couldn't connect to the purchase service. Check your connection and try again." });
  }).finally(() => { operation = null; });
  await operation;
}

export async function refreshSubscription() {
  if (!(await Purchases.isConfigured())) return;
  publish({ ...snapshot, status: snapshot.status === "active" ? "active" : "loading", error: null });
  try {
    const [info, offerings] = await Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()]);
    updateFromCustomerInfo(info);
    publish({ ...snapshot, offering: offerings.current, error: null });
    if (!offerings.current?.availablePackages.length && snapshot.status !== "active") {
      publish({ ...snapshot, error: "No MVP purchase options are configured yet." });
    }
  } catch {
    publish({ ...snapshot, status: snapshot.entitlement?.isActive ? "active" : "unavailable", error: "Couldn't refresh your purchase status. Please try again." });
  }
}

export async function purchaseSubscription(aPackage: PurchasesPackage) {
  if (!(await Purchases.isConfigured())) throw new Error("Store purchases are not configured for this build.");
  publish({ ...snapshot, busy: true, error: null });
  try {
    const result = await Purchases.purchasePackage(aPackage);
    updateFromCustomerInfo(result.customerInfo);
    if (getSubscriptionSnapshot().status !== "active") {
      throw new Error("The store has not confirmed an active MVP subscription yet. Your account will update when payment is confirmed.");
    }
    return result.customerInfo;
  } catch (error) {
    const purchaseError = error as { code?: string; userCancelled?: boolean };
    if (purchaseError.userCancelled || purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return null;
    const message = error instanceof Error ? error.message : "Purchase could not be completed. Please try again.";
    publish({ ...snapshot, error: message });
    throw new Error(message);
  } finally {
    publish({ ...snapshot, busy: false });
  }
}

export async function restoreSubscriptions() {
  if (!(await Purchases.isConfigured())) throw new Error("Store purchases are not configured for this build.");
  publish({ ...snapshot, busy: true, error: null });
  try {
    const info = await Purchases.restorePurchases();
    updateFromCustomerInfo(info);
    return getSubscriptionSnapshot().status === "active";
  } catch {
    publish({ ...snapshot, error: "Couldn't restore purchases. Check your connection and try again." });
    throw new Error("Couldn't restore purchases. Check your connection and try again.");
  } finally {
    publish({ ...snapshot, busy: false });
  }
}

export async function manageSubscription() {
  if (!(await Purchases.isConfigured())) throw new Error("Store purchases are not configured for this build.");
  await Purchases.showManageSubscriptions();
}

export async function signOutPurchases() {
  if (operation) await operation.catch(() => {});
  if (await Purchases.isConfigured()) {
    try { await Purchases.logOut(); } catch { /* Store identity is reset on the next authenticated login. */ }
  }
  configuredUserId = null;
  publish(initial);
}
