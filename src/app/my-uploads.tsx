import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { getErrorMessage } from "@/api/errors";
import { deleteResource } from "@/api/library";
import type { LibraryResource, ResourceKind } from "@/api/types";
import { ResourceSheet } from "@/components/library/ResourceSheet";
import { Badge, Button, Card, confirmDialog, EmptyState, FeatherName, Icon, Pills, SkeletonList, Text, toast } from "@/components/ui";
import { KIND_META, KIND_ORDER } from "@/constants/library";
import { fromResource, LibraryEntry, useMyResources } from "@/hooks/library";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH } from "@/theme/tokens";
import { formatDate } from "@/utils/format";

type Filter = "all" | ResourceKind;

const statusVariant = { approved: "success", pending: "warning", rejected: "destructive" } as const;

/** The signed-in student's own uploads, with review status and edit/delete. */
export default function MyUploadsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const requireAuth = useRequireAuth();
  const authed = useAuthStore((s) => s.status === "authed");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<LibraryEntry | null>(null);

  const notes = useMyResources("notes", authed);
  const pyqs = useMyResources("pyqs", authed);
  const syllabus = useMyResources("syllabus", authed);

  const items = useMemo(() => {
    const tag = (kind: ResourceKind, list?: LibraryResource[]) => (list ?? []).map((r) => ({ kind, r }));
    return [...tag("notes", notes.data), ...tag("pyqs", pyqs.data), ...tag("syllabus", syllabus.data)]
      .filter((x) => filter === "all" || x.kind === filter)
      .sort((a, b) => +new Date(b.r.createdAt) - +new Date(a.r.createdAt));
  }, [notes.data, pyqs.data, syllabus.data, filter]);

  const counts = {
    all: (notes.data?.length ?? 0) + (pyqs.data?.length ?? 0) + (syllabus.data?.length ?? 0),
    notes: notes.data?.length ?? 0,
    pyqs: pyqs.data?.length ?? 0,
    syllabus: syllabus.data?.length ?? 0,
  };
  const approved = [...(notes.data ?? []), ...(pyqs.data ?? []), ...(syllabus.data ?? [])].filter((r) => r.status === "approved").length;

  const remove = useMutation({
    mutationFn: ({ kind, id }: { kind: ResourceKind; id: string }) => deleteResource(kind, id),
    onSuccess: (_d, { kind }) => {
      qc.invalidateQueries({ queryKey: ["mine", kind] });
      toast.success("Deleted");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const loading = notes.isLoading || pyqs.isLoading || syllabus.isLoading;
  const pills = [
    { value: "all" as Filter, label: "All", count: counts.all },
    ...KIND_ORDER.map((k) => ({ value: k as Filter, label: KIND_META[k].title, count: counts[k] })),
  ];

  if (!authed) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <EmptyState icon="lock" title="Sign in to see your uploads" actionLabel="Sign in" onAction={() => requireAuth("see your uploads")} />
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(x) => `${x.kind}:${x.r._id}`}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={false}
            tintColor={colors.primary}
            onRefresh={() => {
              notes.refetch();
              pyqs.refetch();
              syllabus.refetch();
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 6 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Stat label="Shared" value={counts.all} icon="upload-cloud" />
              <Stat label="Live" value={approved} icon="check-circle" />
              <Stat label="In review" value={counts.all - approved} icon="clock" />
            </View>
            <View style={{ marginHorizontal: -16 }}>
              <Pills items={pills} value={filter} onChange={setFilter} small />
            </View>
            <Button title="Share something new" icon="plus" onPress={() => router.push("/upload")} />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <SkeletonList kind="row" count={4} />
          ) : (
            <EmptyState
              icon="folder"
              title="Nothing shared yet"
              description="Help your juniors — share notes, papers or a syllabus you have."
              actionLabel="Share study material"
              onAction={() => router.push("/upload")}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item: { kind, r } }) => {
          const meta = KIND_META[kind];
          return (
            <Card onPress={() => setSelected(fromResource(kind, r))} style={{ gap: 10 }}>
              <View style={styles.row}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text weight="bold" numberOfLines={2}>
                    {r.title}
                  </Text>
                  <Text variant="small" tone="muted">
                    {r.courseCode} · Sem {r.semester}
                    {r.year ? ` · ${r.year}` : ""} · {formatDate(r.createdAt)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Badge label={meta.noun} variant={meta.accent} />
                  <Badge label={r.status[0].toUpperCase() + r.status.slice(1)} variant={statusVariant[r.status]} />
                </View>
              </View>

              {r.status === "rejected" && r.rejectionReason ? (
                <View style={[styles.reason, { backgroundColor: `${colors.destructive}14` }]}>
                  <Icon name="info" size={15} color={colors.destructive} />
                  <Text variant="small" style={{ flex: 1 }}>
                    {r.rejectionReason}
                  </Text>
                </View>
              ) : null}

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button title="Edit" icon="edit-2" size="sm" variant="secondary" onPress={() => router.push({ pathname: "/upload", params: { kind, id: r._id } })} />
                <Button
                  title="Delete"
                  icon="trash-2"
                  size="sm"
                  variant="ghost"
                  onPress={async () => {
                    const ok = await confirmDialog({
                      title: "Delete this upload?",
                      message: "It will be removed from the library for everyone.",
                      confirmLabel: "Delete",
                      destructive: true,
                    });
                    if (ok) remove.mutate({ kind, id: r._id });
                  }}
                />
              </View>
            </Card>
          );
        }}
      />
      <ResourceSheet entry={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: FeatherName }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Icon name={icon} size={18} color={colors.primary} />
      <Text variant="title">{value}</Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  row: { flexDirection: "row", gap: 12 },
  reason: { flexDirection: "row", gap: 8, padding: 10, borderRadius: 12 },
  stat: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
});
