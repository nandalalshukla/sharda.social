import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { PostsPanel } from "@/components/moderation/PostsPanel";
import { ReportsPanel } from "@/components/moderation/ReportsPanel";
import { RoleGate } from "@/components/moderation/RoleGate";
import { SubmissionsPanel } from "@/components/moderation/SubmissionsPanel";
import { FeatherName, Icon, Pills, Text } from "@/components/ui";
import { usePendingPosts, usePendingResources, useReports } from "@/hooks/moderation";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH, radius } from "@/theme/tokens";

type Tab = "submissions" | "posts" | "reports";

export default function ModeratorDashboard() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <RoleGate allow={["mod", "admin"]}>
        <Dashboard />
      </RoleGate>
    </View>
  );
}

function Dashboard() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>("submissions");

  const notes = usePendingResources("notes");
  const pyqs = usePendingResources("pyqs");
  const syllabus = usePendingResources("syllabus");
  const posts = usePendingPosts();
  const reports = useReports("pending");

  const submissionCount = (notes.data?.length ?? 0) + (pyqs.data?.length ?? 0) + (syllabus.data?.length ?? 0);
  const postCount = posts.data?.posts.length ?? 0;
  const reportCount = reports.data?.pages[0]?.pagination.total ?? 0;

  return (
    <View style={styles.column}>
      <View style={styles.stats}>
        <Stat icon="inbox" label="Submissions" value={submissionCount} tint={colors.mint} />
        <Stat icon="message-square" label="Posts" value={postCount} tint={colors.sky} />
        <Stat icon="flag" label="Reports" value={reportCount} tint={colors.coral} />
      </View>

      <Pills
        items={[
          { value: "submissions" as Tab, label: "Submissions", icon: "inbox", count: submissionCount },
          { value: "posts" as Tab, label: "Posts", icon: "message-square", count: postCount },
          { value: "reports" as Tab, label: "Reports", icon: "flag", count: reportCount },
        ]}
        value={tab}
        onChange={setTab}
      />

      <View style={{ flex: 1 }}>
        {tab === "submissions" ? <SubmissionsPanel /> : tab === "posts" ? <PostsPanel /> : <ReportsPanel />}
      </View>
    </View>
  );
}

function Stat({ icon, label, value, tint }: { icon: FeatherName; label: string; value: number; tint: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: `${tint}30` }]}>
        <Icon name={icon} size={16} color={tint} />
      </View>
      <Text variant="title">{value}</Text>
      <Text variant="caption" tone="muted" weight="regular">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center", paddingTop: 12 },
  stats: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  stat: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 12, borderRadius: radius.lg, borderWidth: 1 },
  statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
});
