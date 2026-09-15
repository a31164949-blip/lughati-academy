"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { auth } from "../../../firebase";

type LiveLesson = {
  id: string;
  title: string;
  description: string;
  meetingUrl: string;
  targetClassroom: string;
  targetStudentDocId?: string;
  targetStudentName?: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  active: boolean;
};

type StudentOption = {
  id: string;
  studentName: string;
  classroom: string;
};

type AttendanceRow = {
  id: string;
  studentName: string;
  classroom: string;
  joinedAt: string | null;
};

type ApiResponse = {
  success?: boolean;
  lesson?: LiveLesson | null;
  attendance?: AttendanceRow[];
  students?: StudentOption[];
  message?: string;
};

function defaultStartValue() {
  const date = new Date(Date.now() + 15 * 60 * 1000);
  date.setSeconds(0, 0);
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Riyadh",
  }).format(new Date(value));
}

export default function TeacherLiveLessonsPage() {
  const [title, setTitle] = useState("درس لغتي المباشر");
  const [description, setDescription] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [targetClassroom, setTargetClassroom] = useState("الجميع");
  const [targetStudentDocId, setTargetStudentDocId] = useState("");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [startAt, setStartAt] = useState(defaultStartValue);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [lesson, setLesson] = useState<LiveLesson | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function getToken() {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("يجب تسجيل الدخول بحساب المعلم أولًا.");
    return currentUser.getIdToken();
  }

  async function loadLesson(silent = false) {
    if (!silent) setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch("/api/teacher-live-lessons", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "تعذر تحميل الدرس المباشر.");
      }
      setLesson(data.lesson ?? null);
      setAttendance(Array.isArray(data.attendance) ? data.attendance : []);
      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تحميل الدرس.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void loadLesson();
    const timer = window.setInterval(() => void loadLesson(true), 30000);
    return () => window.clearInterval(timer);
  }, []);

  async function createLesson() {
    if (!title.trim()) return setMessage("اكتب عنوان الدرس.");
    if (!meetingUrl.trim()) return setMessage("ألصق رابط البث أولًا.");
    if (!startAt) return setMessage("حدد موعد بداية الدرس.");
    if (targetClassroom === "طالب محدد" && !targetStudentDocId) {
      return setMessage("اختر الطالب المستهدف للتجربة.");
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 180) {
      return setMessage("مدة الدرس يجب أن تكون من 5 إلى 180 دقيقة.");
    }

    setSaving(true);
    setMessage("");
    try {
      const token = await getToken();
      const response = await fetch("/api/teacher-live-lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "create",
          title: title.trim(),
          description: description.trim(),
          meetingUrl: meetingUrl.trim(),
          targetClassroom,
          targetStudentDocId: targetClassroom === "طالب محدد" ? targetStudentDocId : "",
          startAt: new Date(startAt).toISOString(),
          durationMinutes,
        }),
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "تعذر نشر الدرس.");
      }
      setMessage("🔴 تم نشر الدرس المباشر للطلاب بنجاح.");
      await loadLesson(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر نشر الدرس.");
    } finally {
      setSaving(false);
    }
  }

  async function closeLesson() {
    setSaving(true);
    setMessage("");
    try {
      const token = await getToken();
      const response = await fetch("/api/teacher-live-lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "close" }),
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "تعذر إنهاء الدرس.");
      }
      setMessage("تم إنهاء الدرس المباشر.");
      await loadLesson(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر إنهاء الدرس.");
    } finally {
      setSaving(false);
    }
  }

  const lessonState = useMemo(() => {
    if (!lesson?.active) return "closed";
    const now = Date.now();
    if (now < new Date(lesson.startAt).getTime()) return "upcoming";
    if (now <= new Date(lesson.endAt).getTime()) return "live";
    return "ended";
  }, [lesson]);

  return (
    <main dir="rtl" style={pageStyle}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <header style={topBarStyle}>
          <Link href="/teacher" style={backStyle}>← العودة إلى لوحة المعلم</Link>
          <button type="button" onClick={() => void loadLesson()} style={secondaryButtonStyle}>
            🔄 تحديث الحضور
          </button>
        </header>

        <section style={heroStyle}>
          <span style={{ fontSize: 46 }}>🔴</span>
          <div>
            <div style={{ color: "#ffe58a", fontWeight: 900 }}>فصل يتعلم معًا</div>
            <h1 style={{ margin: "5px 0", fontSize: "clamp(28px,5vw,44px)" }}>الدروس المباشرة</h1>
            <p style={{ margin: 0, lineHeight: 1.8 }}>أنشئ موعد الدرس، أضف رابط البث، وتابع حضور الطلاب.</p>
          </div>
        </section>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={cardStyle}>
          <h2 style={headingStyle}>✨ إنشاء درس مباشر</h2>
          <label style={labelStyle}>عنوان الدرس</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />

          <label style={labelStyle}>وصف مختصر — اختياري</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="مثال: قراءة درس عذرًا يا جدي وتطبيق مهارات المد"
            style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
          />

          <label style={labelStyle}>رابط Microsoft Teams أو Google Meet</label>
          <input
            type="url"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://..."
            dir="ltr"
            style={inputStyle}
          />

          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>المستهدف</label>
              <select value={targetClassroom} onChange={(e) => setTargetClassroom(e.target.value)} style={inputStyle}>
                <option value="الجميع">جميع الطلاب</option>
                <option value="الثاني أ">الثاني أ</option>
                <option value="الثاني ب">الثاني ب</option>
                <option value="طالب محدد">طالب محدد للتجربة</option>
              </select>
            </div>
            {targetClassroom === "طالب محدد" && (
              <div>
                <label style={labelStyle}>اختر الطالب</label>
                <select value={targetStudentDocId} onChange={(e) => setTargetStudentDocId(e.target.value)} style={inputStyle}>
                  <option value="">— اختر الطالب —</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.studentName} — {student.classroom || "بدون فصل"}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label style={labelStyle}>موعد البداية</label>
              <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>المدة بالدقائق</label>
              <input type="number" min={5} max={180} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} style={inputStyle} />
            </div>
          </div>

          <button type="button" onClick={() => void createLesson()} disabled={saving} style={primaryButtonStyle}>
            {saving ? "جارٍ الحفظ..." : "🔴 نشر الدرس المباشر"}
          </button>
        </section>

        {loading ? (
          <div style={cardStyle}>جارٍ التحميل...</div>
        ) : lesson?.active ? (
          <>
            <section style={{ ...cardStyle, border: "2px solid #ef4444" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <strong style={{ color: lessonState === "live" ? "#b91c1c" : "#146c43" }}>
                    {lessonState === "live" ? "🔴 الدرس مباشر الآن" : lessonState === "upcoming" ? "🕐 درس قادم" : "انتهى موعد الدرس"}
                  </strong>
                  <h2 style={{ margin: "10px 0 5px" }}>{lesson.title}</h2>
                  <div>
                    المستهدف: <b>{lesson.targetStudentDocId ? `${lesson.targetStudentName || "طالب محدد"} — ${lesson.targetClassroom}` : lesson.targetClassroom}</b>
                  </div>
                  <div>البداية: <b>{formatDate(lesson.startAt)}</b></div>
                  <div>النهاية: <b>{formatDate(lesson.endAt)}</b></div>
                </div>
                <button type="button" onClick={() => void closeLesson()} disabled={saving} style={dangerButtonStyle}>
                  ⛔ إنهاء الدرس
                </button>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <h2 style={headingStyle}>✅ سجل الحضور</h2>
                <span style={badgeStyle}>الحاضرون: {attendance.length}</span>
              </div>
              {attendance.length === 0 ? (
                <p style={{ color: "#64748b", textAlign: "center", padding: 24 }}>لم يسجل أي طالب حضوره حتى الآن.</p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {attendance.map((row, index) => (
                    <article key={row.id} style={attendanceStyle}>
                      <b>{index + 1}. {row.studentName}</b>
                      <span>{row.classroom || "—"}</span>
                      <span>{formatDate(row.joinedAt)}</span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <section style={{ ...cardStyle, textAlign: "center", color: "#64748b" }}>لا يوجد درس مباشر منشور حاليًا.</section>
        )}
      </div>
    </main>
  );
}

const pageStyle = { minHeight: "100vh", padding: "24px 16px 60px", background: "linear-gradient(180deg,#f1faf5,#edf6f1)", fontFamily: "Tahoma,Arial,sans-serif" } as const;
const topBarStyle = { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const, marginBottom: 18 } as const;
const backStyle = { padding: "11px 16px", borderRadius: 14, background: "white", color: "#146c43", textDecoration: "none", fontWeight: 900, boxShadow: "0 4px 14px rgba(0,0,0,.06)" } as const;
const heroStyle = { display: "flex", alignItems: "center", gap: 18, padding: "28px 24px", borderRadius: 28, color: "white", background: "linear-gradient(135deg,#075f42,#13976a)", boxShadow: "0 14px 34px rgba(16,96,59,.18)", marginBottom: 20 } as const;
const cardStyle = { background: "white", padding: 22, borderRadius: 24, boxShadow: "0 10px 26px rgba(0,0,0,.07)", marginBottom: 20 } as const;
const headingStyle = { margin: "0 0 16px", color: "#145c3d" } as const;
const labelStyle = { display: "block", margin: "14px 0 7px", color: "#174c36", fontWeight: 900 } as const;
const inputStyle = { width: "100%", boxSizing: "border-box" as const, border: "1px solid #c9ddd2", borderRadius: 15, padding: "13px 14px", background: "#fbfefc", color: "#123d2e", fontSize: 16, fontWeight: 700 } as const;
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14 } as const;
const primaryButtonStyle = { width: "100%", border: 0, borderRadius: 17, padding: 16, marginTop: 20, background: "linear-gradient(135deg,#dc2626,#ef4444)", color: "white", fontSize: 18, fontWeight: 900, cursor: "pointer" } as const;
const secondaryButtonStyle = { border: 0, borderRadius: 14, padding: "11px 16px", background: "#e4f5ec", color: "#146c43", fontWeight: 900, cursor: "pointer" } as const;
const dangerButtonStyle = { border: 0, borderRadius: 14, padding: "12px 18px", alignSelf: "center", background: "#b42318", color: "white", fontWeight: 900, cursor: "pointer" } as const;
const messageStyle = { padding: "14px 16px", borderRadius: 16, marginBottom: 18, background: "#fff7d6", color: "#715700", fontWeight: 900 } as const;
const badgeStyle = { padding: "8px 12px", borderRadius: 999, background: "#e4f5ec", color: "#146c43", fontWeight: 900 } as const;
const attendanceStyle = { display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr", gap: 12, alignItems: "center", padding: "13px 15px", borderRadius: 14, background: "#f3faf6", border: "1px solid #d6ebe0" } as const;
