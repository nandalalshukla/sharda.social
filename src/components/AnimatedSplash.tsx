import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text as RNText, useColorScheme, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { darkPalette, lightPalette } from "@/theme/colors";
import { fonts } from "@/theme/tokens";

const MIN_VISIBLE_MS = 1500;
const LOGO_WIDTH = 200;

/**
 * Picks up exactly where the native splash leaves off — same background, same
 * logo, same size and position — so the hand-off is invisible, then animates:
 * the logo settles with a small spring, a halo breathes behind it, and the
 * wordmark rises in. It fades away once the app is ready *and* it has been up
 * long enough to read as intentional rather than a flicker.
 *
 * It follows the system theme, not the in-app preference, because that is
 * what the native splash it replaces was drawn with.
 */
export function AnimatedSplash({ ready }: { ready: boolean }) {
  const dark = useColorScheme() === "dark";
  const palette = dark ? darkPalette : lightPalette;
  const background = dark ? "#100e1a" : "#ffffff";

  const [minElapsed, setMinElapsed] = useState(false);
  const [gone, setGone] = useState(false);

  const opacity = useSharedValue(1);
  const logoScale = useSharedValue(1);
  const halo = useSharedValue(0);
  const wordmark = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSequence(
      withTiming(0.9, { duration: 240, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 7, stiffness: 140 }),
    );
    halo.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
    wordmark.value = withDelay(280, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));

    const t = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [logoScale, halo, wordmark]);

  const leaving = ready && minElapsed;
  useEffect(() => {
    if (!leaving) return;
    opacity.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.quad) });
    const t = setTimeout(() => setGone(true), 400);
    return () => clearTimeout(t);
  }, [leaving, opacity]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }] }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.1 + halo.value * 0.14,
    transform: [{ scale: 0.92 + halo.value * 0.16 }],
  }));
  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmark.value,
    transform: [{ translateY: (1 - wordmark.value) * 14 }],
  }));

  if (gone) return null;

  return (
    <Animated.View
      pointerEvents={leaving ? "none" : "auto"}
      style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: background }, containerStyle]}
    >
      <Animated.View style={[styles.halo, { backgroundColor: palette.primary }, haloStyle]} />
      <Animated.View style={logoStyle}>
        <Image source={require("../../assets/splash-icon.png")} style={styles.logo} contentFit="contain" />
      </Animated.View>

      <Animated.View style={[styles.text, wordmarkStyle]}>
        <RNText style={[styles.wordmark, { color: palette.foreground }]}>Sharda Social</RNText>
        <RNText style={[styles.tagline, { color: palette.mutedForeground }]}>
          Notes · PYQs · Campus community
        </RNText>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", zIndex: 2000 },
  halo: { position: "absolute", width: 300, height: 300, borderRadius: 150 },
  logo: { width: LOGO_WIDTH, height: LOGO_WIDTH },
  text: { position: "absolute", top: "50%", marginTop: LOGO_WIDTH / 2 + 18, alignItems: "center", gap: 6 },
  wordmark: { fontFamily: fonts.black, fontSize: 28, letterSpacing: -0.6 },
  tagline: { fontFamily: fonts.medium, fontSize: 13.5, letterSpacing: 0.2 },
});
