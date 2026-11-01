import React from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { getErrorMessage } from "@/api/errors";
import { EmptyState, ErrorState, FeatherName, SkeletonList } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * The list every dashboard panel shares: pull-to-refresh, skeletons while
 * loading, an error with retry, an empty state, and optional paging.
 */
export function PanelList<T>({
  data,
  keyExtractor,
  renderItem,
  isLoading,
  error,
  onRefresh,
  isRefreshing,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  header,
  onEndReached,
  isFetchingMore,
}: {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => React.ReactElement;
  isLoading: boolean;
  error?: unknown;
  onRefresh: () => void;
  isRefreshing?: boolean;
  emptyIcon: FeatherName;
  emptyTitle: string;
  emptyDescription?: string;
  header?: React.ReactElement;
  onEndReached?: () => void;
  isFetchingMore?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => renderItem(item)}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={Boolean(isRefreshing)} onRefresh={onRefresh} tintColor={colors.primary} />}
      onEndReachedThreshold={0.6}
      onEndReached={onEndReached}
      ListFooterComponent={isFetchingMore ? <ActivityIndicator style={{ padding: 20 }} color={colors.primary} /> : undefined}
      ListEmptyComponent={
        isLoading ? (
          <SkeletonList kind="row" count={4} />
        ) : error ? (
          <ErrorState message={getErrorMessage(error)} onRetry={onRefresh} />
        ) : (
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        )
      }
    />
  );
}
