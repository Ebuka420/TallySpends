import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAppStore } from "../src/store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Updated with live high-quality CDN URLs for Nigerian bank logos
const POPULAR_BANKS = [
  {
    id: "1",
    name: "Access Bank",
    code: "044",
    logoUrl: "https://logo.clearbit.com/accessbankplc.com",
  },
  {
    id: "2",
    name: "GTBank",
    code: "058",
    logoUrl: "https://logo.clearbit.com/gtbank.com",
  },
  {
    id: "3",
    name: "Zenith Bank",
    code: "057",
    logoUrl: "https://logo.clearbit.com/zenithbank.com",
  },
  {
    id: "4",
    name: "UBA",
    code: "033",
    logoUrl: "https://logo.clearbit.com/ubagroup.com",
  },
  {
    id: "5",
    name: "Kuda Bank",
    code: "096",
    logoUrl: "https://logo.clearbit.com/kudabank.com",
  },
];

export default function LinkBankScreen() {
  const router = useRouter();
  const { theme } = useAppStore();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const filteredBanks = POPULAR_BANKS.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleConnectBank = async () => {
    if (!selectedBank) return;
    setIsConnecting(true);
    try {
      setTimeout(() => {
        setIsConnecting(false);
        alert("Bank connected successfully!");
        router.back();
      }, 2500);
    } catch (error) {
      setIsConnecting(false);
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Link Bank Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Info Card */}
        <View style={styles.infoCard}>
          <Ionicons
            name="shield-checkmark"
            size={24}
            color={theme.accent}
            style={styles.infoIcon}
          />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Secure Connection</Text>
            <Text style={styles.infoSubtitle}>
              We use bank-grade 256-bit encryption. Your credentials are never
              stored and remain completely private.
            </Text>
          </View>
        </View>

        {/* Search Input */}
        <Text style={styles.sectionLabel}>Search your bank</Text>
        <View style={styles.searchBarContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="e.g. GTBank, Access Bank..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Bank List */}
        <Text style={styles.sectionLabel}>Popular Banks</Text>
        <View style={styles.bankGrid}>
          {filteredBanks.map((bank) => {
            const isSelected = selectedBank === bank.id;
            return (
              <TouchableOpacity
                key={bank.id}
                style={[styles.bankCard, isSelected && styles.bankCardSelected]}
                onPress={() => setSelectedBank(bank.id)}
              >
                {/* Logo Wrapper containing the live Image instead of Ionicons */}
                <View style={styles.iconWrapper}>
                  <Image
                    source={{ uri: bank.logoUrl }}
                    style={styles.bankLogoImage}
                    resizeMode="contain"
                  />
                </View>

                <Text
                  style={[
                    styles.bankName,
                    isSelected && styles.bankNameSelected,
                  ]}
                >
                  {bank.name}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={theme.accent}
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            !selectedBank && styles.submitButtonDisabled,
          ]}
          disabled={!selectedBank || isConnecting}
          onPress={handleConnectBank}
        >
          {isConnecting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {selectedBank
                ? "Link Selected Account"
                : "Choose a Bank to Continue"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: theme.accentSoft,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.textPrimary,
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  searchBarContainer: {
    flexDirection: "row",
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 24,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.textPrimary,
  },
  bankGrid: {
    gap: 12,
  },
  bankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  bankCardSelected: {
    borderColor: theme.accent,
    backgroundColor: theme.accentSoft,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.surfaceSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    overflow: "hidden",
  },
  bankLogoImage: {
    width: 30,
    height: 30,
    borderRadius: 4,
  },
  bankName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.textPrimary,
    flex: 1,
  },
  bankNameSelected: {
    color: theme.accent,
  },
  checkIcon: {
    marginLeft: 8,
  },
  footer: {
    backgroundColor: theme.surface,
    padding: 16,
    borderTopWidth: 1,
    borderColor: theme.border,
  },
  submitButton: {
    backgroundColor: theme.accent,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: theme.border,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
