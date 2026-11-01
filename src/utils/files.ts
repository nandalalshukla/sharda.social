import { Directory, File, Paths } from "expo-file-system";
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
 * Opens a document the way the OS would for any link: PDFs and Office files
 * open in the in-app browser sheet, which handles viewing and its own
 * share/save controls. Nothing is downloaded up front.
 */
export async function openDocument(src: string) {
  const url = resolveFileUrl(src);
  // Browsers on both platforms can't render Office formats inline; the Google
  // viewer can, and it also renders PDFs reliably on older Android WebViews.
  const ext = fileExtension(url);
  const viewable = ["doc", "docx", "ppt", "pptx"].includes(ext)
    ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`
    : url;
  await WebBrowser.openBrowserAsync(viewable, {
    toolbarColor: "#6366f1",
    controlsColor: "#ffffff",
    showTitle: true,
    enableBarCollapsing: true,
  });
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
