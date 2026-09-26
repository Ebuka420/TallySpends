import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ThemePalette } from "../src/theme";
export function CoachToolSheet({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  theme,
  children,
  footer
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  theme: ThemePalette;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[s.overlay, {
      paddingTop: insets.top + 10
    }]}>
      <Pressable accessibilityLabel={`Close ${title}`} onPress={onClose} style={StyleSheet.absoluteFill} />
      <View accessibilityViewIsModal style={[s.sheet, {
        backgroundColor: theme.background,
        paddingBottom: Math.max(18, insets.bottom)
      }]}>
        <View style={[s.handle, {
          backgroundColor: theme.border
        }]} />
        <View style={s.header}>
          <View style={[s.icon, {
            backgroundColor: theme.accentSoft
          }]}><Ionicons name={icon} size={22} color={theme.accent} /></View>
          <View style={{
            flex: 1
          }}><Text style={[s.title, {
              color: theme.textPrimary
            }]}>{title}</Text><Text style={[s.subtitle, {
              color: theme.textSecondary
            }]}>{subtitle}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Close ${title}`} onPress={onClose} style={[s.close, {
            backgroundColor: theme.surfaceSoft
          }]}><Ionicons name="close" size={21} color={theme.textPrimary} /></Pressable>
        </View>
        <ScrollView key={title} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>{children}</ScrollView>
        {footer && <View style={[s.footer, {
          borderColor: theme.border
        }]}>{footer}</View>}
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(12,8,17,.48)"
  },
  sheet: {
    maxHeight: "96%",
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 4,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 18
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingBottom: 20
  },
  icon: {
    height: 44,
    width: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -.4
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  body: {
    paddingHorizontal: 22,
    paddingBottom: 18
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 12
  }
});
