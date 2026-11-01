import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from "react-native-reanimated";
import type { Post } from "@/api/types";
import { Avatar, Badge, Card, confirmDialog, FeatherName, Icon, PressableScale, Sheet, Text } from "@/components/ui";
import { resolvePostTypeMeta } from "@/constants/postMeta";
import { usePostActions } from "@/hooks/social";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/theme/ThemeProvider";
import { compactNumber, timeAgo } from "@/utils/format";
import { shareLink } from "@/utils/files";
import { LikesSheet } from "./LikesSheet";
import { HeartBurst, LostFoundBlock, ModerationBanner, RoleBadge } from "./PostParts";
import { PostMedia } from "./PostMedia";
import { ReportSheet, ReportTarget } from "./ReportSheet";

const CLAMP_CHARS = 280;
const DOUBLE_TAP_MS = 280;

interface PostCardProps {
  post: Post;
  /** True on the post's own screen: no tap-through, full text. */
  detail?: boolean;
}

export const PostCard = memo(function PostCard({ post, detail = false }: PostCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const requireAuth = useRequireAuth();
  const viewerId = useAuthStore((s) => s.user?._id);
  const actions = usePostActions();

  const [expanded, setExpanded] = useState(detail);
  const [menuOpen, setMenuOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [report, setReport] = useState<ReportTarget | null>(null);
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);

  const authorId = post.author._id;
  const isAuthor = Boolean(viewerId && authorId && viewerId === authorId);
  const hideIdentity = Boolean(post.isAnonymous) && !isAuthor;
  const canOpenProfile = Boolean(authorId) && !hideIdentity;
  const name = hideIdentity ? "Anonymous" : post.author.username;
  const typeMeta = resolvePostTypeMeta(post.type);
  const published = (post.moderationStatus ?? "approved") === "approved";
  const liked = Boolean(post.likedByCurrentUser);
  const following = Boolean(post.author.isFollowedByCurrentUser);
  const isLong = post.content.length > CLAMP_CHARS;

  const openProfile = useCallback(() => {
    if (canOpenProfile && authorId) router.push({ pathname: "/profile/[userId]", params: { userId: authorId } });
  }, [canOpenProfile, authorId, router]);

  const openPost = useCallback(() => {
    if (!detail) router.push({ pathname: "/post/[id]", params: { id: post._id } });
  }, [detail, router, post._id]);

  const handleLike = useCallback(() => {
    if (!requireAuth("like posts")) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    actions.like(post);
  }, [requireAuth, actions, post]);

  // One tap opens the post; two quick taps like it, as people expect from a feed.
  const onBodyPress = useCallback(() => {
    if (detail) return;
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      if (published) {
        setBurst((b) => b + 1);
        if (!liked) handleLike();
      }
      return;
    }
    lastTap.current = now;
    setTimeout(() => {
      if (lastTap.current === now) {
        lastTap.current = 0;
        openPost();
      }
    }, DOUBLE_TAP_MS);
  }, [detail, published, liked, handleLike, openPost]);

  const handleShare = useCallback(() => {
    const preview = post.content.slice(0, 120).trim();
    shareLink(`${preview}${post.content.length > 120 ? "…" : ""}`, `/?postId=${post._id}`).catch(() => undefined);
  }, [post]);

  const handleDelete = async () => {
    setMenuOpen(false);
    const ok = await confirmDialog({
      title: "Delete this post?",
      message: "This can't be undone. Its comments and likes will be removed too.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (ok) actions.remove.mutate(post._id);
  };

  const handleFollow = () => {
    setMenuOpen(false);
    if (!requireAuth("follow people") || !authorId) return;
    actions.follow.mutate({ userId: authorId, next: !following });
  };

  const lf = post.lostFound;

  return (
    <Card padded={false} lift={1}>
      <View style={styles.pad}>
        <View style={styles.header}>
          <PressableScale
            onPress={openProfile}
            disabled={!canOpenProfile}
            scaleTo={0.97}
            accessibilityRole="button"
            accessibilityLabel={`Open ${name}'s profile`}
            style={styles.author}
          >
            <Avatar uri={hideIdentity ? null : (post.author.profilePic?.url ?? post.author.avatar)} name={name} size={42} />
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {hideIdentity ? name : `@${name}`}
                </Text>
                {hideIdentity ? null : <RoleBadge role={post.author.role} />}
              </View>
              <Text variant="small" tone="muted">
                {timeAgo(post.createdAt)}
                {post.isAnonymous && isAuthor ? " · posted anonymously" : ""}
              </Text>
            </View>
          </PressableScale>

          <View style={styles.headRight}>
            {post.type !== "general" ? <Badge label={typeMeta.label} variant={typeMeta.badge} icon={typeMeta.icon} /> : null}
            <Pressable
              onPress={() => setMenuOpen(true)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Post options"
              style={styles.menuBtn}
            >
              <Icon name="more-horizontal" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <ModerationBanner post={post} />

        <Pressable onPress={onBodyPress} accessibilityRole={detail ? undefined : "button"} accessibilityLabel={detail ? undefined : "Open post"} style={{ gap: 12 }}>
          {lf ? <LostFoundBlock post={post} /> : null}

          {post.content ? (
            <View>
              <Text numberOfLines={expanded ? undefined : 6} selectable={detail}>
                {post.content}
              </Text>
              {isLong && !expanded ? (
                <Pressable onPress={() => setExpanded(true)} hitSlop={8}>
                  <Text tone="primary" weight="semibold" style={{ marginTop: 4 }}>
                    Read more
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <PostMedia files={post.files} />
          <HeartBurst trigger={burst} />
        </Pressable>
      </View>

      {published ? (
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <LikeButton liked={liked} count={post.likes} onPress={handleLike} onCountPress={() => setLikesOpen(true)} />
          <ActionButton
            icon="message-circle"
            label={compactNumber(post.commentCount)}
            accessibilityLabel={`${post.commentCount} comments`}
            onPress={() => {
              if (detail) return;
              openPost();
            }}
          />
          <View style={{ flex: 1 }} />
          <ActionButton icon="share-2" accessibilityLabel="Share post" onPress={handleShare} />
        </View>
      ) : null}

      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)} title="Post options">
        {isAuthor ? (
          <>
            {lf ? (
              <MenuRow
                icon={lf.status === "resolved" ? "rotate-ccw" : "check-circle"}
                label={lf.status === "resolved" ? "Reopen on the board" : "Mark as resolved"}
                onPress={() => {
                  setMenuOpen(false);
                  actions.lostFound.mutate({ postId: post._id, status: lf.status === "resolved" ? "open" : "resolved" });
                }}
              />
            ) : null}
            <MenuRow
              icon="edit-2"
              label="Edit post"
              onPress={() => {
                setMenuOpen(false);
                router.push({ pathname: "/compose", params: { postId: post._id } });
              }}
            />
            <MenuRow icon="trash-2" label="Delete post" destructive onPress={handleDelete} />
          </>
        ) : (
          <>
            {canOpenProfile ? (
              <MenuRow icon={following ? "user-minus" : "user-plus"} label={following ? `Unfollow @${name}` : `Follow @${name}`} onPress={handleFollow} />
            ) : null}
            {published ? (
              <MenuRow
                icon="flag"
                label="Report post"
                onPress={() => {
                  setMenuOpen(false);
                  if (requireAuth("report content")) setReport({ type: "post", id: post._id, label: "post" });
                }}
              />
            ) : null}
            {canOpenProfile && authorId ? (
              <MenuRow
                icon="user-x"
                label={`Report @${name}`}
                destructive
                onPress={() => {
                  setMenuOpen(false);
                  if (requireAuth("report people")) setReport({ type: "user", id: authorId, label: `@${name}` });
                }}
              />
            ) : null}
          </>
        )}
      </Sheet>

      <LikesSheet postId={post._id} visible={likesOpen} onClose={() => setLikesOpen(false)} />
      <ReportSheet target={report} onClose={() => setReport(null)} />
    </Card>
  );
});

function LikeButton({
  liked,
  count,
  onPress,
  onCountPress,
}: {
  liked: boolean;
  count: number;
  onPress: () => void;
  onCountPress: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const first = useRef(true);

  // Pop when it becomes liked — by tap or double-tap — but not on first render.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (liked) scale.value = withSequence(withSpring(1.4, { damping: 5, stiffness: 300 }), withSpring(1, { damping: 8 }));
  }, [liked, scale]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const tint = liked ? "#ff3b5c" : colors.mutedForeground;

  return (
    <View style={styles.likeWrap}>
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={liked ? "Unlike" : "Like"}
        accessibilityState={{ selected: liked }}
        style={styles.likeIcon}
      >
        <Animated.View style={iconStyle}>
          <Icon name={liked ? "heart" : "heart-outline"} family="ion" size={23} color={tint} />
        </Animated.View>
      </Pressable>
      <Pressable onPress={onCountPress} hitSlop={8} disabled={count === 0} accessibilityLabel={`${count} likes. See who liked`}>
        <Text variant="small" weight="semibold" color={liked ? "#ff3b5c" : colors.mutedForeground}>
          {compactNumber(count)}
        </Text>
      </Pressable>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  accessibilityLabel,
}: {
  icon: FeatherName;
  label?: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} scaleTo={0.9} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={styles.action}>
      <Icon name={icon} size={21} color={colors.mutedForeground} />
      {label ? (
        <Text variant="small" weight="semibold" tone="muted">
          {label}
        </Text>
      ) : null}
    </PressableScale>
  );
}

function MenuRow({
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
    <PressableScale onPress={onPress} scaleTo={0.985} accessibilityRole="button" style={[styles.menuRow, { backgroundColor: colors.secondary }]}>
      <Icon name={icon} size={19} color={destructive ? colors.destructive : colors.foreground} />
      <Text weight="semibold" tone={destructive ? "destructive" : "default"}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  author: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  headRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  menuBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
  },
  likeWrap: { flexDirection: "row", alignItems: "center", gap: 4, paddingRight: 8 },
  likeIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  action: { flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: 10 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14 },
});
