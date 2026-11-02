import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { RoleBadge } from "@/components/social/PostParts";
import { ThemePicker } from "@/components/ThemePicker";
import { Avatar, Badge, Button, confirmDialog, ListGroup, ListRow, PressableScale, Screen, TabHeader, Text } from "@/components/ui";
import { SignInPrompt } from "@/components/SignInPrompt";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/tokens";
import { compactNumber } from "@/utils/format";

export default function MeScreen() {
  const status = useAuthStore((s) => s.status);
  return <Screen>{status === "authed" ? <Account /> : <GuestAccount />}</Screen>;
}

function GuestAccount() {
  const router = useRouter();
  return (
    <>
      <TabHeader title="Me" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ height: 360 }}>
          <SignInPrompt icon="user" title="Join Sharda Social" description="Create a profile, share study material and connect with students across campus." />
        </View>
        <ListGroup title="Appearance">
          <View style={{ padding: 12 }}>
            <ThemePicker />
          </View>
        </ListGroup>
        <ListGroup title="More">
          <ListRow icon="award" label="Top contributors" accent="coral" onPress={() => router.push("/contributors")} />
          <ListRow icon="info" label="About Sharda Social" accent="sky" onPress={() => router.push("/about")} />
        </ListGroup>
      </ScrollView>
    </>
  );
}

function Account() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const user = useAuthStore((s) => s.user)!;
  const signOut = useAuthStore((s) => s.signOut);

  const isMod = user.role === "mod" || user.role === "admin";
  const isAdmin = user.role === "admin";

  const confirmSignOut = async () => {
    const ok = await confirmDialog({ title: "Sign out?", message: "You can sign back in any time.", confirmLabel: "Sign out", destructive: true });
    if (ok) await signOut();
  };

  return (
    <>
      <TabHeader title="Me" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(420)}>
          <PressableScale
            scaleTo={0.985}
            onPress={() => router.push({ pathname: "/profile/[userId]", params: { userId: user._id } })}
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
          >
            <LinearGradient
              colors={isDark ? ["#2a2560", "#191726"] : ["#e0e4ff", "#fdeee4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, { borderColor: colors.border }]}
            >
              <Avatar uri={user.profilePic?.url} name={user.name || user.username} size={72} ring={colors.primary} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text variant="heading" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {user.name}
                  </Text>
                  <RoleBadge role={user.role} size={19} />
                </View>
                <Text tone="muted">@{user.username}</Text>
                <View style={{ flexDirection: "row", gap: 14, marginTop: 4 }}>
                  <Stat value={user.contributions ?? 0} label="uploads" />
                  <Stat value={user.followersCount ?? 0} label="followers" />
                  <Stat value={user.followingCount ?? 0} label="following" />
                </View>
              </View>
            </LinearGradient>
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(420)} style={{ gap: 20 }}>
          <ListGroup title={isAdmin ? "Dashboards" : isMod ? "Dashboards" : "Your space"}>
            <ListRow icon="folder" label="My uploads" description="Notes, papers and syllabus you've shared" accent="mint" onPress={() => router.push("/my-uploads")} />
            <ListRow icon="upload-cloud" label="Share study material" accent="primary" onPress={() => router.push("/upload")} />
            {isMod ? (
              <ListRow icon="shield" label="Moderator dashboard" description="Review submissions, posts and reports" accent="coral" onPress={() => router.push("/mod")} />
            ) : null}
            {isAdmin ? (
              <ListRow icon="settings" label="Admin dashboard" description="Users, moderators and content" accent="purple" onPress={() => router.push("/admin")} />
            ) : null}
          </ListGroup>

          <ListGroup title="Account">
            <ListRow icon="edit-2" label="Edit profile" onPress={() => router.push("/settings/edit-profile")} />
            <ListRow icon="lock" label="Change password" accent="sky" onPress={() => router.push("/settings/change-password")} />
            {user.role === "user" ? (
              <ListRow icon="award" label="Become a moderator" description="Help keep the library accurate" accent="coral" onPress={() => router.push("/settings/request-mod")} />
            ) : null}
          </ListGroup>

          <ListGroup title="Appearance">
            <View style={{ padding: 12 }}>
              <ThemePicker />
            </View>
          </ListGroup>

          <ListGroup title="More">
            <ListRow icon="trending-up" label="Top contributors" accent="coral" onPress={() => router.push("/contributors")} />
            <ListRow icon="settings" label="Settings" accent="sky" onPress={() => router.push("/settings")} />
            <ListRow icon="info" label="About Sharda Social" accent="purple" onPress={() => router.push("/about")} />
          </ListGroup>

          <Button title="Sign out" icon="log-out" variant="outline" fullWidth onPress={confirmSignOut} />
          {user.isEmailVerified === false ? <Badge label="Email not verified" variant="warning" /> : null}
        </Animated.View>
      </ScrollView>
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View>
      <Text weight="bold">{compactNumber(value)}</Text>
      <Text variant="caption" tone="muted" weight="regular">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  card: { flexDirection: "row", alignItems: "center", gap: 16, padding: 18, borderRadius: radius["2xl"], borderWidth: StyleSheet.hairlineWidth * 2 },
});
