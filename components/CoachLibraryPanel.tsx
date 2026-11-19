import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { conversationTitle, type CoachConversation } from "../src/coach/history";
import { authenticated } from "../src/authenticated";
import { fetchCoachHistory } from "../src/coach/backendHistory";
import type { ThemePalette } from "../src/theme";

export default function CoachLibraryPanel({ owner, theme, busy, onBack, onOpen, onNew, activeId, backLabel }: {
  owner: string | null; theme: ThemePalette; busy: boolean;
  onBack: () => void; onOpen: (chat: CoachConversation) => void; onNew: () => void;
  activeId: string; backLabel: string;
}) {
  const [rows, setRows] = useState<CoachConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(null); setRows([]);
    if (!owner) { setLoading(false); setError("Sign in to view your coach library."); return; }
    const load = authenticated(fetchCoachHistory, owner).then(data => { if (active) setRows(data); });
    void load.catch(() => { if (active) setError("Couldn't load your saved data. Please try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [owner, revision]);
  const label = { color: theme.textSecondary, fontSize: 9, fontWeight: "700" as const, letterSpacing: 1.2, marginTop: 10 };
  const card = { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 20, padding: 15, gap: 12 };
  return <>
    <Pressable accessibilityRole="button" onPress={onBack} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 }}>
      <Ionicons name="arrow-back" size={18} color={theme.accent} /><Text style={{ color: theme.accent }}>{backLabel}</Text>
    </Pressable>
    <Text style={label}>CHAT HISTORY</Text>
    <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 19 }}>Your latest 50 messages from your account. Open the history to read it or keep chatting. History deletion is not available yet.</Text>
    {loading && <ActivityIndicator color={theme.accent} />}
    {error && <View style={card}><Text accessibilityLiveRegion="polite" style={{ color: theme.textSecondary }}>{error}</Text>
      <Pressable accessibilityRole="button" onPress={() => setRevision(value => value + 1)}><Text style={{ color: theme.accent }}>Try again</Text></Pressable></View>}
    {!loading && !error && <>
      <Pressable accessibilityRole="button" disabled={busy} onPress={onNew} style={card}><Text style={{ color: theme.accent, fontWeight: "600" }}>Start a new conversation</Text></Pressable>
      {!rows.length && <Text style={{ color: theme.textSecondary }}>No messages yet. Your next conversation will appear here.</Text>}
      {rows.map(chat => <View key={chat.id} style={card}>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => onOpen(chat)} style={{ gap: 8 }}>
          <Text numberOfLines={2} style={{ color: theme.textPrimary, fontWeight: "600", fontSize: 13 }}>{conversationTitle(chat)}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{new Date(chat.updatedAt).toLocaleString()} · {chat.messages.length} messages</Text>
        </Pressable>
      </View>)}
    </>}

  </>;
}
