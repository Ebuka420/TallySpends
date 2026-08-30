import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type ActionMode = "coach" | "calc" | "add" | "scan";

interface RadialItemConfig {
  id: ActionMode;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  /** Target angle in degrees */
  baseAngleDeg: number;
}

const RADIAL_RADIUS = 96;
const DEADZONE_RADIUS = 28;
const BUTTON_SIZE = 58;

// Initial anchor coordinates (bottom-right)
const INITIAL_POS_X = SCREEN_WIDTH - BUTTON_SIZE - 20;
const INITIAL_POS_Y = SCREEN_HEIGHT - BUTTON_SIZE - 100;

const RADIAL_ITEMS: RadialItemConfig[] = [
  {
    id: "calc",
    label: "Calculator",
    icon: "calculator-outline",
    baseAngleDeg: 165, // Left
  },
  {
    id: "add",
    label: "Add Expense",
    icon: "add-outline",
    baseAngleDeg: 200, // Mid-Left
  },
  {
    id: "coach",
    label: "Smart Coach",
    icon: "sparkles-outline",
    baseAngleDeg: 235, // Top-Left
  },
  {
    id: "scan",
    label: "Scan Receipt",
    icon: "camera-outline",
    baseAngleDeg: 270, // Top
  },
];

const CATEGORY_OPTIONS = [
  "Food & Dining",
  "Groceries",
  "Shopping",
  "Transport",
  "Bills & Utilities",
  "Entertainment",
  "Others",
];

const SPRING_PHYSICS = {
  damping: 15,
  stiffness: 220,
  mass: 0.7,
};

export default function RadialFloatingBot() {
  const { themePreference, themeMode, addTransaction } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const isDark = themeMode === "dark";

  const [activeModal, setActiveModal] = useState<ActionMode | null>(null);
  const [menuActive, setMenuActive] = useState(false);

  // Form States
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food & Dining");

  // Calculator State
  const [calculatorExpression, setCalculatorExpression] = useState("");
  const [calculatorResult, setCalculatorResult] = useState("0");
  const [calculatorHasResult, setCalculatorHasResult] = useState(false);

  // Real Receipt State
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
  const [scannedMerchant, setScannedMerchant] = useState("");
  const [scannedAmount, setScannedAmount] = useState("");
  const [scannedCategory, setScannedCategory] = useState("Food & Dining");

  /* ================================================================
      SHARED VALUES (UI WORKLET THREAD)
  ================================================================= */
  // Draggable screen coordinates
  const translationX = useSharedValue(INITIAL_POS_X);
  const translationY = useSharedValue(INITIAL_POS_Y);
  const startX = useSharedValue(INITIAL_POS_X);
  const startY = useSharedValue(INITIAL_POS_Y);

  // Radial menu states
  const menuProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const hoveredIndex = useSharedValue(-1);
  const isMenuOpen = useSharedValue(false);
  const isDraggingPosition = useSharedValue(false);

  // Drag displacement during open menu for selection
  const radialTouchX = useSharedValue(0);
  const radialTouchY = useSharedValue(0);

  // Haptic feedback bridges
  const playLightHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const playMediumHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, []);

  const playSuccessHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const handleTriggerAction = useCallback((mode: ActionMode) => {
    setActiveModal(mode);
    if (mode === "scan") {
      setScannedImageUri(null);
      setScannedMerchant("");
      setScannedAmount("");
    }
  }, []);

  /* ================================================================
      WORKLET FUNCTIONS
  ================================================================= */
  const openMenuWorklet = () => {
    "worklet";
    isMenuOpen.value = true;
    isDraggingPosition.value = false;
    radialTouchX.value = 0;
    radialTouchY.value = 0;
    hoveredIndex.value = -1;
    menuProgress.value = withSpring(1, SPRING_PHYSICS);
    runOnJS(setMenuActive)(true);
    runOnJS(playMediumHaptic)();
  };

  const closeMenuWorklet = () => {
    "worklet";
    menuProgress.value = withSpring(0, { damping: 20, stiffness: 280 });
    hoveredIndex.value = -1;
    isMenuOpen.value = false;
    isDraggingPosition.value = false;
    radialTouchX.value = 0;
    radialTouchY.value = 0;
    runOnJS(setMenuActive)(false);
  };

  /**
   * Continuous Polar Coordinate Hit-Testing for dynamic screen position
   */
  const calculateHoveredItem = (dx: number, dy: number): number => {
    "worklet";
    const dist = Math.hypot(dx, dy);
    if (dist < DEADZONE_RADIUS) {
      return -1;
    }

    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (deg < 0) {
      deg += 360;
    }

    // Adaptive sector bounds:
    // If button is on right side of screen -> arc points left/upwards [145° - 295°]
    // If button is on left side of screen -> arc points right/upwards [245° - 395° / 35°]
    const isRightSide = translationX.value > SCREEN_WIDTH / 2;

    if (isRightSide) {
      if (deg >= 145 && deg < 185) return 0; // Calc
      if (deg >= 185 && deg < 218) return 1; // Add
      if (deg >= 218 && deg < 252) return 2; // Coach
      if (deg >= 252 && deg < 295) return 3; // Scan
      if (deg >= 120 && deg < 145) return 0;
      if (deg >= 295 && deg <= 335) return 3;
    } else {
      // Left side mirror sectors
      if (deg >= 245 && deg < 288) return 3; // Scan
      if (deg >= 288 && deg < 322) return 2; // Coach
      if (deg >= 322 && deg < 355) return 1; // Add
      if (deg >= 355 || deg < 35) return 0;  // Calc
    }

    return -1;
  };

  /* ================================================================
      GESTURE PIPELINE (DRAG TO MOVE & HOLD TO EXPAND RADIAL)
  ================================================================= */
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = translationX.value;
      startY.value = translationY.value;
      buttonScale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
    })
    .onUpdate((event) => {
      if (isMenuOpen.value) {
        // Radial Selection Mode
        radialTouchX.value = event.translationX;
        radialTouchY.value = event.translationY;

        const newHover = calculateHoveredItem(event.translationX, event.translationY);
        if (newHover !== hoveredIndex.value) {
          hoveredIndex.value = newHover;
          if (newHover !== -1) {
            runOnJS(playLightHaptic)();
          }
        }
      } else {
        // Screen Reposition Drag Mode
        isDraggingPosition.value = true;
        const nextX = startX.value + event.translationX;
        const nextY = startY.value + event.translationY;

        // Clamp inside screen bounds
        translationX.value = clamp(nextX, 16, SCREEN_WIDTH - BUTTON_SIZE - 16);
        translationY.value = clamp(nextY, 50, SCREEN_HEIGHT - BUTTON_SIZE - 60);
      }
    })
    .onEnd((event) => {
      const dist = Math.hypot(event.translationX, event.translationY);

      if (isMenuOpen.value) {
        const selected = hoveredIndex.value;
        closeMenuWorklet();

        if (selected >= 0 && selected < RADIAL_ITEMS.length) {
          const targetMode = RADIAL_ITEMS[selected].id;
          runOnJS(playSuccessHaptic)();
          runOnJS(handleTriggerAction)(targetMode);
        }
      } else {
        if (dist < 10) {
          // Quick Tap -> Open Smart Coach
          runOnJS(playLightHaptic)();
          runOnJS(handleTriggerAction)("coach");
        } else {
          // Finished dragging -> Edge snap to left or right margin for clean docking
          const snapLeft = 20;
          const snapRight = SCREEN_WIDTH - BUTTON_SIZE - 20;
          const targetSnapX = translationX.value < SCREEN_WIDTH / 2 ? snapLeft : snapRight;

          translationX.value = withSpring(targetSnapX, { damping: 18, stiffness: 200 });
          runOnJS(playLightHaptic)();
        }
      }
    })
    .onFinalize(() => {
      buttonScale.value = withSpring(1, { damping: 12, stiffness: 220 });
    });

  // Long press gesture triggers radial burst around current dynamic position
  const longPressGesture = Gesture.LongPress()
    .minDuration(220)
    .onStart(() => {
      if (!isMenuOpen.value) {
        openMenuWorklet();
      }
    });

  // Composed simultaneous gesture handler
  const composedGesture = Gesture.Simultaneous(panGesture, longPressGesture);

  /* ================================================================
      ANIMATED STYLES
  ================================================================= */
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(menuProgress.value, [0, 1], [0, 1]),
    };
  });

  const anchorContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translationX.value },
        { translateY: translationY.value },
      ],
    };
  });

  const mainButtonAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(menuProgress.value, [0, 1], [0, 45]);
    return {
      transform: [{ scale: buttonScale.value }, { rotate: `${rotate}deg` }],
    };
  });

  /* ================================================================
      MODAL SUBMISSIONS
  ================================================================= */
  const handleAddExpenseSubmit = () => {
    const parsed = parseFloat(expenseAmount);
    if (!expenseName.trim() || isNaN(parsed) || parsed <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid expense name and amount.");
      return;
    }

    addTransaction({
      id: `tx-${Date.now()}`,
      title: expenseName.trim(),
      amount: parsed,
      category: expenseCategory || "Others",
      type: "expense",
      date: new Date().toISOString().slice(0, 10),
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Expense Added", `₦${parsed.toLocaleString()} for "${expenseName.trim()}" saved.`);
    setExpenseName("");
    setExpenseAmount("");
    setActiveModal(null);
  };

  const handleCalculatorInput = (val: string) => {
    if (calculatorHasResult) {
      setCalculatorExpression(calculatorResult + val);
      setCalculatorHasResult(false);
      return;
    }
    setCalculatorExpression((prev) => prev + val);
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
    setCalculatorExpression((prev) => prev.slice(0, -1));
  };

  const handleCalculatorEquals = () => {
    try {
      if (!calculatorExpression.trim()) return;
      const sanitized = calculatorExpression
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-");
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

  const handleLaunchCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Camera access is needed to capture receipt photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setScannedImageUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setScannedImageUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      Alert.alert("Gallery Error", e.message || "Could not select image.");
    }
  };

  const handleSaveScannedReceipt = () => {
    const parsed = parseFloat(scannedAmount);
    const merchantName = scannedMerchant.trim() || "Receipt Expense";

    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Enter Amount", "Please enter the total receipt amount.");
      return;
    }

    addTransaction({
      id: `tx-${Date.now()}`,
      title: merchantName,
      amount: parsed,
      category: scannedCategory || "Food & Dining",
      type: "expense",
      date: new Date().toISOString().slice(0, 10),
      receiptImage: scannedImageUri || undefined,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Receipt Saved",
      `₦${parsed.toLocaleString()} for "${merchantName}" added to your expenses.`,
    );

    setActiveModal(null);
    setScannedImageUri(null);
    setScannedMerchant("");
    setScannedAmount("");
  };

  const CALCULATOR_BUTTONS = [
    ["C", "÷", "×", "⌫"],
    ["7", "8", "9", "−"],
    ["4", "5", "6", "+"],
    ["1", "2", "3", "="],
    ["0", ".", "", ""],
  ];

  return (
    <>
      {/* Dimmed Background Overlay */}
      {menuActive && (
        <Animated.View
          style={[
            styles.backdrop,
            backdropAnimatedStyle,
            { backgroundColor: "rgba(10, 5, 15, 0.48)" },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              menuProgress.value = withSpring(0, { damping: 20, stiffness: 280 });
              isMenuOpen.value = false;
              hoveredIndex.value = -1;
              setMenuActive(false);
            }}
          />
        </Animated.View>
      )}

      {/* Freely Draggable Floating Container */}
      <Animated.View
        style={[styles.anchorContainer, anchorContainerAnimatedStyle]}
        pointerEvents="box-none"
      >
        {/* Radial Orbit Items (Adaptive Angle based on current screen position) */}
        {RADIAL_ITEMS.map((item, index) => (
          <RadialItemView
            key={item.id}
            item={item}
            index={index}
            translationX={translationX}
            menuProgress={menuProgress}
            hoveredIndex={hoveredIndex}
            theme={theme}
            isDark={isDark}
            onPress={() => {
              menuProgress.value = withSpring(0, { damping: 20, stiffness: 280 });
              isMenuOpen.value = false;
              hoveredIndex.value = -1;
              setMenuActive(false);
              playSuccessHaptic();
              handleTriggerAction(item.id);
            }}
          />
        ))}

        {/* Master GestureDetector Button */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[
              styles.mainButton,
              mainButtonAnimatedStyle,
              {
                backgroundColor: theme.accent,
                shadowColor: theme.accent,
              },
            ]}
          >
            <View style={styles.mainButtonHighlight} />
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          </Animated.View>
        </GestureDetector>
      </Animated.View>

      {/* ================================================================
          1. QUICK ADD EXPENSE MODAL
      ================================================================= */}
      <Modal
        visible={activeModal === "add"}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Quick Add Expense
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Expense Name (e.g. Lunch with team)"
              placeholderTextColor={theme.textSecondary}
              value={expenseName}
              onChangeText={setExpenseName}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Amount (₦)"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
            />

            <Text style={[styles.inputLabelSmall, { color: theme.textSecondary }]}>
              Category
            </Text>
            <View style={styles.categoryPillsRow}>
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = expenseCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setExpenseCategory(cat)}
                    style={[
                      styles.categoryPill,
                      {
                        backgroundColor: isSelected
                          ? theme.accent
                          : isDark
                          ? theme.surfaceSoft
                          : "#F3EBF8",
                        borderColor: isSelected ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        {
                          color: isSelected ? "#FFFFFF" : theme.textPrimary,
                          fontWeight: isSelected ? "700" : "500",
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.accent }]}
              onPress={handleAddExpenseSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>Save Expense</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {/* ================================================================
          2. SMART COACH MODAL
      ================================================================= */}
      <Modal
        visible={activeModal === "coach"}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                ✨ Smart Coach
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.chatBoxPlaceholder,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.chatText, { color: theme.textPrimary }]}>
                Hello! I am your AI financial coach. Ask me anything about your cashflow, budgets, and savings!
              </Text>
            </View>

            <View style={styles.chatInputRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    marginBottom: 0,
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Ask your Smart Coach..."
                placeholderTextColor={theme.textSecondary}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: theme.accent }]}
                activeOpacity={0.85}
              >
                <Ionicons name="paper-plane" size={19} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {/* ================================================================
          3. CALCULATOR MODAL
      ================================================================= */}
      <Modal
        visible={activeModal === "calc"}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <Pressable
            style={[
              styles.modalContent,
              styles.calculatorModalContent,
              { backgroundColor: theme.surface },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Calculator
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.calculatorDisplay,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.calculatorExpression, { color: theme.textSecondary }]}>
                {calculatorExpression || "0"}
              </Text>
              <Text style={[styles.calculatorResult, { color: theme.textPrimary }]}>
                {calculatorResult}
              </Text>
            </View>

            <View style={styles.calculatorGrid}>
              {CALCULATOR_BUTTONS.map((row, rowIndex) =>
                row.map((button, btnIndex) => {
                  if (!button) {
                    return <View key={`${rowIndex}-${btnIndex}`} style={styles.calculatorButtonPlaceholder} />;
                  }
                  const isOperator = ["÷", "×", "−", "+"].includes(button);
                  const isEquals = button === "=";
                  const isClear = button === "C";
                  const isBackspace = button === "⌫";

                  return (
                    <TouchableOpacity
                      key={`${rowIndex}-${button}`}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (isClear) return handleCalculatorClear();
                        if (isBackspace) return handleCalculatorBackspace();
                        if (isEquals) return handleCalculatorEquals();
                        handleCalculatorInput(button);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.calculatorButton,
                        {
                          backgroundColor: isEquals
                            ? theme.accent
                            : isOperator || isClear || isBackspace
                            ? theme.surfaceSoft
                            : theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      {isBackspace ? (
                        <Ionicons name="backspace-outline" size={20} color={theme.textPrimary} />
                      ) : (
                        <Text
                          style={[
                            styles.calculatorButtonText,
                            {
                              color: isEquals ? "#FFFFFF" : theme.textPrimary,
                              fontWeight: isEquals || isOperator ? "800" : "600",
                            },
                          ]}
                        >
                          {button}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                }),
              )}
            </View>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {/* ================================================================
          4. RECEIPT CAPTURE MODAL
      ================================================================= */}
      <Modal
        visible={activeModal === "scan"}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <Pressable
            style={[
              styles.modalContent,
              styles.scannerModalContent,
              { backgroundColor: theme.surface },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {scannedImageUri ? "Receipt Attached" : "Capture Receipt"}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {!scannedImageUri ? (
                <View style={{ gap: 14, paddingVertical: 10 }}>
                  <Text style={[styles.scannerIntroText, { color: theme.textSecondary }]}>
                    Take a clear photo of your paper receipt or bill to attach it to your expense ledger.
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.captureOptionCard,
                      {
                        backgroundColor: isDark ? theme.surfaceSoft : "#FAF7FC",
                        borderColor: theme.accent,
                      },
                    ]}
                    onPress={handleLaunchCamera}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.captureOptionIconBox, { backgroundColor: theme.accent }]}>
                      <Ionicons name="camera" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.captureOptionInfo}>
                      <Text style={[styles.captureOptionTitle, { color: theme.textPrimary }]}>
                        Take Photo with Camera
                      </Text>
                      <Text style={[styles.captureOptionSub, { color: theme.textSecondary }]}>
                        Snap receipt with auto-crop & focus
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.captureOptionCard,
                      {
                        backgroundColor: isDark ? theme.surfaceSoft : "#FAF7FC",
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={handlePickFromGallery}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.captureOptionIconBox,
                        { backgroundColor: isDark ? theme.background : "#EDE7F3" },
                      ]}
                    >
                      <Ionicons name="images" size={22} color={theme.accent} />
                    </View>
                    <View style={styles.captureOptionInfo}>
                      <Text style={[styles.captureOptionTitle, { color: theme.textPrimary }]}>
                        Upload from Photo Library
                      </Text>
                      <Text style={[styles.captureOptionSub, { color: theme.textSecondary }]}>
                        Select stored screenshot or invoice
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: 14, paddingBottom: 10 }}>
                  <View
                    style={[
                      styles.capturedImageContainer,
                      { backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                  >
                    <Image
                      source={{ uri: scannedImageUri }}
                      style={styles.capturedReceiptPhoto}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={[styles.retakeFloatingBadge, { backgroundColor: "rgba(0,0,0,0.72)" }]}
                      onPress={() => setScannedImageUri(null)}
                    >
                      <Ionicons name="refresh" size={15} color="#FFFFFF" />
                      <Text style={styles.retakeBadgeText}>Retake Photo</Text>
                    </TouchableOpacity>
                  </View>

                  <View>
                    <Text style={[styles.inputLabelSmall, { color: theme.textSecondary }]}>
                      Merchant / Store Name
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                          color: theme.textPrimary,
                        },
                      ]}
                      placeholder="e.g. Grocery Mart, Restaurant"
                      placeholderTextColor={theme.textSecondary}
                      value={scannedMerchant}
                      onChangeText={setScannedMerchant}
                    />
                  </View>

                  <View>
                    <Text style={[styles.inputLabelSmall, { color: theme.textSecondary }]}>
                      Total Amount (₦)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                          color: theme.textPrimary,
                          fontSize: 18,
                          fontWeight: "700",
                        },
                      ]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="decimal-pad"
                      value={scannedAmount}
                      onChangeText={setScannedAmount}
                    />
                  </View>

                  <Text style={[styles.inputLabelSmall, { color: theme.textSecondary }]}>
                    Category
                  </Text>
                  <View style={styles.categoryPillsRow}>
                    {CATEGORY_OPTIONS.map((cat) => {
                      const isSelected = scannedCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setScannedCategory(cat)}
                          style={[
                            styles.categoryPill,
                            {
                              backgroundColor: isSelected
                                ? theme.accent
                                : isDark
                                ? theme.surfaceSoft
                                : "#F3EBF8",
                              borderColor: isSelected ? theme.accent : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryPillText,
                              {
                                color: isSelected ? "#FFFFFF" : theme.textPrimary,
                                fontWeight: isSelected ? "700" : "500",
                              },
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: theme.accent }]}
                    onPress={handleSaveScannedReceipt}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Save Receipt to Expenses</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

/* ================================================================
    RADIAL ORBIT ITEM COMPONENT (ADAPTIVE DIRECTION)
================================================================= */
interface RadialItemViewProps {
  item: RadialItemConfig;
  index: number;
  translationX: SharedValue<number>;
  menuProgress: SharedValue<number>;
  hoveredIndex: SharedValue<number>;
  theme: any;
  isDark: boolean;
  onPress: () => void;
}

function RadialItemView({
  item,
  index,
  translationX,
  menuProgress,
  hoveredIndex,
  theme,
  isDark,
  onPress,
}: RadialItemViewProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const isHovered = hoveredIndex.value === index;
    const isAnyHovered = hoveredIndex.value !== -1;

    // Adapt radial orbit direction based on screen side
    const isRightSide = translationX.value > SCREEN_WIDTH / 2;
    let angleDeg = item.baseAngleDeg;

    if (!isRightSide) {
      // Mirror angles when dragged to left side of screen
      if (item.id === "calc") angleDeg = 15;
      else if (item.id === "add") angleDeg = 330;
      else if (item.id === "coach") angleDeg = 295;
      else if (item.id === "scan") angleDeg = 260;
    }

    const angleRad = (angleDeg * Math.PI) / 180;
    const targetX = RADIAL_RADIUS * Math.cos(angleRad);
    const targetY = RADIAL_RADIUS * Math.sin(angleRad);

    const translateX = interpolate(menuProgress.value, [0, 1], [0, targetX]);
    const translateY = interpolate(menuProgress.value, [0, 1], [0, targetY]);

    let targetScale = interpolate(menuProgress.value, [0, 1], [0.1, 1]);
    if (menuProgress.value > 0.8) {
      if (isHovered) {
        targetScale = 1.24;
      } else if (isAnyHovered) {
        targetScale = 0.92;
      }
    }

    const opacity = interpolate(menuProgress.value, [0, 0.25, 1], [0, 0.4, 1]);

    return {
      transform: [{ translateX }, { translateY }, { scale: targetScale }],
      opacity,
    };
  });

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    const isHovered = hoveredIndex.value === index;
    return {
      opacity: withTiming(isHovered ? 1 : 0, { duration: 150 }),
      transform: [{ scale: withTiming(isHovered ? 1 : 0.8, { duration: 150 }) }],
    };
  });

  return (
    <Animated.View style={[styles.radialItemWrapper, animatedStyle]}>
      {/* Label Tooltip on Active Hover */}
      <Animated.View
        style={[
          styles.itemTooltip,
          badgeAnimatedStyle,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.itemTooltipText, { color: theme.textPrimary }]}>
          {item.label}
        </Text>
      </Animated.View>

      <TouchableOpacity
        style={[
          styles.radialItemButton,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            shadowColor: "#000",
          },
        ]}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <Ionicons name={item.icon} size={23} color={theme.textPrimary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9990,
  },
  anchorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 24,
  },
  mainButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 14,
  },
  mainButtonHighlight: {
    position: "absolute",
    top: 0,
    left: 8,
    right: 8,
    height: 24,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  radialItemWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9998,
  },
  radialItemButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 8,
  },
  itemTooltip: {
    position: "absolute",
    bottom: 58,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  itemTooltipText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: "transparent",
    maxHeight: "90%",
  },
  calculatorModalContent: {
    minHeight: 520,
  },
  scannerModalContent: {
    minHeight: 380,
  },
  modalHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 4,
    marginBottom: 18,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  inputLabelSmall: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  categoryPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  chatBoxPlaceholder: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    minHeight: 110,
    borderWidth: 1,
  },
  chatText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  chatInputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  calculatorDisplay: {
    minHeight: 95,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginBottom: 14,
    borderWidth: 1,
  },
  calculatorExpression: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  calculatorResult: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
  },
  calculatorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  calculatorButton: {
    width: "22.5%",
    aspectRatio: 1,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  calculatorButtonPlaceholder: {
    width: "22.5%",
    aspectRatio: 1,
  },
  calculatorButtonText: {
    fontSize: 18,
  },
  scannerIntroText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  captureOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 12,
  },
  captureOptionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  captureOptionInfo: {
    flex: 1,
  },
  captureOptionTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    marginBottom: 2,
  },
  captureOptionSub: {
    fontSize: 12,
  },
  capturedImageContainer: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    marginBottom: 8,
  },
  capturedReceiptPhoto: {
    width: "100%",
    height: "100%",
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
    borderRadius: 20,
  },
  retakeBadgeText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "700",
  },
});
