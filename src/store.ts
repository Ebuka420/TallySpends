import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerSession } from "./register";
import { migrateOnboardingPin, readPin } from "./security/pin";
import { profileScope } from "./profile/model";
import { readPendingSignup, clearPendingSignup } from "./security/signup";
import { useNavigation } from "expo-router";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { clearProfileSession, getProfileSnapshot, loadAccountProfile, publishProfileTokens, subscribeProfile, updateAccountProfile } from "./profile/repository";
import type { ProfileUser } from "./profile/model";
import { Alert, useColorScheme } from "react-native";
import { deleteWalletTransaction, getWalletSnapshot, loadWallet, resetWallet, saveWalletTransaction, subscribeWallet } from "./budget/repository";
import { totals, type Wallet } from "./budget/ledger";
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

export const MOCK_RECIPIENTS = [
  {
    id: "rec-1",
    name: "Alief Wahya",
    username: "alief_w",
    initial: "AW",
    color: "#EEF2FF",
    textColor: "#4F46E5",
    bank: "Citibank - USD Account",
    isRecent: true,
  },
  {
    id: "rec-2",
    name: "Bayside Budget",
    username: "bayside_b",
    initial: "BB",
    color: "#FDF2F8",
    textColor: "#DB2777",
    bank: "Premium Ch - GBP Account",
    isRecent: true,
  },
  {
    id: "rec-3",
    name: "Cypress Carter",
    username: "cypress_c",
    initial: "CC",
    color: "#ECFDF5",
    textColor: "#059669",
    bank: "Basic Ch - EUR Account",
    isRecent: true,
  },
  {
    id: "rec-4",
    name: "Dahlia Dawn",
    username: "dahlia_d",
    initial: "DD",
    color: "#FFF9C4",
    textColor: "#F57F17",
    bank: "Deluxe Ch - AUD Account",
    isRecent: true,
  },
  {
    id: "rec-5",
    name: "Maya Sari",
    username: "maya_s",
    initial: "MS",
    color: "#F3E5F5",
    textColor: "#7B1FA2",
    bank: "Bank Mandiri - IDR Account",
    isRecent: false,
  },
  {
    id: "rec-6",
    name: "Ravi Kumar",
    username: "ravi_k",
    initial: "RK",
    color: "#E1F5FE",
    textColor: "#0288D1",
    bank: "HDFC Bank - INR Account",
    isRecent: false,
  },
  {
    id: "rec-7",
    name: "Sarah Jenkins",
    username: "sarah_j",
    initial: "SJ",
    color: "#E8F8F5",
    textColor: "#2ECC71",
    bank: "Citibank - USD Account",
    isRecent: false,
  },
];

export const DEFAULT_TRANSACTIONS = [
  {
    id: "tx-1",
    title: "Salary (Tally Corp)",
    amount: 3000.0,
    category: "Income",
    type: "income",
    date: "2024-05-01",
  },
  {
    id: "tx-2",
    title: "Freelance Design",
    amount: 450.0,
    category: "Income",
    type: "income",
    date: "2024-05-15",
  },
  {
    id: "tx-3",
    title: "Rent & Electricity",
    amount: 323.75,
    category: "Bills & Utilities",
    type: "expense",
    date: "2024-05-02",
  },
  {
    id: "tx-4",
    title: "Organic Groceries",
    amount: 404.32,
    category: "Food & Dining",
    type: "expense",
    date: "2024-05-04",
  },
  {
    id: "tx-5",
    title: "Sake Bar Dinner",
    amount: 200.0,
    category: "Food & Dining",
    type: "expense",
    date: "2024-05-12",
  },
  {
    id: "tx-6",
    title: "Metro Transit Pass",
    amount: 150.0,
    category: "Transport",
    type: "expense",
    date: "2024-05-05",
  },
  {
    id: "tx-7",
    title: "Uber Trips Weekend",
    amount: 281.66,
    category: "Transport",
    type: "expense",
    date: "2024-05-18",
  },
  {
    id: "tx-8",
    title: "Virtual Reality Headset",
    amount: 300.0,
    category: "Shopping",
    type: "expense",
    date: "2024-05-09",
  },
  {
    id: "tx-9",
    title: "Target Clothing Store",
    amount: 88.49,
    category: "Shopping",
    type: "expense",
    date: "2024-05-24",
  },
  {
    id: "tx-10",
    title: "Cinema Tickets",
    amount: 60.0,
    category: "Entertainment",
    type: "expense",
    date: "2024-05-14",
  },
  {
    id: "tx-11",
    title: "Concert Live Show",
    amount: 155.83,
    category: "Entertainment",
    type: "expense",
    date: "2024-05-28",
  },
  {
    id: "tx-12",
    title: "Cloud Hosting Sub",
    amount: 50.0,
    category: "Others",
    type: "expense",
    date: "2024-05-10",
  },
  {
    id: "tx-13",
    title: "Pharmacy Checkup",
    amount: 144.25,
    category: "Others",
    type: "expense",
    date: "2024-05-20",
  },
  {
    id: "tx-14",
    title: "Whole Foods Market",
    amount: 154.2,
    category: "Food & Dining",
    type: "expense",
    date: "2024-05-06",
  },
  {
    id: "tx-15",
    title: "Gas Station Fuel",
    amount: 45.0,
    category: "Transport",
    type: "expense",
    date: "2024-05-08",
  },
  {
    id: "tx-16",
    title: "Amazon Gadgets",
    amount: 120.5,
    category: "Shopping",
    type: "expense",
    date: "2024-05-11",
  },
  {
    id: "tx-17",
    title: "Electricity & Gas Bill",
    amount: 110.0,
    category: "Bills & Utilities",
    type: "expense",
    date: "2024-05-13",
  },
  {
    id: "tx-18",
    title: "Netflix Subscription",
    amount: 15.49,
    category: "Bills & Utilities",
    type: "expense",
    date: "2024-05-15",
  },
  {
    id: "tx-19",
    title: "Spotify Premium",
    amount: 10.99,
    category: "Bills & Utilities",
    type: "expense",
    date: "2024-05-15",
  },
  {
    id: "tx-20",
    title: "Local Bakery Bread",
    amount: 12.3,
    category: "Food & Dining",
    type: "expense",
    date: "2024-05-17",
  },
  {
    id: "tx-21",
    title: "Dinner with Parents",
    amount: 185.0,
    category: "Food & Dining",
    type: "expense",
    date: "2024-05-19",
  },
  {
    id: "tx-22",
    title: "Zara Summer Collection",
    amount: 210.0,
    category: "Shopping",
    type: "expense",
    date: "2024-05-21",
  },
  {
    id: "tx-23",
    title: "Pharmacy Meds",
    amount: 35.6,
    category: "Others",
    type: "expense",
    date: "2024-05-22",
  },
  {
    id: "tx-24",
    title: "Gym Membership",
    amount: 80.0,
    category: "Others",
    type: "expense",
    date: "2024-05-01",
  },
  {
    id: "tx-25",
    title: "Uber Eats Friday",
    amount: 48.9,
    category: "Food & Dining",
    type: "expense",
    date: "2024-05-23",
  },
  {
    id: "tx-26",
    title: "Train Ticket Citytrip",
    amount: 35.0,
    category: "Transport",
    type: "expense",
    date: "2024-05-25",
  },
  {
    id: "tx-27",
    title: "Cinema Popcorn Combo",
    amount: 22.0,
    category: "Entertainment",
    type: "expense",
    date: "2024-05-27",
  },
  {
    id: "tx-28",
    title: "Bowling Night Friends",
    amount: 85.0,
    category: "Entertainment",
    type: "expense",
    date: "2024-05-29",
  },
  {
    id: "tx-29",
    title: "Birthday Present Dad",
    amount: 100.0,
    category: "Shopping",
    type: "expense",
    date: "2024-05-30",
  },
  {
    id: "tx-30",
    title: "Dentist Checkup",
    amount: 120.0,
    category: "Others",
    type: "expense",
    date: "2024-05-31",
  },
  {
    id: "tx-31",
    title: "Cash deposit ATM",
    amount: 200.0,
    category: "Income",
    type: "income",
    date: "2024-05-20",
  },
];

export const DEFAULT_BUDGETS = {
  "Food & Dining": 800,
  Transport: 700,
  Shopping: 300,
  "Bills & Utilities": 500,
  Entertainment: 300,
  Others: 250,
};

export const DEFAULT_SAVINGS_GOALS = [
  {
    id: "goal-1",
    title: "Tim's Birthday",
    saved: 120,
    target: 300,
    percentage: 40,
    category: "gift",
  },
  {
    id: "goal-2",
    title: "December Party",
    saved: 450,
    target: 800,
    percentage: 56,
    category: "party",
  },
  {
    id: "goal-3",
    title: "New Laptop",
    saved: 1250,
    target: 3000,
    percentage: 42,
    category: "health",
  },
  {
    id: "goal-4",
    title: "Vacation Escape",
    saved: 620,
    target: 1500,
    percentage: 41,
    category: "other",
  },
  {
    id: "goal-5",
    title: "Home Upgrade",
    saved: 180,
    target: 500,
    percentage: 36,
    category: "gift",
  },
  {
    id: "goal-6",
    title: "Emergency Fund",
    saved: 950,
    target: 2000,
    percentage: 48,
    category: "health",
  },
];

export interface NotificationItem {
  id: string;
  type: "transaction" | "alert" | "insight" | "bill" | "system";
  title: string;
  description: string;
  timestamp: string;
  isUnread: boolean;
  referenceId?: string;
  route?: string;
  amount?: number;
}

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "alert",
    title: "Budget Warning!",
    description:
      "You have used 85% of your 'Food & Dining' budget for this month. Only ₦90.00 remaining.",
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    isUnread: true,
    route: "/budgetspending",
  },
  {
    id: "notif-2",
    type: "insight",
    title: "Weekly Smart Insight",
    description:
      "Nice job! You spent 12% less on shopping this week compared to your baseline.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isUnread: true,
    route: "/insightssum",
  },
  {
    id: "notif-3",
    type: "bill",
    title: "Upcoming Subscription",
    description:
      "Your Adobe Creative Cloud subscription (₦54.99) is scheduled for automatic renewal.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isUnread: false,
  },
  {
    id: "notif-4",
    type: "system",
    title: "Security Update",
    description:
      "Your budgeting account credentials were confirmed and secured.",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    isUnread: false,
  },
];

let globalIsAuthenticated = false;

type AuthListener = (status: boolean) => void;

let authListeners: AuthListener[] = [];

const setGlobalAuth = (status: boolean) => {
  globalIsAuthenticated = status;

  authListeners.forEach((listener) => listener(status));
};

export function useAppStore() {
  const [budgetWallet, setBudgetWallet] = useState<Wallet | null>(getWalletSnapshot);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const accountProfile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileSnapshot);
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

  const [savedCards, setSavedCards] = useState<any[]>([
    {
      id: "card-1",
      brand: "Visa",
      last4: "5682",
      holder: "EBUKA",
    },
    {
      id: "card-2",
      brand: "Mastercard",
      last4: "1123",
      holder: "EBUKA",
    },
  ]);

  const [onboardingGoals, setOnboardingGoalsState] = useState<string[]>([]);
  const [employmentStatus, setEmploymentStatusState] = useState<string | null>(
    null,
  );

  const [isAuthenticated, setIsAuthenticated] = useState(globalIsAuthenticated);

  const navigation = useNavigation();

  useEffect(() => subscribeWallet((wallet) => {
    setBudgetWallet(wallet);
    setTransactions(wallet.transactions);
    setBudgetError(null);
  }), []);

  const reloadBudgetWallet = useCallback(async () => {
    try {
      const wallet = await loadWallet(DEFAULT_TRANSACTIONS);
      setBudgetWallet(wallet);
      setTransactions(wallet.transactions);
      setBudgetError(null);
    } catch (error) {
      setBudgetError(error instanceof Error ? error.message : 'Could not load your budgets.');
    }
  }, []);

  useEffect(() => {
    authListeners.push(setIsAuthenticated);

    return () => {
      authListeners = authListeners.filter(
        (listener) => listener !== setIsAuthenticated,
      );
    };
  }, []);

const loadData = useCallback(async () => {
    try {
      await reloadBudgetWallet();

      const storedBudgets = await AsyncStorage.getItem("ts_bgts");

      const storedGoals = await AsyncStorage.getItem("ts_goals");

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
      const storedCards = await AsyncStorage.getItem("ts_cards");
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
      if (storedAccessToken && profile.scope && getProfileSnapshot().scope === profile.scope && getProfileSnapshot().token) setGlobalAuth(true);

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

      if (storedCards !== null) {
        try {
          const parsedCards = JSON.parse(storedCards);

          if (Array.isArray(parsedCards)) {
            setSavedCards(parsedCards);
          }
        } catch (error) {
          console.warn("Failed to parse stored cards", error);
        }
      } else {
        const defaultCards = [
          {
            id: "card-1",
            brand: "Visa",
            last4: "5682",
            holder: "EBUKA",
          },
          {
            id: "card-2",
            brand: "Mastercard",
            last4: "1123",
            holder: "EBUKA",
          },
        ];

        await AsyncStorage.setItem("ts_cards", JSON.stringify(defaultCards));

        setSavedCards(defaultCards);
      }

      if (storedBudgets !== null) {
        setBudgets(JSON.parse(storedBudgets));
      } else {
        await AsyncStorage.setItem("ts_bgts", JSON.stringify(DEFAULT_BUDGETS));

        setBudgets(DEFAULT_BUDGETS);
      }

      if (storedGoals !== null) {
        setSavingsGoals(JSON.parse(storedGoals));
      } else {
        await AsyncStorage.setItem(
          "ts_goals",
          JSON.stringify(DEFAULT_SAVINGS_GOALS),
        );

        setSavingsGoals(DEFAULT_SAVINGS_GOALS);
      }

      const storedNotifs = await AsyncStorage.getItem("ts_notifications");
      if (storedNotifs !== null) {
        setNotifications(JSON.parse(storedNotifs));
      } else {
        await AsyncStorage.setItem(
          "ts_notifications",
          JSON.stringify(DEFAULT_NOTIFICATIONS),
        );
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
    } catch (error) {
      console.error("Failed to load store data", error);
    } finally {
      setLoading(false);
    }
  }, [reloadBudgetWallet]);

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
      if (user) clearProfileSession();
      if (accessToken) {
        setAccessTokenState(accessToken);
        await AsyncStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
      }

      if (refreshToken) {
        setRefreshTokenState(refreshToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
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
  const setProfileAddress = useCallback(async (value: string) => { await updateAccountProfile({ address: value }, undefined, accountProfile.scope); }, [accountProfile.scope]);
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

  const addNotification = useCallback(
    async (
      newNotif: Omit<NotificationItem, "id" | "timestamp" | "isUnread"> & {
        id?: string;
        timestamp?: string;
        isUnread?: boolean;
      },
    ) => {
      const notif: NotificationItem = {
        id: newNotif.id ?? `notif-${Date.now()}`,
        type: newNotif.type,
        title: newNotif.title,
        description: newNotif.description,
        timestamp: newNotif.timestamp ?? new Date().toISOString(),
        isUnread: newNotif.isUnread ?? true,
        referenceId: newNotif.referenceId,
        route: newNotif.route,
        amount: newNotif.amount,
      };

      setNotifications((prev) => {
        const next = [notif, ...prev];
        AsyncStorage.setItem("ts_notifications", JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const markNotificationAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) =>
        n.id === id ? { ...n, isUnread: false } : n,
      );
      AsyncStorage.setItem("ts_notifications", JSON.stringify(next));
      return next;
    });
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, isUnread: false }));
      AsyncStorage.setItem("ts_notifications", JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      AsyncStorage.setItem("ts_notifications", JSON.stringify(next));
      return next;
    });
  }, []);

  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
    AsyncStorage.setItem("ts_notifications", JSON.stringify([]));
  }, []);

  // ---------------------------------------------------------
  // TRANSACTIONS
  // ---------------------------------------------------------

  const addTransaction = useCallback(
    async (newTx: any) => {
      const tx = {
        ...newTx,
        id: newTx.id ?? `tx-${Date.now()}`,
      };

      try {
        await loadWallet(DEFAULT_TRANSACTIONS);
        const before = getWalletSnapshot();
        const after = await saveWalletTransaction(tx);
        if (before === after) return true;
      } catch (error) {
        Alert.alert('Transaction not saved', error instanceof Error ? error.message : 'Please try again.');
        return false;
      }

      // Dispatch contextual notification automatically
      const titleLower = (tx.title || "").toLowerCase();
      const formattedAmount = `₦${Number(tx.amount || 0).toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      )}`;

      let notifTitle = "Transaction Recorded";
      let notifDesc = `${formattedAmount} was recorded under ${tx.category || "Expenses"}.`;
      let notifType: NotificationItem["type"] = "transaction";
      let notifRoute = `/transaction-details?id=${tx.id}`;

      if (tx.type === "income") {
        notifTitle = "Wallet Deposit Received";
        notifDesc = `${formattedAmount} was credited to your Tally wallet successfully.`;
      } else if (titleLower.includes("transfer to")) {
        notifTitle = "Transfer Successful";
        notifDesc = `Your transfer of ${formattedAmount} was processed and sent.`;
      } else if (titleLower.includes("withdraw")) {
        notifTitle = "Withdrawal Initiated";
        notifDesc = `Your withdrawal of ${formattedAmount} to your bank account is underway.`;
      }

      if (tx.demo) {
        notifTitle = "Demo transaction recorded";
        notifDesc = `${formattedAmount} was saved to your demo wallet. No bank transfer was made.`;
      }

      addNotification({
        type: notifType,
        title: notifTitle,
        description: notifDesc,
        referenceId: tx.id,
        route: notifRoute,
        amount: Number(tx.amount || 0),
      });
      return true;
    },
    [addNotification],
  );

  const deleteTransaction = useCallback(async (id: string) => {
    await deleteWalletTransaction(id);
  }, []);

  const updateTransaction = useCallback(async (updatedTx: any) => {
    await saveWalletTransaction(updatedTx);
  }, []);

  const updateBudget = useCallback(async (category: string, limit: number) => {
    setBudgets((prev) => {
      const next = {
        ...prev,
        [category]: limit,
      };

      AsyncStorage.setItem("ts_bgts", JSON.stringify(next));

      return next;
    });
  }, []);

  const deleteBudget = useCallback(async (category: string) => {
    setBudgets((prev) => {
      const next = { ...prev };

      delete next[category];

      AsyncStorage.setItem("ts_bgts", JSON.stringify(next));

      return next;
    });
  }, []);

  const addSavingsGoal = useCallback(async (newGoal: any) => {
    const goal = {
      ...newGoal,
      id: `goal-${Date.now()}`,
      percentage:
        newGoal.target > 0
          ? Math.min(100, Math.round((newGoal.saved / newGoal.target) * 100))
          : 0,
    };

    setSavingsGoals((prev) => {
      const next = [...prev, goal];

      AsyncStorage.setItem("ts_goals", JSON.stringify(next));

      return next;
    });
  }, []);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    setSavingsGoals((prev) => {
      const next = prev.filter((goal) => goal.id !== id);

      AsyncStorage.setItem("ts_goals", JSON.stringify(next));

      return next;
    });
  }, []);

  const updateSavingsGoal = useCallback(
    async (id: string, saved: number, target: number) => {
      setSavingsGoals((prev) => {
        const next = prev.map((goal) => {
          if (goal.id === id) {
            return {
              ...goal,
              saved,
              target,
              percentage:
                target > 0
                  ? Math.min(100, Math.round((saved / target) * 100))
                  : 0,
            };
          }

          return goal;
        });

        AsyncStorage.setItem("ts_goals", JSON.stringify(next));

        return next;
      });
    },
    [],
  );

  const resetData = useCallback(async () => {
    const defaultCards = [
      {
        id: "card-1",
        brand: "Visa",
        last4: "5682",
        holder: "EBUKA",
      },
      {
        id: "card-2",
        brand: "Mastercard",
        last4: "1123",
        holder: "EBUKA",
      },
    ];

    await resetWallet(DEFAULT_TRANSACTIONS);

    await AsyncStorage.setItem("ts_bgts", JSON.stringify(DEFAULT_BUDGETS));

    await AsyncStorage.setItem(
      "ts_goals",
      JSON.stringify(DEFAULT_SAVINGS_GOALS),
    );

    await AsyncStorage.setItem("ts_username", "ebuka");

    await setDarkModePreference("system");
    await setThemePreference("aurora");

    await AsyncStorage.removeItem("ts_theme_is_customized");

    await AsyncStorage.setItem("ts_cards", JSON.stringify(defaultCards));

    await AsyncStorage.setItem(
      getCustomCategoriesStorageKey("ebuka"),
      JSON.stringify([]),
    );

    setTransactions(DEFAULT_TRANSACTIONS);

    setBudgets(DEFAULT_BUDGETS);

    setSavingsGoals(DEFAULT_SAVINGS_GOALS);





    setSavedCards(defaultCards);

    setCustomCategoriesState([]);
  }, []);

  return {
    availableBalance: budgetWallet ? totals(budgetWallet).available / 100 : 0,
    budgetWallet,
    budgetError,
    reloadBudgetWallet,
    transactions,
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
    unreadNotificationCount: notifications.filter((n) => n.isUnread).length,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,

    resetData,
  };
}
