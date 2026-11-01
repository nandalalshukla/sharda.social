import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ContentPanel } from "@/components/admin/ContentPanel";
import { ModsPanel } from "@/components/admin/ModsPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { RoleGate } from "@/components/moderation/RoleGate";
import { Button, Pills } from "@/components/ui";
import { useModRequests } from "@/hooks/moderation";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH } from "@/theme/tokens";

type Tab = "users" | "mods" | "content";

export default function AdminDashboard() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <RoleGate allow={["admin"]}>
        <Dashboard />
      </RoleGate>
    </View>
  );
}

function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("content");
  const requests = useModRequests();

  return (
    <View style={styles.column}>
      <View style={styles.top}>
        {/* Admins can use everything a moderator can — one tap away. */}
        <Button title="Moderator dashboard" icon="shield" size="sm" variant="soft" onPress={() => router.push("/mod")} />
      </View>
      <Pills
        items={[
          { value: "content" as Tab, label: "Content", icon: "folder" },
          { value: "users" as Tab, label: "Users", icon: "users" },
          { value: "mods" as Tab, label: "Moderators", icon: "shield", count: requests.data?.length || undefined },
        ]}
        value={tab}
        onChange={setTab}
      />
      <View style={{ flex: 1 }}>{tab === "content" ? <ContentPanel /> : tab === "users" ? <UsersPanel /> : <ModsPanel />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center", paddingTop: 12 },
  top: { paddingHorizontal: 16, paddingBottom: 10, flexDirection: "row" },
});
