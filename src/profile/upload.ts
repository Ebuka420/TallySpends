import { File } from "expo-file-system";

export type ProfilePhoto = { uri: string; name: string; type: string };

/** Prepare bytes before networking so local iOS file errors aren't reported as offline. */
export async function preparePhotoUpload(photo: ProfilePhoto): Promise<FormData> {
  try {
    const file = new File(photo.uri);
    if (!file.exists || file.size === 0) throw new Error("Unreadable photo");
    const bytes = await file.bytes();
    if (!bytes.length) throw new Error("Empty photo");
    const reported = (photo.type || file.type).trim().toLowerCase();
    const type = reported === "image/jpg" ? "image/jpeg" : reported;
    if (!/^image\/[a-z0-9.+-]+$/i.test(type)) throw new Error("Unknown photo format");
    const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/heic": "heic", "image/heif": "heif", "image/webp": "webp", "image/gif": "gif" } as Record<string, string>)[type]
      || "image";
    // Expo's installed multipart converter accepts byte-backed file parts.
    // Use explicit metadata rather than asking it to inspect a native File lazily.
    // A generic filename also avoids sending the user's original photo filename.
    const attachment = { name: `profile.${extension}`, type, bytes: async () => bytes };
    const body = new FormData();
    body.append("file", attachment as unknown as Blob);
    return body;
  } catch {
    throw new Error("Couldn't read or prepare that photo. Please select it again, or try a JPEG or PNG image.");
  }
}
