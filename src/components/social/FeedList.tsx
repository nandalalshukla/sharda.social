import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, RefreshControl, View } from "react-native";
import type { Post } from "@/api/types";
import { ErrorState, SkeletonList, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { LibraryPromo } from "./LibraryPromo";
import { PostCard } from "./PostCard";

type Row = { kind: "post"; post: Post } | { kind: "promo"; id: string };

/** The promo appears exactly once, after the third post (or the last, if fewer). */
const PROMO_AFTER = 3;

interface FeedListProps {
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  error?: string | null;
  onRefresh: () => void;
  onLoadMore: () => void;
  onRetry: () => void;
  header?: React.ReactElement | null;
  empty: React.ReactElement;
  showPromo?: boolean;
  bottomPadding?: number;
}

/**
 * The scrolling post list used by the home feed and by profiles. FlashList
 * recycles row views, which is what keeps a long feed smooth on mid-range
 * Android phones.
 */
export function FeedList({
  posts,
  isLoading,
  isRefreshing,
  isFetchingMore,
  hasMore,
  error,
  onRefresh,
  onLoadMore,
  onRetry,
  header,
  empty,
  showPromo = false,
  bottomPadding = 24,
}: FeedListProps) {
  const { colors } = useTheme();

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = posts.map((post) => ({ kind: "post", post }));
    if (showPromo && out.length > 0) out.splice(Math.min(PROMO_AFTER, out.length), 0, { kind: "promo", id: "promo" });
    return out;
  }, [posts, showPromo]);

  const renderItem = useCallback(
    ({ item }: { item: Row }) => (
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        {item.kind === "post" ? <PostCard post={item.post} /> : <LibraryPromo />}
      </View>
    ),
    [],
  );

  const footer = isFetchingMore ? (
    <ActivityIndicator style={{ padding: 20 }} color={colors.primary} />
  ) : !hasMore && posts.length > 0 ? (
    <View style={{ alignItems: "center", paddingVertical: 28, gap: 4 }}>
      <Text weight="semibold">You&apos;re all caught up</Text>
      <Text variant="small" tone="muted">
        Check back later for more from the community
      </Text>
    </View>
  ) : null;

  return (
    <FlashList
      data={rows}
      renderItem={renderItem}
      keyExtractor={(r) => (r.kind === "post" ? r.post._id : r.id)}
      getItemType={(r) => r.kind}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      ListEmptyComponent={
        isLoading ? (
          <View style={{ paddingHorizontal: 16 }}>
            <SkeletonList count={3} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : (
          empty
        )
      }
      onEndReached={() => {
        if (hasMore && !isFetchingMore) onLoadMore();
      }}
      onEndReachedThreshold={1.2}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  );
}
