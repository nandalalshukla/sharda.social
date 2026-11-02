import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { getErrorMessage } from "@/api/errors";
import type { LostFoundStatus, PostType } from "@/api/types";
import { Button, Card, EmptyState, Icon, Pills, PressableScale, Screen, TabHeader, Text } from "@/components/ui";
import { FeedList } from "@/components/social/FeedList";
import { postTypeMeta, postTypeOrder, resolvePostTypeMeta } from "@/constants/postMeta";
import { useFeed } from "@/hooks/social";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/theme/ThemeProvider";
import { elevation } from "@/theme/tokens";

type LostFoundFilter = LostFoundStatus | "all";

const SECTION_PILLS = postTypeOrder.map((t) => ({
  value: t,
  label: postTypeMeta[t].tabLabel,
  icon: postTypeMeta[t].icon,
}));

const LOST_FOUND_FILTERS: { value: LostFoundFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Still open" },
  { value: "resolved", label: "Resolved" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const requireAuth = useRequireAuth();
  const status = useAuthStore((s) => s.status);

  const [section, setSection] = useState<PostType>("general");
  const [lostFoundFilter, setLostFoundFilter] = useState<LostFoundFilter>("all");

  const isLostFound = section === "lost_found";
  const feed = useFeed(section, isLostFound && lostFoundFilter !== "all" ? lostFoundFilter : undefined);

  const posts = useMemo(() => feed.data?.pages.flatMap((p) => p.posts) ?? [], [feed.data]);

  const compose = useCallback(() => {
    if (requireAuth("share with the campus")) router.push("/compose");
  }, [requireAuth, router]);

  const meta = resolvePostTypeMeta(section);
  const emptyDescription = isLostFound
    ? "Lost something on campus, or found something that isn't yours? Post it here."
    : section === "opportunity"
      ? "Share jobs, internships, collaborations and other openings with the community."
      : "Be the first to share something with the community!";

  const header = (
    <View style={{ gap: 12 }}>
      {status === "guest" ? (
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 16 }}>
          <Card style={{ gap: 10, alignItems: "center" }}>
            <View style={[styles.starBadge, { backgroundColor: colors.primarySoft }]}>
              <Icon name="star" size={24} color={colors.primary} />
            </View>
            <Text variant="heading" align="center">
              Welcome to the campus feed
            </Text>
            <Text tone="muted" align="center">
              Sign in to post updates, join discussions and stay connected with your campus.
            </Text>
            <Button title="Sign in" onPress={() => router.push("/login")} />
          </Card>
        </Animated.View>
      ) : null}

      {isLostFound ? (
        <View style={styles.subFilter}>
          <Text variant="caption" tone="muted" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
            Show
          </Text>
          <Pills small items={LOST_FOUND_FILTERS} value={lostFoundFilter} onChange={setLostFoundFilter} accent="purple" />
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <TabHeader
        logo
        title="Sharda Social"
        right={
          status === "guest" ? (
            <Button title="Sign in" size="sm" onPress={() => router.push("/login")} />
          ) : undefined
        }
      />
      <Pills items={SECTION_PILLS} value={section} onChange={setSection} />

      <View style={{ flex: 1, marginTop: 8 }}>
        <FeedList
          posts={posts}
          isLoading={feed.isLoading}
          isRefreshing={feed.isRefetching && !feed.isFetchingNextPage}
          isFetchingMore={feed.isFetchingNextPage}
          hasMore={Boolean(feed.hasNextPage)}
          error={feed.isError ? getErrorMessage(feed.error) : null}
          onRefresh={() => feed.refetch()}
          onLoadMore={() => feed.fetchNextPage()}
          onRetry={() => feed.refetch()}
          header={header}
          showPromo={section === "general"}
          bottomPadding={96}
          empty={
            <EmptyState
              icon={meta.icon}
              title={
                isLostFound && lostFoundFilter !== "all"
                  ? lostFoundFilter === "open"
                    ? "Nothing open right now"
                    : "Nothing resolved yet"
                  : meta.emptyTitle
              }
              description={emptyDescription}
              actionLabel={status === "authed" ? (isLostFound ? "Post an item" : "Create a post") : undefined}
              onAction={compose}
            />
          }
        />
      </View>

      {status === "authed" ? (
        <PressableScale
          onPress={compose}
          haptic
          accessibilityRole="button"
          accessibilityLabel="Create a post"
          style={[styles.fab, { backgroundColor: colors.primary }, elevation(3, colors.primary)]}
        >
          <Icon name="plus" size={26} color={colors.primaryForeground} />
        </PressableScale>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  starBadge: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  subFilter: { flexDirection: "row", alignItems: "center", paddingLeft: 16, gap: 4 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
});
