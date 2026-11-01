import React, { useState } from "react";
import { View } from "react-native";
import { PanelList } from "@/components/moderation/PanelList";
import { Avatar, Badge, Button, Card, confirmDialog, Pills, Text } from "@/components/ui";
import { useAdminActions, useAdminMods, useModRequests } from "@/hooks/moderation";
import { formatDate } from "@/utils/format";

type Tab = "requests" | "mods";

/** Moderator applications to approve, and the current moderators. */
export function ModsPanel() {
  const [tab, setTab] = useState<Tab>("requests");
  const requests = useModRequests();
  const mods = useAdminMods();
  const actions = useAdminActions();

  const review = async (id: string, username: string, action: "approve" | "reject") => {
    const ok = await confirmDialog({
      title: action === "approve" ? `Make @${username} a moderator?` : `Reject @${username}'s request?`,
      message: "They'll be emailed the decision.",
      confirmLabel: action === "approve" ? "Approve" : "Reject",
      destructive: action === "reject",
    });
    if (ok) actions.reviewRequest.mutate({ id, action });
  };

  const removeMod = async (id: string, username: string) => {
    const ok = await confirmDialog({ title: `Remove @${username} as moderator?`, message: "They'll go back to being a regular member.", confirmLabel: "Remove", destructive: true });
    if (ok) actions.removeMod.mutate(id);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingVertical: 8 }}>
        <Pills
          items={[
            { value: "requests" as Tab, label: "Requests", count: requests.data?.length },
            { value: "mods" as Tab, label: "Moderators", count: mods.data?.length },
          ]}
          value={tab}
          onChange={setTab}
          small
        />
      </View>

      {tab === "requests" ? (
        <PanelList
          data={requests.data ?? []}
          keyExtractor={(u) => u._id}
          isLoading={requests.isLoading}
          error={requests.error}
          isRefreshing={requests.isRefetching}
          onRefresh={() => requests.refetch()}
          emptyIcon="inbox"
          emptyTitle="No pending requests"
          emptyDescription="When a student applies to be a moderator, it shows up here."
          renderItem={(u) => (
            <Card style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Avatar name={u.name} size={44} />
                <View style={{ flex: 1 }}>
                  <Text weight="bold">{u.name}</Text>
                  <Text variant="small" tone="muted">
                    @{u.username} · {u.email}
                  </Text>
                </View>
              </View>
              {u.modMotivation ? <Text>{u.modMotivation}</Text> : null}
              <Text variant="small" tone="muted" selectable>
                {u.contactNo ? `Contact: ${u.contactNo}` : "No contact number"}
                {u.modRequestAt ? ` · requested ${formatDate(u.modRequestAt)}` : ""}
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button title="Approve" icon="check" size="sm" onPress={() => review(u._id, u.username, "approve")} />
                <Button title="Reject" icon="x" size="sm" variant="destructive" onPress={() => review(u._id, u.username, "reject")} />
              </View>
            </Card>
          )}
        />
      ) : (
        <PanelList
          data={mods.data ?? []}
          keyExtractor={(u) => u._id}
          isLoading={mods.isLoading}
          error={mods.error}
          isRefreshing={mods.isRefetching}
          onRefresh={() => mods.refetch()}
          emptyIcon="shield"
          emptyTitle="No moderators yet"
          renderItem={(u) => (
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar name={u.name} size={44} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text weight="bold" numberOfLines={1}>
                  {u.name}
                </Text>
                <Text variant="small" tone="muted" numberOfLines={1}>
                  @{u.username} · {u.contributions ?? 0} uploads
                </Text>
                <Badge label={u.isActive ? "Active" : "Inactive"} variant={u.isActive ? "success" : "destructive"} />
              </View>
              <Button title="Remove" size="sm" variant="ghost" onPress={() => removeMod(u._id, u.username)} />
            </Card>
          )}
        />
      )}
    </View>
  );
}
