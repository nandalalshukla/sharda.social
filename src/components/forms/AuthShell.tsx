import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { elevation, MAX_CONTENT_WIDTH, radius } from "@/theme/tokens";

/**
 * The frame every sign-in screen shares: a soft gradient header with the
 * logo, a title, and the form in a card that rises into place.
 */
export function AuthShell({
  title,
  subtitle,
  error,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  /** Inline message — native modals hide root-level toasts. */
  error?: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
      >
        <LinearGradient
          colors={isDark ? ["#2a2560", colors.background] : ["#e0e4ff", colors.background]}
          style={[styles.hero, { paddingTop: Math.max(insets.top, 16) + 8 }]}
        >
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.close, { backgroundColor: colors.card }]}
          >
            <Icon name={router.canGoBack() ? "arrow-left" : "x"} size={18} />
          </Pressable>

          <Animated.View entering={FadeInUp.duration(500).springify().damping(14)} style={styles.logoWrap}>
            <Image source={require("../../../assets/logo.png")} style={styles.logo} contentFit="contain" />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(100).duration(450)} style={{ alignItems: "center", gap: 6 }}>
            <Text variant="title" align="center">
              {title}
            </Text>
            {subtitle ? (
              <Text tone="muted" align="center" style={{ maxWidth: 320 }}>
                {subtitle}
              </Text>
            ) : null}
          </Animated.View>
        </LinearGradient>

        <Animated.View
          entering={FadeInDown.delay(180).duration(500)}
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            elevation(2, colors.shadow),
          ]}
        >
          {error ? (
            <View
              accessibilityLiveRegion="assertive"
              style={[styles.error, { backgroundColor: `${colors.destructive}18`, borderColor: `${colors.destructive}55` }]}
            >
              <Icon name="alert-circle" size={18} color={colors.destructive} />
              <Text variant="small" tone="destructive" weight="semibold" style={{ flex: 1 }}>
                {error}
              </Text>
            </View>
          ) : null}
          {children}
        </Animated.View>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 28, gap: 14 },
  close: {
    position: "absolute",
    left: 16,
    top: 54,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  logoWrap: { marginTop: 4 },
  logo: { width: 88, height: 88 },
  card: {
    width: "92%",
    maxWidth: MAX_CONTENT_WIDTH - 80,
    alignSelf: "center",
    borderRadius: radius["2xl"],
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: 22,
    gap: 16,
  },
  error: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1 },
  footer: { alignItems: "center", paddingTop: 20, paddingHorizontal: 24, gap: 6 },
});
