import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.88;
const CARD_HEIGHT = 224;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

export interface LinkedCard {
  id: string;
  bank: string;
  type: string;
  network: "mastercard" | "visa" | "verve";
  fullCardNumber: string;
  last4: string;
  expiry: string;
  cvv: string;
  cardHolder: string;
  spentThisMonth: number;
  monthlyBudget: number;
  txnCount: number;
  status: "Active" | "Frozen";
  isPrimary?: boolean;
  brandColor: string;
  cardBgGradient: [string, string];
  tiltAngle: string;
  smartInsight: {
    headline: string;
    subtext: string;
    category: string;
    icon: keyof typeof Ionicons.glyphMap;
  };
  recentTxns: { name: string; amt: string; date: string }[];
}

const INITIAL_CARDS: LinkedCard[] = [
  {
    id: "card-1",
    bank: "Access Bank",
    type: "Premium Visa Debit",
    network: "visa",
    fullCardNumber: "5399 4821 9081 4821",
    last4: "4821",
    expiry: "09/28",
    cvv: "382",
    cardHolder: "EBUKA DANIEL",
    spentThisMonth: 124300,
    monthlyBudget: 250000,
    txnCount: 14,
    status: "Active",
    isPrimary: true,
    brandColor: "#DD4F05",
    cardBgGradient: ["#2B170E", "#150B07"],
    tiltAngle: "0deg",
    smartInsight: {
      headline: "Netflix subscription due tomorrow",
      subtext: "Autopay of ₦4,500 will be debited from this card.",
      category: "Bills & Subscriptions",
      icon: "calendar-outline",
    },
    recentTxns: [
      { name: "Shoprite Victoria Island", amt: "₦34,200", date: "Today, 2:15 PM" },
      { name: "TotalEnergies Fuel", amt: "₦18,000", date: "Yesterday" },
      { name: "Netflix Subscription", amt: "₦4,500", date: "Aug 22" },
    ],
  },
  {
    id: "card-2",
    bank: "GTBank Spend & Dine",
    type: "Mastercard World Debit",
    network: "mastercard",
    fullCardNumber: "5120 7739 6543 7739",
    last4: "7739",
    expiry: "11/27",
    cvv: "619",
    cardHolder: "EBUKA DANIEL",
    spentThisMonth: 188400,
    monthlyBudget: 200000,
    txnCount: 18,
    status: "Active",
    isPrimary: false,
    brandColor: "#EF4444",
    cardBgGradient: ["#38151D", "#1E0A0F"],
    tiltAngle: "-4deg",
    smartInsight: {
      headline: "Food spending is up by 24%",
      subtext: "₦42,000 spent on food delivery this week vs ₦31,000 last week.",
      category: "Food & Dining",
      icon: "restaurant-outline",
    },
    recentTxns: [
      { name: "Uber Eats Lagos", amt: "₦12,500", date: "Aug 24" },
      { name: "The Place Restaurant", amt: "₦8,400", date: "Aug 21" },
      { name: "Spar Lekki Mall", amt: "₦28,400", date: "Aug 20" },
    ],
  },
  {
    id: "card-3",
    bank: "Kuda Smart Save",
    type: "Virtual Naira Card",
    network: "visa",
    fullCardNumber: "4124 1092 8840 1092",
    last4: "1092",
    expiry: "04/29",
    cvv: "104",
    cardHolder: "EBUKA DANIEL",
    spentThisMonth: 32100,
    monthlyBudget: 150000,
    txnCount: 9,
    status: "Active",
    isPrimary: false,
    brandColor: "#10B981",
    cardBgGradient: ["#143324", "#0C1D14"],
    tiltAngle: "3.5deg",
    smartInsight: {
      headline: "₦96 away from monthly savings goal",
      subtext: "A calm week! Spending is 18% lower than your benchmark.",
      category: "Savings & Ajo",
      icon: "sparkles-outline",
    },
    recentTxns: [
      { name: "Spotify Premium", amt: "₦1,800", date: "Aug 18" },
      { name: "Apple Services", amt: "₦3,900", date: "Aug 10" },
      { name: "Auto-Save Sweep", amt: "₦15,000", date: "Aug 05" },
    ],
  },
  {
    id: "card-4",
    bank: "Zenith Virtual Dollar",
    type: "Classic Dollar Visa",
    network: "visa",
    fullCardNumber: "4000 6044 1928 6044",
    last4: "6044",
    expiry: "12/28",
    cvv: "925",
    cardHolder: "EBUKA DANIEL",
    spentThisMonth: 78500,
    monthlyBudget: 150000,
    txnCount: 5,
    status: "Active",
    isPrimary: false,
    brandColor: "#8B5CF6",
    cardBgGradient: ["#281C38", "#150D20"],
    tiltAngle: "-3deg",
    smartInsight: {
      headline: "AWS & Cloud renewed at $89.00",
      subtext: "FX rate optimized at ₦1,480/USD with zero foreign markup.",
      category: "Cloud & Tech Ops",
      icon: "cloud-done-outline",
    },
    recentTxns: [
      { name: "AWS Cloud Infrastructure", amt: "$89.00", date: "Aug 20" },
      { name: "Figma Team Seat", amt: "$45.00", date: "Aug 15" },
    ],
  },
];

// --- CARD FACE RENDERER ---
const PhysicalCardFace = ({
  card,
  isDetailMode = false,
  isNumberRevealed = false,
  onToggleRevealNumber,
  theme,
  onToggleFreeze,
  onSetPrimary,
  onCloseDetail,
}: {
  card: LinkedCard;
  isDetailMode?: boolean;
  isNumberRevealed?: boolean;
  onToggleRevealNumber?: () => void;
  theme: ReturnType<typeof getThemePalette>;
  onToggleFreeze?: (id: string) => void;
  onSetPrimary?: (id: string) => void;
  onCloseDetail?: () => void;
}) => {
  const isFrozen = card.status === "Frozen";
  const budgetUsage = Math.min(card.spentThisMonth / (card.monthlyBudget || 1), 1);

  const displayNumber = isNumberRevealed
    ? card.fullCardNumber
    : `••••  ••••  ••••  ${card.last4}`;

  const copyFullNumber = async () => {
    const rawNumber = card.fullCardNumber.replace(/\s/g, "");
    await Clipboard.setStringAsync(rawNumber);
    Alert.alert("Card Number Copied", `${card.fullCardNumber} copied to clipboard.`);
  };

  if (isDetailMode) {
    return (
      <View
        style={[
          styles.cardFaceBase,
          {
            backgroundColor: theme.surface,
            borderColor: card.brandColor,
            borderWidth: 1.5,
          },
        ]}
      >
        <View style={styles.cardBackContent}>
          {/* Header */}
          <View style={styles.cardBackHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="card" size={15} color={card.brandColor} />
              <Text style={[styles.cardBackTitle, { color: theme.textPrimary }]}>
                {card.bank} Details
              </Text>
            </View>
            <TouchableOpacity onPress={onCloseDetail} hitSlop={10}>
              <Ionicons name="close-circle" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Full Card Number Box */}
          <View
            style={[
              styles.fullNumberDetailBox,
              { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
            ]}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Text style={[styles.fullNumberMetaLabel, { color: theme.textSecondary }]}>
                FULL CARD NUMBER
              </Text>
              <TouchableOpacity onPress={copyFullNumber} style={styles.copyPillBtn}>
                <Ionicons name="copy-outline" size={12} color={card.brandColor} />
                <Text style={[styles.copyPillText, { color: card.brandColor }]}>Copy</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.fullNumberDetailText, { color: theme.textPrimary }]}>
              {card.fullCardNumber}
            </Text>
            <View style={styles.detailCvvRow}>
              <Text style={[styles.detailMetaSub, { color: theme.textSecondary }]}>
                EXP: <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>{card.expiry}</Text>
              </Text>
              <Text style={[styles.detailMetaSub, { color: theme.textSecondary }]}>
                NETWORK: <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>{card.network.toUpperCase()}</Text>
              </Text>
              <Text style={[styles.detailMetaSub, { color: theme.textSecondary }]}>
                STATUS: <Text style={{ color: card.status === "Active" ? theme.success : "#EF4444", fontWeight: "700" }}>{card.status.toUpperCase()}</Text>
              </Text>
            </View>
          </View>

          {/* Budget Usage Progress Bar */}
          <View style={{ marginVertical: 3 }}>
            <View style={styles.budgetRow}>
              <Text style={[styles.budgetLabel, { color: theme.textSecondary }]}>
                Monthly Budget ({Math.round(budgetUsage * 100)}%)
              </Text>
              <Text style={[styles.budgetValue, { color: theme.textPrimary }]}>
                ₦{card.spentThisMonth.toLocaleString()} / ₦{card.monthlyBudget.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.progressBarTrack, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${budgetUsage * 100}%`,
                    backgroundColor: budgetUsage > 0.85 ? "#EF4444" : card.brandColor,
                  },
                ]}
              />
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.backActionsRow}>
            {onToggleFreeze && (
              <TouchableOpacity
                style={[
                  styles.backActionBtn,
                  { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                ]}
                onPress={() => onToggleFreeze(card.id)}
              >
                <Ionicons
                  name={isFrozen ? "lock-open-outline" : "lock-closed-outline"}
                  size={13}
                  color={isFrozen ? theme.success : "#EF4444"}
                />
                <Text
                  style={[
                    styles.backActionBtnText,
                    { color: isFrozen ? theme.success : "#EF4444" },
                  ]}
                >
                  {isFrozen ? "Unfreeze" : "Freeze"}
                </Text>
              </TouchableOpacity>
            )}

            {!card.isPrimary && onSetPrimary && (
              <TouchableOpacity
                style={[
                  styles.backActionBtn,
                  { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                ]}
                onPress={() => onSetPrimary(card.id)}
              >
                <Ionicons name="star-outline" size={13} color={theme.accent} />
                <Text style={[styles.backActionBtnText, { color: theme.accent }]}>
                  Set Default
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.backActionBtn,
                { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
              ]}
              onPress={copyFullNumber}
            >
              <Ionicons name="copy-outline" size={13} color={theme.textPrimary} />
              <Text style={[styles.backActionBtnText, { color: theme.textPrimary }]}>
                Copy Full No.
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.cardFaceBase,
        {
          backgroundColor: card.cardBgGradient[0],
          borderColor: card.brandColor,
          borderWidth: 1.5,
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
          <Ionicons
            name="wifi"
            size={16}
            color="#FFFFFF"
            style={{ transform: [{ rotate: "90deg" }] }}
          />
          <View
            style={[
              styles.statusBadge,
              isFrozen ? styles.statusFrozen : styles.statusActive,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isFrozen ? styles.statusFrozenText : styles.statusActiveText,
              ]}
            >
              {card.status}
            </Text>
          </View>
        </View>
      </View>

      {/* EMV Chip & Smart Insight Pill */}
      <View style={styles.chipInsightRow}>
        <View style={styles.emvChip}>
          <View style={styles.chipLineHorizontal} />
          <View style={styles.chipLineVertical} />
        </View>
        <View style={styles.frontInsightPill}>
          <Ionicons
            name={card.smartInsight.icon}
            size={11}
            color="#FFFFFF"
          />
          <Text style={styles.frontInsightPillText} numberOfLines={1}>
            {card.smartInsight.headline}
          </Text>
        </View>
      </View>

      {/* Full Card Number with Reveal / Hide Toggle */}
      <View style={styles.cardNumberContainer}>
        <Text
          style={[
            styles.physicalCardNumber,
            isNumberRevealed && styles.physicalCardNumberFull,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {displayNumber}
        </Text>

        <View style={styles.numberActionsRight}>
          {onToggleRevealNumber && (
            <TouchableOpacity
              onPress={onToggleRevealNumber}
              hitSlop={8}
              style={styles.eyeIconBtn}
            >
              <Ionicons
                name={isNumberRevealed ? "eye-off-outline" : "eye-outline"}
                size={16}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={copyFullNumber}
            hitSlop={8}
            style={styles.eyeIconBtn}
          >
            <Ionicons name="copy-outline" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

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

        <View style={{ alignItems: "center" }}>
          <Text style={styles.physicalCardMetaLabel}>NETWORK</Text>
          <Text style={styles.physicalCardExpiry}>
            {card.network.toUpperCase()}
          </Text>
        </View>

        <View style={styles.flipCtaBadge}>
          <Text style={styles.flipCtaText}>Details</Text>
          <Ionicons name="sparkles" size={10} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );
};

// --- MAIN LINKED CARDS SCREEN ---
export default function LinkedCardsScreen() {
  const router = useRouter();
  const { themePreference, themeMode } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const [cards, setCards] = useState<LinkedCard[]>(INITIAL_CARDS);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<LinkedCard | null>(null);
  const [isNumberRevealed, setIsNumberRevealed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Card Form State
  const [newBank, setNewBank] = useState("Access Bank");
  const [newNumber, setNewNumber] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [newCvv, setNewCvv] = useState("");
  const [newHolder, setNewHolder] = useState("EBUKA DANIEL");
  const [newNetwork, setNewNetwork] = useState<"mastercard" | "visa" | "verve">(
    "mastercard",
  );

  // --- TOP CARD DRAG / SWIPE ANIMATION STATE ---
  const pan = useRef(new Animated.ValueXY()).current;
  const gestureStartTime = useRef(0);

  const cycleTopCardToBack = () => {
    setCards((prev) => {
      if (prev.length <= 1) return prev;
      const [top, ...rest] = prev;
      return [...rest, top];
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 4,
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          Math.abs(gestureState.dx) > 4,

        onPanResponderGrant: () => {
          gestureStartTime.current = Date.now();
          pan.stopAnimation();
          pan.setValue({ x: 0, y: 0 });
        },

        onPanResponderMove: (_, gestureState) => {
          pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        },

        onPanResponderTerminationRequest: () => false,
        onShouldBlockAppResponder: () => true,

        onPanResponderRelease: (_, gestureState) => {
          const moveDistance = Math.hypot(gestureState.dx, gestureState.dy);
          const gestureDuration = Date.now() - gestureStartTime.current;

          // TAP DETECTION: Movement < 10px and duration < 280ms
          if (moveDistance < 10 && gestureDuration < 280) {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }).start();
            setSelectedCardForDetail(cards[0]);
            return;
          }

          // SWIPE DETECTION: Symmetric left & right check
          const isSwipeRight =
            gestureState.dx > SWIPE_THRESHOLD || gestureState.vx > 0.4;
          const isSwipeLeft =
            gestureState.dx < -SWIPE_THRESHOLD || gestureState.vx < -0.4;

          if (isSwipeRight || isSwipeLeft) {
            const flyDirection = isSwipeRight ? 1 : -1;
            Animated.timing(pan, {
              toValue: {
                x: flyDirection * (SCREEN_WIDTH * 1.5),
                y: gestureState.dy,
              },
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: false,
            }).start(() => {
              pan.setValue({ x: 0, y: 0 });
              cycleTopCardToBack();
            });
          } else {
            // BELOW THRESHOLD: Spring animate back to center
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 5,
              tension: 50,
              useNativeDriver: false,
            }).start();
          }
        },
      }),
    [cards],
  );

  const topCardRotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ["-18deg", "0deg", "18deg"],
    extrapolate: "clamp",
  });

  const totalCardSpent = useMemo(() => {
    return cards.reduce((acc, c) => acc + c.spentThisMonth, 0);
  }, [cards]);

  const totalTxnCount = useMemo(() => {
    return cards.reduce((acc, c) => acc + c.txnCount, 0);
  }, [cards]);

  const topCard = cards[0];

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
    Alert.alert(
      "Primary Card Updated",
      "This card is now your default payment method.",
    );
  };

  const handleAddCard = () => {
    const rawNumber = newNumber.replace(/\s/g, "");
    if (rawNumber.length < 4) {
      Alert.alert("Invalid Card Number", "Please enter a valid card number.");
      return;
    }
    const last4 = rawNumber.slice(-4);
    const formatted = rawNumber.match(/.{1,4}/g)?.join(" ") || rawNumber;

    const newCard: LinkedCard = {
      id: `card-${Date.now()}`,
      bank: newBank,
      type: `${
        newNetwork === "mastercard"
          ? "Mastercard"
          : newNetwork === "visa"
          ? "Visa"
          : "Verve"
      } Debit`,
      network: newNetwork,
      fullCardNumber: formatted,
      last4,
      expiry: newExpiry.trim() || "12/29",
      cvv: newCvv.trim() || "000",
      cardHolder: newHolder.toUpperCase().trim() || "EBUKA DANIEL",
      spentThisMonth: 0,
      monthlyBudget: 200000,
      txnCount: 0,
      status: "Active",
      isPrimary: false,
      brandColor: "#0284C7",
      cardBgGradient: ["#0369A1", "#075985"],
      tiltAngle: "-2.5deg",
      smartInsight: {
        headline: "New Card Linked",
        subtext: "Real-time sync and auto-categorization active.",
        category: "General",
        icon: "checkmark-circle-outline",
      },
      recentTxns: [],
    };

    setCards((prev) => [newCard, ...prev]);
    setShowAddModal(false);
    setNewNumber("");
    setNewExpiry("");
    setNewCvv("");
    Alert.alert("Success", `Your ${newBank} card has been linked successfully!`);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
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
        <View>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Linked Cards Deck
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Full Card Numbers & Insights
          </Text>
        </View>
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
        {/* Total Spend Hero Banner */}
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
            ₦
            {totalCardSpent.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
          <View style={styles.heroFooterRow}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="card-outline" size={15} color={theme.accent} />
              <Text
                style={[styles.heroSubText, { color: theme.textSecondary }]}
              >
                {cards.length} Cards in Deck
              </Text>
            </View>
            <Text style={[styles.heroTxnCount, { color: theme.accent }]}>
              {totalTxnCount} Total Txns
            </Text>
          </View>
        </View>

        {/* Section Header with Reveal All Toggle */}
        <View style={styles.deckHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Active Card Stack
          </Text>
          <TouchableOpacity
            style={styles.revealAllBtn}
            onPress={() => setIsNumberRevealed((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isNumberRevealed ? "eye-off-outline" : "eye-outline"}
              size={13}
              color={theme.accent}
            />
            <Text style={[styles.revealAllText, { color: theme.accent }]}>
              {isNumberRevealed ? "Hide Numbers" : "Show Full Number"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- STACK OF N CARDS (FANNED TILT PEEK EFFECT) --- */}
        <View style={styles.fannedStackContainer}>
          {/* Card 3 (Bottom background card) */}
          {cards.length > 2 && (
            <View
              pointerEvents="none"
              style={[
                styles.stackedCardWrapper,
                {
                  transform: [
                    { scale: 0.88 },
                    { translateY: 26 },
                    { rotate: cards[2].tiltAngle || "4deg" },
                  ],
                  opacity: 0.65,
                  zIndex: 1,
                },
              ]}
            >
              <PhysicalCardFace
                card={cards[2]}
                isNumberRevealed={isNumberRevealed}
                theme={theme}
              />
            </View>
          )}

          {/* Card 2 (Middle peek card) */}
          {cards.length > 1 && (
            <View
              pointerEvents="none"
              style={[
                styles.stackedCardWrapper,
                {
                  transform: [
                    { scale: 0.94 },
                    { translateY: 14 },
                    { rotate: cards[1].tiltAngle || "-4deg" },
                  ],
                  opacity: 0.88,
                  zIndex: 2,
                },
              ]}
            >
              <PhysicalCardFace
                card={cards[1]}
                isNumberRevealed={isNumberRevealed}
                theme={theme}
              />
            </View>
          )}

          {/* Card 1 (Top Interactive Card with PanResponder) */}
          {cards.length > 0 && (
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.stackedCardWrapper,
                {
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { rotate: topCardRotate },
                  ],
                  zIndex: 10,
                },
              ]}
            >
              <PhysicalCardFace
                card={topCard}
                isNumberRevealed={isNumberRevealed}
                onToggleRevealNumber={() => setIsNumberRevealed((prev) => !prev)}
                theme={theme}
              />
            </Animated.View>
          )}
        </View>

        {/* Swipe Deck Indicators */}
        <View style={styles.stackIndicatorRow}>
          {cards.map((c, i) => (
            <View
              key={c.id}
              style={[
                styles.stackIndicatorDot,
                {
                  backgroundColor: i === 0 ? c.brandColor : theme.border,
                  width: i === 0 ? 22 : 6,
                },
              ]}
            />
          ))}
        </View>

        {/* Link New Card Button */}
        <TouchableOpacity
          style={[styles.linkNewCardBtn, { backgroundColor: theme.accent }]}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.linkNewCardBtnText}>
            Link New Debit / Credit Card
          </Text>
        </TouchableOpacity>

        {/* Active Top Card Smart Insight Banner */}
        {topCard && (
          <View
            style={[
              styles.activeInsightBanner,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={[
                  styles.insightIconWrap,
                  { backgroundColor: `${topCard.brandColor}22` },
                ]}
              >
                <Ionicons
                  name={topCard.smartInsight.icon}
                  size={16}
                  color={topCard.brandColor}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.activeInsightCategory,
                    { color: topCard.brandColor },
                  ]}
                >
                  {topCard.smartInsight.category.toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.activeInsightHeadline,
                    { color: theme.textPrimary },
                  ]}
                >
                  {topCard.smartInsight.headline}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.activeInsightSubtext,
                { color: theme.textSecondary },
              ]}
            >
              {topCard.smartInsight.subtext}
            </Text>
          </View>
        )}

        {/* Recent Activity for Top Card */}
        {topCard && topCard.recentTxns.length > 0 && (
          <View
            style={[
              styles.recentTxnCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.recentTxnCardHeader}>
              <Text
                style={[styles.recentTxnCardTitle, { color: theme.textPrimary }]}
              >
                Recent Activity • {topCard.bank}
              </Text>
              <Text
                style={[styles.recentTxnCardCount, { color: theme.textSecondary }]}
              >
                {topCard.txnCount} txns
              </Text>
            </View>

            {topCard.recentTxns.map((tx, idx) => (
              <View
                key={idx}
                style={[
                  styles.recentTxnRow,
                  idx < topCard.recentTxns.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.recentTxnName, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {tx.name}
                  </Text>
                  <Text
                    style={[styles.recentTxnDate, { color: theme.textSecondary }]}
                  >
                    {tx.date}
                  </Text>
                </View>
                <Text
                  style={[styles.recentTxnAmt, { color: theme.textPrimary }]}
                >
                  {tx.amt}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Card Detail Modal (Triggered on Tap) */}
      <Modal
        visible={Boolean(selectedCardForDetail)}
        animationType="fade"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.detailModalCardContainer,
              { width: CARD_WIDTH, height: CARD_HEIGHT + 24 },
            ]}
          >
            {selectedCardForDetail && (
              <PhysicalCardFace
                card={selectedCardForDetail}
                isDetailMode={true}
                theme={theme}
                onToggleFreeze={toggleFreezeCard}
                onSetPrimary={setPrimaryCard}
                onCloseDetail={() => setSelectedCardForDetail(null)}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Add Card Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Link New Card
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Bank Name */}
              <Text
                style={[styles.inputLabel, { color: theme.textSecondary }]}
              >
                Bank Institution
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceSoft,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                value={newBank}
                onChangeText={setNewBank}
                placeholder="e.g. Access Bank, GTBank"
                placeholderTextColor={theme.textSecondary}
              />

              {/* Card Number */}
              <Text
                style={[styles.inputLabel, { color: theme.textSecondary }]}
              >
                Full 16-Digit Card Number
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceSoft,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                value={newNumber}
                onChangeText={setNewNumber}
                placeholder="5399 4100 0000 0000"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={19}
              />

              {/* Expiry & CVV Row */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Expiry (MM/YY)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surfaceSoft,
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                    value={newExpiry}
                    onChangeText={setNewExpiry}
                    placeholder="09/28"
                    placeholderTextColor={theme.textSecondary}
                    maxLength={5}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    CVV
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surfaceSoft,
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                    value={newCvv}
                    onChangeText={setNewCvv}
                    placeholder="123"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>

              {/* Cardholder Name */}
              <Text
                style={[styles.inputLabel, { color: theme.textSecondary }]}
              >
                Cardholder Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceSoft,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                value={newHolder}
                onChangeText={setNewHolder}
                placeholder="EBUKA DANIEL"
                placeholderTextColor={theme.textSecondary}
              />

              {/* Card Network Selection */}
              <Text
                style={[styles.inputLabel, { color: theme.textSecondary }]}
              >
                Payment Network
              </Text>
              <View style={styles.networkSelectRow}>
                {(["mastercard", "visa", "verve"] as const).map((net) => {
                  const isSelected = newNetwork === net;
                  return (
                    <TouchableOpacity
                      key={net}
                      style={[
                        styles.networkSelectBtn,
                        {
                          backgroundColor: isSelected
                            ? theme.accent
                            : theme.surfaceSoft,
                          borderColor: isSelected
                            ? theme.accent
                            : theme.border,
                        },
                      ]}
                      onPress={() => setNewNetwork(net)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.networkSelectText,
                          {
                            color: isSelected ? "#FFFFFF" : theme.textSecondary,
                          },
                        ]}
                      >
                        {net.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitAddBtn,
                  { backgroundColor: theme.accent },
                ]}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 18,
  },
  heroMetaLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  heroBigAmount: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
  },
  heroFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(150,150,150,0.2)",
  },
  heroSubText: {
    fontSize: 12,
    fontWeight: "600",
  },
  heroTxnCount: {
    fontSize: 12,
    fontWeight: "700",
  },
  deckHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  revealAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(150,150,150,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  revealAllText: {
    fontSize: 11,
    fontWeight: "700",
  },
  fannedStackContainer: {
    height: CARD_HEIGHT + 38,
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  stackedCardWrapper: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardFaceBase: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    padding: 16,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 8,
  },
  physicalCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  physicalBankText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  primaryBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 6,
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
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: "rgba(34, 197, 94, 0.25)",
  },
  statusFrozen: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
  },
  statusActiveText: {
    color: "#4ADE80",
  },
  statusFrozenText: {
    color: "#F87171",
  },
  chipInsightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  emvChip: {
    width: 32,
    height: 24,
    borderRadius: 5,
    backgroundColor: "#D4AF37",
    borderWidth: 1,
    borderColor: "#B8860B",
    overflow: "hidden",
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
  frontInsightPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  frontInsightPillText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "600",
  },
  cardNumberContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  physicalCardNumber: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 2,
    fontFamily: "Courier",
    flex: 1,
  },
  physicalCardNumberFull: {
    fontSize: 15.5,
    letterSpacing: 1.2,
  },
  numberActionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eyeIconBtn: {
    padding: 5,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    borderRadius: 12,
  },
  physicalCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  physicalCardMetaLabel: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  physicalCardHolder: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    maxWidth: 110,
  },
  physicalCardExpiry: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  flipCtaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  flipCtaText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  cardBackContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardBackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardBackTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  fullNumberDetailBox: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  fullNumberMetaLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  copyPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  copyPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  fullNumberDetailText: {
    fontSize: 17,
    fontWeight: "800",
    fontFamily: "Courier",
    letterSpacing: 1.5,
    marginVertical: 4,
  },
  detailCvvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(150,150,150,0.2)",
    paddingTop: 4,
  },
  detailMetaSub: {
    fontSize: 10,
    fontWeight: "600",
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  budgetLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  budgetValue: {
    fontSize: 10,
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  backActionsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  backActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  backActionBtnText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  stackIndicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    gap: 5,
  },
  stackIndicatorDot: {
    height: 6,
    borderRadius: 3,
  },
  linkNewCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    marginBottom: 16,
  },
  linkNewCardBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  activeInsightBanner: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  insightIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activeInsightCategory: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  activeInsightHeadline: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 1,
  },
  activeInsightSubtext: {
    fontSize: 11.5,
    marginTop: 6,
    lineHeight: 16,
  },
  recentTxnCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  recentTxnCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  recentTxnCardTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  recentTxnCardCount: {
    fontSize: 11,
    fontWeight: "500",
  },
  recentTxnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
  recentTxnName: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  recentTxnDate: {
    fontSize: 10,
    marginTop: 2,
  },
  recentTxnAmt: {
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailModalCardContainer: {
    borderRadius: 22,
    overflow: "hidden",
  },
  modalContent: {
    width: "100%",
    position: "absolute",
    bottom: 0,
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
