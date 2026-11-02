import { Directory, File, Paths } from "expo-file-system";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import { Share } from "react-native";
import { SITE_URL } from "@/config/env";

/**
 * Library files from the curated lists are stored as site-relative paths
 * ("/Notes/BtechCS/2ndsem/Unit 1.pdf"); everything else is an absolute
 * Cloudinary URL. Spaces and other characters must be percent-encoded.
 */
export function resolveFileUrl(src: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  const path = src.startsWith("/") ? src : `/${src}`;
  return `${SITE_URL}${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function fileNameFromUrl(url: string, fallback = "document"): string {
  try {
    const last = decodeURIComponent(url.split("?")[0].split("/").pop() ?? "");
    return last || fallback;
  } catch {
    return fallback;
  }
}

export const fileExtension = (url: string) =>
  (fileNameFromUrl(url).split(".").pop() ?? "").toLowerCase();

export const isImageUrl = (url: string) =>
  ["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(fileExtension(url));

export const isVideoUrl = (url: string) =>
  ["mp4", "webm", "ogg", "mov", "avi"].includes(fileExtension(url));

/**
 * Opens a document in the app's own viewer (`app/viewer.tsx`) — the student
 * never leaves the app. Nothing is downloaded up front.
 */
export async function openDocument(src: string, title?: string): Promise<void> {
  const url = resolveFileUrl(src);
  router.push({ pathname: "/viewer", params: { url, title: title ?? fileNameFromUrl(url, "Document") } });
}

/** Hands the file to the system browser — an escape hatch from the viewer. */
export async function openExternally(src: string): Promise<void> {
  await WebBrowser.openBrowserAsync(resolveFileUrl(src), { toolbarColor: "#6366f1", controlsColor: "#ffffff" });
}

/**
 * Downloads to the app cache, then hands the file to the system share sheet,
 * from which the student can save it to Files / Drive or send it on.
 */
export async function downloadAndShare(
  src: string,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  const url = resolveFileUrl(src);
  const dir = new Directory(Paths.cache, "downloads");
  dir.create({ idempotent: true });

  const task = File.createDownloadTask(url, dir, {
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (totalBytes > 0) onProgress?.(bytesWritten / totalBytes);
    },
  });
  const file = await task.downloadAsync();
  if (!file) throw new Error("The download was interrupted.");

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Saving files isn't supported on this device.");
  }
  await Sharing.shareAsync(file.uri, { dialogTitle: fileNameFromUrl(url) });
}

export const shareLink = (message: string, path = "") =>
  Share.share({ message: path ? `${message}\n${SITE_URL}${path}` : message });
