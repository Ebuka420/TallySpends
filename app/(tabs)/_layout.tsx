import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useAppStore } from "../../src/store";

const TabBarBackground = ({ opacity }: { opacity: number }) => (
  <View style={styles.tabBarBackground}>
    <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
    <View
      style={[
        styles.tabBarOverlay,
        {
          backgroundColor: `rgba(255, 255, 255, ${Math.max(0.02, opacity * 0.96)})`,
        },
      ]}
    />
  </View>
);

const GlassTabButton = ({
  children,
  onPress,
  accessibilityState,
  barOpacity,
}: any) => {
  const isActive = accessibilityState?.selected;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabButton,
        pressed && styles.tabButtonPressed,
      ]}
    >
      <BlurView
        tint="light"
        intensity={isActive ? 90 : 54}
        style={[
          styles.tabButtonGlass,
          isActive && {
            backgroundColor: "rgba(244, 239, 241, 0.96)",
            borderColor: "rgba(75, 44, 64, 0.28)",
            shadowColor: "#4B2C40",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.22,
            shadowRadius: 10,
            elevation: 6,
          },
        ]}
      >
        {children}
      </BlurView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tabBarBackground: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(91, 78, 145, 0.16)",
    shadowColor: "#3B2A58",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  tabBarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tabButtonGlass: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  tabButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
});

export default function TabLayout() {
  const { tabBarOpacity } = useAppStore();
  const tabBarAlpha = Math.max(0, Math.min(1, tabBarOpacity ?? 0.72));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarBackground: () => <TabBarBackground opacity={tabBarAlpha} />,
        tabBarStyle: {
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 8,
          height: 62,
          borderRadius: 20,
          paddingBottom: 6,
          paddingTop: 4,
          paddingHorizontal: 4,
          backgroundColor: "transparent",
          borderWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: "#4B2C40",
        tabBarInactiveTintColor: "#8E7B95",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarItemStyle: {
          borderRadius: 14,
          marginHorizontal: 1,
        },
      }}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill} />
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarButton: (props) => (
            <GlassTabButton {...props} barOpacity={tabBarAlpha} />
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarButton: (props) => (
            <GlassTabButton {...props} barOpacity={tabBarAlpha} />
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-sharp" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarButton: (props) => (
            <GlassTabButton {...props} barOpacity={tabBarAlpha} />
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarButton: (props) => (
            <GlassTabButton {...props} barOpacity={tabBarAlpha} />
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarButton: (props) => (
            <GlassTabButton {...props} barOpacity={tabBarAlpha} />
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
