"use client";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

type Notice = { noticeId: string; title: string; text: string; allowReplies: boolean };
export default function ClubImportantNotice({ user, teacherPreview = false }: { user: User; teacherPreview?: boolean }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [reply, setReply] = useState("");
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/academy-club/notice${teacherPreview ? "?teacherPreview=1" : ""}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "تعذر تحميل الرسالة.");
        if (controller.signal.aborted) return;
        setNotice(data.notice); setReply(data.reply?.text || ""); setSaved(Boolean(data.reply)); setMessage("");
      } catch (error) {
        if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "تعذر تحميل الرسالة.");
      }
    }
    void load();
    return () => controller.abort();
  }, [user, teacherPreview, refresh]);
  async function send() {
    if (!notice || busy || !reply.trim() || teacherPreview) return;
    setBusy(true); setMessage("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/academy-club/notice", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ noticeId: notice.noticeId, text: reply }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "تعذر إرسال الرد.");
      setSaved(true); setMessage("وصل ردك إلى المعلم ✅");
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر إرسال الرد."); }
    finally { setBusy(false); }
  }
  if (!notice && !message) return null;
  return <section id="club-important-notice" aria-labelledby="club-notice-heading" style={{ marginBottom: 24, padding: "clamp(20px,5vw,32px)", background: "#fff8dc", border: "2px solid #dcaa35", borderRadius: 24, boxShadow: "0 12px 30px #7c580815", scrollMarginTop: 20 }}>
    <h2 id="club-notice-heading" style={{ margin: "0 0 12px", color: "#805500" }}>📌 تنبيه هام من معلمك</h2>
    {notice && <><h3 style={{ color: "#17352a", fontSize: 24 }}>{notice.title}</h3><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.9, fontSize: 19 }}>{notice.text}</p>
      {teacherPreview ? <p>👁️ معاينة المعلم؛ الرد متاح للأعضاء فقط.</p> : <div>
        <label htmlFor="club-notice-reply" style={{ fontWeight: 800 }}>💬 ردّك على المعلم</label>
        <p style={{ color: "#675a37" }}>ردك خاص بك وبالمعلم؛ لا يراه زملاؤك.</p>
        <textarea id="club-notice-reply" maxLength={1000} rows={4} value={reply} onChange={event => setReply(event.target.value)} disabled={busy || !notice.allowReplies} style={{ width: "100%", boxSizing: "border-box", border: "1px solid #d7c082", borderRadius: 14, padding: 14, font: "inherit", resize: "vertical" }} />
        {notice.allowReplies ? <button onClick={() => void send()} disabled={busy || !reply.trim()} style={{ marginTop: 12, padding: "12px 20px", border: 0, borderRadius: 12, background: "#176c46", color: "white", font: "inherit", fontWeight: 800 }}>{busy ? "جارٍ الإرسال..." : saved ? "تحديث ردي" : "إرسال ردي"}</button> : <p>🔒 أغلق المعلم استقبال الردود.</p>}
      </div>}</>}
    {message && <p role="status" aria-live="polite">{message}</p>}
    <button disabled={busy} onClick={() => setRefresh(value => value + 1)} style={{ marginTop: 12, background: "transparent", color: "#805500", border: "1px solid #d7c082", borderRadius: 10, padding: 9, font: "inherit" }}>تحديث الرسالة</button>
  </section>;
}
