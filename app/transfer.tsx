import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import TransactionReceiptModal from "../components/TransactionReceiptModal";
import { MOCK_RECIPIENTS, useAppStore } from "../src/store";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TransferScreen() {
  const router = useRouter();
  const { addTransaction, transactions, theme } = useAppStore();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "my-accounts">(
    "all",
  );
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState<any | null>(
    null,
  );
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferStep, setTransferStep] = useState<
    "amount" | "review" | "success"
  >("amount");
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [newRecipientUsername, setNewRecipientUsername] = useState("");
  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  const scannerAnim = useRef(new Animated.Value(0)).current;

  const setTransferStepWithAnimation = (
    nextStep: "amount" | "review" | "success",
  ) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTransferStep(nextStep);
  };

  useEffect(() => {
    if (showScanner) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scannerAnim, {
            toValue: 240,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scannerAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      scannerAnim.setValue(0);
    }
  }, [showScanner]);

  useEffect(() => {
    if (showScanner && permission?.status === "undetermined") {
      requestPermission();
    }
  }, [showScanner, permission?.status, requestPermission]);

  useEffect(() => {
    if (!showScanner) {
      setScanned(false);
    }
  }, [showScanner]);

  const transactionsRaw = transactions || [];
  const totalIncome = transactionsRaw
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalExpenses = transactionsRaw
    .filter((t: any) => t.type === "expense")
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const currentBalance = 2926.78 + totalIncome - totalExpenses;

  const recentRecipients = MOCK_RECIPIENTS.filter((r) => r.isRecent);

  const filteredRecipients = MOCK_RECIPIENTS.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.username.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === "my-accounts") {
      return (
        matchesSearch &&
        (r.bank.includes("Basic Ch") ||
          r.bank.includes("Premium Ch") ||
          r.username === "bayside_b")
      );
    }

    return matchesSearch;
  });

  const handleSelectRecipient = (recipient: any) => {
    setSelectedRecipient(recipient);
    setAmount("");
    setMemo("");
    setTransferStep("amount");
    setShowTransferModal(true);
  };

  const handleSimulateScan = (recipient: any) => {
    setShowScanner(false);
    setTimeout(() => {
      handleSelectRecipient(recipient);
    }, 400);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    try {
      const url = new URL(data);
      const recipient = url.searchParams.get("recipient");
      const amountParam = url.searchParams.get("amount");
      const memoParam = url.searchParams.get("memo");
      if (recipient) {
        const found = MOCK_RECIPIENTS.find(
          (r) =>
            r.username === recipient ||
            r.username === recipient.replace("@", ""),
        );
        if (found) {
          setShowScanner(false);
          setTimeout(() => handleSelectRecipient(found), 300);
          if (amountParam) setAmount(amountParam);
          if (memoParam) setMemo(decodeURIComponent(memoParam));
          return;
        }
      }
      Alert.alert("Scan Result", `Scanned data: ${data}`);
      setShowScanner(false);
    } catch (e) {
      const uname = data.replace("@", "");
      const found = MOCK_RECIPIENTS.find(
        (r) => r.username === uname || r.username === data,
      );
      if (found) {
        setShowScanner(false);
        setTimeout(() => handleSelectRecipient(found), 300);
      } else {
        Alert.alert("Scanned", data);
        setShowScanner(false);
      }
    }
  };

  const executeTransfer = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to transfer.");
      return;
    }

    if (value > currentBalance) {
      Alert.alert(
        "Insufficient Funds",
        "You do not have enough funds to complete this transfer.",
      );
      return;
    }

    const finalCategory = memo.trim() || "Transfer";
    const newTx = {
      id: `tx-${Date.now()}`,
      title: `Transfer to @${selectedRecipient.username}`,
      amount: value,
      category: finalCategory,
      type: "expense",
      memo: memo || finalCategory,
      date: new Date().toISOString().slice(0, 10),
    };

    addTransaction(newTx);
    setReceiptTransaction(newTx);
    setTransferStepWithAnimation("success");
  };

  const parsedAmount = parseFloat(amount);
  const isOverBalance = !isNaN(parsedAmount) && parsedAmount > currentBalance;

  const addQuickAmount = (increment: number) => {
    const current = Number(amount.replace(/,/g, "")) || 0;
    setAmount(String(current + increment));
  };

  const continueToReview = () => {
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(
        "Enter an amount",
        "Enter a valid transfer amount to continue.",
      );
      return;
    }
    if (isOverBalance) {
      Alert.alert(
        "Insufficient Funds",
        "You do not have enough funds to complete this transfer.",
      );
      return;
    }
    setTransferStepWithAnimation("review");
  };

  const closeTransferFlow = () => {
    setShowTransferModal(false);
    setTransferStep("amount");
    setAmount("");
    setMemo("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={styles.headerIconColor.color}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipients</Text>
        <TouchableOpacity
          style={styles.headerQRButton}
          onPress={() => router.push("/request")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="qr-code-outline"
            size={20}
            color={styles.headerIconColor.color}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Send Money</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowAddRecipientModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="add" size={24} color="#4B2C40" />
            </View>
            <Text style={styles.actionText}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowScanner(true)}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="scan-outline" size={22} color="#4B2C40" />
            </View>
            <Text style={styles.actionText}>Scan QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => Alert.alert("Contacts", "Opening contact list...")}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons
                name="person-circle-outline"
                size={24}
                color="#4B2C40"
              />
            </View>
            <Text style={styles.actionText}>Contact</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recents</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentsRow}
        >
          {recentRecipients.map((rec) => (
            <TouchableOpacity
              key={rec.id}
              style={styles.recentRecipientCard}
              onPress={() => handleSelectRecipient(rec)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatarBox, { backgroundColor: rec.color }]}>
                <Text style={[styles.avatarText, { color: rec.textColor }]}>
                  {rec.initial}
                </Text>
              </View>
              <Text style={styles.recentRecName} numberOfLines={1}>
                {rec.name.split(" ")[0]}
              </Text>
              <Text style={styles.recentRecSubtitle} numberOfLines={1}>
                {rec.bank.split(" ")[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.filterSection}>
          <View style={styles.chipsContainer}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === "all" && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter("all")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === "all" && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === "my-accounts" && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter("my-accounts")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === "my-accounts" && styles.filterChipTextActive,
                ]}
              >
                My Accounts
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBarWrapper}>
            <Ionicons
              name="search"
              size={16}
              color="#A0A0A0"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search username or name..."
              placeholderTextColor="#A0A0A0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color="#A0A0A0" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.contactsContainer}>
          {filteredRecipients.map((rec) => (
            <TouchableOpacity
              key={rec.id}
              style={styles.contactItem}
              onPress={() => handleSelectRecipient(rec)}
              activeOpacity={0.7}
            >
              <View style={styles.contactLeft}>
                <View
                  style={[styles.contactAvatar, { backgroundColor: rec.color }]}
                >
                  <Text
                    style={[styles.contactAvatarText, { color: rec.textColor }]}
                  >
                    {rec.initial}
                  </Text>
                </View>
                <View>
                  <Text style={styles.contactName}>{rec.name}</Text>
                  <Text style={styles.contactSub}>
                    {rec.bank} • @{rec.username}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
            </TouchableOpacity>
          ))}
          {filteredRecipients.length === 0 && (
            <Text style={styles.emptyText}>
              No recipients found matching search.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* --- SCANNER MODAL --- */}
      <Modal visible={showScanner} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.scannerOverlay}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.scannerCloseButton}
              onPress={() => setShowScanner(false)}
            >
              <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.scannerHeaderTitle}>Scan QR Code</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.viewfinderContainer}>
            <Text style={styles.viewfinderInstructions}>
              Scan the QR of the device
            </Text>

            <View style={styles.viewfinderFrame}>
              {permission?.granted ? (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />
              ) : (
                <View style={styles.cameraPermissionContainer}>
                  <Text style={styles.cameraPermissionText}>
                    Allow camera access to scan QR codes.
                  </Text>
                  <TouchableOpacity
                    style={styles.cameraPermissionButton}
                    onPress={() => requestPermission()}
                  >
                    <Text style={styles.cameraPermissionButtonText}>
                      Allow Camera
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <Animated.View
                style={[
                  styles.scannerLaserLine,
                  { transform: [{ translateY: scannerAnim }] },
                ]}
              />
              <View style={[styles.viewfinderCorner, styles.cornerTL]} />
              <View style={[styles.viewfinderCorner, styles.cornerTR]} />
              <View style={[styles.viewfinderCorner, styles.cornerBL]} />
              <View style={[styles.viewfinderCorner, styles.cornerBR]} />
            </View>

            <Text style={styles.viewfinderSubtext}>
              The QR code will be automatically detected when positioned in
              frame.
            </Text>
          </View>

          <View style={styles.simulatorSection}>
            <Text style={styles.simulatorTitle}>
              🎯 Simulate QR Scan (Click to Scan):
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.simulatorList}
            >
              {MOCK_RECIPIENTS.map((rec) => (
                <TouchableOpacity
                  key={rec.id}
                  style={styles.simulatorChip}
                  onPress={() => handleSimulateScan(rec)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.simulatorChipText}>@{rec.username}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      <TransactionReceiptModal
        visible={showReceiptModal}
        transaction={receiptTransaction}
        onClose={() => setShowReceiptModal(false)}
        onViewReceipt={() => {
          if (!receiptTransaction) return;
          setShowReceiptModal(false);
          router.push({
            pathname: "/transaction-details",
            params: { id: receiptTransaction.id },
          });
        }}
      />

      {/* --- ADD RECIPIENT MODAL --- */}
      <Modal
        visible={showAddRecipientModal}
        animationType="slide"
        onRequestClose={() => setShowAddRecipientModal(false)}
      >
        <SafeAreaView style={styles.fullScreenModal}>
          <KeyboardAvoidingView
            style={styles.fullScreenKeyboardAvoider}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.fullScreenModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Recipient</Text>
                <TouchableOpacity
                  onPress={() => setShowAddRecipientModal(false)}
                >
                  <Ionicons name="close-circle" size={24} color="#CCCCCC" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>Recipient username</Text>
                <Text style={styles.modalHelperText}>
                  Type the username you want to find and send money to.
                </Text>
                <View style={styles.modalInputWrapper}>
                  <Ionicons
                    name="person-circle-outline"
                    size={18}
                    color="#8E8E93"
                    style={styles.modalInputIcon}
                  />
                  <TextInput
                    style={styles.modalInputField}
                    placeholder="e.g. username_here"
                    placeholderTextColor="#A0A0A0"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    returnKeyType="done"
                    value={newRecipientUsername}
                    onChangeText={setNewRecipientUsername}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.modalConfirmButton, { marginTop: 20 }]}
                  onPress={() => {
                    const uname = newRecipientUsername.replace("@", "").trim();
                    const found = MOCK_RECIPIENTS.find(
                      (r) => r.username === uname,
                    );
                    if (found) {
                      setShowAddRecipientModal(false);
                      setNewRecipientUsername("");
                      handleSelectRecipient(found);
                    } else {
                      Alert.alert(
                        "User not found",
                        "That username does not exist in our system.",
                      );
                    }
                  }}
                >
                  <Text style={styles.modalConfirmButtonText}>
                    Add Recipient
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* --- TRANSFER FLOW MODAL --- */}
      <Modal
        visible={showTransferModal}
        animationType="slide"
        onRequestClose={closeTransferFlow}
      >
        <SafeAreaView style={styles.fullScreenModal}>
          <KeyboardAvoidingView
            style={styles.fullScreenKeyboardAvoider}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.transferSheet}>
              {selectedRecipient && (
                <>
                  {transferStep !== "success" && (
                    <View style={styles.transferHeader}>
                      {transferStep === "review" ? (
                        <TouchableOpacity
                          onPress={() => setTransferStepWithAnimation("amount")}
                        >
                          <Ionicons
                            name="chevron-back"
                            size={23}
                            color="#201B2D"
                          />
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.transferHeaderSpacer} />
                      )}
                      <Text style={styles.transferTitle}>
                        {transferStep === "amount"
                          ? "Send Money"
                          : "Review Transfer"}
                      </Text>
                      <TouchableOpacity
                        style={styles.transferCancelButton}
                        onPress={closeTransferFlow}
                      >
                        <Text style={styles.transferCancelText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {transferStep !== "success" && (
                    <View style={styles.transferRecipientCard}>
                      <View
                        style={[
                          styles.transferAvatar,
                          { backgroundColor: selectedRecipient.color },
                        ]}
                      >
                        <Text
                          style={[
                            styles.transferAvatarText,
                            { color: selectedRecipient.textColor },
                          ]}
                        >
                          {selectedRecipient.initial}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.transferRecipientName}>
                          {selectedRecipient.name}
                        </Text>
                        <Text style={styles.transferRecipientHandle}>
                          @{selectedRecipient.username}
                        </Text>
                      </View>
                    </View>
                  )}

                  {transferStep === "amount" && (
                    <ScrollView
                      contentContainerStyle={styles.transferBody}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                    >
                      <Text style={styles.transferLabel}>You send</Text>
                      <View
                        style={[
                          styles.transferAmountRow,
                          isOverBalance && styles.transferAmountError,
                        ]}
                      >
                        <Text style={styles.transferCurrency}>₦</Text>
                        <TextInput
                          style={styles.transferAmountInput}
                          placeholder="0"
                          placeholderTextColor="#CBC6D1"
                          keyboardType="decimal-pad"
                          autoFocus
                          value={amount}
                          onChangeText={setAmount}
                        />
                      </View>
                      <View style={styles.transferQuickRow}>
                        {quickAmounts.map((value) => (
                          <TouchableOpacity
                            key={value}
                            style={styles.transferQuickChip}
                            onPress={() => addQuickAmount(value)}
                          >
                            <Text style={styles.transferQuickText}>
                              +{value.toLocaleString()}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {isOverBalance && (
                        <Text style={styles.transferErrorText}>
                          Amount exceeds your available balance
                        </Text>
                      )}
                      <Text style={styles.transferLabel}>
                        Note{" "}
                        <Text style={styles.transferOptional}>(optional)</Text>
                      </Text>
                      <TextInput
                        style={styles.transferNoteInput}
                        placeholder="What's this for?"
                        placeholderTextColor="#ABA5B4"
                        value={memo}
                        onChangeText={(text) => setMemo(text.slice(0, 40))}
                        maxLength={40}
                        multiline
                      />
                      <Text style={styles.transferCharacterCount}>
                        {memo.length}/40
                      </Text>
                      <TouchableOpacity
                        style={styles.transferPrimaryButton}
                        onPress={continueToReview}
                      >
                        <Text style={styles.transferPrimaryText}>Continue</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  )}

                  {transferStep === "review" && (
                    <View style={styles.transferBody}>
                      <View style={styles.transferReviewRow}>
                        <Text style={styles.transferLabel}>You send</Text>
                        <Text style={styles.transferReviewAmount}>
                          ₦
                          {Number(amount || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                      <View style={styles.transferReviewRow}>
                        <Text style={styles.transferLabel}>Note</Text>
                        <Text style={styles.transferReviewValue}>
                          {memo || "No note"}
                        </Text>
                      </View>
                      <View style={styles.transferReviewRow}>
                        <Text style={styles.transferLabel}>Fee</Text>
                        <Text style={styles.transferFree}>Free</Text>
                      </View>
                      <View style={styles.transferTotalRow}>
                        <Text style={styles.transferTotalLabel}>Total</Text>
                        <Text style={styles.transferTotalAmount}>
                          ₦
                          {Number(amount || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                      <View style={styles.transferSecurity}>
                        <View style={styles.transferSecurityIcon}>
                          <Ionicons
                            name="shield-checkmark"
                            size={18}
                            color="#20142A"
                          />
                        </View>
                        <View>
                          <Text style={styles.transferSecurityTitle}>
                            Secure transfer
                          </Text>
                          <Text style={styles.transferSecurityCopy}>
                            Your money is safe with TallySpends.
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.transferPrimaryButton}
                        onPress={executeTransfer}
                      >
                        <Text style={styles.transferPrimaryText}>
                          Send Money
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {transferStep === "success" && (
                    <ScrollView
                      contentContainerStyle={styles.transferSuccessBody}
                      showsVerticalScrollIndicator={false}
                    >
                      <View style={styles.transferSuccessIcon}>
                        <Ionicons name="checkmark" size={54} color="#FFFFFF" />
                      </View>
                      <Text style={styles.transferSuccessTitle}>
                        Transfer Successful!
                      </Text>
                      <Text style={styles.transferSuccessLabel}>You sent</Text>
                      <Text style={styles.transferSuccessAmount}>
                        ₦
                        {Number(amount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </Text>
                      <Text style={styles.transferSuccessRecipient}>
                        to {selectedRecipient.name}
                        {`\n`}@{selectedRecipient.username}
                      </Text>
                      <TouchableOpacity
                        style={styles.transferReceiptButton}
                        onPress={() => {
                          setShowTransferModal(false);
                          router.push({
                            pathname: "/transaction-details",
                            params: { id: receiptTransaction?.id },
                          });
                        }}
                      >
                        <Ionicons
                          name="receipt-outline"
                          size={19}
                          color="#20142A"
                        />
                        <Text style={styles.transferReceiptText}>
                          View Receipt
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.transferHomeButton}
                        onPress={() => {
                          closeTransferFlow();
                          router.replace("/");
                        }}
                      >
                        <Text style={styles.transferHomeText}>
                          Back to Home
                        </Text>
                      </TouchableOpacity>
                    </ScrollView>
                  )}
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme?.backgroundColor || "#FFFFFF",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme?.textColor || "#1C1C1E",
    },
    headerQRButton: {
      padding: 4,
    },
    headerIconColor: {
      color: theme?.textColor || "#1C1C1E",
    },
    scrollContainer: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme?.textColor || "#1C1C1E",
      marginTop: 16,
      marginBottom: 12,
    },
    actionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    actionCard: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
      backgroundColor: "#F7F5F8",
      borderRadius: 12,
      marginHorizontal: 4,
    },
    actionIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#EAE5EC",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 6,
    },
    actionText: {
      fontSize: 12,
      fontWeight: "500",
      color: "#4B2C40",
    },
    recentsRow: {
      paddingRight: 16,
    },
    recentRecipientCard: {
      alignItems: "center",
      marginRight: 16,
      width: 64,
    },
    avatarBox: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 6,
    },
    avatarText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    recentRecName: {
      fontSize: 12,
      fontWeight: "500",
      color: theme?.textColor || "#1C1C1E",
    },
    recentRecSubtitle: {
      fontSize: 10,
      color: "#8E8E93",
    },
    filterSection: {
      marginTop: 16,
    },
    chipsContainer: {
      flexDirection: "row",
      marginBottom: 12,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: "#F2F2F7",
      marginRight: 8,
    },
    filterChipActive: {
      backgroundColor: "#20142A",
    },
    filterChipText: {
      fontSize: 13,
      color: "#8E8E93",
      fontWeight: "500",
    },
    filterChipTextActive: {
      color: "#FFFFFF",
    },
    searchBarWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F2F2F7",
      borderRadius: 10,
      paddingHorizontal: 10,
      height: 38,
    },
    searchIcon: {
      marginRight: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: "#000",
    },
    contactsContainer: {
      marginTop: 16,
    },
    contactItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#E5E5EA",
    },
    contactLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    contactAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    contactAvatarText: {
      fontSize: 14,
      fontWeight: "bold",
    },
    contactName: {
      fontSize: 15,
      fontWeight: "500",
      color: theme?.textColor || "#1C1C1E",
    },
    contactSub: {
      fontSize: 12,
      color: "#8E8E93",
    },
    emptyText: {
      textAlign: "center",
      color: "#8E8E93",
      marginTop: 20,
    },
    fullScreenModal: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },
    fullScreenKeyboardAvoider: {
      flex: 1,
    },
    fullScreenModalContent: {
      flex: 1,
      paddingHorizontal: 16,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
    },
    modalBody: {
      marginTop: 12,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: "#8E8E93",
      marginBottom: 6,
    },
    modalHelperText: {
      fontSize: 12,
      color: "#A0A0A0",
      marginBottom: 12,
    },
    modalInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#E5E5EA",
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 44,
    },
    modalInputIcon: {
      marginRight: 8,
    },
    modalInputField: {
      flex: 1,
      fontSize: 15,
    },
    modalConfirmButton: {
      backgroundColor: "#20142A",
      borderRadius: 10,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
    },
    modalConfirmButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    scannerOverlay: {
      flex: 1,
      backgroundColor: "#000000",
    },
    scannerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    scannerCloseButton: {
      padding: 4,
    },
    scannerHeaderTitle: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    viewfinderContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    viewfinderInstructions: {
      color: "#FFFFFF",
      marginBottom: 20,
    },
    viewfinderFrame: {
      width: 240,
      height: 240,
      borderRadius: 16,
      overflow: "hidden",
      position: "relative",
    },
    cameraPermissionContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      backgroundColor: "#1C1C1E",
    },
    cameraPermissionText: {
      color: "#FFF",
      textAlign: "center",
      marginBottom: 12,
    },
    cameraPermissionButton: {
      backgroundColor: "#007AFF",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    cameraPermissionButtonText: {
      color: "#FFF",
      fontWeight: "600",
    },
    scannerLaserLine: {
      height: 2,
      backgroundColor: "#FF3B30",
      width: "100%",
    },
    viewfinderCorner: {
      position: "absolute",
      width: 20,
      height: 20,
      borderColor: "#FFFFFF",
    },
    cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
    cornerBR: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 3,
      borderRightWidth: 3,
    },
    viewfinderSubtext: {
      color: "#8E8E93",
      textAlign: "center",
      fontSize: 12,
      marginTop: 20,
      paddingHorizontal: 40,
    },
    simulatorSection: {
      padding: 16,
    },
    simulatorTitle: {
      color: "#FFF",
      fontSize: 12,
      marginBottom: 8,
    },
    simulatorList: {
      flexDirection: "row",
    },
    simulatorChip: {
      backgroundColor: "#2C2C2E",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginRight: 8,
    },
    simulatorChipText: {
      color: "#FFF",
      fontSize: 12,
    },
    transferSheet: {
      flex: 1,
      paddingHorizontal: 16,
    },
    transferHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    transferHeaderSpacer: {
      width: 23,
    },
    transferTitle: {
      fontSize: 16,
      fontWeight: "600",
    },
    transferCancelButton: {},
    transferCancelText: {
      color: "#007AFF",
      fontSize: 15,
    },
    transferRecipientCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      backgroundColor: "#F7F5F8",
      borderRadius: 12,
      marginBottom: 16,
    },
    transferAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    transferAvatarText: {
      fontSize: 15,
      fontWeight: "bold",
    },
    transferRecipientName: {
      fontSize: 15,
      fontWeight: "600",
    },
    transferRecipientHandle: {
      fontSize: 12,
      color: "#8E8E93",
    },
    transferBody: {
      flex: 1,
    },
    transferLabel: {
      fontSize: 13,
      color: "#8E8E93",
      marginBottom: 4,
    },
    transferOptional: {
      fontSize: 11,
      color: "#A0A0A0",
    },
    transferAmountRow: {
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: "#E5E5EA",
      paddingBottom: 8,
      marginBottom: 12,
    },
    transferAmountError: {
      borderBottomColor: "#FF3B30",
    },
    transferCurrency: {
      fontSize: 28,
      fontWeight: "bold",
      marginRight: 8,
    },
    transferAmountInput: {
      flex: 1,
      fontSize: 28,
      fontWeight: "bold",
    },
    transferQuickRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 16,
    },
    transferQuickChip: {
      backgroundColor: "#F2F2F7",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
    },
    transferQuickText: {
      fontSize: 12,
      fontWeight: "500",
    },
    transferErrorText: {
      color: "#FF3B30",
      fontSize: 12,
      marginBottom: 12,
    },
    transferNoteInput: {
      borderWidth: 1,
      borderColor: "#E5E5EA",
      borderRadius: 10,
      padding: 10,
      height: 80,
      textAlignVertical: "top",
    },
    transferCharacterCount: {
      textAlign: "right",
      fontSize: 10,
      color: "#A0A0A0",
      marginTop: 4,
      marginBottom: 20,
    },
    transferPrimaryButton: {
      backgroundColor: "#20142A",
      borderRadius: 10,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
      marginTop: "auto",
      marginBottom: 20,
    },
    transferPrimaryText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    transferReviewRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#E5E5EA",
    },
    transferReviewAmount: {
      fontSize: 15,
      fontWeight: "bold",
    },
    transferReviewValue: {
      fontSize: 15,
    },
    transferFree: {
      fontSize: 15,
      color: "#34C759",
      fontWeight: "500",
    },
    transferTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 14,
    },
    transferTotalLabel: {
      fontSize: 16,
      fontWeight: "bold",
    },
    transferTotalAmount: {
      fontSize: 18,
      fontWeight: "bold",
    },
    transferSecurity: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F7F5F8",
      padding: 12,
      borderRadius: 10,
      marginTop: 12,
      marginBottom: 20,
    },
    transferSecurityIcon: {
      marginRight: 10,
    },
    transferSecurityTitle: {
      fontSize: 13,
      fontWeight: "600",
    },
    transferSecurityCopy: {
      fontSize: 11,
      color: "#8E8E93",
    },
    transferSuccessBody: {
      alignItems: "center",
      paddingTop: 40,
    },
    transferSuccessIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "#34C759",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    transferSuccessTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 16,
    },
    transferSuccessLabel: {
      fontSize: 13,
      color: "#8E8E93",
    },
    transferSuccessAmount: {
      fontSize: 32,
      fontWeight: "bold",
      marginVertical: 4,
    },
    transferSuccessRecipient: {
      textAlign: "center",
      fontSize: 14,
      color: "#8E8E93",
      marginBottom: 32,
    },
    transferReceiptButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#20142A",
      borderRadius: 10,
      height: 48,
      width: "100%",
      marginBottom: 12,
    },
    transferReceiptText: {
      fontSize: 15,
      fontWeight: "600",
      marginLeft: 6,
    },
    transferHomeButton: {
      backgroundColor: "#20142A",
      borderRadius: 10,
      height: 48,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    transferHomeText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "600",
    },
  });
