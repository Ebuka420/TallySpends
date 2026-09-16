import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

// Deterministic QR Code generator helper
function generateMockQRCode(text: string): boolean[][] {
  const size = 21; // Version 1 QR code
  const grid = Array(size).fill(null).map(() => Array(size).fill(false));

  const drawFinderPattern = (x: number, y: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBlack =
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        grid[y + r][x + c] = isBlack;
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(14, 0);
  drawFinderPattern(0, 14);

  for (let i = 8; i < 14; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }
  grid[13][8] = true;

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c > 13;
      const inBL = r > 13 && c < 8;
      const inTiming = r === 6 || c === 6;

      if (!inTL && !inTR && !inBL && !inTiming) {
        const val = Math.abs(Math.sin(hash + r * 17 + c * 31));
        grid[r][c] = val > 0.48;
      }
    }
  }

  return grid;
}

export default function RequestScreen() {
  const router = useRouter();
  const {
    username,
    profileFullName,
    themePreference,
    themeMode,
  } = useAppStore();

  const theme = getThemePalette(themePreference, themeMode);

  // Tab State: 'receive' | 'split'
  const [activeTab, setActiveTab] = useState<"receive" | "split">("receive");

  // Receive Form
  const [requestAmount, setRequestAmount] = useState("");
  const [requestMemo, setRequestMemo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Food");
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Split Bill Form
  const [totalBill, setTotalBill] = useState("");
  const [splitCount, setSplitCount] = useState(3);
  const [splitDescription, setSplitDescription] = useState("Dinner with Friends");

  const formattedUsername = username || "ebuka";
  const displayName = profileFullName?.trim() || username || "Ebuka Daniel";

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];
  const categories = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];

  // Calculate per person for split bill
  const perPersonAmount = useMemo(() => {
    const total = parseFloat(totalBill) || 0;
    if (total <= 0 || splitCount <= 0) return 0;
    return total / splitCount;
  }, [totalBill, splitCount]);

  // Build the QR data strings
  const receiveQrValue = useMemo(() => {
    let url = `tallyspends://transfer?recipient=${formattedUsername}`;
    if (requestAmount) url += `&amount=${requestAmount}`;
    if (requestMemo) url += `&memo=${encodeURIComponent(requestMemo)}`;
    return url;
  }, [formattedUsername, requestAmount, requestMemo]);

  const splitQrValue = useMemo(() => {
    let url = `tallyspends://transfer?recipient=${formattedUsername}&amount=${perPersonAmount.toFixed(2)}`;
    url += `&memo=${encodeURIComponent(`Split: ${splitDescription}`)}`;
    return url;
  }, [formattedUsername, perPersonAmount, splitDescription]);

  const currentQrString = activeTab === "split" ? splitQrValue : receiveQrValue;
  const qrMatrix = useMemo(() => generateMockQRCode(currentQrString), [currentQrString]);
  const sizeMultiplier = 10;

  const handleShare = async () => {
    try {
      let shareMsg = "";
      if (activeTab === "split") {
        shareMsg = `Tally Bill Split: @${formattedUsername} requested ₦${perPersonAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} each for "${splitDescription}" (Total ₦${parseFloat(totalBill || "0").toLocaleString()} split ${splitCount} ways). Pay instantly on TallySpends: ${splitQrValue}`;
      } else {
        shareMsg = requestAmount
          ? `Tally Payment Request: @${formattedUsername} is requesting ₦${parseFloat(requestAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}${requestMemo ? ` for "${requestMemo}"` : ""}. Pay via TallySpends: ${receiveQrValue}`
          : `Pay @${formattedUsername} securely via TallySpends: ${receiveQrValue}`;
      }

      await Share.share({
        message: shareMsg,
        url: currentQrString,
        title: "Tally Request",
      });
    } catch (error: any) {
      Alert.alert("Share error", error.message || "Could not share link.");
    }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(currentQrString);
    Alert.alert("Link Copied", "TallySpends payment link has been copied to your clipboard!");
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          QR Payment Hub
        </Text>
        <TouchableOpacity onPress={handleShare} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      {/* Segmented Mode Selector */}
      <View style={[styles.tabBarWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === "receive" && [styles.activeTabItem, { backgroundColor: theme.accent }],
          ]}
          onPress={() => setActiveTab("receive")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="qr-code-outline"
            size={16}
            color={activeTab === "receive" ? "#FFFFFF" : theme.textSecondary}
          />
          <Text
            style={[
              styles.tabItemText,
              { color: activeTab === "receive" ? "#FFFFFF" : theme.textSecondary },
            ]}
          >
            My QR / Request
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === "split" && [styles.activeTabItem, { backgroundColor: theme.accent }],
          ]}
          onPress={() => setActiveTab("split")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="people-outline"
            size={16}
            color={activeTab === "split" ? "#FFFFFF" : theme.textSecondary}
          />
          <Text
            style={[
              styles.tabItemText,
              { color: activeTab === "split" ? "#FFFFFF" : theme.textSecondary },
            ]}
          >
            Split Bill
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "split" ? (
          /* --- SPLIT BILL CONTROLS --- */
          <View style={[styles.configCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.configCardTitle, { color: theme.textPrimary }]}>
              Split A Group Bill
            </Text>
            <Text style={[styles.configCardSubtitle, { color: theme.textSecondary }]}>
              Enter the total amount to divide equally among your group.
            </Text>

            <Text style={[styles.inputFieldLabel, { color: theme.textSecondary }]}>Total Bill (₦)</Text>
            <View style={[styles.amountInputBox, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
              <Text style={[styles.nairaPrefix, { color: theme.textPrimary }]}>₦</Text>
              <TextInput
                style={[styles.amountInputText, { color: theme.textPrimary }]}
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                value={totalBill}
                onChangeText={setTotalBill}
              />
            </View>

            {/* Split Stepper */}
            <View style={styles.stepperRow}>
              <View>
                <Text style={[styles.inputFieldLabel, { color: theme.textSecondary, marginBottom: 0 }]}>
                  Number of People
                </Text>
                <Text style={[styles.stepperSub, { color: theme.accent }]}>
                  {splitCount} Members (incl. you)
                </Text>
              </View>

              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}
                  onPress={() => setSplitCount((c) => Math.max(2, c - 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={18} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.stepperCount, { color: theme.textPrimary }]}>{splitCount}</Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}
                  onPress={() => setSplitCount((c) => Math.min(10, c + 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Reason */}
            <Text style={[styles.inputFieldLabel, { color: theme.textSecondary, marginTop: 12 }]}>
              Description / Occasion
            </Text>
            <TextInput
              style={[styles.textInputRegular, { backgroundColor: theme.surfaceSoft, borderColor: theme.border, color: theme.textPrimary }]}
              value={splitDescription}
              onChangeText={setSplitDescription}
              placeholder="e.g. Sushi Dinner, Fuel, Rent"
              placeholderTextColor={theme.textSecondary}
            />

            {/* Split Summary Banner */}
            {perPersonAmount > 0 && (
              <View style={[styles.splitSummaryBanner, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.splitSummaryLabel, { color: theme.textSecondary }]}>
                  EACH PERSON PAYS
                </Text>
                <Text style={[styles.splitSummaryAmount, { color: theme.accent }]}>
                  ₦{perPersonAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* --- RECEIVE / REQUEST CONTROLS --- */
          <View style={[styles.configCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text style={[styles.configCardTitle, { color: theme.textPrimary }]}>
                Request Settings
              </Text>
              <TouchableOpacity
                onPress={() => setShowConfigModal(true)}
                style={[styles.editBadge, { backgroundColor: theme.accentSoft }]}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={14} color={theme.accent} />
                <Text style={[styles.editBadgeText, { color: theme.accent }]}>
                  {requestAmount ? "Edit" : "Set Amount"}
                </Text>
              </TouchableOpacity>
            </View>

            {requestAmount ? (
              <View style={styles.amountDisplayRow}>
                <Text style={[styles.requestAmountBig, { color: theme.textPrimary }]}>
                  ₦{parseFloat(requestAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
                {requestMemo ? (
                  <Text style={[styles.requestMemoTag, { color: theme.textSecondary }]}>
                    for "{requestMemo}"
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={[styles.noAmountNotice, { color: theme.textSecondary }]}>
                No fixed amount set. Anyone scanning can send any desired amount.
              </Text>
            )}
          </View>
        )}

        {/* --- QR CODE BADGE CARD --- */ }
        <View style={[styles.qrCardContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.qrCardTitle, { color: theme.textSecondary }]}>
            {activeTab === "split" ? "Scan to Pay Your Share" : "Scan to Pay"}
          </Text>

          {/* QR Code Graphic Box */}
          <View style={[styles.qrWrapper, { backgroundColor: "#FFFFFF", borderColor: theme.border }]}>
            <Svg width={210} height={210} viewBox="0 0 210 210">
              {qrMatrix.map((row, rIdx) =>
                row.map((isBlack, cIdx) => {
                  if (isBlack) {
                    return (
                      <Rect
                        key={`${rIdx}-${cIdx}`}
                        x={cIdx * sizeMultiplier}
                        y={rIdx * sizeMultiplier}
                        width={sizeMultiplier}
                        height={sizeMultiplier}
                        fill="#1C1C1E"
                      />
                    );
                  }
                  return null;
                }),
              )}
            </Svg>
          </View>

          {/* User Tag Pill */}
          <View style={[styles.usernameBadge, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="at" size={14} color={theme.accent} />
            <Text style={[styles.usernameText, { color: theme.accent }]}>{formattedUsername}</Text>
          </View>
          <Text style={[styles.userFullNameText, { color: theme.textPrimary }]}>{displayName}</Text>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: theme.accent }]}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionBtnText}>Share Request</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryActionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleCopyLink}
            activeOpacity={0.7}
          >
            <Ionicons name="copy-outline" size={18} color={theme.textPrimary} />
            <Text style={[styles.secondaryActionBtnText, { color: theme.textPrimary }]}>Copy Link</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- ADD / EDIT AMOUNT MODAL --- */}
      <Modal visible={showConfigModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Custom Request Amount</Text>
              <TouchableOpacity onPress={() => setShowConfigModal(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputFieldLabel, { color: theme.textSecondary }]}>Amount (₦)</Text>
            <View style={[styles.amountInputBox, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
              <Text style={[styles.nairaPrefix, { color: theme.textPrimary }]}>₦</Text>
              <TextInput
                style={[styles.amountInputText, { color: theme.textPrimary }]}
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                autoFocus
                value={requestAmount}
                onChangeText={setRequestAmount}
              />
            </View>

            {/* Quick Amounts */}
            <View style={styles.quickAmountsRow}>
              {quickAmounts.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickAmountChip, { backgroundColor: theme.accentSoft }]}
                  onPress={() => setRequestAmount(String(amt))}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.quickAmountText, { color: theme.accent }]}>
                    ₦{amt.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category selection */}
            <Text style={[styles.inputFieldLabel, { color: theme.textSecondary, marginTop: 12 }]}>
              Category
            </Text>
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: selectedCategory === cat ? theme.accent : theme.surfaceSoft,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setRequestMemo(cat);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: selectedCategory === cat ? "#FFFFFF" : theme.textPrimary },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Note Memo */}
            <Text style={[styles.inputFieldLabel, { color: theme.textSecondary, marginTop: 12 }]}>
              Note / Memo
            </Text>
            <TextInput
              style={[styles.textInputRegular, { backgroundColor: theme.surfaceSoft, borderColor: theme.border, color: theme.textPrimary }]}
              value={requestMemo}
              onChangeText={setRequestMemo}
              placeholder="e.g. Lunch money, Tickets, Shared cab"
              placeholderTextColor={theme.textSecondary}
            />

            <TouchableOpacity
              style={[styles.saveDetailsBtn, { backgroundColor: theme.accent }]}
              onPress={() => setShowConfigModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.saveDetailsBtnText}>Apply Request Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  tabBarWrap: {
    flexDirection: "row",
    padding: 6,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
  },
  activeTabItem: {},
  tabItemText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 60,
  },
  configCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  configCardTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  configCardSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    marginBottom: 12,
  },
  editBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  editBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  amountDisplayRow: {
    marginTop: 4,
  },
  requestAmountBig: {
    fontSize: 24,
    fontWeight: "800",
  },
  requestMemoTag: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: "italic",
  },
  noAmountNotice: {
    fontSize: 12,
    lineHeight: 17,
  },
  inputFieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  amountInputBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  nairaPrefix: {
    fontSize: 18,
    fontWeight: "800",
    marginRight: 6,
  },
  amountInputText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  stepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  stepperSub: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperCount: {
    fontSize: 16,
    fontWeight: "800",
    minWidth: 20,
    textAlign: "center",
  },
  textInputRegular: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13.5,
  },
  splitSummaryBanner: {
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    alignItems: "center",
  },
  splitSummaryLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  splitSummaryAmount: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  qrCardContainer: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  qrCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  qrWrapper: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 14,
  },
  usernameBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 13,
    fontWeight: "800",
  },
  userFullNameText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  secondaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryActionBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  quickAmountsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  quickAmountChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: "800",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  saveDetailsBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  saveDetailsBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
