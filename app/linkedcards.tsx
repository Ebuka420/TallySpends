import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

interface LinkedCard {
  id: string;
  bank: string;
  type: string;
  network: "mastercard" | "visa" | "verve";
  last4: string;
  expiry: string;
  cardHolder: string;
  spentThisMonth: number;
  txnCount: number;
  status: "Active" | "Frozen";
  isPrimary?: boolean;
  brandColor: string;
  cardBgGradient: [string, string];
  recentTxns: { name: string; amt: string; date: string }[];
}

const INITIAL_CARDS: LinkedCard[] = [
  {
    id: "card-1",
    bank: "GTBank",
    type: "Mastercard Debit",
    network: "mastercard",
    last4: "4821",
    expiry: "09/28",
    cardHolder: "EBUKA DANIEL",
    spentThisMonth: 142500,
    txnCount: 14,
    status: "Active",
    isPrimary: true,
    brandColor: "#DD4F05",
    cardBgGradient: ["#E65100", "#BF360C"],
    recentTxns: [
      { name: "Shoprite Victoria Island", amt: "₦34,200", date: "Today, 2:15 PM" },
      { name: "TotalEnergies Fuel", amt: "₦18,000", date: "Yesterday" },
      { name: "Netflix Subscription", amt: "₦5,500", date: "Aug 22" },
    ],
  },
  {
    id: "card-2",
    bank: "Zenith Bank",
    type: "Classic Visa Debit",
    network: "visa",
    last4: "8912",
    expiry: "11/27",
    cardHolder: "EBUKA DANIEL",
    spentThisMonth: 68200,
    txnCount: 6,
    status: "Active",
    isPrimary: false,
    brandColor: "#C8102E",
    cardBgGradient: ["#991B1B", "#450A0A"],
    recentTxns: [
      { name: "Spar Lekki Mall", amt: "₦28,400", date: "Aug 20" },
      { name: "Ikeja Electric Token", amt: "₦20,000", date: "Aug 15" },
    ],
  },
  {
    id: "card-3",
    bank: "Kuda Microfinance",
    type: "Virtual Naira Card",
    network: "visa",
    last4: "1044",
    expiry: "04/29",
    cardHolder: "EBUKA DANIEL",
    spentThisMonth: 24800,
    txnCount: 9,
    status: "Active",
    isPrimary: false,
    brandColor: "#40196D",
    cardBgGradient: ["#3B0764", "#1E1B4B"],
    recentTxns: [
      { name: "Spotify Premium", amt: "₦1,800", date: "Aug 18" },
      { name: "Uber Ride", amt: "₦4,500", date: "Aug 16" },
      { name: "Apple Services", amt: "₦3,900", date: "Aug 10" },
    ],
  },
];

export default function LinkedCardsScreen() {
  const router = useRouter();
  const { themePreference, themeMode } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const [cards, setCards] = useState<LinkedCard[]>(INITIAL_CARDS);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Card Form State
  const [newBank, setNewBank] = useState("Access Bank");
  const [newNumber, setNewNumber] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [newHolder, setNewHolder] = useState("EBUKA DANIEL");
  const [newNetwork, setNewNetwork] = useState<"mastercard" | "visa" | "verve">("mastercard");

  const totalCardSpent = useMemo(() => {
    return cards.reduce((acc, c) => acc + c.spentThisMonth, 0);
  }, [cards]);

  const totalTxnCount = useMemo(() => {
    return cards.reduce((acc, c) => acc + c.txnCount, 0);
  }, [cards]);

  const toggleFreezeCard = (id: string) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "Active" ? "Frozen" : "Active";
          Alert.alert(
            nextStatus === "Frozen" ? "Card Frozen" : "Card Reactivated",
            `Card ending in •••• ${c.last4} is now ${nextStatus.toLowerCase()}.`,
          );
          return { ...c, status: nextStatus };
        }
        return c;
      }),
    );
  };

  const setPrimaryCard = (id: string) => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        isPrimary: c.id === id,
      })),
    );
    Alert.alert("Primary Card Updated", "This card is now your default payment method.");
  };

  const handleAddCard = () => {
    const rawNumber = newNumber.replace(/\s/g, "");
    if (rawNumber.length < 4) {
      Alert.alert("Invalid Card Number", "Please enter a valid card number.");
      return;
    }
    const last4 = rawNumber.slice(-4);
    const newCard: LinkedCard = {
      id: `card-${Date.now()}`,
      bank: newBank,
      type: `${newNetwork === "mastercard" ? "Mastercard" : newNetwork === "visa" ? "Visa" : "Verve"} Debit`,
      network: newNetwork,
      last4,
      expiry: newExpiry.trim() || "12/29",
      cardHolder: newHolder.toUpperCase().trim() || "EBUKA DANIEL",
      spentThisMonth: 0,
      txnCount: 0,
      status: "Active",
      isPrimary: false,
      brandColor: "#0284C7",
      cardBgGradient: ["#0369A1", "#075985"],
      recentTxns: [],
    };

    setCards((prev) => [...prev, newCard]);
    setShowAddModal(false);
    setNewNumber("");
    setNewExpiry("");
    Alert.alert("Success", `Your ${newBank} card has been linked successfully!`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Linked Cards & Activity
        </Text>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={26} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Spend Hero */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.heroMetaLabel, { color: theme.textSecondary }]}>
            TOTAL CARD EXPENDITURE THIS MONTH
          </Text>
          <Text style={[styles.heroBigAmount, { color: theme.textPrimary }]}>
            ₦{totalCardSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
          <View style={styles.heroFooterRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="card-outline" size={15} color={theme.accent} />
              <Text style={[styles.heroSubText, { color: theme.textSecondary }]}>
                {cards.length} Linked Cards Active
              </Text>
            </View>
            <Text style={[styles.heroTxnCount, { color: theme.accent }]}>
              {totalTxnCount} Total Card Transactions
            </Text>
          </View>
        </View>

        {/* Link New Card Button */}
        <TouchableOpacity
          style={[styles.linkNewCardBtn, { backgroundColor: theme.accent }]}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.linkNewCardBtnText}>Link New Debit / Credit Card</Text>
        </TouchableOpacity>

        {/* Card Stack / Carousel */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Your Payment Cards
        </Text>

        <View style={{ gap: 18 }}>
          {cards.map((card) => {
            const isFrozen = card.status === "Frozen";

            return (
              <View
                key={card.id}
                style={[
                  styles.cardContainer,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    opacity: isFrozen ? 0.75 : 1,
                  },
                ]}
              >
                {/* Physical-Style Visual Card */}
                <View
                  style={[
                    styles.physicalCard,
                    {
                      backgroundColor: card.cardBgGradient[0],
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {/* Top Bar */}
                  <View style={styles.physicalCardTop}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={styles.physicalBankText}>{card.bank}</Text>
                      {card.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.contactlessRow}>
                      <Ionicons name="wifi" size={18} color="#FFFFFF" style={{ transform: [{ rotate: "90deg" }] }} />
                      <View style={[styles.statusBadge, isFrozen ? styles.statusFrozen : styles.statusActive]}>
                        <Text style={[styles.statusBadgeText, isFrozen ? styles.statusFrozenText : styles.statusActiveText]}>
                          {card.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* EMV Chip & NFC */}
                  <View style={styles.chipRow}>
                    <View style={styles.emvChip}>
                      <View style={styles.chipLineHorizontal} />
                      <View style={styles.chipLineVertical} />
                    </View>
                  </View>

                  {/* Card Number */}
                  <Text style={styles.physicalCardNumber}>
                    ••••  ••••  ••••  {card.last4}
                  </Text>

                  {/* Cardholder & Expiry & Network */}
                  <View style={styles.physicalCardBottom}>
                    <View>
                      <Text style={styles.physicalCardMetaLabel}>CARDHOLDER</Text>
                      <Text style={styles.physicalCardHolder} numberOfLines={1}>
                        {card.cardHolder}
                      </Text>
                    </View>

                    <View style={{ alignItems: "center" }}>
                      <Text style={styles.physicalCardMetaLabel}>EXPIRES</Text>
                      <Text style={styles.physicalCardExpiry}>{card.expiry}</Text>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.networkLabel}>
                        {card.network.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Card Quick Action Bar */}
                <View style={styles.cardActionsBar}>
                  <TouchableOpacity
                    style={[styles.cardActionBtn, { backgroundColor: theme.surfaceSoft }]}
                    onPress={() => toggleFreezeCard(card.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isFrozen ? "lock-open-outline" : "lock-closed-outline"}
                      size={16}
                      color={isFrozen ? theme.success : theme.danger || "#EF4444"}
                    />
                    <Text
                      style={[
                        styles.cardActionText,
                        { color: isFrozen ? theme.success : theme.danger || "#EF4444" },
                      ]}
                    >
                      {isFrozen ? "Unfreeze" : "Freeze"}
                    </Text>
                  </TouchableOpacity>

                  {!card.isPrimary && (
                    <TouchableOpacity
                      style={[styles.cardActionBtn, { backgroundColor: theme.surfaceSoft }]}
                      onPress={() => setPrimaryCard(card.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="star-outline" size={16} color={theme.accent} />
                      <Text style={[styles.cardActionText, { color: theme.accent }]}>
                        Set Default
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.cardActionBtn, { backgroundColor: theme.surfaceSoft }]}
                    onPress={() => {
                      Alert.alert(
                        "Card Details",
                        `Bank: ${card.bank}\nType: ${card.type}\nStatus: ${card.status}\nSpent This Month: ₦${card.spentThisMonth.toLocaleString()}`,
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="information-circle-outline" size={16} color={theme.textPrimary} />
                    <Text style={[styles.cardActionText, { color: theme.textPrimary }]}>
                      Details
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Monthly spend metric */}
                <View style={styles.cardMetricsRow}>
                  <View>
                    <Text style={[styles.cardMetricLabel, { color: theme.textSecondary }]}>
                      This Month's Spending
                    </Text>
                    <Text style={[styles.cardMetricValue, { color: theme.textPrimary }]}>
                      ₦{card.spentThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.cardMetricLabel, { color: theme.textSecondary }]}>
                      Transactions
                    </Text>
                    <Text style={[styles.cardMetricValue, { color: theme.accent }]}>
                      {card.txnCount} purchases
                    </Text>
                  </View>
                </View>

                {/* Recent card activity */}
                {card.recentTxns.length > 0 && (
                  <View style={[styles.recentTxnBlock, { borderTopColor: theme.border }]}>
                    <Text style={[styles.recentTxnHeader, { color: theme.textSecondary }]}>
                      Recent Card Activity
                    </Text>
                    {card.recentTxns.map((tx, idx) => (
                      <View key={idx} style={styles.recentTxnRow}>
                        <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                          <Text
                            style={[styles.recentTxnName, { color: theme.textPrimary }]}
                            numberOfLines={1}
                          >
                            {tx.name}
                          </Text>
                          <Text style={[styles.recentTxnDate, { color: theme.textSecondary }]}>
                            {tx.date}
                          </Text>
                        </View>
                        <Text style={[styles.recentTxnAmt, { color: theme.textPrimary }]}>
                          {tx.amt}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Add Card Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Link New Card</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Bank Name */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Bank Institution</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceSoft, borderColor: theme.border, color: theme.textPrimary }]}
                value={newBank}
                onChangeText={setNewBank}
                placeholder="e.g. Access Bank, First Bank"
                placeholderTextColor={theme.textSecondary}
              />

              {/* Cardholder Name */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Cardholder Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceSoft, borderColor: theme.border, color: theme.textPrimary }]}
                value={newHolder}
                onChangeText={setNewHolder}
                placeholder="Full Name as on card"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
              />

              {/* Card Number */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Card Number (16 Digits)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceSoft, borderColor: theme.border, color: theme.textPrimary }]}
                value={newNumber}
                onChangeText={setNewNumber}
                placeholder="5399 •••• •••• ••••"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={19}
              />

              {/* Expiry Date */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Expiry (MM/YY)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceSoft, borderColor: theme.border, color: theme.textPrimary }]}
                value={newExpiry}
                onChangeText={setNewExpiry}
                placeholder="MM/YY"
                placeholderTextColor={theme.textSecondary}
                maxLength={5}
              />

              {/* Network */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Card Network</Text>
              <View style={styles.networkSelectRow}>
                {(["mastercard", "visa", "verve"] as const).map((net) => (
                  <TouchableOpacity
                    key={net}
                    onPress={() => setNewNetwork(net)}
                    style={[
                      styles.networkSelectBtn,
                      {
                        backgroundColor: newNetwork === net ? theme.accent : theme.surfaceSoft,
                        borderColor: theme.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.networkSelectText,
                        { color: newNetwork === net ? "#FFFFFF" : theme.textPrimary },
                      ]}
                    >
                      {net.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitAddBtn, { backgroundColor: theme.accent }]}
                onPress={handleAddCard}
                activeOpacity={0.85}
              >
                <Text style={styles.submitAddBtnText}>Link Card Securely</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  heroCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  heroMetaLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  heroBigAmount: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroSubText: {
    fontSize: 12,
    fontWeight: "600",
  },
  heroTxnCount: {
    fontSize: 12,
    fontWeight: "700",
  },
  linkNewCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  linkNewCardBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  cardContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 6,
  },
  physicalCard: {
    borderRadius: 16,
    padding: 18,
    minHeight: 185,
    justifyContent: "space-between",
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  physicalCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  physicalBankText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  primaryBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  contactlessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: "rgba(34, 197, 94, 0.25)",
  },
  statusFrozen: {
    backgroundColor: "rgba(239, 68, 68, 0.35)",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  statusActiveText: {
    color: "#4ADE80",
  },
  statusFrozenText: {
    color: "#FCA5A5",
  },
  chipRow: {
    marginVertical: 4,
  },
  emvChip: {
    width: 38,
    height: 28,
    backgroundColor: "#E2B857",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C49A3E",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  chipLineHorizontal: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "#A87E28",
  },
  chipLineVertical: {
    position: "absolute",
    height: "100%",
    width: 1,
    backgroundColor: "#A87E28",
  },
  physicalCardNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 3,
    fontVariant: ["tabular-nums"],
    marginVertical: 8,
  },
  physicalCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  physicalCardMetaLabel: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 8.5,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  physicalCardHolder: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    maxWidth: 140,
  },
  physicalCardExpiry: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  networkLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 1,
  },
  cardActionsBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardMetricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardMetricLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardMetricValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  recentTxnBlock: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 8,
  },
  recentTxnHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  recentTxnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentTxnName: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  recentTxnDate: {
    fontSize: 10.5,
    marginTop: 2,
  },
  recentTxnAmt: {
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: "85%",
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "600",
  },
  networkSelectRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  networkSelectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  networkSelectText: {
    fontSize: 12,
    fontWeight: "800",
  },
  submitAddBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  submitAddBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
