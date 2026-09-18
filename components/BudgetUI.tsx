import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { localDate, minor, money } from "../src/budget/ledger";
import type { ThemePalette } from "../src/theme";

export function BudgetButton({
  title,
  onPress,
  theme,
  disabled,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  theme: ThemePalette;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        {
          backgroundColor: secondary ? theme.accentSoft : theme.accent,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: secondary ? theme.accent : theme.background,
          fontWeight: "700",
          fontSize: 15,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function BudgetFrame({
  title,
  theme,
  children,
  action,
}: {
  title: string;
  theme: ThemePalette;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={ui.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(tabs)/budget")
          }
          style={[
            ui.back,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text
          accessibilityRole="header"
          style={[ui.heading, { color: theme.textPrimary, flex: 1 }]}
        >
          {title}
        </Text>
        {action}
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ui.content}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function BudgetCard({
  theme,
  children,
  soft = false,
}: {
  theme: ThemePalette;
  children: React.ReactNode;
  soft?: boolean;
}) {
  return (
    <View
      style={[
        ui.card,
        {
          backgroundColor: soft ? theme.accentSoft : theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      {children}
    </View>
  );
}
export function BudgetCopy({
  children,
  theme,
  error = false,
}: {
  children: React.ReactNode;
  theme: ThemePalette;
  error?: boolean;
}) {
  return (
    <Text
      accessibilityLiveRegion={error ? "polite" : "none"}
      style={[ui.copy, { color: error ? theme.danger : theme.textSecondary }]}
    >
      {children}
    </Text>
  );
}
export function BudgetLoading({
  theme,
  error,
  retry,
}: {
  theme: ThemePalette;
  error: string | null;
  retry: () => void;
}) {
  return (
    <BudgetCard theme={theme}>
      {error ? (
        <>
          <BudgetCopy theme={theme} error>
            {error}
          </BudgetCopy>
          <BudgetButton theme={theme} title="Try again" onPress={retry} />
        </>
      ) : (
        <>
          <ActivityIndicator color={theme.accent} />
          <BudgetCopy theme={theme}>Loading your budgets…</BudgetCopy>
        </>
      )}
    </BudgetCard>
  );
}
export function BudgetAmount({
  amount,
  theme,
}: {
  amount: number;
  theme: ThemePalette;
}) {
  const [fade] = useState(() => new Animated.Value(1));
  useEffect(() => {
    fade.setValue(0.45);
    Animated.timing(fade, {
      toValue: 1,
      duration: 230,
      useNativeDriver: true,
    }).start();
  }, [amount, fade]);
  return (
    <Animated.Text
      adjustsFontSizeToFit
      numberOfLines={1}
      style={[ui.amount, { color: theme.textPrimary, opacity: fade }]}
    >
      {money(amount)}
    </Animated.Text>
  );
}
export function AmountPad({
  visible,
  value,
  onChange,
  onClose,
  onDone,
  theme,
  title,
  available,
}: {
  visible: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onDone: () => void;
  theme: ThemePalette;
  title: string;
  available: number;
}) {
  const press = (key: string) => {
    if (key === "delete") return onChange(value.slice(0, -1));
    const next = key === "." && !value ? "0." : value + key;
    if (/^\d{0,10}(\.\d{0,2})?$/.test(next))
      onChange(next.replace(/^0+(?=\d)/, ""));
  };
  let amountMinor = 0;
  try {
    amountMinor = minor(value);
  } catch {}
  const valid = amountMinor > 0 && amountMinor <= available;
  const [whole = "", fraction] = value.split(".");
  const displayed = `${whole ? Number(whole).toLocaleString("en-NG") : "0"}${fraction !== undefined ? `.${fraction}` : ""}`;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.surface }}>
        <View style={ui.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close keypad"
            onPress={onClose}
            style={[ui.back, { backgroundColor: theme.surfaceSoft }]}
          >
            <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
          </Pressable>
          <Text
            style={[
              ui.heading,
              {
                color: theme.textPrimary,
                flex: 1,
                textAlign: "center",
                fontSize: 18,
              },
            ]}
          >
            {title}
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={ui.padContent}
        >
          <View style={ui.padDisplay}>
            <Text
              accessibilityLabel={`Amount ${value || "0"} naira`}
              style={[ui.padAmount, { color: theme.textPrimary }]}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              ₦{displayed}
            </Text>
            <View
              style={[ui.balancePill, { backgroundColor: theme.surfaceSoft }]}
            >
              <Ionicons
                name="wallet-outline"
                size={16}
                color={theme.textSecondary}
              />
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                Available {money(available)}
              </Text>
            </View>
            <Text
              style={[
                ui.padHint,
                {
                  color:
                    amountMinor > available
                      ? theme.danger
                      : theme.textSecondary,
                },
              ]}
            >
              {amountMinor > available
                ? "Amount exceeds available money"
                : "Set aside only what you need."}
            </Text>
          </View>
          <View style={ui.keypad}>
            {[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              ".",
              "0",
              "delete",
            ].map((key) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={
                  key === "delete"
                    ? "Delete last digit"
                    : key === "."
                      ? "Decimal point"
                      : key
                }
                onPress={() => press(key)}
                style={({ pressed }) => [
                  ui.key,
                  {
                    backgroundColor: pressed ? theme.accentSoft : "transparent",
                  },
                ]}
              >
                {key === "delete" ? (
                  <Ionicons
                    name="chevron-back"
                    size={27}
                    color={theme.textPrimary}
                  />
                ) : (
                  <Text
                    style={{
                      fontSize: 30,
                      fontWeight: "600",
                      color: theme.textPrimary,
                    }}
                  >
                    {key}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
          <View style={ui.pillButton}>
            <BudgetButton
              title="Continue"
              theme={theme}
              disabled={!valid}
              onPress={onDone}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
function DateWheel({
  values,
  selected,
  onSelect,
  theme,
  label,
}: {
  values: { value: number; label: string }[];
  selected: number;
  onSelect: (value: number) => void;
  theme: ThemePalette;
  label: string;
}) {
  const scroll = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const index = values.findIndex((v) => v.value === selected);
  useEffect(() => {
    if (width)
      scroll.current?.scrollTo({ x: Math.max(0, index) * 68, animated: false });
  }, [index, width]);
  return (
    <View>
      <Text
        style={[ui.padHint, { color: theme.textSecondary, marginBottom: 8 }]}
      >
        {label}
      </Text>
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <ScrollView
          ref={scroll}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={68}
          decelerationRate="fast"
          contentContainerStyle={{
            paddingHorizontal: Math.max(0, (width - 68) / 2),
          }}
          onMomentumScrollEnd={(event) => {
            const i = Math.max(
              0,
              Math.min(
                values.length - 1,
                Math.round(event.nativeEvent.contentOffset.x / 68),
              ),
            );
            onSelect(values[i].value);
          }}
        >
          {values.map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${item.label}`}
              accessibilityState={{ selected: item.value === selected }}
              onPress={() => onSelect(item.value)}
              style={[
                ui.wheelItem,
                {
                  borderColor:
                    item.value === selected ? theme.textPrimary : theme.border,
                  opacity: item.value === selected ? 1 : 0.45,
                },
              ]}
            >
              <Text
                style={{
                  color: theme.textPrimary,
                  fontSize: 20,
                  fontWeight: "700",
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
export function BudgetDate({
  label,
  value,
  onChange,
  theme,
}: {
  label: string;
  value: string;
  onChange: (day: string) => void;
  theme: ThemePalette;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(new Date());
  const date = new Date(`${value}T12:00:00`);
  return (
    <View>
      <BudgetCopy theme={theme}>{label}</BudgetCopy>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        onPress={() => {
          setDraft(date);
          setOpen(true);
        }}
        style={[ui.input, ui.row, { borderColor: theme.border }]}
      >
        <Ionicons name="calendar-outline" size={19} color={theme.accent} />
        <Text style={{ color: theme.textPrimary }}>
          {date.toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={ui.overlay}>
          <BlurView
            intensity={25}
            tint={theme.textPrimary === "#F7F4F8" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            accessibilityLabel="Close date picker"
            onPress={() => setOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            style={[
              ui.sheet,
              { backgroundColor: theme.surface, paddingBottom: 35 },
            ]}
          >
            <ScrollView contentContainerStyle={{ gap: 12 }}>
              <View style={ui.handle} />
              <Text
                style={[
                  ui.heading,
                  { color: theme.textPrimary, textAlign: "center" },
                ]}
              >
                {label}
              </Text>
              <View
                style={[ui.balancePill, { backgroundColor: theme.surfaceSoft }]}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: "600" }}>
                  {draft.toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <DateWheel
                theme={theme}
                label="Year"
                values={Array.from({ length: 21 }, (_, i) => ({
                  value: new Date().getFullYear() - 5 + i,
                  label: String(new Date().getFullYear() - 5 + i),
                }))}
                selected={draft.getFullYear()}
                onSelect={(year) =>
                  setDraft(
                    new Date(
                      year,
                      draft.getMonth(),
                      Math.min(
                        draft.getDate(),
                        new Date(year, draft.getMonth() + 1, 0).getDate(),
                      ),
                      12,
                    ),
                  )
                }
              />
              <DateWheel
                theme={theme}
                label="Month"
                values={Array.from({ length: 12 }, (_, i) => ({
                  value: i,
                  label: new Date(2026, i, 1).toLocaleDateString("en-NG", {
                    month: "short",
                  }),
                }))}
                selected={draft.getMonth()}
                onSelect={(month) =>
                  setDraft(
                    new Date(
                      draft.getFullYear(),
                      month,
                      Math.min(
                        draft.getDate(),
                        new Date(draft.getFullYear(), month + 1, 0).getDate(),
                      ),
                      12,
                    ),
                  )
                }
              />
              <DateWheel
                theme={theme}
                label="Day"
                values={Array.from(
                  {
                    length: new Date(
                      draft.getFullYear(),
                      draft.getMonth() + 1,
                      0,
                    ).getDate(),
                  },
                  (_, i) => ({ value: i + 1, label: String(i + 1) }),
                )}
                selected={draft.getDate()}
                onSelect={(day) =>
                  setDraft(
                    new Date(draft.getFullYear(), draft.getMonth(), day, 12),
                  )
                }
              />
              <View
                style={{
                  height: 18,
                  width: 2,
                  alignSelf: "center",
                  backgroundColor: theme.textPrimary,
                }}
              />
              <Text
                style={{
                  color: theme.textPrimary,
                  textAlign: "center",
                  fontSize: 12,
                }}
              >
                Selected
              </Text>
              <View style={ui.pillButton}>
                <BudgetButton
                  theme={theme}
                  title="Continue"
                  onPress={() => {
                    onChange(localDate(draft));
                    setOpen(false);
                  }}
                />
              </View>
              <BudgetButton
                theme={theme}
                title="Cancel"
                secondary
                onPress={() => setOpen(false)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
export const ui = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  content: { padding: 20, paddingTop: 8, paddingBottom: 120, gap: 16 },
  card: { borderWidth: 1, borderRadius: 23, padding: 20, gap: 12 },
  copy: { fontSize: 13, lineHeight: 20 },
  amount: { fontSize: 34, fontWeight: "800", letterSpacing: -1 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  button: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,.4)",
  },
  sheet: {
    padding: 22,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "92%",
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#A7A1AA",
    alignSelf: "center",
    marginBottom: 14,
  },
  padContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 },
  padDisplay: {
    flex: 1,
    minHeight: 230,
    justifyContent: "center",
    alignItems: "center",
  },
  padAmount: {
    fontSize: 50,
    textAlign: "center",
    fontWeight: "700",
    width: "100%",
  },
  balancePill: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 30,
    marginTop: 14,
  },
  pillButton: {
    width: 160,
    alignSelf: "center",
    marginTop: 18,
    borderRadius: 30,
    overflow: "hidden",
  },
  wheelItem: {
    width: 64,
    marginHorizontal: 2,
    borderRadius: 28,
    borderWidth: 1.5,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  padHint: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  key: {
    width: "31%",
    minHeight: 58,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});
