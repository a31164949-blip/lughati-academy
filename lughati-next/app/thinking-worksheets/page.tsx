"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../firebase";
import { thinkingWorksheets } from "../lib/thinkingWorksheets";
import styles from "./worksheets.module.css";
type Result = { score: number; total: number; feedback: { correct: boolean; correctAnswer: number; explanation: string }[] };
export default function ThinkingWorksheetsPage() {
 const generation = useRef(0);
 const [user, setUser] = useState<User | null>(null);
 const [active, setActive] = useState<string | null>(null);
 const [answers, setAnswers] = useState<Record<string, number[]>>({});
 const [reflections, setReflections] = useState<Record<string, string>>({});
 const [results, setResults] = useState<Record<string, Result>>({});
 const [busy, setBusy] = useState(false);
 const [message, setMessage] = useState("");
 useEffect(() => onAuthStateChanged(auth, u => { ++generation.current; setBusy(false); setUser(u); setActive(null); setAnswers({}); setReflections({}); setResults({}); setMessage(""); }), []);
 const sheet = thinkingWorksheets.find(s => s.id === active);
 const selected = sheet ? answers[sheet.id] ?? [] : [];
 const result = sheet ? results[sheet.id] : undefined;
 async function submit() {
  if (!user || !sheet || busy) return;
  if (!sheet.questions.every((_, i) => Number.isInteger(selected[i]))) { setMessage("بقي سؤال دون إجابة. خذ وقتك وأكمله."); return; }
  const version = generation.current;
  setBusy(true); setMessage("");
  try {
   const response = await fetch("/api/thinking-worksheets", { method: "POST", headers: { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" }, body: JSON.stringify({ worksheetId: sheet.id, answers: selected, reflection: reflections[sheet.id] ?? "" }) });
   const data = await response.json();
   if (generation.current !== version) return;
   if (!response.ok || !data.success) throw new Error(data.message);
   setResults(old => ({ ...old, [sheet.id]: data })); setMessage("تم حفظ محاولتك وإتاحتها لمعلمك ✅ راجع تفسير الإجابات أدناه.");
  } catch(e) { if (generation.current === version) setMessage(e instanceof Error ? e.message : "تعذر الحفظ."); }
  finally { if (generation.current === version) setBusy(false); }
 }
 return <main className={styles.page} dir="rtl"><div className={styles.container}><Link href="/journey">← العودة إلى رحلتي</Link><header className={styles.hero}><span>أكاديمية لغتي الرقمية • الصف الثاني الابتدائي</span><h1>🧠 أوراق التفكير</h1><p>أقرأ، أبحث عن الدليل، وأختار بثقة.</p><small>للأسرة: ساعدوا في قراءة السؤال عند الحاجة، واتركوا التفكير والإجابة للطالب. لا يوجد مؤقّت؛ الدقة أهم من السرعة.</small></header>
 {!sheet ? <div className={styles.grid}>{thinkingWorksheets.map(s => <article className={styles.sheet} key={s.id}><span className={styles.icon}>{s.icon}</span><h2>{s.title}</h2><p>{s.skill}</p><p>٥ أسئلة + مساحة لشرح تفكيرك</p><button onClick={() => { setActive(s.id); setMessage(""); }}>افتح الورقة ←</button></article>)}</div> : <section className={styles.paper}><div className={styles.paperHeading}><div><span>{sheet.skill}</span><h2>{sheet.icon} {sheet.title}</h2></div><button disabled={busy} onClick={() => { setActive(null); setMessage(""); }}>جميع الأوراق</button></div><p>اختر إجابة واحدة لكل سؤال. يُظهر زر المراجعة تفسير الإجابات ويحفظ محاولتك.</p>
 {sheet.questions.map((q,i) => <fieldset className={styles.question} key={q.id} disabled={busy || !!result}><legend>{i+1}. {q.prompt}</legend><div className={styles.options}>{q.options.map((o,j) => <label key={j} className={selected[i] === j ? styles.selected : ""}><input type="radio" name={`${sheet.id}-${q.id}`} checked={selected[i] === j} onChange={() => setAnswers(old => { const next = [...(old[sheet.id] ?? [])]; next[i] = j; return { ...old, [sheet.id]: next }; })} />{o}</label>)}</div>{result && <div className={styles.feedback}><strong>{result.feedback[i].correct ? "أحسنت، استدلالك صحيح 🌟" : "لنتعلّم من هذه المحاولة 🌱"}</strong><p>الإجابة المناسبة: {q.options[result.feedback[i].correctAnswer]}</p><p>{result.feedback[i].explanation}</p></div>}</fieldset>)}
 <label className={styles.reflection}><strong>✍️ كيف فكّرت؟ (اختياري)</strong><span>{sheet.reflection}</span><textarea maxLength={300} rows={3} value={reflections[sheet.id] ?? ""} disabled={busy || !!result} onChange={e => setReflections(old => ({ ...old, [sheet.id]: e.target.value }))} placeholder="اكتب فكرتك بكلماتك…" /><small>{(reflections[sheet.id] ?? "").length} / ٣٠٠ حرف</small></label>
 {result ? <div className={styles.summary}><h3>أكملت الورقة 👏 نتيجتك: {result.score} / {result.total}</h3><p>راجع الدليل، ثم جرّب مرة أخرى لتتعلّم أكثر.</p><button onClick={() => { setResults(old => { const next = { ...old }; delete next[sheet.id]; return next; }); setAnswers(old => ({ ...old, [sheet.id]: [] })); setMessage(""); }}>محاولة جديدة</button></div> : <button disabled={busy || !user} onClick={() => void submit()}>{busy ? "جارٍ حفظ المحاولة…" : "راجع إجاباتي واحفظ محاولتي"}</button>}
 {!user && <p><Link href="/login?returnTo=%2Fthinking-worksheets">سجّل دخول الطالب لحل الورقة وحفظ النتيجة ←</Link></p>}<p role="status" aria-live="polite">{message}</p></section>}
 </div></main>;
}
