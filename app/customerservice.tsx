import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

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
  category: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "support";
  text: string;
  time: string;
}

export default function CustomerServiceScreen() {
  const router = useRouter();
  const { themePreference, themeMode, username } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "support",
      text: `Hello ${username || "there"}! Welcome to TallySpends 24/7 Priority Support. How can our customer care team assist you today?`,
      time: "Just now",
    },
  ]);

  const faqs: FAQItem[] = [
    {
      id: 1,
      category: "Disputes",
      question: "I don't recognize this charge, can I dispute it?",
      answer:
        "Yes, you can dispute unauthorized transactions. Tap on the charge in Transaction History or select 'Dispute A Charge' below. Our compliance team freezes the context and reviews it within 3-5 business days.",
    },
    {
      id: 2,
      category: "Sync",
      question: "Why isn't a transaction made today showing up in my history?",
      answer:
        "Most merchant terminals process transactions instantly, but some banks delay data feeds by up to 2-4 hours. Pull down on the dashboard to force-refresh. If still missing after 24 hours, chat with us below.",
    },
    {
      id: 3,
      category: "Cards",
      question: "How do I update card details or link a new card?",
      answer:
        "Go to the Cards section from your dashboard quick actions or Profile. Select 'Link New Card' to add Mastercard, Visa, or Verve cards with instant activation.",
    },
    {
      id: 4,
      category: "Budget",
      question: "How do I modify or reset my monthly category budget limits?",
      answer:
        "Navigate to the Budget tab from the bottom bar. Select any category card, enter your target limit, and save. Your daily safe-to-spend allowance updates immediately.",
    },
    {
      id: 5,
      category: "Privacy",
      question: "How do I hide or show my balance on the home screen?",
      answer:
        "On the main dashboard, tap the eye icon or tap directly on the balance numbers to toggle masking markers for full financial privacy.",
    },
  ];

  const toggleAccordion = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleOpenChatWithPrompt = (promptText?: string) => {
    setShowChatModal(true);
    if (promptText) {
      handleSendMessage(promptText);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput("");

    setIsTyping(true);

    // Simulate smart support response
    setTimeout(() => {
      let reply = "Thank you for reaching out. We have logged this query and our payment support specialist is reviewing your account state.";
      const lower = text.toLowerCase();
      if (lower.includes("dispute") || lower.includes("charge") || lower.includes("unrecognized")) {
        reply = "We take unrecognized charges very seriously. You can freeze your card under 'Linked Cards' immediately, and we have opened a priority ticket for our investigations team.";
      } else if (lower.includes("card") || lower.includes("link")) {
        reply = "To manage or link cards, head over to the Linked Cards screen from your Dashboard. All Nigerian debit and virtual cards are supported.";
      } else if (lower.includes("budget") || lower.includes("limit")) {
        reply = "You can customize your spending limits anytime in the Budget tab. Your daily allowance will recalculate automatically!";
      } else if (lower.includes("qr") || lower.includes("transfer") || lower.includes("receive")) {
        reply = "You can generate custom QR payment requests or split bills with friends from the QR code icon in the top header.";
      }

      const supportMsg: ChatMessage = {
        id: `supp-${Date.now()}`,
        sender: "support",
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, supportMsg]);
      setIsTyping(false);
    }, 1200);
  };

  useEffect(() => {
    if (showChatModal) {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, showChatModal, isTyping]);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Customer Support & Help
        </Text>
        <TouchableOpacity
          onPress={() => handleOpenChatWithPrompt()}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Message Banner */}
        <View style={styles.introCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <View style={styles.introIconCircle}>
              <Ionicons name="headset" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.introTitle}>How can we help you?</Text>
              <Text style={styles.introStatusText}>● Support Agents Online 24/7</Text>
            </View>
          </View>
          <Text style={styles.introSubtitle}>
            Find instant solutions to common issues below, or start a live priority chat with our team.
          </Text>
        </View>

        {/* Quick Resolution Pills */}
        <Text style={styles.sectionHeading}>Quick Assistance</Text>
        <View style={styles.quickAssistRow}>
          <TouchableOpacity
            style={[styles.quickAssistChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => handleOpenChatWithPrompt("I need to dispute a transaction.")}
            activeOpacity={0.75}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.accent} />
            <Text style={[styles.quickAssistChipText, { color: theme.textPrimary }]}>Dispute Charge</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAssistChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => handleOpenChatWithPrompt("How do I link a new card or bank account?")}
            activeOpacity={0.75}
          >
            <Ionicons name="card-outline" size={16} color={theme.accent} />
            <Text style={[styles.quickAssistChipText, { color: theme.textPrimary }]}>Card Help</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAssistChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => handleOpenChatWithPrompt("I have a question about budget limits and savings.")}
            activeOpacity={0.75}
          >
            <Ionicons name="pie-chart-outline" size={16} color={theme.accent} />
            <Text style={[styles.quickAssistChipText, { color: theme.textPrimary }]}>Budget Inquiries</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ ACCORDION LIST */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Frequently Asked Questions</Text>
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
                  color={isExpanded ? theme.accent : theme.textSecondary}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.faqAnswerContentBlock}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  <TouchableOpacity
                    style={styles.faqAskMoreBtn}
                    onPress={() => handleOpenChatWithPrompt(item.question)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chatbubbles-outline" size={14} color={theme.accent} />
                    <Text style={[styles.faqAskMoreText, { color: theme.accent }]}>
                      Ask support about this
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {/* Live Support Trigger Footer Option */}
        <View style={styles.contactCard}>
          <Ionicons name="chatbubbles" size={26} color={theme.accent} />
          <View style={styles.contactTextContainer}>
            <Text style={styles.contactTitle}>Still need assistance?</Text>
            <Text style={styles.contactSubtitle}>
              Our financial support specialists are available around the clock.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleOpenChatWithPrompt()}
            activeOpacity={0.8}
          >
            <Text style={styles.chatButtonText}>Chat Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* LIVE CHAT MODAL */}
      <Modal visible={showChatModal} animationType="slide" transparent>
        <SafeAreaView style={styles.chatModalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.chatModalContainer, { backgroundColor: theme.background }]}
          >
            {/* Chat Modal Header */}
            <View style={[styles.chatModalHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={styles.agentAvatar}>
                  <Ionicons name="headset" size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.agentName, { color: theme.textPrimary }]}>TallySpends Care</Text>
                  <Text style={styles.agentOnlineStatus}>Active • Instant Replies</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowChatModal(false)}
                style={styles.chatCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatMessagesArea}
              contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((m) => {
                const isUser = m.sender === "user";
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.messageBubbleWrapper,
                      isUser ? styles.msgWrapperUser : styles.msgWrapperSupport,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isUser
                          ? [styles.userBubble, { backgroundColor: theme.accent }]
                          : [styles.supportBubble, { backgroundColor: theme.surface, borderColor: theme.border }],
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          { color: isUser ? "#FFFFFF" : theme.textPrimary },
                        ]}
                      >
                        {m.text}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          { color: isUser ? "rgba(255,255,255,0.7)" : theme.textSecondary },
                        ]}
                      >
                        {m.time}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {isTyping && (
                <View style={[styles.typingBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.typingText, { color: theme.textSecondary }]}>Support is typing...</Text>
                </View>
              )}
            </ScrollView>

            {/* Chat Input Bar */}
            <View style={[styles.chatInputBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput
                style={[
                  styles.chatTextInput,
                  {
                    backgroundColor: theme.surfaceSoft,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Type your message..."
                placeholderTextColor={theme.textSecondary}
                onSubmitEditing={() => handleSendMessage()}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: theme.accent }]}
                onPress={() => handleSendMessage()}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
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
    },
    introCard: {
      backgroundColor: theme.accent,
      borderRadius: 18,
      padding: 18,
      marginTop: 16,
      marginBottom: 20,
    },
    introIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    introTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    introStatusText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#86EFAC",
      marginTop: 2,
    },
    introSubtitle: {
      fontSize: 12,
      color: "rgba(255,255,255,0.85)",
      lineHeight: 18,
    },
    sectionHeading: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 10,
      paddingLeft: 2,
    },
    quickAssistRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    quickAssistChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 12,
      borderWidth: 1,
    },
    quickAssistChipText: {
      fontSize: 11,
      fontWeight: "700",
    },
    faqCard: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 10,
      overflow: "hidden",
    },
    faqCardExpanded: {
      borderColor: theme.accent,
    },
    faqHeaderTrigger: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    faqQuestionText: {
      fontSize: 13.5,
      fontWeight: "600",
      color: theme.textPrimary,
      flex: 1,
      paddingRight: 12,
      lineHeight: 19,
    },
    faqQuestionTextActive: {
      color: theme.accent,
      fontWeight: "700",
    },
    faqAnswerContentBlock: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    dividerLine: {
      height: 1,
      backgroundColor: theme.border,
      marginBottom: 12,
    },
    faqAnswerText: {
      fontSize: 12.5,
      color: theme.textSecondary,
      lineHeight: 19,
    },
    faqAskMoreBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 10,
    },
    faqAskMoreText: {
      fontSize: 11.5,
      fontWeight: "700",
    },
    contactCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginTop: 18,
    },
    contactTextContainer: {
      flex: 1,
      paddingHorizontal: 12,
    },
    contactTitle: {
      fontSize: 13.5,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    contactSubtitle: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
      lineHeight: 16,
    },
    chatButton: {
      backgroundColor: theme.accent,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
    },
    chatButtonText: {
      fontSize: 12,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    chatModalOverlay: {
      flex: 1,
      backgroundColor: "#000000",
    },
    chatModalContainer: {
      flex: 1,
    },
    chatModalHeader: {
      height: 64,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      borderBottomWidth: 1,
    },
    agentAvatar: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: theme.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    agentName: {
      fontSize: 15,
      fontWeight: "800",
    },
    agentOnlineStatus: {
      fontSize: 10.5,
      fontWeight: "600",
      color: "#22C55E",
      marginTop: 1,
    },
    chatCloseBtn: {
      padding: 6,
    },
    chatMessagesArea: {
      flex: 1,
    },
    messageBubbleWrapper: {
      flexDirection: "row",
      width: "100%",
    },
    msgWrapperUser: {
      justifyContent: "flex-end",
    },
    msgWrapperSupport: {
      justifyContent: "flex-start",
    },
    messageBubble: {
      maxWidth: "80%",
      padding: 12,
      borderRadius: 16,
    },
    userBubble: {
      borderBottomRightRadius: 4,
    },
    supportBubble: {
      borderWidth: 1,
      borderBottomLeftRadius: 4,
    },
    messageText: {
      fontSize: 13,
      lineHeight: 19,
    },
    messageTime: {
      fontSize: 9.5,
      marginTop: 4,
      alignSelf: "flex-end",
    },
    typingBubble: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      alignSelf: "flex-start",
    },
    typingText: {
      fontSize: 11,
      fontStyle: "italic",
    },
    chatInputBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      gap: 8,
    },
    chatTextInput: {
      flex: 1,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      paddingHorizontal: 16,
      fontSize: 13.5,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
  });

