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

type ActionMode = "coach" | "add" | "calc" | "scan";

interface ModeConfig {
  id: ActionMode;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  angle: number;
}

const MODES: ModeConfig[] = [
  { id: "coach", icon: "sparkles-outline", label: "Smart Coach", angle: 180 }, // Left
  { id: "calc", icon: "calculator-outline", label: "Calculator", angle: 225 }, // Top-Left
  { id: "add", icon: "add-outline", label: "Add Expense", angle: 270 }, // Top
  { id: "scan", icon: "camera-outline", label: "Scan Receipt", angle: 315 }, // Top-Right
];

const RADIUS = 80;

export default function RadialFloatingBot() {
  const [activeMode, setActiveMode] = useState<ActionMode>("coach");
  const [isOpen, setIsOpen] = useState(false);

  // Active Modal State
  const [activeModal, setActiveModal] = useState<ActionMode | null>(null);

  // Add Expense Form State
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");

  // Position state for dragging around screen
  const pan = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);

  // Animation for pop-out menu
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const longPressTimer = useRef<any>(null);

  const activeConfig = MODES.find((m) => m.id === activeMode) || MODES[0];

  const handleAction = (mode: ActionMode) => {
    setActiveModal(mode);
  };

  const handleAddExpenseSubmit = () => {
    if (!expenseName || !expenseAmount) return;

    // TODO: Connect to your global state store (e.g. Zustand/Redux) or API here
    console.log("Expense Added:", {
      name: expenseName,
      amount: parseFloat(expenseAmount),
      category: expenseCategory || "Uncategorized",
      date: new Date().toISOString(),
    });

    // Reset Form & Close Modal
    setExpenseName("");
    setExpenseAmount("");
    setExpenseCategory("");
    setActiveModal(null);
  };

  const openMenu = () => {
    setIsOpen(true);
    Animated.spring(menuAnimation, {
      toValue: 1,
      friction: 6,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  const selectOption = (mode: ActionMode) => {
    setActiveMode(mode);
    handleAction(mode);
    closeMenu();
  };

  // Drag & Gesture Responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });

        longPressTimer.current = setTimeout(() => {
          if (!isDragging.current && !isOpen) {
            openMenu();
          }
        }, 400);
      },

      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        if (Math.hypot(dx, dy) > 8) {
          isDragging.current = true;
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          pan.setValue({ x: dx, y: dy });
        }
      },

      onPanResponderRelease: () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        pan.flattenOffset();

        if (!isDragging.current) {
          if (isOpen) {
            closeMenu();
          } else {
            handleAction(activeMode);
          }
        }
      },
    }),
  ).current;

  return (
    <>
      {/* Backdrop overlay: tapping anywhere outside dismisses radial options */}
      {isOpen && (
        <Pressable style={StyleSheet.absoluteFillObject} onPress={closeMenu} />
      )}

      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
      >
        {/* Sub Option Circles */}
        {isOpen &&
          MODES.map((mode) => {
            const rad = (mode.angle * Math.PI) / 180;
            const translateX = menuAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, RADIUS * Math.cos(rad)],
            });
            const translateY = menuAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, RADIUS * Math.sin(rad)],
            });

            return (
              <Animated.View
                key={mode.id}
                style={[
                  styles.optionWrapper,
                  {
                    transform: [{ translateX }, { translateY }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    activeMode === mode.id && styles.optionButtonActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => selectOption(mode.id)}
                >
                  <Ionicons
                    name={mode.icon}
                    size={22}
                    color={activeMode === mode.id ? "#FFFFFF" : "#3E273A"}
                  />
                </TouchableOpacity>
              </Animated.View>
            );
          })}

        {/* Main Floating Trigger Circle */}
        <Animated.View
          style={[styles.mainButton, isOpen && styles.mainButtonExpanded]}
          {...panResponder.panHandlers}
        >
          <Ionicons name={activeConfig.icon} size={26} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>

      {/* =========================================================================
          FEATURE MODALS (Smart Coach, Add Expense, Calculator, Camera)
         ========================================================================= */}

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
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Add Expense</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color="#3E273A" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Expense Name (e.g. Lunch)"
              placeholderTextColor="#999"
              value={expenseName}
              onChangeText={setExpenseName}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount ($)"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
            />

            <TextInput
              style={styles.input}
              placeholder="Category (e.g. Food, Transport)"
              placeholderTextColor="#999"
              value={expenseCategory}
              onChangeText={setExpenseCategory}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAddExpenseSubmit}
            >
              <Text style={styles.submitBtnText}>Enter</Text>
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
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Smart Coach</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color="#3E273A" />
              </TouchableOpacity>
            </View>

            <View style={styles.chatBoxPlaceholder}>
              <Text style={styles.chatText}>
                Hello! How can I help you analyze your spending today?
              </Text>
            </View>

            <View style={styles.chatInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Ask your Smart Coach..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.sendBtn}>
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
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calculator</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color="#3E273A" />
              </TouchableOpacity>
            </View>
            <Text style={{ color: "#666", marginVertical: 20 }}>
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
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan Receipt</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color="#3E273A" />
              </TouchableOpacity>
            </View>
            <Text style={{ color: "#666", marginVertical: 20 }}>
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
    elevation: 10,
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3E273A",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  mainButtonExpanded: {
    backgroundColor: "#2A1A27",
  },
  optionWrapper: {
    position: "absolute",
  },
  optionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3EBF1",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionButtonActive: {
    backgroundColor: "#3E273A",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3E273A",
  },
  input: {
    backgroundColor: "#F3EBF1",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: "#3E273A",
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: "#3E273A",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  chatBoxPlaceholder: {
    backgroundColor: "#F8F5F8",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    minHeight: 120,
  },
  chatText: {
    color: "#3E273A",
    fontSize: 14,
  },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sendBtn: {
    backgroundColor: "#3E273A",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
