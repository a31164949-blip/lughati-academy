"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../firebase";
import { littleTeacherLessonTitle, type LittleTeacherLesson } from "../lib/littleTeacherSpelling";

async function settings(account: User, body?: { title: string; revision: string }): Promise<LittleTeacherLesson> {
  const response = await fetch("/api/teacher/little-teacher-spelling", {
    method: body ? "PATCH" : "GET", cache: "no-store",
    headers: { Authorization: `Bearer ${await account.getIdToken()}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok || !data.success || !data.lesson || typeof data.lesson.title !== "string" || typeof data.lesson.lessonId !== "string" || typeof data.lesson.revision !== "string") throw Error(data.message || "تعذر تحميل عنوان الدرس.");
  return data.lesson;
}
export default function LittleTeacherLessonSettings() {
  const [user,setUser] = useState<User | null>(null), [lesson,setLesson] = useState<LittleTeacherLesson | null>(null), [title,setTitle] = useState(""), [busy,setBusy] = useState(true), [error,setError] = useState(""), [message,setMessage] = useState("");
  const generation = useRef(0), lock = useRef(false);
  useEffect(() => {
    const stop = onAuthStateChanged(auth, account => {
      const version = ++generation.current;
      setUser(account); setLesson(null); setTitle(""); setError(""); setMessage(""); lock.current=false; setBusy(!!account);
      if (!account) return;
      void settings(account).then(saved => { if (version === generation.current) { setLesson(saved); setTitle(saved.title); } }).catch(error => { if (version === generation.current) setError(error instanceof Error ? error.message : "تعذر تحميل العنوان."); }).finally(() => { if (version === generation.current) setBusy(false); });
    });
    return () => { ++generation.current; stop(); };
  }, []);
  async function load() {
    if (!user || busy || lock.current) return;
    const version = generation.current; lock.current=true; setBusy(true); setError(""); setMessage("");
    try { const saved = await settings(user); if (version === generation.current) { setLesson(saved); setTitle(saved.title); } }
    catch(error) { if (version === generation.current) setError(error instanceof Error ? error.message : "تعذر تحميل العنوان."); }
    finally { if (version === generation.current) { lock.current=false; setBusy(false); } }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !lesson || busy || lock.current) return;
    let next: string;
    try { next = littleTeacherLessonTitle(title); } catch { setError("اكتب عنوان الدرس في حدود ٨٠ حرفًا."); return; }
    const version = generation.current; lock.current=true; setBusy(true); setError(""); setMessage("");
    try {
      const saved = await settings(user, { title: next, revision: lesson.revision });
      if (version === generation.current) { setLesson(saved); setTitle(saved.title); setMessage("تم حفظ عنوان الدرس. يظهر للطلاب عند فتح صفحتهم أو تحديثها."); }
    } catch(error) { if (version === generation.current) setError(error instanceof Error ? error.message : "تعذر حفظ العنوان."); }
    finally { if (version === generation.current) { lock.current=false; setBusy(false); } }
  }
  return <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5" aria-labelledby="little-teacher-settings-heading">
    <h2 id="little-teacher-settings-heading" className="text-lg font-black text-emerald-800">🧑‍🏫 عنوان درس المعلم الصغير</h2>
    <p className="mt-2 text-sm leading-7 text-slate-600">غيّر عنوان الدرس الذي يترشّح الطلاب لتدريسه. عند حفظ عنوان مختلف، يُفتح تسجيل الرغبة للدرس الجديد وتبقى الطلبات والاقتراحات السابقة محفوظة.</p>
    <form onSubmit={event => void save(event)} className="mt-4">
      <label htmlFor="little-teacher-lesson-title" className="mb-2 block font-bold text-emerald-900">عنوان الدرس</label>
      <div className="flex flex-wrap gap-3"><input id="little-teacher-lesson-title" value={title} maxLength={80} required disabled={!user || busy || !lesson} onChange={event => setTitle(event.target.value)} placeholder="مثال: علم بلادي" className="min-h-11 min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-4 py-3" /><button type="submit" disabled={busy || !user || !lesson || !title.trim() || title.trim() === lesson.title} className="min-h-11 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "جارٍ الإتمام…" : "حفظ عنوان الدرس"}</button><button type="button" disabled={!user || busy} onClick={() => void load()} className="min-h-11 rounded-xl border border-emerald-200 bg-white px-4 py-3 font-bold text-emerald-800">إعادة تحميل الإعداد</button></div>
    </form>
    {!user && !busy && <p className="mt-3 text-sm text-slate-600">سجّل دخولك بحساب المعلم لتغيير العنوان.</p>}
    {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
    {message && <p role="status" className="mt-3 rounded-xl bg-white p-3 text-emerald-800">{message}</p>}
  </section>;
}
