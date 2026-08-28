import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppStore } from "../../src/store";
import { getThemePalette } from "../../src/theme";

const actions = [
  { title: "My budget", subtitle: "Set limits that fit your month.", icon: "pie-chart-outline" as const, route: "/budgetspending" },
  { title: "My savings", subtitle: "Track goals and lock money aside.", icon: "wallet-outline" as const, route: "/savingsprogress" },
  { title: "Ajo Circles", subtitle: "Save together with people you trust.", icon: "people-outline" as const, route: "/ajo" },
];

export default function BudgetScreen() {
  const router = useRouter(); const { themePreference, themeMode } = useAppStore(); const theme = getThemePalette(themePreference, themeMode);
  return <SafeAreaView style={[s.safe, { backgroundColor: theme.background }]}>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}><Text style={[s.title, { color: theme.textPrimary }]}>Budget</Text><Text style={[s.subtitle, { color: theme.textSecondary }]}>A simple place to plan, save and stay on track.</Text></View>
      <View style={[s.overview, { backgroundColor: theme.accentSoft }]}><View style={[s.overviewIcon, { backgroundColor: theme.surface }]}><Ionicons name="sparkles-outline" size={19} color={theme.accent} /></View><View style={{ flex: 1 }}><Text style={[s.overviewTitle, { color: theme.textPrimary }]}>Your money, in one place</Text><Text style={[s.overviewCopy, { color: theme.textSecondary }]}>Create a budget, grow a goal, or save with your circle.</Text></View></View>
      <View style={s.list}>{actions.map((item) => <TouchableOpacity key={item.title} activeOpacity={0.78} onPress={() => router.push(item.route as any)} style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[s.icon, { backgroundColor: theme.accentSoft }]}><Ionicons name={item.icon} size={22} color={theme.accent} /></View>
        <View style={{ flex: 1 }}><Text style={[s.cardTitle, { color: theme.textPrimary }]}>{item.title}</Text><Text style={[s.cardCopy, { color: theme.textSecondary }]}>{item.subtitle}</Text></View>
        <Ionicons name="chevron-forward" size={18} color={theme.accent} />
      </TouchableOpacity>)}</View>
      <View style={[s.tip, { backgroundColor: theme.accentSoft }]}><Ionicons name="bulb-outline" size={18} color={theme.accent} /><Text style={[s.tipCopy, { color: theme.textSecondary }]}>A small budget, a regular savings habit, and an Ajo date that suits payday can make the month feel much lighter.</Text></View>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({ safe:{flex:1},content:{padding:20,paddingTop:24,paddingBottom:110},header:{marginBottom:22},title:{fontSize:28,fontWeight:"800",letterSpacing:-.6},subtitle:{fontSize:13.5,lineHeight:20,marginTop:7,maxWidth:280},overview:{minHeight:88,borderRadius:20,padding:16,flexDirection:"row",alignItems:"center",gap:12,marginBottom:18},overviewIcon:{width:42,height:42,borderRadius:14,alignItems:"center",justifyContent:"center"},overviewTitle:{fontSize:14,fontWeight:"800",marginBottom:3},overviewCopy:{fontSize:11.5,lineHeight:16},list:{gap:12},card:{minHeight:92,flexDirection:"row",alignItems:"center",gap:13,borderRadius:19,borderWidth:1,padding:15},icon:{height:48,width:48,borderRadius:15,alignItems:"center",justifyContent:"center"},cardTitle:{fontSize:15,fontWeight:"800",marginBottom:3},cardCopy:{fontSize:12,lineHeight:17,paddingRight:4},tip:{flexDirection:"row",gap:10,borderRadius:17,padding:15,marginTop:16},tipCopy:{flex:1,fontSize:11.5,lineHeight:17} });
