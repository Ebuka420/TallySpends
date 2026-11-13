import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

const goals = [
  { id: "joint-1", name: "Titi & Chigozie", tag: "@titiwrites · @chigozie", goal: "New laptop", saved: 165000, target: 300000, people: 2, due: "4 months left", image: "https://i.pravatar.cc/100?img=15", icon: "laptop-outline" as const },
  { id: "joint-2", name: "Bolu & Chigozie", tag: "@boluworks · @chigozie", goal: "Holiday trip", saved: 284000, target: 480000, people: 2, due: "6 months left", image: "https://i.pravatar.cc/100?img=27", icon: "airplane-outline" as const },
  { id: "joint-3", name: "Chika & Chigozie", tag: "@chikahome · @chigozie", goal: "Home setup", saved: 112500, target: 200000, people: 2, due: "3 months left", image: "https://i.pravatar.cc/100?img=41", icon: "home-outline" as const },
];

export default function JointSavingsScreen() {
  const router = useRouter();
  const { themePreference, themeMode } = useAppStore();
  const theme = getThemePalette(themePreference, themeMode);

  return <SafeAreaView style={[s.safe, { backgroundColor: theme.background }]}>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.nav}><TouchableOpacity onPress={() => router.back()} style={[s.navButton, { backgroundColor: theme.surface }]}><Ionicons name="chevron-back" size={23} color={theme.textPrimary} /></TouchableOpacity><Text style={[s.navTitle, { color: theme.textPrimary }]}>Joint savings</Text><View style={{ width: 42 }} /></View>
      <View style={[s.hero, { backgroundColor: theme.accent }]}>
        <View style={s.heroTop}><View style={s.heroPill}><Ionicons name="people-outline" size={15} color="#fff" /><Text style={s.heroPillText}>SAVE AS A TEAM</Text></View><Ionicons name="shield-checkmark-outline" size={23} color="rgba(255,255,255,0.78)" /></View>
        <Text style={s.heroTitle}>One goal.{"\n"}Everyone in the loop.</Text>
        <Text style={s.heroCopy}>Set a shared target, agree a lock date, and see each contribution clearly.</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: "/savings-lock", params: { mode: "joint" } })} style={[s.heroButton, { backgroundColor: theme.surface }]}><Text style={[s.heroButtonText, { color: theme.accent }]}>Start a joint lock</Text><Ionicons name="arrow-forward" size={17} color={theme.accent} /></TouchableOpacity>
      </View>
      <View style={s.sectionHead}><Text style={[s.sectionTitle, { color: theme.textPrimary }]}>Your shared goals</Text><Text style={[s.sectionMeta, { color: theme.textSecondary }]}>{goals.length} active</Text></View>
      {goals.map((goal) => { const progress = Math.round(goal.saved / goal.target * 100); return <TouchableOpacity key={goal.id} activeOpacity={0.82} onPress={() => router.push({ pathname: "/joint-savings-details", params: { id: goal.id } })} style={[s.goalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={s.goalTop}><View style={s.avatarStack}><Image source={{ uri: goal.image }} style={[s.profileImage, { borderColor: theme.surface }]} /><View style={[s.youAvatar, { backgroundColor: theme.accent, borderColor: theme.surface }]}><Text style={s.youInitial}>C</Text></View></View><View style={{ flex: 1 }}><Text style={[s.goalName, { color: theme.textPrimary }]}>{goal.goal}</Text><Text style={[s.goalPeople, { color: theme.textSecondary }]}>{goal.name}</Text><Text style={[s.goalTag, { color: theme.accent }]}>{goal.tag}</Text></View><Ionicons name="chevron-forward" size={18} color={theme.accent} /></View>
        <View style={[s.track, { backgroundColor: theme.surfaceSoft }]}><View style={[s.fill, { backgroundColor: theme.accent, width: `${progress}%` }]} /></View>
        <View style={s.goalBottom}><Text style={[s.goalAmount, { color: theme.textPrimary }]}>₦{goal.saved.toLocaleString()} <Text style={[s.goalTarget, { color: theme.textSecondary }]}>of ₦{goal.target.toLocaleString()}</Text></Text><Text style={[s.goalDue, { color: theme.accent }]}>{goal.due}</Text></View>
      </TouchableOpacity>; })}
      <View style={[s.note, { backgroundColor: theme.accentSoft }]}><Ionicons name="lock-closed-outline" size={18} color={theme.accent} /><Text style={[s.noteText, { color: theme.textSecondary }]}>A lock date is agreed upfront. Everyone can follow progress, but funds stay protected until it ends.</Text></View>
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({ safe:{flex:1},content:{padding:20,paddingBottom:110},nav:{height:48,flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:12},navButton:{width:42,height:42,borderRadius:14,alignItems:"center",justifyContent:"center"},navTitle:{fontSize:18,fontWeight:"800"},hero:{borderRadius:25,padding:21,minHeight:260,justifyContent:"space-between",marginBottom:26},heroTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},heroPill:{flexDirection:"row",alignItems:"center",gap:7},heroPillText:{color:"#fff",fontSize:10,fontWeight:"800",letterSpacing:1},heroTitle:{fontSize:28,fontWeight:"800",lineHeight:33,letterSpacing:-.7,color:"#fff"},heroCopy:{fontSize:12.5,lineHeight:18,color:"rgba(255,255,255,.72)",maxWidth:"90%"},heroButton:{height:46,borderRadius:14,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},heroButtonText:{fontSize:13,fontWeight:"800"},sectionHead:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:12},sectionTitle:{fontSize:17,fontWeight:"800"},sectionMeta:{fontSize:12,fontWeight:"600"},goalCard:{borderWidth:1,borderRadius:19,padding:15,marginBottom:12},goalTop:{flexDirection:"row",alignItems:"center",gap:11,marginBottom:14},avatarStack:{height:44,width:58,position:"relative"},profileImage:{width:42,height:42,borderRadius:21,borderWidth:2},youAvatar:{width:28,height:28,borderRadius:14,borderWidth:2,alignItems:"center",justifyContent:"center",position:"absolute",right:0,bottom:0},youInitial:{color:"#fff",fontSize:11,fontWeight:"800"},goalName:{fontSize:15,fontWeight:"800"},goalPeople:{fontSize:11.5,marginTop:2},goalTag:{fontSize:10.5,fontWeight:"700",marginTop:3},track:{height:7,borderRadius:4,overflow:"hidden"},fill:{height:"100%",borderRadius:4},goalBottom:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:10},goalAmount:{fontSize:13,fontWeight:"800"},goalTarget:{fontSize:11,fontWeight:"500"},goalDue:{fontSize:11.5,fontWeight:"800"},note:{flexDirection:"row",gap:10,borderRadius:17,padding:15,marginTop:8},noteText:{fontSize:11.5,lineHeight:17,flex:1} });
