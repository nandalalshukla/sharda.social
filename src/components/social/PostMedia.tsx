import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { memo, useCallback, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, PressableScale, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/tokens";
import { fileNameFromUrl, isImageUrl, isVideoUrl, openDocument } from "@/utils/files";

/**
 * A post's attachments: images in a grid that opens a swipeable full-screen
 * viewer, videos that only load a player when tapped (a feed of live players
 * would drain memory), and documents as tappable file chips.
 */
export const PostMedia = memo(function PostMedia({ files }: { files?: string[] }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  if (!files?.length) return null;

  const images = files.filter(isImageUrl);
  const videos = files.filter(isVideoUrl);
  const documents = files.filter((f) => !isImageUrl(f) && !isVideoUrl(f));

  return (
    <View style={{ gap: 10 }}>
      {images.length > 0 ? <ImageGrid images={images} onOpen={setViewerIndex} /> : null}
      {videos.map((url) => (
        <VideoTile key={url} url={url} />
      ))}
      {documents.map((url) => (
        <DocumentChip key={url} url={url} />
      ))}
      <ImageViewer images={images} index={viewerIndex} onClose={() => setViewerIndex(null)} />
    </View>
  );
});

function ImageGrid({ images, onOpen }: { images: string[]; onOpen: (i: number) => void }) {
  const { colors } = useTheme();
  const shown = images.slice(0, 4);
  const extra = images.length - shown.length;

  const cell = (uri: string, i: number, style: object) => (
    <Pressable
      key={uri}
      onPress={() => onOpen(i)}
      accessibilityRole="imagebutton"
      accessibilityLabel={`Photo ${i + 1} of ${images.length}`}
      style={[{ backgroundColor: colors.secondary, overflow: "hidden" }, style]}
    >
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={180}
        cachePolicy="memory-disk"
        recyclingKey={uri}
      />
      {extra > 0 && i === shown.length - 1 ? (
        <View style={[StyleSheet.absoluteFill, styles.moreOverlay]}>
          <Text variant="title" color="#fff">
            +{extra}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );

  if (shown.length === 1) {
    return <View style={styles.grid}>{cell(shown[0], 0, { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.lg })}</View>;
  }
  if (shown.length === 2) {
    return (
      <View style={[styles.grid, { flexDirection: "row", gap: 4 }]}>
        {shown.map((u, i) => cell(u, i, { flex: 1, aspectRatio: 3 / 4, borderRadius: radius.lg }))}
      </View>
    );
  }
  return (
    <View style={[styles.grid, { gap: 4 }]}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {cell(shown[0], 0, { flex: 1, aspectRatio: shown.length === 3 ? 2 : 1, borderTopLeftRadius: radius.lg })}
        {shown.length === 4 ? cell(shown[1], 1, { flex: 1, aspectRatio: 1, borderTopRightRadius: radius.lg }) : null}
      </View>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {shown.slice(shown.length === 4 ? 2 : 1).map((u, k) => {
          const i = (shown.length === 4 ? 2 : 1) + k;
          return cell(u, i, {
            flex: 1,
            aspectRatio: 1,
            ...(k === 0 ? { borderBottomLeftRadius: radius.lg } : {}),
            ...(i === shown.length - 1 ? { borderBottomRightRadius: radius.lg } : {}),
          });
        })}
      </View>
    </View>
  );
}

function ImageViewer({ images, index, onClose }: { images: string[]; index: number | null; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const visible = index !== null;

  const onScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => setPage(Math.round(e.nativeEvent.contentOffset.x / width)),
    [width],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.viewer}>
        {visible ? (
          <FlatList
            data={images}
            keyExtractor={(u) => u}
            horizontal
            pagingEnabled
            initialScrollIndex={index ?? 0}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={onScroll}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={{ width, height }}>
                <Image source={{ uri: item }} style={{ width, height }} contentFit="contain" cachePolicy="memory-disk" />
              </View>
            )}
          />
        ) : null}

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close viewer"
          style={[styles.closeBtn, { top: insets.top + 12 }]}
          hitSlop={12}
        >
          <Icon name="x" size={22} color="#fff" />
        </Pressable>
        {images.length > 1 ? (
          <View style={[styles.counter, { top: insets.top + 18 }]}>
            <Text variant="caption" color="#fff">
              {Math.min(page + 1, images.length)} / {images.length}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function VideoTile({ url }: { url: string }) {
  const { colors } = useTheme();
  const [active, setActive] = useState(false);

  if (!active) {
    return (
      <PressableScale
        onPress={() => setActive(true)}
        accessibilityRole="button"
        accessibilityLabel="Play video"
        style={[styles.video, { backgroundColor: colors.ink }]}
      >
        <View style={styles.playBadge}>
          <Icon name="play" size={26} color="#fff" />
        </View>
        <Text variant="caption" color="#fff" style={styles.videoLabel}>
          Tap to play video
        </Text>
      </PressableScale>
    );
  }
  return <ActiveVideo url={url} />;
}

function ActiveVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });
  return (
    <View style={styles.video}>
      <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls contentFit="contain" />
    </View>
  );
}

function DocumentChip({ url }: { url: string }) {
  const { colors } = useTheme();
  const name = fileNameFromUrl(url, "Document");
  return (
    <PressableScale
      onPress={() => openDocument(url).catch(() => undefined)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${name}`}
      style={[styles.doc, { backgroundColor: colors.secondary, borderColor: colors.border }]}
    >
      <View style={[styles.docIcon, { backgroundColor: colors.primarySoft }]}>
        <Icon name="file-text" size={18} color={colors.primary} />
      </View>
      <Text variant="small" weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
        {name}
      </Text>
      <Icon name="external-link" size={16} color={colors.mutedForeground} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  grid: { borderRadius: radius.lg, overflow: "hidden" },
  moreOverlay: { backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  viewer: { flex: 1, backgroundColor: "#000" },
  closeBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    position: "absolute",
    alignSelf: "center",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  video: { width: "100%", aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "#000" },
  playBadge: { width: 58, height: 58, borderRadius: 29, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  videoLabel: { position: "absolute", bottom: 12, opacity: 0.85 },
  doc: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1 },
  docIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});
