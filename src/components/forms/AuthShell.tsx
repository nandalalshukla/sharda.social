import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { elevation, radius } from "@/theme/tokens";

const TOP_BAR = 56;

/**
 * The frame every sign-in screen shares. The logo, title and form sit in one
 * column that is centred both ways (and scrolls when the keyboard or a small
 * screen leaves too little room), with a soft wash of colour behind it.
 */
export function AuthShell({
  title,
  subtitle,
  error,
  children,
  footer,
  variant = "back",
}: {
  title: string;
  subtitle?: string;
  /** Inline message — native modals hide root-level toasts. */
  error?: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** "close" on the entry screen (dismisses the sheet), "back" on the ones pushed after it. */
  variant?: "close" | "back";
}) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        pointerEvents="none"
        colors={isDark ? ["#2a2560", colors.background] : ["#e6e9ff", colors.background]}
        style={styles.wash}
      />

      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={[
            styles.scroll,
            // Reserve the top bar and the system insets so nothing centres underneath them.
            { paddingTop: insets.top + TOP_BAR, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <Animated.View entering={FadeInUp.duration(450)} style={styles.hero}>
            <Image source={require("../../../assets/logo.png")} style={styles.logo} contentFit="contain" />
            <Text variant="title" align="center">
              {title}
            </Text>
            {subtitle ? (
              <Text tone="muted" align="center" style={styles.subtitle}>
                {subtitle}
              </Text>
            ) : null}
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(120).duration(450)}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, elevation(isDark ? 0 : 2, colors.shadow)]}
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

      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={variant === "close" ? "Close" : "Back"}
        style={[styles.close, { top: insets.top + 8, backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Icon name={variant === "close" ? "x" : "arrow-left"} size={19} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  wash: { position: "absolute", top: 0, left: 0, right: 0, height: 360 },
  scroll: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20, gap: 22 },
  hero: { alignItems: "center", gap: 8, width: "100%" },
  logo: { width: 72, height: 72, marginBottom: 6 },
  subtitle: { maxWidth: 320 },
  card: {
    width: "100%",
    maxWidth: 440,
    borderRadius: radius["2xl"],
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: 22,
    gap: 16,
  },
  error: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1 },
  footer: { alignItems: "center", gap: 6, paddingHorizontal: 12 },
  close: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
});
