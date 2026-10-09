export type ClubAttachment = { id: string; name: string; contentType: string; size: number };
export const CLUB_ATTACHMENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "application/pdf": "pdf", "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm",
};
export const MAX_CLUB_ATTACHMENTS = 6;
export const MAX_CLUB_ATTACHMENT_BYTES = 20 * 1024 * 1024;
