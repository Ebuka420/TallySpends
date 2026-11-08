import { AmountInput } from "../components/BudgetUI";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import type { ViewInstance } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useAppStore } from "../src/store";
import { captureRef, releaseCapture } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { usePaymentIdentity } from "../src/qr/hooks";
import { buildQrLink, validAmount } from "../src/qr/model";
import { encodeQrMatrix } from "../src/qr/encoder";


export default function RequestScreen() {
  const router = useRouter();
  const {
    profileTallyTag,
    customCategories,
    addCustomCategory,
    deleteCustomCategory,
    theme,
  } = useAppStore();
  const styles = getStyles(theme);
  const [requestAmount, setRequestAmount] = useState("");
  const [requestMemo, setRequestMemo] = useState("");
  const [applied, setApplied] = useState({ amount: "", memo: "", category: null as string | null, customInput: "" });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState("");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [showCustomCategoryManager, setShowCustomCategoryManager] = useState(false);
  const identity = usePaymentIdentity();
  const qrView = useRef<ViewInstance | null>(null);
  const shareLock = useRef(false);
  const [sharing, setSharing] = useState(false);

  const tallyTag = (identity.identity?.tallyTag || profileTallyTag || "").trim().replace(/^@+/, "");
  const baseCategories = ["Food", "Transport", "Shopping", "Bills", "Rent", "Utility"];
  const requestCategories = [...baseCategories, ...(customCategories || []), "Other", "Add Category"];
  const quickAmounts = [100, 1000, 5000, 10000, 20000, 50000];

  // Build the QR data string
  const qr = useMemo(() => {
    if (!identity.identity) return { value: "", matrix: [] as boolean[][], error: null as string | null };
    try {
      const value = buildQrLink({ paymentId: identity.identity.publicPaymentId, ...(applied.amount ? { amount: applied.amount } : {}), ...(applied.memo ? { memo: applied.memo } : {}) });
      return { value, matrix: encodeQrMatrix(value), error: null };
    } catch (error) { return { value: "", matrix: [] as boolean[][], error: error instanceof Error ? error.message : "Couldn't generate this QR request." }; }
  }, [identity.identity, applied.amount, applied.memo]);
  const qrMatrix = qr.matrix;
  const quietZone = 4;

  const handleShare = async () => {
    if (shareLock.current || !qr.value) return;
    shareLock.current = true;
    setSharing(true);
    let uri: string | undefined;
    try {
      if (Platform.OS === "web" || !(await Sharing.isAvailableAsync())) throw new Error("Image sharing isn't available on this device.");
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (!qrView.current) throw new Error("The QR image is still loading. Please try again.");
      uri = await captureRef(qrView.current, { format: "png", result: "tmpfile", width: 840, height: 840 });
      await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: "Share Tally Request QR" });
    } catch { Alert.alert("Could not share QR", Platform.OS === "web" ? "QR image sharing is available in the iPhone and Android app." : "Couldn't export or share the QR image. Wait for the QR to appear and try again."); }
    finally { if (uri) releaseCapture(uri); shareLock.current = false; setSharing(false); }
  };

  const isRequestReady = Boolean(validAmount(requestAmount) && selectedCategory && selectedCategory !== "Add Category");
  const openConfig = () => {
    setRequestAmount(applied.amount); setRequestMemo(applied.memo);
    setSelectedCategory(applied.category); setCustomCategory(""); setCustomCategoryInput(applied.customInput);
    setShowConfigModal(true);
  };

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
    if (finalMemo.length > 40 || /[\u0000-\u001f\u007f]/.test(finalMemo)) { Alert.alert("Invalid note", "Keep your request note to 40 characters without line breaks."); return; }
    setRequestMemo(finalMemo);
    setApplied({ amount: requestAmount, memo: finalMemo, category: selectedCategory, customInput: customCategoryInput });
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
          <View ref={qrView} collapsable={false} style={[styles.qrWrapper, { backgroundColor: "#FFFFFF", borderColor: theme.border }]}>
            {qr.value ? <Svg width={210} height={210} viewBox={`0 0 ${qrMatrix.length + quietZone * 2} ${qrMatrix.length + quietZone * 2}`}>
              {qrMatrix.map((row, rIdx) =>
                row.map((isBlack, cIdx) => {
                  if (isBlack) {
                    return (
                      <Rect
                        key={`${rIdx}-${cIdx}`}
                        x={cIdx + quietZone}
                        y={rIdx + quietZone}
                        width={1}
                        height={1}
                        fill="#1C1C1E"
                      />
                    );
                  }
                  return null;
                })
              )}
            </Svg> : <View style={{ width: 210, height: 210, alignItems: "center", justifyContent: "center", padding: 16 }}>
              {identity.loading ? <ActivityIndicator color={theme.accent} /> : <>
                <Ionicons name="qr-code-outline" size={34} color={theme.accent} />
                <Text accessibilityLiveRegion="polite" style={{ color: theme.accent, textAlign: "center", marginTop: 12 }}>{qr.error || identity.error || "Your personal QR is not available yet."}</Text>
                <TouchableOpacity accessibilityRole="button" onPress={qr.error ? openConfig : identity.retry} style={{ padding: 12 }}><Text style={{ color: theme.accent, fontWeight: "700" }}>{qr.error ? "Edit request" : "Try again"}</Text></TouchableOpacity>
              </>}
            </View>}
          </View>

          {/* TallyTag Badge */}
          <View style={[styles.usernameBadge, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.usernameText, { color: theme.accent }]}>{tallyTag ? `@${tallyTag}` : "TallyTag unavailable"}</Text>
          </View>

          {applied.amount ? (
            <View style={styles.requestAmountInfoBadge}>
              <Text style={[styles.requestAmountText, { color: theme.textPrimary }]}>
                Requested: ₦{parseFloat(applied.amount).toFixed(2)}
              </Text>
              {applied.memo ? (
                <Text style={[styles.requestMemoText, { color: theme.textSecondary }]} numberOfLines={1}>
                  "{applied.memo}"
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
          style={[styles.shareButton, { backgroundColor: theme.accent, shadowColor: theme.accent, opacity: !qr.value || sharing ? 0.5 : 1 }]}
          onPress={handleShare}
          disabled={!qr.value || sharing}
          activeOpacity={0.8}
        >
          {sharing ? <ActivityIndicator color={theme.onAccent} /> : <Text style={styles.shareButtonText}>Share QR Image</Text>}
        </TouchableOpacity>

        {/* Add Amount and Note (Secondary) */}
        <TouchableOpacity
          style={[styles.configButton, { backgroundColor: theme.accentSoft }]}
          onPress={openConfig}
          disabled={sharing}
          activeOpacity={0.7}
        >
          <Text style={[styles.configButtonText, { color: theme.accent }]}>
            {applied.amount ? "Edit Amount and Note" : "Add Amount and Note"}
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
                  <AmountInput
                    allowEmpty
                    style={[styles.textInput, { color: theme.textPrimary }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                    theme={theme}

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
                                ? theme.onAccent
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
                      setApplied({ amount: "", memo: "", category: null, customInput: "" });
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

const getStyles = (theme: import("../src/theme").ThemePalette) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.surfaceSoft,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(91, 78, 145, 0.08)",
    backgroundColor: theme.surface,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.accent,
    letterSpacing: -0.3,
  },
  scrollContainer: {
    padding: 24,
    alignItems: "center",
  },
  qrCardContainer: {
    width: "100%",
    backgroundColor: theme.surface,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(91, 78, 145, 0.06)",
    paddingVertical: 32,
    alignItems: "center",
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  qrCardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.textSecondary,
    marginBottom: 28,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  usernameBadge: {
    backgroundColor: theme.accentSoft,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 24,
  },
  usernameText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.accent,
  },
  requestAmountInfoBadge: {
    marginTop: 14,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  requestAmountText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.accent,
  },
  requestMemoText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontStyle: "italic",
    marginTop: 4,
  },
  instructionsText: {
    fontSize: 11,
    color: theme.textSecondary,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  shareButton: {
    width: "100%",
    backgroundColor: theme.accent, // matches mockup's primary blue color
    borderRadius: 20,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 12,
  },
  shareButtonText: {
    color: theme.onAccent,
    fontSize: 14,
    fontWeight: "700",
  },
  configButton: {
    width: "100%",
    backgroundColor: theme.accentSoft,
    borderRadius: 20,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  configButtonText: {
    color: theme.accent,
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
    backgroundColor: theme.surface,
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
    backgroundColor: theme.border,
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
    color: theme.accent,
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
    color: theme.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surfaceSoft,
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
    backgroundColor: theme.accentSoft,
    marginRight: 8,
    marginBottom: 8,
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.accent,
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
    backgroundColor: theme.surfaceSoft,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipActive: {
    backgroundColor: theme.accent,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.accent,
  },
  categoryChipTextActive: {
    color: theme.onAccent,
  },
  addCategoryChip: {
    backgroundColor: theme.accentSoft,
    borderWidth: 1,
    borderColor: theme.accent,
  },
  addCategoryChipActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  addCategoryChipText: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: "800",
  },
  addCategoryChipTextActive: {
    color: theme.onAccent,
  },
  helperText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },
  customInputWrapper: {
    marginTop: 12,
    backgroundColor: theme.surfaceSoft,
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
    backgroundColor: theme.accentSoft,
  },
  addCustomCategoryButtonText: {
    color: theme.accent,
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
    backgroundColor: theme.surfaceSoft,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  categoryManageButtonText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: "700",
  },
  customCategoriesList: {
    marginTop: 10,
    backgroundColor: theme.surfaceSoft,
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
    color: theme.accent,
    fontWeight: "600",
  },
  deleteCategoryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  deleteCategoryButtonText: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  clearSelectionButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.surfaceSoft,
  },
  clearSelectionButtonText: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  customInput: {
    fontSize: 14,
    color: theme.accent,
    paddingVertical: 0,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.accent,
    marginRight: 4,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: theme.accent,
  },
  modalSaveButton: {
    backgroundColor: theme.accent,
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  modalSaveButtonDisabled: {
    backgroundColor: theme.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  modalSaveButtonText: {
    color: theme.onAccent,
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
    color: theme.danger,
    fontSize: 13,
    fontWeight: "600",
  },
});


