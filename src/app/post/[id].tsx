import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, TextInputInstance, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getErrorMessage } from "@/api/errors";
import type { Comment } from "@/api/types";
import { Button, EmptyState, ErrorState, Icon, SkeletonList, Text } from "@/components/ui";
import { CommentItem } from "@/components/social/CommentItem";
import { PostCard } from "@/components/social/PostCard";
import { useCommentActions, useComments, usePost } from "@/hooks/social";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/theme/ThemeProvider";
import { fonts, MAX_CONTENT_WIDTH, radius } from "@/theme/tokens";

const MAX_COMMENT = 1000;

type Mode = { kind: "new" } | { kind: "reply"; to: Comment } | { kind: "edit"; comment: Comment };

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const status = useAuthStore((s) => s.status);

  const post = usePost(id);
  const comments = useComments(id);
  const actions = useCommentActions(id);
  const inputRef = useRef<TextInputInstance>(null);

  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>({ kind: "new" });

  const list = useMemo(() => comments.data?.pages.flatMap((p) => p.comments) ?? [], [comments.data]);
  const busy = actions.add.isPending || actions.edit.isPending;

  const startReply = useCallback((c: Comment) => {
    setMode({ kind: "reply", to: c });
    setText("");
    inputRef.current?.focus();
  }, []);

  const startEdit = useCallback((c: Comment) => {
    setMode({ kind: "edit", comment: c });
    setText(c.text);
    inputRef.current?.focus();
  }, []);

  const reset = () => {
    setMode({ kind: "new" });
    setText("");
  };

  const send = async () => {
    const body = text.trim();
    if (!body || busy) return;
    try {
      if (mode.kind === "edit") await actions.edit.mutateAsync({ id: mode.comment._id, text: body });
      else await actions.add.mutateAsync({ text: body, parent: mode.kind === "reply" ? mode.to._id : undefined });
      reset();
    } catch {
      /* the mutation already surfaced the error */
    }
  };

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

  const published = (post.data.moderationStatus ?? "approved") === "approved";

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.fill, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.fill} behavior="padding" keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        <FlatList
          data={published ? list : []}
          keyExtractor={(c) => c._id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.6}
          onEndReached={() => comments.hasNextPage && !comments.isFetchingNextPage && comments.fetchNextPage()}
          ListHeaderComponent={
            <View style={{ gap: 16 }}>
              <PostCard post={post.data} detail />
              {published ? (
                <Text variant="heading" style={{ marginTop: 4 }}>
                  Comments {post.data.commentCount > 0 ? `· ${post.data.commentCount}` : ""}
                </Text>
              ) : null}
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          renderItem={({ item }) => <CommentItem comment={item} postId={id} onReply={startReply} onEdit={startEdit} />}
          ListEmptyComponent={
            !published ? undefined : comments.isLoading ? (
              <View style={{ paddingTop: 12 }}>
                <SkeletonList kind="row" count={3} />
              </View>
            ) : comments.isError ? (
              <ErrorState message={getErrorMessage(comments.error)} onRetry={() => comments.refetch()} />
            ) : (
              <EmptyState icon="message-circle" title="No comments yet" description="Start the conversation." />
            )
          }
          ListFooterComponent={comments.isFetchingNextPage ? <ActivityIndicator style={{ padding: 20 }} color={colors.primary} /> : undefined}
        />

        {published ? (
          <View style={[styles.composerWrap, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            {status !== "authed" ? (
              <View style={styles.signIn}>
                <Text tone="muted" style={{ flex: 1 }}>
                  Sign in to join the conversation.
                </Text>
                <Button title="Sign in" size="sm" onPress={() => router.push("/login")} />
              </View>
            ) : (
              <>
                {mode.kind !== "new" ? (
                  <View style={[styles.context, { backgroundColor: colors.secondary }]}>
                    <Icon name={mode.kind === "edit" ? "edit-2" : "corner-up-left"} size={14} color={colors.primary} />
                    <Text variant="small" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
                      {mode.kind === "edit" ? "Editing your comment" : `Replying to @${mode.to.author.username}`}
                    </Text>
                    <Pressable onPress={reset} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancel">
                      <Icon name="x" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ) : null}
                <View style={styles.inputRow}>
                  <TextInput
                    ref={inputRef}
                    value={text}
                    onChangeText={setText}
                    placeholder={mode.kind === "reply" ? "Write a reply…" : "Add a comment…"}
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    maxLength={MAX_COMMENT}
                    selectionColor={colors.primary}
                    style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, fontFamily: fonts.regular }]}
                  />
                  <Pressable
                    onPress={send}
                    disabled={!text.trim() || busy}
                    accessibilityRole="button"
                    accessibilityLabel={mode.kind === "edit" ? "Save comment" : "Send comment"}
                    style={[styles.send, { backgroundColor: text.trim() ? colors.primary : colors.secondaryHover }]}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={colors.primaryForeground} />
                    ) : (
                      <Icon name={mode.kind === "edit" ? "check" : "send"} size={18} color={text.trim() ? colors.primaryForeground : colors.mutedForeground} />
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 24, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  composerWrap: { borderTopWidth: StyleSheet.hairlineWidth * 2, padding: 10, gap: 8 },
  signIn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 6 },
  context: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.md },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: { flex: 1, minHeight: 42, maxHeight: 120, borderRadius: 21, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontSize: 15 },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});
