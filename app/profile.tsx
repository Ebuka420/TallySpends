import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef } from "react";
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getProfileSnapshot, loadAccountProfile } from "../src/profile/repository";
import { useAppStore } from "../src/store";

export default function ProfileScreen() {
  const router = useRouter();
  const { profileImage, setProfileImage, profileFullName, profilePhoneNumber, profileEmail,
    profileGender, profileDob, profileAddress, profileTallyTag, theme, profileLoading, profileSaving } = useAppStore();
  const styles = getStyles(theme);
  const imageLock = useRef(false);
  const pickImageFromGallery = async () => {
    if (imageLock.current || profileSaving || profileLoading) return;
    imageLock.current = true;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Allow photo library access to change your profile photo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        await setProfileImage(asset.uri, asset.fileName || "profile.jpg", asset.mimeType || "image/jpeg");
      }
    } catch (error) {
      Alert.alert("Could not save photo", error instanceof Error ? error.message : "Please try again.");
    } finally { imageLock.current = false; }
  };
  const displayName = profileFullName?.trim() || profileTallyTag || "My Profile";
  useFocusEffect(useCallback(() => {
    let active = true;
    const refresh = async () => {
      await loadAccountProfile(true);
      const error = getProfileSnapshot().error;
      if (active && error) Alert.alert("Could not load profile", error, [
        { text: "Close", style: "cancel" }, { text: "Try again", onPress: () => { void refresh(); } },
      ]);
    };
    void refresh();
    return () => { active = false; };
  }, []));
  const profileDetails = [
    { label: "Full Name", value: profileFullName },
    { label: "Username", value: profileTallyTag },
    { label: "Mobile Number", value: profilePhoneNumber },
    { label: "Gender", value: profileGender },
    { label: "Date of Birth", value: profileDob },
    { label: "Email", value: profileEmail },
    { label: "Address", value: profileAddress },
  ];
  const copyTallyTag = async () => {
    if (!profileTallyTag) return;
    try { await Clipboard.setStringAsync(profileTallyTag); Alert.alert("Copied", "TallyTag copied to clipboard!"); }
    catch { Alert.alert("Could not copy", "Please try again."); }
  };
  return <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
        <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Profile</Text>
      <View style={styles.placeholderBox} />
    </View>
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImageFromGallery}
          disabled={profileSaving || profileLoading} activeOpacity={0.8}
          accessibilityRole="button" accessibilityLabel="Change profile photo" accessibilityState={{ disabled: profileSaving || profileLoading, busy: profileSaving }}>
          {profileImage ? <Image source={{ uri: profileImage }} style={[styles.avatar, { borderColor: theme.surface }]} accessibilityLabel="Profile photo" />
            : <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surfaceSoft, borderColor: theme.surface }]}>
              <Ionicons name="person" size={54} color={theme.textSecondary} />
            </View>}
          <View style={[styles.cameraBadge, { backgroundColor: theme.accent, borderColor: theme.surface }]}>
            {profileSaving ? <ActivityIndicator size="small" color={theme.onAccent} /> : <Ionicons name="camera" size={16} color={theme.onAccent} />}
          </View>
        </TouchableOpacity>
        <Text style={[styles.profileUsernameText, { color: theme.textPrimary }]}>{displayName}</Text>
        {profileLoading && <ActivityIndicator color={theme.accent} accessibilityLabel="Refreshing profile" />}
      </View>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.cardRow, { borderBottomWidth: 1, borderColor: theme.border, paddingBottom: 14 }]}>
          <Text style={[styles.cardFieldLabel, { color: theme.textSecondary }]}>TallyTag</Text>
          <View style={styles.accountNumberWrapper}>
            <Text style={[styles.accountNumberText, { color: theme.textPrimary }]}>{profileTallyTag || "Not provided"}</Text>
            {profileTallyTag ? <TouchableOpacity style={{ marginLeft: 6 }} onPress={copyTallyTag} accessibilityRole="button" accessibilityLabel="Copy TallyTag">
              <Ionicons name="copy-outline" size={14} color={theme.textSecondary} />
            </TouchableOpacity> : null}
          </View>
        </View>
        <View style={[styles.cardRow, { paddingTop: 14 }]}>
          <Text style={[styles.cardFieldLabel, { color: theme.textSecondary }]}>Account Plan</Text>
          <View style={styles.badgeFlexContainer}>
            <View style={[styles.planTierBadge, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="ribbon-outline" size={12} color={theme.accent} style={{ marginRight: 4 }} />
              <Text style={[styles.planTierBadgeText, { color: theme.accent }]}>Not provided</Text>
            </View>
            <TouchableOpacity style={styles.upgradeLinkRow} onPress={() => router.push("/membership")} activeOpacity={0.7}>
              <Text style={styles.upgradeLinkLabelText}>Upgrade</Text>
              <Ionicons name="chevron-forward" size={12} color="#EC7063" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {profileDetails.map((item, index) => <View key={item.label} style={[
          styles.cardRow, styles.demographicPaddingRow,
          index !== profileDetails.length - 1 && [styles.rowBorderDivider, { borderColor: theme.border }],
        ]}>
          <Text style={[styles.cardFieldLabel, { color: theme.textSecondary }]}>{item.label}</Text>
          <View style={styles.interactiveRowRightLayout}>
            <Text style={[styles.fieldValueDisplayText, { color: item.value ? theme.textPrimary : theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{item.value || "Not provided"}</Text>
          </View>
        </View>)}
      </View>
      <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: "center" }}>Contact support if your profile details need correcting.</Text>
    </ScrollView>
  </SafeAreaView>;
}

const getStyles = (theme: import("../src/theme").ThemePalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surfaceSoft,
  },
  scrollContainer: {
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  placeholderBox: {
    width: 40,
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.surface,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: theme.surface,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.surface,
  },
  profileUsernameText: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.textPrimary,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  demographicPaddingRow: {
    paddingVertical: 14,
  },
  rowBorderDivider: {
    borderBottomWidth: 1,
    borderColor: theme.surfaceSoft,
  },
  cardFieldLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: "500",
  },
  accountNumberWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  accountNumberText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.textPrimary,
  },
  badgeFlexContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  planTierBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  planTierBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.accent,
  },
  upgradeLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCE4D6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upgradeLinkLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EC7063",
    marginRight: 2,
  },
  interactiveRowRightLayout: {
    flexDirection: "row",
    alignItems: "center",
  },
  fieldValueDisplayText: {
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: "500",
  },
  placeholderValueText: {
    color: theme.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeaderStyle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    marginBottom: 16,
  },
  inputFieldSubLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
    borderColor: theme.border,
  },
  modalInputNoMargin: {
    flex: 1,
    fontSize: 14,
    height: "100%",
  },
  eyeToggleBtn: {
    padding: 4,
  },
  saveButton: {
    borderRadius: 14,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  genderOption: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
});


