import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApiError } from "@/api/errors";
import type { LostFoundCategory, LostFoundKind, PostType } from "@/api/types";
import { DateField } from "@/components/forms/DateField";
import {
  Avatar,
  Button,
  Icon,
  Input,
  Pills,
  PressableScale,
  ProgressBar,
  Select,
  Text,
  toast,
} from "@/components/ui";
import {
  lostFoundCategoryMeta,
  lostFoundCategoryOrder,
  lostFoundKindMeta,
  postTypeMeta,
  postTypeOrder,
  postWillNeedApproval,
} from "@/constants/postMeta";
import { usePost, useSavePost } from "@/hooks/social";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/tokens";
import {
  formatBytes,
  MAX_POST_FILE_BYTES,
  MAX_POST_FILES,
  PickedFile,
  pickPdfs,
  pickPhotosAndVideos,
} from "@/utils/pickers";
import { fileNameFromUrl, isImageUrl, isVideoUrl } from "@/utils/files";

const MAX_CHARS = 2000;

const TYPE_PILLS = postTypeOrder.map((t) => ({ value: t, label: postTypeMeta[t].label, icon: postTypeMeta[t].icon }));

export default function ComposeScreen() {
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  // Editing: reuse the cached post, fetching only on a cold deep link.
  const existingQuery = usePost(postId ?? "");
  const existing = postId ? existingQuery.data : undefined;
  const editing = Boolean(postId);

  const save = useSavePost(existing);

  const [type, setType] = useState<PostType>("general");
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [kind, setKind] = useState<LostFoundKind>("lost");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState<LostFoundCategory>("other");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [contact, setContact] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Prefill once the post to edit is available.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (!existing || hydrated) return;
    setType(existing.type);
    setContent(existing.content);
    setAnonymous(Boolean(existing.isAnonymous));
    if (existing.lostFound) {
      setKind(existing.lostFound.kind);
      setItemName(existing.lostFound.itemName);
      setCategory(existing.lostFound.category);
      setLocation(existing.lostFound.location ?? "");
      setDate(existing.lostFound.dateOccurred ? existing.lostFound.dateOccurred.slice(0, 10) : "");
      setContact(existing.lostFound.contactInfo ?? "");
    }
    setHydrated(true);
  }, [existing, hydrated]);

  const keptExisting = useMemo(
    () =>
      (existing?.files ?? [])
        .map((url, i) => ({ url, publicId: existing?.publicIds?.[i] ?? "" }))
        .filter((f) => !removedIds.includes(f.publicId)),
    [existing, removedIds],
  );

  const totalFiles = keptExisting.length + files.length;
  const isLostFound = type === "lost_found";
  const needsApproval = postWillNeedApproval(type, user?.role);
  const canSubmit = content.trim().length > 0 && (!isLostFound || itemName.trim().length > 0) && !save.isPending;

  const addFiles = async (picker: (limit: number) => Promise<PickedFile[]>) => {
    const room = MAX_POST_FILES - totalFiles;
    if (room <= 0) {
      setError(`You can attach up to ${MAX_POST_FILES} files.`);
      return;
    }
    try {
      const picked = await picker(room);
      const tooBig = picked.find((f) => (f.size ?? 0) > MAX_POST_FILE_BYTES);
      if (tooBig) {
        setError(`${tooBig.name} is too large (max ${formatBytes(MAX_POST_FILE_BYTES)}).`);
        return;
      }
      setError(null);
      setFiles((prev) => [...prev, ...picked].slice(0, MAX_POST_FILES));
    } catch (e) {
      setError(getApiError(e).message);
    }
  };

  const submit = async () => {
    setError(null);
    try {
      await save.mutateAsync({
        input: {
          type,
          content: content.trim(),
          isAnonymous: anonymous,
          files,
          removePublicIds: removedIds,
          lostFound: isLostFound
            ? { kind, itemName: itemName.trim(), category, location: location.trim(), date, contactInfo: contact.trim() }
            : undefined,
        },
        onProgress: setProgress,
      });
      router.back();
      // Raised after the modal closes — a toast under a native modal is invisible.
      setTimeout(
        () =>
          toast.success(
            editing ? "Post updated" : needsApproval ? "Submitted — a moderator will review it soon" : "Posted!",
          ),
        350,
      );
    } catch (e) {
      setError(getApiError(e).message);
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: editing ? "Edit post" : "New post",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
              <Text tone="primary" weight="semibold">
                Cancel
              </Text>
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.author}>
            <Avatar uri={user?.profilePic?.url} name={user?.username} size={44} />
            <View style={{ flex: 1 }}>
              <Text weight="bold">{anonymous ? "Anonymous" : `@${user?.username}`}</Text>
              <Text variant="small" tone="muted">
                {postTypeMeta[type].hint}
              </Text>
            </View>
          </View>

          {!editing ? <Pills items={TYPE_PILLS} value={type} onChange={setType} /> : null}

          {needsApproval ? (
            <View style={[styles.notice, { backgroundColor: `${colors.warning}18`, borderColor: `${colors.warning}55` }]}>
              <Icon name="clock" size={18} color={colors.warning} />
              <Text variant="small" style={{ flex: 1 }}>
                {postTypeMeta[type].label}s are reviewed by a moderator before they appear in the feed. You&apos;ll see yours here
                in the meantime.
              </Text>
            </View>
          ) : null}

          {isLostFound ? (
            <View style={styles.group}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {(Object.keys(lostFoundKindMeta) as LostFoundKind[]).map((k) => {
                  const selected = kind === k;
                  return (
                    <PressableScale
                      key={k}
                      onPress={() => setKind(k)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={[
                        styles.kind,
                        {
                          borderColor: selected ? colors.primary : colors.border,
                          backgroundColor: selected ? colors.primarySoft : colors.card,
                        },
                      ]}
                    >
                      <Text weight="bold" tone={selected ? "primary" : "default"}>
                        {lostFoundKindMeta[k].composerLabel}
                      </Text>
                      <Text variant="caption" tone="muted" weight="regular">
                        {lostFoundKindMeta[k].composerHint}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
              <Input label="What is it? *" value={itemName} onChangeText={setItemName} placeholder="e.g. Black Casio calculator" maxChars={120} />
              <Select
                label="Category"
                value={category}
                onChange={(v) => v && setCategory(v as LostFoundCategory)}
                options={lostFoundCategoryOrder.map((c) => ({ value: c, label: lostFoundCategoryMeta[c].label }))}
              />
              <Input label="Where?" value={location} onChangeText={setLocation} placeholder="e.g. Library, 2nd floor" maxChars={200} />
              <DateField label={kind === "lost" ? "When did you lose it?" : "When did you find it?"} value={date} onChange={setDate} />
              <Input
                label="How can people reach you?"
                value={contact}
                onChangeText={setContact}
                placeholder="Phone number or email"
                maxChars={200}
                hint="Shown to everyone who can see this post."
              />
            </View>
          ) : null}

          <Input
            label={isLostFound ? "Details *" : "What's on your mind? *"}
            value={content}
            onChangeText={setContent}
            multiline
            maxChars={MAX_CHARS}
            placeholder={isLostFound ? "Describe it — colour, brand, anything distinctive" : "Share an update, ask a question…"}
            autoFocus={!editing}
          />

          <View style={[styles.anon, { borderColor: anonymous ? colors.primary : colors.border, backgroundColor: anonymous ? colors.primarySoft : colors.card }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Icon name="eye-off" size={16} />
                <Text weight="semibold">Post anonymously</Text>
              </View>
              <Text variant="small" tone="muted">
                Your name and photo are hidden from everyone else, and the post isn&apos;t listed on your profile. Moderators can still act
                on it if it&apos;s reported.
              </Text>
            </View>
            <Switch
              value={anonymous}
              onValueChange={setAnonymous}
              trackColor={{ true: colors.primary, false: colors.border }}
              accessibilityLabel="Post anonymously"
            />
          </View>

          <View style={{ gap: 10 }}>
            <Text variant="small" weight="semibold">
              Attachments ({totalFiles}/{MAX_POST_FILES})
            </Text>

            {(keptExisting.length > 0 || files.length > 0) && (
              <View style={styles.thumbs}>
                {keptExisting.map((f) => (
                  <Thumb
                    key={f.publicId || f.url}
                    uri={isImageUrl(f.url) ? f.url : undefined}
                    label={fileNameFromUrl(f.url)}
                    video={isVideoUrl(f.url)}
                    onRemove={() => f.publicId && setRemovedIds((ids) => [...ids, f.publicId])}
                  />
                ))}
                {files.map((f, i) => (
                  <Thumb
                    key={f.uri}
                    uri={f.kind === "image" ? f.uri : undefined}
                    label={f.name}
                    video={f.kind === "video"}
                    onRemove={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                ))}
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              <Button title="Photo / video" icon="image" variant="secondary" size="sm" onPress={() => addFiles(pickPhotosAndVideos)} />
              <Button title="PDF" icon="file-text" variant="secondary" size="sm" onPress={() => addFiles(pickPdfs)} />
            </View>
          </View>

          {error ? (
            <View style={[styles.notice, { backgroundColor: `${colors.destructive}18`, borderColor: `${colors.destructive}55` }]} accessibilityLiveRegion="assertive">
              <Icon name="alert-circle" size={18} color={colors.destructive} />
              <Text variant="small" tone="destructive" weight="semibold" style={{ flex: 1 }}>
                {error}
              </Text>
            </View>
          ) : null}

          {save.isPending && files.length > 0 ? <ProgressBar value={progress} label={`Uploading… ${Math.round(progress * 100)}%`} /> : null}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <Button
            title={editing ? "Save changes" : needsApproval ? "Submit for review" : "Post"}
            onPress={submit}
            loading={save.isPending}
            disabled={!canSubmit}
            fullWidth
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Thumb({ uri, label, video, onRemove }: { uri?: string; label: string; video?: boolean; onRemove: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.thumb, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={styles.thumbFile}>
          <Icon name={video ? "video" : "file-text"} size={22} color={colors.primary} />
          <Text variant="caption" tone="muted" numberOfLines={2} align="center">
            {label}
          </Text>
        </View>
      )}
      <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${label}`} style={styles.remove}>
        <Icon name="x" size={13} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  author: { flexDirection: "row", alignItems: "center", gap: 12 },
  group: { gap: 14 },
  notice: { flexDirection: "row", gap: 10, padding: 12, borderRadius: radius.lg, borderWidth: 1, alignItems: "center" },
  kind: { flex: 1, padding: 12, borderRadius: radius.lg, borderWidth: 1.5, gap: 2 },
  anon: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1.5 },
  thumbs: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  thumb: { width: 92, height: 92, borderRadius: radius.md, borderWidth: 1, overflow: "hidden" },
  thumbFile: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, padding: 6 },
  remove: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth * 2 },
});
