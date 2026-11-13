import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { coachId, conversationTitle, deleteCoachConversation, loadCoachHistory, loadCoachMemory, MEMORY_CATEGORIES, saveCoachMemory, type CoachConversation, type MemoryFact } from "../src/coach/history";
import type { ThemePalette } from "../src/theme";

export default function CoachLibraryPanel({ owner, mode, theme, busy, onBack, onOpen, onNew, onMemoryChange, activeId }: {
  owner: string | null; mode: "history" | "memory"; theme: ThemePalette; busy: boolean;
  onBack: () => void; onOpen: (chat: CoachConversation) => void; onNew: () => void;
  onMemoryChange: (facts: MemoryFact[]) => void; activeId: string;
}) {
  const [rows, setRows] = useState<CoachConversation[]>([]);
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<MemoryFact["category"]>("Savings");
  const [saving, setSaving] = useState(false);
  const savingLock = useRef(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(null); setRows([]); setFacts([]);
    if (!owner) { setLoading(false); setError("Sign in to view your coach library."); return; }
    const load = mode === "history" ? loadCoachHistory(owner).then(data => { if (active) setRows(data); })
      : loadCoachMemory(owner).then(data => { if (active) setFacts(data); });
    void load.catch(() => { if (active) setError("Couldn't load your saved data. Please try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [owner, mode, revision]);
  const updateMemory = async (next: MemoryFact[]) => {
    if (!owner || savingLock.current) return;
    savingLock.current = true;
    setSaving(true); setError(null);
    try { await saveCoachMemory(owner, next); setFacts(next); onMemoryChange(next); setText(""); }
    catch { setError("Couldn't save coach memory. Please try again."); }
    finally { savingLock.current = false; setSaving(false); }
  };
  const label = { color: theme.textSecondary, fontSize: 9, fontWeight: "700" as const, letterSpacing: 1.2, marginTop: 10 };
  const card = { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 20, padding: 15, gap: 12 };
  return <>
    <Pressable accessibilityRole="button" onPress={onBack} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 }}>
      <Ionicons name="arrow-back" size={18} color={theme.accent} /><Text style={{ color: theme.accent }}>Back to conversation</Text>
    </Pressable>
    <Text style={label}>{mode === "history" ? "CHAT HISTORY" : "COACH MEMORY"}</Text>
    <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 19 }}>{mode === "history"
      ? "Your 50 most recent conversations saved on this device. Open one to read it or keep chatting."
      : "Save goals and preferences you want your coach to use in future questions. Only facts you add here are saved as memory; messages are not automatically turned into memory. Saved on this device."}</Text>
    {loading && <ActivityIndicator color={theme.accent} />}
    {error && <View style={card}><Text accessibilityLiveRegion="polite" style={{ color: theme.textSecondary }}>{error}</Text>
      <Pressable accessibilityRole="button" onPress={() => setRevision(value => value + 1)}><Text style={{ color: theme.accent }}>Try again</Text></Pressable></View>}
    {!loading && !error && mode === "history" && <>
      <Pressable accessibilityRole="button" disabled={busy} onPress={onNew} style={card}><Text style={{ color: theme.accent, fontWeight: "600" }}>Start a new conversation</Text></Pressable>
      {!rows.length && <Text style={{ color: theme.textSecondary }}>No saved conversations yet. Your next conversation will appear here.</Text>}
      {rows.map(chat => <View key={chat.id} style={card}>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => onOpen(chat)} style={{ gap: 8 }}>
          <Text numberOfLines={2} style={{ color: theme.textPrimary, fontWeight: "600", fontSize: 13 }}>{conversationTitle(chat)}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{new Date(chat.updatedAt).toLocaleString()} · {chat.messages.length} messages</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Delete conversation" disabled={busy || chat.id === activeId} onPress={() => Alert.alert("Delete conversation?", "This removes this saved conversation from this device.", [
          { text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => {
            if (owner) void deleteCoachConversation(owner, chat.id).then(() => setRevision(value => value + 1)).catch(() => setError("Couldn't delete the conversation. Try again."));
          } },
        ])}><Text style={{ color: chat.id === activeId ? theme.textSecondary : theme.danger, fontSize: 11 }}>{chat.id === activeId ? "Current conversation" : "Delete"}</Text></Pressable>
      </View>)}
    </>}
    {!loading && mode === "memory" && <>
      {facts.map(fact => <View key={fact.id} style={card}>
        <Text style={label}>{fact.category.toUpperCase()}</Text><Text style={{ color: theme.textPrimary }}>{fact.text}</Text>
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => updateMemory(facts.filter(row => row.id !== fact.id))}><Text style={{ color: theme.danger }}>Forget this</Text></Pressable>
      </View>)}
      {!facts.length && !error && <Text style={{ color: theme.textSecondary }}>No saved goals or preferences yet.</Text>}
      <View style={card}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{MEMORY_CATEGORIES.map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: category === value }} onPress={() => setCategory(value)} style={{ padding: 8, borderRadius: 12, backgroundColor: category === value ? theme.accentSoft : theme.surfaceSoft }}><Text style={{ color: theme.textPrimary }}>{value}</Text></Pressable>)}</View>
        <TextInput accessibilityLabel="Goal or preference to remember" placeholder="For example: Save for a new laptop" placeholderTextColor={theme.textSecondary} value={text} onChangeText={setText} multiline maxLength={300} editable={!saving && !error} style={{ color: theme.textPrimary, padding: 10, minHeight: 70, backgroundColor: theme.surfaceSoft, borderRadius: 12 }} />
        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>These facts will be sent with future coach questions. Save goals and preferences only, without passwords or identity numbers.</Text>
        <Pressable accessibilityRole="button" disabled={saving || !!error || !text.trim() || facts.length >= 20} onPress={() => updateMemory([...facts, { id: coachId(), category, text: text.trim() }])} style={{ padding: 10 }}>
          <Text style={{ color: theme.accent, fontWeight: "600" }}>{saving ? "Saving…" : facts.length >= 20 ? "20 facts saved — forget one to add another" : "Remember this"}</Text>
        </Pressable>
      </View>
    </>}
  </>;
}
