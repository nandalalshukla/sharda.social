import React, { useEffect } from "react";
import { DimensionValue, StyleProp, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";
import { radius as radii } from "@/theme/tokens";
import { Card } from "./Card";

/**
 * One shared pulse per skeleton. Opacity animates on the UI thread, so a
 * screenful of placeholders costs the JS thread nothing.
 */
export function Skeleton({
  width = "100%",
  height = 14,
  radius = radii.sm,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      accessible={false}
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.secondaryHover }, animated, style]}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <Card style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Skeleton width={42} height={42} radius={21} />
        <View style={{ flex: 1, gap: 7 }}>
          <Skeleton width="42%" height={13} />
          <Skeleton width="26%" height={11} />
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Skeleton height={13} />
        <Skeleton height={13} />
        <Skeleton width="70%" height={13} />
      </View>
      <Skeleton height={170} radius={14} />
    </Card>
  );
}

export function ListRowSkeleton() {
  return (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Skeleton width={44} height={44} radius={12} />
      <View style={{ flex: 1, gap: 7 }}>
        <Skeleton width="68%" height={14} />
        <Skeleton width="40%" height={11} />
      </View>
    </Card>
  );
}

export function SkeletonList({ count = 4, kind = "post" }: { count?: number; kind?: "post" | "row" }) {
  return (
    <View style={{ gap: 14 }}>
      {Array.from({ length: count }).map((_, i) =>
        kind === "post" ? <PostCardSkeleton key={i} /> : <ListRowSkeleton key={i} />,
      )}
    </View>
  );
}
