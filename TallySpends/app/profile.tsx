import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();

  // Handle mock static layout data for user profiles
  const profileDetails = [
    { label: "Full Name", value: "Goziechi Chigozie", hasArrow: false },
    { label: "Mobile Number", value: "+234 814 622 4577", hasArrow: true },
    {
      label: "Nickname",
      value: "Enter Nickname",
      hasArrow: true,
      isPlaceholder: true,
    },
    { label: "Gender", value: "Male", hasArrow: false },
    { label: "Date of Birth", value: "**-**-11", hasArrow: false },
    {
      label: "Email",
      value: "Enter Email",
      hasArrow: true,
      isPlaceholder: true,
    },
    { label: "Address", value: "", hasArrow: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#2D232E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.placeholderBox} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* --- AVATAR SELECTION BLOCK --- */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={54} color="#A6ACAF" />
            </View>
            <TouchableOpacity style={styles.cameraBadge} activeOpacity={0.8}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileUsernameText}>EBUKA</Text>
        </View>

        {/* --- TOP METRICS CARD (ACCOUNT NO & FREEMIUM PLAN) --- */}
        <View style={styles.card}>
          <View
            style={[
              styles.cardRow,
              {
                borderBottomWidth: 1,
                borderColor: "#F2F4F4",
                paddingBottom: 14,
              },
            ]}
          >
            <Text style={styles.cardFieldLabel}>Bank Account Number</Text>
            <View style={styles.accountNumberWrapper}>
              <Text style={styles.accountNumberText}>3546892334</Text>
              <TouchableOpacity style={{ marginLeft: 6 }}>
                <Ionicons name="copy-outline" size={14} color="#A6ACAF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.cardRow, { paddingTop: 14 }]}>
            <Text style={styles.cardFieldLabel}>Account Plan</Text>
            <View style={styles.badgeFlexContainer}>
              <View style={styles.planTierBadge}>
                <Ionicons
                  name="ribbon-outline"
                  size={12}
                  color="#6442E5"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.planTierBadgeText}>Freemium</Text>
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
        <View style={styles.card}>
          {profileDetails.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.cardRow,
                styles.demographicPaddingRow,
                index !== profileDetails.length - 1 && styles.rowBorderDivider,
              ]}
              disabled={!item.hasArrow}
              activeOpacity={0.7}
            >
              <Text style={styles.cardFieldLabel}>{item.label}</Text>
              <View style={styles.interactiveRowRightLayout}>
                {item.value !== "" && (
                  <Text
                    style={[
                      styles.fieldValueDisplayText,
                      item.isPlaceholder && styles.placeholderValueText,
                    ]}
                  >
                    {item.value}
                  </Text>
                )}
                {item.hasArrow && (
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color="#A6ACAF"
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
});
