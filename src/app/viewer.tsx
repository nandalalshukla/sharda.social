import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { getErrorMessage } from "@/api/errors";
import { Button, EmptyState, Icon, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { downloadAndShare, fileExtension, isImageUrl, openExternally } from "@/utils/files";

const OFFICE = ["doc", "docx", "ppt", "pptx"];

/**
 * In-app document viewer.
 *
 * iOS's web view renders PDFs and Office files natively. Android's can't render
 * a PDF at all, so there the file is shown through Google's embedded viewer
 * (which also handles Office formats). Images are shown directly and can be
 * pinched to zoom. Nothing leaves the app unless the student asks to share.
 */
export default function ViewerScreen() {
  const { url = "", title } = useLocalSearchParams<{ url?: string; title?: string }>();
  const { colors } = useTheme();

  const ext = fileExtension(url);
  const image = isImageUrl(url);

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const uri = useMemo(() => {
    const needsGoogle = Platform.OS === "android" && (ext === "pdf" || OFFICE.includes(ext));
    return needsGoogle ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}` : url;
  }, [url, ext]);

  const retry = useCallback(() => {
    setFailed(false);
    setLoading(true);
    setAttempt((a) => a + 1);
  }, []);

  const save = async () => {
    setSaving(true);
    setProgress(0);
    setActionError(null);
    try {
      await downloadAndShare(url, setProgress);
    } catch (e) {
      setActionError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <Stack.Screen
      options={{
        title: title || "Document",
        headerRight: () => (
          <View style={styles.actions}>
            <Pressable onPress={() => openExternally(url)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Open in browser">
              <Icon name="external-link" size={20} color={colors.mutedForeground} />
            </Pressable>
            <Pressable onPress={save} disabled={saving} hitSlop={10} accessibilityRole="button" accessibilityLabel="Download or share">
              {saving ? <ActivityIndicator size="small" color={colors.primary} /> : <Icon name="download" size={21} color={colors.primary} />}
            </Pressable>
          </View>
        ),
      }}
    />
  );

  if (!url) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        {header}
        <EmptyState icon="file" title="Nothing to show" description="This document has no file attached." />
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {header}

      {image ? (
        <ScrollView
          maximumZoomScale={4}
          minimumZoomScale={1}
          contentContainerStyle={styles.imageWrap}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <Image source={{ uri: url }} style={styles.image} contentFit="contain" cachePolicy="memory-disk" onLoadEnd={() => setLoading(false)} onError={() => setFailed(true)} />
        </ScrollView>
      ) : failed ? (
        <View style={styles.fill}>
          <EmptyState
            icon="alert-circle"
            title="Couldn't open this file"
            description="It may be large or your connection may be slow. You can retry, or open it in your browser."
            actionLabel="Try again"
            onAction={retry}
          />
          <View style={{ alignItems: "center", marginTop: -20 }}>
            <Button title="Open in browser" icon="external-link" variant="outline" onPress={() => openExternally(url)} />
          </View>
        </View>
      ) : (
        <WebView
          key={attempt}
          source={{ uri }}
          style={[styles.fill, { backgroundColor: colors.background }]}
          originWhitelist={["https://*", "http://*"]}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          allowsInlineMediaPlayback
          startInLoadingState={false}
          onLoadEnd={() => setLoading(false)}
          onError={() => setFailed(true)}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 400) setFailed(true);
          }}
          // Keep navigation inside the viewer for the document; anything else goes to the system.
          onShouldStartLoadWithRequest={(req) => {
            if (req.url === uri || req.url.startsWith("https://docs.google.com/") || req.url.startsWith("https://res.cloudinary.com/") || req.url.startsWith("about:")) {
              return true;
            }
            return req.navigationType !== "click";
          }}
        />
      )}

      {loading && !failed ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.loading, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text tone="muted">Opening document…</Text>
        </View>
      ) : null}

      {saving ? (
        <View style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text variant="small" weight="semibold">
            Downloading… {Math.round(progress * 100)}%
          </Text>
        </View>
      ) : actionError ? (
        <View style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.destructive }]}>
          <Text variant="small" tone="destructive" weight="semibold">
            {actionError}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  actions: { flexDirection: "row", alignItems: "center", gap: 18 },
  loading: { alignItems: "center", justifyContent: "center", gap: 12 },
  imageWrap: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%", minHeight: 400 },
  toast: { position: "absolute", left: 16, right: 16, bottom: 24, padding: 12, borderRadius: 14, borderWidth: 1, alignItems: "center" },
});
