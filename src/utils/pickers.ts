import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import type { UploadFile } from "@/api/auth";

/** A file chosen on the device, ready for FormData plus what a preview needs. */
export interface PickedFile extends UploadFile {
  size?: number;
  kind: "image" | "video" | "document";
}

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

/**
 * The backend decides how to store a file from its MIME type, and rejects
 * anything not on its allow-list — so a missing or generic type is repaired
 * from the extension before upload.
 */
const normalise = (
  uri: string,
  name: string | null | undefined,
  mime: string | null | undefined,
  fallbackExt: string,
): { name: string; type: string } => {
  const fileName = name || `upload-${Date.now()}.${fallbackExt}`;
  const generic = !mime || mime === "application/octet-stream";
  return { name: fileName, type: generic ? (EXT_MIME[extOf(fileName)] ?? "application/octet-stream") : mime! };
};

export async function pickPhotosAndVideos(limit: number): Promise<PickedFile[]> {
  if (limit <= 0) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images", "videos"],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 0.85,
    exif: false,
  });
  if (result.canceled) return [];

  return result.assets.map((a) => {
    const isVideo = a.type === "video";
    const { name, type } = normalise(a.uri, a.fileName, a.mimeType, isVideo ? "mp4" : "jpg");
    return { uri: a.uri, name, type, size: a.fileSize, kind: isVideo ? "video" : "image" };
  });
}

export async function pickPdfs(limit: number): Promise<PickedFile[]> {
  if (limit <= 0) return [];
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    multiple: limit > 1,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];
  return result.assets.slice(0, limit).map((a) => ({
    uri: a.uri,
    ...normalise(a.uri, a.name, a.mimeType, "pdf"),
    size: a.size,
    kind: "document" as const,
  }));
}

/** Study material: PDF, Word, PowerPoint or an image of the page. */
export async function pickStudyFile(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/*",
    ],
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  const a = result.assets[0];
  const { name, type } = normalise(a.uri, a.name, a.mimeType, "pdf");
  return { uri: a.uri, name, type, size: a.size, kind: type.startsWith("image/") ? "image" : "document" };
}

export async function pickProfilePhoto(fromCamera = false): Promise<PickedFile | null> {
  if (fromCamera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error("Camera access is needed to take a photo. You can enable it in Settings.");
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  };
  const result = fromCamera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;

  const a = result.assets[0];
  const { name, type } = normalise(a.uri, a.fileName, a.mimeType, "jpg");
  // The backend accepts PNG/JPEG/WEBP for avatars only.
  const safeType = ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(type) ? type : "image/jpeg";
  return { uri: a.uri, name, type: safeType, size: a.fileSize, kind: "image" };
}

export const MAX_POST_FILES = 5;
export const MAX_POST_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_RESOURCE_BYTES = 100 * 1024 * 1024;
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export const formatBytes = (n?: number) => {
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};
