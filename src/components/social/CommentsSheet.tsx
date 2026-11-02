import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, TextInputInstance, View } from "react-native";
import { getErrorMessage } from "@/api/errors";
import type { Comment } from "@/api/types";
import { Button, EmptyState, ErrorState, Icon, Sheet, SkeletonList, Text } from "@/components/ui";
import { useCommentActions, useComments } from "@/hooks/social";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/theme/ThemeProvider";
import { fonts, radius } from "@/theme/tokens";
import { CommentItem } from "./CommentItem";

const MAX_COMMENT = 1000;

type Mode = { kind: "new" } | { kind: "reply"; to: Comment } | { kind: "edit"; comment: Comment };

/**
 * Comments in a modal sheet, so the box you type in rides above the keyboard
 * and the thread stays visible while you write — rather than being a bar at
 * the bottom of a screen that the keyboard can cover.
 */
export function CommentsSheet({
  postId,
  visible,
  onClose,
  count,
}: {
  postId: string;
  visible: boolean;
  onClose: () => void;
  count?: number;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={count ? `Comments · ${count}` : "Comments"} scroll={false} fill maxHeight={0.92}>
      <Body postId={postId} onClose={onClose} />
    </Sheet>
  );
}

function Body({ postId, onClose }: { postId: string; onClose: () => void }) {
  const router = useRouter();
  const { colors } = useTheme();
  const status = useAuthStore((s) => s.status);
  const comments = useComments(postId);
  const actions = useCommentActions(postId);
  const inputRef = useRef<TextInputInstance>(null);

  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>({ kind: "new" });
  // Inline: a toast raised from inside a modal would be hidden behind it.
  const [error, setError] = useState<string | null>(null);

  const list = useMemo(() => comments.data?.pages.flatMap((p) => p.comments) ?? [], [comments.data]);
  const busy = actions.add.isPending || actions.edit.isPending;
  const canSend = text.trim().length > 0 && !busy;

  const focusInput = () => setTimeout(() => inputRef.current?.focus(), 60);

  const startReply = useCallback((c: Comment) => {
    setMode({ kind: "reply", to: c });
    setText("");
    setError(null);
    focusInput();
  }, []);

  const startEdit = useCallback((c: Comment) => {
    setMode({ kind: "edit", comment: c });
    setText(c.text);
    setError(null);
    focusInput();
  }, []);

  const reset = () => {
    setMode({ kind: "new" });
    setText("");
    setError(null);
  };

  const send = async () => {
    const body = text.trim();
    if (!body || busy) return;
    setError(null);
    try {
      if (mode.kind === "edit") await actions.edit.mutateAsync({ id: mode.comment._id, text: body });
      else await actions.add.mutateAsync({ text: body, parent: mode.kind === "reply" ? mode.to._id : undefined });
      reset();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  // Anything that opens another screen must first get out of the way of this
  // modal, or the new screen would appear behind it.
  const leaveThen = useCallback(
    (go: () => void) => {
      onClose();
      setTimeout(go, 300);
    },
    [onClose],
  );

  return (
    <View style={styles.fill}>
      <FlatList
        data={list}
        keyExtractor={(c) => c._id}
        style={styles.fill}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 12, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        onEndReachedThreshold={0.6}
        onEndReached={() => comments.hasNextPage && !comments.isFetchingNextPage && comments.fetchNextPage()}
        renderItem={({ item }) => (
          <CommentItem comment={item} postId={postId} onReply={startReply} onEdit={startEdit} onLeave={leaveThen} />
        )}
        ListEmptyComponent={
          comments.isLoading ? (
            <SkeletonList kind="row" count={3} />
          ) : comments.isError ? (
            <ErrorState message={getErrorMessage(comments.error)} onRetry={() => comments.refetch()} />
          ) : (
            <EmptyState icon="message-circle" title="No comments yet" description="Start the conversation." />
          )
        }
        ListFooterComponent={comments.isFetchingNextPage ? <ActivityIndicator style={{ padding: 16 }} color={colors.primary} /> : undefined}
      />

      <View style={[styles.composer, { borderTopColor: colors.border }]}>
        {status !== "authed" ? (
          <View style={styles.signIn}>
            <Text tone="muted" style={{ flex: 1 }}>
              Sign in to join the conversation.
            </Text>
            <Button title="Sign in" size="sm" onPress={() => leaveThen(() => router.push("/login"))} />
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

            {error ? (
              <Text variant="small" tone="destructive" weight="semibold" accessibilityLiveRegion="assertive">
                {error}
              </Text>
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
                disabled={!canSend}
                accessibilityRole="button"
                accessibilityLabel={mode.kind === "edit" ? "Save comment" : "Send comment"}
                style={[styles.send, { backgroundColor: canSend ? colors.primary : colors.secondaryHover }]}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Icon name={mode.kind === "edit" ? "check" : "send"} size={18} color={canSend ? colors.primaryForeground : colors.mutedForeground} />
                )}
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth * 2, paddingTop: 10, gap: 8 },
  signIn: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 4 },
  context: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.md },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: { flex: 1, minHeight: 42, maxHeight: 110, borderRadius: 21, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontSize: 15 },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});
