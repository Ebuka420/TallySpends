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

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TransferScreen() {
  const router = useRouter();
  const { addTransaction, transactions, customCategories, addCustomCategory, deleteCustomCategory, theme } = useAppStore();
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
  const [transferStep, setTransferStep] = useState<"amount" | "review" | "success">("amount");
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [newRecipientUsername, setNewRecipientUsername] = useState("");
  const quickAmounts = [500, 1000, 2000, 5000, 10000];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState("");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [showCustomCategoryManager, setShowCustomCategoryManager] =
    useState(false);

  // Animation for scanner line
  const scannerAnim = useRef(new Animated.Value(0)).current;

  const setTransferStepWithAnimation = (
    nextStep: "amount" | "review" | "success",
  ) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTransferStep(nextStep);
  };

  // Run scanner line animation when scanner is active
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

  // Balance logic
  const transactionsRaw = transactions || [];
  const totalIncome = transactionsRaw
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalExpenses = transactionsRaw
    .filter((t: any) => t.type === "expense")
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const currentBalance = 2926.78 + totalIncome - totalExpenses;

  // Filter recents
  const recentRecipients = MOCK_RECIPIENTS.filter((r) => r.isRecent);

  // Filter contacts by search query & category
  const filteredRecipients = MOCK_RECIPIENTS.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.username.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === "my-accounts") {
      // In a real app, "my-accounts" would filter to user's other accounts.
      // We mock it by showing cards containing "Carter" or "Budget" or "USD"
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
    // Add brief timeout for a smooth transition from scanner close to transfer modal open
    setTimeout(() => {
      handleSelectRecipient(recipient);
    }, 400);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    // Expecting url like: tallyspends://transfer?recipient=username&amount=1000&memo=Food
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
      // Not a full URL; fallback
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
      Alert.alert("Enter an amount", "Enter a valid transfer amount to continue.");
      return;
    }
    if (isOverBalance) {
      Alert.alert("Insufficient Funds", "You do not have enough funds to complete this transfer.");
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

  const handleDeleteCustomCategory = (category: string) => {
    Alert.alert(
      "Delete category",
      `Delete "${category}" from your saved categories?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteCustomCategory(category);
            if (selectedCategory === category) {
              setSelectedCategory(null);
              setMemo("");
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipients</Text>
        <TouchableOpacity
          style={styles.headerQRButton}
          onPress={() => router.push("/request")}
          activeOpacity={0.7}
        >
          <Ionicons name="qr-code-outline" size={20} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Send Money Actions */}
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

        {/* Recents Horizontal List */}
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

        {/* Filter Chips & Search Bar */}
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

        {/* Contacts Vertical List */}
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

      {/* --- MOCK SCANNER OVERLAY --- */}
      <Modal visible={showScanner} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.scannerOverlay}>
          {/* Scanner Header */}
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

          {/* Viewfinder Section */}
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
              ) : permission?.status === "undetermined" ? (
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
              ) : (
                <View style={styles.cameraPermissionContainer}>
                  <Text style={styles.cameraPermissionText}>
                    Camera access is blocked. Enable it in your device settings
                    to scan QR codes.
                  </Text>
                  <TouchableOpacity
                    style={styles.cameraPermissionButton}
                    onPress={() => requestPermission()}
                  >
                    <Text style={styles.cameraPermissionButtonText}>
                      Try Again
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Animated laser line overlay */}
              <Animated.View
                style={[
                  styles.scannerLaserLine,
                  {
                    transform: [{ translateY: scannerAnim }],
                  },
                ]}
              />

              {/* Viewfinder Corners */}
              <View style={[styles.viewfinderCorner, styles.cornerTL]} />
              <View style={[styles.viewfinderCorner, styles.cornerTR]} />
              <View style={[styles.viewfinderCorner, styles.cornerBL]} />
              <View style={[styles.viewfinderCorner, styles.cornerBR]} />
            </View>

            <Text style={styles.viewfinderSubtext}>
              The QR code will be automatically detected when you position it
              between the guide lines
            </Text>
          </View>

          {/* Simulate scans list */}
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

      {/* --- TRANSFER DETAILS MODAL --- */}
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
                  {transferStep !== "success" && <View style={styles.transferHeader}>
                    {transferStep === "review" ? <TouchableOpacity onPress={() => setTransferStepWithAnimation("amount")}><Ionicons name="chevron-back" size={23} color="#201B2D" /></TouchableOpacity> : <View style={styles.transferHeaderSpacer} />}
                    <Text style={styles.transferTitle}>{transferStep === "amount" ? "Send Money" : "Review Transfer"}</Text>
                    <TouchableOpacity style={styles.transferCancelButton} onPress={closeTransferFlow}><Text style={styles.transferCancelText}>Cancel</Text></TouchableOpacity>
                  </View>}
                  {transferStep !== "success" && <View style={styles.transferRecipientCard}>
                    <View style={[styles.transferAvatar, { backgroundColor: selectedRecipient.color }]}><Text style={[styles.transferAvatarText, { color: selectedRecipient.textColor }]}>{selectedRecipient.initial}</Text></View>
                    <View><Text style={styles.transferRecipientName}>{selectedRecipient.name}</Text><Text style={styles.transferRecipientHandle}>@{selectedRecipient.username}</Text></View>
                  </View>}
                  {transferStep === "amount" && <ScrollView contentContainerStyle={styles.transferBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <Text style={styles.transferLabel}>You send</Text>
                    <View style={[styles.transferAmountRow, isOverBalance && styles.transferAmountError]}><Text style={styles.transferCurrency}>₦</Text><TextInput style={styles.transferAmountInput} placeholder="0" placeholderTextColor="#CBC6D1" keyboardType="decimal-pad" autoFocus value={amount} onChangeText={setAmount} /></View>
                    <View style={styles.transferQuickRow}>{quickAmounts.map((value) => <TouchableOpacity key={value} style={styles.transferQuickChip} onPress={() => addQuickAmount(value)}><Text style={styles.transferQuickText}>+{value.toLocaleString()}</Text></TouchableOpacity>)}</View>
                    {isOverBalance && <Text style={styles.transferErrorText}>Amount exceeds your available balance</Text>}
                    <Text style={styles.transferLabel}>Note <Text style={styles.transferOptional}>(optional)</Text></Text>
                    <TextInput style={styles.transferNoteInput} placeholder="What's this for?" placeholderTextColor="#ABA5B4" value={memo} onChangeText={(text) => setMemo(text.slice(0, 40))} maxLength={40} multiline />
                    <Text style={styles.transferCharacterCount}>{memo.length}/40</Text>
                    <TouchableOpacity style={styles.transferPrimaryButton} onPress={continueToReview}><Text style={styles.transferPrimaryText}>Continue</Text></TouchableOpacity>
                  </ScrollView>}
                  {transferStep === "review" && <View style={styles.transferBody}>
                    <View style={styles.transferReviewRow}><Text style={styles.transferLabel}>You send</Text><Text style={styles.transferReviewAmount}>₦{Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text></View>
                    <View style={styles.transferReviewRow}><Text style={styles.transferLabel}>Note</Text><Text style={styles.transferReviewValue}>{memo || "No note"}</Text></View>
                    <View style={styles.transferReviewRow}><Text style={styles.transferLabel}>Fee</Text><Text style={styles.transferFree}>Free</Text></View>
                    <View style={styles.transferTotalRow}><Text style={styles.transferTotalLabel}>Total</Text><Text style={styles.transferTotalAmount}>₦{Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text></View>
                    <View style={styles.transferSecurity}><View style={styles.transferSecurityIcon}><Ionicons name="shield-checkmark" size={18} color="#20142A" /></View><View><Text style={styles.transferSecurityTitle}>Secure transfer</Text><Text style={styles.transferSecurityCopy}>Your money is safe with TallySpends.</Text></View></View>
                    <TouchableOpacity style={styles.transferPrimaryButton} onPress={executeTransfer}><Text style={styles.transferPrimaryText}>Send Money</Text></TouchableOpacity>
                  </View>}
                  {transferStep === "success" && <ScrollView contentContainerStyle={styles.transferSuccessBody} showsVerticalScrollIndicator={false}>
                    <View style={styles.transferSuccessIcon}><Ionicons name="checkmark" size={54} color="#FFFFFF" /></View><Text style={styles.transferSuccessTitle}>Transfer Successful!</Text><Text style={styles.transferSuccessLabel}>You sent</Text><Text style={styles.transferSuccessAmount}>₦{Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text><Text style={styles.transferSuccessRecipient}>to {selectedRecipient.name}{`\n`}@{selectedRecipient.username}</Text>
                    <TouchableOpacity style={styles.transferReceiptButton} onPress={() => { setShowTransferModal(false); router.push({ pathname: "/transaction-details", params: { id: receiptTransaction?.id } }); }}><Ionicons name="receipt-outline" size={19} color="#20142A" /><Text style={styles.transferReceiptText}>View Receipt</Text></TouchableOpacity><TouchableOpacity style={styles.transferHomeButton} onPress={() => { closeTransferFlow(); router.replace("/"); }}><Text style={styles.transferHomeText}>Back to Home</Text></TouchableOpacity>
                  </ScrollView>}
                </>
              )}

              {false && <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Send Money</Text>
                <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                  <Ionicons name="close-circle" size={24} color="#CCCCCC" />
                </TouchableOpacity>
              </View>}

              {false && selectedRecipient && (
                <ScrollView
                  style={styles.modalBody}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Selected Recipient Card */}
                  <View style={styles.selectedRecipientHeader}>
                    <View
                      style={[
                        styles.selectedAvatar,
                        { backgroundColor: selectedRecipient.color },
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectedAvatarText,
                          { color: selectedRecipient.textColor },
                        ]}
                      >
                        {selectedRecipient.initial}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedName}>
                        {selectedRecipient.name}
                      </Text>
                      <Text style={styles.selectedUsername}>
                        {selectedRecipient.bank}
                      </Text>
                    </View>
                  </View>

                  {/* Amount Input */}
                  <Text style={styles.inputLabel}>Enter Transfer Amount</Text>
                  <View
                    style={[
                      styles.modalAmountWrapper,
                      isOverBalance && styles.modalAmountWrapperError,
                    ]}
                  >
                    <Text style={styles.modalCurrencySymbol}>₦</Text>
                    <TextInput
                      style={styles.modalAmountInput}
                      placeholder="0.00"
                      placeholderTextColor="#A0A0A0"
                      keyboardType="decimal-pad"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>

                  {/* Quick amount buttons */}
                  <View style={styles.quickAmountsRow}>
                    {quickAmounts.map((a) => (
                      <TouchableOpacity
                        key={a}
                        style={styles.quickAmountChip}
                        onPress={() => setAmount(String(a))}
                      >
                        <Text style={styles.quickAmountText}>
                          ₦{a.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {isOverBalance && (
                    <Text style={styles.modalErrorText}>
                      ⚠️ Amount exceeds available balance
                    </Text>
                  )}

                  {/* Memo / Category Input (required) */}
                  <View style={styles.categoryLabelRow}>
                    <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                      Category (choose one)
                    </Text>
                    {(customCategories || []).length > 0 ? (
                      <TouchableOpacity
                        style={styles.categoryManageButton}
                        onPress={() =>
                          setShowCustomCategoryManager((prev) => !prev)
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.categoryManageButtonText}>×</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={styles.categoryRow}>
                    {[
                      "Food",
                      "Utility",
                      "Purchase",
                      "Transport",
                      "Rent",
                      ...(customCategories || []),
                      "Other",
                      "Add Category",
                    ].map((cat) => {
                      const isCustomCategory = (
                        customCategories || []
                      ).includes(cat);
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryChip,
                            cat === "Add Category" && styles.addCategoryChip,
                            selectedCategory === cat &&
                              styles.categoryChipActive,
                            cat === "Add Category" &&
                              selectedCategory === cat &&
                              styles.addCategoryChipActive,
                          ]}
                          onPress={() => {
                            setSelectedCategory(cat);
                            setCustomCategory("");
                            setCustomCategoryInput("");
                            setMemo(
                              cat === "Other" || cat === "Add Category"
                                ? ""
                                : cat,
                            );
                          }}
                          onLongPress={() => {
                            if (isCustomCategory) {
                              handleDeleteCustomCategory(cat);
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.categoryText,
                              selectedCategory === cat &&
                                styles.categoryTextActive,
                              cat === "Add Category" &&
                                styles.addCategoryChipText,
                              cat === "Add Category" &&
                                selectedCategory === cat &&
                                styles.addCategoryChipTextActive,
                            ]}
                          >
                            {cat === "Add Category" ? "＋" : cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {(customCategories || []).length > 0 &&
                  showCustomCategoryManager ? (
                    <View style={styles.customCategoriesList}>
                      {(customCategories || []).map((category) => (
                        <View key={category} style={styles.customCategoryRow}>
                          <Text style={styles.customCategoryText}>
                            {category}
                          </Text>
                          <TouchableOpacity
                            style={styles.deleteCategoryButton}
                            onPress={() => handleDeleteCustomCategory(category)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.deleteCategoryButtonText}>
                              ×
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {selectedCategory ? (
                    <TouchableOpacity
                      style={styles.clearSelectionButton}
                      onPress={() => {
                        setSelectedCategory(null);
                        setCustomCategory("");
                        setCustomCategoryInput("");
                        setMemo("");
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.clearSelectionButtonText}>Clear</Text>
                    </TouchableOpacity>
                  ) : null}

                  {selectedCategory === "Other" ||
                  selectedCategory === "Add Category" ? (
                    <View style={styles.customCategoryInputWrapper}>
                      <Text style={styles.inputLabel}>
                        {selectedCategory === "Other"
                          ? "Other category"
                          : "New category"}
                      </Text>
                      <TextInput
                        style={styles.customCategoryInput}
                        placeholder={
                          selectedCategory === "Other"
                            ? "Type a custom category"
                            : "Type a new category name"
                        }
                        placeholderTextColor="#A0A0A0"
                        value={customCategoryInput}
                        onChangeText={setCustomCategoryInput}
                      />
                    </View>
                  ) : null}

                  {selectedCategory === "Add Category" ? (
                    <TouchableOpacity
                      style={styles.addCustomCategoryButton}
                      onPress={() => {
                        const trimmed = customCategoryInput.trim();
                        if (!trimmed) return;
                        addCustomCategory(trimmed);
                        setCustomCategory(trimmed);
                        setSelectedCategory(trimmed);
                        setMemo(trimmed);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addCustomCategoryButtonText}>
                        Save this as my category
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  {/* Confirm Button */}
                  <TouchableOpacity
                    style={[
                      styles.modalConfirmButton,
                      (isOverBalance ||
                        !amount ||
                        parseFloat(amount) <= 0 ||
                        !selectedCategory) &&
                        styles.modalConfirmButtonDisabled,
                    ]}
                    onPress={executeTransfer}
                    activeOpacity={0.8}
                    disabled={
                      isOverBalance ||
                      !amount ||
                      parseFloat(amount) <= 0 ||
                      !selectedCategory
                    }
                  >
                    <Text style={styles.modalConfirmButtonText}>
                      Confirm Send ₦
                      {amount
                        ? Number(amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "0.00"}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
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
    color: theme.textPrimary,
    letterSpacing: -0.3,
  },
  headerQRButton: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: theme.accentSoft,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#EDE8F3",
    shadowColor: "#3A2E53",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.accentSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.textPrimary,
  },
  recentsRow: {
    gap: 12,
    paddingBottom: 24,
  },
  recentRecipientCard: {
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 12,
    width: 82,
    borderWidth: 1,
    borderColor: "#EDE8F3",
    shadowColor: "#3A2E53",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
  },
  recentRecName: {
    fontSize: 11,
    color: theme.textPrimary,
    fontWeight: "600",
    textAlign: "center",
  },
  recentRecSubtitle: {
    fontSize: 9,
    color: theme.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  filterSection: {
    marginBottom: 16,
    gap: 12,
  },
  chipsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: "#EDE8F3",
  },
  filterChipActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.textSecondary,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: "#EDE8F3",
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.textPrimary,
  },
  contactsContainer: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EDE8F3",
    gap: 12,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  contactAvatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  contactName: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.textPrimary,
  },
  contactSub: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    color: theme.textSecondary,
    fontSize: 12,
    textAlign: "center",
    marginVertical: 20,
  },

  // Viewfinder Simulator
  scannerOverlay: {
    flex: 1,
    backgroundColor: "#111116",
    justifyContent: "space-between",
  },
  scannerHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  scannerCloseButton: {
    padding: 6,
  },
  scannerHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  viewfinderContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    flex: 1,
  },
  viewfinderInstructions: {
    color: "#CCCCCC",
    fontSize: 13,
    marginBottom: 24,
    textAlign: "center",
  },
  viewfinderFrame: {
    width: 250,
    height: 250,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#111116",
  },
  cameraPermissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(17, 17, 22, 0.95)",
  },
  cameraPermissionText: {
    color: "#FFFFFF",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 14,
  },
  cameraPermissionButton: {
    backgroundColor: "#5B4E91",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cameraPermissionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  scannerLaserLine: {
    height: 3,
    backgroundColor: "#5B4E91",
    width: "100%",
    position: "absolute",
    shadowColor: "#5B4E91",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  viewfinderCorner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "#5B4E91",
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  viewfinderSubtext: {
    color: "#8E8E93",
    fontSize: 11,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 16,
  },
  simulatorSection: {
    padding: 20,
    backgroundColor: "#19171F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  simulatorTitle: {
    color: "#5B4E91",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },
  simulatorList: {
    gap: 8,
    paddingBottom: 4,
  },
  simulatorChip: {
    backgroundColor: "rgba(91, 78, 145, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(91, 78, 145, 0.3)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  simulatorChipText: {
    color: "#5B4E91",
    fontSize: 11,
    fontWeight: "600",
  },

  // Modal styling
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
    paddingHorizontal: 0,
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
    borderColor: theme.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  selectedRecipientHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.mutedBackground,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 16,
  },
  selectedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedAvatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  selectedName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.textPrimary,
  },
  selectedUsername: {
    fontSize: 11,
    color: theme.accentSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  selectedBank: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 2,
  },
  modalBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalBalanceLabel: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  modalBalanceValue: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.textSecondary,
    marginBottom: 8,
  },
  modalAmountWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.mutedBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  modalAmountWrapperError: {
    borderWidth: 1.5,
    borderColor: "#EF4444",
  },
  modalCurrencySymbol: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.textPrimary,
    marginRight: 4,
  },
  modalAmountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    color: theme.textPrimary,
  },
  modalErrorText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 6,
    marginLeft: 4,
  },
  modalMemoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.mutedBackground,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
  },
  memoIcon: {
    marginRight: 8,
  },
  modalHelperText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  modalInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.mutedBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    height: 52,
  },
  modalInputIcon: {
    marginRight: 8,
  },
  modalInputField: {
    flex: 1,
    fontSize: 14,
    color: theme.textPrimary,
    paddingVertical: 0,
  },
  modalConfirmButton: {
    backgroundColor: theme.accent,
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  modalConfirmButtonDisabled: {
    backgroundColor: "#CCCCCC",
    shadowOpacity: 0,
    elevation: 0,
  },
  modalConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  quickAmountsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  quickAmountChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.surfaceSoft,
    borderRadius: 14,
    marginRight: 8,
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: theme.surfaceSoft,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: theme.accent,
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
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  customCategoriesList: {
    marginTop: 10,
    backgroundColor: theme.mutedBackground,
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
    color: theme.textPrimary,
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
    backgroundColor: theme.surfaceSoft,
  },
  clearSelectionButtonText: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  customCategoryInputWrapper: {
    marginTop: 12,
    backgroundColor: theme.mutedBackground,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  customCategoryInput: {
    fontSize: 14,
    color: theme.textPrimary,
    paddingVertical: 0,
  },
  categoryText: {
    fontSize: 12,
    color: theme.textPrimary,
    fontWeight: "600",
  },
  categoryTextActive: {
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
});
