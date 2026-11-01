import { api } from "./client";
import type { AdminUser, Envelope, PageInfo, LibraryResource, ResourceKind, ResourceStatus } from "./types";

/** Admin console — every route requires the `admin` role. */

/** Bare arrays or `{ users }` / `{ mods }` depending on the route; accept both. */
const pickList = <T>(body: unknown, keys: string[]): T[] => {
  if (Array.isArray(body)) return body as T[];
  const b = body as Record<string, unknown> | undefined;
  for (const key of keys) {
    const direct = b?.[key];
    if (Array.isArray(direct)) return direct as T[];
    const nested = (b?.data as Record<string, unknown> | undefined)?.[key];
    if (Array.isArray(nested)) return nested as T[];
  }
  if (Array.isArray(b?.data)) return b!.data as T[];
  return [];
};

export const getUsers = async (scope: "all" | "active" | "inactive" = "all") => {
  const path = scope === "all" ? "/admin/users" : `/admin/users/${scope}`;
  const res = await api.get(path);
  return pickList<AdminUser>(res.data, ["users"]);
};

export const deleteUser = (id: string) => api.delete(`/admin/users/${id}`);
export const deactivateUser = (id: string) => api.patch(`/admin/users/${id}/deactivate`);
export const activateUser = (id: string) => api.patch(`/admin/users/${id}/activate`);

export const getMods = async () => {
  const res = await api.get("/admin/mods");
  return pickList<AdminUser>(res.data, ["mods"]);
};

export const getModRequests = async () => {
  const res = await api.get("/admin/mods/requests");
  return pickList<AdminUser>(res.data, ["mods", "requests"]);
};

export const reviewModRequest = (userId: string, action: "approve" | "reject") =>
  api.patch(`/admin/mods/review/${userId}`, { action });

export const removeModRole = (userId: string) => api.patch(`/admin/mods/remove/${userId}`);

/* ───────────── Content (notes / pyqs / syllabus, one parameterised set) ───────────── */

export type ContentStatusFilter = ResourceStatus | "all";

export interface ContentPage {
  items: LibraryResource[];
  pagination: PageInfo;
}

const LIST_KEY: Record<ResourceKind, string> = {
  notes: "notes",
  pyqs: "pyqs",
  syllabus: "syllabus",
};

export const listContent = async (
  type: ResourceKind,
  params: { status?: ContentStatusFilter; page?: number; limit?: number; query?: string; program?: string },
): Promise<ContentPage> => {
  const res = await api.get<Envelope<Record<string, unknown>>>(`/admin/content/${type}`, {
    params,
  });
  const data = res.data.data;
  return {
    items: (data[LIST_KEY[type]] as LibraryResource[]) ?? [],
    pagination: data.pagination as PageInfo,
  };
};

export const getContentCounts = async (type: ResourceKind) => {
  const res = await api.get<Envelope<{ counts: Record<string, number> }>>(
    `/admin/content/${type}/counts`,
  );
  return res.data.data.counts;
};

export const approveContent = (type: ResourceKind, id: string) =>
  api.patch(`/admin/content/${type}/${id}/approve`);

export const rejectContent = (type: ResourceKind, id: string, rejectionReason: string) =>
  api.patch(`/admin/content/${type}/${id}/reject`, { rejectionReason });

export const deleteContent = (type: ResourceKind, id: string) =>
  api.delete(`/admin/content/${type}/${id}`);
