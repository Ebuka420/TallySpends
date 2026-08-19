import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

const circles = [
  {
    id: "mama",
    name: "Mama Ajo Circle",
    amount: 25000,
    pot: 150000,
    date: "May 18, 2025",
    paid: 4,
    img: "https://i.pravatar.cc/100?img=12",
  },
  {
    id: "family",
    name: "Family Lift",
    amount: 18000,
    pot: 108000,
    date: "May 25, 2025",
    paid: 3,
    img: "https://i.pravatar.cc/100?img=32",
  },
  {
    id: "weekend",
    name: "Weekend Savers",
    amount: 10000,
    pot: 60000,
    date: "June 1, 2025",
    paid: 5,
    img: "https://i.pravatar.cc/100?img=47",
  },
];

const invites = [
  {
    id: "growth",
    name: "Friends Growth Circle",
    from: "Ada O.",
    tag: "@adae",
    amount: "₦5,000",
    cycle: "Weekly",
    members: "4 of 6",
    img: "https://i.pravatar.cc/100?img=49",
  },
  {
    id: "market",
    name: "Market Women Circle",
    from: "Tosin B.",
    tag: "@tosinb",
    amount: "₦12,000",
    cycle: "Monthly",
    members: "5 of 8",
    img: "https://i.pravatar.cc/100?img=40",
  },
];

const money = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export default function Ajo() {
  const router = useRouter();
  const { themePreference, themeMode } = useAppStore();
  const t = useMemo(
    () => getThemePalette(themePreference, themeMode),
    [themePreference, themeMode],
  );
  const [tab, setTab] = useState<"mine" | "invites">("mine");
  const [pending, setPending] = useState(invites);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        <View style={s.header}>
          <TouchableOpacity
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/(tabs)" as any)
            }
            style={[s.back, { backgroundColor: t.surface }]}
          >
            <Ionicons name="chevron-back" size={23} color={t.textPrimary} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: t.textPrimary }]}>Ajo</Text>
            <Text style={[s.sub, { color: t.textSecondary }]}>
              Group savings made simple
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/ajo-create" as any)}
            style={[s.create, { borderColor: t.accent }]}
          >
            <Ionicons name="add" size={19} color={t.accent} />
            <Text style={[s.createText, { color: t.accent }]}>Create</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            s.summary,
            { backgroundColor: t.surface, borderColor: t.border },
          ]}
        >
          <Text style={[s.summaryTitle, { color: t.textPrimary }]}>
            Your Ajo Summary
          </Text>
          <View style={s.metrics}>
            {[
              ["₦125,000", "Total Saved"],
              ["3", "Active Ajos"],
              ["2", "Collections due"],
            ].map(([value, label]) => (
              <View key={label as string} style={s.metric}>
                <Text style={[s.metricValue, { color: t.textPrimary }]}>
                  {value}
                </Text>
                <Text style={[s.metricLabel, { color: t.textSecondary }]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={[
            s.tabs,
            { backgroundColor: t.surfaceSoft, borderColor: t.border },
          ]}
        >
          <Tab
            label="My Ajos"
            active={tab === "mine"}
            onPress={() => setTab("mine")}
            t={t}
          />
          <Tab
            label={`Invitations (${pending.length})`}
            active={tab === "invites"}
            onPress={() => setTab("invites")}
            t={t}
          />
        </View>

        {tab === "mine" ? (
          <>
            <Text style={[s.section, { color: t.textPrimary }]}>
              Active Ajos
            </Text>
            {circles.map((circle) => (
              <TouchableOpacity
                key={circle.id}
                onPress={() =>
                  router.push({
                    pathname: "/ajo-details",
                    params: { groupId: circle.id },
                  } as any)
                }
                style={[
                  s.circle,
                  { backgroundColor: t.surface, borderColor: t.border },
                ]}
                activeOpacity={0.9}
              >
                <View style={s.row}>
                  <Image source={{ uri: circle.img }} style={s.circleImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.circleName, { color: t.textPrimary }]}>
                      {circle.name}
                    </Text>
                    <Text style={[s.meta, { color: t.textSecondary }]}>
                      Next collection: {circle.date}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={t.textSecondary}
                  />
                </View>
                <View style={s.circleBottom}>
                  <Info
                    value={money(circle.amount)}
                    label="My contribution"
                    t={t}
                  />
                  <Info value={money(circle.pot)} label="Total pot" t={t} />
                  <Text style={[s.members, { color: t.accent }]}>
                    {circle.paid}/6 members
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            <Text style={[s.section, { color: t.textPrimary }]}>
              Circle invitations
            </Text>
            {pending.map((invite) => (
              <View
                key={invite.id}
                style={[
                  s.invite,
                  { backgroundColor: t.surface, borderColor: t.border },
                ]}
              >
                <View style={s.row}>
                  <Image source={{ uri: invite.img }} style={s.inviterImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.inviteName, { color: t.textPrimary }]}>
                      {invite.name}
                    </Text>
                    <Text style={[s.meta, { color: t.textSecondary }]}>
                      Invited by {invite.from} · {invite.tag}
                    </Text>
                  </View>
                </View>

                <View style={[s.inviteInfo, { borderColor: t.border }]}>
                  <Info value={invite.amount} label="Contribution" t={t} />
                  <Info value={invite.cycle} label="Frequency" t={t} />
                  <Info value={invite.members} label="Members" t={t} />
                </View>

                <View style={s.inviteActions}>
                  <TouchableOpacity
                    onPress={() =>
                      setPending((items) =>
                        items.filter((item) => item.id !== invite.id),
                      )
                    }
                    style={[s.decline, { borderColor: t.border }]}
                  >
                    <Text style={[s.declineText, { color: t.textSecondary }]}>
                      Decline
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      setPending((items) =>
                        items.filter((item) => item.id !== invite.id),
                      )
                    }
                    style={[s.join, { backgroundColor: t.accent }]}
                  >
                    <Text style={[s.joinText, { color: "#fff" }]}>
                      Join circle
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Tab({ label, active, onPress, t }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.tab, active && { backgroundColor: t.accent }]}
    >
      <Text style={[s.tabText, { color: active ? "#fff" : t.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Info({ value, label, t }: any) {
  return (
    <View>
      <Text style={[s.infoValue, { color: t.textPrimary }]}>{value}</Text>
      <Text style={[s.infoLabel, { color: t.textSecondary }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 42 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 22,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 29, fontWeight: "800" },
  sub: { fontSize: 12, marginTop: 3 },
  create: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 11,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  createText: { fontSize: 12, fontWeight: "800" },
  summary: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 14 },
  summaryTitle: { fontSize: 14, fontWeight: "800" },
  metrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  metric: { flex: 1, alignItems: "center" },
  metricValue: { fontSize: 14, fontWeight: "800" },
  metricLabel: { fontSize: 10, marginTop: 4, textAlign: "center" },
  tabs: {
    height: 48,
    padding: 4,
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 22,
    marginTop: 6,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  tabText: { fontSize: 12, fontWeight: "800" },
  section: { fontSize: 16, fontWeight: "800", marginTop: 26, marginBottom: 12 },
  circle: { borderWidth: 1, borderRadius: 17, padding: 15, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 11 },
  circleImage: { width: 51, height: 51, borderRadius: 26 },
  circleName: { fontSize: 14, fontWeight: "800" },
  meta: { fontSize: 11, marginTop: 5 },
  circleBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 15,
  },
  infoValue: { fontSize: 12, fontWeight: "800" },
  infoLabel: { fontSize: 9, marginTop: 3 },
  members: { fontSize: 10, fontWeight: "800" },
  invite: { borderWidth: 1, borderRadius: 16, padding: 13, marginBottom: 10 },
  inviterImage: { width: 42, height: 42, borderRadius: 21 },
  inviteName: { fontSize: 13, fontWeight: "800" },
  inviteInfo: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 11,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inviteActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  decline: {
    height: 39,
    borderRadius: 11,
    borderWidth: 1,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  declineText: { fontSize: 12, fontWeight: "800" },
  join: {
    height: 39,
    borderRadius: 11,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  joinText: { fontSize: 12, fontWeight: "800", color: "#fff" },
});
