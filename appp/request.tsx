import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Share,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useAppStore } from "../src/store";

// Deterministic QR Code generator helper
function generateMockQRCode(text: string): boolean[][] {
  const size = 21; // Version 1 QR code
  const grid = Array(size).fill(null).map(() => Array(size).fill(false));

  // Draw finder patterns (7x7 nested squares)
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

  // Draw 3 Finders
  drawFinderPattern(0, 0); // Top-Left
  drawFinderPattern(14, 0); // Top-Right
  drawFinderPattern(0, 14); // Bottom-Left

  // Timing patterns
  for (let i = 8; i < 14; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Draw a standard format module
  grid[13][8] = true;

  // Fill rest deterministically based on text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder zones & timing lines
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c > 13;
      const inBL = r > 13 && c < 8;
      const inTiming = r === 6 || c === 6;

      if (!inTL && !inTR && !inBL && !inTiming) {
        const val = Math.abs(Math.sin(hash + r * 17 + c * 31));
        grid[r][c] = val > 0.48; // ~48% black modules density
      }
    }
  }

  return grid;
}

export default function RequestScreen() {
  const router = useRouter();
  const {
    username,
    customCategories,
    addCustomCategory,
    deleteCustomCategory,
    theme,
  } = useAppStore();
  const [requestAmount, setRequestAmount] = useState("");
  const [requestMemo, setRequestMemo] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState("");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [showCustomCategoryManager, setShowCustomCategoryManager] = useState(false);

  const formattedUsername = username || "ebuka";
  const baseCategories = ["Food", "Transport", "Shopping", "Bills", "Rent", "Utility"];
  const requestCategories = [...baseCategories, ...(customCategories || []), "Other", "Add Category"];
  const quickAmounts = [100, 1000, 5000, 10000, 20000, 50000];

  // Build the QR data string
  let qrValue = `tallyspends://transfer?recipient=${formattedUsername}`;
  if (requestAmount) {
    qrValue += `&amount=${requestAmount}`;
  }
  if (requestMemo) {
    qrValue += `&memo=${encodeURIComponent(requestMemo)}`;
  }

  const qrMatrix = generateMockQRCode(qrValue);
  const sizeMultiplier = 10; // each QR module will be 10x10 px

  const handleShare = async () => {
    try {
      const shareMessage = requestAmount
        ? `Tally Request: @${formattedUsername} is requesting ₦${parseFloat(requestAmount).toFixed(2)}${requestMemo ? ` for ${requestMemo}` : ""}. Open the TallySpends app and scan this request: ${qrValue}`
        : `Tally Request for @${formattedUsername}. Open the TallySpends app and scan this request: ${qrValue}`;

      await Share.share({
        message: shareMessage,
        url: qrValue,
        title: "Tally Request",
      });
    } catch (error: any) {
      console.log("Error sharing request:", error.message);
    }
  };

  const isRequestReady = Boolean(requestAmount && selectedCategory);

  const handleDeleteCustomCategory = (category: string) => {
    Alert.alert("Delete category", `Delete "${category}" from your saved categories?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteCustomCategory(category);
          if (selectedCategory === category) {
            setSelectedCategory(null);
            setRequestMemo("");
          }
        },
      },
    ]);
  };

  const handleSaveConfig = () => {
    if (!isRequestReady) return;
    const finalMemo = selectedCategory === "Other"
      ? (customCategory.trim() || customCategoryInput.trim() || "Other")
      : requestMemo || selectedCategory || "";
    setRequestMemo(finalMemo);
    setShowConfigModal(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Tally Request</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Mockup Card */}
        <View style={[styles.qrCardContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.qrCardTitle, { color: theme.textSecondary }]}>Share this Tally Request QR</Text>

          {/* QR Code Container */}
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
                })
              )}
            </Svg>
          </View>

          {/* Username Tag Badge */}
          <View style={[styles.usernameBadge, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.usernameText, { color: theme.accent }]}>@{formattedUsername}</Text>
          </View>

          {requestAmount ? (
            <View style={styles.requestAmountInfoBadge}>
              <Text style={[styles.requestAmountText, { color: theme.textPrimary }]}>
                Requested: ₦{parseFloat(requestAmount).toFixed(2)}
              </Text>
              {requestMemo ? (
                <Text style={[styles.requestMemoText, { color: theme.textSecondary }]} numberOfLines={1}>
                  "{requestMemo}"
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Viewfinder Instructions below the card */}
        <Text style={[styles.instructionsText, { color: theme.textSecondary }]}>
          Share the QR as an image to send a quick request to anyone on TallySpends.
        </Text>
        {/* Share Button (Primary) */}
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: theme.accent, shadowColor: theme.accent }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Text style={styles.shareButtonText}>Share QR Image</Text>
        </TouchableOpacity>

        {/* Add Amount and Note (Secondary) */}
        <TouchableOpacity
          style={[styles.configButton, { backgroundColor: theme.accentSoft }]}
          onPress={() => setShowConfigModal(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.configButtonText, { color: theme.accent }]}>
            {requestAmount ? "Edit Amount and Note" : "Add Amount and Note"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- ADD AMOUNT AND NOTE MODAL --- */}
      <Modal visible={showConfigModal} animationType="slide" transparent={true} onRequestClose={() => setShowConfigModal(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowConfigModal(false)} />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
            style={styles.keyboardAvoidingContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={[styles.modalPullBar, { backgroundColor: theme.border }]} />

              <View style={[styles.modalHeader, { borderColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Request Details</Text>
                <TouchableOpacity onPress={() => setShowConfigModal(false)}>
                  <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalBodyContent}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Amount to Request</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceSoft }]}>
                  <Text style={[styles.currencyPrefix, { color: theme.textPrimary }]}>₦</Text>
                  <TextInput
                    style={[styles.textInput, { color: theme.textPrimary }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    autoFocus
                    value={requestAmount}
                    onChangeText={setRequestAmount}
                  />
                </View>

                <View style={styles.quickAmountsRow}>
                  {quickAmounts.map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={[styles.quickAmountChip, { backgroundColor: theme.accentSoft }]}
                      onPress={() => setRequestAmount(String(amount))}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.quickAmountText, { color: theme.accent }]}>₦{amount.toLocaleString()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.categoryLabelRow}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 16 }]}>Choose a category</Text>
                  {(customCategories || []).length > 0 ? (
                    <TouchableOpacity
                      style={[styles.categoryManageButton, { backgroundColor: theme.surfaceSoft }]}
                      onPress={() => setShowCustomCategoryManager((prev) => !prev)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.categoryManageButtonText, { color: theme.textSecondary }]}>×</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.categoryRow}>
                  {requestCategories.map((category) => {
                    const isSelected = selectedCategory === category;
                    const isCustomCategory = (customCategories || []).includes(category);
                    const isAddBtn = category === "Add Category";
                    return (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor: isSelected
                              ? theme.accent
                              : isAddBtn
                                ? theme.accentSoft
                                : theme.surfaceSoft,
                            borderColor: isAddBtn
                              ? isSelected
                                ? theme.accent
                                : theme.accentSecondary
                              : "transparent",
                            borderWidth: isAddBtn ? 1 : 0,
                          },
                        ]}
                        onPress={() => {
                          setSelectedCategory(category);
                          setCustomCategory("");
                          setCustomCategoryInput("");
                          setRequestMemo(category === "Other" ? "" : category);
                        }}
                        onLongPress={() => {
                          if (isCustomCategory) {
                            handleDeleteCustomCategory(category);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            {
                              color: isSelected
                                ? "#FFFFFF"
                                : isAddBtn
                                  ? theme.accent
                                  : theme.textPrimary,
                              fontWeight: isAddBtn ? "800" : "600",
                            },
                          ]}
                        >
                          {isAddBtn ? "＋" : category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {(customCategories || []).length > 0 && showCustomCategoryManager ? (
                  <View style={[styles.customCategoriesList, { backgroundColor: theme.surfaceSoft }]}>
                    {(customCategories || []).map((category) => (
                      <View key={category} style={styles.customCategoryRow}>
                        <Text style={[styles.customCategoryText, { color: theme.textPrimary }]}>{category}</Text>
                        <TouchableOpacity
                          style={styles.deleteCategoryButton}
                          onPress={() => handleDeleteCustomCategory(category)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.deleteCategoryButtonText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : null}

                {selectedCategory ? (
                  <TouchableOpacity
                    style={[styles.clearSelectionButton, { backgroundColor: theme.surfaceSoft }]}
                    onPress={() => {
                      setSelectedCategory(null);
                      setCustomCategory("");
                      setCustomCategoryInput("");
                      setRequestMemo("");
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.clearSelectionButtonText, { color: theme.textSecondary }]}>Clear</Text>
                  </TouchableOpacity>
                ) : null}

                {(selectedCategory === "Other" || selectedCategory === "Add Category") ? (
                  <View style={[styles.customInputWrapper, { backgroundColor: theme.surfaceSoft }]}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{selectedCategory === "Other" ? "Other category" : "New category"}</Text>
                    <TextInput
                      style={[styles.customInput, { color: theme.textPrimary }]}
                      placeholder={selectedCategory === "Other" ? "Type a custom category" : "Type a new category name"}
                      placeholderTextColor={theme.textSecondary}
                      value={customCategoryInput}
                      onChangeText={setCustomCategoryInput}
                    />
                  </View>
                ) : null}

                {selectedCategory === "Add Category" ? (
                  <TouchableOpacity
                    style={[styles.addCustomCategoryButton, { backgroundColor: theme.accentSoft }]}
                    onPress={() => {
                      const trimmed = customCategoryInput.trim();
                      if (!trimmed) return;
                      addCustomCategory(trimmed);
                      setCustomCategory(trimmed);
                      setSelectedCategory(trimmed);
                      setRequestMemo(trimmed);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.addCustomCategoryButtonText, { color: theme.accent }]}>Save this as my category</Text>
                  </TouchableOpacity>
                ) : null}

                <Text style={[styles.helperText, { color: theme.textSecondary }]}>Pick a category so the request is faster and easier to organize.</Text>

                <TouchableOpacity
                  style={[
                    styles.modalSaveButton,
                    { backgroundColor: isRequestReady ? theme.accent : theme.surfaceSoft, shadowColor: theme.accent },
                    !isRequestReady && styles.modalSaveButtonDisabled,
                  ]}
                  onPress={handleSaveConfig}
                  activeOpacity={0.8}
                  disabled={!isRequestReady}
                >
                  <Text style={[styles.modalSaveButtonText, !isRequestReady && { color: theme.textSecondary }]}>Apply Request Details</Text>
                </TouchableOpacity>

                {requestAmount ? (
                  <TouchableOpacity
                    style={styles.modalClearButton}
                    onPress={() => {
                      setRequestAmount("");
                      setRequestMemo("");
                      setSelectedCategory(null);
                      setCustomCategory("");
                      setCustomCategoryInput("");
                      setShowConfigModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalClearButtonText, { color: theme.danger }]}>Clear Request Details</Text>
                  </TouchableOpacity>
                ) : null}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAF6",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(91, 78, 145, 0.08)",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#20142A",
    letterSpacing: -0.3,
  },
  scrollContainer: {
    padding: 24,
    alignItems: "center",
  },
  qrCardContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(91, 78, 145, 0.06)",
    paddingVertical: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  qrCardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 28,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    shadowColor: "#20142A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  usernameBadge: {
    backgroundColor: "#F0EEFA",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 24,
  },
  usernameText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5B4E91",
  },
  requestAmountInfoBadge: {
    marginTop: 14,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  requestAmountText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#20142A",
  },
  requestMemoText: {
    fontSize: 12,
    color: "#8E8E93",
    fontStyle: "italic",
    marginTop: 4,
  },
  instructionsText: {
    fontSize: 11,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  shareButton: {
    width: "100%",
    backgroundColor: "#76A6EF", // matches mockup's primary blue color
    borderRadius: 20,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#76A6EF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 12,
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  configButton: {
    width: "100%",
    backgroundColor: "#F0EEFA",
    borderRadius: 20,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  configButtonText: {
    color: "#5B4E91",
    fontSize: 14,
    fontWeight: "700",
  },

  // Modal styling
  keyboardAvoidingContainer: {
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "92%",
  },
  modalPullBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(91, 78, 145, 0.05)",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#20142A",
  },
  modalBody: {
    padding: 20,
  },
  modalBodyContent: {
    paddingBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8FA",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
  },
  quickAmountsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  quickAmountChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F0EEFA",
    marginRight: 8,
    marginBottom: 8,
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5B4E91",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F4F4F6",
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipActive: {
    backgroundColor: "#5B4E91",
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#20142A",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  addCategoryChip: {
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#C084FC",
  },
  addCategoryChipActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  addCategoryChipText: {
    color: "#6D28D9",
    fontSize: 16,
    fontWeight: "800",
  },
  addCategoryChipTextActive: {
    color: "#FFFFFF",
  },
  helperText: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 10,
    lineHeight: 18,
  },
  customInputWrapper: {
    marginTop: 12,
    backgroundColor: "#F8F8FA",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addCustomCategoryButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F0EEFA",
  },
  addCustomCategoryButtonText: {
    color: "#5B4E91",
    fontSize: 12,
    fontWeight: "700",
  },
  categoryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  categoryManageButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  categoryManageButtonText: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "700",
  },
  customCategoriesList: {
    marginTop: 10,
    backgroundColor: "#F8F8FA",
    borderRadius: 14,
    padding: 10,
  },
  customCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  customCategoryText: {
    fontSize: 13,
    color: "#20142A",
    fontWeight: "600",
  },
  deleteCategoryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  deleteCategoryButtonText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
  clearSelectionButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  clearSelectionButtonText: {
    color: "#4B5563",
    fontSize: 11,
    fontWeight: "700",
  },
  customInput: {
    fontSize: 14,
    color: "#20142A",
    paddingVertical: 0,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "600",
    color: "#20142A",
    marginRight: 4,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#20142A",
  },
  modalSaveButton: {
    backgroundColor: "#5B4E91",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#5B4E91",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  modalSaveButtonDisabled: {
    backgroundColor: "#CFCFD6",
    shadowOpacity: 0,
    elevation: 0,
  },
  modalSaveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  modalClearButton: {
    backgroundColor: "transparent",
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  modalClearButtonText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },
});
