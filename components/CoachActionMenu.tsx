import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, BackHandler, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { clamp, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { actionOffset, COACH_ACTIONS, COACH_BUTTON, hoveredAction, type CoachAction } from "../src/coach/menu";
import type { ThemePalette } from "../src/theme";
const spring = {
  damping: 18,
  stiffness: 270,
  mass: 0.65
};
const haptic = () => {
  Haptics.selectionAsync().catch(() => {});
};
export function CoachActionMenu({
  theme,
  dark,
  onAction
}: {
  theme: ThemePalette;
  dark: boolean;
  onAction: (action: CoachAction) => void;
}) {
  const {
    width,
    height
  } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const x = useSharedValue(width - COACH_BUTTON - 20);
  const y = useSharedValue(height - COACH_BUTTON - Math.max(100, insets.bottom + 80));
  const startX = useSharedValue(0),
    startY = useSharedValue(0);
  const progress = useSharedValue(0),
    pressed = useSharedValue(1);
  const hovered = useSharedValue(-1),
    expanded = useSharedValue(false);
  const dragging = useSharedValue(false);
  const minY = insets.top + 26;
  const maxY = Math.max(minY, height - COACH_BUTTON - insets.bottom - 72);
  useEffect(() => {
    x.value = clamp(x.value, 20, width - COACH_BUTTON - 20);
    y.value = clamp(y.value, minY, maxY);
  }, [width, height, minY, maxY, x, y]);
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader);
    const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", setScreenReader);
    return () => subscription.remove();
  }, []);
  const close = useCallback(() => {
    expanded.value = false;
    hovered.value = -1;
    progress.value = withTiming(0, {
      duration: 160
    });
    pressed.value = withSpring(1, spring);
    setOpen(false);
  }, [expanded, hovered, progress, pressed]);
  const show = () => {
    "worklet";

    expanded.value = true;
    hovered.value = -1;
    progress.value = withSpring(1, spring);
    runOnJS(setOpen)(true);
    runOnJS(haptic)();
  };
  const choose = useCallback((action: CoachAction) => {
    close();
    haptic();
    onAction(action);
  }, [close, onAction]);
  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => subscription.remove();
  }, [open, close]);
  const pan = Gesture.Pan().minDistance(8).maxPointers(1).onBegin(() => {
    dragging.value = false;
    startX.value = x.value;
    startY.value = y.value;
    pressed.value = withSpring(.92, spring);
  }).onStart(() => {
    dragging.value = true;
  }).onUpdate(event => {
    if (expanded.value) {
      const next = hoveredAction(event.absoluteX - x.value - COACH_BUTTON / 2, event.absoluteY - y.value - COACH_BUTTON / 2, x.value + COACH_BUTTON / 2 > width / 2, y.value < minY + 155);
      if (next !== hovered.value) {
        hovered.value = next;
        if (next >= 0) runOnJS(haptic)();
      }
    } else {
      x.value = clamp(startX.value + event.translationX, 20, width - COACH_BUTTON - 20);
      y.value = clamp(startY.value + event.translationY, minY, maxY);
    }
  }).onEnd(() => {
    if (expanded.value) {
      const index = hovered.value;
      if (index >= 0) runOnJS(choose)(COACH_ACTIONS[index].id);else runOnJS(close)();
    } else {
      x.value = withSpring(x.value + COACH_BUTTON / 2 < width / 2 ? 20 : width - COACH_BUTTON - 20, spring);
      runOnJS(haptic)();
    }
  }).onFinalize((_event, success) => {
    pressed.value = withSpring(1, spring);
    if (!success && dragging.value && expanded.value) runOnJS(close)();
    dragging.value = false;
  });
  const hold = Gesture.LongPress().minDuration(240).maxDistance(10).shouldCancelWhenOutside(false).onStart(() => {
    if (!expanded.value) show();
  });
  const tap = Gesture.Tap().maxDuration(230).maxDistance(8).onEnd((_event, success) => {
    if (!success) return;
    if (expanded.value) runOnJS(close)();else runOnJS(choose)("coach");
  });
  const gesture = Gesture.Simultaneous(pan, hold, tap);
  const backdrop = useAnimatedStyle(() => ({
    opacity: clamp(progress.value, 0, 1)
  }));
  const anchor = useAnimatedStyle(() => ({
    transform: [{
      translateX: x.value
    }, {
      translateY: y.value
    }]
  }));
  const master = useAnimatedStyle(() => ({
    transform: [{
      scale: pressed.value
    }]
  }));
  const sparkle = useAnimatedStyle(() => ({
    opacity: 1 - clamp(progress.value, 0, 1),
    transform: [{
      rotate: `${progress.value * -45}deg`
    }]
  }));
  const cross = useAnimatedStyle(() => ({
    opacity: clamp(progress.value, 0, 1),
    transform: [{
      rotate: `${(1 - progress.value) * 45}deg`
    }]
  }));
  const labelPosition = useAnimatedStyle(() => ({
    left: clamp(x.value + COACH_BUTTON / 2 - 140, 16, Math.max(16, width - 296)),
    top: clamp(y.value < minY + 155 ? y.value + 190 : y.value - 240, minY, Math.max(minY, height - insets.bottom - 100)),
    opacity: clamp(progress.value, 0, 1)
  }));
  return <>
    <Animated.View pointerEvents={open ? "auto" : "none"} style={[StyleSheet.absoluteFill, s.backdrop, backdrop]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close Smart Coach actions" onPress={close} style={StyleSheet.absoluteFill} />
    </Animated.View>
    <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[s.labelArea, labelPosition]}>
      <ActionLabel index={-1} hovered={hovered} title="A little help?" subtitle="Hold, slide and release. Or tap an action." />
      {COACH_ACTIONS.map((action, index) => <ActionLabel key={action.id} index={index} hovered={hovered} title={action.label} subtitle="Release to open" />)}
    </Animated.View>
    <View style={[StyleSheet.absoluteFill, {
      zIndex: 9999,
      elevation: 24
    }]} pointerEvents="box-none">
      <View pointerEvents={open ? "box-none" : "none"} accessibilityElementsHidden={!open} importantForAccessibility={open ? "yes" : "no-hide-descendants"} style={StyleSheet.absoluteFill}>
        {COACH_ACTIONS.map((action, index) => <ActionButton key={action.id} index={index} x={x} y={y} width={width} minY={minY} progress={progress} hovered={hovered} theme={theme} dark={dark} onPress={() => choose(action.id)} />)}
      </View>
      <Animated.View style={[s.anchor, anchor]} pointerEvents="box-none">
      <GestureDetector gesture={gesture}>
        <Animated.View accessible accessibilityRole="button" accessibilityLabel="Smart Coach" accessibilityHint="Tap to chat. Hold for calculator, expenses and receipt scanning. Drag to move." accessibilityState={{
            expanded: open
          }} accessibilityActions={[{
            name: "activate",
            label: "Open Smart Coach"
          }, {
            name: "longpress",
            label: "Show actions"
          }]} onAccessibilityAction={event => event.nativeEvent.actionName === "longpress" ? show() : choose("coach")} style={[s.master, master, {
            backgroundColor: theme.accent,
            shadowColor: theme.accent
          }]}>
          <Animated.View style={[s.iconLayer, sparkle]}><Ionicons name="sparkles" size={25} color={dark ? theme.background : "#FFFFFF"} /></Animated.View>
          <Animated.View style={[s.iconLayer, cross]}><Ionicons name="close" size={26} color={dark ? theme.background : "#FFFFFF"} /></Animated.View>
        </Animated.View>
      </GestureDetector>
      {screenReader && !open && <Pressable accessibilityRole="button" accessibilityLabel="Show Smart Coach actions" onPress={show} style={[s.accessibleMore, {
          backgroundColor: theme.surface
        }]}><Ionicons name="ellipsis-horizontal" size={18} color={theme.textPrimary} /></Pressable>}
      </Animated.View>
    </View>
  </>;
}
function ActionLabel({
  index,
  hovered,
  title,
  subtitle
}: {
  index: number;
  hovered: SharedValue<number>;
  title: string;
  subtitle: string;
}) {
  const animated = useAnimatedStyle(() => ({
    opacity: withTiming(hovered.value === index ? 1 : 0, {
      duration: 100
    }),
    transform: [{
      translateY: withTiming(hovered.value === index ? 0 : 6, {
        duration: 130
      })
    }]
  }));
  return <Animated.View style={[StyleSheet.absoluteFill, animated]}><Text style={s.label}>{title}</Text><Text style={s.hint}>{subtitle}</Text></Animated.View>;
}
function ActionButton({
  index,
  x,
  y,
  width,
  minY,
  progress,
  hovered,
  theme,
  dark,
  onPress
}: {
  index: number;
  x: SharedValue<number>;
  y: SharedValue<number>;
  width: number;
  minY: number;
  progress: SharedValue<number>;
  hovered: SharedValue<number>;
  theme: ThemePalette;
  dark: boolean;
  onPress: () => void;
}) {
  const action = COACH_ACTIONS[index];
  const animated = useAnimatedStyle(() => {
    const offset = actionOffset(index, x.value + COACH_BUTTON / 2 > width / 2, y.value < minY + 155);
    const p = clamp((progress.value - index * .04) / (1 - index * .04), 0, 1.06);
    return {
      opacity: clamp(p * 2, 0, 1),
      transform: [{
        translateX: x.value + offset.x * p
      }, {
        translateY: y.value + offset.y * p
      }, {
        scale: withSpring((hovered.value === index ? 1.2 : hovered.value >= 0 ? .94 : 1) * Math.max(.2, p), spring)
      }],
      backgroundColor: interpolateColor(hovered.value === index ? 1 : 0, [0, 1], [theme.surface, theme.accent])
    };
  });
  const normal = useAnimatedStyle(() => ({
    opacity: hovered.value === index ? 0 : 1
  }));
  const selected = useAnimatedStyle(() => ({
    opacity: hovered.value === index ? 1 : 0
  }));
  return <Animated.View style={[s.action, animated]}>
    <Pressable accessibilityRole="button" accessibilityLabel={action.label} onPress={onPress} onPressIn={() => {
      hovered.value = index;
      haptic();
    }} onPressOut={() => {
      hovered.value = -1;
    }} onHoverIn={() => {
      hovered.value = index;
    }} onHoverOut={() => {
      hovered.value = -1;
    }} style={s.actionTouch}>
      <Animated.View style={[s.iconLayer, normal]}><Ionicons name={action.icon} size={24} color={theme.textPrimary} /></Animated.View>
      <Animated.View style={[s.iconLayer, selected]}><Ionicons name={action.icon} size={24} color={dark ? theme.background : "#FFFFFF"} /></Animated.View>
    </Pressable>
  </Animated.View>;
}
const s = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(12, 8, 17, .72)",
    zIndex: 9990
  },
  anchor: {
    position: "absolute",
    top: 0,
    left: 0,
    width: COACH_BUTTON,
    height: COACH_BUTTON,
    zIndex: 9999,
    elevation: 24
  },
  master: {
    width: COACH_BUTTON,
    height: COACH_BUTTON,
    borderRadius: COACH_BUTTON / 2,
    shadowOffset: {
      width: 0,
      height: 6
    },
    shadowOpacity: .24,
    shadowRadius: 12,
    elevation: 9
  },
  iconLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center"
  },
  action: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: .15,
    shadowRadius: 8,
    elevation: 8
  },
  actionTouch: {
    width: 52,
    height: 52,
    borderRadius: 26
  },
  labelArea: {
    position: "absolute",
    width: 280,
    height: 78,
    zIndex: 9995
  },
  label: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -.7
  },
  hint: {
    color: "#E0D8E5",
    fontSize: 11,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 17
  },
  accessibleMore: {
    position: "absolute",
    top: -30,
    left: 14,
    width: 30,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14
  }
});
