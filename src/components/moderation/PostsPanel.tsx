import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import type { PendingPost } from "@/api/types";
import { PostMedia } from "@/components/social/PostMedia";
import { Avatar, Badge, Button, Card, Text } from "@/components/ui";
import { postTypeMeta } from "@/constants/postMeta";
import { useModActions, usePendingPosts } from "@/hooks/moderation";
import { timeAgo } from "@/utils/format";
import { PanelList } from "./PanelList";
import { RejectSheet } from "./RejectSheet";

/** Events and announcements from general members, awaiting approval. */
export function PostsPanel() {
  const router = useRouter();
  const query = usePendingPosts();
  const actions = useModActions();
  const [rejecting, setRejecting] = useState<PendingPost | null>(null);

  return (
    <View style={{ flex: 1 }}>
      <PanelList
        data={query.data?.posts ?? []}
        keyExtractor={(p) => p._id}
        isLoading={query.isLoading}
        error={query.error}
        isRefreshing={query.isRefetching}
        onRefresh={() => query.refetch()}
        emptyIcon="check-circle"
        emptyTitle="No posts waiting"
        emptyDescription="Events and announcements from students will appear here for review."
        renderItem={(p) => {
          const meta = postTypeMeta[p.type];
          return (
            <Card style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Avatar uri={p.author?.profilePic?.url} name={p.author?.username} size={38} />
                <View style={{ flex: 1 }}>
                  <Text weight="bold">@{p.author?.username ?? "unknown"}</Text>
                  <Text variant="small" tone="muted">
                    {timeAgo(p.createdAt)}
                    {p.isAnonymous ? " · will post anonymously" : ""}
                  </Text>
                </View>
                <Badge label={meta.label} variant={meta.badge} icon={meta.icon} />
              </View>
              <Text>{p.content}</Text>
              <PostMedia files={p.files} />
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Button
                  title="Approve"
                  icon="check"
                  size="sm"
                  loading={actions.approvePost.isPending && actions.approvePost.variables === p._id}
                  onPress={() => actions.approvePost.mutate(p._id)}
                />
                <Button title="Reject" icon="x" size="sm" variant="destructive" onPress={() => setRejecting(p)} />
                {p.author?._id ? (
                  <Button
                    title="Author"
                    icon="user"
                    size="sm"
                    variant="ghost"
                    onPress={() => router.push({ pathname: "/profile/[userId]", params: { userId: p.author!._id } })}
                  />
                ) : null}
              </View>
            </Card>
          );
        }}
      />
      <RejectSheet
        visible={Boolean(rejecting)}
        title="Reject post"
        onClose={() => setRejecting(null)}
        loading={actions.rejectPost.isPending}
        onConfirm={(reason) => {
          if (!rejecting) return;
          actions.rejectPost.mutate({ id: rejecting._id, reason }, { onSuccess: () => setRejecting(null) });
        }}
      />
    </View>
  );
}
