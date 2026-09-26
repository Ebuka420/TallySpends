import { BudgetDate } from "./PlanningUI";
import { CoachToolSheet } from "./CoachToolSheet";
import { CoachActionMenu } from "./CoachActionMenu";
import { SmartCoachSheet } from "./SmartCoachSheet";
import type { CoachAction } from "../src/coach/menu";
import { useRouter } from "expo-router";
import { completeTransaction } from "../src/transactionCompletion";
import { useTransferAction } from "./TransferUI";
import { AmountInput, BudgetButton } from "./BudgetUI";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useState } from "react";
import { Alert, Image, Keyboard, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";
import { parseReceiptText, type ParsedReceiptLineItem } from "../src/utils/receiptParser";
type ActionMode = CoachAction;
const CATEGORY_OPTIONS = ["Food & Dining", "Groceries", "Shopping", "Transport", "Bills & Utilities", "Entertainment", "Others"];
export default function RadialFloatingBot() {
  const router = useRouter();
  const transactionAction = useTransferAction();
  const {
    themePreference,
    themeMode,
    addTransaction
  } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";
  const [activeModal, setActiveModal] = useState<ActionMode | null>(null);

  // Form States
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food & Dining");

  // Calculator State
  const [calculatorExpression, setCalculatorExpression] = useState("");
  const [calculatorResult, setCalculatorResult] = useState("0");
  const [calculatorHasResult, setCalculatorHasResult] = useState(false);

  // Real Receipt OCR State
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
  const [scannedMerchant, setScannedMerchant] = useState("");
  const [scannedAmount, setScannedAmount] = useState("");
  const [scannedCategory, setScannedCategory] = useState("Food & Dining");
  const [scannedDate, setScannedDate] = useState(new Date().toISOString().slice(0, 10));
  const [scannedItems, setScannedItems] = useState<ParsedReceiptLineItem[]>([]);
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const handleTriggerAction = useCallback((mode: ActionMode) => {
    Keyboard.dismiss();
    setActiveModal(mode);
    if (mode === "scan") {
      setScannedImageUri(null);
      setScannedMerchant("");
      setScannedAmount("");
      setScannedItems([]);
      setOcrConfidence(null);
    }
  }, []);
  /* ================================================================
      MODAL SUBMISSIONS
  ================================================================= */
  const handleAddExpenseSubmit = async () => {
    const parsed = parseFloat(expenseAmount);
    if (!expenseName.trim() || isNaN(parsed) || parsed <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid expense name and amount.");
      return;
    }
    const transaction = {
      id: `tx-${Date.now()}`,
      title: expenseName.trim(),
      amount: parsed,
      category: expenseCategory || "Others",
      type: "expense",
      date: new Date().toISOString().slice(0, 10)
    };
    await transactionAction.run(() => addTransaction(transaction), () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setExpenseName("");
      setExpenseAmount("");
      setActiveModal(null);
      completeTransaction(router, transaction.id);
    });
  };
  const handleCalculatorInput = (val: string) => {
    if (calculatorHasResult) {
      setCalculatorExpression(calculatorResult + val);
      setCalculatorHasResult(false);
      return;
    }
    setCalculatorExpression(prev => prev + val);
  };
  const handleCalculatorClear = () => {
    setCalculatorExpression("");
    setCalculatorResult("0");
    setCalculatorHasResult(false);
  };
  const handleCalculatorBackspace = () => {
    if (calculatorHasResult) {
      handleCalculatorClear();
      return;
    }
    setCalculatorExpression(prev => prev.slice(0, -1));
  };
  const handleCalculatorEquals = () => {
    try {
      if (!calculatorExpression.trim()) return;
      const sanitized = calculatorExpression.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
      const res = Function(`'use strict'; return (${sanitized})`)();
      if (typeof res === "number" && !isNaN(res) && isFinite(res)) {
        const formatted = String(Number(res.toFixed(2)));
        setCalculatorResult(formatted);
        setCalculatorHasResult(true);
      } else {
        setCalculatorResult("Error");
      }
    } catch {
      setCalculatorResult("Error");
    }
  };
  const processCapturedReceiptImage = async (uri: string, base64?: string | null) => {
    setScannedImageUri(uri);
    setIsAnalyzingReceipt(true);
    // Reset fields to clean initial state
    setScannedMerchant("");
    setScannedAmount("");
    setScannedDate(new Date().toISOString().slice(0, 10));
    setScannedItems([]);
    setOcrConfidence(null);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      let recognizedText = "";
      if (base64) {
        try {
          const formData = new FormData();
          formData.append("base64Image", `data:image/jpeg;base64,${base64}`);
          formData.append("language", "eng");
          formData.append("isOverlayRequired", "false");
          formData.append("OCREngine", "2");
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6500);
          const response = await fetch("https://api.ocr.space/parse/image", {
            method: "POST",
            headers: {
              apikey: "K88363712888957"
            },
            body: formData,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            const data = await response.json();
            const parsedResults = data?.ParsedResults;
            if (Array.isArray(parsedResults) && parsedResults[0]?.ParsedText) {
              recognizedText = parsedResults[0].ParsedText;
            }
          }
        } catch {
          // Network or timeout - fallback to manual input without fake data
        }
      }
      if (recognizedText && recognizedText.trim().length > 0) {
        const parsed = parseReceiptText(recognizedText);
        if (parsed.merchantName) {
          setScannedMerchant(parsed.merchantName);
        }
        if (parsed.totalAmount && parsed.totalAmount > 0) {
          setScannedAmount(String(parsed.totalAmount));
        }
        if (parsed.category) {
          setScannedCategory(parsed.category);
        }
        if (parsed.date) {
          setScannedDate(parsed.date);
        }
        if (parsed.lineItems && parsed.lineItems.length > 0) {
          setScannedItems(parsed.lineItems);
        }
        setOcrConfidence(parsed.confidence);
      } else {
        setOcrConfidence(null);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      // Fallback
    } finally {
      setIsAnalyzingReceipt(false);
    }
  };
  const handleLaunchCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Camera access is needed to capture receipt photos.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        await processCapturedReceiptImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (e: any) {
      Alert.alert("Camera Error", e.message || "Could not open camera.");
    }
  };
  const handlePickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Photo library access is needed to select receipts.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
        base64: true
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        await processCapturedReceiptImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (e: any) {
      Alert.alert("Gallery Error", e.message || "Could not select image.");
    }
  };
  const handleSaveScannedReceipt = async () => {
    const parsed = parseFloat(scannedAmount);
    const merchantName = scannedMerchant.trim() || "Receipt Expense";
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Enter Amount", "Please enter the total receipt amount.");
      return;
    }
    const transaction = {
      id: `tx-${Date.now()}`,
      title: merchantName,
      amount: parsed,
      category: scannedCategory || "Food & Dining",
      type: "expense",
      date: scannedDate || new Date().toISOString().slice(0, 10),
      receiptImage: scannedImageUri || undefined
    };
    await transactionAction.run(() => addTransaction(transaction), () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setActiveModal(null);
      setScannedImageUri(null);
      setScannedMerchant("");
      setScannedAmount("");
      setScannedItems([]);
      setOcrConfidence(null);
      completeTransaction(router, transaction.id);
    });
  };
  const CALCULATOR_BUTTONS = [["C", "÷", "×", "⌫"], ["7", "8", "9", "−"], ["4", "5", "6", "+"], ["1", "2", "3", "="], ["0", ".", "", ""]];
  return <>
      <CoachActionMenu theme={theme} dark={isDark} onAction={handleTriggerAction} />
      <SmartCoachSheet visible={activeModal === "coach"} theme={theme} dark={isDark} onClose={() => setActiveModal(null)} />
      <CoachToolSheet visible={activeModal === "add" || activeModal === "calc" || activeModal === "scan"} theme={theme} icon={activeModal === "add" ? "add-outline" : activeModal === "calc" ? "calculator-outline" : "scan-outline"} title={activeModal === "add" ? "Add an expense" : activeModal === "calc" ? "Calculator" : scannedImageUri ? "Review your receipt" : "Scan a receipt"} subtitle={activeModal === "add" ? "Keep the little things accounted for." : activeModal === "calc" ? "Work it out, then add it to your spending." : scannedImageUri ? "A quick check before you save." : "Turn a paper receipt into a spending record."} onClose={() => {
      if (!transactionAction.busy) setActiveModal(null);
    }} footer={activeModal === "add" ? <><BudgetButton theme={theme} title={transactionAction.busy ? "Saving…" : "Save expense"} disabled={transactionAction.busy || !expenseName.trim() || !(Number(expenseAmount) > 0)} onPress={handleAddExpenseSubmit} /><Text style={[styles.footnote, {
        color: theme.textSecondary
      }]}>Only record expenses that aren't already in your history.</Text></> : activeModal === "calc" ? <BudgetButton theme={theme} title="Use as expense amount" disabled={!calculatorHasResult || !(Number(calculatorResult) > 0)} onPress={() => {
      setExpenseAmount(calculatorResult);
      setExpenseName("");
      setActiveModal("add");
    }} /> : undefined}>
        {activeModal === "add" && <>
        <View style={[styles.expenseAmountCard, {
          backgroundColor: theme.surface,
          borderColor: theme.border
        }]}>
          <Text style={[styles.amountCaption, {
            color: theme.textSecondary
          }]}>HOW MUCH DID YOU SPEND?</Text>
          <View style={styles.expenseAmountRow}><Text style={{
              fontSize: 29,
              color: theme.accent
            }}>₦</Text><AmountInput theme={theme} title="Expense amount" value={expenseAmount} onChangeText={setExpenseAmount} placeholder="0.00" style={styles.expenseAmountInput} /></View>
          <View style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 5
          }}><Ionicons name="keypad-outline" size={12} color={theme.textSecondary} /><Text style={{
              color: theme.textSecondary,
              fontSize: 10
            }}>Tap to enter an amount</Text></View>
        </View>
        <Text style={[styles.fieldLabel, {
          color: theme.textPrimary
        }]}>What was it for?</Text>
        <TextInput accessibilityLabel="Expense name" style={[styles.input, {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.textPrimary
        }]} placeholder="Lunch, a ride, something for home…" placeholderTextColor={theme.textSecondary} value={expenseName} onChangeText={setExpenseName} maxLength={100} />
        <Text style={[styles.fieldLabel, {
          color: theme.textPrimary
        }]}>Choose a category</Text>
        <View style={styles.categoryPillsRow}>{CATEGORY_OPTIONS.map(category => <Pressable key={category} accessibilityRole="radio" accessibilityState={{
            checked: expenseCategory === category
          }} onPress={() => setExpenseCategory(category)} style={[styles.categoryPill, {
            backgroundColor: expenseCategory === category ? theme.accentSoft : theme.surface,
            borderColor: expenseCategory === category ? theme.accent : theme.border
          }]}><Text style={{
              color: expenseCategory === category ? theme.accent : theme.textSecondary,
              fontSize: 12,
              fontWeight: "600"
            }}>{category}</Text>{expenseCategory === category && <Ionicons name="checkmark" color={theme.accent} size={14} />}</Pressable>)}</View>
        {!!transactionAction.error && <Text accessibilityLiveRegion="polite" style={{
          color: theme.danger,
          fontSize: 12,
          lineHeight: 18
        }}>{transactionAction.error}</Text>}
      </>}
        {activeModal === "calc" && <>
                    <View style={[styles.calculatorDisplay, {
          backgroundColor: theme.background,
          borderColor: theme.border
        }]}>
              <Text numberOfLines={2} style={[styles.calculatorExpression, {
            color: theme.textSecondary
          }]}>
                {calculatorExpression || "0"}
              </Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.calculatorResult, {
            color: theme.textPrimary
          }]}>
                {calculatorResult}
              </Text>
            </View>

            <View style={styles.calculatorGrid}>
              {CALCULATOR_BUTTONS.map((row, rowIndex) => row.map((button, btnIndex) => {
            if (!button) {
              return <View key={`${rowIndex}-${btnIndex}`} style={styles.calculatorButtonPlaceholder} />;
            }
            const isOperator = ["÷", "×", "−", "+"].includes(button);
            const isEquals = button === "=";
            const isClear = button === "C";
            const isBackspace = button === "⌫";
            return <TouchableOpacity key={`${rowIndex}-${button}`} accessibilityRole="button" accessibilityLabel={isBackspace ? "Delete last digit" : isClear ? "Clear calculator" : isEquals ? "Calculate result" : button} activeOpacity={0.7} onPress={() => {
              if (isClear) return handleCalculatorClear();
              if (isBackspace) return handleCalculatorBackspace();
              if (isEquals) return handleCalculatorEquals();
              handleCalculatorInput(button);
              Haptics.selectionAsync();
            }} style={[styles.calculatorButton, {
              backgroundColor: isEquals ? theme.accent : isOperator || isClear || isBackspace ? theme.surfaceSoft : theme.surface,
              borderColor: theme.border
            }]}>
                      {isBackspace ? <Ionicons name="backspace-outline" size={20} color={theme.textPrimary} /> : <Text style={[styles.calculatorButtonText, {
                color: isEquals ? isDark ? theme.background : "#FFFFFF" : theme.textPrimary,
                fontWeight: isEquals || isOperator ? "800" : "600"
              }]}>
                          {button}
                        </Text>}
                    </TouchableOpacity>;
          }))}
            </View>

      </>}
        {activeModal === "scan" && <>
                      {!scannedImageUri ? <View style={{
          gap: 14,
          paddingVertical: 10
        }}>
                  <Text style={[styles.scannerIntroText, {
            color: theme.textSecondary
          }]}>
                    Take a clear photo of your paper receipt. We
                    will look for the merchant, date and total for you to review.
                  </Text>

                  {/* Viewfinder Preview Container */}
                  <View style={[styles.viewfinderBox, {
            backgroundColor: theme.surfaceSoft,
            borderColor: theme.accent
          }]}>
                    <View style={[styles.viewfinderCornerTL, {
              borderColor: theme.accent
            }]} />
                    <View style={[styles.viewfinderCornerTR, {
              borderColor: theme.accent
            }]} />
                    <View style={[styles.viewfinderCornerBL, {
              borderColor: theme.accent
            }]} />
                    <View style={[styles.viewfinderCornerBR, {
              borderColor: theme.accent
            }]} />

                    <View style={styles.viewfinderContent}>
                      <Ionicons name="scan-outline" size={48} color={theme.accent} />
                      <Text style={[styles.viewfinderTip, {
                color: theme.textPrimary
              }]}>
                        Align receipt inside frame
                      </Text>
                      <Text style={[styles.viewfinderSubTip, {
                color: theme.textSecondary
              }]}>
                        Ensure good lighting & flat corners
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={[styles.captureOptionCard, {
            backgroundColor: theme.surface,
            borderColor: theme.accent
          }]} onPress={handleLaunchCamera} activeOpacity={0.85}>
                    <View style={[styles.captureOptionIconBox, {
              backgroundColor: theme.accent
            }]}>
                      <Ionicons name="camera" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.captureOptionInfo}>
                      <Text style={[styles.captureOptionTitle, {
                color: theme.textPrimary
              }]}>
                        Take Photo with Camera
                      </Text>
                      <Text style={[styles.captureOptionSub, {
                color: theme.textSecondary
              }]}>
                        Take a clear photo in good light
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.captureOptionCard, {
            backgroundColor: theme.surface,
            borderColor: theme.border
          }]} onPress={handlePickFromGallery} activeOpacity={0.85}>
                    <View style={[styles.captureOptionIconBox, {
              backgroundColor: isDark ? theme.background : "#EDE7F3"
            }]}>
                      <Ionicons name="images" size={22} color={theme.accent} />
                    </View>
                    <View style={styles.captureOptionInfo}>
                      <Text style={[styles.captureOptionTitle, {
                color: theme.textPrimary
              }]}>
                        Upload from Photo Library
                      </Text>
                      <Text style={[styles.captureOptionSub, {
                color: theme.textSecondary
              }]}>
                        Select stored invoice, e-bill or screenshot
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View> : isAnalyzingReceipt ? <View style={[styles.analyzingCard, {
          backgroundColor: theme.background,
          borderColor: theme.border
        }]}>
                  <View style={[styles.analyzingIconBox, {
            backgroundColor: theme.accent
          }]}>
                    <Ionicons name="sparkles" size={28} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.analyzingTitle, {
            color: theme.textPrimary
          }]}>
                    Analyzing Receipt OCR...
                  </Text>
                  <Text style={[styles.analyzingSub, {
            color: theme.textSecondary
          }]}>
                    Detecting merchant, dates, taxes, and total payable amount
                  </Text>
                </View> : <View style={{
          gap: 14,
          paddingBottom: 10
        }}>
                  {/* Photo Thumbnail & Retake */}
                  <View style={[styles.capturedImageContainer, {
            backgroundColor: theme.background,
            borderColor: theme.border
          }]}>
                    <Image source={{
              uri: scannedImageUri
            }} style={styles.capturedReceiptPhoto} resizeMode="cover" />
                    <TouchableOpacity style={[styles.retakeFloatingBadge, {
              backgroundColor: "rgba(0,0,0,0.75)"
            }]} onPress={() => {
              setScannedImageUri(null);
              setScannedMerchant("");
              setScannedAmount("");
              setScannedItems([]);
              setOcrConfidence(null);
            }}>
                      <Ionicons name="refresh" size={15} color="#FFFFFF" />
                      <Text style={styles.retakeBadgeText}>Retake Photo</Text>
                    </TouchableOpacity>
                  </View>

                  {/* OCR AI Badge or Photo Attached Guide */}
                  {ocrConfidence ? <View style={[styles.ocrConfidenceBanner, {
            backgroundColor: isDark ? "#1B2A1E" : "#EAF7ED",
            borderColor: isDark ? "#2A4B31" : "#CBE7D1"
          }]}>
                      <Ionicons name="checkmark-circle" size={16} color={isDark ? "#4ADE80" : "#16A34A"} />
                      <Text style={[styles.ocrConfidenceText, {
              color: isDark ? "#86EFAC" : "#15803D"
            }]}>
                        AI Verified ({Math.round(ocrConfidence * 100)}% match) •
                        Tap any field to edit
                      </Text>
                    </View> : <View style={[styles.ocrConfidenceBanner, {
            backgroundColor: isDark ? theme.surfaceSoft : "#F4EFF9",
            borderColor: theme.border
          }]}>
                      <Ionicons name="document-text-outline" size={16} color={theme.accent} />
                      <Text style={[styles.ocrConfidenceText, {
              color: theme.textPrimary
            }]}>
                        Receipt Attached • Enter the amount & store below
                      </Text>
                    </View>}

                  {/* Form Inputs */}
                  <View>
                    <Text style={[styles.inputLabelSmall, {
              color: theme.textSecondary
            }]}>
                      Merchant / Store Name
                    </Text>
                    <TextInput style={[styles.input, {
              backgroundColor: theme.background,
              borderColor: theme.border,
              color: theme.textPrimary
            }]} placeholder="e.g. Grocery Mart, Restaurant" placeholderTextColor={theme.textSecondary} value={scannedMerchant} onChangeText={setScannedMerchant} />
                  </View>

                  <View>
                    <Text style={[styles.inputLabelSmall, {
              color: theme.textSecondary
            }]}>
                      Total Amount (₦)
                    </Text>
                    <AmountInput style={[styles.input, {
              backgroundColor: theme.background,
              borderColor: theme.border,
              color: theme.textPrimary,
              fontSize: 20,
              fontWeight: "800"
            }]} placeholder="0.00" placeholderTextColor={theme.textSecondary} theme={theme} value={scannedAmount} onChangeText={setScannedAmount} />
                  </View>

                  <View>
                    <Text style={[styles.inputLabelSmall, {
              color: theme.textSecondary
            }]}>
                      Transaction Date
                    </Text>
                    <BudgetDate theme={theme} label="Paid on" value={scannedDate} onChange={setScannedDate} />
                  </View>

                  <Text style={[styles.inputLabelSmall, {
            color: theme.textSecondary
          }]}>
                    Category
                  </Text>
                  <View style={styles.categoryPillsRow}>
                    {CATEGORY_OPTIONS.map(cat => {
              const isSelected = scannedCategory === cat;
              return <TouchableOpacity key={cat} onPress={() => setScannedCategory(cat)} style={[styles.categoryPill, {
                backgroundColor: isSelected ? theme.accent : isDark ? theme.surfaceSoft : "#F3EBF8",
                borderColor: isSelected ? theme.accent : theme.border
              }]}>
                          <Text style={[styles.categoryPillText, {
                  color: isSelected ? "#FFFFFF" : theme.textPrimary,
                  fontWeight: isSelected ? "700" : "500"
                }]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>;
            })}
                  </View>

                  {/* Itemized Line Items Breakdown if available */}
                  {scannedItems.length > 0 && <View style={[styles.itemizedBox, {
            backgroundColor: theme.background,
            borderColor: theme.border
          }]}>
                      <Text style={[styles.itemizedHeaderTitle, {
              color: theme.textPrimary
            }]}>
                        Itemized Breakdown ({scannedItems.length} items)
                      </Text>
                      {scannedItems.map((item, i) => <View key={i} style={styles.itemizedRow}>
                          <Text style={[styles.itemizedName, {
                color: theme.textPrimary
              }]}>
                            {item.quantity ? `${item.quantity}x ` : ""}
                            {item.name}
                          </Text>
                          <Text style={[styles.itemizedPrice, {
                color: theme.accent
              }]}>
                            ₦{item.price.toLocaleString()}
                          </Text>
                        </View>)}
                    </View>}

                  <TouchableOpacity style={[styles.submitBtn, {
            backgroundColor: theme.accent
          }]} disabled={transactionAction.busy} onPress={handleSaveScannedReceipt} activeOpacity={0.85}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>
                      {transactionAction.busy ? "Saving…" : "Save Receipt to Expenses"}
                    </Text>
                  </TouchableOpacity>
                </View>}

      </>}
      </CoachToolSheet>
    </>;
}
const styles = StyleSheet.create({
  expenseAmountCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 23
  },
  amountCaption: {
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 1.2
  },
  expenseAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7
  },
  expenseAmountInput: {
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: -1.2,
    minHeight: 90,
    flex: 1,
    maxWidth: 240,
    textAlign: "center"
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10
  },
  footnote: {
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 8
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1
  },
  inputLabelSmall: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase"
  },
  categoryPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1
  },
  categoryPillText: {
    fontSize: 12
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15
  },
  calculatorDisplay: {
    minHeight: 130,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 20,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginBottom: 14,
    borderWidth: 1
  },
  calculatorExpression: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4
  },
  calculatorResult: {
    fontSize: 44,
    fontWeight: "600",
    letterSpacing: -1
  },
  calculatorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8
  },
  calculatorButton: {
    width: "22.5%",
    height: 59,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0
  },
  calculatorButtonPlaceholder: {
    width: "22.5%",
    height: 59
  },
  calculatorButtonText: {
    fontSize: 18
  },
  scannerIntroText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4
  },
  captureOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 12
  },
  captureOptionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  captureOptionInfo: {
    flex: 1
  },
  captureOptionTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    marginBottom: 2
  },
  captureOptionSub: {
    fontSize: 12
  },
  capturedImageContainer: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    marginBottom: 8
  },
  capturedReceiptPhoto: {
    width: "100%",
    height: "100%"
  },
  retakeFloatingBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20
  },
  retakeBadgeText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "700"
  },
  viewfinderBox: {
    width: "100%",
    height: 190,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    overflow: "hidden"
  },
  viewfinderCornerTL: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 22,
    height: 22,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6
  },
  viewfinderCornerTR: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6
  },
  viewfinderCornerBL: {
    position: "absolute",
    bottom: 10,
    left: 10,
    width: 22,
    height: 22,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6
  },
  viewfinderCornerBR: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 22,
    height: 22,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6
  },
  viewfinderContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  viewfinderTip: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6
  },
  viewfinderSubTip: {
    fontSize: 12
  },
  analyzingCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    gap: 10
  },
  analyzingIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },
  analyzingTitle: {
    fontSize: 16,
    fontWeight: "800"
  },
  analyzingSub: {
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18
  },
  ocrConfidenceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1
  },
  ocrConfidenceText: {
    fontSize: 12,
    fontWeight: "700"
  },
  itemizedBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8
  },
  itemizedHeaderTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4
  },
  itemizedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3
  },
  itemizedName: {
    fontSize: 12.5,
    fontWeight: "500",
    flex: 1,
    marginRight: 10
  },
  itemizedPrice: {
    fontSize: 12.5,
    fontWeight: "700"
  }
});
