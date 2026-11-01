import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";
import { elevation, radius } from "@/theme/tokens";
import { Button } from "./Button";
import { waitForModalsToSettle } from "./modalGate";
import { Text } from "./Text";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive. */
  destructive?: boolean;
}

interface Pending extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

let show: ((p: Pending) => void) | null = null;

/**
 * Promise-based replacement for `Alert.alert` — themed, and works the same on
 * both platforms. Resolves true on confirm, false on cancel or back.
 */
export const confirmDialog = async (options: ConfirmOptions) => {
  // A sheet that just closed (e.g. the menu this was chosen from) must finish
  // leaving first, or iOS drops the dialog.
  await waitForModalsToSettle();
  return new Promise<boolean>((resolve) => {
    if (!show) return resolve(false);
    show({ ...options, resolve });
  });
};

export function DialogHost() {
  const { colors } = useTheme();
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    show = setPending;
    return () => {
      show = null;
    };
  }, []);

  const finish = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  if (!pending) return null;

  return (
    <Modal transparent animationType="none" visible onRequestClose={() => finish(false)} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(160)} style={[styles.scrim, { backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => finish(false)} accessibilityLabel="Dismiss" />
        <Animated.View
          entering={ZoomIn.duration(200)}
          style={[styles.dialog, { backgroundColor: colors.card }, elevation(3, colors.shadow)]}
          accessibilityViewIsModal
        >
          <Text variant="heading">{pending.title}</Text>
          {pending.message ? <Text tone="muted">{pending.message}</Text> : null}
          <View style={styles.actions}>
            <Button
              title={pending.cancelLabel ?? "Cancel"}
              variant="secondary"
              onPress={() => finish(false)}
              style={styles.action}
            />
            <Button
              title={pending.confirmLabel ?? "Confirm"}
              variant={pending.destructive ? "destructive" : "primary"}
              onPress={() => finish(true)}
              style={styles.action}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  dialog: { width: "100%", maxWidth: 400, borderRadius: radius["2xl"], padding: 22, gap: 10 },
  actions: { flexDirection: "row", gap: 10, marginTop: 10 },
  action: { flex: 1, alignSelf: "stretch" },
});
