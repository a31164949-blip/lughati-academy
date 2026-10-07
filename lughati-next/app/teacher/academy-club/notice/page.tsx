"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../../../firebase";

type Notice = { noticeId: string; title: string; text: string; active: boolean; allowReplies: boolean };
type Reply = { id: string; studentName: string; text: string };
const input = { width: "100%", boxSizing: "border-box" as const, padding: 14, border: "1px solid #cadcd1", borderRadius: 12, font: "inherit" };
const button = { padding: "12px 18px", borderRadius: 12, border: 0, background: "#176c46", color: "white", font: "inherit", fontWeight: 800 };
export default function ClubNoticeManager() {
  const [user, setUser] = useState<User | null>(null), [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null), [replies, setReplies] = useState<Reply[]>([]), [cursor, setCursor] = useState("");
  const [title, setTitle] = useState(""), [text, setText] = useState(""), [allowReplies, setAllowReplies] = useState(true);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const publishId = useRef("");
  useEffect(() => onAuthStateChanged(auth, current => { setUser(current); setReady(true); }), []);
  async function request(method = "GET", body?: unknown, after = "", currentUser = user) {
    if (!currentUser) throw new Error("سجل دخولك بحساب المعلم.");
    const token = await currentUser.getIdToken();
    const response = await fetch(`/api/teacher/academy-club/notice${after ? `?cursor=${encodeURIComponent(after)}` : ""}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "تعذر إتمام الطلب.");
    return data;
  }
  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      try {
        const token = await user!.getIdToken();
        const response = await fetch("/api/teacher/academy-club/notice", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "تعذر التحميل.");
        if (active) { setNotice(data.notice); setReplies(data.replies); setCursor(data.nextCursor || ""); }
      } catch (error) { if (active) setMessage(error instanceof Error ? error.message : "تعذر التحميل."); }
    }
    void load(); return () => { active = false; };
  }, [user]);
  async function action(kind: "publish" | "unpin" | "closeReplies" | "refresh" | "more") {
    if (busy) return;
    if (kind === "unpin" && !window.confirm("إلغاء تثبيت الرسالة؟ ستبقى ردودها محفوظة.")) return;
    setBusy(true); setMessage("");
    try {
      if (kind === "publish") {
        if (notice?.active && !window.confirm("نشر رسالة جديدة سيستبدل الرسالة المثبتة الحالية ويرسل تنبيهًا للأعضاء. هل تريد النشر؟")) return;
        publishId.current ||= crypto.randomUUID();
        const data = await request("POST", { noticeId: publishId.current, title, text, allowReplies });
        publishId.current = ""; setTitle(""); setText(""); setMessage(`تم تثبيت الرسالة وإرسال التنبيه إلى ${data.notifiedMembers} عضوًا ✅`);
      } else if (kind === "unpin" || kind === "closeReplies") {
        await request("PATCH", { noticeId: notice?.noticeId, action: kind });
        setMessage(kind === "unpin" ? "تم إلغاء التثبيت." : "تم إغلاق الردود.");
      }
      const data = await request("GET", undefined, kind === "more" ? cursor : "");
      setReplies(previous => kind === "more" && notice?.noticeId === data.notice?.noticeId ? [...previous, ...data.replies] : data.replies);
      setNotice(data.notice); setCursor(data.nextCursor || "");
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر إتمام الطلب."); }
    finally { setBusy(false); }
  }
  return <main dir="rtl" style={{ minHeight: "100vh", background: "#f4faf7", color: "#17352a", padding: "28px 16px", fontFamily: "Arial" }}><div style={{ maxWidth: 850, margin: "auto", display: "grid", gap: 22 }}>
    <Link href="/teacher/academy-club">العودة إلى إدارة النادي ←</Link><h1>📌 الرسالة المهمة لأعضاء النادي</h1>
    {!ready ? <p>جارٍ التحميل...</p> : !user ? <Link href="/teacher-login">سجل دخولك بحساب المعلم</Link> : <>
      <section style={{ background: "white", padding: 24, borderRadius: 22 }}><h2>نشر رسالة جديدة</h2><p>تظهر أعلى النادي، ويصل إشعار داخل الأكاديمية للأعضاء النشطين. ردود الطلاب خاصة بالمعلم. نشر رسالة جديدة يستبدل الرسالة السابقة مع حفظ ردودها.</p>
        <label htmlFor="notice-title">عنوان الرسالة</label><input id="notice-title" value={title} maxLength={120} disabled={busy} onChange={event => { setTitle(event.target.value); publishId.current = ""; }} style={input} />
        <label htmlFor="notice-text" style={{ display: "block", marginTop: 16 }}>نص الرسالة</label><textarea id="notice-text" value={text} maxLength={3000} rows={7} disabled={busy} onChange={event => { setText(event.target.value); publishId.current = ""; }} style={input} />
        <label style={{ display: "block", margin: "16px 0" }}><input type="checkbox" checked={allowReplies} disabled={busy} onChange={event => { setAllowReplies(event.target.checked); publishId.current = ""; }} /> السماح للأعضاء بالرد</label>
        <button style={button} disabled={busy || !title.trim() || !text.trim()} onClick={() => void action("publish")}>نشر وتثبيت الرسالة</button>
      </section>
      {notice && <section style={{ background: "#fff8dc", padding: 24, borderRadius: 22, border: "2px solid #dcaa35" }}><h2>{notice.active ? "📌 الرسالة المثبتة" : "آخر رسالة — أُلغي تثبيتها"}</h2><h3>{notice.title}</h3><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.9 }}>{notice.text}</p><div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {notice.active && <button style={button} disabled={busy} onClick={() => void action("unpin")}>إلغاء التثبيت</button>}
        {notice.active && notice.allowReplies && <button style={button} disabled={busy} onClick={() => void action("closeReplies")}>إغلاق الردود</button>}
        <button style={button} disabled={busy} onClick={() => void action("refresh")}>تحديث الردود</button>
      </div><h3>💬 ردود الأعضاء ({replies.length} محمّلة)</h3>{!replies.length && <p>لم يصل رد بعد.</p>}{replies.map(reply => <article key={reply.id} style={{ background: "white", borderRadius: 14, padding: 16, marginTop: 12 }}><strong>{reply.studentName}</strong><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.8 }}>{reply.text}</p></article>)}{cursor && <button style={{ ...button, marginTop: 14 }} disabled={busy} onClick={() => void action("more")}>تحميل المزيد من الردود</button>}</section>}
    </>}{message && <p role="status" aria-live="polite" style={{ padding: 16, background: "#e6f3eb", borderRadius: 12 }}>{message}</p>}
  </div></main>;
}
