import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    LayoutAnimation,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";

// Enable smooth layout animations for Android devices
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function CustomerServiceScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: "I don't recognize this charge, can I dispute it?",
      answer:
        "Yes, you can dispute unauthorized transactions. To begin, tap on the specific charge within your Transaction History card on the dashboard and select 'Dispute This Transaction'. Our compliance team will freeze the card context and review it within 3-5 business days.",
    },
    {
      id: 2,
      question:
        "Why isn't a transaction I made today showing up in my history?",
      answer:
        "Most merchant terminals process transactions instantly, but some financial institutions delay data syncs by up to 2-4 hours. Try pulling down on the main dashboard to force-refresh your connection. If it remains missing after 24 hours, contact transaction support.",
    },
    {
      id: 3,
      question: "How do I update my profile details or link a new card?",
      answer:
        "Tap on your Profile avatar icon located at the top-left corner of the dashboard header. From there, select 'Payment Profiles' to add, remove, or modify your connected debit cards and personal profile demographics instantly.",
    },
    {
      id: 4,
      question: "How do I reset or change my monthly budget goals?",
      answer:
        "Navigate to the Budget tab from your footer navigation bar, or click the arrow on the 'Goals Progress' card. Select the active monthly budget frame, tap 'Modify Target', and update your preferred category caps.",
    },
    {
      id: 5,
      question: "How do I hide or show my balance on the home screen?",
      answer:
        "Your privacy is protected natively. On the main dashboard, simply tap the eye icon next to the 'Total Balance' header label to obscure your financial metrics with masking markers instantly.",
    },
  ];

  const toggleAccordion = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- HEADER BACK ACTION --- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#2D232E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Center</Text>
        <View style={styles.placeholderBox} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Message Banner */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>How can we help you today?</Text>
          <Text style={styles.introSubtitle}>
            Browse our top frequently asked questions below. If your issue isn&apos;t
            covered, scroll down to connect with an agent.
          </Text>
        </View>

        {/* --- FAQ ACCORDION LIST --- */}
        <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>
        {faqs.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <View
              key={item.id}
              style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}
            >
              <TouchableOpacity
                style={styles.faqHeaderTrigger}
                onPress={() => toggleAccordion(item.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.faqQuestionText,
                    isExpanded && styles.faqQuestionTextActive,
                  ]}
                >
                  {item.question}
                </Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={isExpanded ? "#6442E5" : "#534B52"}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.faqAnswerContentBlock}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.faqAnswerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Live Support Trigger Footer Option */}
        <View style={styles.contactCard}>
          <Ionicons name="chatbubbles-outline" size={24} color="#4B2C40" />
          <View style={styles.contactTextContainer}>
            <Text style={styles.contactTitle}>Still need assistance?</Text>
            <Text style={styles.contactSubtitle}>
              Our support personnel are online 24/7.
            </Text>
          </View>
          <TouchableOpacity style={styles.chatButton} activeOpacity={0.8}>
            <Text style={styles.chatButtonText}>Chat Now</Text>
          </TouchableOpacity>
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
    paddingBottom: 40,
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
  introCard: {
    backgroundColor: "#2D232E",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  introSubtitle: {
    fontSize: 12,
    color: "#D5D8DC",
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D232E",
    marginBottom: 12,
    paddingLeft: 2,
  },
  faqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    marginBottom: 10,
    overflow: "hidden",
  },
  faqCardExpanded: {
    borderColor: "#6442E5",
  },
  faqHeaderTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  faqQuestionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2D232E",
    flex: 1,
    paddingRight: 12,
    lineHeight: 18,
  },
  faqQuestionTextActive: {
    color: "#6442E5",
    fontWeight: "700",
  },
  faqAnswerContentBlock: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#F0F0F2",
    marginBottom: 12,
  },
  faqAnswerText: {
    fontSize: 12,
    color: "#534B52",
    lineHeight: 18,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    padding: 16,
    marginTop: 20,
  },
  contactTextContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D232E",
  },
  contactSubtitle: {
    fontSize: 11,
    color: "#534B52",
    marginTop: 2,
  },
  chatButton: {
    backgroundColor: "#4B2C40",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chatButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
