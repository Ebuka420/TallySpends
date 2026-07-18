import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, Modal, Dimensions, Pressable 
} from 'react-native';
import { 
  Plus, Trash, ChevronRight, IconPiggy, IconCard, Search,
  Gear, UserCircle, ShieldCheck, Headphones, Crown, Users, Gift, StarOutline
} from '../icons';

const screenWidth = Dimensions.get('window').width;

// Helper to format currency
const formatCurrency = (val, symbol = '$') => {
  return `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/* ==========================================================================
   HOME VIEW
   ========================================================================== */
export const HomeView = ({ balance, transactions, onNavigateToTab, currencySymbol }) => {
  return (
    <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
      
      {/* Welcome Header */}
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>Alex Mercer</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>AM</Text>
        </View>
      </View>

      {/* Credit Card Mockup */}
      <View style={styles.creditCard}>
        <View style={styles.cardTopRow}>
          <View>
            <Text style={styles.cardBalanceLabel}>Total Balance</Text>
            <Text style={styles.cardBalanceValue}>{formatCurrency(balance, currencySymbol)}</Text>
          </View>
          <Text style={styles.cardLogo}>tally.</Text>
        </View>

        <View style={styles.cardBottomRow}>
          <View>
            <Text style={styles.cardNumber}>•••• •••• •••• 5682</Text>
            <Text style={styles.cardHolder}>Alex Mercer</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardExpiryLabel}>EXPIRES</Text>
            <Text style={styles.cardExpiryValue}>09/28</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions Row */}
      <View style={styles.quickActionsRow}>
        {[
          { label: "Add Exp", action: () => onNavigateToTab('expenses'), bg: '#f5eff3', color: '#3d2e3c', icon: <Plus size={16} color="#3d2e3c" /> },
          { label: "Budgets", action: () => onNavigateToTab('budget'), bg: '#eaf6ec', color: '#34a853', icon: <IconPiggy size={16} color="#34a853" /> },
          { label: "Analytics", action: () => onNavigateToTab('analytics'), bg: '#fdf0ee', color: '#ea4335', icon: <IconCard size={16} color="#ea4335" /> },
          { label: "Limits", action: () => onNavigateToTab('budget'), bg: '#f4f6fc', color: '#3f51b5', icon: <ChevronRight size={14} color="#3f51b5" /> }
        ].map((act, i) => (
          <TouchableOpacity
            key={i}
            onPress={act.action}
            style={styles.quickActionBtn}
          >
            <View style={[styles.quickActionIconCircle, { backgroundColor: act.bg }]}>
              {act.icon}
            </View>
            <Text style={styles.quickActionLabel}>{act.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Activity List Card */}
      <View style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => onNavigateToTab('expenses')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {transactions.slice(0, 4).map((tx) => (
            <View key={tx.id} style={styles.activityRow}>
              <View style={styles.activityRowLeft}>
                <View style={[
                  styles.txIndicator, 
                  { backgroundColor: tx.type === 'income' ? '#eaf6ec' : '#f5eff3' }
                ]}>
                  <Text style={[styles.txIndicatorText, { color: tx.type === 'income' ? '#34a853' : '#3d2e3c' }]}>
                    {tx.category ? tx.category.charAt(0) : 'T'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={styles.txSubtitle}>{tx.date} • {tx.category}</Text>
                </View>
              </View>
              <Text style={[
                styles.txAmountText, 
                { color: tx.type === 'income' ? '#34a853' : '#1f1a1f' }
              ]}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currencySymbol)}
              </Text>
            </View>
          ))}
          {transactions.length === 0 && (
            <Text style={styles.emptyText}>No transactions recorded yet.</Text>
          )}
        </View>
      </View>

    </ScrollView>
  );
};


/* ==========================================================================
   EXPENSES VIEW (LEDGER + ADD FORM)
   ========================================================================== */
export const ExpensesView = ({ transactions, onAddTransaction, onDeleteTransaction, currencySymbol }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form States
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Food & Dining');
  const [txType, setTxType] = useState('expense');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Custom Category Dropdown selector simulation
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const categories = [
    'Food & Dining',
    'Transport',
    'Shopping',
    'Bills & Utilities',
    'Entertainment',
    'Others'
  ];

  const handleSubmit = () => {
    if (!txTitle || !txAmount) return;

    onAddTransaction({
      title: txTitle,
      amount: parseFloat(txAmount),
      category: txType === 'income' ? 'Income' : txCategory,
      type: txType,
      date: txDate
    });

    // Reset Form
    setTxTitle('');
    setTxAmount('');
    setTxType('expense');
    setTxCategory('Food & Dining');
    setIsModalOpen(false);
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || tx.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      
      {/* Header Row */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Transactions</Text>
        <TouchableOpacity
          onPress={() => setIsModalOpen(true)}
          style={styles.addBtn}
        >
          <Plus size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Search Row */}
      <View style={styles.searchContainer}>
        <View style={styles.searchIconBox}>
          <Search size={16} color="#706870" />
        </View>
        <TextInput
          placeholder="Search items, categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          placeholderTextColor="#b0aab0"
        />
      </View>

      {/* Category horizontal tag scroller */}
      <View style={{ height: 38, marginBottom: 12 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagScroll}
        >
          {['All', ...categories, 'Income'].map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setFilterCategory(cat)}
              style={[
                styles.tagBtn,
                filterCategory === cat && styles.tagBtnActive
              ]}
            >
              <Text style={[
                styles.tagText,
                filterCategory === cat && styles.tagTextActive
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List Container */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.ledgerCard}>
          {filteredTransactions.map(tx => (
            <View key={tx.id} style={styles.ledgerRow}>
              <View style={styles.activityRowLeft}>
                <View style={[
                  styles.txIndicator, 
                  { backgroundColor: tx.type === 'income' ? '#eaf6ec' : '#f5eff3' }
                ]}>
                  <Text style={[styles.txIndicatorText, { color: tx.type === 'income' ? '#34a853' : '#3d2e3c' }]}>
                    {tx.category ? tx.category.charAt(0) : 'T'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={styles.txSubtitle}>{tx.date} • {tx.category}</Text>
                </View>
              </View>

              <View style={styles.activityRowRight}>
                <Text style={[
                  styles.txAmountText, 
                  { color: tx.type === 'income' ? '#34a853' : '#1f1a1f' }
                ]}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currencySymbol)}
                </Text>
                <TouchableOpacity
                  onPress={() => onDeleteTransaction(tx.id)}
                  style={styles.deleteBtn}
                >
                  <Trash size={14} color="#ea4335" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {filteredTransactions.length === 0 && (
            <Text style={styles.emptyText}>No matching logs found.</Text>
          )}
        </View>
      </ScrollView>

      {/* Add Transaction Modal Overlay */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <Pressable 
          style={styles.modalBackdrop}
          onPress={() => setIsModalOpen(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Transaction</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Toggle switch Expense/Income */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                onPress={() => setTxType('expense')}
                style={[
                  styles.toggleBtn,
                  txType === 'expense' && { backgroundColor: '#3d2e3c' }
                ]}
              >
                <Text style={[
                  styles.toggleBtnText,
                  txType === 'expense' && { color: '#ffffff' }
                ]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTxType('income')}
                style={[
                  styles.toggleBtn,
                  txType === 'income' && { backgroundColor: '#34a853' }
                ]}
              >
                <Text style={[
                  styles.toggleBtnText,
                  txType === 'income' && { color: '#ffffff' }
                ]}>Income</Text>
              </TouchableOpacity>
            </View>

            {/* Input fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Transaction Title</Text>
              <TextInput
                placeholder="e.g. Starbucks, Gas Station..."
                value={txTitle}
                onChangeText={setTxTitle}
                style={styles.textField}
                placeholderTextColor="#b0aab0"
              />
            </View>

            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Amount ({currencySymbol})</Text>
                <TextInput
                  placeholder="0.00"
                  value={txAmount}
                  onChangeText={setTxAmount}
                  keyboardType="numeric"
                  style={styles.textField}
                  placeholderTextColor="#b0aab0"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  value={txDate}
                  onChangeText={setTxDate}
                  placeholder="YYYY-MM-DD"
                  style={styles.textField}
                  placeholderTextColor="#b0aab0"
                />
              </View>
            </View>

            {txType === 'expense' && (
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Category</Text>
                <TouchableOpacity
                  onPress={() => setShowCategorySelector(!showCategorySelector)}
                  style={styles.selectorAnchor}
                >
                  <Text style={{ fontSize: 13, color: '#1f1a1f' }}>{txCategory}</Text>
                  <Text style={{ fontSize: 10, color: '#706870' }}>▼</Text>
                </TouchableOpacity>

                {showCategorySelector && (
                  <View style={styles.selectorDropdown}>
                    {categories.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => {
                          setTxCategory(cat);
                          setShowCategorySelector(false);
                        }}
                        style={styles.selectorItem}
                      >
                        <Text style={{ fontSize: 12, color: '#1f1a1f' }}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.saveBtn,
                { backgroundColor: txType === 'income' ? '#34a853' : '#3d2e3c' }
              ]}
            >
              <Text style={styles.saveBtnText}>Save Transaction</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
};


/* ==========================================================================
   BUDGETS VIEW
   ========================================================================== */
export const BudgetView = ({ categorySpending, budgets, onUpdateBudget, currencySymbol }) => {
  const [editingCategory, setEditingCategory] = useState(null);
  const [newLimit, setNewLimit] = useState('');

  const handleEditBudget = (cat, currentLimit) => {
    setEditingCategory(cat);
    setNewLimit(String(currentLimit));
  };

  const handleSaveBudget = () => {
    if (!newLimit || isNaN(newLimit)) return;
    onUpdateBudget(editingCategory, parseFloat(newLimit));
    setEditingCategory(null);
  };

  return (
    <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Monthly Limits</Text>

      <View style={{ gap: 12, marginVertical: 12 }}>
        {Object.keys(budgets).map(cat => {
          const limit = budgets[cat] || 0;
          const spent = categorySpending[cat] || 0;
          const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
          
          let progressColor = '#3d2e3c';
          if (percentage > 90) progressColor = '#ea4335';
          else if (percentage > 70) progressColor = '#e07d3c';

          return (
            <View key={cat} style={styles.budgetItemCard}>
              <View style={styles.budgetCardTop}>
                <View>
                  <Text style={styles.budgetName}>{cat}</Text>
                  <Text style={styles.budgetPercent}>{percentage}% spent</Text>
                </View>
                <TouchableOpacity onPress={() => handleEditBudget(cat, limit)}>
                  <Text style={styles.budgetSetBtn}>Set Limit</Text>
                </TouchableOpacity>
              </View>

              {/* Progress Slider */}
              <View style={styles.progressBarBg}>
                <View style={[
                  styles.progressBarFill, 
                  { width: `${percentage}%`, backgroundColor: progressColor }
                ]} />
              </View>

              <View style={styles.budgetCardBottom}>
                <Text style={styles.budgetAmtText}>Spent: {formatCurrency(spent, currencySymbol)}</Text>
                <Text style={styles.budgetAmtText}>Limit: {formatCurrency(limit, currencySymbol)}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Edit Budget Dialog Limit Modal */}
      <Modal
        visible={editingCategory !== null}
        transparent
        animationType="fade"
      >
        <View style={styles.alertBackdrop}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Set Budget Limit</Text>
            <Text style={styles.alertSub}>Enter the new cap for {editingCategory}.</Text>
            
            <TextInput
              value={newLimit}
              onChangeText={setNewLimit}
              keyboardType="numeric"
              style={styles.alertInput}
            />

            <View style={styles.alertActions}>
              <TouchableOpacity onPress={() => setEditingCategory(null)}>
                <Text style={styles.alertCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveBudget} style={styles.alertSaveBtn}>
                <Text style={styles.alertSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};


/* ==========================================================================
   SETTINGS/MORE VIEW
   ========================================================================== */
export const SettingsView = ({ onResetData, currencySymbol, onChangeCurrencySymbol }) => {
  const [showCurrencyOptions, setShowCurrencyOptions] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const currentLabel = currencySymbol === '$' ? 'USD ($)' : currencySymbol === '€' ? 'EUR (€)' : 'GBP (£)';

  const settingsItems = [
    {
      id: 'security',
      title: 'Security Center',
      desc: 'Manage your PIN, biometric login, and account security.',
      icon: <ShieldCheck size={20} color="#3d2e3c" />,
      iconBg: '#eae6f3',
    },
    {
      id: 'customer_service',
      title: 'Customer Service Center',
      desc: 'Get help, contact support and view common questions.',
      icon: <Headphones size={20} color="#6d536a" />,
      iconBg: '#f7ece1',
    },
    {
      id: 'premium',
      title: 'Premium Plan',
      desc: 'Unlock exclusive features and enhance your banking experience.',
      icon: <Crown size={20} color="#3d2e3c" />,
      iconBg: '#eae6f3',
    },
    {
      id: 'youngins',
      title: 'Youngins',
      desc: 'Open an account for someone below 18.',
      icon: <Users size={20} color="#1f1a1f" />,
      iconBg: '#e8f2ea',
    },
    {
      id: 'invitation',
      title: 'Invitation',
      desc: 'Invite friends and family and earn exciting rewards.',
      icon: <Gift size={20} color="#3d2e3c" />,
      iconBg: '#f7ebd9',
    },
    {
      id: 'rate_us',
      title: 'Rate Us',
      desc: 'Enjoying the app? Rate us on the App Store.',
      icon: <StarOutline size={20} color="#3d2e3c" />,
      iconBg: '#fceae8',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f8fa' }}>
      <ScrollView 
        style={styles.moreScrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Profile Row */}
        <View style={styles.profileRow}>
          <View style={styles.profileAvatarWrapper}>
            <View style={styles.profileAvatarCircle}>
              <UserCircle size={28} color="#5e4f6d" />
            </View>
            <Text style={styles.profileNameText}>Goziechi</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setShowPrefs(true)} 
            style={styles.gearBtn}
          >
            <Gear size={22} color="#1f1a1f" />
          </TouchableOpacity>
        </View>

        {/* List of Settings Cards */}
        <View style={styles.cardsContainer}>
          {settingsItems.map(item => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.settingsCard}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.cardIconContainer, { backgroundColor: item.iconBg }]}>
                  {item.icon}
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc}>{item.desc}</Text>
                </View>
              </View>
              <ChevronRight size={14} color="#b0aab0" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* System Preferences Modal Sheet */}
      <Modal
        visible={showPrefs}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrefs(false)}
      >
        <Pressable 
          style={styles.modalBackdrop}
          onPress={() => setShowPrefs(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>System Preferences</Text>
              <TouchableOpacity onPress={() => setShowPrefs(false)}>
                <Text style={styles.cancelText}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Currency selection row */}
            <View style={styles.prefRow}>
              <Text style={styles.prefRowLabel}>Primary Currency</Text>
              <TouchableOpacity 
                onPress={() => setShowCurrencyOptions(!showCurrencyOptions)}
                style={styles.prefSelectorAnchor}
              >
                <Text style={styles.prefSelectedText}>{currentLabel}</Text>
              </TouchableOpacity>
            </View>

            {showCurrencyOptions && (
              <View style={styles.currencyOptionsList}>
                {[
                  { code: 'USD', symbol: '$' },
                  { code: 'EUR', symbol: '€' },
                  { code: 'GBP', symbol: '£' }
                ].map(curr => (
                  <TouchableOpacity
                    key={curr.code}
                    onPress={() => {
                      onChangeCurrencySymbol(curr.symbol);
                      setShowCurrencyOptions(false);
                    }}
                    style={styles.currencyOptRow}
                  >
                    <Text style={{ fontSize: 12, color: '#1f1a1f' }}>{curr.code} ({curr.symbol})</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Biometric toggle */}
            <View style={styles.prefRow}>
              <Text style={styles.prefRowLabel}>Biometric Unlock</Text>
              <TouchableOpacity onPress={() => setBiometricEnabled(!biometricEnabled)}>
                <View style={biometricEnabled ? styles.mockSwitchActive : styles.mockSwitchInactive} />
              </TouchableOpacity>
            </View>

            {/* Version */}
            <View style={[styles.prefRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.prefRowLabel}>Version</Text>
              <Text style={styles.versionText}>1.4.0 (Stable)</Text>
            </View>

            {/* Reset ledger */}
            <TouchableOpacity 
              onPress={() => {
                onResetData();
                setShowPrefs(false);
              }}
              style={[styles.resetBtn, { marginTop: 15 }]}
            >
              <Text style={styles.resetBtnText}>Reset Demo Ledger</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

/* ==========================================================================
   STYLE DEFINITIONS
   ========================================================================== */
const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 11,
    color: '#706870',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f1a1f',
    marginTop: 2,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3d2e3c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  creditCard: {
    borderRadius: 20,
    backgroundColor: '#3d2e3c',
    padding: 18,
    height: 150,
    justifyContent: 'space-between',
    shadowColor: '#3d2e3c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 18,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardBalanceLabel: {
    fontSize: 9,
    color: '#b0aab0',
    textTransform: 'uppercase',
  },
  cardBalanceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  cardLogo: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    fontStyle: 'italic',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardNumber: {
    fontSize: 11,
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  cardHolder: {
    fontSize: 9,
    color: '#b0aab0',
    marginTop: 4,
  },
  cardExpiryLabel: {
    fontSize: 7,
    color: '#b0aab0',
  },
  cardExpiryValue: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '700',
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 18,
  },
  quickActionBtn: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#3d2e3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  quickActionIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1f1a1f',
  },
  activityCard: {
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
    marginBottom: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f1a1f',
  },
  seeAllText: {
    fontSize: 10,
    color: '#3d2e3c',
    fontWeight: '700',
  },
  activityList: {
    gap: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1eef0',
  },
  activityRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  txIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
  },
  txTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f1a1f',
  },
  txSubtitle: {
    fontSize: 8,
    color: '#706870',
    marginTop: 2,
  },
  txAmountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 11,
    color: '#706870',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Expenses View
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f1a1f',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3d2e3c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3d2e3c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1eef0',
    borderRadius: 14,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  searchIconBox: {
    width: 20,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
    color: '#1f1a1f',
    paddingVertical: 8,
    paddingLeft: 6,
  },
  tagScroll: {
    gap: 6,
    alignItems: 'center',
  },
  tagBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1eef0',
  },
  tagBtnActive: {
    backgroundColor: '#3d2e3c',
    borderColor: '#3d2e3c',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#706870',
  },
  tagTextActive: {
    color: '#ffffff',
  },
  ledgerCard: {
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
    marginBottom: 20,
    minHeight: 250,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1eef0',
  },
  activityRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    padding: 4,
    borderRadius: 4,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1f1a1f',
  },
  cancelText: {
    fontSize: 12,
    color: '#706870',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9fa',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#706870',
  },
  inputGroup: {
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#706870',
    marginBottom: 4,
  },
  textField: {
    borderWidth: 1,
    borderColor: '#f1eef0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1f1a1f',
  },
  selectorAnchor: {
    borderWidth: 1,
    borderColor: '#f1eef0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorDropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#f1eef0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 6,
    maxHeight: 120,
  },
  selectorItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fcfafc',
  },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },

  // Budgets View
  budgetItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1eef0',
    shadowColor: '#3d2e3c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  budgetCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1f1a1f',
  },
  budgetPercent: {
    fontSize: 8,
    color: '#706870',
    marginTop: 2,
  },
  budgetSetBtn: {
    fontSize: 9,
    fontWeight: '700',
    color: '#3d2e3c',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#f9f9fa',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetAmtText: {
    fontSize: 9,
    color: '#706870',
  },

  // Alert modals
  alertBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBox: {
    width: 260,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1f1a1f',
  },
  alertSub: {
    fontSize: 10,
    color: '#706870',
    marginTop: 4,
    marginBottom: 10,
  },
  alertInput: {
    borderWidth: 1,
    borderColor: '#f1eef0',
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
    color: '#1f1a1f',
    marginBottom: 12,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  alertCancel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#706870',
    padding: 6,
  },
  alertSaveBtn: {
    backgroundColor: '#3d2e3c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  alertSaveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 10,
  },

  // Settings
  settingsUserCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1eef0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  settingsAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3d2e3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f1a1f',
  },
  userEmailText: {
    fontSize: 9,
    color: '#706870',
    marginTop: 2,
  },
  prefsBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1eef0',
    marginBottom: 16,
  },
  prefsGroupHeader: {
    fontSize: 9,
    fontWeight: '700',
    color: '#706870',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fcfafc',
  },
  prefRowLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1f1a1f',
  },
  prefSelectorAnchor: {
    borderWidth: 1,
    borderColor: '#f1eef0',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
  },
  prefSelectedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3d2e3c',
  },
  currencyOptionsList: {
    paddingVertical: 4,
    paddingLeft: 10,
    gap: 4,
  },
  currencyOptRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#fdfbfe',
  },
  mockSwitchActive: {
    width: 26,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34a853',
  },
  versionText: {
    fontSize: 10,
    color: '#706870',
  },
  resetBtn: {
    borderWidth: 1,
    borderColor: '#ea4335',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#ea4335',
    fontWeight: '700',
    fontSize: 10,
  },
  moreScrollContainer: {
    flex: 1,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  profileAvatarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eae6f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1a1f',
  },
  gearBtn: {
    padding: 6,
  },
  cardsContainer: {
    gap: 12,
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f9f8fa',
    shadowColor: '#3d2e3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
    marginBottom: 4,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  cardIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f1a1f',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 9.5,
    color: '#706870',
    lineHeight: 13,
  },
  mockSwitchInactive: {
    width: 26,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#b0aab0',
  }
});
