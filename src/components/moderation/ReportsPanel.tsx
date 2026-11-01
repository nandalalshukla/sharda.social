import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import type { ReportAction, ReportListItem, ReportStatus } from "@/api/types";
import { Badge, Button, Card, confirmDialog, Pills, Text } from "@/components/ui";
import { REPORT_REASONS } from "@/constants/postMeta";
import { useModActions, useReports } from "@/hooks/moderation";
import { timeAgo } from "@/utils/format";
import { PanelList } from "./PanelList";

type Filter = ReportStatus | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Dismissed" },
  { value: "all", label: "All" },
];

/** Actions offered per kind of report — and how serious each one is. */
const TARGET_ACTIONS: Record<ReportListItem["targetType"], { action: ReportAction; label: string; confirm: string }[]> = {
  post: [{ action: "delete_post", label: "Delete post", confirm: "Delete the reported post?" }],
  comment: [{ action: "delete_comment", label: "Delete comment", confirm: "Delete the reported comment?" }],
  user: [
    { action: "warn_user", label: "Warn user", confirm: "Send this user a warning?" },
    { action: "suspend_user", label: "Suspend", confirm: "Suspend this user's account?" },
    { action: "delete_user", label: "Delete user", confirm: "Permanently delete this user's account?" },
  ],
};

const statusVariant = { pending: "warning", reviewed: "info", resolved: "success", rejected: "neutral" } as const;

export function ReportsPanel() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("pending");
  const query = useReports(filter === "all" ? undefined : filter);
  const actions = useModActions();

  const reports = useMemo(() => query.data?.pages.flatMap((p) => p.reports) ?? [], [query.data]);

  const run = async (report: ReportListItem, action: ReportAction, confirmText?: string, destructive = false) => {
    if (confirmText) {
      const ok = await confirmDialog({ title: confirmText, message: "This also marks the report as handled.", confirmLabel: "Confirm", destructive });
      if (!ok) return;
    }
    actions.reportAction.mutate({ id: report._id, action });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingVertical: 8 }}>
        <Pills items={FILTERS} value={filter} onChange={setFilter} small />
      </View>
      <PanelList
        data={reports}
        keyExtractor={(r) => r._id}
        isLoading={query.isLoading}
        error={query.error}
        isRefreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => query.refetch()}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        isFetchingMore={query.isFetchingNextPage}
        emptyIcon="shield"
        emptyTitle={filter === "pending" ? "No open reports" : "No reports here"}
        emptyDescription="Reports from students will show up here."
        renderItem={(r) => {
          const reason = REPORT_REASONS.find((x) => x.value === r.reason)?.label ?? r.reason;
          const open = r.status === "pending";
          const target = r.targetEntity;
          return (
            <Card style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Badge label={r.targetType} variant="primary" />
                <Badge label={reason} variant="destructive" />
                <Badge label={r.status} variant={statusVariant[r.status]} />
                <Text variant="caption" tone="muted" weight="regular" style={{ marginLeft: "auto" }}>
                  {timeAgo(r.createdAt)}
                </Text>
              </View>

              <View style={{ gap: 4 }}>
                <Text variant="caption" tone="muted">
                  REPORTED {r.targetType.toUpperCase()}
                </Text>
                {target?.isDeleted ? (
                  <Text tone="muted">Already deleted</Text>
                ) : (
                  <Text numberOfLines={5}>{r.targetType === "user" ? `@${target?.username ?? "unknown"}` : (target?.content ?? "Content unavailable")}</Text>
                )}
              </View>

              {r.message ? (
                <Text variant="small" tone="muted">
                  “{r.message}”
                </Text>
              ) : null}
              <Text variant="small" tone="muted">
                Reported by {r.reporter?.username ? `@${r.reporter.username}` : "a student"}
                {r.targetOwner?.username ? ` · owner @${r.targetOwner.username}` : ""}
              </Text>

              {open ? (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {TARGET_ACTIONS[r.targetType].map((a) => (
                      <Button key={a.action} title={a.label} size="sm" variant="destructive" onPress={() => run(r, a.action, a.confirm, true)} />
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    <Button title="Resolve" icon="check" size="sm" onPress={() => run(r, "resolve")} />
                    <Button title="Dismiss" icon="x" size="sm" variant="secondary" onPress={() => run(r, "reject")} />
                    {r.targetOwner?._id ? (
                      <Button
                        title="Profile"
                        icon="user"
                        size="sm"
                        variant="ghost"
                        onPress={() => router.push({ pathname: "/profile/[userId]", params: { userId: r.targetOwner!._id } })}
                      />
                    ) : null}
                  </View>
                </View>
              ) : null}
            </Card>
          );
        }}
      />
    </View>
  );
}
