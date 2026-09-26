import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { answerSpending, type spendingSummary } from "../src/insights/summary";
import type { ThemePalette } from "../src/theme";
const prompts = [{
  label: "Top category",
  question: "Where did most of my money go?"
}, {
  label: "What changed?",
  question: "How does my spending compare with the previous period?"
}, {
  label: "Saving ideas",
  question: "How can I save?"
}];
export function SpendingQuestions({
  data,
  availableBalance,
  theme,
  dark,
  disabled,
  onAnswer
}: {
  data: ReturnType<typeof spendingSummary>;
  availableBalance: number;
  theme: ThemePalette;
  dark: boolean;
  disabled: boolean;
  onAnswer: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<ReturnType<typeof answerSpending> | null>(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setAnswer(null);
    setExpanded(false);
  }, [data, availableBalance]);
  const ask = (value: string) => {
    if (disabled || !value.trim()) return;
    Keyboard.dismiss();
    setAnswer(answerSpending(value.trim(), data, availableBalance));
    setQuestion("");
    setExpanded(false);
  };
  return <View style={[s.card, {
    backgroundColor: theme.surface,
    borderColor: theme.border
  }]}>
    <View style={s.header}><Ionicons name="sparkles-outline" size={18} color={theme.accent} /><Text style={[s.title, {
        color: theme.textPrimary
      }]}>Ask about your spending</Text></View>
    <Text style={[s.caption, {
      color: theme.textSecondary
    }]}>{data.periodLabel} · Your recorded transactions</Text>
    <View style={[s.inputRow, {
      backgroundColor: theme.surfaceSoft,
      borderColor: theme.border
    }]}>
      <TextInput accessibilityLabel="Ask about your spending" value={question} onChangeText={setQuestion} placeholder="What would you like to know?" placeholderTextColor={theme.textSecondary} maxLength={300} onSubmitEditing={() => ask(question)} returnKeyType="send" editable={!disabled} style={[s.input, {
        color: theme.textPrimary
      }]} />
      <Pressable accessibilityRole="button" accessibilityLabel="Ask question" hitSlop={4} disabled={disabled || !question.trim()} onPress={() => ask(question)} style={[s.send, {
        backgroundColor: theme.accent,
        opacity: disabled || !question.trim() ? .35 : 1
      }]}><Ionicons name="arrow-up" size={19} color={dark ? theme.background : "#FFFFFF"} /></Pressable>
    </View>
    <View style={s.prompts}>{prompts.map(prompt => <Pressable key={prompt.label} accessibilityRole="button" accessibilityState={{
        selected: answer?.query === prompt.question
      }} disabled={disabled} onPress={() => ask(prompt.question)} style={[s.prompt, {
        backgroundColor: answer?.query === prompt.question ? theme.accentSoft : theme.surfaceSoft,
        opacity: disabled ? .45 : 1
      }]}><Text style={{
          color: answer?.query === prompt.question ? theme.accent : theme.textSecondary,
          fontSize: 11,
          fontWeight: "500"
        }}>{prompt.label}</Text></Pressable>)}</View>
    {answer && <View onLayout={onAnswer} accessibilityLiveRegion="polite" style={[s.answer, {
      borderColor: theme.border
    }]}>
      <View style={s.queryRow}><Text style={[s.query, {
          color: theme.textSecondary
        }]}>{answer.query}</Text><Pressable accessibilityRole="button" accessibilityLabel="Dismiss answer" hitSlop={8} onPress={() => {
          setAnswer(null);
          setExpanded(false);
        }} style={{
          padding: 6
        }}><Ionicons name="close" size={16} color={theme.textSecondary} /></Pressable></View>
      <Text selectable style={[s.summary, {
        color: theme.textPrimary
      }]}>{answer.summary}</Text>
      {expanded && <View style={s.details}>{answer.details.map((detail, index) => <View key={index} style={s.detailRow}><View style={[s.dot, {
            backgroundColor: theme.accentSecondary
          }]} /><Text style={[s.detail, {
            color: theme.textSecondary
          }]}>{detail}</Text></View>)}{!!answer.actionableTip && <Text style={[s.tip, {
          color: theme.accentSecondary
        }]}>{answer.actionableTip}</Text>}</View>}
      <Pressable accessibilityRole="button" accessibilityState={{
        expanded
      }} onPress={() => setExpanded(!expanded)} style={s.disclosure}><Text style={{
          color: theme.accent,
          fontSize: 11,
          fontWeight: "600"
        }}>{expanded ? "Less detail" : "See the breakdown"}</Text><Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={13} color={theme.accent} /></Pressable>
    </View>}
  </View>;
}
const s = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    marginBottom: 12
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -.2
  },
  caption: {
    fontSize: 10.5,
    lineHeight: 16,
    marginTop: 6
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 13,
    paddingLeft: 12,
    paddingRight: 5,
    marginTop: 16
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingVertical: 12,
    fontSize: 12
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center"
  },
  prompts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10
  },
  prompt: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20
  },
  answer: {
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 13
  },
  queryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 9
  },
  query: {
    fontSize: 11,
    lineHeight: 17,
    flex: 1
  },
  summary: {
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "500"
  },
  details: {
    gap: 9,
    marginTop: 14
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 7
  },
  detail: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 18
  },
  tip: {
    fontSize: 11.5,
    lineHeight: 18,
    marginTop: 3
  },
  disclosure: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 14,
    paddingBottom: 3,
    alignSelf: "flex-start"
  }
});
