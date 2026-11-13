import { useThemeTokens } from "../src/ThemeExperience";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Alert,
  Linking,
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
import type { ScrollViewInstance } from "react-native";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";
import { careGreeting, careReply, helpTopics, supportEmail, supportMailUrl } from "../src/support/care";

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
  const theme = useThemeTokens();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef<ScrollViewInstance | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "support",
      text: careGreeting,
      time: "Just now",
    },
  ]);

  const faqs: FAQItem[] = helpTopics;
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousTopic = useRef<string | null>(null);
  const replyLock = useRef(false);
  const emailLock = useRef(false);
  useEffect(() => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    replyLock.current = false; previousTopic.current = null; setIsTyping(false);
    setMessages([{ id: "care-greeting", sender: "support", text: careGreeting, time: "Just now" }]);
    setChatInput("");
    return () => { if (replyTimer.current) clearTimeout(replyTimer.current); };
  }, [username]);
  const handleEmailSupport = async () => {
    if (emailLock.current) return;
    emailLock.current = true;
    try { await Linking.openURL(supportMailUrl()); }
    catch { Alert.alert("Email Support", `An email app couldn't be opened. Contact ${supportEmail} from your preferred email app. No email has been sent.`); }
    finally { emailLock.current = false; }
  };
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
    if (!text || replyLock.current) return;
    replyLock.current = true;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput("");

    setIsTyping(true);

    replyTimer.current = setTimeout(() => {
      const result = careReply(text, previousTopic.current);
      previousTopic.current = result.topic;
      const reply = result.text;
      const supportMsg: ChatMessage = {
        id: `supp-${Date.now()}`,
        sender: "support",
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, supportMsg]);
      setIsTyping(false);
      replyLock.current = false; replyTimer.current = null;
    }, 250);
  };

  useEffect(() => {
    if (showChatModal) {
      const timer = setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
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
        <View style={{ width: 22 }} />
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
              <Text style={styles.introStatusText}>Automated help assistant</Text>
            </View>
          </View>
          <Text style={styles.introSubtitle}>
            Find guidance for common issues below, or email support for account-specific help.
          </Text>
        </View>

        {/* Quick Assistance Tiles */}
        <Text style={styles.sectionHeading}>Quick Assistance</Text>
        <View style={styles.quickAssistRow}>
          <TouchableOpacity
            style={[styles.quickAssistChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => handleOpenChatWithPrompt("I need to dispute a transaction.")}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Get help with an unrecognized charge"
          >
            <View style={styles.quickAssistIcon}>
              <Ionicons name="shield-checkmark-outline" size={21} color={theme.accent} />
            </View>
            <Text style={[styles.quickAssistChipText, { color: theme.textPrimary }]}>Dispute Charge</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAssistChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => handleOpenChatWithPrompt("How do I link a new card or bank account?")}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Get help with linked cards and bank accounts"
          >
            <View style={styles.quickAssistIcon}>
              <Ionicons name="card-outline" size={21} color={theme.accent} />
            </View>
            <Text style={[styles.quickAssistChipText, { color: theme.textPrimary }]}>Card Help</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAssistChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => handleOpenChatWithPrompt("I have a question about budget limits and savings.")}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Get help with budget limits"
          >
            <View style={styles.quickAssistIcon}>
              <Ionicons name="pie-chart-outline" size={21} color={theme.accent} />
            </View>
            <Text style={[styles.quickAssistChipText, { color: theme.textPrimary }]}>Budget Help</Text>
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
                      Ask Care about this
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
              Try automated help or contact us by email.
            </Text>
            <TouchableOpacity onPress={handleEmailSupport} accessibilityRole="button" style={styles.faqAskMoreBtn}>
              <Ionicons name="mail-outline" size={14} color={theme.accent} />
              <Text style={[styles.faqAskMoreText, { color: theme.accent }]}>Email Support</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleOpenChatWithPrompt()}
            activeOpacity={0.8}
          >
            <Text style={styles.chatButtonText}>Ask Care</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* LIVE CHAT MODAL */}
      <Modal visible={showChatModal} animationType="slide" transparent onRequestClose={() => setShowChatModal(false)}>
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
                  <Text style={styles.agentOnlineStatus}>Automated help • No account access</Text>
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

            <TouchableOpacity onPress={handleEmailSupport} accessibilityRole="button" style={[styles.faqAskMoreBtn, { marginHorizontal: 16 }]}>
              <Ionicons name="mail-outline" size={14} color={theme.accent} />
              <Text style={[styles.faqAskMoreText, { color: theme.accent }]}>Email Support</Text>
            </TouchableOpacity>

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
                  <Text style={[styles.typingText, { color: theme.textSecondary }]}>Care is preparing a reply...</Text>
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
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: theme.accent }]}
                onPress={() => handleSendMessage()}
                disabled={isTyping}
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
      minWidth: 0,
      minHeight: 112,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderRadius: 18,
      borderWidth: 1,
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    quickAssistIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    quickAssistChipText: {
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "600",
      textAlign: "center",
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


