"use client";
import { useState } from "react";
import type { User } from "firebase/auth";
type Notice = { noticeId: string; title: string; text: string; createdAt?: string };
type Reply = { id: string; studentName: string; text: string };
const button = { padding: "12px 18px", borderRadius: 12, border: 0, background: "#176c46", color: "white", font: "inherit", fontWeight: 800, cursor: "pointer" };
export default function NoticeArchive({ user }: { user: User }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [notices, setNotices] = useState<Notice[]>([]), [historyCursor, setHistoryCursor] = useState("");
  const [selected, setSelected] = useState<Notice | null>(null), [replies, setReplies] = useState<Reply[]>([]), [replyCursor, setReplyCursor] = useState("");
  async function read(params: Record<string, string>) {
    const token = await user.getIdToken();
    const response = await fetch(`/api/teacher/academy-club/notice?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "تعذر تحميل السجل.");
    return data;
  }
  async function loadHistory(more = false) {
    if (busy) return;
    setOpen(true); setBusy(true); setError("");
    try {
      const data = await read({ archive: "1", cursor: more ? historyCursor : "" });
      setNotices(previous => more ? [...previous, ...data.notices] : data.notices); setHistoryCursor(data.nextCursor || "");
    } catch (error) { setError(error instanceof Error ? error.message : "تعذر تحميل السجل."); }
    finally { setBusy(false); }
  }
  async function loadReplies(notice: Notice, more = false) {
    if (busy) return;
    setBusy(true); setError("");
    if (!more) { setSelected(null); setReplies([]); setReplyCursor(""); }
    try {
      const data = await read({ noticeId: notice.noticeId, cursor: more ? replyCursor : "" });
      if (!data.notice) throw new Error("لم تعد هذه الرسالة متاحة.");
      setSelected({ ...notice, ...data.notice }); setReplies(previous => more ? [...previous, ...data.replies] : data.replies); setReplyCursor(data.nextCursor || "");
    } catch (error) { setError(error instanceof Error ? error.message : "تعذر تحميل الردود."); }
    finally { setBusy(false); }
  }
  return <section style={{ background: "white", padding: 24, borderRadius: 22, border: "1px solid #cadcd1" }}>
    <h2>🗂️ سجل الرسائل السابقة</h2><p>افتح الرسالة للاطلاع على نصها وأسماء الأعضاء الذين ردوا عليها. الاطلاع على السجل لا يعيد نشر الرسالة ولا يرسل تنبيهًا.</p>
    <button type="button" style={button} disabled={busy} onClick={() => open ? setOpen(false) : void loadHistory()} aria-expanded={open}>{open ? "إغلاق السجل" : "عرض الرسائل السابقة وردودها"}</button>
    {open && <>
      {!busy && !notices.length && !error && <p>لا توجد رسائل سابقة محفوظة.</p>}
      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>{notices.map(notice => <button type="button" key={notice.noticeId} disabled={busy} onClick={() => void loadReplies(notice)} style={{ ...button, textAlign: "right", background: selected?.noticeId === notice.noticeId ? "#fff0ba" : "#edf7f1", color: "#17352a", overflowWrap: "anywhere" }}>
        <strong>{notice.title}</strong>{notice.createdAt && <span style={{ display: "block", marginTop: 8, fontSize: 14 }}>{new Date(notice.createdAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}</span>}<span style={{ display: "block", marginTop: 8 }}>عرض الرسالة والمتفاعلين ←</span>
      </button>)}</div>
      {historyCursor && <button type="button" style={{ ...button, marginTop: 16 }} disabled={busy} onClick={() => void loadHistory(true)}>تحميل رسائل أقدم</button>}
      {selected && <article style={{ background: "#fff8dc", padding: 20, marginTop: 20, borderRadius: 16 }}>
        <h3>{selected.title}</h3><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.9 }}>{selected.text}</p>
        <h3>الأعضاء الذين ردوا على هذه الرسالة: {replies.length}{replyCursor ? " (الردود المحمّلة)" : ""}</h3>
        {!replies.length && <p>لم تُحفظ ردود على هذه الرسالة.</p>}
        {replies.map(reply => <div key={reply.id} style={{ background: "white", padding: 16, marginTop: 12, borderRadius: 12 }}><strong>{reply.studentName}</strong><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.8 }}>{reply.text}</p></div>)}
        {replyCursor && <button type="button" style={{ ...button, marginTop: 16 }} disabled={busy} onClick={() => void loadReplies(selected, true)}>تحميل المزيد من الردود</button>}
      </article>}
    </>}{busy && <p role="status">جارٍ التحميل...</p>}{error && <p role="alert" style={{ color: "#a22" }}>{error}</p>}
  </section>;
}
