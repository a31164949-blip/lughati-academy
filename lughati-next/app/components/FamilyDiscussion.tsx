"use client";
import Link from "next/link";
import { FAMILY_DISCUSSION_TOPIC_MAX_LENGTH } from "../lib/familyDiscussionPolicy";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../firebase";
type Reply = { teacherReply?: string; revision?: string; id: string; text: string; visibility: string; status: string; name: string };
type Topic = { topicId: string; title: string; active: boolean };
export default function FamilyDiscussion({ teacher = false, appreciation = false }: { teacher?: boolean; appreciation?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [mine, setMine] = useState<{ text: string; teacherReply?: string } | null>(null);
  const [teacherDrafts, setTeacherDrafts] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  async function request(u: User, method = "GET", body?: Record<string, unknown>, after?: string) {
    const token = await u.getIdToken();
    const response = await fetch(`/api/${appreciation ? "academy-friends" : "family-discussion"}${after ? `?cursor=${encodeURIComponent(after)}` : ""}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message);
    return data;
  }
  async function load(u: User, after?: string, expected = generation.current) {
    const data = await request(u, "GET", undefined, after);
    if (generation.current !== expected) return;
    setTopic(data.topic); setCursor(data.cursor);
    setReplies(old => after ? [...old, ...data.replies.filter((r: Reply) => !old.some(o => o.id === r.id))] : data.replies);
    if (!after) { setMine(data.mine ?? null); setText(data.mine?.text ?? ""); setVisibility(data.mine?.visibility ?? "private"); setStatus(data.mine?.status ?? ""); }
  }
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      const expected = ++generation.current;
      setUser(u); setMine(null); setTeacherDrafts({}); setTopic(null); setReplies([]); setText(""); setStatus("");
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
  const Container = appreciation ? "section" : "main";
  const Heading = appreciation ? "h3" : "h1";
  return <Container dir="rtl" style={{ minHeight: appreciation ? undefined : "100vh", padding: appreciation ? "24px 0" : "100px 16px 40px", background: "#f4faf7", color: "#17352a", fontFamily: "Arial" }}><div style={{ maxWidth: 850, margin: "auto", display: "grid", gap: 18 }}>
    {!appreciation && <Link href={teacher ? "/teacher" : "/journey"}>العودة ←</Link>}
    <Heading>{appreciation ? "رسائلكم وذكرياتكم مع الأكاديمية" : "🤝 نتحاور من أجل أبنائنا"}</Heading><p>{appreciation ? "شاركونا كلمة أو ذكرى جميلة. نرجو تجنّب الأسماء والتفاصيل الشخصية في المشاركات العامة." : "نتبادل الأفكار والتجارب التي تساعد أبناءنا على التعلّم. نرجو تجنّب الأسماء والتفاصيل الشخصية في المشاركات العامة."}</p>
    <p>{appreciation ? "ردّك الخاص يطّلع عليه المعلم وحده، ويظهر لك ردّه هنا. وإذا اخترت مشاركة عامة، فلن تُنشر إلا بعد اعتماده." : "يقرأ معلمك مشاركتك ويردّ عليها في هذه الزاوية؛ لنتعاون على تجاوز الصعوبات ودعم تعلّم ابنك. تبقى المشاركة الخاصة وردّ المعلم عليها بين الأسرة والمعلم."}</p>
    {!user ? <p>سجّل دخولك إلى الأكاديمية لكتابة ردّك. {appreciation && <Link href="/login">دخول الطالب أو الأسرة ←</Link>}</p> : <>
      {teacher && !appreciation && <section style={{ background: "white", padding: 20, borderRadius: 20 }}><h2>طرح موضوع جديد</h2><p>نشر موضوع جديد يستبدل الموضوع الحالي. تبقى مشاركات الموضوع السابق محفوظة.</p><label>موضوع الحوار<textarea style={{ ...field, minHeight: 220, lineHeight: 1.9, resize: "vertical" }} rows={8} maxLength={FAMILY_DISCUSSION_TOPIC_MAX_LENGTH} value={title} onChange={e => setTitle(e.target.value)} aria-describedby="topic-length" /></label><p id="topic-length">{title.length} / {FAMILY_DISCUSSION_TOPIC_MAX_LENGTH} حرف</p><button style={button} disabled={busy || !title.trim()} onClick={() => void act("POST", { title })}>نشر الموضوع</button></section>}
      <button style={button} disabled={busy} onClick={() => void act("GET")}>تحديث المشاركات</button>
      {topic ? <section style={{ background: "white", padding: 20, borderRadius: 20 }}><h2>موضوع الحوار</h2><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.95, fontSize: 18 }}>{topic.title}</p><p>{topic.active ? "المشاركة مفتوحة" : "المشاركة مغلقة"}</p>
        {teacher ? <button style={button} disabled={busy} onClick={() => void act("PATCH", { topicId: topic.topicId, active: !topic.active })}>{topic.active ? "إغلاق المشاركة" : "فتح المشاركة"}</button> : <><label>مشاركة الأسرة<textarea style={field} rows={5} maxLength={800} disabled={!topic.active || busy} value={text} onChange={e => setText(e.target.value)} /></label><p>{text.length} / 800</p><fieldset disabled={busy || !topic.active}><legend>من يمكنه رؤية مشاركتك؟</legend><label><input type="radio" name="visibility" checked={visibility === "private"} onChange={() => setVisibility("private")} /> المعلم فقط</label><br /><label><input type="radio" name="visibility" checked={visibility === "public"} onChange={() => setVisibility("public")} /> الجميع بعد اعتماد المعلم</label></fieldset><p>يمكنك تعديل مشاركتك. كل تعديل لمشاركة عامة يحتاج اعتمادًا جديدًا.</p><button style={button} disabled={busy || !topic.active || !text.trim()} onClick={() => void act("POST", { topicId: topic.topicId, text, visibility })}>حفظ المشاركة</button>{status && <p>حالة مشاركتك: {labels[status]}</p>}{mine?.teacherReply && <div style={{ background: "#eef8f2", padding: 16, borderRadius: 12, marginTop: 16 }}><h3>رد المعلم على مشاركتك</h3><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.9 }}>{mine.teacherReply}</p></div>}</>}
      </section> : <p>لا يوجد موضوع مطروح حاليًا.</p>}
      <p role="status" aria-live="polite">{busy ? "جارٍ التحميل…" : message}</p>
      <h2>{teacher ? "مشاركات الأسر" : "المشاركات المعتمدة"}</h2>
      {replies.map(r => <article key={r.id} style={{ background: "white", padding: 18, borderRadius: 16, overflowWrap: "anywhere" }}><b>{teacher ? `أسرة ${r.name}` : r.name}</b><p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{r.text}</p>{r.teacherReply && <div style={{ background: "#eef8f2", padding: 14, borderRadius: 12 }}><strong>👨‍🏫 رد المعلم</strong><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.9 }}>{r.teacherReply}</p></div>}{teacher && <div style={{ marginTop: 16 }}><label>ردك على هذه المشاركة<textarea style={field} rows={4} maxLength={1500} disabled={busy} value={teacherDrafts[r.id] ?? r.teacherReply ?? ""} onChange={e => setTeacherDrafts(old => ({ ...old, [r.id]: e.target.value }))} /></label><p>{r.status === "published" ? "سيظهر ردك للجميع مع المشاركة المنشورة." : "ترى الأسرة ردك على مشاركتها. وإذا اعتمدت نشر المشاركة العامة لاحقًا، سيظهر الرد معها للجميع."}</p><button style={button} disabled={busy || !(teacherDrafts[r.id] ?? r.teacherReply ?? "").trim()} onClick={() => void act("PATCH", { topicId: topic?.topicId, replyId: r.id, revision: r.revision, action: "respond", teacherReply: teacherDrafts[r.id] ?? r.teacherReply ?? "" })}>حفظ الرد</button></div>}{teacher && <><p>{labels[r.status]} · {r.visibility === "private" ? "للمعلم فقط" : "طلب النشر للجميع"}</p>{r.visibility === "public" && r.status !== "published" && <button disabled={busy} style={button} onClick={() => void act("PATCH", { topicId: topic?.topicId, replyId: r.id, revision: r.revision, action: "publish" })}>اعتماد النشر</button>} {r.status !== "hidden" && <button disabled={busy} style={button} onClick={() => void act("PATCH", { topicId: topic?.topicId, replyId: r.id, revision: r.revision, action: "hide" })}>إخفاء</button>}</>}</article>)}
      {topic && replies.length === 0 && <p>لا توجد مشاركات للعرض بعد.</p>}
      {cursor && <button style={button} disabled={busy} onClick={() => void act("GET", undefined, cursor)}>عرض المزيد</button>}
    </>}
  </div></Container>;
}
