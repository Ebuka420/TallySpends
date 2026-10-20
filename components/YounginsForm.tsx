import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { BudgetCopy, ui } from "./BudgetUI";
import { RELATIONSHIPS, dateOnly, isDateOnly, type FieldErrors, type YounginsDraft } from "../src/youngins/model";
import type { ThemeMode, ThemePalette } from "../src/theme";

export const younginsBrand = (theme: ThemePalette): ThemePalette => theme;
export default function YounginsForm({ draft, errors, onChange, onBlur, disabled, theme, themeMode, includeNin = true }: {
  draft: YounginsDraft; errors: FieldErrors;
  onChange: (field: keyof YounginsDraft, value: string) => void;
  onBlur: (field: keyof YounginsDraft) => void;
  disabled: boolean; theme: ThemePalette; themeMode: ThemeMode; includeNin?: boolean;
}) {
  const [dateOpen, setDateOpen] = useState(false);
  const [relationshipOpen, setRelationshipOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const label = (text: string) => <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>{text}</Text>;
  const error = (field: keyof YounginsDraft) => errors[field] ? <BudgetCopy theme={theme} error>{errors[field]}</BudgetCopy> : null;
  const inputStyle = (field: keyof YounginsDraft) => [ui.input, { color: theme.textPrimary, backgroundColor: theme.surface, borderColor: errors[field] ? theme.danger : theme.border }];
  return <View style={{ gap: 20 }}>
    {(["firstName", "lastName"] as const).map((field, index) => <View key={field}>
      {label(index === 0 ? "First Name" : "Last Name")}
      <TextInput accessibilityLabel={index === 0 ? "First Name, required" : "Last Name, required"}
        value={draft[field]} onChangeText={value => onChange(field, value)} onBlur={() => onBlur(field)}
        editable={!disabled} autoCapitalize="words" autoCorrect={false} style={inputStyle(field)} />
      {error(field)}
    </View>)}
    <View>
      {label("Date of Birth (DOB)")}
      <Pressable accessibilityRole="button" accessibilityLabel="Select date of birth" disabled={disabled}
        onPress={() => { setPickerDate(isDateOnly(draft.dateOfBirth) ? new Date(draft.dateOfBirth + "T12:00:00") : new Date()); setDateOpen(true); }}
        style={[ui.input, ui.row, { backgroundColor: theme.surface, borderColor: errors.dateOfBirth ? theme.danger : theme.border }]}>
        <Text style={{ color: draft.dateOfBirth ? theme.textPrimary : theme.textSecondary, flex: 1 }}>{draft.dateOfBirth || "Select date of birth"}</Text>
        <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
      </Pressable>
      {dateOpen && <View>
        <DateTimePicker value={pickerDate} mode="date" maximumDate={new Date()} display={Platform.OS === "ios" ? "spinner" : "default"}
          themeVariant={themeMode} textColor={theme.textPrimary} accentColor={theme.accent}
          onChange={(event, date) => {
            if (Platform.OS !== "ios") setDateOpen(false);
            if (event.type === "set" && date) { setPickerDate(date); onChange("dateOfBirth", dateOnly(date)); }
          }} />
        {Platform.OS === "ios" && <Pressable accessibilityRole="button" onPress={() => {
          onChange("dateOfBirth", dateOnly(pickerDate)); setDateOpen(false);
        }} style={{ padding: 12, alignSelf: "flex-end" }}><Text style={{ color: theme.textPrimary, fontWeight: "700" }}>Done</Text></Pressable>}
      </View>}
      {error("dateOfBirth")}
    </View>
    <View>
      {label("Guardian Relationship")}
      <Pressable accessibilityRole="button" accessibilityLabel="Select guardian relationship" accessibilityState={{ expanded: relationshipOpen }}
        disabled={disabled} onPress={() => setRelationshipOpen(value => !value)}
        style={[ui.input, ui.row, { backgroundColor: theme.surface, borderColor: errors.guardianRelationship ? theme.danger : theme.border }]}>
        <Text style={{ color: draft.guardianRelationship ? theme.textPrimary : theme.textSecondary, flex: 1 }}>{draft.guardianRelationship || "Select relationship"}</Text>
        <Ionicons name={relationshipOpen ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
      </Pressable>
      {relationshipOpen && <View style={{ backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 16, marginTop: 8 }}>
        {RELATIONSHIPS.map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: draft.guardianRelationship === value }}
          disabled={disabled} onPress={() => { onChange("guardianRelationship", value); setRelationshipOpen(false); }} style={{ padding: 16 }}>
          <Text style={{ color: theme.textPrimary, fontWeight: draft.guardianRelationship === value ? "700" : "400" }}>{value}</Text>
        </Pressable>)}
      </View>}
      {error("guardianRelationship")}
    </View>
    {includeNin && <View>
      {label("National Identification Number (NIN)")}
      <TextInput accessibilityLabel="National Identification Number, required, 11 digits" value={draft.nin}
        onChangeText={value => onChange("nin", value)} onBlur={() => onBlur("nin")}
        keyboardType="number-pad" secureTextEntry autoComplete="off" textContentType="none"
        autoCorrect={false} spellCheck={false} editable={!disabled} style={inputStyle("nin")} />
      {error("nin")}
    </View>}
  </View>;
}

