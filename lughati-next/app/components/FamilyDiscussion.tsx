"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../firebase";
type Reply = { revision?: string; id: string; text: string; visibility: string; status: string; name: string };
type Topic = { topicId: string; title: string; active: boolean };
export default function FamilyDiscussion({ teacher = false }: { teacher?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  async function request(u: User, method = "GET", body?: Record<string, unknown>, after?: string) {
    const token = await u.getIdToken();
    const response = await fetch(`/api/family-discussion${after ? `?cursor=${encodeURIComponent(after)}` : ""}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message);
    return data;
  }
  async function load(u: User, after?: string, expected = generation.current) {
    const data = await request(u, "GET", undefined, after);
    if (generation.current !== expected) return;
    setTopic(data.topic); setCursor(data.cursor);
    setReplies(old => after ? [...old, ...data.replies.filter((r: Reply) => !old.some(o => o.id === r.id))] : data.replies);
    if (!after) { setText(data.mine?.text ?? ""); setVisibility(data.mine?.visibility ?? "private"); setStatus(data.mine?.status ?? ""); }
  }
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      const expected = ++generation.current;
      setUser(u); setTopic(null); setReplies([]); setText(""); setStatus("");
      if (u) { setBusy(true); void load(u, undefined, expected).catch(e => { if (generation.current === expected) setMessage(e.message); }).finally(() => { if (generation.current === expected) setBusy(false); }); }
    });
    // Invalidates outstanding responses after unmount or identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { ++generation.current; unsub(); };
    // The auth subscription loads once per identity; subsequent loads are manual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function act(method: string, body?: Record<string, unknown>, after?: string) {
    if (!user || busy || lock.current) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      if (method !== "GET") await request(user, method, body);
      await load(user, after);
      if (method !== "GET") setMessage("تم الحفظ ✅");
    } catch (e) { setMessage(e instanceof Error ? e.message : "تعذر إتمام الطلب."); }
    finally { lock.current = false; setBusy(false); }
  }
  const field = { width: "100%", padding: 12, border: "1px solid #bed8ca", borderRadius: 12, font: "inherit", boxSizing: "border-box" as const };
  const button = { padding: "12px 16px", border: 0, borderRadius: 12, background: "#176c46", color: "white", font: "inherit", cursor: "pointer" };
  const labels: Record<string, string> = { private: "للمعلم فقط", pending: "بانتظار اعتماد المعلم", published: "منشورة للجميع", hidden: "غير منشورة" };
  return <main dir="rtl" style={{ minHeight: "100vh", padding: "100px 16px 40px", background: "#f4faf7", color: "#17352a", fontFamily: "Arial" }}><div style={{ maxWidth: 850, margin: "auto", display: "grid", gap: 18 }}>
    <Link href={teacher ? "/teacher" : "/journey"}>العودة ←</Link>
    <h1>🤝 نتحاور من أجل أبنائنا</h1><p>نتبادل الأفكار والتجارب التي تساعد أبناءنا على التعلّم. نرجو تجنّب الأسماء والتفاصيل الشخصية في المشاركات العامة.</p>
    {!user ? <p>سجّل دخولك إلى الأكاديمية لفتح الزاوية.</p> : <>
      {teacher && <section style={{ background: "white", padding: 20, borderRadius: 20 }}><h2>طرح موضوع جديد</h2><p>نشر موضوع جديد يستبدل الموضوع الحالي. تبقى مشاركات الموضوع السابق محفوظة.</p><label>موضوع الحوار<textarea style={field} maxLength={220} value={title} onChange={e => setTitle(e.target.value)} /></label><button style={button} disabled={busy || !title.trim()} onClick={() => void act("POST", { title })}>نشر الموضوع</button></section>}
      <button style={button} disabled={busy} onClick={() => void act("GET")}>تحديث المشاركات</button>
      {topic ? <section style={{ background: "white", padding: 20, borderRadius: 20 }}><h2>{topic.title}</h2><p>{topic.active ? "المشاركة مفتوحة" : "المشاركة مغلقة"}</p>
        {teacher ? <button style={button} disabled={busy} onClick={() => void act("PATCH", { topicId: topic.topicId, active: !topic.active })}>{topic.active ? "إغلاق المشاركة" : "فتح المشاركة"}</button> : <><label>مشاركة الأسرة<textarea style={field} rows={5} maxLength={800} disabled={!topic.active || busy} value={text} onChange={e => setText(e.target.value)} /></label><p>{text.length} / 800</p><fieldset disabled={busy || !topic.active}><legend>من يمكنه رؤية مشاركتك؟</legend><label><input type="radio" name="visibility" checked={visibility === "private"} onChange={() => setVisibility("private")} /> المعلم فقط</label><br /><label><input type="radio" name="visibility" checked={visibility === "public"} onChange={() => setVisibility("public")} /> الجميع بعد اعتماد المعلم</label></fieldset><p>يمكنك تعديل مشاركتك. كل تعديل لمشاركة عامة يحتاج اعتمادًا جديدًا.</p><button style={button} disabled={busy || !topic.active || !text.trim()} onClick={() => void act("POST", { topicId: topic.topicId, text, visibility })}>حفظ المشاركة</button>{status && <p>حالة مشاركتك: {labels[status]}</p>}</>}
      </section> : <p>لا يوجد موضوع مطروح حاليًا.</p>}
      <p role="status" aria-live="polite">{busy ? "جارٍ التحميل…" : message}</p>
      <h2>{teacher ? "مشاركات الأسر" : "المشاركات المعتمدة"}</h2>
      {replies.map(r => <article key={r.id} style={{ background: "white", padding: 18, borderRadius: 16, overflowWrap: "anywhere" }}><b>{teacher ? `أسرة ${r.name}` : r.name}</b><p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{r.text}</p>{teacher && <><p>{labels[r.status]} · {r.visibility === "private" ? "للمعلم فقط" : "طلب النشر للجميع"}</p>{r.visibility === "public" && r.status !== "published" && <button disabled={busy} style={button} onClick={() => void act("PATCH", { topicId: topic?.topicId, replyId: r.id, revision: r.revision, action: "publish" })}>اعتماد النشر</button>} {r.status !== "hidden" && <button disabled={busy} style={button} onClick={() => void act("PATCH", { topicId: topic?.topicId, replyId: r.id, revision: r.revision, action: "hide" })}>إخفاء</button>}</>}</article>)}
      {topic && replies.length === 0 && <p>لا توجد مشاركات للعرض بعد.</p>}
      {cursor && <button style={button} disabled={busy} onClick={() => void act("GET", undefined, cursor)}>عرض المزيد</button>}
    </>}
  </div></main>;
}
