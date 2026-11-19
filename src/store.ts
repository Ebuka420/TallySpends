import AsyncStorage from "@react-native-async-storage/async-storage";
import { beginSession, expireSession, saveSessionTokens, sessionHasExpired, subscribeSessionExpired } from "./session";
import { clearPendingSms, configureSmsReader } from "../modules/tally-sms-reader";
import { SMS_CONSENT_KEY, SMS_ENABLED_KEY, SMS_SENDERS_KEY } from "./transactions/smsSync";
import { registerSession } from "./register";
import { migrateOnboardingPin, readPin } from "./security/pin";
import { profileScope } from "./profile/model";
import { enrollFirstTimeUser } from "./coach/tutorials";
import { readPendingSignup, clearPendingSignup } from "./security/signup";
import { useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { clearProfileSession, getProfileSnapshot, loadAccountProfile, publishProfileTokens, subscribeProfile, updateAccountProfile } from "./profile/repository";
import type { ProfileUser } from "./profile/model";
import type { ProfileAddress } from "./profile/address";
import { Alert, AppState, useColorScheme } from "react-native";
import { getNotifications, subscribeNotifications, setNotificationOwner, loadNotifications, changeNotifications } from "./notifications/repository";
import { operationId, runBudgetCommand, runPlanCommand } from "./budget/repository";
import { deleteWalletTransaction, getWalletSnapshot, loadWallet, resetWallet, saveWalletTransaction, subscribeWallet, setWalletOwner } from "./budget/repository";
import { totals, type Wallet } from "./budget/ledger";
import { createBankRequest } from "./banking/backend";
import { clearTransactionFeed, getTransactionFeedSnapshot, refreshTransactionFeed, subscribeTransactionFeed } from "./transactions/feed";
import type { ThemeMode } from "./theme";
import { useAppearance, hydrateAppearance, setThemePreference, setDarkModePreference } from "./appearance";
import { useVisualTheme } from "./ThemeExperience";
import { getThemePalette } from "./theme";



const TAB_BAR_OPACITY_STORAGE_KEY = "ts_tab_bar_opacity";
let globalTabBarOpacity = 0.72;
const tabBarListeners = new Set<(opacity: number) => void>();
function publishTabBarOpacity(opacity: number) {
  globalTabBarOpacity = opacity;
  tabBarListeners.forEach(listener => listener(opacity));
}
const DEFAULT_CUSTOM_CATEGORIES_STORAGE_KEY = "ts_custom_categories";

const ACCESS_TOKEN_STORAGE_KEY = "ts_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "ts_refresh_token";
const USER_STORAGE_KEY = "ts_user";

const getCustomCategoriesStorageKey = (
  usernameValue: string | null | undefined,
) =>
  `${DEFAULT_CUSTOM_CATEGORIES_STORAGE_KEY}_${encodeURIComponent(usernameValue || "default")}`;

export interface NotificationItem {
  id: string;
  type: "transaction" | "alert" | "insight" | "bill" | "system";
  transactionDirection?: "incoming" | "outgoing";
  title: string;
  description: string;
  timestamp: string;
  isUnread: boolean;
  referenceId?: string;
  route?: string;
  amount?: number;
}



let globalIsAuthenticated = false;

type AuthListener = (status: boolean) => void;

let authListeners: AuthListener[] = [];

const setGlobalAuth = (status: boolean) => {
  globalIsAuthenticated = status;

  authListeners.forEach((listener) => listener(status));
};

subscribeSessionExpired(() => {
  clearProfileSession(true);
  clearTransactionFeed();
  setGlobalAuth(false);
});

setWalletOwner(getProfileSnapshot().scope);
setNotificationOwner(getProfileSnapshot().scope);
subscribeProfile(() => { setWalletOwner(getProfileSnapshot().scope); setNotificationOwner(getProfileSnapshot().scope); });

export function useAppStore() {
  const [savedBudgetWallet, setBudgetWallet] = useState<Wallet | null>(getWalletSnapshot);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const transactionFeed = useSyncExternalStore(subscribeTransactionFeed, getTransactionFeedSnapshot, getTransactionFeedSnapshot);
  const inbox = useSyncExternalStore(subscribeNotifications, getNotifications, getNotifications);
  const notifications = inbox.items, notificationsLoading = inbox.loading, notificationsError = inbox.error;
  const accountProfile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileSnapshot);
  const budgetWallet = savedBudgetWallet?.userId === accountProfile.scope ? savedBudgetWallet : null;
  const budgets = Object.fromEntries((budgetWallet?.budgets || []).map(b => [b.category, b.allocatedAmount / 100]));
  const savingsGoals = budgetWallet?.savings || [];
  const { fullName: profileFullName, phoneNumber: profilePhoneNumber, email: profileEmail,
    gender: profileGender, dob: profileDob, address: profileAddress,
    avatarUrl: profileImage } = accountProfile.profile;
  const profileTallyTag = accountProfile.profile.tallyTag ? `@${accountProfile.profile.tallyTag}` : "";
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);

  const { themePreference, darkModePreference } = useAppearance();
  const systemColorScheme = useColorScheme();

  const themeMode: ThemeMode =
    darkModePreference === "system"
      ? (systemColorScheme === "dark" ? "dark" : "light")
      : darkModePreference;

  const theme = useVisualTheme(getThemePalette(themePreference, themeMode));
  const transactions = transactionFeed.owner === accountProfile.scope ? transactionFeed.transactions : [];
  const trackedBudgetSpending = Object.fromEntries((budgetWallet?.budgets || []).map(b => [b.id, b.spentAmount]));

  const [tabBarOpacity, setTabBarOpacityState] = useState(globalTabBarOpacity);
  useEffect(() => {
    tabBarListeners.add(setTabBarOpacityState);
    return () => { tabBarListeners.delete(setTabBarOpacityState); };
  }, []);

  const username = accountProfile.profile.tallyTag || accountProfile.profile.fullName;

  const [customCategories, setCustomCategoriesState] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    setCustomCategoriesState([]);
    if (accountProfile.scope) void AsyncStorage.getItem(getCustomCategoriesStorageKey(accountProfile.scope)).then(raw => {
      if (!active) return;
      try { const parsed = raw ? JSON.parse(raw) : []; if (Array.isArray(parsed)) setCustomCategoriesState(parsed.filter(value => typeof value === "string")); } catch { /* Ignore corrupt preferences. */ }
    });
    return () => { active = false; };
  }, [accountProfile.scope]);

  const [savedCards, setSavedCards] = useState<any[]>([]);

  const [onboardingGoals, setOnboardingGoalsState] = useState<string[]>([]);
  const [employmentStatus, setEmploymentStatusState] = useState<string | null>(
    null,
  );

  const [isAuthenticated, setIsAuthenticated] = useState(globalIsAuthenticated);

  const navigation = useNavigation();

  useEffect(() => subscribeWallet((wallet) => {
    setBudgetWallet(wallet);
    setBudgetError(null);
  }), []);

  const reloadBudgetWallet = useCallback(async (force = true) => {
    const owner = getProfileSnapshot().scope;
    if (!owner) { setBudgetWallet(null); return; }
    try {
      const wallet = await loadWallet([], force);
      if (owner !== getProfileSnapshot().scope) return;
      setBudgetWallet(wallet);
      setBudgetError(null);
    } catch (error) {
      if (owner !== getProfileSnapshot().scope) return;
      setBudgetError(error instanceof Error ? error.message : 'Could not load your budgets.');
    }
  }, []);

  useEffect(() => { void reloadBudgetWallet(false); }, [accountProfile.scope, reloadBudgetWallet]);

  useEffect(() => {
    authListeners.push(setIsAuthenticated);

    return () => {
      authListeners = authListeners.filter(
        (listener) => listener !== setIsAuthenticated,
      );
    };
  }, []);

const loadStoredNotifications = useCallback(loadNotifications, []);

const loadData = useCallback(async () => {
    try {
      await reloadBudgetWallet(false);



      await hydrateAppearance();

      const storedTabBarOpacity = await AsyncStorage.getItem(
        TAB_BAR_OPACITY_STORAGE_KEY,
      );

      const storedAccessToken = await AsyncStorage.getItem(
        ACCESS_TOKEN_STORAGE_KEY,
      );
      const storedRefreshToken = await AsyncStorage.getItem(
        REFRESH_TOKEN_STORAGE_KEY,
      );
      const legacyUsers = await AsyncStorage.getItem("ts_registered_users");
      if (legacyUsers) {
        try {
          const users = JSON.parse(legacyUsers);
          if (Array.isArray(users) && users.some(user => user && typeof user === "object" && "password" in user))
            await AsyncStorage.setItem("ts_registered_users", JSON.stringify(users.map(entry => {
              if (!entry || typeof entry !== "object") return entry;
              const { password: _password, ...user } = entry; return user;
            })));
        } catch { /* A malformed legacy profile cache must not prevent session recovery. */ }
      }

      await loadAccountProfile();
      const profile = getProfileSnapshot();
      const storedCustomCategories = profile.scope
        ? await AsyncStorage.getItem(getCustomCategoriesStorageKey(profile.scope)) : null;
      const storedCards = profile.scope ? await AsyncStorage.getItem("ts_cards_v2_" + encodeURIComponent(profile.scope)) : null;
      if (storedTabBarOpacity !== null) {
        const parsedOpacity = Number(storedTabBarOpacity);

        if (!Number.isNaN(parsedOpacity)) {
          const clampedOpacity = Math.max(0, Math.min(1, parsedOpacity));

          publishTabBarOpacity(clampedOpacity);
        }
      }

      setAccessTokenState(profile.token ?? storedAccessToken ?? null);
      setRefreshTokenState(profile.refreshToken ?? storedRefreshToken ?? null);
      // A saved server session returns to the app lock, not the sign-up screen.
      if (!sessionHasExpired() && profile.scope && getProfileSnapshot().scope === profile.scope && (getProfileSnapshot().token || getProfileSnapshot().refreshToken)) setGlobalAuth(true);

      if (storedCustomCategories && profile.scope === getProfileSnapshot().scope) {
        try {
          const parsedCategories = JSON.parse(storedCustomCategories);

          if (Array.isArray(parsedCategories)) {
            setCustomCategoriesState(parsedCategories);
          }
        } catch (error) {
          console.warn("Failed to parse custom categories", error);
        }
      }

      setSavedCards(storedCards ? JSON.parse(storedCards) : []);

      await loadStoredNotifications();
    } catch (error) {
      console.error("Failed to load store data", error);
    } finally {
      setLoading(false);
    }
  }, [reloadBudgetWallet, loadStoredNotifications]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });

    void Promise.resolve().then(loadData);

    return unsubscribe;
  }, [navigation, loadData]);

  const login = useCallback(
    async (
      accessToken?: string,
      refreshToken?: string,
      user?: ProfileUser,
      options: { activate?: boolean } = {},
    ) => {
      if (user) { await beginSession(); clearProfileSession(); }
      else if (sessionHasExpired()) throw new Error("Your session has expired. Sign in again.");
      if (accessToken && refreshToken) {
        const current = await saveSessionTokens({ token: accessToken, refreshToken });
        accessToken = current.token; refreshToken = current.refreshToken;
      }
      if (accessToken) {
        setAccessTokenState(accessToken);
        if (!refreshToken) await AsyncStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
      }

      if (refreshToken) {
        setRefreshTokenState(refreshToken);
      } else if (user) {
        setRefreshTokenState(null);
        await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      }
      if (accessToken) publishProfileTokens(accessToken, refreshToken);

      if (user) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        void loadAccountProfile(true);
      }

      if (options.activate !== false) setGlobalAuth(true);
    },
    [],
  );

  const logout = useCallback(async () => {
    await expireSession();
    try { await configureSmsReader(false, false, []); await clearPendingSms(); } catch { /* Native SMS reader is Android-only and may not exist in Expo Go. */ }
    await AsyncStorage.multiRemove([SMS_CONSENT_KEY, SMS_ENABLED_KEY, SMS_SENDERS_KEY]);
    clearProfileSession(true);
    setAccessTokenState(null);
    setRefreshTokenState(null);

    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_STORAGE_KEY,
      REFRESH_TOKEN_STORAGE_KEY,
      USER_STORAGE_KEY,
    ]);

    setGlobalAuth(false);
  }, []);

  const reloadTransactions = useCallback(async (force = true, externalSignal?: AbortSignal) => {
    const owner = accountProfile.scope;
    const currentToken = accountProfile.token || accessToken;
    const currentRefreshToken = accountProfile.refreshToken || refreshToken;
    if (!isAuthenticated || !owner || (!currentToken && !currentRefreshToken)) throw new Error("Sign in again to refresh transaction history.");
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (externalSignal?.aborted) controller.abort();
    else externalSignal?.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const request = createBankRequest({ token: currentToken, refreshToken: currentRefreshToken,
        saveTokens: async (nextToken, nextRefreshToken) => { await login(nextToken, nextRefreshToken); } }, controller.signal);
      return await refreshTransactionFeed(owner, request, force);
    } finally {
      clearTimeout(timeout);
      externalSignal?.removeEventListener("abort", abort);
    }
  }, [accountProfile.scope, accountProfile.token, accountProfile.refreshToken, accessToken, refreshToken, isAuthenticated, login]);

  useEffect(() => {
    if (!isAuthenticated || !accountProfile.scope) {
      clearTransactionFeed();
      return;
    }
    const sync = () => { void reloadTransactions(false).catch(() => {}); };
    sync();
    const subscription = AppState.addEventListener("change", state => { if (state === "active") sync(); });
    return () => subscription.remove();
  }, [isAuthenticated, accountProfile.scope, reloadTransactions]);

  const setTabBarOpacity = useCallback(async (opacity: number) => {
    const nextOpacity = Math.max(0.45, Math.min(0.98, opacity));

    await AsyncStorage.setItem(
      TAB_BAR_OPACITY_STORAGE_KEY,
      String(nextOpacity),
    );
    publishTabBarOpacity(nextOpacity);
  }, []);

  const setUsername = useCallback(async (value: string) => { await updateAccountProfile({ tallyTag: value.replace(/^@+/, "").trim() }, undefined, accountProfile.scope); }, [accountProfile.scope]);
  const setProfileFullName = useCallback(async (value: string) => { await updateAccountProfile({ fullName: value }, undefined, accountProfile.scope); }, [accountProfile.scope]);
  const setProfilePhoneNumber = useCallback(async (value: string) => { await updateAccountProfile({ phoneNumber: value }, undefined, accountProfile.scope); }, [accountProfile.scope]);
  const setProfileEmail = useCallback(async (value: string) => { await updateAccountProfile({ email: value }, undefined, accountProfile.scope); }, [accountProfile.scope]);
  const setProfileGender = useCallback(async (value: string) => { await updateAccountProfile({ gender: value }, undefined, accountProfile.scope); }, [accountProfile.scope]);
  const setProfileDob = useCallback(async (value: string) => { await updateAccountProfile({ dob: value }, undefined, accountProfile.scope); }, [accountProfile.scope]);
  const setProfileAddress = useCallback(async (value: ProfileAddress) => { await updateAccountProfile({ address: value }, undefined, accountProfile.scope); }, [accountProfile.scope]);
  const setProfileTallyTag = useCallback(async (value: string) => { await updateAccountProfile({ tallyTag: value.replace(/^@+/, "").trim() }, undefined, accountProfile.scope); }, [accountProfile.scope]);
  const setProfileImage = useCallback(async (value: string | null, name = "profile.jpg", type = "image/jpeg") => {
    if (value) await updateAccountProfile({}, { uri: value, name, type }, accountProfile.scope);
    else await updateAccountProfile({ avatarUrl: null }, undefined, accountProfile.scope);
  }, [accountProfile.scope]);
  const addCustomCategory = useCallback(
    async (categoryName: string) => {
      const trimmed = categoryName?.trim();

      if (!trimmed || !accountProfile.scope) return;

      const storageKey = getCustomCategoriesStorageKey(accountProfile.scope || "signed-out");

      setCustomCategoriesState((prev) => {
        const next = prev.includes(trimmed) ? prev : [...prev, trimmed];

        AsyncStorage.setItem(storageKey, JSON.stringify(next));

        return next;
      });
    },
    [accountProfile.scope],
  );

  const deleteCustomCategory = useCallback(
    async (categoryName: string) => {
      const trimmed = categoryName?.trim();

      if (!trimmed || !accountProfile.scope) return;

      const storageKey = getCustomCategoriesStorageKey(accountProfile.scope || "signed-out");

      setCustomCategoriesState((prev) => {
        const next = prev.filter((item) => item !== trimmed);

        AsyncStorage.setItem(storageKey, JSON.stringify(next));

        return next;
      });
    },
    [accountProfile.scope],
  );

  // ---------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------

  const addNotification = useCallback((item: Omit<NotificationItem, "id" | "timestamp" | "isUnread"> & Partial<Pick<NotificationItem, "id" | "timestamp" | "isUnread">>) => {
    const notification: NotificationItem = { ...item, id: item.id || 'event-' + Date.now(), timestamp: item.timestamp || new Date().toISOString(), isUnread: item.isUnread ?? true };
    void changeNotifications(items => [notification, ...items.filter(n => n.id !== notification.id)]);
  }, []);
  const markNotificationAsRead = useCallback((id: string) => changeNotifications(items => items.map(n => n.id === id ? { ...n, isUnread: false } : n)), []);
  const markAllNotificationsAsRead = useCallback(() => changeNotifications(items => items.map(n => ({ ...n, isUnread: false }))), []);
  const deleteNotification = useCallback((id: string) => changeNotifications(items => items.filter(n => n.id !== id)), []);
  const clearAllNotifications = useCallback(() => changeNotifications(() => []), []);
  const clearReadNotifications = useCallback(() => changeNotifications(items => items.filter(n => n.isUnread)), []);

  // ---------------------------------------------------------
  // TRANSACTIONS
  // ---------------------------------------------------------

  const addTransaction = useCallback(async (tx: any) => {
    try {
      const record = await saveWalletTransaction(tx);
      await reloadTransactions(true);
      addNotification({ type: 'transaction', title: 'Transaction recorded', description: 'Your manual entry was saved. No wallet money was moved.', referenceId: record.id, route: '/transaction-details?id=' + record.id });
      return true;
    } catch (error) { Alert.alert('Transaction not confirmed', error instanceof Error ? error.message : 'Refresh history before trying again.'); return false; }
  }, [reloadTransactions, addNotification]);
  const deleteTransaction = useCallback(async (id: string) => { await deleteWalletTransaction(id); await reloadTransactions(true); }, [reloadTransactions]);
  const updateTransaction = useCallback(async (_tx: any) => { throw new Error('Editing transactions is not supported yet.'); }, []);
  const updateBudget = useCallback(async (category: string, limit: number) => runBudgetCommand({ type: 'allocate', allocations: [{ name: category, category, amount: Math.round(limit * 100), startDate: new Date().toISOString().slice(0, 10) }] }, operationId()), []);
  const deleteBudget = useCallback(async (_category: string) => { throw new Error('Deleting budgets is not supported yet.'); }, []);
  const addSavingsGoal = useCallback(async (goal: any) => runPlanCommand({ type: 'create-savings', name: goal.title, kind: 'personal', target: Math.round(goal.target * 100), initial: 0, unlockDate: '', owner: '', tags: [] }, operationId()), []);
  const deleteSavingsGoal = useCallback(async (id: string) => runPlanCommand({ type: 'archive-savings', id }, operationId()), []);
  const updateSavingsGoal = useCallback(async (_id: string, _saved: number, _target: number) => { throw new Error('Use Record contribution on the savings goal.'); }, []);
  const resetData = useCallback(async () => { await resetWallet([]); await reloadTransactions(true); }, [reloadTransactions]);

  return {
    availableBalance: budgetWallet ? totals(budgetWallet).available / 100 : 0,
    budgetWallet,
    budgetError,
    reloadBudgetWallet,
    transactions,
    transactionFeedState: transactionFeed.owner === accountProfile.scope ? transactionFeed.state : "idle" as const,
    transactionFeedError: transactionFeed.owner === accountProfile.scope ? transactionFeed.error : null,
    excludedSandboxTransactionCount: transactionFeed.owner === accountProfile.scope ? transactionFeed.excludedSandboxCount : 0,
    refreshTransactions: reloadTransactions,
    trackedBudgetSpending,
    budgets,
    savingsGoals,

    profileImage,
    profileLoading: accountProfile.loading,
    profileSaving: accountProfile.saving,
    profileError: accountProfile.error,
    refreshProfile: () => loadAccountProfile(true),
    setProfileImage,

    loading,
    isAuthenticated,
    token: accountProfile.token || accessToken,
    refreshToken: accountProfile.refreshToken || refreshToken,
    purchaseUserId: accountProfile.scope?.startsWith("id:") ? accountProfile.scope.slice(3) : null,

    themePreference,
    darkModePreference,
    themeMode,
    theme,

    tabBarOpacity,

    setThemePreference,
    setDarkModePreference,
    setTabBarOpacity,

    login,
    logout,

    addTransaction,
    deleteTransaction,
    updateTransaction,

    updateBudget,
    deleteBudget,

    addSavingsGoal,
    deleteSavingsGoal,
    updateSavingsGoal,

    username,
    setUsername,

    profileFullName,
    setProfileFullName,
    profilePhoneNumber,
    setProfilePhoneNumber,
    profileEmail,
    setProfileEmail,
    // Inert compatibility for the inactive appp snapshot. No nickname state or
    // persistence remains, and the active Profile screen has no nickname field.
    profileNickname: "",
    setProfileNickname: async (_value: string) => { throw new Error("Nickname has been removed. No change has been saved."); },
    profileGender,
    setProfileGender,
    profileDob,
    setProfileDob,
    profileAddress,
    profileAddressDetails: accountProfile.profile.addressDetails,
    setProfileAddress,
    profileTallyTag,
    setProfileTallyTag,

    customCategories,
    addCustomCategory,
    deleteCustomCategory,

    savedCards,
    setSavedCards,

    // Onboarding
    onboardingGoals,
    setOnboardingGoals: async (goals: string[]) => {
      await AsyncStorage.setItem("ts_onboarding_goals", JSON.stringify(goals));
      setOnboardingGoalsState(goals);
    },
    employmentStatus,
    setEmploymentStatus: async (status: string) => {
      await AsyncStorage.setItem("ts_employment_status", status);
      setEmploymentStatusState(status);
    },
    completeOnboarding: async () => {
      try {
        const pendingSignup = await readPendingSignup();
        if (!pendingSignup && !getProfileSnapshot().token) throw new Error("Restart account setup or sign in to continue.");

        if (pendingSignup) {

          const email = pendingSignup.email.trim().toLowerCase();
          const tallyTag = pendingSignup.tallyTag
            .trim()
            .replace(/^@+/, "")
            .toLowerCase();
          const canonicalTallyTag = `@${tallyTag}`;

          const fullName = pendingSignup.fullName.trim();
          const phoneNumber = pendingSignup.phoneNumber.trim();
          const stagedPin = await readPin("email:" + email);
          const current = getProfileSnapshot();
          const resumedPin = !stagedPin && current.scope && current.profile.email.trim().toLowerCase() === email
            ? await readPin(current.scope) : null;
          if (!stagedPin && !resumedPin) throw new Error("Set your six-digit PIN before finishing setup.");

          const session = await registerSession({
            fullName, email, tallyTag, phoneNumber, password: pendingSignup.password,
          });
          const pinOwner = profileScope({ userId: session.userId, email });
          if (!pinOwner) throw new Error("Couldn't identify the new account.");
          // Only accounts completing signup now are eligible for the new-user
          // coach tutorials. Returning accounts are deliberately not enrolled.
          await enrollFirstTimeUser(pinOwner).catch(() => {});
          await migrateOnboardingPin(email, pinOwner);
          await login(session.accessToken, session.refreshToken, {
            userId: session.userId, fullName, email, tallyTag, phoneNumber,
          }, { activate: false });

          const storedUsersRaw = await AsyncStorage.getItem(
            "ts_registered_users",
          );
          const storedUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

          if (Array.isArray(storedUsers)) {
            const alreadyExists = storedUsers.some(
              (user: any) =>
                (user.email && user.email.toLowerCase() === email) ||
                (user.tallyTag && user.tallyTag.toLowerCase() === tallyTag),
            );

            if (!alreadyExists) {
              storedUsers.push({
                fullName,
                tallyTag,
                email,
                phoneNumber,
              });

              await AsyncStorage.setItem(
                "ts_registered_users",
                JSON.stringify(storedUsers),
              );
            }
          }

          await clearPendingSignup();


        }

        await AsyncStorage.setItem("ts_onboarding_completed", "true");
        setGlobalAuth(true);
      } catch (error) {
        console.error("Failed to complete onboarding", error);
        throw error;
      }
    },

    // Notifications
    notifications,
    notificationsLoading,
    notificationsError,
    retryNotifications: loadStoredNotifications,
    unreadNotificationCount: notifications.filter((n) => n.isUnread).length,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    clearReadNotifications,

    resetData,
  };
}
