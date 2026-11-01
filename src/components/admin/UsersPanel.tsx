import React, { useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import type { AdminUser } from "@/api/types";
import { PanelList } from "@/components/moderation/PanelList";
import { Avatar, Badge, Button, Card, confirmDialog, Icon, Pills, Text } from "@/components/ui";
import { useAdminActions, useAdminUsers } from "@/hooks/moderation";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/theme/ThemeProvider";
import { fonts, radius } from "@/theme/tokens";
import { formatDate } from "@/utils/format";

type Scope = "all" | "active" | "inactive";

export function UsersPanel() {
  const { colors } = useTheme();
  const me = useAuthStore((s) => s.user?._id);
  const [scope, setScope] = useState<Scope>("all");
  const [search, setSearch] = useState("");
  const query = useAdminUsers(scope);
  const actions = useAdminActions();

  const users = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = query.data ?? [];
    return q ? all.filter((u) => [u.name, u.username, u.email].some((v) => v?.toLowerCase().includes(q))) : all;
  }, [query.data, search]);

  const toggle = async (u: AdminUser) => {
    if (u.isActive) {
      const ok = await confirmDialog({ title: `Deactivate @${u.username}?`, message: "They won't be able to sign in until you reactivate them.", confirmLabel: "Deactivate", destructive: true });
      if (!ok) return;
    }
    actions.setUserActive.mutate({ id: u._id, active: !u.isActive });
  };

  const remove = async (u: AdminUser) => {
    const ok = await confirmDialog({ title: `Delete @${u.username}?`, message: "Their account is erased permanently. This cannot be undone.", confirmLabel: "Delete", destructive: true });
    if (ok) actions.deleteUser.mutate(u._id);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, height: 46, paddingHorizontal: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
          <Icon name="search" size={17} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, username or email"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1, color: colors.foreground, fontFamily: fonts.regular, fontSize: 15 }}
          />
        </View>
      </View>
      <View style={{ paddingVertical: 8 }}>
        <Pills
          items={[
            { value: "all" as Scope, label: "All" },
            { value: "active" as Scope, label: "Active" },
            { value: "inactive" as Scope, label: "Inactive" },
          ]}
          value={scope}
          onChange={setScope}
          small
        />
      </View>
      <PanelList
        data={users}
        keyExtractor={(u) => u._id}
        isLoading={query.isLoading}
        error={query.error}
        isRefreshing={query.isRefetching}
        onRefresh={() => query.refetch()}
        emptyIcon="users"
        emptyTitle="No users found"
        renderItem={(u) => {
          const isMe = u._id === me;
          return (
            <Card style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Avatar name={u.name} size={44} />
                <View style={{ flex: 1 }}>
                  <Text weight="bold" numberOfLines={1}>
                    {u.name} {isMe ? "(you)" : ""}
                  </Text>
                  <Text variant="small" tone="muted" numberOfLines={1}>
                    @{u.username} · {u.email}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <Badge label={u.role} variant={u.role === "admin" ? "coral" : u.role === "mod" ? "primary" : "neutral"} />
                <Badge label={u.isActive ? "Active" : "Inactive"} variant={u.isActive ? "success" : "destructive"} />
                {u.isEmailVerified === false ? <Badge label="Unverified" variant="warning" /> : null}
                <Text variant="caption" tone="muted" weight="regular">
                  {u.contributions ?? 0} uploads · joined {formatDate(u.createdAt)}
                </Text>
              </View>
              {!isMe && u.role !== "admin" ? (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button title={u.isActive ? "Deactivate" : "Activate"} size="sm" variant={u.isActive ? "secondary" : "primary"} icon={u.isActive ? "pause" : "play"} onPress={() => toggle(u)} />
                  <Button title="Delete" size="sm" variant="ghost" icon="trash-2" onPress={() => remove(u)} />
                </View>
              ) : null}
            </Card>
          );
        }}
      />
    </View>
  );
}
