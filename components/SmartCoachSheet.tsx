import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ThemePalette } from "../src/theme";
import { CoachRequestError, requestCoachReply } from "../src/coach/chat";
type Message = {
  id: string;
  sender: "user" | "coach";
  text: string;
};
const prompts = [{
  icon: "pie-chart-outline",
  title: "Plan my budget",
  text: "How can I build a budget I can stick to?"
}, {
  icon: "wallet-outline",
  title: "Build a saving habit",
  text: "Help me make a simple savings plan."
}, {
  icon: "receipt-outline",
  title: "Spend more mindfully",
  text: "How can I cut back on everyday spending?"
}, {
  icon: "compass-outline",
  title: "Find my next step",
  text: "Where should I start with managing my money?"
}] as const;
export function SmartCoachSheet({
  visible,
  onClose,
  theme,
  dark
}: {
  visible: boolean;
  onClose: () => void;
  theme: ThemePalette;
  dark: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<{
    question: string;
    message: string;
  } | null>(null);
  const locked = useRef(false);
  const request = useRef<AbortController | null>(null);
  const feed = useRef<ScrollView>(null);
  const composer = useRef<TextInput>(null);
  const followLatest = useRef(true);
  const onAccent = dark ? theme.background : "#FFFFFF";
  useEffect(() => () => {
    request.current?.abort();
  }, []);
  const send = async (retry?: string) => {
    const question = (retry ?? input).trim();
    if (!question || locked.current) return;
    locked.current = true;
    setBusy(true);
    setFailure(null);
    followLatest.current = true;
    if (!retry) {
      setMessages(previous => [...previous, {
        id: `user-${Date.now()}`,
        sender: "user",
        text: question
      }]);
      setInput("");
    }
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const token = await AsyncStorage.getItem("ts_access_token");
      const answer = await requestCoachReply(question, token, controller.signal);
      setMessages(previous => [...previous, {
        id: `coach-${Date.now()}`,
        sender: "coach",
        text: answer
      }]);
      Haptics.selectionAsync().catch(() => {});
    } catch (error) {
      setFailure({
        question,
        message: controller.signal.aborted ? "That reply took too long. Your question is saved here—try again when you're ready." : error instanceof CoachRequestError ? error.message : "Couldn't connect. Check your connection and try again."
      });
    } finally {
      clearTimeout(timeout);
      request.current = null;
      locked.current = false;
      setBusy(false);
    }
  };
  const starter = (text: string) => {
    setInput(text);
    composer.current?.focus();
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={s.overlay}>
      <Pressable accessibilityLabel="Close Smart Coach" onPress={onClose} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[s.keyboard, {
        paddingTop: insets.top + 10
      }]} pointerEvents="box-none">
        <View accessibilityViewIsModal style={[s.sheet, {
          backgroundColor: theme.background,
          paddingBottom: Math.max(12, insets.bottom)
        }]}>
          <View style={[s.handle, {
            backgroundColor: theme.border
          }]} />
          <View style={[s.header, {
            borderColor: theme.border
          }]}>
            <View style={[s.avatar, {
              backgroundColor: theme.accentSoft
            }]}><Ionicons name="sparkles" size={23} color={theme.accent} /></View>
            <View style={{
              flex: 1
            }}><Text style={[s.title, {
                color: theme.textPrimary
              }]}>Smart Coach</Text><Text style={[s.subtitle, {
                color: theme.textSecondary
              }]}>A little clarity for your money</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close Smart Coach" onPress={onClose} style={[s.close, {
              backgroundColor: theme.surfaceSoft
            }]}><Ionicons name="close" size={21} color={theme.textPrimary} /></Pressable>
          </View>
          <ScrollView ref={feed} style={{
            flex: 1
          }} contentContainerStyle={s.feed} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" onScroll={({
            nativeEvent: e
          }) => {
            followLatest.current = e.contentOffset.y + e.layoutMeasurement.height >= e.contentSize.height - 100;
          }} scrollEventThrottle={100} onContentSizeChange={() => {
            if (messages.length && followLatest.current) feed.current?.scrollToEnd({
              animated: true
            });
          }}>
            {!messages.length ? <>
              <View style={s.welcome}>
                <View style={[s.welcomeIcon, {
                  backgroundColor: theme.accentSoft
                }]}><Ionicons name="sparkles-outline" size={34} color={theme.accent} /></View>
                <Text style={[s.eyebrow, {
                  color: theme.accent
                }]}>YOUR MONEY, A LITTLE CLEARER</Text>
                <Text style={[s.hero, {
                  color: theme.textPrimary
                }]}>Let's figure it out,{"\n"}one step at a time.</Text>
                <Text style={[s.intro, {
                  color: theme.textSecondary
                }]}>Talk through a budget, build a saving habit,{"\n"}or start with what's on your mind.</Text>
              </View>
              <Text style={[s.promptLabel, {
                color: theme.textSecondary
              }]}>A GOOD PLACE TO START</Text>
              <View style={s.prompts}>{prompts.map(prompt => <Pressable key={prompt.title} accessibilityRole="button" accessibilityLabel={prompt.title} onPress={() => starter(prompt.text)} style={({
                  pressed
                }) => [s.prompt, {
                  backgroundColor: pressed ? theme.accentSoft : theme.surface,
                  borderColor: theme.border
                }]}>
                <Ionicons name={prompt.icon} size={22} color={theme.accent} /><Text style={[s.promptTitle, {
                    color: theme.textPrimary
                  }]}>{prompt.title}</Text><Ionicons name="arrow-up-outline" size={16} color={theme.accentSecondary} style={{
                    alignSelf: "flex-end",
                    transform: [{
                      rotate: "45deg"
                    }]
                  }} />
              </Pressable>)}</View>
            </> : <>
              <Text style={[s.conversationLabel, {
                color: theme.textSecondary
              }]}>YOUR CONVERSATION</Text>
              {messages.map(message => message.sender === "user" ? <View key={message.id} style={[s.userMessage, {
                backgroundColor: theme.accent
              }]}><Text selectable style={[s.messageText, {
                  color: onAccent
                }]}>{message.text}</Text></View> : <View key={message.id} style={s.coachMessage}>
                <View style={s.coachLabel}><Ionicons name="sparkles" size={13} color={theme.accent} /><Text style={{
                    color: theme.accent,
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: .8
                  }}>SMART COACH</Text></View>
                <Text selectable style={[s.messageText, {
                  color: theme.textPrimary
                }]}>{message.text}</Text>
              </View>)}
            </>}
            {busy && <View accessibilityLiveRegion="polite" style={[s.thinking, {
              backgroundColor: theme.surfaceSoft
            }]}><ActivityIndicator size="small" color={theme.accent} /><Text style={{
                color: theme.textSecondary,
                fontSize: 12
              }}>Thinking it through…</Text></View>}
            {failure && <View accessibilityLiveRegion="polite" style={[s.error, {
              backgroundColor: theme.surface,
              borderColor: theme.border
            }]}><Ionicons name="cloud-offline-outline" size={22} color={theme.textSecondary} /><Text style={{
                color: theme.textSecondary,
                flex: 1,
                fontSize: 12,
                lineHeight: 19
              }}>{failure.message}</Text><Pressable accessibilityRole="button" accessibilityLabel="Retry last question" onPress={() => send(failure.question)} style={{
                padding: 8
              }}><Text style={{
                  color: theme.accent,
                  fontWeight: "700",
                  fontSize: 12
                }}>Retry</Text></Pressable></View>}
          </ScrollView>
          <View style={[s.composerArea, {
            borderColor: theme.border
          }]}>
            {!!messages.length && <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{
              gap: 7,
              paddingBottom: 10
            }}>{["Make it simpler", "Give me an example", "What should I do first?"].map(text => <Pressable key={text} accessibilityRole="button" onPress={() => starter(text)} style={[s.followup, {
                backgroundColor: theme.surfaceSoft
              }]}><Text style={{
                  color: theme.textSecondary,
                  fontSize: 11
                }}>{text}</Text></Pressable>)}</ScrollView>}
            <View style={[s.composer, {
              backgroundColor: theme.surface,
              borderColor: theme.border
            }]}>
              <TextInput ref={composer} accessibilityLabel="Message Smart Coach" placeholder="What's on your mind?" placeholderTextColor={theme.textSecondary} value={input} onChangeText={setInput} multiline maxLength={2000} style={[s.input, {
                color: theme.textPrimary
              }]} />
              <Pressable accessibilityRole="button" accessibilityLabel="Send message" accessibilityState={{
                disabled: busy || !input.trim()
              }} disabled={busy || !input.trim()} onPress={() => send()} style={[s.send, {
                backgroundColor: theme.accent,
                opacity: busy || !input.trim() ? .4 : 1
              }]}><Ionicons name="arrow-up" size={22} color={onAccent} /></Pressable>
            </View>
            <Text style={[s.note, {
              color: theme.textSecondary
            }]}>Your space for everyday money questions.</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  </Modal>;
}
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(12,8,17,.48)"
  },
  keyboard: {
    flex: 1,
    justifyContent: "flex-end"
  },
  sheet: {
    height: "94%",
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden"
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 4,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 10
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 17,
    borderBottomWidth: 1
  },
  avatar: {
    width: 46,
    height: 46,
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
    marginTop: 4
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  feed: {
    padding: 22,
    paddingBottom: 24,
    gap: 18
  },
  welcome: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8
  },
  welcomeIcon: {
    height: 76,
    width: 76,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 23
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5
  },
  hero: {
    fontSize: 28,
    lineHeight: 35,
    letterSpacing: -.8,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12
  },
  intro: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 13
  },
  promptLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 10
  },
  prompts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  prompt: {
    width: "48%",
    flexGrow: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
    gap: 12
  },
  promptTitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600"
  },
  conversationLabel: {
    fontSize: 9,
    letterSpacing: 1,
    textAlign: "center",
    paddingVertical: 6
  },
  userMessage: {
    alignSelf: "flex-end",
    maxWidth: "88%",
    borderRadius: 21,
    borderBottomRightRadius: 6,
    paddingVertical: 13,
    paddingHorizontal: 17
  },
  coachMessage: {
    alignSelf: "flex-start",
    width: "94%",
    gap: 10,
    paddingVertical: 5
  },
  coachLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  messageText: {
    fontSize: 14,
    lineHeight: 23
  },
  thinking: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 18
  },
  error: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12
  },
  composerArea: {
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderWidth: 1,
    borderRadius: 25,
    padding: 7,
    paddingLeft: 16
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 114,
    fontSize: 14,
    lineHeight: 21,
    paddingVertical: 10
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  followup: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  note: {
    fontSize: 9,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 14
  }
});
