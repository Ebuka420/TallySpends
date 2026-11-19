export const MAX_COACH_ATTACHMENTS = 3;
export const MAX_COACH_FILE_BYTES = 5 * 1024 * 1024;
export const COACH_ATTACHMENT_LIMITS = "Up to 3 photos or PDFs · 5 MB each · No videos";
export const COACH_ATTACHMENT_NOTICE = "Attachment sending isn't available yet. Remove attachments to send a text message.";

export type CoachAttachment = { uri: string; name: string; size: number; mimeType: string };
export type AttachmentCandidate = { uri: string; name: string; size?: number; mimeType?: string; type?: string };
const types: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  heic: "image/heic", heif: "image/heif", pdf: "application/pdf",
};

export function validateCoachAttachments(existing: CoachAttachment[], candidates: AttachmentCandidate[]): CoachAttachment[] {
  if (existing.length + candidates.length > MAX_COACH_ATTACHMENTS) throw new Error("Attach up to 3 files at a time.");
  const validated = candidates.map(file => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if ((file.type && file.type !== "image") || file.mimeType?.toLowerCase().startsWith("video/") || /^(mp4|mov|m4v|avi|webm|mkv|3gp)$/.test(extension)) {
      throw new Error("Videos aren't supported. Choose a photo or PDF.");
    }
    const mimeType = file.mimeType?.toLowerCase() || types[extension];
    // Photo pickers can convert HEIC to JPEG while keeping the original name.
    const mismatchedDocument = types[extension] && (types[extension] === "application/pdf") !== (mimeType === "application/pdf");
    if (!mimeType || !Object.values(types).includes(mimeType) || mismatchedDocument) {
      throw new Error("Choose a JPG, PNG, WebP, HEIC, HEIF photo or PDF.");
    }
    if (!file.uri || !Number.isSafeInteger(file.size) || file.size! <= 0) throw new Error("Couldn't check this file's size. Choose another file.");
    if (file.size! > MAX_COACH_FILE_BYTES) throw new Error(`${file.name} is too large. Each file must be 5 MB or smaller.`);
    return { uri: file.uri, name: file.name, size: file.size!, mimeType };
  });
  return [...existing, ...validated];
}
