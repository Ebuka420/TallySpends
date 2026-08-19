import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import type { ThemeId, ThemeMode, ThemePalette } from "./theme";
import { getThemePalette } from "./theme";

const THEME_STORAGE_KEY = "ts_theme";
const DARK_MODE_PREFERENCE_STORAGE_KEY = "ts_dark_mode_preference";
const TAB_BAR_OPACITY_STORAGE_KEY = "ts_tab_bar_opacity";
const DEFAULT_CUSTOM_CATEGORIES_STORAGE_KEY = "ts_custom_categories";

const getCustomCategoriesStorageKey = (
  usernameValue: string | null | undefined,
) =>
  `${DEFAULT_CUSTOM_CATEGORIES_STORAGE_KEY}_${(
    usernameValue || "default"
  ).replace(/[^a-zA-Z0-9_-]/g, "_")}`;

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

let globalIsAuthenticated = false;

type AuthListener = (status: boolean) => void;

let authListeners: AuthListener[] = [];

const setGlobalAuth = (status: boolean) => {
  globalIsAuthenticated = status;

  authListeners.forEach((listener) => listener(status));
};

let globalThemePreference: ThemeId = "aurora";
let globalDarkModePreference: "light" | "dark" | "system" = "system";
let themeListeners: (() => void)[] = [];

const setGlobalThemePreference = (pref: ThemeId) => {
  globalThemePreference = pref;
  themeListeners.forEach((listener) => listener());
};

const setGlobalDarkModePreference = (pref: "light" | "dark" | "system") => {
  globalDarkModePreference = pref;
  themeListeners.forEach((listener) => listener());
};

export function useAppStore() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [profileImage, setProfileImageState] = useState<string | null>(null);
  const [profileFullName, setFullNameState] = useState("Goziechi Chigozie");
  const [profilePhoneNumber, setPhoneNumberState] = useState("+234 814 622 4577");
  const [profileEmail, setEmailState] = useState("ebuka@example.com");
  const [profileNickname, setNicknameState] = useState("Enter Nickname");
  const [profileGender, setGenderState] = useState("Male");
  const [profileDob, setDobState] = useState("**-**-11");
  const [profileAddress, setAddressState] = useState("");
  const [profileTallyTag, setTallyTagState] = useState("@EBUKA");
  const [loading, setLoading] = useState(true);

  const [themePreference, setThemePreferenceState] =
    useState<ThemeId>(globalThemePreference);

  const [darkModePreference, setDarkModePreferenceState] =
    useState<"light" | "dark" | "system">(globalDarkModePreference);

  const systemColorScheme = useColorScheme();

  const themeMode: ThemeMode =
    darkModePreference === "system"
      ? (systemColorScheme ?? "light")
      : darkModePreference;

  const theme: ThemePalette = getThemePalette(themePreference, themeMode);

  const [tabBarOpacity, setTabBarOpacityState] = useState(0.72);

  const [username, setUsernameState] = useState("ebuka");

  const [customCategories, setCustomCategoriesState] = useState<string[]>([]);

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

  const [isAuthenticated, setIsAuthenticated] = useState(globalIsAuthenticated);

  const navigation = useNavigation();

  useEffect(() => {
    authListeners.push(setIsAuthenticated);

    return () => {
      authListeners = authListeners.filter(
        (listener) => listener !== setIsAuthenticated,
      );
    };
  }, []);

  useEffect(() => {
    const handleThemeChange = () => {
      setThemePreferenceState(globalThemePreference);
      setDarkModePreferenceState(globalDarkModePreference);
    };

    themeListeners.push(handleThemeChange);

    return () => {
      themeListeners = themeListeners.filter(
        (listener) => listener !== handleThemeChange,
      );
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      const storedTxs = await AsyncStorage.getItem("ts_txs");

      const storedBudgets = await AsyncStorage.getItem("ts_bgts");

      const storedGoals = await AsyncStorage.getItem("ts_goals");

      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

      const storedDarkMode = await AsyncStorage.getItem(DARK_MODE_PREFERENCE_STORAGE_KEY);

      const storedTabBarOpacity = await AsyncStorage.getItem(
        TAB_BAR_OPACITY_STORAGE_KEY,
      );

      const storedUsername = await AsyncStorage.getItem("ts_username");

      const storedCustomCategories = await AsyncStorage.getItem(
        getCustomCategoriesStorageKey(storedUsername || "ebuka"),
      );

      const storedCards = await AsyncStorage.getItem("ts_cards");

      const storedFullName = await AsyncStorage.getItem("ts_profile_fullname");
      const storedPhone = await AsyncStorage.getItem("ts_profile_phone");
      const storedEmail = await AsyncStorage.getItem("ts_profile_email");
      const storedNickname = await AsyncStorage.getItem("ts_profile_nickname");
      const storedGender = await AsyncStorage.getItem("ts_profile_gender");
      const storedDob = await AsyncStorage.getItem("ts_profile_dob");
      const storedAddress = await AsyncStorage.getItem("ts_profile_address");
      const storedTallyTag = await AsyncStorage.getItem("ts_profile_tallytag");
      const storedProfileImage = await AsyncStorage.getItem("ts_profile_image");

      if (storedFullName) setFullNameState(storedFullName);
      if (storedPhone) setPhoneNumberState(storedPhone);
      if (storedEmail) setEmailState(storedEmail);
      if (storedNickname) setNicknameState(storedNickname);
      if (storedGender) setGenderState(storedGender);
      if (storedDob) setDobState(storedDob);
      if (storedAddress) setAddressState(storedAddress);
      if (storedTallyTag) setTallyTagState(storedTallyTag);
      if (storedProfileImage) setProfileImageState(storedProfileImage);

      if (storedUsername) {
        setUsernameState(storedUsername);
      } else {
        await AsyncStorage.setItem("ts_username", "ebuka");

        setUsernameState("ebuka");
      }

      const validThemes = ["aurora", "sage", "sunset", "ocean", "forest", "crimson", "midnight", "pink"];
      if (validThemes.includes(storedTheme || "")) {
        setGlobalThemePreference(storedTheme as ThemeId);
      }

      if (
        storedDarkMode === "light" ||
        storedDarkMode === "dark" ||
        storedDarkMode === "system"
      ) {
        setGlobalDarkModePreference(storedDarkMode);
      }

      if (storedTabBarOpacity !== null) {
        const parsedOpacity = Number(storedTabBarOpacity);

        if (!Number.isNaN(parsedOpacity)) {
          const clampedOpacity = Math.max(0, Math.min(1, parsedOpacity));

          setTabBarOpacityState(clampedOpacity);
        }
      }

      if (storedCustomCategories) {
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

      if (storedTxs !== null) {
        setTransactions(JSON.parse(storedTxs));
      } else {
        await AsyncStorage.setItem(
          "ts_txs",
          JSON.stringify(DEFAULT_TRANSACTIONS),
        );

        setTransactions(DEFAULT_TRANSACTIONS);
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
    } catch (error) {
      console.error("Failed to load store data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });

    loadData();

    return unsubscribe;
  }, [navigation, loadData]);

  const login = useCallback(() => {
    setGlobalAuth(true);
  }, []);

  const logout = useCallback(() => {
    setGlobalAuth(false);
  }, []);

  const setThemePreference = useCallback(async (themeId: ThemeId) => {
    const validThemes: ThemeId[] = ["aurora", "sage", "sunset", "ocean", "forest", "crimson", "midnight", "pink"];
    const validTheme = validThemes.includes(themeId) ? themeId : "aurora";

    setGlobalThemePreference(validTheme);

    await AsyncStorage.setItem(THEME_STORAGE_KEY, validTheme);
  }, []);

  const setDarkModePreference = useCallback(async (mode: "light" | "dark" | "system") => {
    const validMode = mode === "light" || mode === "dark" || mode === "system" ? mode : "system";

    setGlobalDarkModePreference(validMode);

    await AsyncStorage.setItem(DARK_MODE_PREFERENCE_STORAGE_KEY, validMode);
  }, []);

  const setTabBarOpacity = useCallback(async (opacity: number) => {
    const nextOpacity = Math.max(0.45, Math.min(0.98, opacity));

    setTabBarOpacityState(nextOpacity);

    await AsyncStorage.setItem(
      TAB_BAR_OPACITY_STORAGE_KEY,
      String(nextOpacity),
    );
  }, []);

  const setUsername = useCallback(async (newUsername: string) => {
    setUsernameState(newUsername);

    await AsyncStorage.setItem("ts_username", newUsername);
  }, []);

  const setProfileFullName = useCallback(async (val: string) => {
    setFullNameState(val);
    await AsyncStorage.setItem("ts_profile_fullname", val);
  }, []);

  const setProfilePhoneNumber = useCallback(async (val: string) => {
    setPhoneNumberState(val);
    await AsyncStorage.setItem("ts_profile_phone", val);
  }, []);

  const setProfileEmail = useCallback(async (val: string) => {
    setEmailState(val);
    await AsyncStorage.setItem("ts_profile_email", val);
  }, []);

  const setProfileNickname = useCallback(async (val: string) => {
    setNicknameState(val);
    await AsyncStorage.setItem("ts_profile_nickname", val);
  }, []);

  const setProfileGender = useCallback(async (val: string) => {
    setGenderState(val);
    await AsyncStorage.setItem("ts_profile_gender", val);
  }, []);

  const setProfileDob = useCallback(async (val: string) => {
    setDobState(val);
    await AsyncStorage.setItem("ts_profile_dob", val);
  }, []);

  const setProfileAddress = useCallback(async (val: string) => {
    setAddressState(val);
    await AsyncStorage.setItem("ts_profile_address", val);
  }, []);

  const setProfileTallyTag = useCallback(async (val: string) => {
    setTallyTagState(val);
    await AsyncStorage.setItem("ts_profile_tallytag", val);
  }, []);

  const setProfileImage = useCallback(async (val: string | null) => {
    setProfileImageState(val);
    if (val) {
      await AsyncStorage.setItem("ts_profile_image", val);
    } else {
      await AsyncStorage.removeItem("ts_profile_image");
    }
  }, []);

  const addCustomCategory = useCallback(
    async (categoryName: string) => {
      const trimmed = categoryName?.trim();

      if (!trimmed) return;

      const storageKey = getCustomCategoriesStorageKey(username || "ebuka");

      setCustomCategoriesState((prev) => {
        const next = prev.includes(trimmed) ? prev : [...prev, trimmed];

        AsyncStorage.setItem(storageKey, JSON.stringify(next));

        return next;
      });
    },
    [username],
  );

  const deleteCustomCategory = useCallback(
    async (categoryName: string) => {
      const trimmed = categoryName?.trim();

      if (!trimmed) return;

      const storageKey = getCustomCategoriesStorageKey(username || "ebuka");

      setCustomCategoriesState((prev) => {
        const next = prev.filter((item) => item !== trimmed);

        AsyncStorage.setItem(storageKey, JSON.stringify(next));

        return next;
      });
    },
    [username],
  );

  const addTransaction = useCallback(async (newTx: any) => {
    const tx = {
      ...newTx,
      id: newTx.id ?? `tx-${Date.now()}`,
    };

    setTransactions((prev) => {
      const next = [tx, ...prev];

      AsyncStorage.setItem("ts_txs", JSON.stringify(next));

      return next;
    });
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => {
      const next = prev.filter((transaction) => transaction.id !== id);

      AsyncStorage.setItem("ts_txs", JSON.stringify(next));

      return next;
    });
  }, []);

  const updateTransaction = useCallback(async (updatedTx: any) => {
    setTransactions((prev) => {
      const next = prev.map((transaction) =>
        transaction.id === updatedTx.id ? updatedTx : transaction,
      );

      AsyncStorage.setItem("ts_txs", JSON.stringify(next));

      return next;
    });
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

    await AsyncStorage.setItem("ts_txs", JSON.stringify(DEFAULT_TRANSACTIONS));

    await AsyncStorage.setItem("ts_bgts", JSON.stringify(DEFAULT_BUDGETS));

    await AsyncStorage.setItem(
      "ts_goals",
      JSON.stringify(DEFAULT_SAVINGS_GOALS),
    );

    await AsyncStorage.setItem("ts_username", "ebuka");

    await AsyncStorage.setItem(DARK_MODE_PREFERENCE_STORAGE_KEY, "system");

    await AsyncStorage.setItem("ts_cards", JSON.stringify(defaultCards));

    await AsyncStorage.setItem(
      getCustomCategoriesStorageKey("ebuka"),
      JSON.stringify([]),
    );

    setTransactions(DEFAULT_TRANSACTIONS);

    setBudgets(DEFAULT_BUDGETS);

    setSavingsGoals(DEFAULT_SAVINGS_GOALS);

    setUsernameState("ebuka");

    setDarkModePreferenceState("system");

    setSavedCards(defaultCards);

    setCustomCategoriesState([]);
  }, []);

  return {
    transactions,
    budgets,
    savingsGoals,

    profileImage,
    setProfileImage,

    loading,
    isAuthenticated,

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
    profileNickname,
    setProfileNickname,
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

    resetData,
  };
}
