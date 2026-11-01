import { useRouter } from "expo-router";
import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import type { PublicUser } from "@/api/types";
import { Avatar, PressableScale, Text } from "@/components/ui";
import { RoleBadge } from "./PostParts";

export const UserRow = memo(function UserRow({ user }: { user: PublicUser }) {
  const router = useRouter();
  return (
    <PressableScale
      scaleTo={0.99}
      onPress={() => router.push({ pathname: "/profile/[userId]", params: { userId: user._id } })}
      accessibilityRole="button"
      accessibilityLabel={`Open ${user.username}'s profile`}
      style={styles.row}
    >
      <Avatar uri={user.profilePic?.url ?? user.avatar} name={user.username} size={46} />
      <View style={{ flex: 1 }}>
        <View style={styles.name}>
          <Text weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
            @{user.username}
          </Text>
          <RoleBadge role={user.role} />
        </View>
        {user.name || user.email ? (
          <Text variant="small" tone="muted" numberOfLines={1}>
            {user.name ?? user.email}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  name: { flexDirection: "row", alignItems: "center", gap: 5 },
});
