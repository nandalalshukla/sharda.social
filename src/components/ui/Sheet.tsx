import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH, radius } from "@/theme/tokens";
import { Icon } from "./Icon";
import { markModalClosing, modalSettleDelay } from "./modalGate";
import { Text } from "./Text";

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Pinned under the scrolling body, e.g. a primary action. */
  footer?: React.ReactNode;
  /** Set false when the body manages its own scrolling (a FlatList). */
  scroll?: boolean;
  /** Fraction of screen height the sheet may use. */
  maxHeight?: number;
}

const EXIT_MS = 200;

/**
 * Bottom sheet. Slides up, fades a scrim, drags down to dismiss, and lifts
 * above the keyboard. Built on RN's Modal so it sits over native navigation.
 */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  footer,
  scroll = true,
  maxHeight = 0.9,
}: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(windowHeight);
  const scrim = useSharedValue(0);
  const dragStart = useRef(0);

  const wasOpen = useRef(false);

  useEffect(() => {
    if (visible) {
      // If another modal is still animating out, wait for it (see modalGate).
      const t = setTimeout(() => {
        wasOpen.current = true;
        setMounted(true);
        translateY.value = windowHeight;
        translateY.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
        scrim.value = withTiming(1, { duration: 240 });
      }, modalSettleDelay());
      return () => clearTimeout(t);
    }

    if (!wasOpen.current) return;
    wasOpen.current = false;
    markModalClosing();
    translateY.value = withTiming(windowHeight, { duration: EXIT_MS, easing: Easing.in(Easing.cubic) });
    scrim.value = withTiming(0, { duration: EXIT_MS });
    const t = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(t);
  }, [visible, windowHeight, translateY, scrim]);

  const close = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          dragStart.current = translateY.value;
        },
        onPanResponderMove: (_, g) => {
          translateY.value = Math.max(0, dragStart.current + g.dy);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 90 || g.vy > 0.9) close();
          else translateY.value = withTiming(0, { duration: 180 });
        },
      }),
    [close, translateY],
  );

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));

  if (!mounted) return null;

  const Body = scroll ? ScrollView : View;

  return (
    <Modal transparent visible animationType="none" onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        pointerEvents="box-none"
      >
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, scrimStyle]}>
          <Pressable style={styles.fill} onPress={close} accessibilityLabel="Close" />
        </Animated.View>

        <View style={styles.bottom} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                maxHeight: windowHeight * maxHeight,
                paddingBottom: Math.max(insets.bottom, 12),
                maxWidth: MAX_CONTENT_WIDTH + 80,
              },
              sheetStyle,
            ]}
          >
            <View {...pan.panHandlers} style={styles.dragZone}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              {title ? (
                <View style={styles.titleRow}>
                  <Text variant="heading" style={{ flex: 1 }} numberOfLines={1}>
                    {title}
                  </Text>
                  <Pressable
                    onPress={close}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
                  >
                    <Icon name="x" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              ) : null}
            </View>

            <Body
              {...(scroll
                ? { keyboardShouldPersistTaps: "handled", showsVerticalScrollIndicator: false, bounces: false }
                : {})}
              style={scroll ? undefined : { flexShrink: 1 }}
              contentContainerStyle={scroll ? styles.content : undefined}
            >
              {scroll ? children : <View style={styles.content}>{children}</View>}
            </Body>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bottom: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  sheet: {
    width: "100%",
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    overflow: "hidden",
  },
  dragZone: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 6 },
  handle: { alignSelf: "center", width: 38, height: 4.5, borderRadius: 3, marginBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 6 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12, gap: 14 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
});
