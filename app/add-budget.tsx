import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function AddBudgetScreen() {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState("Food & Dining");
  const [amount, setAmount] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("Weekly");
  const [selectedColor, setSelectedColor] = useState("#20142A");

  const categories = [
    { name: "Food & Dining", icon: "fast-food-outline" },
    { name: "Transport", icon: "car-outline" },
    { name: "Shopping", icon: "bag-handle-outline" },
    { name: "Bills & Utilities", icon: "document-text-outline" },
    { name: "Entertainment", icon: "help-outline" },
    { name: "Health & Fitness", icon: "heart-outline" },
    { name: "Education", icon: "school-outline" },
    { name: "Custom", icon: "add-circle-outline" },
  ];

  const periods = ["Weekly", "Monthly", "Yearly", "Custom"];
  const colorOptions = [
    "#20142A",
    "#16A34A",
    "#2563EB",
    "#D97706",
    "#DB2777",
    "#0D9488",
    "#6B7280",
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerTop}>
          <View style={styles.headerLeftContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#20142A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Add Budget</Text>
              <Text style={styles.headerSubtitle}>
                Create a new budget to track your spending
              </Text>
            </View>
          </View>
          <View style={styles.headerImageContainer}>
            <Image
              source={require("../assets/images/ajo-removebg-preview.png")}
              style={styles.headerImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* 1. Choose a Category */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitleNumber}>1. Choose a Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryCard,
                    isSelected && styles.categoryCardSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  {isSelected && (
                    <View style={styles.categoryCheckBadge}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                  <View style={styles.categoryIconBox}>
                    <Ionicons
                      name={cat.icon as any}
                      size={20}
                      color={isSelected ? "#20142A" : "#474448"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Budget Amount */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitleNumber}>2. Budget Amount</Text>
          <View style={styles.amountInputContainer}>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencySymbol}>₦</Text>
            </View>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
          <Text style={styles.inputHint}>How much do you want to spend?</Text>
        </View>

        {/* 3. Budget Period */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitleNumber}>3. Budget Period</Text>
          <Text style={styles.sectionSublabel}>
            How often should this budget reset?
          </Text>
          <View style={styles.periodsRow}>
            {periods.map((period) => {
              const isSelected = selectedPeriod === period;
              return (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    isSelected && styles.periodButtonSelected,
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color={isSelected ? "#FFFFFF" : "#534B52"}
                  />
                  <Text
                    style={[
                      styles.periodButtonText,
                      isSelected && styles.periodButtonTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Choose a Color */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitleNumber}>
            4. Choose a Color{" "}
            <Text style={styles.optionalText}>(Optional)</Text>
          </Text>
          <View style={styles.colorsRow}>
            {colorOptions.map((color) => {
              const isSelected = selectedColor === color;
              return (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorCircle, { backgroundColor: color }]}
                  onPress={() => setSelectedColor(color)}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Budget Tip Card */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconBox}>
            <Ionicons name="bulb-outline" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Budget Tip</Text>
            <Text style={styles.tipDescription}>
              Be realistic! Choose an amount you can stick to consistently.
            </Text>
          </View>
        </View>

        {/* Save Budget Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => {
            router.back();
          }}
        >
          <Ionicons name="save-outline" size={16} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Budget</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#20142A",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#534B52",
    marginTop: 2,
  },
  headerImageContainer: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  headerImage: {
    width: 65,
    height: 65,
  },
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  sectionTitleNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#20142A",
    marginBottom: 14,
  },
  sectionSublabel: {
    fontSize: 12,
    color: "#534B52",
    marginBottom: 12,
  },
  optionalText: {
    fontWeight: "400",
    color: "#534B52",
    fontSize: 12,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  categoryCard: {
    width: "23%",
    aspectRatio: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    position: "relative",
  },
  categoryCardSelected: {
    backgroundColor: "#F3EBF9",
    borderColor: "#20142A",
  },
  categoryCheckBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#20142A",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryIconBox: {
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#474448",
    textAlign: "center",
  },
  categoryTextSelected: {
    color: "#20142A",
    fontWeight: "700",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    height: 56,
  },
  currencyBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#20142A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  currencySymbol: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#20142A",
  },
  inputHint: {
    fontSize: 11,
    color: "#534B52",
    marginTop: 8,
    marginLeft: 4,
  },
  periodsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  periodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    gap: 4,
  },
  periodButtonSelected: {
    backgroundColor: "#20142A",
    borderColor: "#20142A",
  },
  periodButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#534B52",
  },
  periodButtonTextSelected: {
    color: "#FFFFFF",
  },
  colorsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  tipCard: {
    backgroundColor: "#F3EBF9",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  tipIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#20142A",
    justifyContent: "center",
    alignItems: "center",
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#20142A",
    marginBottom: 2,
  },
  tipDescription: {
    fontSize: 11,
    color: "#474448",
    lineHeight: 15,
  },
  saveButton: {
    backgroundColor: "#20142A",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
    shadowColor: "#20142A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
