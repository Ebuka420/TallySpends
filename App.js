import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Import Icons
import {
  Menu, Share, Calendar, ChevronDown, ChevronRight, ArrowUp, ArrowDown,
  IconHome, IconExpenses, IconBudget, IconAnalytics, IconMore,
  IconCar, IconPiggy, IconCard
} from './src/icons';

// Import Mock Data
import { mockData } from './src/mockData';

// Import Charts
import GaugeChart from './src/components/GaugeChart';
import TrendsChart from './src/components/TrendsChart';
import BreakdownChart from './src/components/BreakdownChart';
import BarChart from './src/components/BarChart';
import HeatMap from './src/components/HeatMap';

// Import Views
import { HomeView, ExpensesView, BudgetView, SettingsView } from './src/components/Views';

// Initial Transactions (May 2024) - sum matches screenshot exactly
const DEFAULT_TRANSACTIONS = [
  { id: 'tx-1', title: 'Salary (Tally Corp)', amount: 3000.00, category: 'Income', type: 'income', date: '2024-05-01' },
  { id: 'tx-2', title: 'Freelance Design', amount: 450.00, category: 'Income', type: 'income', date: '2024-05-15' },
  { id: 'tx-3', title: 'Rent & Electricity', amount: 323.75, category: 'Bills & Utilities', type: 'expense', date: '2024-05-02' },
  { id: 'tx-4', title: 'Organic Groceries', amount: 404.32, category: 'Food & Dining', type: 'expense', date: '2024-05-04' },
  { id: 'tx-5', title: 'Sake Bar Dinner', amount: 200.00, category: 'Food & Dining', type: 'expense', date: '2024-05-12' },
  { id: 'tx-6', title: 'Metro Transit Pass', amount: 150.00, category: 'Transport', type: 'expense', date: '2024-05-05' },
  { id: 'tx-7', title: 'Uber Trips Weekend', amount: 281.66, category: 'Transport', type: 'expense', date: '2024-05-18' },
  { id: 'tx-8', title: 'Virtual Reality Headset', amount: 300.00, category: 'Shopping', type: 'expense', date: '2024-05-09' },
  { id: 'tx-9', title: 'Target Clothing Store', amount: 88.49, category: 'Shopping', type: 'expense', date: '2024-05-24' },
  { id: 'tx-10', title: 'Cinema Tickets', amount: 60.00, category: 'Entertainment', type: 'expense', date: '2024-05-14' },
  { id: 'tx-11', title: 'Concert Live Show', amount: 155.83, category: 'Entertainment', type: 'expense', date: '2024-05-28' },
  { id: 'tx-12', title: 'Cloud Hosting Sub', amount: 50.00, category: 'Others', type: 'expense', date: '2024-05-10' },
  { id: 'tx-13', title: 'Pharmacy Checkup', amount: 144.25, category: 'Others', type: 'expense', date: '2024-05-20' },
];

const DEFAULT_BUDGETS = {
  'Food & Dining': 800,
  'Transport': 500,
  'Shopping': 600,
  'Bills & Utilities': 400,
  'Entertainment': 300,
  'Others': 250
};

export default function App() {
  const [activeTab, setActiveTab] = useState('analytics'); // matches screenshot on load
  const [timeframe, setTimeframe] = useState('Monthly'); // Weekly, Monthly, Yearly
  const [selectedDate, setSelectedDate] = useState('May 2024');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('$');

  // Core transaction & budget states
  const [transactions, setTransactions] = useState(DEFAULT_TRANSACTIONS);
  const [budgets, setBudgets] = useState(DEFAULT_BUDGETS);

  // Add transaction
  const handleAddTransaction = (newTx) => {
    const tx = {
      ...newTx,
      id: `tx-${Date.now()}`
    };
    setTransactions([tx, ...transactions]);
  };

  // Delete transaction
  const handleDeleteTransaction = (id) => {
    setTransactions(transactions.filter(tx => tx.id !== id));
  };

  // Update budget limit
  const handleUpdateBudget = (category, limit) => {
    setBudgets({
      ...budgets,
      [category]: limit
    });
  };

  // Reset transactions and budgets back to default
  const handleResetData = () => {
    setTransactions(DEFAULT_TRANSACTIONS);
    setBudgets(DEFAULT_BUDGETS);
  };

  // Date selection simulation
  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  /* ==========================================================================
     DYNAMIC STATISTICS CALCULATOR (For Monthly Dashboard)
     ========================================================================== */
  const statistics = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const categorySpending = {
      'Food & Dining': 0,
      'Transport': 0,
      'Shopping': 0,
      'Bills & Utilities': 0,
      'Entertainment': 0,
      'Others': 0
    };

    transactions.forEach(tx => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
        if (categorySpending[tx.category] !== undefined) {
          categorySpending[tx.category] += tx.amount;
        } else {
          categorySpending['Others'] += tx.amount;
        }
      }
    });

    const totalSavings = totalIncome - totalExpenses;

    // Financial health score math
    let score = 75;
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
    if (savingsRate > 20) score += 5;
    if (savingsRate > 35) score += 5;
    
    let budgetBreaches = 0;
    Object.keys(budgets).forEach(cat => {
      if (categorySpending[cat] > budgets[cat]) {
        budgetBreaches++;
      }
    });
    score -= budgetBreaches * 3;
    score = Math.max(40, Math.min(100, score));

    let statusText = "Good";
    let statusMessage = "You're on the right track!";
    if (score >= 85) {
      statusText = "Excellent";
      statusMessage = "Superb financial discipline!";
    } else if (score < 65) {
      statusText = "Warning";
      statusMessage = "Try to curb non-essential bills.";
    }

    // Category Breakdown percentages
    const breakdown = Object.keys(categorySpending).map(cat => {
      const value = categorySpending[cat];
      const percentage = totalExpenses > 0 ? Math.round((value / totalExpenses) * 100) : 0;
      
      let color = "#ece6eb";
      if (cat === 'Food & Dining') color = '#3d2e3c';
      else if (cat === 'Transport') color = '#6c536a';
      else if (cat === 'Shopping') color = '#957793';
      else if (cat === 'Bills & Utilities') color = '#c1a4bf';
      else if (cat === 'Entertainment') color = '#cab7c8';
      
      return { name: cat, percentage, value, color };
    }).sort((a, b) => b.value - a.value);

    // Update Monthly dataset details inside mock trends and graphs
    const monthlyDataOverride = JSON.parse(JSON.stringify(mockData.Monthly));
    
    monthlyDataOverride.totals.income.value = totalIncome;
    monthlyDataOverride.totals.expenses.value = totalExpenses;
    monthlyDataOverride.totals.savings.value = totalSavings;
    monthlyDataOverride.healthScore = score;
    monthlyDataOverride.healthScoreText = score >= 75 ? "Spending efficiency improved this month" : "Curb expenses to improve score";
    
    const expensesDS = monthlyDataOverride.trends.datasets.find(d => d.name === "Expenses");
    const savingsDS = monthlyDataOverride.trends.datasets.find(d => d.name === "Savings");
    const incomeDS = monthlyDataOverride.trends.datasets.find(d => d.name === "Income");
    
    if (expensesDS) expensesDS.data[4] = totalExpenses;
    if (savingsDS) savingsDS.data[4] = totalSavings;
    if (incomeDS) incomeDS.data[4] = totalIncome;

    const lastHoverIdx = monthlyDataOverride.trends.hoverDetails.length - 1;
    if (monthlyDataOverride.trends.hoverDetails[lastHoverIdx]) {
      monthlyDataOverride.trends.hoverDetails[lastHoverIdx].Expenses = totalExpenses;
      monthlyDataOverride.trends.hoverDetails[lastHoverIdx].Savings = totalSavings;
      monthlyDataOverride.trends.hoverDetails[lastHoverIdx].Income = totalIncome;
    }

    monthlyDataOverride.barChart.income[4] = totalIncome;
    monthlyDataOverride.barChart.expenses[4] = totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      healthScore: score,
      statusText,
      statusMessage,
      breakdown,
      categorySpending,
      monthlyDataOverride
    };
  }, [transactions, budgets]);

  const activeDashboardData = useMemo(() => {
    if (timeframe === 'Weekly') return mockData.Weekly;
    if (timeframe === 'Yearly') return mockData.Yearly;
    return statistics.monthlyDataOverride;
  }, [timeframe, statistics]);

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar style="dark" />

      {/* Global Toolbar Header */}
      <View style={styles.navbarHeader}>
        <TouchableOpacity style={styles.headerBtn}>
          <Menu size={20} color="#1f1a1f" />
        </TouchableOpacity>
        <Text style={styles.navbarTitle}>
          {activeTab === 'home' && "Dashboard"}
          {activeTab === 'expenses' && "Expenses"}
          {activeTab === 'budget' && "Budgets"}
          {activeTab === 'analytics' && "Analytics"}
          {activeTab === 'more' && "Settings"}
        </Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Share size={18} color="#1f1a1f" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.screenBody}>
        
        {/* 1. HOME SCREEN */}
        {activeTab === 'home' && (
          <HomeView 
            balance={statistics.totalSavings} 
            transactions={transactions} 
            onNavigateToTab={setActiveTab}
            currencySymbol={currencySymbol}
          />
        )}

        {/* 2. EXPENSES SCREEN */}
        {activeTab === 'expenses' && (
          <ExpensesView 
            transactions={transactions} 
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            currencySymbol={currencySymbol}
          />
        )}

        {/* 3. BUDGET SCREEN */}
        {activeTab === 'budget' && (
          <BudgetView 
            categorySpending={statistics.categorySpending} 
            budgets={budgets} 
            onUpdateBudget={handleUpdateBudget}
            currencySymbol={currencySymbol}
          />
        )}

        {/* 4. ANALYTICS SCREEN (mockup clone) */}
        {activeTab === 'analytics' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ gap: 14, paddingBottom: 20 }}>
              
              {/* Filters row */}
              <View style={styles.filtersRow}>
                <View style={styles.timeframeCapsule}>
                  {['Weekly', 'Monthly', 'Yearly'].map(tab => (
                    <TouchableOpacity
                      key={tab}
                      onPress={() => setTimeframe(tab)}
                      style={[
                        styles.timeframeTab,
                        timeframe === tab && styles.timeframeTabActive
                      ]}
                    >
                      <Text style={[
                        styles.timeframeTabText,
                        timeframe === tab && styles.timeframeTabTextActive
                      ]}>{tab}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Date Dropdown */}
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity 
                    onPress={() => setShowDatePicker(!showDatePicker)}
                    style={styles.dateSelectorBtn}
                  >
                    <Calendar size={12} color="#1f1a1f" />
                    <Text style={styles.dateSelectorText}>
                      {timeframe === 'Monthly' ? selectedDate : timeframe === 'Weekly' ? 'Current Week' : 'Year 2024'}
                    </Text>
                    <ChevronDown size={12} color="#1f1a1f" />
                  </TouchableOpacity>

                  {showDatePicker && timeframe === 'Monthly' && (
                    <View style={styles.dateDropdown}>
                      {['Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024'].map(m => (
                        <TouchableOpacity
                          key={m}
                          onPress={() => handleSelectDate(m)}
                          style={[
                            styles.dateDropdownItem,
                            selectedDate === m && { backgroundColor: '#3d2e3c' }
                          ]}
                        >
                          <Text style={[
                            styles.dateDropdownItemText,
                            selectedDate === m && { color: '#ffffff' }
                          ]}>{m.split(' ')[0]}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

              </View>

              {/* Layout cards */}
              
              {/* Financial Health Score Card */}
              <View style={styles.tallyCard}>
                <Text style={styles.cardHeaderTitle}>Financial Health Score</Text>
                
                <View style={styles.healthWrapper}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bigScore}>
                      {activeDashboardData.healthScore}
                      <Text style={styles.scoreScale}>/100</Text>
                    </Text>
                    <Text style={styles.scoreSubText}>{activeDashboardData.healthScoreText}</Text>
                    <View style={[
                      styles.diffBadge,
                      { backgroundColor: activeDashboardData.healthScoreDiffPositive ? '#eaf6ec' : '#fdf0ee' }
                    ]}>
                      <Text style={[
                        styles.diffBadgeText,
                        { color: activeDashboardData.healthScoreDiffPositive ? '#34a853' : '#ea4335' }
                      ]}>
                        {activeDashboardData.healthScoreDiffPositive ? '↑ ' : '↓ '}
                        {activeDashboardData.healthScoreDiff}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.gaugeBox}>
                    <GaugeChart score={activeDashboardData.healthScore} />
                    <View style={styles.gaugeStatusLabel}>
                      <Text style={styles.gaugeStatusTitle}>{statistics.statusText}</Text>
                      <Text style={styles.gaugeStatusSub}>{statistics.statusMessage}</Text>
                    </View>
                  </View>
                </View>

                {/* Metrics list */}
                <View style={styles.metricsList}>
                  {[
                    { name: 'Income', val: activeDashboardData.totals.income.value, change: activeDashboardData.totals.income.change, positive: activeDashboardData.totals.income.positive, icon: <ArrowUp size={12} color="#34a853" />, type: 'income' },
                    { name: 'Expenses', val: activeDashboardData.totals.expenses.value, change: activeDashboardData.totals.expenses.change, positive: activeDashboardData.totals.expenses.positive, icon: <ArrowDown size={12} color="#ea4335" />, type: 'expenses' },
                    { name: 'Savings', val: activeDashboardData.totals.savings.value, change: activeDashboardData.totals.savings.change, positive: activeDashboardData.totals.savings.positive, icon: <ArrowUp size={12} color="#3d2e3c" />, type: 'savings' }
                  ].map((item, idx) => (
                    <View key={idx} style={styles.metricRow}>
                      <View style={styles.metricRowLeft}>
                        <View style={[
                          styles.metricIndicator,
                          item.type === 'income' && { backgroundColor: '#eaf6ec' },
                          item.type === 'expenses' && { backgroundColor: '#fdf0ee' },
                          item.type === 'savings' && { backgroundColor: '#f5eff3' }
                        ]}>
                          {item.icon}
                        </View>
                        <View>
                          <Text style={styles.metricName}>{item.name}</Text>
                          <Text style={styles.metricValue}>
                            {currencySymbol}{item.val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </Text>
                        </View>
                      </View>
                      <View style={[
                        styles.metricChangeBadge,
                        { backgroundColor: item.positive ? '#eaf6ec' : '#fdf0ee' }
                      ]}>
                        <Text style={[styles.metricChangeText, { color: item.positive ? '#34a853' : '#ea4335' }]}>
                          {item.change}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Spending Trends Card */}
              <View style={styles.tallyCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderTitle}>Spending Trends</Text>
                  <View style={styles.miniSelector}>
                    <Text style={styles.miniSelectorText}>All Accounts</Text>
                  </View>
                </View>

                <TrendsChart data={activeDashboardData.trends} />

                {/* Legend list */}
                <View style={styles.legendRow}>
                  {activeDashboardData.trends.datasets.map(ds => (
                    <View key={ds.name} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: ds.color }]} />
                      <Text style={styles.legendText}>{ds.name}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Category Breakdown Card */}
              <View style={styles.tallyCard}>
                <Text style={styles.cardHeaderTitle}>Category Breakdown</Text>
                <BreakdownChart 
                  breakdown={timeframe === 'Monthly' ? statistics.breakdown : activeDashboardData.breakdown} 
                  totalExpenses={activeDashboardData.totals.expenses.value} 
                />
                <TouchableOpacity style={styles.footerLinkBtn} onPress={() => setActiveTab('expenses')}>
                  <Text style={styles.footerLinkText}>View full breakdown</Text>
                  <ChevronRight size={10} color="#706870" />
                </TouchableOpacity>
              </View>

              {/* Income vs Expenses Card */}
              <View style={styles.tallyCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderTitle}>Income vs Expenses</Text>
                  <View style={styles.miniSelector}>
                    <Text style={styles.miniSelectorText}>This Year</Text>
                  </View>
                </View>
                <BarChart 
                  labels={activeDashboardData.barChart.labels} 
                  income={activeDashboardData.barChart.income} 
                  expenses={activeDashboardData.barChart.expenses} 
                />
                <TouchableOpacity style={styles.footerLinkBtn} onPress={() => setActiveTab('expenses')}>
                  <Text style={styles.footerLinkText}>View details</Text>
                  <ChevronRight size={10} color="#706870" />
                </TouchableOpacity>
              </View>

              {/* Heat Map Card */}
              <View style={styles.tallyCard}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.cardHeaderTitle}>Spending Heat Map</Text>
                    <Text style={styles.cardSubTitle}>When you spend the most</Text>
                  </View>
                </View>
                <HeatMap heatmapData={activeDashboardData.heatmap} />
                <View style={styles.bannerContainer}>
                  <Text style={{ fontSize: 11, color: '#706870', marginRight: 6 }}>🕒</Text>
                  <Text style={styles.bannerText}>{activeDashboardData.heatmap.banner}</Text>
                </View>
              </View>

              {/* Smart Trends Card */}
              <View style={styles.tallyCard}>
                <Text style={styles.cardHeaderTitle}>Smart Trends</Text>
                <View style={{ gap: 10, marginVertical: 8 }}>
                  {activeDashboardData.insights.map((ins, idx) => (
                    <View key={idx} style={styles.insightItem}>
                      <View style={[
                        styles.insightIconBox,
                        ins.type === 'transport' && { backgroundColor: '#f3edf3' },
                        ins.type === 'savings' && { backgroundColor: '#eaf6ec' },
                        ins.type === 'card' && { backgroundColor: '#fdf0ee' }
                      ]}>
                        {ins.type === 'transport' && <IconCar size={16} color="#3d2e3c" />}
                        {ins.type === 'savings' && <IconPiggy size={16} color="#34a853" />}
                        {ins.type === 'card' && <IconCard size={16} color="#ea4335" />}
                      </View>
                      <Text style={styles.insightText}>{ins.text}</Text>
                      <View style={[
                        styles.insightBadge,
                        { backgroundColor: ins.typeColor === 'danger' ? '#fdf0ee' : '#eaf6ec' }
                      ]}>
                        <Text style={[
                          styles.insightBadgeText,
                          { color: ins.typeColor === 'danger' ? '#ea4335' : '#34a853' }
                        ]}>{ins.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.footerLinkBtn} onPress={() => setActiveTab('home')}>
                  <Text style={styles.footerLinkText}>View all insights</Text>
                  <ChevronRight size={10} color="#706870" />
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        )}

        {/* 5. MORE / SETTINGS SCREEN */}
        {activeTab === 'more' && (
          <SettingsView 
            onResetData={handleResetData} 
            currencySymbol={currencySymbol}
            onChangeCurrencySymbol={setCurrencySymbol}
          />
        )}

      </View>

      {/* Global Bottom Tab Bar Navigation */}
      <View style={styles.bottomTabBar}>
        {[
          { id: 'home', label: 'Home', icon: (act) => <IconHome active={act} /> },
          { id: 'expenses', label: 'Expenses', icon: (act) => <IconExpenses active={act} /> },
          { id: 'budget', label: 'Budget', icon: (act) => <IconBudget active={act} /> },
          { id: 'analytics', label: 'Analytics', icon: (act) => <IconAnalytics active={act} /> },
          { id: 'more', label: 'More', icon: (act) => <IconMore active={act} /> }
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={styles.tabItem}
          >
            {tab.icon(activeTab === tab.id)}
            <Text style={[styles.tabItemText, activeTab === tab.id && { color: '#3d2e3c', fontWeight: '700' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

    </SafeAreaView>
  );
}

/* ==========================================================================
   STYLE SHEET DEFINITIONS
   ========================================================================== */
const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 36, // space for camera notch
  },
  navbarHeader: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1eef0',
    backgroundColor: '#ffffff',
  },
  navbarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f1a1f',
  },
  headerBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  screenBody: {
    flex: 1,
    backgroundColor: '#f8f8fa',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  bottomTabBar: {
    height: 64,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1eef0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: 55,
  },
  tabItemText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#b0aab0',
  },

  // Analytics tab styling
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  timeframeCapsule: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: '#f1eef0',
  },
  timeframeTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  timeframeTabActive: {
    backgroundColor: '#3d2e3c',
  },
  timeframeTabText: {
    fontSize: 10,
    color: '#706870',
    fontWeight: '500',
  },
  timeframeTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dateSelectorBtn: {
    borderWidth: 1,
    borderColor: '#f1eef0',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateSelectorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1f1a1f',
  },
  dateDropdown: {
    position: 'absolute',
    right: 0,
    top: '105%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#f1eef0',
    zIndex: 60,
    width: 180,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  dateDropdownItem: {
    width: 52,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  dateDropdownItemText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1f1a1f',
  },

  // Cards layout
  tallyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1eef0',
    shadowColor: '#3d2e3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f1a1f',
    marginBottom: 8,
  },
  cardSubTitle: {
    fontSize: 8,
    color: '#706870',
    marginTop: 1,
  },
  miniSelector: {
    borderWidth: 1,
    borderColor: '#f1eef0',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  miniSelectorText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#706870',
  },

  // Health Score internals
  healthWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  bigScore: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1f1a1f',
  },
  scoreScale: {
    fontSize: 13,
    fontWeight: '500',
    color: '#b0aab0',
  },
  scoreSubText: {
    fontSize: 9,
    color: '#706870',
    marginTop: 2,
    lineHeight: 12,
  },
  diffBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  diffBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  gaugeBox: {
    alignItems: 'center',
    width: 120,
  },
  gaugeStatusLabel: {
    alignItems: 'center',
    marginTop: 2,
  },
  gaugeStatusTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1f1a1f',
  },
  gaugeStatusSub: {
    fontSize: 8,
    color: '#706870',
    textAlign: 'center',
  },
  metricsList: {
    borderTopWidth: 1,
    borderTopColor: '#f1eef0',
    paddingTop: 10,
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricName: {
    fontSize: 9,
    color: '#706870',
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1f1a1f',
  },
  metricChangeBadge: {
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  metricChangeText: {
    fontSize: 8,
    fontWeight: '700',
  },

  // Trends
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#706870',
  },

  // Banner
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8fa',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  bannerText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1f1a1f',
  },

  // Smart insights
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#faf9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1eef0',
  },
  insightIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: 9.5,
    color: '#1f1a1f',
    paddingHorizontal: 8,
  },
  insightBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  insightBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },

  // footer link
  footerLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1eef0',
    paddingTop: 10,
    marginTop: 10,
  },
  footerLinkText: {
    fontSize: 10,
    color: '#706870',
    fontWeight: '600',
  }
});
