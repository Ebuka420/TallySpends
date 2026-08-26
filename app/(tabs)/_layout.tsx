import { Ionicons } from "@expo/vector-icons";
// Fallback: avoid requiring `expo-blur` so builds succeed when it's not installed
import { Tabs } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  Dimensions,
  Animated,
  Text,
} from "react-native";
import { useAppStore } from "../../src/store";

function CustomTabBar({ state, descriptors, navigation, themeMode, theme, tabBarAlpha }: any) {
  const slideAnim = React.useRef(new Animated.Value(state.index)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index,
      useNativeDriver: true,
      friction: 9,
      tension: 50,
    }).start();
  }, [state.index]);

  const { width: screenWidth } = Dimensions.get("window");
  const containerWidth = screenWidth - 36;
  const padding = 6;
  const tabWidth = (containerWidth - padding * 2) / state.routes.length;

  const translateX = slideAnim.interpolate({
    inputRange: [0, state.routes.length - 1],
    outputRange: [0, (state.routes.length - 1) * tabWidth],
  });

  return (
    <View style={[styles.tabBarContainer, { width: containerWidth, borderColor: theme.border }]}>
      {/* Background glass blur (fallback view when expo-blur isn't installed) */}
      <View style={StyleSheet.absoluteFill} />
      <View
        style={[
          styles.tabBarOverlay,
          {
            backgroundColor: themeMode === "dark"
              ? `rgba(26, 24, 29, ${Math.max(0.2, tabBarAlpha * 0.85)})`
              : `rgba(255, 255, 255, ${Math.max(0.1, tabBarAlpha * 0.95)})`,
          },
        ]}
      />

      {/* Sliding Glass Pill */}
      <Animated.View
        style={[
          styles.slidingIndicator,
          {
            width: tabWidth,
            transform: [{ translateX }],
            backgroundColor: themeMode === "dark"
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.05)",
            borderColor: themeMode === "dark"
              ? "rgba(255, 255, 255, 0.12)"
              : "rgba(0, 0, 0, 0.08)",
          },
        ]}
      >
        {/* inner blur fallback */}
        <View style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Tabs */}
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        // Determine icon name
        let iconName = "home-outline";
        if (route.name === "index") iconName = isFocused ? "home" : "home-outline";
        else if (route.name === "expenses") iconName = isFocused ? "document-text" : "document-text-outline";
        else if (route.name === "budget") iconName = isFocused ? "sparkles" : "sparkles-outline";
        else if (route.name === "analytics") iconName = isFocused ? "bar-chart" : "bar-chart-outline";
        else if (route.name === "more") iconName = isFocused ? "ellipsis-horizontal" : "ellipsis-horizontal-outline";

        const label = options.title !== undefined ? options.title : route.name;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            <Ionicons
              name={iconName as any}
              size={20}
              color={isFocused ? theme.accent : theme.textSecondary}
              style={{ marginBottom: 2 }}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused ? theme.accent : theme.textSecondary,
                  fontWeight: isFocused ? "700" : "500",
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { tabBarOpacity, themeMode, theme } = useAppStore();
  const tabBarAlpha = Math.max(0, Math.min(1, tabBarOpacity ?? 0.72));

  return (
    <Tabs
      tabBar={(props) => (
        <CustomTabBar
          {...props}
          themeMode={themeMode}
          theme={theme}
          tabBarAlpha={tabBarAlpha}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="expenses" options={{ title: "Expenses" }} />
      <Tabs.Screen name="budget" options={{ title: "Insights" }} />
      <Tabs.Screen name="analytics" options={{ title: "Analytics" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 18,
    bottom: 12,
    height: 60,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tabBarOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  slidingIndicator: {
    position: "absolute",
    height: 48,
    left: 6,
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  tabItem: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  tabLabel: {
    fontSize: 10.5,
  },
});
