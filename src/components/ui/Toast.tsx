import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { elevation, radius } from "@/theme/tokens";
import { FeatherName, Icon } from "./Icon";
import { Text } from "./Text";

type ToastType = "success" | "error" | "info";
interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

let nextId = 1;
const listeners = new Set<(t: ToastMessage) => void>();
const emit = (type: ToastType, message: string) => {
  const t = { id: nextId++, type, message };
  listeners.forEach((l) => l(t));
};

/** Fire-and-forget from anywhere — stores, handlers, hooks. */
export const toast = {
  success: (message: string) => emit("success", message),
  error: (message: string) => emit("error", message),
  info: (message: string) => emit("info", message),
};

const ICON: Record<ToastType, FeatherName> = {
  success: "check-circle",
  error: "alert-circle",
  info: "info",
};

export function ToastHost() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<ToastMessage | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onToast = (t: ToastMessage) => {
      if (timer.current) clearTimeout(timer.current);
      setCurrent(t);
      Haptics.notificationAsync(
        t.type === "error"
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Success,
      ).catch(() => undefined);
      timer.current = setTimeout(() => setCurrent(null), t.type === "error" ? 4200 : 2600);
    };
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!current) return null;

  const tint = { success: colors.success, error: colors.destructive, info: colors.info }[current.type];

  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + 10 }]}>
      <Animated.View
        key={current.id}
        entering={FadeInUp.duration(260).springify().damping(16)}
        exiting={FadeOutUp.duration(180)}
        style={[
          styles.toast,
          { backgroundColor: colors.card, borderColor: colors.border },
          elevation(3, colors.shadow),
        ]}
        accessibilityLiveRegion="polite"
      >
        <View style={[styles.stripe, { backgroundColor: tint }]} />
        <Icon name={ICON[current.type]} size={20} color={tint} />
        <Text variant="small" weight="semibold" style={styles.message} numberOfLines={3}>
          {current.message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: 16, right: 16, alignItems: "center", zIndex: 1000 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 520,
    width: "100%",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: "hidden",
  },
  stripe: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  message: { flex: 1 },
});
