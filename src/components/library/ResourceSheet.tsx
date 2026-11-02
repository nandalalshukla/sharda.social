import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { getErrorMessage } from "@/api/errors";
import { Badge, Button, Card, Sheet, Text } from "@/components/ui";
import { KIND_META, unitLabel } from "@/constants/library";
import type { LibraryEntry } from "@/hooks/library";
import { useTheme } from "@/theme/ThemeProvider";
import { downloadAndShare, fileNameFromUrl, openDocument, resolveFileUrl, shareLink } from "@/utils/files";
import { ordinal } from "@/utils/format";

/**
 * What a resource is, and one row per file with View and Download. Opening
 * happens in the system's in-app browser — nothing is downloaded until the
 * student asks for it. Used both in a sheet (from lists) and as the body of
 * the PYQ deep-link screen.
 */
export function ResourceDetail({ entry, onNavigateAway }: { entry: LibraryEntry; onNavigateAway?: () => void }) {
  const { colors } = useTheme();
  const router = useRouter();
  const meta = KIND_META[entry.kind];
  const [busyFile, setBusyFile] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  // Shown inline: a toast raised while this sheet is open would sit behind it.
  const [error, setError] = useState<string | null>(null);

  const download = async (src: string) => {
    setBusyFile(src);
    setProgress(0);
    setError(null);
    try {
      await downloadAndShare(src, setProgress);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyFile(null);
    }
  };

  const open = (src: string) => {
    setError(null);
    const go = () => openDocument(src, entry.title).catch((e) => setError(getErrorMessage(e)));
    if (onNavigateAway) {
      // A screen pushed beneath an open sheet would be hidden by it: close first.
      onNavigateAway();
      setTimeout(go, 300);
    } else go();
  };

  return (
    <>
      <View style={{ gap: 8 }}>
        <Text variant="heading">{entry.title}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {entry.code ? <Badge label={entry.code} variant={meta.accent} /> : null}
          <Badge label={`${ordinal(entry.semester)} semester`} variant="neutral" />
          {entry.year ? <Badge label={entry.year} variant="neutral" /> : null}
        </View>
        <Text variant="small" tone="muted">
          {entry.program}
          {entry.contributor ? ` · shared by @${entry.contributor}` : entry.source === "curated" ? " · curated by Sharda Social" : ""}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {entry.files.map((src, i) => {
          const name = fileNameFromUrl(resolveFileUrl(src), entry.title);
          const downloading = busyFile === src;
          return (
            <Card key={src} style={{ gap: 10 }} lift={0}>
              <Text weight="semibold">{entry.files.length > 1 ? unitLabel(name, i, entry.files.length) : meta.noun}</Text>
              <Text variant="small" tone="muted" numberOfLines={1}>
                {name}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button title={meta.viewLabel} icon="eye" size="sm" onPress={() => open(src)} />
                <Button
                  title={downloading ? `Downloading ${Math.round(progress * 100)}%` : "Download"}
                  icon="download"
                  size="sm"
                  variant="secondary"
                  disabled={Boolean(busyFile)}
                  onPress={() => download(src)}
                />
              </View>
            </Card>
          );
        })}
      </View>

      {error ? (
        <Text variant="small" tone="destructive" weight="semibold" accessibilityLiveRegion="assertive">
          {error}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        {entry.kind === "pyqs" && entry.resourceId ? (
          <Button
            title="Share"
            icon="share-2"
            variant="outline"
            size="sm"
            onPress={() => shareLink(`${entry.title} (${entry.code}) — question paper on Sharda Social`, `/library/pyqs/${entry.resourceId}`)}
          />
        ) : null}
        <Button
          title="Contribute yours"
          icon="upload-cloud"
          variant="soft"
          size="sm"
          onPress={() => {
            onNavigateAway?.();
            router.push({ pathname: "/upload", params: { kind: entry.kind } });
          }}
        />
      </View>
      <Text variant="caption" weight="regular" color={colors.mutedForeground}>
        Shared for student revision.
      </Text>
    </>
  );
}

export function ResourceSheet({ entry, onClose }: { entry: LibraryEntry | null; onClose: () => void }) {
  // Keep the last entry mounted while the sheet animates out, so the content
  // doesn't vanish a frame before the sheet does.
  const [last, setLast] = useState<LibraryEntry | null>(entry);
  if (entry && entry !== last) setLast(entry);
  const shown = entry ?? last;

  return (
    <Sheet visible={Boolean(entry)} onClose={onClose} title={shown ? `${KIND_META[shown.kind].noun} details` : ""} maxHeight={0.85}>
      {shown ? <ResourceDetail entry={shown} onNavigateAway={onClose} /> : null}
    </Sheet>
  );
}
