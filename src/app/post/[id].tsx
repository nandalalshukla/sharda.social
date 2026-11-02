import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { getErrorMessage } from "@/api/errors";
import { PostCard } from "@/components/social/PostCard";
import { ErrorState, SkeletonList } from "@/components/ui";
import { usePost } from "@/hooks/social";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH } from "@/theme/tokens";

/**
 * A single post. Comments open in a modal from the card's comment button
 * (`?comments=1` opens it straight away, for notification links) so the input
 * rides above the keyboard instead of being covered by it.
 */
export default function PostScreen() {
  const { id, comments } = useLocalSearchParams<{ id: string; comments?: string }>();
  const { colors } = useTheme();
  const post = usePost(id);

  if (post.isLoading) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background, padding: 16 }]}>
        <SkeletonList count={1} />
      </View>
    );
  }
  if (post.isError || !post.data) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <ErrorState message={post.error ? getErrorMessage(post.error) : "This post may have been removed."} onRetry={() => post.refetch()} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <PostCard post={post.data} detail openComments={comments === "1"} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
});
