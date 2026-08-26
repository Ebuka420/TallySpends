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

    setExpenseName("");
    setExpenseAmount("");
    setExpenseCategory("");
    setActiveModal(null);
  };

  const openMenu = () => {
    setIsOpen(true);
    menuOpenedFromLongPress.current = true;

    Animated.spring(menuAnimation, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 60,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
      menuOpenedFromLongPress.current = false;
    });
  };

  const selectOption = (mode: ActionMode) => {
    closeMenu();
    handleAction(mode);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },

      onPanResponderGrant: () => {
        isDragging.current = false;
        longPressTriggered.current = false;
        menuOpenedFromLongPress.current = false;

        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });

        Animated.spring(pressAnimation, {
          toValue: 0.93,
          useNativeDriver: true,
          friction: 8,
        }).start();

        longPressTimer.current = setTimeout(() => {
          if (!isDragging.current) {
            longPressTriggered.current = true;
            openMenu();
          }
        }, 320);
      },

      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6) {
          if (!isDragging.current) {
            isDragging.current = true;
            clearLongPressTimer();

            if (isOpen) {
              closeMenu();
            }
          }

          pan.setValue({
            x: gestureState.dx,
            y: gestureState.dy,
          });
        }
      },

      onPanResponderRelease: () => {
        clearLongPressTimer();
        pan.flattenOffset();

        Animated.spring(pressAnimation, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
        }).start();

        if (isDragging.current) {
          isDragging.current = false;
          return;
        }

        if (menuOpenedFromLongPress.current) {
          menuOpenedFromLongPress.current = false;
          return;
        }

        if (isOpen) {
          closeMenu();
          return;
        }

        handleAction("coach");
      },

      onPanResponderTerminate: () => {
        clearLongPressTimer();
        pan.flattenOffset();

        Animated.spring(pressAnimation, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        isDragging.current = false;
      },
    }),
  ).current;

  return (
    <>
      {isOpen && (
        <Pressable
          style={[styles.backdrop, { backgroundColor: "rgba(0, 0, 0, 0.4)" }]}
          onPress={closeMenu}
        />
      )}

      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: pressAnimation },
            ],
          },
        ]}
      >
        {/* ================================================================
            RADIAL ACTION BUTTONS
        ================================================================= */}
        {isOpen &&
          MODES.map((mode) => {
            const rad = (mode.angle * Math.PI) / 180;
            const targetX = Math.cos(rad) * RADIUS;
            const targetY = Math.sin(rad) * RADIUS;

            const translateX = menuAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, targetX],
            });

            const translateY = menuAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, targetY],
            });

            const scale = menuAnimation.interpolate({
              inputRange: [0, 0.6, 1],
              outputRange: [0, 1.12, 1],
            });

            const opacity = menuAnimation.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [0, 0.7, 1],
            });

            const isLeftAligned = mode.angle > 90 && mode.angle < 270;
            const labelTranslate = isLeftAligned ? -72 : 54;
            const isSelected = activeMode === mode.id;

            return (
              <Animated.View
                key={mode.id}
                style={[
                  styles.optionWrapper,
                  {
                    transform: [
                      { translateX },
                      { translateY },
                      { scale },
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
                    {
                      backgroundColor: isSelected ? theme.accent : theme.surface,
                      borderColor: isSelected ? theme.accent : theme.border,
                      shadowColor: isSelected ? theme.accent : "#000",
                    },
                  ]}
                >
                  <Ionicons
                    name={mode.icon}
                    size={22}
                    color={
                      isSelected ? "#FFFFFF" : theme.textPrimary
                    }
                  />

                  <Animated.View
                    style={[
                      styles.labelContainer,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
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
                        { color: theme.textPrimary },
                        isSelected && { color: theme.accent, fontWeight: "700" },
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
            {
              backgroundColor: isOpen ? theme.textPrimary : theme.accent,
              shadowColor: theme.accent,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.mainButtonInner, isOpen && styles.mainButtonOpen]}>
            <View style={styles.mainButtonHighlight} />
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
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
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
                  color: theme.textPrimary,
                  borderColor: theme.border,
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
                  borderColor: theme.border,
                },
              ]}
              placeholder="Amount (₦)"
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
                  borderColor: theme.border,
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
                { backgroundColor: theme.accent, shadowColor: theme.accent },
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
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
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
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
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
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Ask your Smart Coach..."
                placeholderTextColor={theme.textSecondary}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  { backgroundColor: theme.accent, shadowColor: theme.accent },
                ]}
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
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface, borderColor: theme.border },
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
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

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
  },

  mainButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },

  mainButtonInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  mainButtonOpen: {
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
    backgroundColor: "rgba(255,255,255,0.15)",
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.14,
    shadowRadius: 9,
    elevation: 7,
  },

  labelContainer: {
    position: "absolute",
    left: -5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 90,
    alignItems: "center",
    borderWidth: 1,
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
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },

  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
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

  submitBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
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

  chatBoxPlaceholder: {
    padding: 16,
    borderRadius: 17,
    marginBottom: 15,
    minHeight: 120,
    borderWidth: 1,
  },

  chatText: {
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
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 4,
  },
});
