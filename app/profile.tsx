import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppStore } from "../src/store";

export default function ProfileScreen() {
  const router = useRouter();
  const {
    profileImage,
    setProfileImage,
    profileFullName,
    setProfileFullName,
    profilePhoneNumber,
    setProfilePhoneNumber,
    profileEmail,
    setProfileEmail,
    profileNickname,
    setProfileNickname,
    profileGender,
    setProfileGender,
    profileDob,
    setProfileDob,
    profileAddress,
    setProfileAddress,
    profileTallyTag,
    setProfileTallyTag,
    theme,
  } = useAppStore();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const pickImageFromGallery = async () => {
    // Request permission to access the media library
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Permission to access camera roll is required!");
      return;
    }

    // Launch image picker selector
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      await setProfileImage(uri);
    }
  };

  const handleEditRow = (fieldLabel: string, currentValue: string) => {
    setEditingField(fieldLabel);
    setEditValue(currentValue === "Enter Nickname" || currentValue === "Enter Email" || currentValue === "Enter Address" || currentValue === "Enter Date of Birth" || currentValue === "Enter Gender" ? "" : currentValue);
    setIsEditModalVisible(true);
  };

  const handleSaveField = async () => {
    if (!editingField) return;

    const trimmed = editValue.trim();

    switch (editingField) {
      case "Full Name":
        if (!trimmed) {
          Alert.alert("Error", "Full Name cannot be empty.");
          return;
        }
        await setProfileFullName(trimmed);
        break;
      case "Mobile Number":
        await setProfilePhoneNumber(trimmed);
        break;
      case "Nickname":
        await setProfileNickname(trimmed);
        break;
      case "Gender":
        await setProfileGender(trimmed || "Male");
        break;
      case "Date of Birth":
        await setProfileDob(trimmed);
        break;
      case "Email":
        await setProfileEmail(trimmed);
        break;
      case "Address":
        await setProfileAddress(trimmed);
        break;
    }

    setIsEditModalVisible(false);
    setEditingField(null);
  };

  const profileDetails = [
    { label: "Full Name", value: profileFullName || "Enter Full Name", hasArrow: true },
    { label: "Mobile Number", value: profilePhoneNumber || "Enter Mobile Number", hasArrow: true },
    {
      label: "Nickname",
      value: profileNickname || "Enter Nickname",
      hasArrow: true,
      isPlaceholder: !profileNickname || profileNickname === "Enter Nickname",
    },
    { label: "Gender", value: profileGender || "Male", hasArrow: true },
    { label: "Date of Birth", value: profileDob || "Enter Date of Birth", hasArrow: true },
    {
      label: "Email",
      value: profileEmail || "Enter Email",
      hasArrow: true,
      isPlaceholder: !profileEmail || profileEmail === "Enter Email",
    },
    {
      label: "Address",
      value: profileAddress || "Enter Address",
      hasArrow: true,
      isPlaceholder: !profileAddress || profileAddress === "Enter Address",
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* --- HEADER --- */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Profile</Text>
        <View style={styles.placeholderBox} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* --- AVATAR SELECTION BLOCK --- */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={pickImageFromGallery}
            activeOpacity={0.8}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={[styles.avatar, { borderColor: theme.surface }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surfaceSoft, borderColor: theme.surface }]}>
                <Ionicons name="person" size={54} color={theme.textSecondary} />
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: theme.accent, borderColor: theme.surface }]}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.profileUsernameText, { color: theme.textPrimary }]}>
            {(profileFullName || "User").toUpperCase()}
          </Text>
        </View>

        {/* --- TOP METRICS CARD (TALLYTAG & ACCOUNT PLAN) --- */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View
            style={[
              styles.cardRow,
              {
                borderBottomWidth: 1,
                borderColor: theme.border,
                paddingBottom: 14,
              },
            ]}
          >
            <Text style={[styles.cardFieldLabel, { color: theme.textSecondary }]}>TallyTag</Text>
            <View style={styles.accountNumberWrapper}>
              <Text style={[styles.accountNumberText, { color: theme.textPrimary }]}>
                {profileTallyTag || ("@" + (profileFullName || "user").replace(/\s+/g, "").toUpperCase())}
              </Text>
              <TouchableOpacity
                style={{ marginLeft: 6 }}
                onPress={() => {
                  Alert.alert("Copied", "TallyTag copied to clipboard!");
                }}
              >
                <Ionicons name="copy-outline" size={14} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.cardRow, { paddingTop: 14 }]}> 
            <Text style={[styles.cardFieldLabel, { color: theme.textSecondary }]}>Account Plan</Text>
            <View style={styles.badgeFlexContainer}>
              <View style={[styles.planTierBadge, { backgroundColor: theme.accentSoft }]}>
                <Ionicons
                  name="ribbon-outline"
                  size={12}
                  color={theme.accent}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.planTierBadgeText, { color: theme.accent }]}>Freemium</Text>
              </View>
              <TouchableOpacity
                style={styles.upgradeLinkRow}
                activeOpacity={0.7}
              >
                <Text style={styles.upgradeLinkLabelText}>Upgrade</Text>
                <Ionicons name="chevron-forward" size={12} color="#EC7063" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* --- DEMOGRAPHICS LIST CARD --- */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {profileDetails.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.cardRow,
                styles.demographicPaddingRow,
                index !== profileDetails.length - 1 && [styles.rowBorderDivider, { borderColor: theme.border }],
              ]}
              onPress={() => handleEditRow(item.label, item.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cardFieldLabel, { color: theme.textSecondary }]}>{item.label}</Text>
              <View style={styles.interactiveRowRightLayout}>
                <Text
                  style={[
                    styles.fieldValueDisplayText,
                    { color: theme.textPrimary },
                    item.isPlaceholder && { color: theme.textSecondary },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.value}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={theme.textSecondary}
                  style={{ marginLeft: 6 }}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* --- EDIT SHEET MODAL --- */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsEditModalVisible(false);
          setEditingField(null);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setIsEditModalVisible(false);
            setEditingField(null);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%" }}
          >
            <TouchableOpacity
              style={[styles.modalSheet, { backgroundColor: theme.surface }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeaderStyle}>
                <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>Edit {editingField}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsEditModalVisible(false);
                    setEditingField(null);
                  }}
                >
                  <Ionicons name="close" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              {editingField === "Gender" ? (
                <View style={styles.genderContainer}>
                  {["Male", "Female", "Other"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderOption,
                        { borderColor: theme.border, backgroundColor: theme.background },
                        editValue === g && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
                      ]}
                      onPress={() => setEditValue(g)}
                    >
                      <Text
                        style={{
                          color: editValue === g ? theme.accent : theme.textPrimary,
                          fontWeight: "700",
                        }}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      color: theme.textPrimary,
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                    editingField === "Address" && { height: 80, textAlignVertical: "top" },
                  ]}
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder={editingField === "Date of Birth" ? "e.g. YYYY-MM-DD" : `Enter ${editingField}`}
                  placeholderTextColor={theme.textSecondary}
                  autoFocus
                  multiline={editingField === "Address"}
                />
              )}

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.accent }]}
                onPress={handleSaveField}
              >
                <Text style={styles.saveButtonText}>Save Details</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#EFEFEF",
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
    color: "#2D232E",
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
    backgroundColor: "#EAEAEA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2D232E",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileUsernameText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D232E",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
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
    borderColor: "#F8F9FA",
  },
  cardFieldLabel: {
    fontSize: 14,
    color: "#534B52",
    fontWeight: "500",
  },
  accountNumberWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  accountNumberText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D232E",
  },
  badgeFlexContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  planTierBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0E6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  planTierBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6442E5",
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
    color: "#2D232E",
    fontWeight: "500",
  },
  placeholderValueText: {
    color: "#A6ACAF",
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
    marginBottom: 20,
  },
  saveButton: {
    borderRadius: 14,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
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
