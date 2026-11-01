import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { getErrorMessage } from "@/api/errors";
import { UserRow } from "@/components/social/UserRow";
import { EmptyState, ErrorState, Pills, SkeletonList } from "@/components/ui";
import { useUserList } from "@/hooks/social";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH } from "@/theme/tokens";

type Kind = "followers" | "following";

export default function ConnectionsScreen() {
  const params = useLocalSearchParams<{ userId: string; type?: string }>();
  const { colors } = useTheme();
  const [kind, setKind] = useState<Kind>(params.type === "following" ? "following" : "followers");

  const followers = useUserList("followers", params.userId);
  const following = useUserList("following", params.userId);
  const active = kind === "followers" ? followers : following;

  const users = useMemo(() => active.data?.pages.flatMap((p) => p.users) ?? [], [active.data]);
  const totals = {
    followers: followers.data?.pages[0]?.total,
    following: following.data?.pages[0]?.total,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: 8, paddingBottom: 4 }}>
        <Pills
          items={[
            { value: "followers" as Kind, label: "Followers", count: totals.followers },
            { value: "following" as Kind, label: "Following", count: totals.following },
          ]}
          value={kind}
          onChange={setKind}
        />
      </View>
      <FlatList
        data={users}
        keyExtractor={(u) => u._id}
        renderItem={({ item }) => <UserRow user={item} />}
        contentContainerStyle={{ paddingVertical: 8, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center", flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={active.isRefetching && !active.isFetchingNextPage} onRefresh={() => void active.refetch()} tintColor={colors.primary} />}
        onEndReachedThreshold={0.6}
        onEndReached={() => active.hasNextPage && !active.isFetchingNextPage && active.fetchNextPage()}
        ListFooterComponent={active.isFetchingNextPage ? <ActivityIndicator style={{ padding: 20 }} color={colors.primary} /> : undefined}
        ListEmptyComponent={
          active.isLoading ? (
            <View style={{ padding: 16 }}>
              <SkeletonList kind="row" count={6} />
            </View>
          ) : active.isError ? (
            <ErrorState message={getErrorMessage(active.error)} onRetry={() => active.refetch()} />
          ) : (
            <EmptyState
              icon="users"
              title={kind === "followers" ? "No followers yet" : "Not following anyone yet"}
              description={kind === "followers" ? "When people follow this account, they'll show up here." : "Accounts followed will show up here."}
            />
          )
        }
      />
    </View>
  );
}
