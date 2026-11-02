import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { getErrorMessage } from "@/api/errors";
import type { AppNotification, NotificationType } from "@/api/types";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Avatar, Button, EmptyState, ErrorState, FeatherName, Icon, PressableScale, Screen, SkeletonList, TabHeader, Text } from "@/components/ui";
import { useNotificationActions, useNotifications } from "@/hooks/social";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/tokens";
import { timeAgo } from "@/utils/format";

const TYPE_ICON: Record<NotificationType, { icon: FeatherName; tone: "coral" | "mint" | "purple" | "sky" | "primary" }> = {
  like: { icon: "heart", tone: "coral" },
  comment: { icon: "message-circle", tone: "sky" },
  reply: { icon: "corner-up-left", tone: "sky" },
  follow: { icon: "user-plus", tone: "purple" },
  share: { icon: "share-2", tone: "primary" },
  post_approved: { icon: "check-circle", tone: "mint" },
  post_rejected: { icon: "x-circle", tone: "coral" },
};

export default function NotificationsScreen() {
  const status = useAuthStore((s) => s.status);

  return (
    <Screen>
      {status === "authed" ? (
        <Inbox />
      ) : (
        <>
          <TabHeader title="Alerts" />
          <SignInPrompt icon="bell" title="Stay in the loop" description="Sign in to see likes, comments, replies and new followers." />
        </>
      )}
    </Screen>
  );
}

function Inbox() {
  const router = useRouter();
  const { colors } = useTheme();
  const query = useNotifications();
  const { readAll, readOne, remove } = useNotificationActions();

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.notifications) ?? [], [query.data]);
  const unread = query.data?.pages[0]?.unreadCount ?? 0;

  const open = (n: AppNotification) => {
    if (!n.isRead) readOne.mutate(n._id);
    const postId = n.post?._id ?? n.comment?.post;
    if (n.type === "follow" && n.actor?._id) router.push({ pathname: "/profile/[userId]", params: { userId: n.actor._id } });
    else if (postId) {
      // Comment-type notifications land with the comments already open.
      const wantsComments = n.type === "comment" || n.type === "reply";
      router.push({ pathname: "/post/[id]", params: wantsComments ? { id: postId, comments: "1" } : { id: postId } });
    }
  };

  return (
    <>
      <TabHeader
        title="Alerts"
        subtitle={unread > 0 ? `${unread} unread` : "You're all caught up"}
        right={unread > 0 ? <Button title="Mark all read" size="sm" variant="soft" icon="check" onPress={() => readAll.mutate()} loading={readAll.isPending} /> : undefined}
      />
      <FlatList
        data={items}
        keyExtractor={(n) => n._id}
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} tintColor={colors.primary} />}
        onEndReachedThreshold={0.6}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={{ padding: 20 }} color={colors.primary} /> : undefined}
        ListEmptyComponent={
          query.isLoading ? (
            <View style={{ padding: 16 }}>
              <SkeletonList kind="row" count={6} />
            </View>
          ) : query.isError ? (
            <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
          ) : (
            <EmptyState icon="bell" title="No notifications yet" description="When someone likes, comments or follows you, it'll show up here." />
          )
        }
        renderItem={({ item }) => <Row n={item} onOpen={() => open(item)} onDelete={() => remove.mutate(item._id)} />}
      />
    </>
  );
}

function Row({ n, onOpen, onDelete }: { n: AppNotification; onOpen: () => void; onDelete: () => void }) {
  const { colors } = useTheme();
  const meta = TYPE_ICON[n.type] ?? TYPE_ICON.like;
  const tint = colors[meta.tone];

  return (
    <PressableScale
      onPress={onOpen}
      scaleTo={0.99}
      accessibilityRole="button"
      accessibilityLabel={`${n.isRead ? "" : "Unread. "}${n.message}`}
      style={[styles.row, { backgroundColor: n.isRead ? "transparent" : colors.primarySoft }]}
    >
      <View>
        <Avatar uri={n.actor?.profilePic?.url} name={n.actor?.username ?? "?"} size={46} />
        <View style={[styles.badge, { backgroundColor: tint, borderColor: colors.background }]}>
          <Icon name={meta.icon} size={11} color="#fff" />
        </View>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={3} weight={n.isRead ? "regular" : "semibold"}>
          {n.message}
        </Text>
        <Text variant="caption" tone="muted" weight="regular">
          {timeAgo(n.createdAt)}
        </Text>
      </View>
      {!n.isRead ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
      <Pressable onPress={onDelete} hitSlop={10} accessibilityRole="button" accessibilityLabel="Delete notification">
        <Icon name="x" size={16} color={colors.mutedForeground} />
      </Pressable>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.lg, marginHorizontal: 8 },
  badge: { position: "absolute", right: -3, bottom: -3, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  dot: { width: 9, height: 9, borderRadius: 5 },
});
