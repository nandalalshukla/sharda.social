import React, { useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Icon } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

export const LIKE_RED = "#ff2d55";

const PARTICLES = 7;

/**
 * The like heart, after Instagram's:
 *  - an outline heart that, on like, is replaced by a filled one that pops
 *    in from small with a springy overshoot while the whole icon gives a
 *    quick "squeeze and release";
 *  - a ring and a handful of specks that burst outward and fade;
 *  - on unlike, the fill just shrinks away — no burst.
 *
 * Everything runs on the UI thread. The first render shows the current state
 * without animating, so a feed full of already-liked posts doesn't all pop.
 */
export function AnimatedHeart({
  liked,
  size = 23,
  onPress,
  accessibilityLabel,
}: {
  liked: boolean;
  size?: number;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const fill = useSharedValue(liked ? 1 : 0);
  const bump = useSharedValue(1);
  const burst = useSharedValue(0);
  const previous = useRef(liked);

  useEffect(() => {
    if (previous.current === liked) return;
    previous.current = liked;

    if (liked) {
      fill.value = 0.15;
      fill.value = withSpring(1, { damping: 5.5, stiffness: 260, mass: 0.7 });
      bump.value = withSequence(
        withTiming(0.8, { duration: 70, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 6, stiffness: 320 }),
      );
      burst.value = 0;
      burst.value = withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) });
    } else {
      fill.value = withTiming(0, { duration: 130, easing: Easing.in(Easing.quad) });
      burst.value = 0;
    }
  }, [liked, fill, bump, burst]);

  const wrap = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  const filled = useAnimatedStyle(() => ({
    opacity: fill.value > 0.02 ? 1 : 0,
    transform: [{ scale: fill.value }],
  }));
  const outline = useAnimatedStyle(() => ({ opacity: fill.value >= 0.98 ? 0 : 1 }));
  const ring = useAnimatedStyle(() => ({
    opacity: (1 - burst.value) * 0.55 * (burst.value > 0 ? 1 : 0),
    transform: [{ scale: 0.5 + burst.value * 1.5 }],
  }));

  const box = size + 14;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (liked ? "Unlike" : "Like")}
      accessibilityState={{ selected: liked }}
      style={{ width: box, height: box, alignItems: "center", justifyContent: "center" }}
    >
      <Animated.View style={[styles.stack, { width: size, height: size }, wrap]}>
        <Animated.View style={[StyleSheet.absoluteFill, outline]}>
          <Icon name="heart-outline" family="ion" size={size} color={colors.mutedForeground} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, filled]}>
          <Icon name="heart" family="ion" size={size} color={LIKE_RED} />
        </Animated.View>
      </Animated.View>

      {/* Burst layer — sits behind the glyph's footprint, never blocks touches. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        <Animated.View
          style={[styles.ring, { width: size * 1.1, height: size * 1.1, borderRadius: size, borderColor: LIKE_RED }, ring]}
        />
        {Array.from({ length: PARTICLES }).map((_, i) => (
          <Particle key={i} index={i} burst={burst} size={size} />
        ))}
      </View>
    </Pressable>
  );
}

function Particle({ index, burst, size }: { index: number; burst: SharedValue<number>; size: number }) {
  const angle = (index / PARTICLES) * Math.PI * 2 - Math.PI / 2;
  const distance = size * 0.95;
  const dot = Math.max(3, size * 0.16);
  const style = useAnimatedStyle(() => {
    const p = burst.value;
    return {
      opacity: p > 0 && p < 1 ? 1 - p : 0,
      transform: [
        { translateX: Math.cos(angle) * distance * p },
        { translateY: Math.sin(angle) * distance * p },
        { scale: 1 - p * 0.6 },
      ],
    };
  });
  // Alternate two shades so the burst reads as a sparkle, not a flat ring of dots.
  const color = index % 2 === 0 ? LIKE_RED : "#ff7a93";
  return <Animated.View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }, style]} />;
}

/**
 * The big heart that pops over a post when it's double-tapped: springs in
 * with a slight random tilt, holds a beat, then floats up and fades.
 */
export function HeartBurst({ trigger }: { trigger: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const lift = useSharedValue(0);
  const tilt = useSharedValue(0);

  const seed = useMemo(() => [-14, 12, -8, 15, -11, 9], []);

  useEffect(() => {
    if (trigger === 0) return;
    tilt.value = seed[trigger % seed.length];
    lift.value = 0;
    scale.value = 0;
    opacity.value = 1;

    scale.value = withSequence(
      withSpring(1.05, { damping: 5, stiffness: 190, mass: 0.8 }),
      withDelay(330, withTiming(1.25, { duration: 220, easing: Easing.out(Easing.quad) })),
    );
    lift.value = withDelay(330, withTiming(-26, { duration: 220, easing: Easing.out(Easing.quad) }));
    opacity.value = withSequence(
      withTiming(1, { duration: 40 }),
      withDelay(500, withTiming(0, { duration: 210 })),
    );
  }, [trigger, scale, opacity, lift, tilt, seed]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: lift.value }, { rotate: `${tilt.value}deg` }, { scale: scale.value }],
  }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center, { zIndex: 5 }]}>
      <Animated.View style={[styles.bigHeart, style]}>
        <Icon name="heart" family="ion" size={92} color={LIKE_RED} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", borderWidth: 2 },
  dot: { position: "absolute" },
  bigHeart: {
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
