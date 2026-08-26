import React from "react";
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import { useAppStore } from "../src/store";

interface DynamicLogoProps {
  size?: number;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export default function DynamicLogo({
  size = 76,
  rounded = true,
  style,
  imageStyle,
}: DynamicLogoProps) {
  const systemScheme = useColorScheme();
  const { themeMode } = useAppStore();

  // Determine if dark mode is active from store or fallback to system color scheme
  const isDark =
    themeMode === "dark" ||
    (themeMode !== "light" && systemScheme === "dark");

  const borderRadius = rounded ? Math.round(size * 0.28) : 0;

  return (
    <View
      style={[
        styles.logoWrapper,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: isDark ? "#17101E" : "#FFFFFF",
          borderColor: isDark ? "#2D1F3B" : "#E5DEEC",
          shadowColor: isDark ? "#9E8DE3" : "#20142A",
          shadowOpacity: isDark ? 0.35 : 0.12,
        },
        style,
      ]}
    >
      <Image
        source={
          isDark
            ? require("../assets/images/logo-dark.png")
            : require("../assets/images/icon.png")
        }
        style={[styles.logoImage, imageStyle]}
        resizeMode="contain"
        fadeDuration={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrapper: {
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
});
