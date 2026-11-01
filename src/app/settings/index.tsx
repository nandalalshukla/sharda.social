import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import * as authApi from "@/api/auth";
import { getErrorMessage } from "@/api/errors";
import { ThemePicker } from "@/components/ThemePicker";
import { confirmDialog, ListGroup, ListRow, Text, toast } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH } from "@/theme/tokens";

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const status = useAuthStore((s) => s.status);
  const signOut = useAuthStore((s) => s.signOut);
  const [busy, setBusy] = useState(false);
  const authed = status === "authed";

  const run = async (fn: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(success);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const signOutAll = async () => {
    const ok = await confirmDialog({
      title: "Sign out everywhere?",
      message: "You'll be signed out on every device, including this one.",
      confirmLabel: "Sign out everywhere",
      destructive: true,
    });
    if (!ok) return;
    await run(async () => {
      await authApi.logoutAll();
      await signOut();
    }, "Signed out of all devices");
  };

  const deactivate = async () => {
    const ok = await confirmDialog({
      title: "Deactivate your account?",
      message: "Your profile will be hidden and you'll be signed out. Contact support to reactivate it.",
      confirmLabel: "Deactivate",
      destructive: true,
    });
    if (!ok) return;
    await run(async () => {
      await authApi.deactivateAccount();
      await signOut();
    }, "Account deactivated");
  };

  const remove = async () => {
    const ok = await confirmDialog({
      title: "Delete your account permanently?",
      message: "Your profile, posts and comments will be erased. This cannot be undone.",
      confirmLabel: "Delete forever",
      destructive: true,
    });
    if (!ok) return;
    await run(async () => {
      await authApi.deleteAccount();
      await signOut();
    }, "Account deleted");
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ListGroup title="Appearance">
        <View style={{ padding: 12 }}>
          <ThemePicker />
        </View>
      </ListGroup>

      {authed ? (
        <>
          <ListGroup title="Profile & security">
            <ListRow icon="edit-2" label="Edit profile" onPress={() => router.push("/settings/edit-profile")} />
            <ListRow icon="lock" label="Change password" accent="sky" onPress={() => router.push("/settings/change-password")} />
            <ListRow icon="log-out" label="Sign out of all devices" accent="coral" onPress={signOutAll} />
          </ListGroup>

          <ListGroup title="Danger zone">
            <ListRow icon="pause-circle" label="Deactivate account" description="Hide your profile and sign out" destructive onPress={busy ? undefined : deactivate} />
            <ListRow icon="trash-2" label="Delete account" description="Permanently erase your data" destructive onPress={busy ? undefined : remove} />
          </ListGroup>
        </>
      ) : null}

      <ListGroup title="About">
        <ListRow icon="info" label="About Sharda Social" accent="purple" onPress={() => router.push("/about")} />
        <ListRow icon="smartphone" label="Version" hideChevron value={Constants.expoConfig?.version ?? "1.0.0"} />
      </ListGroup>

      <Text variant="caption" tone="muted" align="center" weight="regular">
        Sharda Social is a student-led initiative and not an official Sharda University service.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 22, paddingBottom: 40, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
});
