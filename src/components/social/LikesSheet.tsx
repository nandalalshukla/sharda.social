import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { Avatar, EmptyState, PressableScale, Sheet, Text } from "@/components/ui";
import { usePostLikes } from "@/hooks/social";

/** Who liked a post — rows open that person's profile. */
export function LikesSheet({ postId, visible, onClose }: { postId: string; visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const likes = usePostLikes(postId, visible);
  const users = likes.data?.pages.flatMap((p) => p.likes) ?? [];

  return (
    <Sheet visible={visible} onClose={onClose} title="Liked by" scroll={false} maxHeight={0.7}>
      {likes.isLoading ? (
        <ActivityIndicator style={{ padding: 32 }} />
      ) : users.length === 0 ? (
        <EmptyState icon="heart" title="No likes yet" description="Be the first to like this post." />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u._id}
          style={{ maxHeight: 440 }}
          onEndReachedThreshold={0.5}
          onEndReached={() => likes.hasNextPage && !likes.isFetchingNextPage && likes.fetchNextPage()}
          ListFooterComponent={likes.isFetchingNextPage ? <ActivityIndicator style={{ padding: 16 }} /> : undefined}
          renderItem={({ item }) => (
            <PressableScale
              scaleTo={0.99}
              onPress={() => {
                onClose();
                router.push({ pathname: "/profile/[userId]", params: { userId: item._id } });
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}
            >
              <Avatar uri={item.profilePic?.url ?? item.avatar} name={item.username} size={42} />
              <View style={{ flex: 1 }}>
                <Text weight="semibold">@{item.username}</Text>
                {item.email ? (
                  <Text variant="small" tone="muted" numberOfLines={1}>
                    {item.email}
                  </Text>
                ) : null}
              </View>
            </PressableScale>
          )}
        />
      )}
    </Sheet>
  );
}
