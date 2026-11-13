import { useReducedMotion } from "../../components/AuthBackdrop";
import { withAlpha } from "../../src/theme";
import { Ionicons } from "@expo/vector-icons";
// Fallback: avoid requiring `expo-blur` so builds succeed when it's not installed
import { Tabs } from "expo-router";
import React from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAppStore } from "../../src/store";

function CustomTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  themeMode,
  theme,
  tabBarAlpha,
}: any) {
  const [slideAnim] = React.useState(() => new Animated.Value(state.index));
  const reduced = useReducedMotion();

  React.useEffect(() => {
    if (reduced !== false) { slideAnim.setValue(state.index); return; }
    const movement = Animated.spring(slideAnim, {
      toValue: state.index,
      useNativeDriver: true,
      friction: theme.identity.motion.damping / 3,
      tension: theme.identity.motion.stiffness / 3,
    });
    movement.start();
    return () => movement.stop();
  }, [state.index, reduced, slideAnim, theme.identity.motion.damping, theme.identity.motion.stiffness]);

  const { width: screenWidth } = Dimensions.get("window");
  const containerWidth = screenWidth - 36;
  const padding = 6;
  const tabWidth = (containerWidth - padding * 2) / state.routes.length;

  const translateX = slideAnim.interpolate({
    inputRange: [0, state.routes.length - 1],
    outputRange: [0, (state.routes.length - 1) * tabWidth],
  });

  return (
    <View
      style={[
        styles.tabBarContainer,
        { width: containerWidth, borderColor: theme.border },
      ]}
    >
      {/* Background glass blur (fallback view when expo-blur isn't installed) */}
      <View style={StyleSheet.absoluteFill} />
      <View
        style={[
          styles.tabBarOverlay,
          {
            backgroundColor:
              withAlpha(theme.surface, Math.max(.2, tabBarAlpha)),
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
            backgroundColor:
              theme.accentSoft,
            borderColor:
              theme.border,
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
          const event = emitter.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        const onLongPress = () => {
          emitter.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        // Determine icon name
        let iconName = "home-outline";
        if (route.name === "index")
          iconName = isFocused ? "home" : "home-outline";
        else if (route.name === "expenses")
          iconName = isFocused ? "document-text" : "document-text-outline";
        else if (route.name === "budget")
          iconName = isFocused ? "wallet" : "wallet-outline";
        else if (route.name === "analytics")
          iconName = isFocused ? "bar-chart" : "bar-chart-outline";
        else if (route.name === "more")
          iconName = isFocused
            ? "ellipsis-horizontal"
            : "ellipsis-horizontal-outline";

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
      <Tabs.Screen name="budget" options={{ title: "Budget" }} />
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
    ...StyleSheet.absoluteFill,
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


