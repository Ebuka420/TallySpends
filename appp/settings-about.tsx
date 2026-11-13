import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useAppStore } from "../src/store";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import DynamicLogo from "../components/DynamicLogo";

export default function SettingsAboutScreen() {
  const router = useRouter();
  const { theme } = useAppStore();
  const styles = React.useMemo(() => getStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.heroCard}>
        <DynamicLogo size={46} style={{ marginRight: 12 }} />
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>TallySpends</Text>
          <Text style={styles.heroSubtitle}>
            A calm, practical way to understand your spending and build better
            habits.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>App version</Text>
        <Text style={styles.cardValue}>1.0.0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Built for</Text>
        <Text style={styles.cardValue}>
          Smarter budgeting and mindful savings
        </Text>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: "700", color: theme.textPrimary },
    headerSpacer: { width: 32 },
    heroCard: {
      flexDirection: "row",
      backgroundColor: theme.surface,
      borderRadius: 18,
      padding: 16,
      marginHorizontal: 20,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    heroIconCircle: {
      width: 46,
      height: 46,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    heroTextWrap: { flex: 1 },
    heroTitle: { fontSize: 15, fontWeight: "700", color: theme.textPrimary, marginBottom: 4 },
    heroSubtitle: { fontSize: 12.5, color: theme.textSecondary, lineHeight: 18 },
    card: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardTitle: { fontSize: 14, fontWeight: "600", color: theme.textPrimary, marginBottom: 4 },
    cardValue: { fontSize: 13.5, color: theme.textSecondary },
  });
