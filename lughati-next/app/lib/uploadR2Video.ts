import { prepareVideo, type VideoProgress } from "./compressVideo";
import { auth } from "../../firebase";
const requests = new WeakMap<File, string>();
export async function uploadR2Video(file: File, purpose: "stories" | "works", progress?: VideoProgress) {
  const user = auth.currentUser;
  if (!user) throw new Error("سجّل الدخول من جديد.");
  file = await prepareVideo(file, progress);
  const token = await user.getIdToken();
  const requestId = requests.get(file) || crypto.randomUUID();
  requests.set(file, requestId);
  const response = await fetch("/api/media/video", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ purpose, requestId, size: file.size, contentType: file.type }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "تعذر تجهيز رفع الفيديو.");
  const upload = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!upload.ok) throw new Error("تعذر رفع الفيديو. أعد المحاولة بالملف نفسه.");
  return { reservationId: data.reservationId as string, secure_url: `/api/media/video?purpose=${purpose}&id=${encodeURIComponent(data.reservationId)}`, public_id: "", duration: 0 };
}

export async function openR2Video(src: string) {
  const tab = window.open("about:blank", "_blank");
  if (tab) tab.opener = null;
  try {
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
    const response = await fetch(src, { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.url) throw new Error(data.message || "تعذر فتح الفيديو.");
    if (tab) tab.location.href = data.url;
    else window.location.href = data.url;
  } catch (error) {
    tab?.close();
    window.alert(error instanceof Error ? error.message : "تعذر فتح الفيديو.");
  }
}
