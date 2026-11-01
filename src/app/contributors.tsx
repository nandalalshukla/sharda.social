import { useQuery } from "@tanstack/react-query";
import React from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { getContributors } from "@/api/auth";
import { getErrorMessage } from "@/api/errors";
import type { Contributor } from "@/api/types";
import { Avatar, Card, EmptyState, ErrorState, Icon, SkeletonList, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH } from "@/theme/tokens";

const MEDALS = ["#f5b301", "#9aa4b2", "#cd7f32"];

/** The leaderboard of students who've shared the most approved material. */
export default function ContributorsScreen() {
  const { colors } = useTheme();
  const query = useQuery({ queryKey: ["contributors"], queryFn: getContributors, staleTime: 5 * 60_000 });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={query.data ?? []}
        keyExtractor={(c) => c._id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.primary} />}
        ListHeaderComponent={
          <Text tone="muted" style={{ marginBottom: 14 }}>
            Students who&apos;ve shared the most study material. Thank you for making exam season easier for everyone.
          </Text>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          query.isLoading ? (
            <SkeletonList kind="row" count={6} />
          ) : query.isError ? (
            <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
          ) : (
            <EmptyState icon="award" title="No contributors yet" description="Share notes or papers to take the first spot." />
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(350)}>
            <Row c={item} rank={index} />
          </Animated.View>
        )}
      />
    </View>
  );
}

function Row({ c, rank }: { c: Contributor; rank: number }) {
  const { colors } = useTheme();
  const medal = MEDALS[rank];
  return (
    <Card style={styles.row} lift={rank < 3 ? 2 : 1}>
      <View style={[styles.rank, { backgroundColor: medal ? `${medal}30` : colors.secondary }]}>
        {medal ? <Icon name="award" size={18} color={medal} /> : <Text weight="bold" tone="muted">{rank + 1}</Text>}
      </View>
      <Avatar name={c.name} size={42} />
      <View style={{ flex: 1 }}>
        <Text weight="bold" numberOfLines={1}>
          {c.name}
        </Text>
        {c.email ? (
          <Text variant="small" tone="muted" numberOfLines={1}>
            {c.email}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text variant="heading" tone="primary">
          {c.contributions}
        </Text>
        <Text variant="caption" tone="muted" weight="regular">
          {c.contributions === 1 ? "upload" : "uploads"}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  rank: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
});
