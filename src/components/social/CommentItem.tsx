import { useRouter } from "expo-router";
import React, { memo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import type { Comment } from "@/api/types";
import { Avatar, confirmDialog, FeatherName, Icon, Sheet, Text, PressableScale } from "@/components/ui";
import { useCommentActions, useReplies } from "@/hooks/social";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/theme/ThemeProvider";
import { compactNumber, timeAgo } from "@/utils/format";
import { AnimatedHeart } from "./AnimatedHeart";
import { RoleBadge } from "./PostParts";
import { ReportSheet, ReportTarget } from "./ReportSheet";

/** Replies nest visually only this deep; deeper ones stay flat so text keeps its width. */
const MAX_INDENT = 2;

interface Props {
  comment: Comment;
  postId: string;
  depth?: number;
  parentId?: string;
  onReply: (comment: Comment) => void;
  onEdit: (comment: Comment) => void;
  /** Close the surrounding modal, then run `go` — so a pushed screen isn't hidden behind it. */
  onLeave?: (go: () => void) => void;
}

export const CommentItem = memo(function CommentItem({ comment, postId, depth = 0, parentId, onReply, onEdit, onLeave }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const requireAuthRaw = useRequireAuth();
  const authed = useAuthStore((s) => s.status === "authed");
  // Inside a modal a pushed sign-in screen would sit behind it, so leave first.
  const requireAuth = (reason: string) => {
    if (authed || !onLeave) return requireAuthRaw(reason);
    onLeave(() => requireAuthRaw(reason));
    return false;
  };
  const navigate = (go: () => void) => (onLeave ? onLeave(go) : go());
  const viewerId = useAuthStore((s) => s.user?._id);
  const actions = useCommentActions(postId);

  const [showReplies, setShowReplies] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [report, setReport] = useState<ReportTarget | null>(null);
  const replies = useReplies(postId, comment._id, showReplies);
  const replyList = replies.data?.pages.flatMap((p) => p.replies) ?? [];

  const isAuthor = Boolean(viewerId && viewerId === comment.author._id);
  const liked = Boolean(comment.likedByCurrentUser);

  const remove = async () => {
    setMenuOpen(false);
    const ok = await confirmDialog({
      title: "Delete this comment?",
      message: "Replies to it will be removed as well.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (ok) actions.remove.mutate({ id: comment._id, parent: parentId });
  };

  return (
    <View style={[styles.row, depth > 0 && { marginLeft: Math.min(depth, MAX_INDENT) * 18 }]}>
      <Pressable
        onPress={() => navigate(() => router.push({ pathname: "/profile/[userId]", params: { userId: comment.author._id } }))}
        accessibilityRole="button"
        accessibilityLabel={`Open ${comment.author.username}'s profile`}
      >
        <Avatar uri={comment.author.profilePic?.url} name={comment.author.username} size={depth > 0 ? 30 : 36} />
      </Pressable>

      <View style={{ flex: 1, gap: 4 }}>
        <View style={[styles.bubble, { backgroundColor: colors.secondary }]}>
          <View style={styles.nameRow}>
            <Text variant="small" weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
              @{comment.author.username}
            </Text>
            <RoleBadge role={comment.author.role} />
            <Text variant="caption" tone="muted" weight="regular">
              {timeAgo(comment.createdAt)}
              {comment.updatedAt !== comment.createdAt && new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 2000
                ? " · edited"
                : ""}
            </Text>
          </View>
          <Text selectable>{comment.text}</Text>
        </View>

        <View style={styles.actions}>
          <View style={styles.action}>
            <AnimatedHeart
              liked={liked}
              size={17}
              onPress={() => requireAuth("like comments") && actions.like(comment)}
              accessibilityLabel={liked ? "Unlike comment" : "Like comment"}
            />
            {comment.likes > 0 ? (
              <Text variant="caption" color={liked ? "#ff2d55" : colors.mutedForeground} style={{ marginLeft: -6 }}>
                {compactNumber(comment.likes)}
              </Text>
            ) : null}
          </View>

          <Pressable onPress={() => requireAuth("reply") && onReply(comment)} hitSlop={8} accessibilityRole="button" style={styles.action}>
            <Text variant="caption" tone="muted">
              Reply
            </Text>
          </Pressable>

          <Pressable onPress={() => setShowReplies((s) => !s)} hitSlop={8} accessibilityRole="button" style={styles.action}>
            <Text variant="caption" tone="primary">
              {showReplies ? "Hide replies" : "View replies"}
            </Text>
          </Pressable>

          <View style={{ flex: 1 }} />
          <Pressable onPress={() => setMenuOpen(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Comment options">
            <Icon name="more-horizontal" size={17} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {showReplies ? (
          <View style={{ gap: 10, marginTop: 4 }}>
            {replies.isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: "flex-start" }} />
            ) : replyList.length === 0 ? (
              <Text variant="small" tone="muted">
                No replies yet
              </Text>
            ) : (
              replyList.map((r) => (
                <CommentItem key={r._id} comment={r} postId={postId} depth={depth + 1} parentId={comment._id} onReply={onReply} onEdit={onEdit} onLeave={onLeave} />
              ))
            )}
            {replies.hasNextPage ? (
              <PressableScale onPress={() => replies.fetchNextPage()} style={{ alignSelf: "flex-start" }}>
                <Text variant="small" tone="primary" weight="semibold">
                  {replies.isFetchingNextPage ? "Loading…" : "Show more replies"}
                </Text>
              </PressableScale>
            ) : null}
          </View>
        ) : null}
      </View>

      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)} title="Comment options">
        {isAuthor ? (
          <>
            <MenuItem
              icon="edit-2"
              label="Edit comment"
              onPress={() => {
                setMenuOpen(false);
                onEdit(comment);
              }}
            />
            <MenuItem icon="trash-2" label="Delete comment" destructive onPress={remove} />
          </>
        ) : (
          <MenuItem
            icon="flag"
            label="Report comment"
            onPress={() => {
              setMenuOpen(false);
              if (requireAuth("report content")) setReport({ type: "comment", id: comment._id, label: "comment" });
            }}
          />
        )}
      </Sheet>
      <ReportSheet target={report} onClose={() => setReport(null)} />
    </View>
  );
});

function MenuItem({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: FeatherName;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} scaleTo={0.985} style={[styles.menu, { backgroundColor: colors.secondary }]} accessibilityRole="button">
      <Icon name={icon} size={19} color={destructive ? colors.destructive : colors.foreground} />
      <Text weight="semibold" tone={destructive ? "destructive" : "default"}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  bubble: { borderRadius: 16, borderTopLeftRadius: 4, paddingHorizontal: 12, paddingVertical: 9, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  actions: { flexDirection: "row", alignItems: "center", gap: 16, paddingLeft: 6 },
  action: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 22 },
  menu: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14 },
});
