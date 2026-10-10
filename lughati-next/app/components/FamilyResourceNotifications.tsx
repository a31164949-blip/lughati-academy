"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
type Notice = { id: string; type: string; title: string; message: string; href: string; read: boolean };
export default function FamilyResourceNotifications() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => {
    let alive = true;
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!user) { if (alive) setNotices([]); return; }
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/student-notifications", { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
        if (!response.ok) throw new Error("LOAD_FAILED");
        const data = await response.json();
        if (alive) setNotices((Array.isArray(data.notifications) ? data.notifications : []).filter((notice: Notice) => notice.type === "familyLearningResource"));
      } catch { if (alive) setError("تعذر تحديث إشعارات المواد. يمكنك الاطلاع على المواد أسفل الصفحة."); }
    });
    return () => { alive = false; unsubscribe(); };
  }, []);
  async function open(notice: Notice) {
    setBusy(notice.id);
    let marked = false;
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) { const response = await fetch("/api/student-notifications", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: notice.id }) }); marked = response.ok; }
    } catch { setError("تعذر تسجيل الاطلاع على الإشعار. يمكنك فتح المادة."); } finally {
      const match = /^\/quizzes#learning-resource-([A-Za-z0-9_-]+)$/.exec(notice.href);
      if (match) { window.location.hash = "learning-resource-" + match[1]; document.getElementById("learning-resource-" + match[1])?.scrollIntoView({ block: "start" }); }
      if (marked) setNotices(current => current.map(item => item.id === notice.id ? { ...item, read: true } : item));
      setBusy("");
    }
  }
  if (!notices.length && !error) return null;
  return <section aria-label="إشعارات مواد المعلم" className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
    <h2 className="mb-3 text-lg font-bold">🔔 مواد أرسلها المعلم لابنكم</h2>
    {error && <p role="status">{error}</p>}
    {notices.map(notice => <div key={notice.id} className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><strong>{notice.title}</strong><p>{notice.message}</p></div><button type="button" disabled={!!busy} onClick={() => void open(notice)} className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white">{busy === notice.id ? "جارٍ الفتح…" : notice.read ? "عرض المادة" : "جديد — عرض المادة"}</button></div>)}
  </section>;
}
