import { api } from "./client";
import type {
  Envelope,
  LibraryResource,
  PageInfo,
  PendingPost,
  ReportAction,
  ReportListItem,
  ReportStatus,
  ReportTargetType,
  ResourceKind,
} from "./types";

/** Moderator console — every route requires the `mod` or `admin` role. */

const PENDING_PATH: Record<ResourceKind, { path: string; key: string }> = {
  notes: { path: "/mod/notes/pending", key: "notes" },
  pyqs: { path: "/mod/pyqs/pending", key: "pyqs" },
  syllabus: { path: "/mod/syllabus/pending", key: "syllabus" },
};

export const getPendingResources = async (kind: ResourceKind) => {
  const { path, key } = PENDING_PATH[kind];
  const res = await api.get<Record<string, LibraryResource[]>>(path);
  return res.data[key] ?? [];
};

export const approveResource = (kind: ResourceKind, id: string) =>
  api.patch(`/mod/${kind}/${id}/approve`);

export const rejectResource = (kind: ResourceKind, id: string, rejectionReason?: string) =>
  api.patch(`/mod/${kind}/${id}/reject`, { rejectionReason });

export interface PendingPostsPage {
  posts: PendingPost[];
  pagination: PageInfo;
}

export const getPendingPosts = async () => {
  const res = await api.get<Envelope<PendingPostsPage>>("/mod/posts/pending");
  return res.data.data;
};

export const approvePost = (id: string) => api.patch(`/mod/posts/${id}/approve`);
export const rejectPost = (id: string, rejectionReason?: string) =>
  api.patch(`/mod/posts/${id}/reject`, { rejectionReason });

export interface ReportFilters {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  targetType?: ReportTargetType;
  sortOrder?: "asc" | "desc";
}

export const getReports = async (filters: ReportFilters = {}) => {
  const res = await api.get<
    Envelope<{ reports: ReportListItem[]; pagination: PageInfo }>
  >("/mod/reports", { params: filters });
  return res.data.data;
};

const REPORT_ACTION_PATH: Record<ReportAction, string> = {
  resolve: "resolve",
  reject: "reject",
  delete_post: "delete-post",
  delete_comment: "delete-comment",
  suspend_user: "suspend-user",
  warn_user: "warn-user",
  delete_user: "delete-user",
};

export const actOnReport = (reportId: string, action: ReportAction) =>
  api.patch(`/mod/reports/${reportId}/${REPORT_ACTION_PATH[action]}`);
