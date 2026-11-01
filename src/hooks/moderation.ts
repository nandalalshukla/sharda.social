import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as admin from "@/api/admin";
import { getErrorMessage } from "@/api/errors";
import * as mod from "@/api/moderation";
import type { ReportAction, ReportStatus, ResourceKind } from "@/api/types";
import { toast } from "@/components/ui";

/* ───────────────────────── Moderator ───────────────────────── */

export const usePendingResources = (kind: ResourceKind, enabled = true) =>
  useQuery({ queryKey: ["mod", "pending", kind], queryFn: () => mod.getPendingResources(kind), enabled });

export const usePendingPosts = (enabled = true) =>
  useQuery({ queryKey: ["mod", "posts"], queryFn: mod.getPendingPosts, enabled });

export function useReports(status: ReportStatus | undefined, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["mod", "reports", status ?? "all"],
    queryFn: ({ pageParam }) => mod.getReports({ status, page: pageParam, limit: 20, sortOrder: "desc" }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.hasMore ? last.pagination.page + 1 : undefined),
    enabled,
  });
}

export function useModActions() {
  const qc = useQueryClient();
  const fail = (e: unknown) => toast.error(getErrorMessage(e));

  const approveResource = useMutation({
    mutationFn: ({ kind, id }: { kind: ResourceKind; id: string }) => mod.approveResource(kind, id),
    onSuccess: (_d, { kind }) => {
      qc.invalidateQueries({ queryKey: ["mod", "pending", kind] });
      qc.invalidateQueries({ queryKey: ["library"] });
      toast.success("Approved — it's live in the library");
    },
    onError: fail,
  });

  const rejectResource = useMutation({
    mutationFn: ({ kind, id, reason }: { kind: ResourceKind; id: string; reason: string }) =>
      mod.rejectResource(kind, id, reason),
    onSuccess: (_d, { kind }) => {
      qc.invalidateQueries({ queryKey: ["mod", "pending", kind] });
      toast.success("Rejected — the uploader has been told why");
    },
    onError: fail,
  });

  const approvePost = useMutation({
    mutationFn: (id: string) => mod.approvePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mod", "posts"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Post approved");
    },
    onError: fail,
  });

  const rejectPost = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => mod.rejectPost(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mod", "posts"] });
      toast.success("Post rejected");
    },
    onError: fail,
  });

  const reportAction = useMutation({
    mutationFn: ({ id, action }: { id: string; action: ReportAction }) => mod.actOnReport(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mod", "reports"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Done");
    },
    onError: fail,
  });

  return { approveResource, rejectResource, approvePost, rejectPost, reportAction };
}

/* ─────────────────────────── Admin ─────────────────────────── */

export const useAdminUsers = (scope: "all" | "active" | "inactive", enabled = true) =>
  useQuery({ queryKey: ["admin", "users", scope], queryFn: () => admin.getUsers(scope), enabled });

export const useAdminMods = (enabled = true) =>
  useQuery({ queryKey: ["admin", "mods"], queryFn: admin.getMods, enabled });

export const useModRequests = (enabled = true) =>
  useQuery({ queryKey: ["admin", "requests"], queryFn: admin.getModRequests, enabled });

export function useAdminContent(type: ResourceKind, status: admin.ContentStatusFilter, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["admin", "content", type, status],
    queryFn: ({ pageParam }) => admin.listContent(type, { status, page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.hasMore ? last.pagination.page + 1 : undefined),
    enabled,
  });
}

export const useContentCounts = (type: ResourceKind, enabled = true) =>
  useQuery({ queryKey: ["admin", "counts", type], queryFn: () => admin.getContentCounts(type), enabled });

export function useAdminActions() {
  const qc = useQueryClient();
  const fail = (e: unknown) => toast.error(getErrorMessage(e));
  const refreshUsers = () => {
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
    qc.invalidateQueries({ queryKey: ["admin", "mods"] });
    qc.invalidateQueries({ queryKey: ["admin", "requests"] });
  };
  const refreshContent = () => {
    qc.invalidateQueries({ queryKey: ["admin", "content"] });
    qc.invalidateQueries({ queryKey: ["admin", "counts"] });
    qc.invalidateQueries({ queryKey: ["library"] });
  };

  return {
    setUserActive: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) => (active ? admin.activateUser(id) : admin.deactivateUser(id)),
      onSuccess: (_d, { active }) => {
        refreshUsers();
        toast.success(active ? "Account activated" : "Account deactivated");
      },
      onError: fail,
    }),
    deleteUser: useMutation({
      mutationFn: (id: string) => admin.deleteUser(id),
      onSuccess: () => {
        refreshUsers();
        toast.success("User deleted");
      },
      onError: fail,
    }),
    removeMod: useMutation({
      mutationFn: (id: string) => admin.removeModRole(id),
      onSuccess: () => {
        refreshUsers();
        toast.success("Moderator role removed");
      },
      onError: fail,
    }),
    reviewRequest: useMutation({
      mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) => admin.reviewModRequest(id, action),
      onSuccess: (_d, { action }) => {
        refreshUsers();
        toast.success(action === "approve" ? "Moderator approved" : "Request rejected");
      },
      onError: fail,
    }),
    approveContent: useMutation({
      mutationFn: ({ type, id }: { type: ResourceKind; id: string }) => admin.approveContent(type, id),
      onSuccess: () => {
        refreshContent();
        toast.success("Approved");
      },
      onError: fail,
    }),
    rejectContent: useMutation({
      mutationFn: ({ type, id, reason }: { type: ResourceKind; id: string; reason: string }) => admin.rejectContent(type, id, reason),
      onSuccess: () => {
        refreshContent();
        toast.success("Rejected");
      },
      onError: fail,
    }),
    deleteContent: useMutation({
      mutationFn: ({ type, id }: { type: ResourceKind; id: string }) => admin.deleteContent(type, id),
      onSuccess: () => {
        refreshContent();
        toast.success("Deleted");
      },
      onError: fail,
    }),
  };
}
