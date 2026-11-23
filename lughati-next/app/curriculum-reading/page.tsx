"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createSpeechRecorder } from "../lib/speechRecording";

type Lesson = { title: string; imageUrl: string };
export default function CurriculumReadingPage() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [opening, setOpening] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioUrl = useRef("");
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    void (async () => {
      try {
        const response = await fetch("/api/curriculum-reading", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok || !result.success) throw Error(result.message || "تعذر تحميل المنهج.");
        if (alive.current) setLesson(result.lesson || null);
      } catch {
        if (alive.current) setError("تعذر تحميل صفحة المنهج؛ أعد المحاولة.");
      } finally {
        if (alive.current) setLoading(false);
      }
    })();
    return () => {
      alive.current = false;
      if (timer.current) clearInterval(timer.current);
      if (recorder.current && recorder.current.state !== "inactive") {
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      stream.current?.getTracks().forEach(track => track.stop());
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    };
  }, []);

  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
  }

  async function start() {
    if (recording || opening) return;
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("متصفحك لا يدعم التسجيل. استخدم Safari أو Chrome المحدث.");
      return;
    }
    setOpening(true);
    try {
      const source = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) { source.getTracks().forEach(track => track.stop()); return; }
      stream.current = source;
      const mime = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find(type => MediaRecorder.isTypeSupported(type));
      const capture = createSpeechRecorder(source, mime);
      recorder.current = capture;
      const chunks: Blob[] = [];
      capture.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      capture.onerror = () => {
        stop();
        if (alive.current) { setRecording(false); setError("تعذر التسجيل، حاول مرة أخرى."); }
      };
      capture.onstop = () => {
        source.getTracks().forEach(track => track.stop());
        if (!alive.current) return;
        setRecording(false);
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        const blob = new Blob(chunks, { type: capture.mimeType || "audio/webm" });
        if (!blob.size || blob.size > 4 * 1024 * 1024) {
          setError("التسجيل غير صالح، أعد المحاولة لمدة لا تتجاوز دقيقة واحدة.");
          return;
        }
        if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
        audioUrl.current = URL.createObjectURL(blob);
        setPreview(audioUrl.current);
      };
      if (audioUrl.current) { URL.revokeObjectURL(audioUrl.current); audioUrl.current = ""; }
      setPreview("");
      setSeconds(0);
      capture.start();
      setRecording(true);
      const began = Date.now();
      timer.current = setInterval(() => {
        const elapsed = Math.min(60, Math.floor((Date.now() - began) / 1000));
        setSeconds(elapsed);
        if (elapsed >= 60) stop();
      }, 250);
    } catch {
      stream.current?.getTracks().forEach(track => track.stop());
      if (alive.current) setError("اسمح للموقع باستخدام الميكروفون ثم حاول مرة أخرى.");
    } finally { if (alive.current) setOpening(false); }
  }

  return <main dir="rtl" className="min-h-screen bg-sky-50 px-4 py-10 text-slate-800">
    <div className="mx-auto max-w-4xl">
      <Link href="/reading-tracks" className="font-bold text-sky-800">← العودة إلى عالم القراءة</Link>
      <header className="mb-6 mt-6 rounded-3xl bg-white p-7 shadow-sm">
        <p className="font-bold text-sky-800">أكاديمية لغتي الرقمية</p>
        <h1 className="mt-2 text-3xl font-extrabold">📖 قراءة المنهج مع أسرتي</h1>
        <p className="mt-3 leading-8 text-slate-600">افتح صورة صفحة المنهج التي نشرها معلمك، واقرأها بصوتك، ثم استمع إلى تسجيلك وأعد القراءة لتحسين الطلاقة.</p>
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">تدريب منزلي دون نقاط. التسجيل محلي على جهازك ولا يُرسل للمعلم أو إلى السحابة، ويزول عند مغادرة الصفحة.</p>
      </header>
      {loading ? <p role="status" className="rounded-2xl bg-white p-5">جارٍ تحميل صفحة المنهج…</p>
        : lesson ? <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-sky-900">{lesson.title}</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lesson.imageUrl} alt={`صورة صفحة المنهج: ${lesson.title}`} className="mx-auto h-auto max-h-[85vh] w-full rounded-xl object-contain" loading="lazy" />
            <div className="mt-6 rounded-2xl bg-emerald-50 p-5">
              <h3 className="mb-2 text-xl font-bold">🎙️ أتدرب على القراءة</h3>
              <p className="mb-4 text-sm leading-7">اضغط تسجيل، اقرأ الصفحة لمدة دقيقة أو أقل، ثم استمع لصوتك. يمكنك إعادة المحاولة متى شئت.</p>
              {recording ? <><p role="status" className="mb-3 font-bold text-red-700">🔴 تسجيل جارٍ: {seconds} / 60 ثانية</p><button onClick={stop} type="button" className="rounded-xl bg-red-700 px-6 py-3 font-bold text-white">⏹ إيقاف التسجيل</button></>
                : <button onClick={() => void start()} disabled={opening} type="button" className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white disabled:opacity-60">{opening ? "جارٍ فتح الميكروفون…" : preview ? "🔁 إعادة التسجيل" : "🎙️ ابدأ تسجيل قراءتي"}</button>}
              {preview && !recording && <audio controls src={preview} aria-label="استمع إلى تسجيل قراءتك" className="mt-4 block max-w-full" />}
            </div>
          </section>
        : <section className="rounded-3xl bg-white p-7 text-center shadow-sm"><h2 className="text-xl font-bold">لا توجد صورة منهج منشورة حاليًا.</h2><p className="mt-2">ستظهر هنا الصفحة عندما ينشرها المعلم.</p></section>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      <p className="mt-6 text-sm">للمعلم: <Link href="/teacher/curriculum-reading" className="font-bold text-sky-800 underline">إدارة صورة قراءة المنهج</Link></p>
    </div>
  </main>;
}
