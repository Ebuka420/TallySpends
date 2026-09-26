import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { BudgetButton, BudgetCopy, ui } from "./BudgetUI";
import {
  localDate,
  today,
  money,
  type PlanActivity,
} from "../src/budget/ledger";
import { PersonRow, type PeopleDirectory } from "./BudgetPeople";
import { useRouter, type Href } from "expo-router";
import type { ThemePalette } from "../src/theme";
export { ParticipantsInput } from "./BudgetPeople";

export function PlanTip({ theme, title = "A little tip", text }: { theme: ThemePalette; title?: string; text: string }) {
  return <View style={{ flexDirection: "row", gap: 10, borderRadius: 17, padding: 15, marginTop: 8, backgroundColor: theme.accentSoft }}>
    <Ionicons name="bulb-outline" size={20} color={theme.accent} />
    <View style={{ flex: 1, gap: 4 }}><Text style={{ color: theme.textPrimary, fontSize: 12.5, fontWeight: "800" }}>{title}</Text><Text style={{ color: theme.textSecondary, fontSize: 11.5, lineHeight: 17 }}>{text}</Text></View>
  </View>;
}

export function AddAction({
  theme,
  onPress,
  label = "Add",
}: {
  theme: ThemePalette;
  onPress: () => void;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minHeight: 42,
        flexDirection: "row",
        gap: 5,
        alignItems: "center",
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: theme.accent,
      }}
    >
      <Ionicons name="add" size={19} color={theme.accent} />
      <Text style={{ fontSize: 12, fontWeight: "800", color: theme.accent }}>
        {label}
      </Text>
    </Pressable>
  );
}

export type BudgetFrequency = "once" | "monthly" | "weekly" | "biweekly";
const periodNames: Record<BudgetFrequency, string> = {
  once: "One-time",
  monthly: "Monthly",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
};
export function BudgetSchedule({
  theme,
  frequency,
  start,
  onChange,
}: {
  theme: ThemePalette;
  frequency: BudgetFrequency;
  start: string;
  onChange: (frequency: BudgetFrequency, start: string) => void;
}) {
  const [sheet, setSheet] = useState<"frequency" | "day" | null>(null);
  const date = new Date(`${start}T12:00:00`);
  const chooseDay = (value: number) => {
    const next = new Date(`${today()}T12:00:00`);
    if (frequency === "monthly") {
      for (let offset = 0; offset < 13; offset++) {
        const candidate = new Date(
          next.getFullYear(),
          next.getMonth() + offset,
          value,
          12,
        );
        if (candidate.getDate() === value && localDate(candidate) >= today()) {
          onChange(frequency, localDate(candidate));
          break;
        }
      }
    } else {
      next.setDate(next.getDate() + ((value - next.getDay() + 7) % 7));
      onChange(frequency, localDate(next));
    }
    setSheet(null);
  };
  return (
    <View style={{ gap: 10, width: "100%" }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose budget frequency"
        onPress={() => setSheet("frequency")}
        style={[ui.balancePill, { backgroundColor: theme.surfaceSoft }]}
      >
        <Ionicons name="repeat-outline" size={17} color={theme.accent} />
        <Text style={{ color: theme.textPrimary, fontWeight: "600" }}>
          {periodNames[frequency]}
        </Text>
        <Ionicons name="chevron-down" color={theme.textSecondary} size={16} />
      </Pressable>
      {frequency === "once" ? (
        <BudgetDate
          theme={theme}
          label="Starts"
          value={start}
          onChange={(value) => onChange(frequency, value)}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose budget start day"
          onPress={() => setSheet("day")}
          style={[ui.balancePill, { backgroundColor: theme.surfaceSoft }]}
        >
          <Ionicons name="calendar-outline" size={17} color={theme.accent} />
          <Text style={{ color: theme.textPrimary }}>
            {frequency === "monthly"
              ? `Day ${date.getDate()}`
              : date.toLocaleDateString("en-NG", { weekday: "long" })}{" "}
            · {start}
          </Text>
          <Ionicons name="chevron-down" color={theme.textSecondary} size={16} />
        </Pressable>
      )}
      <PlanningSheet
        visible={sheet === "frequency"}
        title="Frequency:"
        theme={theme}
        onClose={() => setSheet(null)}
      >
        {(Object.keys(periodNames) as BudgetFrequency[]).map((key) => (
          <Pressable
            key={key}
            accessibilityRole="radio"
            accessibilityState={{ checked: key === frequency }}
            onPress={() => {
              onChange(key, start);
              setSheet(null);
            }}
            style={[ui.row, { paddingVertical: 14 }]}
          >
            <Text style={{ flex: 1, color: theme.textPrimary, fontSize: 17 }}>
              {periodNames[key]}
            </Text>
            <Ionicons
              name={key === frequency ? "radio-button-on" : "radio-button-off"}
              size={23}
              color={key === frequency ? theme.accent : theme.border}
            />
          </Pressable>
        ))}
        <BudgetCopy theme={theme}>
          Choose the length of this funded period. This does not schedule
          automatic top-ups.
        </BudgetCopy>
      </PlanningSheet>
      <PlanningSheet
        visible={sheet === "day"}
        title={
          frequency === "monthly" ? "Select day of month" : "On which day?"
        }
        theme={theme}
        onClose={() => setSheet(null)}
      >
        {frequency === "monthly" ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={`Day ${day}`}
                onPress={() => chooseDay(day)}
                style={{
                  width: "22%",
                  minHeight: 48,
                  borderRadius: 30,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    date.getDate() === day ? theme.accent : theme.surfaceSoft,
                }}
              >
                <Text
                  style={{
                    color:
                      date.getDate() === day
                        ? theme.background
                        : theme.textPrimary,
                    fontWeight: "700",
                  }}
                >
                  {day}
                  {day > 10 && day < 14
                    ? "th"
                    : day % 10 === 1
                      ? "st"
                      : day % 10 === 2
                        ? "nd"
                        : day % 10 === 3
                          ? "rd"
                          : "th"}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          [1, 2, 3, 4, 5, 6, 0].map((day) => (
            <Pressable
              key={day}
              accessibilityRole="radio"
              accessibilityState={{ checked: date.getDay() === day }}
              onPress={() => chooseDay(day)}
              style={[ui.row, { paddingVertical: 14 }]}
            >
              <Text style={{ flex: 1, color: theme.textPrimary, fontSize: 17 }}>
                {
                  [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ][day]
                }
              </Text>
              <Ionicons
                name={
                  date.getDay() === day ? "radio-button-on" : "radio-button-off"
                }
                size={23}
                color={theme.accent}
              />
            </Pressable>
          ))
        )}
        <BudgetCopy theme={theme}>
          Uses the next matching date, starting today.
        </BudgetCopy>
      </PlanningSheet>
    </View>
  );
}
export function PlanningSheet({
  visible,
  title,
  theme,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  theme: ThemePalette;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={ui.overlay}
      >
        <BlurView
          intensity={22}
          tint={theme.textPrimary === "#F7F4F8" ? "dark" : "light"}
          style={{ position: "absolute", inset: 0 }}
        />
        <Pressable
          accessibilityLabel="Close sheet"
          onPress={onClose}
          style={{ position: "absolute", inset: 0 }}
        />
        <View
          accessibilityViewIsModal
          style={[
            ui.sheet,
            { backgroundColor: theme.surface, paddingBottom: 34 },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 14 }}
          >
            <View style={ui.handle} />
            <View style={ui.row}>
              <Text style={[ui.heading, { flex: 1, color: theme.textPrimary }]}>
                {title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={ui.back}
              >
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </Pressable>
            </View>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
/** Calendar grid and compact selection sheets match the second input reference. */
export function BudgetDate({
  label,
  value,
  onChange,
  theme,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  theme: ThemePalette;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value.slice(0, 7));
  const [draft, setDraft] = useState(value);
  const date = new Date(`${month}-01T12:00:00`);
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const shift = (offset: number) =>
    setMonth(
      localDate(
        new Date(date.getFullYear(), date.getMonth() + offset, 1, 12),
      ).slice(0, 7),
    );
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        onPress={() => {
          setMonth(value.slice(0, 7));
          setDraft(value);
          setOpen(true);
        }}
        style={[
          ui.input,
          ui.row,
          {
            borderColor: theme.border,
            borderRadius: 30,
            backgroundColor: theme.surfaceSoft,
          },
        ]}
      >
        <Ionicons name="calendar-outline" size={18} color={theme.accent} />
        <Text style={{ flex: 1, color: theme.textPrimary }}>
          {label} ·{" "}
          {new Date(`${value}T12:00:00`).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
      </Pressable>
      <PlanningSheet
        visible={open}
        title="On which day?"
        theme={theme}
        onClose={() => setOpen(false)}
      >
        <View style={[ui.row, { justifyContent: "space-between" }]}>
          <Pressable
            accessibilityLabel="Previous month"
            onPress={() => shift(-1)}
            style={ui.back}
          >
            <Ionicons name="chevron-back" color={theme.textPrimary} size={22} />
          </Pressable>
          <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>
            {date.toLocaleDateString("en-NG", {
              month: "long",
              year: "numeric",
            })}
          </Text>
          <Pressable
            accessibilityLabel="Next month"
            onPress={() => shift(1)}
            style={ui.back}
          >
            <Ionicons
              name="chevron-forward"
              color={theme.textPrimary}
              size={22}
            />
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {Array.from({ length: days }, (_, i) => {
            const day = `${month}-${String(i + 1).padStart(2, "0")}`;
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={day}
                accessibilityState={{ selected: day === draft }}
                onPress={() => setDraft(day)}
                style={{
                  width: "22%",
                  minHeight: 48,
                  borderRadius: 28,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor:
                    day === draft ? theme.accent : theme.surfaceSoft,
                }}
              >
                <Text
                  style={{
                    color: day === draft ? theme.background : theme.textPrimary,
                    fontWeight: "700",
                  }}
                >
                  {i + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <BudgetButton
          theme={theme}
          secondary
          title="Today"
          onPress={() => {
            setMonth(today().slice(0, 7));
            setDraft(today());
          }}
        />
        <BudgetButton
          theme={theme}
          title="Continue"
          pill
          onPress={() => {
            onChange(draft);
            setOpen(false);
          }}
        />
      </PlanningSheet>
    </>
  );
}
export function usePlanAction() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (work: () => Promise<unknown>, onSuccess?: () => void) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await work();
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return { busy, error, run, setError };
}

export function PlanTabs({
  values,
  selected,
  onChange,
  theme,
}: {
  values: string[];
  selected: string;
  onChange: (value: string) => void;
  theme: ThemePalette;
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        backgroundColor: theme.surfaceSoft,
        borderRadius: 15,
        padding: 4,
        gap: 4,
      }}
    >
      {values.map((value) => (
        <Pressable
          key={value}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === selected }}
          onPress={() => onChange(value)}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: "center",
            borderRadius: 11,
            backgroundColor: value === selected ? theme.surface : "transparent",
          }}
        >
          <Text
            style={{
              color: value === selected ? theme.accent : theme.textSecondary,
              fontWeight: "700",
              fontSize: 12,
              textTransform: "capitalize",
            }}
          >
            {value}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function PlanProgress({
  current,
  target,
  theme,
}: {
  current: number;
  target: number;
  theme: ThemePalette;
}) {
  const percent =
    target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <View style={{ gap: 8 }}>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: percent }}
        style={{
          height: 6,
          borderRadius: 5,
          overflow: "hidden",
          backgroundColor: theme.surfaceSoft,
        }}
      >
        <View
          style={{
            height: 6,
            width: `${percent}%`,
            backgroundColor: theme.accent,
          }}
        />
      </View>
      <BudgetCopy theme={theme}>{percent}% funded</BudgetCopy>
    </View>
  );
}
export function Disclosure({
  title,
  detail,
  theme,
  children,
  initiallyOpen = false,
}: {
  title: string;
  detail?: string;
  theme: ThemePalette;
  children: React.ReactNode;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View
      style={{ borderTopWidth: 1, borderColor: theme.border, paddingTop: 4 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={[ui.row, { paddingVertical: 15 }]}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            style={{
              color: theme.textPrimary,
              fontWeight: "700",
              fontSize: 14,
            }}
          >
            {title}
          </Text>
          {detail && (
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              {detail}
            </Text>
          )}
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={17}
          color={theme.textSecondary}
        />
      </Pressable>
      {open && <View style={{ gap: 12, paddingBottom: 12 }}>{children}</View>}
    </View>
  );
}
export function ActionNotice({
  message,
  theme,
  destination,
  label,
}: {
  message: string;
  theme: ThemePalette;
  destination: Href;
  label: string;
}) {
  const router = useRouter();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        ui.row,
        {
          gap: 10,
          padding: 14,
          borderRadius: 16,
          backgroundColor: theme.accentSoft,
        },
      ]}
    >
      <Ionicons
        name="checkmark-circle-outline"
        color={theme.accent}
        size={22}
      />
      <Text
        style={{
          flex: 1,
          color: theme.textPrimary,
          fontSize: 13,
          lineHeight: 19,
        }}
      >
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Back to ${label}`}
        onPress={() => router.dismissTo(destination)}
        style={{ padding: 9 }}
      >
        <Text style={{ color: theme.accent, fontWeight: "800", fontSize: 13 }}>
          Done
        </Text>
      </Pressable>
    </View>
  );
}
export function PlanHistory({
  activity,
  theme,
  directory,
}: {
  activity: PlanActivity[];
  theme: ThemePalette;
  directory?: PeopleDirectory;
}) {
  const [all, setAll] = useState(false);
  const records = [...activity].reverse();
  return (
    <Disclosure
      title="Activity"
      detail={`${activity.length} saved records`}
      theme={theme}
    >
      {records.slice(0, all ? undefined : 6).map((item, index) => (
        <View
          key={`${item.id}-${index}`}
          style={{
            gap: 7,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderColor: theme.border,
          }}
        >
          {directory ? (
            <PersonRow
              person={directory.resolve(item.tag)}
              theme={theme}
              detail={new Date(item.date).toLocaleDateString("en-NG")}
              trailing={
                item.amount > 0 ? (
                  <Text
                    style={{
                      color: theme.textPrimary,
                      fontWeight: "600",
                      fontSize: 12,
                    }}
                  >
                    {money(item.amount)}
                  </Text>
                ) : undefined
              }
            />
          ) : (
            <BudgetCopy theme={theme}>
              {new Date(item.date).toLocaleDateString("en-NG")}
              {item.amount > 0 ? ` · ${money(item.amount)}` : ""}
            </BudgetCopy>
          )}
          <BudgetCopy theme={theme}>{item.note}</BudgetCopy>
        </View>
      ))}
      {records.length > 6 && (
        <BudgetButton
          secondary
          theme={theme}
          title={all ? "Show less" : "Show all activity"}
          onPress={() => setAll(!all)}
        />
      )}
    </Disclosure>
  );
}
