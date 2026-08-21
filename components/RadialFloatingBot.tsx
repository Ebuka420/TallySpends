import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Animated,
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
  label: string;
  angle: number;
};
const MODES: ModeConfig[] = [
  {
    id: "calc",
    icon: "calculator-outline",
    label: "Calculator",
    angle: 225,
  },
  {
    id: "add",
    icon: "add-outline",
    label: "Add Expense",
    angle: 270,
  },
  {
    id: "scan",
    icon: "camera-outline",
    label: "Scan Receipt",
    angle: 315,
  },
];

const RADIUS = 82;

const PURPLE = "#20142A";
const LIGHT_PURPLE = "#F3EBF1";
const SOFT_PURPLE = "#EEE7F0";

export default function RadialFloatingBot() {
  const { themePreference, themeMode } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);

  const [activeMode, setActiveMode] = useState<ActionMode>("coach");
  const [isOpen, setIsOpen] = useState(false);

  // Active Modal State
  const [activeModal, setActiveModal] = useState<ActionMode | null>(null);

  // Add Expense Form State
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");

  // Position state for dragging
  const pan = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);

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

  const handleAddExpenseSubmit = () => {
    if (!expenseName || !expenseAmount) return;

    console.log("Expense Added:", {
      name: expenseName,
      amount: parseFloat(expenseAmount),
      category: expenseCategory || "Uncategorized",
      date: new Date().toISOString(),
    });

    setExpenseName("");
    setExpenseAmount("");
    setExpenseCategory("");
    setActiveModal(null);
  };

  /*
   * OPEN RADIAL MENU
   *
   * Notice that we DO NOT call setActiveMode("coach")
   * or select any option here.
   */
  const openMenu = () => {
    setIsOpen(true);
    menuOpenedFromLongPress.current = true;

    Animated.spring(menuAnimation, {
      toValue: 1,
      friction: 7,
      tension: 55,
      useNativeDriver: true,
    }).start();
  };

  /*
   * CLOSE RADIAL MENU
   *
   * This only closes the radial menu.
   * It does NOT open Smart Coach.
   */
  const closeMenu = () => {
    clearLongPressTimer();

    menuOpenedFromLongPress.current = false;

    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
    });
  };

  /*
   * USER EXPLICITLY TAPPED A RADIAL OPTION
   */
  const selectOption = (mode: ActionMode) => {
    // Selecting an option explicitly is the only way
    // a radial option should open.
    setActiveMode(mode);
    closeMenu();
    handleAction(mode);
  };

  const animatePress = (pressed: boolean) => {
    Animated.spring(pressAnimation, {
      toValue: pressed ? 0.91 : 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  /*
   * DRAG + GESTURE RESPONDER
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

        longPressTimer.current = setTimeout(() => {
          if (!isDragging.current && !isOpen) {
            longPressTriggered.current = true;
            openMenu();
          }
        }, 400);
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
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        pan.flattenOffset();
        animatePress(false);

        // A long press has already opened the radial menu.
        // DO NOT trigger Smart Coach when the finger is released.
        if (longPressTriggered.current) {
          longPressTriggered.current = false;
          return;
        }

        // Ignore releases caused by dragging.
        if (isDragging.current) {
          return;
        }

        // If the menu is already open, this release came from
        // pressing the X/main button, so close the menu.
        if (isOpen) {
          closeMenu();
          return;
        }

        // A normal short tap opens Smart Coach.
        handleAction("coach");
      },

      onPanResponderTerminate: () => {
        clearLongPressTimer();

        pan.flattenOffset();
        animatePress(false);
      },
    }),
  ).current;

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
          MODES.map((mode, index) => {
            const rad = (mode.angle * Math.PI) / 180;

            const translateX = menuAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, RADIUS * Math.cos(rad)],
            });

            const translateY = menuAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, RADIUS * Math.sin(rad)],
            });

            const scale = menuAnimation.interpolate({
              inputRange: [0, 0.7, 1],
              outputRange: [0.65, 1.05, 1],
            });

            const opacity = menuAnimation.interpolate({
              inputRange: [0, 0.25, 1],
              outputRange: [0, 0.5, 1],
            });

            const labelTranslate = menuAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            });

            /*
             * IMPORTANT:
             *
             * There is NO automatic active option anymore.
             *
             * The option only becomes active after the user
             * explicitly taps it.
             */
            const isSelected = activeMode === mode.id;

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
                  activeOpacity={0.85}
                  onPress={() => selectOption(mode.id)}
                  style={[
                    styles.optionButton,
                    { backgroundColor: theme.surfaceSoft },
                    activeMode === mode.id && { backgroundColor: theme.accent },
                  ]}
                >
                  <Ionicons
                    name={mode.icon}
                    size={22}
                    color={
                      activeMode === mode.id ? "#FFFFFF" : theme.textPrimary
                    }
                  />

                  <Animated.View
                    style={[
                      styles.labelContainer,
                      {
                        opacity,
                        transform: [
                          {
                            translateX: labelTranslate,
                          },
                        ],
                      },
                    ]}
                    pointerEvents="none"
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelActive,
                      ]}
                    >
                      {mode.label}
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

        {/* ================================================================
            MAIN ASSISTANT BUTTON
        ================================================================= */}
        <Animated.View
          style={[
            styles.mainButton,
            { backgroundColor: theme.accent },
            isOpen && { backgroundColor: theme.textPrimary },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.mainButton, isOpen && styles.mainButtonOpen]}>
            <View style={styles.mainButtonHighlight} />

            {/*
             * CLOSED = Sparkles
             * OPEN = X
             *
             * X is now strictly the close-menu state.
             */}
            <Ionicons
              name={isOpen ? "close" : "sparkles"}
              size={25}
              color="#FFFFFF"
            />
          </View>
        </Animated.View>
      </Animated.View>

      {/* ================================================================
          FEATURE MODALS
      ================================================================= */}

      {/* 1. Add Expense Modal */}
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
            <View style={styles.modalHandle} />

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
                { backgroundColor: theme.background, color: theme.textPrimary },
              ]}
              placeholder="Expense Name (e.g. Lunch)"
              placeholderTextColor={theme.textSecondary}
              value={expenseName}
              onChangeText={setExpenseName}
            />

            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.background, color: theme.textPrimary },
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
                { backgroundColor: theme.background, color: theme.textPrimary },
              ]}
              placeholder="Category (e.g. Food, Transport)"
              placeholderTextColor={theme.textSecondary}
              value={expenseCategory}
              onChangeText={setExpenseCategory}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.accent }]}
              onPress={handleAddExpenseSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>Add Expense</Text>

              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {/* 2. Smart Coach Modal */}
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
            <View style={styles.modalHandle} />

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
                { backgroundColor: theme.background },
              ]}
            >
              <Text style={[styles.chatText, { color: theme.textPrimary }]}>
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
                style={[styles.sendBtn, { backgroundColor: theme.accent }]}
              >
                <Ionicons name="send" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {/* 3. Calculator Modal */}
      <Modal
        visible={activeModal === "calc"}
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
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Calculator
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: theme.textSecondary, marginVertical: 20 }}>
              Calculator panel overlay.
            </Text>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {/* 4. Camera / Receipt Scanner Modal */}
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
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Scan Receipt
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: theme.textSecondary, marginVertical: 20 }}>
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

  mainButtonShadow: {
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: PURPLE,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.3,
    shadowRadius: 13,
    elevation: 12,
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
  },

  mainButtonOpen: {
    backgroundColor: "#291936",
    transform: [
      {
        scale: 1.02,
      },
    ],
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
    backgroundColor: "#FFFFFF",
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

  optionButtonActive: {
    backgroundColor: PURPLE,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: PURPLE,
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },

  labelContainer: {
    position: "absolute",
    left: -5,
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 90,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },

  optionLabel: {
    color: PURPLE,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: -0.1,
  },

  optionLabelActive: {
    color: PURPLE,
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

  modalEyebrow: {
    color: "#8B7B90",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 4,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: PURPLE,
    letterSpacing: -0.4,
  },

  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: LIGHT_PURPLE,
    alignItems: "center",
    justifyContent: "center",
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

  coachTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  coachTitleIcon: {
    width: 25,
    height: 25,
    borderRadius: 8,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },

  chatBoxPlaceholder: {
    backgroundColor: "#F7F4F7",
    padding: 16,
    borderRadius: 17,
    marginBottom: 15,
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#EEE8EF",
  },

  chatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
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

  placeholderText: {
    color: "#706572",
    fontSize: 14,
    marginVertical: 20,
  },
});
