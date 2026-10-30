"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { littleTeacherWord, type LittleTeacherLesson } from "../lib/littleTeacherSpelling";
import styles from "./SpellingPracticeCards.module.css";

export default function SpellingPracticeCards({ words, day, user, lesson, loading = false }: { words: string[]; day: string; user: User | null; lesson: LittleTeacherLesson | null; loading?: boolean }) {
  return <div className={styles.row} data-has-words={words.length > 0 ? "true" : "false"} dir="rtl">
    {words.length > 0 && <section className={styles.words} aria-labelledby="spelling-words-heading">
      <div className={styles.header}><div><h2 id="spelling-words-heading">✍️ كلمات إملاء الغد</h2><p className={styles.day}>{day ? `استعد لإملاء يوم ${day}` : "استعد للإملاء"}</p></div><Link className={styles.plan} href="/weekly-plan">عرض الخطة ←</Link></div>
      <ul className={styles.list}>{words.map((word,index) => <li key={`${word}-${index}`}>{word}</li>)}</ul>
      <p className={styles.hint}>اقرأ الكلمات ثم غطِّها وحاول كتابتها بنفسك 🌟</p>
    </section>}
    {lesson ? <LittleTeacherForm key={(user?.uid ?? "guest") + ":" + lesson.lessonId} user={user} lesson={lesson} /> : <section className={styles.suggestion}><h2>🧑‍🏫 اقترح أنت — المعلم الصغير</h2><p role="status">{loading ? "جارٍ تحميل عنوان الدرس…" : "تعذر تحميل عنوان الدرس. حدّث الصفحة للمشاركة."}</p></section>}
  </div>;
}

function LittleTeacherForm({ user, lesson }: { user: User | null; lesson: LittleTeacherLesson }) {
  const [word,setWord] = useState(""), [submitted,setSubmitted] = useState(""), [message,setMessage] = useState(""), [error,setError] = useState(""), [busy,setBusy] = useState(false);
  const lock = useRef(false), generation = useRef(0);
  useEffect(() => () => { ++generation.current; }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || lock.current || submitted) return;
    let proposal: string;
    try { proposal = littleTeacherWord(word); } catch { setError(`اكتب كلمة عربية واحدة فقط من درس «${lesson.title}».`); return; }
    const version = generation.current;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/little-teacher-spelling", { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${await user.getIdToken()}` }, body:JSON.stringify({ word:proposal, lessonId:lesson.lessonId }) });
      const data = await response.json();
      if (!response.ok || !data.success || typeof data.word !== "string") throw Error(data.message || "تعذر إرسال اقتراحك.");
      if (version !== generation.current) return;
      setWord(data.word); setSubmitted(data.word);
      setMessage(data.alreadySubmitted ? `وصل اقتراحك السابق «${data.word}» إلى معلمك بالفعل.` : `وصلت كلمتك «${data.word}» إلى معلمك للمراجعة. شكرًا يا معلمنا الصغير! 🌟`);
    } catch (error) { if (version === generation.current) setError(error instanceof Error ? error.message : "تعذر إرسال اقتراحك. حاول مجددًا."); }
    finally { if (version === generation.current) { lock.current=false; setBusy(false); } }
  }
  return <section className={styles.suggestion} aria-labelledby="little-teacher-heading">
    <h2 id="little-teacher-heading">🧑‍🏫 اقترح أنت — المعلم الصغير</h2>
    <p className={styles.prompt}>اقترح لنا كلمة إملاء من درس «{lesson.title}».</p>
    <form className={styles.form} onSubmit={event => void submit(event)}>
      <label htmlFor="little-teacher-word">الكلمة التي اخترتها</label>
      <div className={styles.inputRow}><input id="little-teacher-word" value={word} onChange={event => { setWord(event.target.value); setError(""); }} maxLength={40} autoComplete="off" placeholder="اكتب كلمة من الدرس" disabled={busy || !!submitted || !user} aria-describedby="little-teacher-hint" /><button type="submit" disabled={busy || !!submitted || !user || !word.trim()}>{busy ? "جارٍ الإرسال…" : submitted ? "تم إرسال كلمتي ✓" : "أرسل كلمتي للمعلم"}</button></div>
      <p id="little-teacher-hint" className={styles.hint}>كلمة واحدة لكل طالب في هذا الدرس. يراجعها المعلم قبل اختيار كلمات الإملاء.</p>
      {!user && <p className={styles.hint}>سجّل دخولك بحساب الطالب للمشاركة.</p>}
      {message && <p role="status" className={styles.feedback}>{message}</p>}
      {error && <p role="alert" className={`${styles.feedback} ${styles.error}`}>{error}</p>}
    </form>
  </section>;
}
