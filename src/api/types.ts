/**
 * Types for the Sharda Social backend. Kept in step with the website's
 * `lib/api/*` modules — the shapes are the backend's, not ours.
 */

export type Role = "user" | "mod" | "admin";

export interface Envelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

export interface PageInfo {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  hasMore: boolean;
}

export interface PrivacySettings {
  showEmail: boolean;
  showContactNo: boolean;
  showCourse: boolean;
}

export interface ProfilePic {
  url: string;
  publicId?: string | null;
}

/** The signed-in user, as login / verify-email / `GET /auth/me` return it. */
export interface AuthUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  profilePic?: ProfilePic | null;
  bio?: string;
  course?: string;
  contactNo?: string | null;
  privacy?: PrivacySettings;
  followersCount?: number;
  followingCount?: number;
  contributions?: number;
  isEmailVerified?: boolean;
  createdAt?: string;
}

/** What the server calls `id` on auth responses; we normalise it to `_id`. */
export type RawAuthUser = Omit<AuthUser, "_id"> & { id?: string; _id?: string };

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** A user as shown inside posts, comments, likes and follower lists. */
export interface PublicUser {
  _id: string;
  username: string;
  name?: string;
  email?: string | null;
  profilePic?: ProfilePic | null;
  avatar?: string;
  role?: string;
  isFollowedByCurrentUser?: boolean;
}

/**
 * `_id` is null on the stand-in author of an anonymous post — the id is the
 * one field that would unmask it, so the server withholds it.
 */
export type PostAuthor = Omit<PublicUser, "_id"> & { _id: string | null };

export type PostType =
  | "general"
  | "event"
  | "announcement"
  | "opportunity"
  | "lost_found";

export type PostModerationStatus = "approved" | "pending" | "rejected";
export type LostFoundKind = "lost" | "found";
export type LostFoundStatus = "open" | "resolved";
export type LostFoundCategory =
  | "electronics"
  | "documents"
  | "stationery"
  | "clothing"
  | "accessories"
  | "keys"
  | "wallet"
  | "id_card"
  | "other";

export interface LostFoundDetails {
  kind: LostFoundKind;
  itemName: string;
  category: LostFoundCategory;
  location: string;
  dateOccurred: string | null;
  contactInfo: string;
  status: LostFoundStatus;
  resolvedAt: string | null;
}

export interface Post {
  _id: string;
  type: PostType;
  content: string;
  author: PostAuthor;
  isAnonymous?: boolean;
  moderationStatus?: PostModerationStatus;
  rejectionReason?: string | null;
  lostFound?: LostFoundDetails | null;
  files?: string[];
  publicIds?: string[];
  likes: number;
  likedByCurrentUser?: boolean;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  text: string;
  author: PublicUser;
  post: string;
  parentComment?: string | null;
  likes: number;
  likedByCurrentUser?: boolean;
  /** Present on top-level comments when the API counts them. */
  replyCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "like"
  | "comment"
  | "reply"
  | "follow"
  | "share"
  | "post_approved"
  | "post_rejected";

export interface AppNotification {
  _id: string;
  type: NotificationType;
  actor: PublicUser;
  post?: { _id: string } | null;
  comment?: { _id: string; post: string } | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  username: string;
  email: string | null;
  bio: string;
  profilePic?: ProfilePic;
  course?: string | null;
  contactNo?: string | null;
  privacy?: PrivacySettings;
  role: string;
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    contributions: number;
  };
  isFollowedByCurrentUser: boolean;
  isOwnProfile: boolean;
}

export interface FollowStats {
  followerCount: number;
  followingCount: number;
  isFollowedByCurrentUser?: boolean;
}

export type ReportTargetType = "post" | "comment" | "user";
export type ReportReason =
  | "spam"
  | "harassment"
  | "hate"
  | "nudity"
  | "violence"
  | "fake_information"
  | "scam"
  | "other";

export interface CreateReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  message?: string;
}

/* ───────────────────────── Library ───────────────────────── */

export type ResourceKind = "notes" | "pyqs" | "syllabus";
export type ResourceStatus = "pending" | "approved" | "rejected";

export interface LibraryResource {
  _id: string;
  title: string;
  fileUrl: string;
  publicId: string;
  userId: { _id: string; username: string } | string;
  program: string;
  courseCode: string;
  courseName: string;
  semester: number;
  /** Academic year, e.g. "2024-25". Optional on syllabus. */
  year?: string;
  school?: string | null;
  status: ResourceStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PyqFilterOptions {
  programs: string[];
  schools: string[];
  years: string[];
  semesters: number[];
}

export interface SearchResult {
  _id: string;
  title: string;
  program: string;
  courseCode: string;
  courseName: string;
  year: string;
  semester: string | number;
  resourceType?: string;
  fileUrl?: string;
  userId?: { _id: string; username: string } | string;
  createdAt?: string;
}

export interface Contributor {
  _id: string;
  name: string;
  email: string | null;
  contributions: number;
  createdAt: string;
}

/* ──────────────────────── Moderation / admin ──────────────────────── */

export type ReportStatus = "pending" | "reviewed" | "resolved" | "rejected";
export type ReportAction =
  | "resolve"
  | "reject"
  | "delete_post"
  | "delete_comment"
  | "suspend_user"
  | "warn_user"
  | "delete_user";

export interface ReportUserSummary {
  _id: string;
  username?: string;
  profilePic?: { url?: string } | null;
  role?: string;
}

export interface ReportListItem {
  _id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  message?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  reporter?: ReportUserSummary | null;
  targetOwner?: ReportUserSummary | null;
  targetEntity?: {
    _id: string;
    content?: string;
    username?: string;
    isDeleted?: boolean;
    media?: { url?: string }[];
  } | null;
}

export interface PendingPost {
  _id: string;
  type: "event" | "announcement";
  content: string;
  author?: {
    _id: string;
    username?: string;
    profilePic?: { url?: string } | null;
    role?: string;
  } | null;
  isAnonymous?: boolean;
  files?: string[];
  createdAt?: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
  isEmailVerified?: boolean;
  contributions?: number;
  modRequest?: "pending" | "approved" | "rejected" | null;
  modMotivation?: string;
  modRequestAt?: string;
  contactNo?: string;
  createdAt: string;
}
