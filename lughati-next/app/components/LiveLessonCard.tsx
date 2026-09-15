"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "../../firebase";

type LiveLesson = {
  id: string;
  title: string;
  description: string;
  targetClassroom: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  lessonVersion: string;
};

type LessonResponse = {
  success?: boolean;
  lesson?: LiveLesson | null;
  meetingUrl?: string;
  message?: string;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Riyadh",
  }).format(new Date(value));
}

function formatRemaining(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} ساعة${minutes ? ` و${minutes} دقيقة` : ""}`;
  }
  return `${totalMinutes} دقيقة`;
}

export default function LiveLessonCard() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [lesson, setLesson] = useState<LiveLesson | null>(null);
  const [now, setNow] = useState(Date.now());
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      setLesson(null);
      return;
    }

    let active = true;
    let loading = false;

    async function loadLesson() {
      if (loading) return;
      loading = true;
      try {
        const token = await user!.getIdToken();
        const response = await fetch("/api/live-lessons", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = (await response.json()) as LessonResponse;
        if (active && response.ok && data.success === true) {
          setLesson(data.lesson ?? null);
        }
      } catch (error) {
        console.warn("تعذر تحميل الدرس المباشر:", error);
      } finally {
        loading = false;
      }
    }

    void loadLesson();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadLesson();
    }, 60000);
    const onFocus = () => void loadLesson();
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [user]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const state = useMemo(() => {
    if (!lesson) return "hidden";
    const start = new Date(lesson.startAt).getTime();
    const end = new Date(lesson.endAt).getTime();
    if (now > end) return "hidden";
    if (now >= start) return "live";
    if (now >= start - 10 * 60 * 1000) return "ready";
    return "upcoming";
  }, [lesson, now]);

  if (!lesson || state === "hidden") return null;

  const startTime = new Date(lesson.startAt).getTime();
  const canJoin = state === "live" || state === "ready";

  async function joinLesson() {
    if (!user || !canJoin || joining) return;
    setJoining(true);
    setMessage("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/live-lessons/attendance", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json()) as LessonResponse;
      if (!response.ok || data.success !== true || !data.meetingUrl) {
        throw new Error(data.message || "تعذر فتح الدرس.");
      }
      setMessage(data.message || "تم تسجيل حضورك 🌟");
      window.open(data.meetingUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر فتح الدرس.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <section dir="rtl" aria-label="الدرس المباشر" style={containerStyle}>
      <div style={pulseStyle} aria-hidden="true" />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={eyebrowStyle}>
          {state === "live" ? "🔴 مباشر الآن" : state === "ready" ? "🟢 يمكنك الانضمام الآن" : "🕐 درس مباشر قادم"}
        </div>
        <h2 style={titleStyle}>{lesson.title}</h2>
        {lesson.description && <p style={descriptionStyle}>{lesson.description}</p>}
        <div style={infoStyle}>
          <span>📅 {formatTime(lesson.startAt)}</span>
          <span>⏱️ {lesson.durationMinutes} دقيقة</span>
          <span>🏫 {lesson.targetClassroom === "الجميع" ? "جميع الطلاب" : lesson.targetClassroom}</span>
        </div>
        {state === "upcoming" && (
          <div style={countdownStyle}>متبقٍ على البداية: {formatRemaining(startTime - now)}</div>
        )}
        <button
          type="button"
          onClick={() => void joinLesson()}
          disabled={!canJoin || joining}
          style={{ ...buttonStyle, opacity: canJoin ? 1 : 0.62, cursor: canJoin ? "pointer" : "not-allowed" }}
        >
          {joining ? "جارٍ تسجيل الحضور..." : canJoin ? "🎥 تسجيل الحضور والانضمام" : "يفتح الانضمام قبل الموعد بعشر دقائق"}
        </button>
        {message && <div style={messageStyle}>{message}</div>}
      </div>
    </section>
  );
}

const containerStyle = { maxWidth: 1180, margin: "18px auto", padding: "24px", position: "relative" as const, overflow: "hidden", borderRadius: 28, color: "white", background: "linear-gradient(135deg,#075f42 0%,#0d8b60 65%,#13a873 100%)", boxShadow: "0 14px 34px rgba(7,95,66,.22)" } as const;
const pulseStyle = { position: "absolute" as const, width: 190, height: 190, left: -45, top: -65, borderRadius: "50%", background: "rgba(255,255,255,.08)", boxShadow: "0 0 0 25px rgba(255,255,255,.035)" } as const;
const eyebrowStyle = { color: "#ffe58a", fontWeight: 900, marginBottom: 8 } as const;
const titleStyle = { margin: "0 0 8px", fontSize: "clamp(25px,4vw,38px)" } as const;
const descriptionStyle = { margin: "0 0 12px", lineHeight: 1.8, opacity: 0.95, fontWeight: 700 } as const;
const infoStyle = { display: "flex", gap: 10, flexWrap: "wrap" as const, fontWeight: 800, fontSize: 14 } as const;
const countdownStyle = { display: "inline-block", marginTop: 14, padding: "8px 12px", borderRadius: 999, background: "rgba(255,255,255,.14)", color: "#fff3b0", fontWeight: 900 } as const;
const buttonStyle = { width: "100%", marginTop: 16, border: 0, borderRadius: 16, padding: "14px 17px", background: "#ffffff", color: "#086344", fontSize: 17, fontWeight: 900 } as const;
const messageStyle = { marginTop: 11, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,.13)", fontWeight: 800 } as const;
