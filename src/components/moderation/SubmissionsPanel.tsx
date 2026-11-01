import React, { useState } from "react";
import { View } from "react-native";
import type { LibraryResource, ResourceKind } from "@/api/types";
import { Badge, Button, Card, Pills, Text, toast } from "@/components/ui";
import { KIND_META, KIND_ORDER } from "@/constants/library";
import { useModActions, usePendingResources } from "@/hooks/moderation";
import { getErrorMessage } from "@/api/errors";
import { openDocument } from "@/utils/files";
import { formatDate, ordinal } from "@/utils/format";
import { PanelList } from "./PanelList";
import { RejectSheet } from "./RejectSheet";

/** Uploads waiting on a moderator: notes, question papers and syllabus. */
export function SubmissionsPanel() {
  const [kind, setKind] = useState<ResourceKind>("notes");
  const [rejecting, setRejecting] = useState<LibraryResource | null>(null);

  // One query per kind so the pill counts stay live, and switching is instant.
  const notes = usePendingResources("notes");
  const pyqs = usePendingResources("pyqs");
  const syllabus = usePendingResources("syllabus");
  const byKind = { notes, pyqs, syllabus };
  const active = byKind[kind];
  const actions = useModActions();

  const pills = KIND_ORDER.map((k) => ({ value: k, label: KIND_META[k].title, count: byKind[k].data?.length }));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingVertical: 8 }}>
        <Pills items={pills} value={kind} onChange={setKind} accent={KIND_META[kind].accent} small />
      </View>
      <PanelList
        data={active.data ?? []}
        keyExtractor={(r) => r._id}
        isLoading={active.isLoading}
        error={active.error}
        isRefreshing={active.isRefetching}
        onRefresh={() => active.refetch()}
        emptyIcon="check-circle"
        emptyTitle="All caught up"
        emptyDescription={`No ${KIND_META[kind].title.toLowerCase()} are waiting for review.`}
        renderItem={(r) => (
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", gap: 10, justifyContent: "space-between" }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text weight="bold">{r.title}</Text>
                <Text variant="small" tone="muted">
                  {r.courseName}
                </Text>
              </View>
              <Badge label={KIND_META[kind].noun} variant={KIND_META[kind].accent} />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              <Badge label={r.courseCode} variant="neutral" />
              <Badge label={`${ordinal(r.semester)} sem`} variant="neutral" />
              {r.year ? <Badge label={r.year} variant="neutral" /> : null}
            </View>
            <Text variant="small" tone="muted">
              {r.program} · by {typeof r.userId === "object" ? `@${r.userId.username}` : "a student"} · {formatDate(r.createdAt)}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Button title="View file" icon="eye" size="sm" variant="outline" onPress={() => openDocument(r.fileUrl).catch((e) => toast.error(getErrorMessage(e)))} />
              <Button
                title="Approve"
                icon="check"
                size="sm"
                loading={actions.approveResource.isPending && actions.approveResource.variables?.id === r._id}
                onPress={() => actions.approveResource.mutate({ kind, id: r._id })}
              />
              <Button title="Reject" icon="x" size="sm" variant="destructive" onPress={() => setRejecting(r)} />
            </View>
          </Card>
        )}
      />

      <RejectSheet
        visible={Boolean(rejecting)}
        title={`Reject ${KIND_META[kind].noun.toLowerCase()}`}
        onClose={() => setRejecting(null)}
        loading={actions.rejectResource.isPending}
        onConfirm={(reason) => {
          if (!rejecting) return;
          actions.rejectResource.mutate({ kind, id: rejecting._id, reason }, { onSuccess: () => setRejecting(null) });
        }}
      />
    </View>
  );
}
