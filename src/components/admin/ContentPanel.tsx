import React, { useMemo, useState } from "react";
import { View } from "react-native";
import type { ContentStatusFilter } from "@/api/admin";
import { getErrorMessage } from "@/api/errors";
import type { LibraryResource, ResourceKind } from "@/api/types";
import { PanelList } from "@/components/moderation/PanelList";
import { RejectSheet } from "@/components/moderation/RejectSheet";
import { Badge, Button, Card, confirmDialog, Pills, Text, toast } from "@/components/ui";
import { KIND_META, KIND_ORDER } from "@/constants/library";
import { useAdminActions, useAdminContent, useContentCounts } from "@/hooks/moderation";
import { openDocument } from "@/utils/files";
import { formatDate, ordinal, uploaderName } from "@/utils/format";

const STATUS_VARIANT = { approved: "success", pending: "warning", rejected: "destructive" } as const;

/** Every upload at every status — approve, reject or remove outright. */
export function ContentPanel() {
  const [type, setType] = useState<ResourceKind>("pyqs");
  const [status, setStatus] = useState<ContentStatusFilter>("pending");
  const [rejecting, setRejecting] = useState<LibraryResource | null>(null);

  const query = useAdminContent(type, status);
  const counts = useContentCounts(type);
  const actions = useAdminActions();
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);

  const remove = async (r: LibraryResource) => {
    const ok = await confirmDialog({ title: "Delete this upload?", message: "It's removed from the library and its file is deleted.", confirmLabel: "Delete", destructive: true });
    if (ok) actions.deleteContent.mutate({ type, id: r._id });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: 8, gap: 6 }}>
        <Pills items={KIND_ORDER.map((k) => ({ value: k, label: KIND_META[k].title }))} value={type} onChange={setType} accent={KIND_META[type].accent} small />
        <Pills
          items={[
            { value: "pending" as ContentStatusFilter, label: "Pending", count: counts.data?.pending },
            { value: "approved" as ContentStatusFilter, label: "Approved", count: counts.data?.approved },
            { value: "rejected" as ContentStatusFilter, label: "Rejected", count: counts.data?.rejected },
            { value: "all" as ContentStatusFilter, label: "All", count: counts.data?.all },
          ]}
          value={status}
          onChange={setStatus}
          small
        />
      </View>

      <PanelList
        data={items}
        keyExtractor={(r) => r._id}
        isLoading={query.isLoading}
        error={query.error}
        isRefreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => {
          query.refetch();
          counts.refetch();
        }}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        isFetchingMore={query.isFetchingNextPage}
        emptyIcon="folder"
        emptyTitle="Nothing here"
        emptyDescription={`No ${status === "all" ? "" : status + " "}${KIND_META[type].title.toLowerCase()}.`}
        renderItem={(r) => (
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
              <Text weight="bold" style={{ flex: 1 }} numberOfLines={2}>
                {r.title}
              </Text>
              <Badge label={r.status} variant={STATUS_VARIANT[r.status]} />
            </View>
            <Text variant="small" tone="muted">
              {r.courseCode} · {ordinal(r.semester)} sem{r.year ? ` · ${r.year}` : ""} · {r.program}
            </Text>
            <Text variant="caption" tone="muted" weight="regular">
              {uploaderName(r.userId) ? `by @${uploaderName(r.userId)} · ` : ""}
              {formatDate(r.createdAt)}
              {r.status === "rejected" && r.rejectionReason ? ` · ${r.rejectionReason}` : ""}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Button title="View" icon="eye" size="sm" variant="outline" onPress={() => openDocument(r.fileUrl).catch((e) => toast.error(getErrorMessage(e)))} />
              {r.status !== "approved" ? <Button title="Approve" icon="check" size="sm" onPress={() => actions.approveContent.mutate({ type, id: r._id })} /> : null}
              {r.status !== "rejected" ? <Button title="Reject" icon="x" size="sm" variant="secondary" onPress={() => setRejecting(r)} /> : null}
              <Button title="Delete" icon="trash-2" size="sm" variant="ghost" onPress={() => remove(r)} />
            </View>
          </Card>
        )}
      />

      <RejectSheet
        visible={Boolean(rejecting)}
        title="Reject upload"
        onClose={() => setRejecting(null)}
        loading={actions.rejectContent.isPending}
        onConfirm={(reason) => {
          if (!rejecting) return;
          actions.rejectContent.mutate({ type, id: rejecting._id, reason }, { onSuccess: () => setRejecting(null) });
        }}
      />
    </View>
  );
}
