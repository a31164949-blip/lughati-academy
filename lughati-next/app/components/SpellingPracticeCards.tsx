"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { littleTeacherApplicantName, type LittleTeacherLesson } from "../lib/littleTeacherSpelling";
import styles from "./SpellingPracticeCards.module.css";

export default function SpellingPracticeCards({ words, day, user, lesson, loading = false }: { words: string[]; day: string; user: User | null; lesson: LittleTeacherLesson | null; loading?: boolean }) {
  return <div className={styles.row} data-has-words={words.length > 0 ? "true" : "false"} dir="rtl">
    {words.length > 0 && <section className={styles.words} aria-labelledby="spelling-words-heading">
      <div className={styles.header}><div><h2 id="spelling-words-heading">✍️ كلمات إملاء الغد</h2><p className={styles.day}>{day ? `استعد لإملاء يوم ${day}` : "استعد للإملاء"}</p></div><Link className={styles.plan} href="/weekly-plan">عرض الخطة ←</Link></div>
      <ul className={styles.list}>{words.map((name,index) => <li key={`${name}-${index}`}>{name}</li>)}</ul>
      <p className={styles.hint}>اقرأ الكلمات ثم غطِّها وحاول كتابتها بنفسك 🌟</p>
    </section>}
    {lesson ? <FriendRiddleForm key={(user?.uid ?? "guest") + ":" + lesson.lessonId} user={user} lesson={lesson} /> : <section className={styles.suggestion}><h2>🧩 هل ترغب بأن تطرح لغزًا لأصدقائك؟</h2><p role="status">{loading ? "جارٍ تحميل عنوان الدرس…" : "تعذر تحميل عنوان الدرس. حدّث الصفحة للمشاركة."}</p></section>}
  </div>;
}

function FriendRiddleForm({ user, lesson }: { user: User | null; lesson: LittleTeacherLesson }) {
  const [name,setName] = useState(""), [submitted,setSubmitted] = useState(""), [message,setMessage] = useState(""), [error,setError] = useState(""), [busy,setBusy] = useState(false);
  const lock = useRef(false), generation = useRef(0);
  useEffect(() => () => { ++generation.current; }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || lock.current || submitted) return;
    let proposal: string;
    try { proposal = littleTeacherApplicantName(name); } catch { setError("اكتب اسمك في حدود ٨٠ حرفًا."); return; }
    const version = generation.current;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/friend-riddle-application", { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${await user.getIdToken()}` }, body:JSON.stringify({ name:proposal, lessonId:lesson.lessonId }) });
      const data = await response.json();
      if (!response.ok || !data.success || typeof data.name !== "string") throw Error(data.message || "تعذر إرسال رغبتك.");
      if (version !== generation.current) return;
      setName(data.name); setSubmitted(data.name);
      setMessage(data.alreadySubmitted ? `سبق تسجيل رغبتك باسم «${data.name}». انتظر تنسيق المشاركة مع معلمك 🌟` : `تم تسجيل رغبتك يا ${data.name}! استعد لطرح لغزك على أصدقائك بعد تنسيقه مع معلمك 🌟`);
    } catch (error) { if (version === generation.current) setError(error instanceof Error ? error.message : "تعذر إرسال رغبتك. حاول مجددًا."); }
    finally { if (version === generation.current) { lock.current=false; setBusy(false); } }
  }
  return <section className={styles.suggestion} aria-labelledby="friend-riddle-heading">
    <h2 id="friend-riddle-heading">🧩 هل ترغب بأن تطرح لغزًا لأصدقائك؟</h2>
    <p className={styles.prompt}>شارك أصدقاءك لغزًا ممتعًا من درس «{lesson.title}»:</p>
    <ul className={styles.tasks}><li>جهّز لغزًا واضحًا ومناسبًا للدرس.</li><li>راجع اللغز وإجابته مع معلمك.</li><li>اطرحه على أصدقائك، واستمتعوا بالتفكير معًا.</li></ul>
    <p className={styles.prompt}>إذا رغبت في المشاركة، سجّل اسمك وانتظر تنسيق معلمك لعرض لغزك!</p>
    <form className={styles.form} onSubmit={event => void submit(event)}>
      <label htmlFor="friend-riddle-name">اسم الطالب</label>
      <div className={styles.inputRow}><input id="friend-riddle-name" value={name} onChange={event => { setName(event.target.value); setError(""); }} maxLength={80} autoComplete="name" placeholder="اكتب اسمك" disabled={busy || !!submitted || !user} aria-describedby="friend-riddle-hint" /><button type="submit" disabled={busy || !!submitted || !user || !name.trim()}>{busy ? "جارٍ الإرسال…" : submitted ? "تم تسجيل رغبتي ✓" : "أرغب في طرح لغز"}</button></div>
      <p id="friend-riddle-hint" className={styles.hint}>التسجيل يعبّر عن رغبتك بالمشاركة، وسينسّق معك المعلم اللغز وموعد طرحه.</p>
      {!user && <p className={styles.hint}>سجّل دخولك بحساب الطالب للمشاركة.</p>}
      {message && <p role="status" className={styles.feedback}>{message}</p>}
      {error && <p role="alert" className={`${styles.feedback} ${styles.error}`}>{error}</p>}
    </form>
  </section>;
}
