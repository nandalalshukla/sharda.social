import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";

/** Determinate bar for uploads. `value` is 0–1. */
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(1, Math.max(0, value)), { duration: 220 });
  }, [value, progress]);

  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={{ gap: 6 }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <View style={[styles.track, { backgroundColor: colors.secondaryHover }]}>
        <Animated.View style={[styles.fill, { backgroundColor: colors.primary }, fill]} />
      </View>
      {label ? (
        <Text variant="small" tone="muted">
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
});
