import { uploadCloudinary } from "./uploadCloudinary";

const FILE_TYPES: Record<string, string> = {
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg",
  png: "image/png", webp: "image/webp", doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function uploadHomeworkAttachment(source: File) {
  const inferredType = FILE_TYPES[source.name.split(".").pop()?.toLowerCase() || ""];
  const contentType = !source.type || source.type === "application/octet-stream"
    ? inferredType : source.type;
  if (!contentType || !Object.values(FILE_TYPES).includes(contentType)) {
    throw new Error("نوع الملف غير مدعوم. اختر PDF أو صورة JPG أو PNG أو WebP أو ملف Word.");
  }
  if (!source.size || source.size > 10 * 1024 * 1024) {
    throw new Error("اختر ملفًا غير فارغ بحجم لا يتجاوز 10 ميجابايت.");
  }
  // Some iPad file providers omit MIME metadata; supply it before uploading.
  const file = contentType === source.type ? source
    : new File([source], source.name, { type: contentType, lastModified: source.lastModified });
  const resourceType = contentType.startsWith("image/") || contentType === "application/pdf"
    ? "image" : "raw";
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", "lughati_homework_upload");
  const response = await uploadCloudinary(
    `https://api.cloudinary.com/v1_1/ffv5igmg/${resourceType}/upload`,
    { method: "POST", body },
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = typeof data?.error?.message === "string" ? `: ${data.error.message}` : ". أعد المحاولة.";
    throw new Error(`تعذر رفع المرفق${detail}`);
  }
  if (typeof data?.secure_url !== "string" || !/^https:\/\/res\.cloudinary\.com\/ffv5igmg\/(image|raw)\/upload\//.test(data.secure_url)) {
    throw new Error("لم تُرجع خدمة الرفع رابطًا صالحًا للمرفق. أعد المحاولة.");
  }
  return { downloadUrl: data.secure_url as string, fileName: source.name };
}
