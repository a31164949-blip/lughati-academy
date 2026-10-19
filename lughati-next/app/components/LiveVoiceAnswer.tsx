"use client";

import { useEffect, useRef, useState } from "react";
import { createSpeechRecorder } from "../lib/speechRecording";
import { uploadCloudinary } from "../lib/uploadCloudinary";

export default function LiveVoiceAnswer({ onSubmit, disabled }: {
  onSubmit: (audioUrl: string) => Promise<void>;
  disabled: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [opening, setOpening] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const alive = useRef(true);
  const uploaded = useRef("");
  const audioObjectUrl = useRef("");

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (timer.current) clearInterval(timer.current);
      if (recorder.current) {
        recorder.current.onstop = null;
        if (recorder.current.state !== "inactive") recorder.current.stop();
      }
      stream.current?.getTracks().forEach(track => track.stop());
      if (audioObjectUrl.current) URL.revokeObjectURL(audioObjectUrl.current);
    };
  }, []);

  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
  }

  async function start() {
    if (opening || recording || sending || disabled) return;
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("التسجيل غير مدعوم في هذا المتصفح. افتح الأكاديمية في Safari أو Chrome المحدث.");
      return;
    }
    setOpening(true);
    try {
      const source = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) { source.getTracks().forEach(track => track.stop()); return; }
      stream.current = source;
      const supported = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find(type => MediaRecorder.isTypeSupported(type));
      const capture = createSpeechRecorder(source, supported);
      recorder.current = capture;
      const chunks: Blob[] = [];
      capture.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      capture.onerror = () => { stop(); if (alive.current) { setRecording(false); setError("تعذر التسجيل؛ حاول مرة أخرى."); } };
      capture.onstop = () => {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        source.getTracks().forEach(track => track.stop());
        if (!alive.current) return;
        const audio = new Blob(chunks, { type: capture.mimeType || "audio/webm" });
        setRecording(false);
        if (!audio.size || audio.size > 1024 * 1024) { setError("التسجيل غير صالح؛ أعد المحاولة لمدة لا تتجاوز ٣٠ ثانية."); return; }
        if (audioObjectUrl.current) URL.revokeObjectURL(audioObjectUrl.current);
        audioObjectUrl.current = URL.createObjectURL(audio);
        setBlob(audio);
        setPreview(audioObjectUrl.current);
      };
      uploaded.current = "";
      setBlob(null); setPreview(""); setSeconds(0);
      capture.start();
      setRecording(true);
      const started = Date.now();
      timer.current = setInterval(() => {
        const elapsed = Math.min(30, Math.floor((Date.now() - started) / 1000));
        setSeconds(elapsed);
        if (elapsed >= 30) stop();
      }, 250);
    } catch {
      stream.current?.getTracks().forEach(track => track.stop());
      if (alive.current) setError("تعذر تشغيل الميكروفون. اسمح للموقع باستخدامه ثم حاول مجددًا.");
    } finally { if (alive.current) setOpening(false); }
  }

  async function send() {
    if (!blob || sending || disabled) return;
    setSending(true); setError("");
    try {
      if (!uploaded.current) {
        const form = new FormData();
        form.append("file", blob, `live-answer-${Date.now()}.${blob.type.includes("mp4") ? "m4a" : "webm"}`);
        form.append("upload_preset", "lughati_reading_upload");
        const response = await uploadCloudinary("https://api.cloudinary.com/v1_1/ffv5igmg/video/upload", { method: "POST", body: form });
        if (!response.ok) throw new Error("تعذر رفع التسجيل. احتفظنا به هنا؛ حاول الإرسال مرة أخرى.");
        const data = await response.json();
        if (typeof data.secure_url !== "string") throw new Error("تعذر رفع التسجيل.");
        uploaded.current = data.secure_url;
      }
      if (!alive.current) return;
      await onSubmit(uploaded.current);
    } catch (failure) { if (alive.current) setError(failure instanceof Error ? failure.message : "تعذر إرسال التسجيل."); }
    finally { if (alive.current) setSending(false); }
  }

  return <div style={{ display: "grid", gap: 12, justifyItems: "center", marginTop: 18 }}>
    <p>🎙️ أجب بصوتك خلال ٣٠ ثانية. استمع إلى تسجيلك ثم أرسله للمعلم.</p>
    {recording ? <><p role="status">🔴 جارٍ التسجيل: {seconds} / ٣٠ ثانية</p><button type="button" onClick={stop} style={button}>⏹ إيقاف التسجيل</button></>
      : <button type="button" disabled={disabled || sending || opening} onClick={() => void start()} style={button}>{opening ? "جارٍ فتح الميكروفون…" : blob ? "🔄 إعادة التسجيل" : "🎙️ سجّل إجابتك"}</button>}
    {preview && !recording && <><audio controls src={preview} aria-label="استمع إلى إجابتك قبل إرسالها" style={{ maxWidth: "100%" }} /><button type="button" disabled={disabled || sending} onClick={() => void send()} style={button}>{sending ? "جارٍ إرسال التسجيل…" : "📤 إرسال إجابتي الصوتية"}</button></>}
    {error && <p role="alert" style={{ color: "#a12626" }}>{error}</p>}
  </div>;
}
const button: React.CSSProperties = { padding: "13px 20px", border: 0, borderRadius: 14, background: "#16865d", color: "white", fontSize: 18, fontWeight: 800, cursor: "pointer" };
