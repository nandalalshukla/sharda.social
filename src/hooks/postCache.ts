import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { FeedPage } from "@/api/social";
import type { Comment, Post, UserProfile } from "@/api/types";

/**
 * A post can be on screen in several caches at once — the home feed, a
 * profile's posts, its own detail page — and an edit made in one has to show
 * in all of them. These helpers patch every cache that might hold it.
 */
type FeedData = InfiniteData<FeedPage, number>;

const POST_LIST_KEYS = [["feed"], ["userPosts"]] as const;

export function patchPost(qc: QueryClient, postId: string, fn: (p: Post) => Post) {
  const mapPages = (data?: FeedData) =>
    data && {
      ...data,
      pages: data.pages.map((pg) => ({
        ...pg,
        posts: pg.posts.map((p) => (p._id === postId ? fn(p) : p)),
      })),
    };

  for (const key of POST_LIST_KEYS) {
    qc.setQueriesData<FeedData>({ queryKey: key }, mapPages);
  }
  qc.setQueryData<Post>(["post", postId], (p) => (p ? fn(p) : p));
}

export function removePost(qc: QueryClient, postId: string) {
  const strip = (data?: FeedData) =>
    data && {
      ...data,
      pages: data.pages.map((pg) => ({ ...pg, posts: pg.posts.filter((p) => p._id !== postId) })),
    };
  for (const key of POST_LIST_KEYS) {
    qc.setQueriesData<FeedData>({ queryKey: key }, strip);
  }
  qc.removeQueries({ queryKey: ["post", postId] });
}

/** Puts a freshly created post at the top of the feed it belongs to. */
export function prependPost(qc: QueryClient, post: Post) {
  qc.setQueriesData<FeedData>({ queryKey: ["feed", post.type] }, (data) => {
    if (!data || data.pages.length === 0) return data;
    const [first, ...rest] = data.pages;
    return { ...data, pages: [{ ...first, posts: [post, ...first.posts] }, ...rest] };
  });
  qc.invalidateQueries({ queryKey: ["userPosts"] });
}

/** Mirrors a follow/unfollow onto every place the author is shown. */
export function patchFollow(qc: QueryClient, userId: string, following: boolean) {
  const mapPages = (data?: FeedData) =>
    data && {
      ...data,
      pages: data.pages.map((pg) => ({
        ...pg,
        posts: pg.posts.map((p) =>
          p.author._id === userId ? { ...p, author: { ...p.author, isFollowedByCurrentUser: following } } : p,
        ),
      })),
    };
  for (const key of POST_LIST_KEYS) qc.setQueriesData<FeedData>({ queryKey: key }, mapPages);

  qc.setQueryData<UserProfile>(["profile", userId], (p) =>
    p
      ? {
          ...p,
          isFollowedByCurrentUser: following,
          stats: {
            ...p.stats,
            followersCount: Math.max(0, p.stats.followersCount + (following === p.isFollowedByCurrentUser ? 0 : following ? 1 : -1)),
          },
        }
      : p,
  );
}

export type CommentPage = { comments: Comment[]; pagination: { page: number; hasMore: boolean } };
export type CommentData = InfiniteData<CommentPage, number>;

/** Patches one comment wherever it is cached — top level or inside a reply list. */
export function patchComment(qc: QueryClient, commentId: string, fn: (c: Comment) => Comment) {
  qc.setQueriesData<CommentData>({ queryKey: ["comments"] }, (data) =>
    data && {
      ...data,
      pages: data.pages.map((pg) => ({
        ...pg,
        comments: pg.comments.map((c) => (c._id === commentId ? fn(c) : c)),
      })),
    },
  );
  qc.setQueriesData<InfiniteData<{ replies: Comment[] }, number>>({ queryKey: ["replies"] }, (data) =>
    data && {
      ...data,
      pages: data.pages.map((pg) => ({
        ...pg,
        replies: pg.replies.map((c) => (c._id === commentId ? fn(c) : c)),
      })),
    },
  );
}

export function bumpCommentCount(qc: QueryClient, postId: string, delta: number) {
  patchPost(qc, postId, (p) => ({ ...p, commentCount: Math.max(0, p.commentCount + delta) }));
}
