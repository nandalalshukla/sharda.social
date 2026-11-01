import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { getErrorMessage } from "@/api/errors";
import * as social from "@/api/social";
import type { Comment, LostFoundStatus, Post, PostType } from "@/api/types";
import { toast } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";
import { setLiked } from "./likeEngine";
import {
  bumpCommentCount,
  patchComment,
  patchFollow,
  patchPost,
  prependPost,
  removePost,
} from "./postCache";

/* ───────────────────────────── Queries ───────────────────────────── */

const PAGE = 10;

export function useFeed(type: PostType, lostFoundStatus?: LostFoundStatus) {
  // Part of the key, so a viewer who signs in or out never sees the other's cached feed.
  const viewerId = useAuthStore((s) => s.user?._id ?? "guest");
  return useInfiniteQuery({
    queryKey: ["feed", type, lostFoundStatus ?? "all", viewerId],
    queryFn: ({ pageParam }) =>
      social.getFeed({ page: pageParam, limit: PAGE, type, lostFoundStatus }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.currentPage < last.totalPages ? last.currentPage + 1 : undefined),
  });
}

export function useUserPosts(userId: string) {
  return useInfiniteQuery({
    queryKey: ["userPosts", userId],
    queryFn: ({ pageParam }) => social.getUserPosts(userId, pageParam, PAGE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.currentPage < last.totalPages ? last.currentPage + 1 : undefined),
    enabled: Boolean(userId),
  });
}

export const usePost = (postId: string) =>
  useQuery({ queryKey: ["post", postId], queryFn: () => social.getPost(postId), enabled: Boolean(postId) });

export const useProfile = (userId: string) =>
  useQuery({ queryKey: ["profile", userId], queryFn: () => social.getUserProfile(userId), enabled: Boolean(userId) });

export function useUserList(kind: "followers" | "following", userId: string) {
  const fetcher = kind === "followers" ? social.getFollowers : social.getFollowing;
  return useInfiniteQuery({
    queryKey: [kind, userId],
    queryFn: ({ pageParam }) => fetcher(userId, pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}

export function usePostLikes(postId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["likes", postId],
    queryFn: ({ pageParam }) => social.getPostLikes(postId, pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.hasMore ? last.pagination.page + 1 : undefined),
    enabled,
  });
}

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: ["comments", postId],
    queryFn: ({ pageParam }) => social.getComments(postId, pageParam, 15),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.hasMore ? last.pagination.page + 1 : undefined),
  });
}

export function useReplies(postId: string, commentId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["replies", commentId],
    queryFn: ({ pageParam }) => social.getReplies(postId, commentId, pageParam, 10),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.hasMore ? last.pagination.page + 1 : undefined),
    enabled,
  });
}

/* ──────────────────────────── Post actions ──────────────────────────── */

export function usePostActions() {
  const qc = useQueryClient();

  const like = useCallback(
    (post: Post) => {
      const desired = !post.likedByCurrentUser;
      const baseline = post.likes;
      return setLiked("post", post._id, Boolean(post.likedByCurrentUser), desired, {
        apply: (liked, count) =>
          patchPost(qc, post._id, (p) => ({
            ...p,
            likedByCurrentUser: liked,
            likes: count ?? Math.max(0, baseline + (liked ? 1 : 0) - (post.likedByCurrentUser ? 1 : 0)),
          })),
        rollback: (liked) =>
          patchPost(qc, post._id, (p) => ({ ...p, likedByCurrentUser: liked, likes: baseline })),
        onError: (e) => toast.error(getErrorMessage(e)),
      });
    },
    [qc],
  );

  const remove = useMutation({
    mutationFn: (postId: string) => social.deletePost(postId),
    onSuccess: (_d, postId) => {
      removePost(qc, postId);
      toast.success("Post deleted");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const lostFound = useMutation({
    mutationFn: ({ postId, status }: { postId: string; status: LostFoundStatus }) =>
      social.updateLostFoundStatus(postId, status),
    onSuccess: (lf, { postId, status }) => {
      patchPost(qc, postId, (p) => ({ ...p, lostFound: lf }));
      toast.success(status === "resolved" ? "Marked as resolved" : "Back on the board");
      // A status filter on the board means the post may now belong elsewhere.
      qc.invalidateQueries({ queryKey: ["feed", "lost_found"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const follow = useMutation({
    mutationFn: ({ userId }: { userId: string; next: boolean }) => social.toggleFollow(userId),
    onMutate: ({ userId, next }) => patchFollow(qc, userId, next),
    onSuccess: (res, { userId }) => patchFollow(qc, userId, res.following),
    onError: (e, { userId, next }) => {
      patchFollow(qc, userId, !next);
      toast.error(getErrorMessage(e));
    },
  });

  return { like, remove, lostFound, follow };
}

export function useSavePost(existing?: Post) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { input: social.PostInput; onProgress?: (f: number) => void }) =>
      existing
        ? social.editPost(existing._id, vars.input)
        : social.createPost(vars.input, vars.onProgress),
    onSuccess: (post) => {
      if (existing) patchPost(qc, post._id, () => post);
      else prependPost(qc, post);
    },
  });
}

/* ─────────────────────────── Comment actions ─────────────────────────── */

export function useCommentActions(postId: string) {
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: ({ text, parent }: { text: string; parent?: string }) =>
      social.createComment(postId, text, parent),
    onSuccess: (_c, { parent }) => {
      bumpCommentCount(qc, postId, 1);
      qc.invalidateQueries({ queryKey: parent ? ["replies", parent] : ["comments", postId] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const edit = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => social.editComment(postId, id, text),
    onSuccess: (comment) => {
      patchComment(qc, comment._id, (c) => ({ ...c, text: comment.text, updatedAt: comment.updatedAt }));
      toast.success("Comment updated");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: ({ id }: { id: string; parent?: string }) => social.deleteComment(postId, id),
    onSuccess: (res, { parent }) => {
      bumpCommentCount(qc, postId, -Math.max(1, res.deletedCount ?? 1));
      qc.invalidateQueries({ queryKey: parent ? ["replies", parent] : ["comments", postId] });
      toast.success("Comment deleted");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const like = useCallback(
    (comment: Comment) => {
      const desired = !comment.likedByCurrentUser;
      const baseline = comment.likes;
      return setLiked("comment", comment._id, Boolean(comment.likedByCurrentUser), desired, {
        apply: (liked, count) =>
          patchComment(qc, comment._id, (c) => ({
            ...c,
            likedByCurrentUser: liked,
            likes: count ?? Math.max(0, baseline + (liked ? 1 : 0) - (comment.likedByCurrentUser ? 1 : 0)),
          })),
        rollback: (liked) =>
          patchComment(qc, comment._id, (c) => ({ ...c, likedByCurrentUser: liked, likes: baseline })),
        onError: (e) => toast.error(getErrorMessage(e)),
      });
    },
    [qc],
  );

  return { add, edit, remove, like };
}

/* ───────────────────────────── Notifications ───────────────────────────── */

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam }) => social.getNotifications(pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.hasMore ? last.pagination.page + 1 : undefined),
  });
}

/**
 * The website pushes notifications over a server-sent-events stream; React
 * Native has no EventSource, so the app polls the cheap count endpoint while
 * it's in the foreground — the same fallback the website uses.
 */
export function useUnreadCount() {
  const authed = useAuthStore((s) => s.status === "authed");
  return useQuery({
    queryKey: ["unread"],
    queryFn: social.getUnreadCount,
    enabled: authed,
    refetchInterval: 45_000,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  });
}

export function useNotificationActions() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["unread"] });
  };

  const readAll = useMutation({
    mutationFn: social.markAllNotificationsRead,
    onMutate: () => qc.setQueryData(["unread"], 0),
    onSuccess: refresh,
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const readOne = useMutation({ mutationFn: social.markNotificationRead, onSuccess: refresh });
  const remove = useMutation({
    mutationFn: social.deleteNotification,
    onSuccess: refresh,
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return { readAll, readOne, remove };
}
