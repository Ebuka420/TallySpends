import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

type ActionMode = "coach" | "calc" | "add" | "scan";

type ModeConfig = {
  id: ActionMode;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  angle: number;
};

/*
 * Radial positions
 *
 * The options are spread farther apart from one another,
 * while keeping the SAME distance from the RadialBot.
 *
 * 185° = upper-left
 * 235° = left / upper-left
 * 285° = upper-right of the vertical axis
 *
 * The 50° separation gives the radial menu more presence
 * without pushing the buttons farther away from the bot.
 */
const MODES: ModeConfig[] = [
  {
    id: "calc",
    icon: "calculator-outline",
    angle: 185,
  },
  {
    id: "add",
    icon: "add-outline",
    angle: 235,
  },
  {
    id: "scan",
    icon: "camera-outline",
    angle: 285,
  },
];

/*
 * Distance from the center of the RadialBot.
 *
 * Keep this relatively close.
 * The increased spacing between options comes from the angles,
 * NOT from increasing this value.
 */
const RADIUS = 62;

const PURPLE = "#20142A";

export default function RadialFloatingBot() {
  const { themePreference, themeMode, addTransaction } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);

  const [isOpen, setIsOpen] = useState(false);

  // Active Modal State
  const [activeModal, setActiveModal] = useState<ActionMode | null>(null);

  // Add Expense Form State
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");

  // Calculator State
  const [calculatorExpression, setCalculatorExpression] = useState("");
  const [calculatorResult, setCalculatorResult] = useState("0");
  const [calculatorHasResult, setCalculatorHasResult] = useState(false);

  // Position state for dragging
  const pan = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);

  /*
   * Keeps the current menu state available to PanResponder
   * without relying on potentially stale React state.
   */
  const isOpenRef = useRef(false);

  // Keeps track of whether the current press opened the menu
  const menuOpenedFromLongPress = useRef(false);

  // Radial menu animation
  const menuAnimation = useRef(new Animated.Value(0)).current;

  // Main button press animation
  const pressAnimation = useRef(new Animated.Value(1)).current;

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleAction = (mode: ActionMode) => {
    setActiveModal(mode);
  };

  /*
   * ================================================================
   * ADD EXPENSE
   * ================================================================
   *
   * This now actually adds the transaction through the app store.
   *
   * The store's addTransaction() function handles updating state
   * and persisting the transaction to AsyncStorage.
   */
  const handleAddExpenseSubmit = async () => {
    const trimmedName = expenseName.trim();
    const trimmedAmount = expenseAmount.trim();
    const trimmedCategory = expenseCategory.trim();

    if (!trimmedName || !trimmedAmount) {
      return;
    }

    const parsedAmount = parseFloat(trimmedAmount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const now = new Date();

    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    try {
      await addTransaction({
        title: trimmedName,
        amount: parsedAmount,
        category: trimmedCategory || "Others",
        type: "expense",
        date,
      });

      /*
       * Strong confirmation haptic after successfully adding
       * the transaction.
       */
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setExpenseName("");
      setExpenseAmount("");
      setExpenseCategory("");
      setActiveModal(null);
    } catch (error) {
      console.error("Failed to add expense:", error);
    }
  };

  /*
   * ================================================================
   * CALCULATOR
   * ================================================================
   */

  /*
   * Evaluates a basic arithmetic expression safely.
   *
   * Supported:
   * +   addition
   * -   subtraction
   * ×   multiplication
   * ÷   division
   * .   decimals
   * ( ) parentheses
   *
   * This uses a small recursive parser rather than eval().
   */
  const calculateExpression = (expression: string): number | null => {
    const normalized = expression
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/\s+/g, "");

    if (!normalized) {
      return null;
    }

    let index = 0;

    const parseNumber = (): number | null => {
      const start = index;

      if (normalized[index] === "+") {
        index++;
      } else if (normalized[index] === "-") {
        index++;
      }

      while (index < normalized.length && /[0-9.]/.test(normalized[index])) {
        index++;
      }

      const value = Number(normalized.slice(start, index));

      return Number.isFinite(value) ? value : null;
    };

    const parseFactor = (): number | null => {
      if (normalized[index] === "(") {
        index++;

        const value = parseExpression();

        if (normalized[index] !== ")") {
          return null;
        }

        index++;

        return value;
      }

      return parseNumber();
    };

    const parseTerm = (): number | null => {
      let value = parseFactor();

      if (value === null) {
        return null;
      }

      while (normalized[index] === "*" || normalized[index] === "/") {
        const operator = normalized[index];
        index++;

        const nextValue = parseFactor();

        if (nextValue === null) {
          return null;
        }

        if (operator === "*") {
          value *= nextValue;
        } else {
          if (nextValue === 0) {
            return null;
          }

          value /= nextValue;
        }
      }

      return value;
    };

    function parseExpression(): number | null {
      let value = parseTerm();

      if (value === null) {
        return null;
      }

      while (normalized[index] === "+" || normalized[index] === "-") {
        const operator = normalized[index];
        index++;

        const nextValue = parseTerm();

        if (nextValue === null) {
          return null;
        }

        if (operator === "+") {
          value += nextValue;
        } else {
          value -= nextValue;
        }
      }

      return value;
    }

    const result = parseExpression();

    if (result === null || index !== normalized.length) {
      return null;
    }

    return result;
  };

  const formatCalculatorResult = (value: number) => {
    if (!Number.isFinite(value)) {
      return "Error";
    }

    return Number(value.toFixed(10)).toString();
  };

  const handleCalculatorInput = (value: string) => {
    setCalculatorHasResult(false);

    setCalculatorExpression((previous) => {
      /*
       * If a result was just calculated and the user enters
       * a number, start a fresh calculation.
       */
      if (calculatorHasResult && /[0-9.]/.test(value)) {
        return value;
      }

      return previous + value;
    });
  };

  const handleCalculatorClear = () => {
    setCalculatorExpression("");
    setCalculatorResult("0");
    setCalculatorHasResult(false);

    Haptics.selectionAsync();
  };

  const handleCalculatorBackspace = () => {
    setCalculatorHasResult(false);

    setCalculatorExpression((previous) => previous.slice(0, -1));

    Haptics.selectionAsync();
  };

  const handleCalculatorEquals = () => {
    if (!calculatorExpression) {
      return;
    }

    const result = calculateExpression(calculatorExpression);

    if (result === null) {
      setCalculatorResult("Error");
      setCalculatorHasResult(true);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      return;
    }

    const formatted = formatCalculatorResult(result);

    setCalculatorResult(formatted);
    setCalculatorExpression(formatted);
    setCalculatorHasResult(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const openCalculator = () => {
    setCalculatorExpression("");
    setCalculatorResult("0");
    setCalculatorHasResult(false);

    handleAction("calc");
  };

  /*
   * ================================================================
   * OPEN RADIAL MENU
   * ================================================================
   *
   * Slower + more dramatic than before.
   */
  const openMenu = () => {
    isOpenRef.current = true;
    setIsOpen(true);

    menuOpenedFromLongPress.current = true;

    /*
     * Strong haptic when the radial menu bursts open.
     */
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    /*
     * Reset animation before starting.
     */
    menuAnimation.setValue(0);

    /*
     * Slower timing animation gives the menu a more deliberate,
     * premium feel instead of instantly appearing.
     */
    Animated.timing(menuAnimation, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.back(1.15)),
      useNativeDriver: true,
    }).start();
  };

  /*
   * ================================================================
   * CLOSE RADIAL MENU
   * ================================================================
   */
  const closeMenu = () => {
    clearLongPressTimer();

    isOpenRef.current = false;
    menuOpenedFromLongPress.current = false;

    Haptics.selectionAsync();

    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 300,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
    });
  };

  /*
   * ================================================================
   * RADIAL OPTION SELECTED
   * ================================================================
   *
   * IMPORTANT:
   * There is NO activeMode anymore.
   *
   * Therefore clicking an option cannot leave behind a purple
   * "selected" state.
   */
  const selectOption = (mode: ActionMode) => {
    /*
     * Stronger haptic specifically for selecting a tool.
     */
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    closeMenu();

    /*
     * Slight delay lets the radial closing animation begin before
     * the modal appears.
     */
    setTimeout(() => {
      if (mode === "calc") {
        openCalculator();
        return;
      }

      handleAction(mode);
    }, 180);
  };

  const animatePress = (pressed: boolean) => {
    Animated.spring(pressAnimation, {
      toValue: pressed ? 0.88 : 1,
      friction: 5,
      tension: 110,
      useNativeDriver: true,
    }).start();
  };

  /*
   * ================================================================
   * DRAG + GESTURE RESPONDER
   * ================================================================
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        isDragging.current = false;
        longPressTriggered.current = false;

        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });

        pan.setValue({
          x: 0,
          y: 0,
        });

        animatePress(true);

        /*
         * Start long press only while menu is closed.
         */
        if (!isOpenRef.current) {
          longPressTimer.current = setTimeout(() => {
            if (!isDragging.current && !isOpenRef.current) {
              longPressTriggered.current = true;
              openMenu();
            }
          }, 400);
        }
      },

      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;

        if (Math.hypot(dx, dy) > 8) {
          isDragging.current = true;

          clearLongPressTimer();

          pan.setValue({
            x: dx,
            y: dy,
          });
        }
      },

      onPanResponderRelease: () => {
        clearLongPressTimer();

        pan.flattenOffset();
        animatePress(false);

        /*
         * Long press already opened the menu.
         */
        if (longPressTriggered.current) {
          longPressTriggered.current = false;
          return;
        }

        /*
         * Ignore drag releases.
         */
        if (isDragging.current) {
          return;
        }

        /*
         * Tapping the RadialBot while the menu is open closes it.
         */
        if (isOpenRef.current) {
          closeMenu();
          return;
        }

        /*
         * Normal short tap opens Smart Coach.
         */
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        handleAction("coach");
      },

      onPanResponderTerminate: () => {
        clearLongPressTimer();

        pan.flattenOffset();
        animatePress(false);

        longPressTriggered.current = false;
      },
    }),
  ).current;

  /*
   * Calculator buttons
   */
  const calculatorButtons = [
    ["C", "backspace", "(", ")"],
    ["7", "8", "9", "÷"],
    ["4", "5", "6", "×"],
    ["1", "2", "3", "-"],
    ["0", ".", "=", "+"],
  ];

  return (
    <>
      {/* ================================================================
          SUBTLE BACKDROP
      ================================================================= */}
      {isOpen && (
        <Animated.View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Pressable style={styles.backdrop} onPress={closeMenu} />
        </Animated.View>
      )}

      {/* ================================================================
          FLOATING ASSISTANT
      ================================================================= */}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              {
                translateX: pan.x,
              },
              {
                translateY: pan.y,
              },
            ],
          },
        ]}
      >
        {/* ================================================================
            RADIAL OPTIONS
        ================================================================= */}
        {isOpen &&
          MODES.map((mode, modeIndex) => {
            const rad = (mode.angle * Math.PI) / 180;

            const translateX = menuAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, RADIUS * Math.cos(rad)],
            });

            const translateY = menuAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, RADIUS * Math.sin(rad)],
            });

            /*
             * Dramatic scale:
             *
             * 0%   → tiny
             * 55%  → overshoot
             * 100% → final size
             */
            const scale = menuAnimation.interpolate({
              inputRange: [0, 0.55, 0.82, 1],
              outputRange: [0.15, 1.18, 0.94, 1],
            });

            /*
             * Slight stagger in opacity between the three buttons.
             */
            const opacity = menuAnimation.interpolate({
              inputRange: [
                0,
                0.18 + modeIndex * 0.04,
                0.45 + modeIndex * 0.04,
                1,
              ],
              outputRange: [0, 0, 0.85, 1],
            });

            return (
              <Animated.View
                key={mode.id}
                style={[
                  styles.optionWrapper,
                  {
                    transform: [
                      {
                        translateX,
                      },
                      {
                        translateY,
                      },
                      {
                        scale,
                      },
                    ],
                    opacity,
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => selectOption(mode.id)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: theme.surfaceSoft,
                    },
                  ]}
                >
                  <Ionicons
                    name={mode.icon}
                    size={23}
                    color={theme.textPrimary}
                  />
                </TouchableOpacity>
              </Animated.View>
            );
          })}

        {/* ================================================================
            MAIN ASSISTANT BUTTON
        ================================================================= */}
        <Animated.View
          style={[
            styles.mainButtonAnimated,
            {
              transform: [
                {
                  scale: pressAnimation,
                },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.mainButton}>
            <View style={styles.mainButtonHighlight} />

            <Ionicons name="sparkles" size={25} color="#FFFFFF" />
          </View>
        </Animated.View>
      </Animated.View>

      {/* ================================================================
          1. ADD EXPENSE MODAL
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
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.surface,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  {
                    color: theme.textPrimary,
                  },
                ]}
              >
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
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Expense Name (e.g. Lunch)"
              placeholderTextColor={theme.textSecondary}
              value={expenseName}
              onChangeText={setExpenseName}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Amount ($)"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Category (e.g. Food, Transport)"
              placeholderTextColor={theme.textSecondary}
              value={expenseCategory}
              onChangeText={setExpenseCategory}
            />

            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: theme.accent,
                },
              ]}
              onPress={handleAddExpenseSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>Add Expense</Text>

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
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.surface,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  {
                    color: theme.textPrimary,
                  },
                ]}
              >
                ✨ Smart Coach
              </Text>

              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.chatBoxPlaceholder,
                {
                  backgroundColor: theme.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.chatText,
                  {
                    color: theme.textPrimary,
                  },
                ]}
              >
                Hello! How can I help you analyze your spending today?
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
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Ask your Smart Coach..."
                placeholderTextColor={theme.textSecondary}
              />

              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: theme.accent,
                  },
                ]}
              >
                <Ionicons name="send" size={18} color="#FFF" />
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
              {
                backgroundColor: theme.surface,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  {
                    color: theme.textPrimary,
                  },
                ]}
              >
                Calculator
              </Text>

              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Calculator Display */}
            <View
              style={[
                styles.calculatorDisplay,
                {
                  backgroundColor: theme.background,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.calculatorExpression,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                {calculatorExpression || " "}
              </Text>

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.calculatorResult,
                  {
                    color: theme.textPrimary,
                  },
                ]}
              >
                {calculatorResult}
              </Text>
            </View>

            {/* Calculator Buttons */}
            <View style={styles.calculatorGrid}>
              {calculatorButtons.flatMap((row, rowIndex) =>
                row.map((button) => {
                  const isOperator = ["÷", "×", "-", "+"].includes(button);

                  const isEquals = button === "=";
                  const isClear = button === "C";
                  const isBackspace = button === "backspace";

                  return (
                    <TouchableOpacity
                      key={`${rowIndex}-${button}`}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (isClear) {
                          handleCalculatorClear();
                          return;
                        }

                        if (isBackspace) {
                          handleCalculatorBackspace();
                          return;
                        }

                        if (isEquals) {
                          handleCalculatorEquals();
                          return;
                        }

                        handleCalculatorInput(button);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.calculatorButton,
                        {
                          backgroundColor: theme.background,
                        },
                        isOperator && {
                          backgroundColor: theme.surfaceSoft,
                        },
                        isEquals && {
                          backgroundColor: theme.accent,
                        },
                        isClear && {
                          backgroundColor: theme.surfaceSoft,
                        },
                      ]}
                    >
                      <Ionicons
                        name="backspace-outline"
                        size={21}
                        color={theme.textPrimary}
                        style={isBackspace ? undefined : styles.hiddenIcon}
                      />

                      {!isBackspace && (
                        <Text
                          style={[
                            styles.calculatorButtonText,
                            {
                              color: theme.textPrimary,
                            },
                            isOperator && styles.calculatorOperatorText,
                            isEquals && styles.calculatorEqualsText,
                            isClear && styles.calculatorClearText,
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
          4. CAMERA / RECEIPT SCANNER MODAL
      ================================================================= */}
      <Modal
        visible={activeModal === "scan"}
        transparent
        animationType="fade"
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
              {
                backgroundColor: theme.surface,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  {
                    color: theme.textPrimary,
                  },
                ]}
              >
                Scan Receipt
              </Text>

              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text
              style={{
                color: theme.textSecondary,
                marginVertical: 20,
              }}
            >
              Camera / Scanner overlay.
            </Text>
          </Pressable>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    right: 25,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 20,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(32, 20, 42, 0.055)",
  },

  mainButtonAnimated: {
    width: 58,
    height: 58,
  },

  mainButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: PURPLE,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.3,
    shadowRadius: 13,
    elevation: 12,
  },

  mainButtonHighlight: {
    position: "absolute",
    top: 0,
    left: 7,
    right: 7,
    height: 22,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  optionWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  optionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(32,20,42,0.07)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.14,
    shadowRadius: 9,
    elevation: 7,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 12, 25, 0.42)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    minHeight: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 18,
  },

  calculatorModalContent: {
    minHeight: 520,
  },

  modalHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#DDD6DF",
    marginBottom: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: PURPLE,
    letterSpacing: -0.4,
  },

  input: {
    backgroundColor: "#F7F4F7",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 14,
    color: PURPLE,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE8EF",
  },

  submitBtn: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    shadowColor: PURPLE,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },

  /* ================================================================
     CALCULATOR
  ================================================================= */

  calculatorDisplay: {
    minHeight: 105,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EEE8EF",
  },

  calculatorExpression: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    minHeight: 20,
  },

  calculatorResult: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },

  calculatorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },

  calculatorButton: {
    width: "22.5%",
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEE8EF",
  },

  calculatorButtonText: {
    fontSize: 19,
    fontWeight: "700",
  },

  calculatorOperatorText: {
    fontWeight: "800",
  },

  calculatorEqualsText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  calculatorClearText: {
    fontWeight: "800",
  },

  hiddenIcon: {
    display: "none",
  },

  /* ================================================================
     SMART COACH
  ================================================================= */

  chatBoxPlaceholder: {
    backgroundColor: "#F7F4F7",
    padding: 16,
    borderRadius: 17,
    marginBottom: 15,
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#EEE8EF",
  },

  chatText: {
    color: PURPLE,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },

  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  sendBtn: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: PURPLE,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: PURPLE,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 4,
  },
});
