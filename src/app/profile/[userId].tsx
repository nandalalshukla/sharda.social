import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { getErrorMessage } from "@/api/errors";
import type { UserProfile } from "@/api/types";
import { FeedList } from "@/components/social/FeedList";
import { RoleBadge } from "@/components/social/PostParts";
import { ReportSheet, ReportTarget } from "@/components/social/ReportSheet";
import { Avatar, Badge, Button, EmptyState, ErrorState, FeatherName, Icon, PressableScale, Skeleton, Text } from "@/components/ui";
import { usePostActions, useProfile, useUserPosts } from "@/hooks/social";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH, radius } from "@/theme/tokens";
import { compactNumber } from "@/utils/format";

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const requireAuth = useRequireAuth();
  const profile = useProfile(userId);
  const posts = useUserPosts(userId);
  const actions = usePostActions();
  const [report, setReport] = useState<ReportTarget | null>(null);

  const list = useMemo(() => posts.data?.pages.flatMap((p) => p.posts) ?? [], [posts.data]);
  const p = profile.data;

  if (profile.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ErrorState message={getErrorMessage(profile.error)} onRetry={() => profile.refetch()} />
      </View>
    );
  }

  const header = p ? (
    <ProfileHeader
      profile={p}
      onFollow={() => {
        if (!requireAuth("follow people")) return;
        actions.follow.mutate({ userId: p._id, next: !p.isFollowedByCurrentUser });
      }}
      following={actions.follow.isPending}
      onOpenConnections={(type) => router.push({ pathname: "/connections/[userId]", params: { userId: p._id, type } })}
      onEdit={() => router.push("/settings/edit-profile")}
    />
  ) : (
    <View style={{ padding: 16, gap: 14, alignItems: "center" }}>
      <Skeleton width={96} height={96} radius={48} />
      <Skeleton width="45%" height={20} />
      <Skeleton width="30%" height={14} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: p ? `@${p.username}` : "Profile",
          headerRight: () =>
            p && !p.isOwnProfile ? (
              <Pressable
                onPress={() => requireAuth("report people") && setReport({ type: "user", id: p._id, label: `@${p.username}` })}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Report user"
              >
                <Icon name="flag" size={20} color={colors.mutedForeground} />
              </Pressable>
            ) : null,
        }}
      />
      <View style={{ flex: 1, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" }}>
        <FeedList
          posts={list}
          isLoading={posts.isLoading}
          isRefreshing={(posts.isRefetching || profile.isRefetching) && !posts.isFetchingNextPage}
          isFetchingMore={posts.isFetchingNextPage}
          hasMore={Boolean(posts.hasNextPage)}
          error={posts.isError ? getErrorMessage(posts.error) : null}
          onRefresh={() => {
            profile.refetch();
            posts.refetch();
          }}
          onLoadMore={() => posts.fetchNextPage()}
          onRetry={() => posts.refetch()}
          header={header}
          empty={
            <EmptyState
              icon="edit-3"
              title={p?.isOwnProfile ? "You haven't posted yet" : "No posts yet"}
              description={p?.isOwnProfile ? "Share an update with the campus." : "When they post, it'll show up here."}
              actionLabel={p?.isOwnProfile ? "Create a post" : undefined}
              onAction={() => router.push("/compose")}
            />
          }
        />
      </View>
      <ReportSheet target={report} onClose={() => setReport(null)} />
    </View>
  );
}

function ProfileHeader({
  profile: p,
  onFollow,
  following,
  onOpenConnections,
  onEdit,
}: {
  profile: UserProfile;
  onFollow: () => void;
  following: boolean;
  onOpenConnections: (type: "followers" | "following") => void;
  onEdit: () => void;
}) {
  const { colors } = useTheme();

  const stats = [
    { label: "Posts", value: p.stats.postsCount },
    { label: "Followers", value: p.stats.followersCount, onPress: () => onOpenConnections("followers") },
    { label: "Following", value: p.stats.followingCount, onPress: () => onOpenConnections("following") },
    { label: "Contributions", value: p.stats.contributions },
  ];

  return (
    <View style={styles.header}>
      <Avatar uri={p.profilePic?.url} name={p.name || p.username} size={96} ring={colors.primary} />
      <View style={{ alignItems: "center", gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text variant="title">{p.name || p.username}</Text>
          <RoleBadge role={p.role} size={22} />
        </View>
        <Text tone="muted">@{p.username}</Text>
        {p.role === "mod" || p.role === "admin" ? <Badge label={p.role === "admin" ? "Admin" : "Moderator"} variant={p.role === "admin" ? "coral" : "primary"} /> : null}
      </View>

      {p.bio ? (
        <Text align="center" style={{ maxWidth: 420 }}>
          {p.bio}
        </Text>
      ) : null}

      <View style={styles.details}>
        {p.course ? <Detail icon="book-open" text={p.course} /> : null}
        {p.email ? <Detail icon="mail" text={p.email} /> : null}
        {p.contactNo ? <Detail icon="phone" text={p.contactNo} /> : null}
      </View>

      <View style={[styles.stats, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {stats.map((s) => (
          <PressableScale
            key={s.label}
            onPress={s.onPress}
            disabled={!s.onPress}
            scaleTo={0.94}
            accessibilityRole={s.onPress ? "button" : undefined}
            accessibilityLabel={`${s.value} ${s.label}`}
            style={styles.stat}
          >
            <Text variant="heading">{compactNumber(s.value)}</Text>
            <Text variant="caption" tone="muted">
              {s.label}
            </Text>
          </PressableScale>
        ))}
      </View>

      {p.isOwnProfile ? (
        <Button title="Edit profile" icon="edit-2" variant="secondary" onPress={onEdit} fullWidth />
      ) : (
        <Button
          title={p.isFollowedByCurrentUser ? "Following" : "Follow"}
          icon={p.isFollowedByCurrentUser ? "user-check" : "user-plus"}
          variant={p.isFollowedByCurrentUser ? "outline" : "primary"}
          onPress={onFollow}
          disabled={following}
          fullWidth
        />
      )}

      <Text variant="heading" style={{ alignSelf: "flex-start", marginTop: 8 }}>
        Posts
      </Text>
    </View>
  );
}

function Detail({ icon, text }: { icon: FeatherName; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Icon name={icon} size={15} color={colors.mutedForeground} />
      <Text variant="small" tone="muted" selectable>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: 14, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  details: { gap: 6, alignItems: "center" },
  stats: { flexDirection: "row", width: "100%", borderRadius: radius.xl, borderWidth: 1, paddingVertical: 12 },
  stat: { flex: 1, alignItems: "center", gap: 2 },
});
