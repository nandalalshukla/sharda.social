import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { listCommunity } from "@/api/library";
import type { ResourceKind } from "@/api/types";
import { ResourceCard } from "@/components/library/ResourceCard";
import { ResourceSheet } from "@/components/library/ResourceSheet";
import { Button, FeatherName, Icon, PressableScale, Screen, SkeletonList, TabHeader, Text } from "@/components/ui";
import { KIND_META, KIND_ORDER } from "@/constants/library";
import { fromResource, LibraryEntry } from "@/hooks/library";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useTheme } from "@/theme/ThemeProvider";
import { elevation, radius } from "@/theme/tokens";

export default function LibraryHub() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const requireAuth = useRequireAuth();
  const [selected, setSelected] = useState<LibraryEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const recent = useQuery({
    queryKey: ["recent"],
    queryFn: async () => {
      const lists = await Promise.all(KIND_ORDER.map(async (k) => (await listCommunity(k, 4)).map((r) => fromResource(k, r))));
      return lists.flat().slice(0, 8);
    },
    staleTime: 60_000,
  });

  const refresh = async () => {
    setRefreshing(true);
    await recent.refetch();
    setRefreshing(false);
  };

  const contribute = () => {
    if (requireAuth("share study material")) router.push("/upload");
  };

  return (
    <Screen>
      <TabHeader title="Library" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <Animated.View entering={FadeInDown.duration(450)}>
          <LinearGradient
            colors={isDark ? ["#2a2560", "#191726"] : ["#e0e4ff", "#fdeee4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { borderColor: colors.border }]}
          >
            <Text variant="title">Ace your exams</Text>
            <Text tone="muted">
              Previous year papers, unit-wise notes and the official syllabus for every school at Greater Noida. Free to browse — no sign-up needed.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <Button title="Explore papers" icon="compass" onPress={() => router.push({ pathname: "/library/[kind]", params: { kind: "pyqs" } })} />
              <Button title="Contribute" icon="upload-cloud" variant="outline" onPress={contribute} />
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={{ gap: 12 }}>
          {KIND_ORDER.map((kind, i) => (
            <Animated.View key={kind} entering={FadeInDown.delay(80 + i * 70).duration(420)}>
              <KindTile kind={kind} onPress={() => router.push({ pathname: "/library/[kind]", params: { kind } })} />
            </Animated.View>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <Text variant="heading">Recently shared</Text>
        </View>
        {recent.isLoading ? (
          <SkeletonList kind="row" count={3} />
        ) : (recent.data?.length ?? 0) === 0 ? (
          <Text tone="muted">Nothing here yet — share the first one.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {recent.data!.map((e) => (
              <ResourceCard key={e.key} entry={e} onPress={setSelected} />
            ))}
          </View>
        )}

        <View style={{ gap: 10 }}>
          <LinkRow icon="award" label="Top contributors" onPress={() => router.push("/contributors")} />
          <LinkRow
            icon="folder"
            label="My uploads"
            onPress={() => {
              if (requireAuth("see your uploads")) router.push("/my-uploads");
            }}
          />
        </View>
      </ScrollView>
      <ResourceSheet entry={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

function KindTile({ kind, onPress }: { kind: ResourceKind; onPress: () => void }) {
  const { colors } = useTheme();
  const meta = KIND_META[kind];
  const bg = colors[meta.accent];
  const fg = colors[`${meta.accent}Foreground` as const];
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${meta.title}`}
      style={[styles.tile, { backgroundColor: bg }, elevation(2, colors.shadow)]}
    >
      <View style={[styles.tileIcon, { backgroundColor: "rgba(255,255,255,0.35)" }]}>
        <Icon name={meta.icon} size={26} color={fg} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="heading" color={fg}>
          {meta.title}
        </Text>
        <Text variant="small" color={fg} style={{ opacity: 0.85 }} numberOfLines={2}>
          {kind === "pyqs" ? "Past exam papers, by school and semester" : kind === "notes" ? "Unit-wise notes from students" : "Official course unit breakdowns"}
        </Text>
      </View>
      <Icon name="arrow-right" size={22} color={fg} />
    </PressableScale>
  );
}

function LinkRow({ icon, label, onPress }: { icon: FeatherName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      accessibilityRole="button"
      style={[styles.link, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Icon name={icon} size={20} color={colors.primary} />
      <Text weight="semibold" style={{ flex: 1 }}>
        {label}
      </Text>
      <Icon name="chevron-right" size={18} color={colors.mutedForeground} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  hero: { borderRadius: radius["2xl"], padding: 20, gap: 10, borderWidth: StyleSheet.hairlineWidth * 2 },
  tile: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: radius.xl },
  tileIcon: { width: 52, height: 52, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  sectionHead: { marginTop: 4 },
  link: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.lg, borderWidth: 1 },
});
