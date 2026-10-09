import { auth } from "../../firebase";
import { prepareImage } from "./uploadCloudinary";
import { prepareVideo } from "./compressVideo";
import { CLUB_ATTACHMENT_TYPES, MAX_CLUB_ATTACHMENT_BYTES, type ClubAttachment } from "./clubAttachments";
export async function uploadClubAttachment(source: File): Promise<ClubAttachment> {
  const user = auth.currentUser;
  if (!user) throw new Error("سجّل الدخول من جديد.");
  let file = source;
  if (file.type.startsWith("video/")) file = await prepareVideo(file);
  else if (file.type.startsWith("image/")) file = await prepareImage(file);
  if (!Object.hasOwn(CLUB_ATTACHMENT_TYPES, file.type) || file.size > MAX_CLUB_ATTACHMENT_BYTES) throw new Error("اختر صورة أو PDF أو Word أو PowerPoint أو فيديو، بحد أقصى 20 ميجابايت.");
  const token = await user.getIdToken();
  const response = await fetch("/api/teacher/academy-club/attachments", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: source.name, size: file.size, contentType: file.type }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "تعذر رفع المرفق.");
  const upload = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!upload.ok) throw new Error("تعذر رفع المرفق. أعد المحاولة.");
  return { id: data.id, name: source.name, size: file.size, contentType: file.type };
}
export async function openClubAttachment(id: string) {
  const tab = window.open("about:blank", "_blank");
  if (tab) tab.opener = null;
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("سجّل الدخول لفتح المرفق.");
    const response = await fetch(`/api/academy-club/attachments?id=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.url) throw new Error(data.message || "تعذر فتح المرفق.");
    if (tab) tab.location.href = data.url; else window.location.href = data.url;
  } catch (error) { tab?.close(); window.alert(error instanceof Error ? error.message : "تعذر فتح المرفق."); }
}
