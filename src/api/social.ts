import { api } from "./client";
import type { UploadFile } from "./auth";
import type {
  AppNotification,
  Comment,
  CreateReportInput,
  Envelope,
  FollowStats,
  LostFoundDetails,
  LostFoundStatus,
  PageInfo,
  Post,
  PostType,
  PublicUser,
  UserProfile,
} from "./types";

/* ───────────────────────────── Posts ───────────────────────────── */

export interface FeedPage {
  posts: Post[];
  currentPage: number;
  totalPages: number;
  total: number;
}

const toFeedPage = (d: {
  data: Post[];
  currentPage: number;
  totalPages: number;
  total: number;
}): FeedPage => ({
  posts: d.data ?? [],
  currentPage: d.currentPage,
  totalPages: d.totalPages,
  total: d.total,
});

export const getFeed = async (params: {
  page: number;
  limit?: number;
  type?: PostType;
  lostFoundStatus?: LostFoundStatus;
}) => {
  const res = await api.get<Envelope<Parameters<typeof toFeedPage>[0]>>("/social/feed", {
    params: { limit: 10, type: "general", ...params },
  });
  return toFeedPage(res.data.data);
};

export const getUserPosts = async (userId: string, page = 1, limit = 10) => {
  const res = await api.get<Envelope<Parameters<typeof toFeedPage>[0]>>(
    `/social/users/${userId}/posts`,
    { params: { page, limit } },
  );
  return toFeedPage(res.data.data);
};

export const getPost = async (postId: string) => {
  const res = await api.get<Envelope<{ post: Post }>>(`/social/posts/${postId}`);
  return res.data.data.post;
};

export interface PostInput {
  type: PostType;
  content: string;
  isAnonymous?: boolean;
  files?: UploadFile[];
  lostFound?: {
    kind?: string;
    itemName?: string;
    category?: string;
    location?: string;
    date?: string;
    contactInfo?: string;
  };
  /** Edit only: Cloudinary ids of attachments to drop. */
  removePublicIds?: string[];
}

/**
 * Posts travel as multipart (multer reads the files), so every scalar is a
 * string and the lost & found fields are sent flat — the shape the backend's
 * `createPostSchema` expects.
 */
export const buildPostForm = (input: PostInput) => {
  const form = new FormData();
  form.append("type", input.type);
  form.append("content", input.content);
  if (input.isAnonymous !== undefined) form.append("isAnonymous", String(input.isAnonymous));

  if (input.type === "lost_found" && input.lostFound) {
    const lf = input.lostFound;
    if (lf.kind) form.append("lostFoundKind", lf.kind);
    if (lf.itemName) form.append("lostFoundItemName", lf.itemName);
    if (lf.category) form.append("lostFoundCategory", lf.category);
    if (lf.location) form.append("lostFoundLocation", lf.location);
    if (lf.date) form.append("lostFoundDate", lf.date);
    if (lf.contactInfo) form.append("lostFoundContactInfo", lf.contactInfo);
  }
  if (input.removePublicIds?.length) {
    form.append("removePublicIds", JSON.stringify(input.removePublicIds));
  }
  input.files?.forEach((file) => form.append("files", file as unknown as Blob));
  return form;
};

const multipart = {
  headers: { "Content-Type": "multipart/form-data" },
  transformRequest: (d: unknown) => d,
  // Posts can carry video; give uploads longer than ordinary requests.
  timeout: 180_000,
};

export const createPost = async (
  input: PostInput,
  onProgress?: (fraction: number) => void,
) => {
  const res = await api.post<Envelope<{ post: Post }>>(
    "/social/posts",
    buildPostForm(input),
    {
      ...multipart,
      onUploadProgress: (e) => onProgress?.(e.total ? e.loaded / e.total : 0),
    },
  );
  return res.data.data.post;
};

export const editPost = async (postId: string, input: PostInput) => {
  const res = await api.patch<Envelope<{ post: Post }>>(
    `/social/posts/${postId}`,
    buildPostForm(input),
    multipart,
  );
  return res.data.data.post;
};

export const deletePost = (postId: string) => api.delete(`/social/posts/${postId}`);

export const updateLostFoundStatus = async (postId: string, status: LostFoundStatus) => {
  const res = await api.patch<Envelope<{ postId: string; lostFound: LostFoundDetails }>>(
    `/social/posts/${postId}/lost-found/status`,
    { status },
  );
  return res.data.data.lostFound;
};

/* ─────────────────────────── Comments ─────────────────────────── */

export const getComments = async (postId: string, page = 1, limit = 20) => {
  const res = await api.get<Envelope<{ comments: Comment[]; pagination: PageInfo }>>(
    `/social/posts/${postId}/comments`,
    { params: { page, limit } },
  );
  return res.data.data;
};

export const getReplies = async (postId: string, commentId: string, page = 1, limit = 10) => {
  const res = await api.get<Envelope<{ replies: Comment[]; pagination: PageInfo }>>(
    `/social/posts/${postId}/comments/${commentId}/replies`,
    { params: { page, limit } },
  );
  return res.data.data;
};

export const createComment = async (postId: string, text: string, parentComment?: string) => {
  const res = await api.post<Envelope<{ comment: Comment }>>(
    `/social/posts/${postId}/comments`,
    { text, parentComment },
  );
  return res.data.data.comment;
};

export const editComment = async (postId: string, commentId: string, text: string) => {
  const res = await api.patch<Envelope<{ comment: Comment }>>(
    `/social/posts/${postId}/comments/${commentId}`,
    { text },
  );
  return res.data.data.comment;
};

export const deleteComment = async (postId: string, commentId: string) => {
  const res = await api.delete<Envelope<{ deletedCount: number }>>(
    `/social/posts/${postId}/comments/${commentId}`,
  );
  return res.data.data;
};

/* ───────────────────── Likes, follows, profiles ───────────────────── */

export const toggleLike = async (targetId: string, targetType: "post" | "comment") => {
  const res = await api.post<
    Envelope<{ liked: boolean; likeCount?: number; likes?: number }>
  >("/social/likes/toggle", { targetId, targetType });
  const d = res.data.data;
  return { liked: d.liked, count: d.likeCount ?? d.likes };
};

export const getPostLikes = async (postId: string, page = 1, limit = 20) => {
  const res = await api.get<Envelope<{ likes: PublicUser[]; pagination: PageInfo }>>(
    `/social/posts/${postId}/likes`,
    { params: { page, limit } },
  );
  return res.data.data;
};

export const toggleFollow = async (userId: string) => {
  const res = await api.post<
    Envelope<{ following: boolean; followStats?: FollowStats }>
  >(`/social/users/${userId}/follow`, {});
  return res.data.data;
};

export interface UserListPage {
  users: PublicUser[];
  page: number;
  totalPages: number;
  total: number;
}

const userList = async (path: string, page: number, limit: number): Promise<UserListPage> => {
  const res = await api.get<
    Envelope<{ data: PublicUser[]; total: number; page: number; totalPages: number }>
  >(path, { params: { page, limit } });
  const d = res.data.data;
  return { users: d.data ?? [], page: d.page, totalPages: d.totalPages, total: d.total };
};

export const getFollowers = (userId: string, page = 1, limit = 20) =>
  userList(`/social/users/${userId}/followers`, page, limit);

export const getFollowing = (userId: string, page = 1, limit = 20) =>
  userList(`/social/users/${userId}/following`, page, limit);

export const getUserProfile = async (userId: string) => {
  const res = await api.get<Envelope<{ profile: UserProfile }>>(`/social/users/${userId}`);
  return res.data.data.profile;
};

/* ───────────────────────── Notifications ───────────────────────── */

export interface NotificationsPage {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: PageInfo;
}

export const getNotifications = async (page = 1, limit = 20) => {
  const res = await api.get<Envelope<NotificationsPage>>("/social/notifications", {
    params: { page, limit },
  });
  return res.data.data;
};

export const getUnreadCount = async () => {
  const res = await api.get<Envelope<{ unreadCount: number }>>(
    "/social/notifications/unread-count",
  );
  return res.data.data.unreadCount;
};

export const markAllNotificationsRead = () => api.patch("/social/notifications/read-all", {});
export const markNotificationRead = (id: string) =>
  api.patch(`/social/notifications/${id}/read`, {});
export const deleteNotification = (id: string) => api.delete(`/social/notifications/${id}`);

/* ─────────────────────────── Reports ─────────────────────────── */

export const createReport = (payload: CreateReportInput) =>
  api.post("/social/reports", payload);
