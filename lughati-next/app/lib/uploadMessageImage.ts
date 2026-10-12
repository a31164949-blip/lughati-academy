import { uploadCloudinary } from "./uploadCloudinary";

export async function uploadMessageImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 30 * 1024 * 1024) {
    throw new Error("اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز 30 ميجابايت.");
  }
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", "lughati_homework_upload");
  const response = await uploadCloudinary("https://api.cloudinary.com/v1_1/ffv5igmg/image/upload", { method: "POST", body });
  const data = await response.json();
  if (!response.ok || typeof data.secure_url !== "string" || !/^https:\/\/res\.cloudinary\.com\/ffv5igmg\/image\/upload\//.test(data.secure_url)) {
    throw new Error("تعذر رفع الصورة. أعد المحاولة؛ لم تُرسل الرسالة.");
  }
  return data.secure_url;
}
