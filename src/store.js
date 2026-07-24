import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";

// Initial Transactions - type: 'income' or 'expense'
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

// Global shared auth state outside the component hook so it persists across renders
let globalIsAuthenticated = false;
let authListeners = [];

const setGlobalAuth = (status) => {
  globalIsAuthenticated = status;
  authListeners.forEach((listener) => listener(status));
};

export function useAppStore() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync with global auth state
  const [isAuthenticated, setIsAuthenticated] = useState(globalIsAuthenticated);

  const navigation = useNavigation();

  useEffect(() => {
    authListeners.push(setIsAuthenticated);
    return () => {
      authListeners = authListeners.filter((l) => l !== setIsAuthenticated);
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      const storedTxs = await AsyncStorage.getItem("ts_txs");
      const storedBudgets = await AsyncStorage.getItem("ts_bgts");
      const storedGoals = await AsyncStorage.getItem("ts_goals");

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
    } catch (e) {
      console.error("Failed to load store data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload data when navigation screen focuses
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

  const addTransaction = useCallback(async (newTx) => {
    const tx = {
      ...newTx,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => {
      const next = [tx, ...prev];
      AsyncStorage.setItem("ts_txs", JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    setTransactions((prev) => {
      const next = prev.filter((t) => t.id !== id);
      AsyncStorage.setItem("ts_txs", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateTransaction = useCallback(async (updatedTx) => {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.id === updatedTx.id ? updatedTx : t));
      AsyncStorage.setItem("ts_txs", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateBudget = useCallback(async (category, limit) => {
    setBudgets((prev) => {
      const next = { ...prev, [category]: limit };
      AsyncStorage.setItem("ts_bgts", JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteBudget = useCallback(async (category) => {
    setBudgets((prev) => {
      const next = { ...prev };
      delete next[category];
      AsyncStorage.setItem("ts_bgts", JSON.stringify(next));
      return next;
    });
  }, []);

  const addSavingsGoal = useCallback(async (newGoal) => {
    const goal = {
      ...newGoal,
      id: `goal-${Date.now()}`,
      percentage: Math.min(
        100,
        Math.round((newGoal.saved / newGoal.target) * 100),
      ),
    };
    setSavingsGoals((prev) => {
      const next = [...prev, goal];
      AsyncStorage.setItem("ts_goals", JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteSavingsGoal = useCallback(async (id) => {
    setSavingsGoals((prev) => {
      const next = prev.filter((g) => g.id !== id);
      AsyncStorage.setItem("ts_goals", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateSavingsGoal = useCallback(async (id, saved, target) => {
    setSavingsGoals((prev) => {
      const next = prev.map((g) => {
        if (g.id === id) {
          return {
            ...g,
            saved,
            target,
            percentage: Math.min(100, Math.round((saved / target) * 100)),
          };
        }
        return g;
      });
      AsyncStorage.setItem("ts_goals", JSON.stringify(next));
      return next;
    });
  }, []);

  const resetData = useCallback(async () => {
    await AsyncStorage.setItem("ts_txs", JSON.stringify(DEFAULT_TRANSACTIONS));
    await AsyncStorage.setItem("ts_bgts", JSON.stringify(DEFAULT_BUDGETS));
    await AsyncStorage.setItem(
      "ts_goals",
      JSON.stringify(DEFAULT_SAVINGS_GOALS),
    );
    setTransactions(DEFAULT_TRANSACTIONS);
    setBudgets(DEFAULT_BUDGETS);
    setSavingsGoals(DEFAULT_SAVINGS_GOALS);
  }, []);

  return {
    transactions,
    budgets,
    savingsGoals,
    loading,
    isAuthenticated,
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
    resetData,
  };
}
