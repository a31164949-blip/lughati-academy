"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CLOUD_NAME = "ffv5igmg";
const UPLOAD_PRESET = "lughati_homework_upload";
const MAX_DURATION_SECONDS = 60;
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const EVENT_START = Date.parse("2026-09-20T00:00:00+03:00");
const EVENT_END = Date.parse("2026-09-26T23:59:59+03:00");

type EventState = "loading" | "upcoming" | "open" | "closed";

type UploadResult = {
  secure_url?: string;
  public_id?: string;
  duration?: number;
};

type StudentData = {
  studentId: string;
  studentName: string;
  classroom: string;
};

function getStudentData(): StudentData {
  try {
    const saved = window.localStorage.getItem("lughatiStudent");
    const localId = window.localStorage.getItem("student-id") || "";
    const localName = window.localStorage.getItem("student-name") || "";
    const localClassroom =
      window.localStorage.getItem("student-class") ||
      window.localStorage.getItem("student-classroom") ||
      window.localStorage.getItem("classroom") ||
      "";
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      studentId: localId || parsed.studentId || parsed.id || "",
      studentName: localName || parsed.studentName || parsed.name || "",
      classroom: localClassroom || parsed.classroom || parsed.className || "",
    };
  } catch {
    return { studentId: "", studentName: "", classroom: "" };
  }
}

export default function VoiceOfNationPage() {
  const [student, setStudent] = useState<StudentData>({ studentId: "", studentName: "", classroom: "" });
  const [participantName, setParticipantName] = useState("");
  const [classroom, setClassroom] = useState("");
  const [grade, setGrade] = useState("الصف الثاني");
  const [school, setSchool] = useState("");
  const [title, setTitle] = useState("كلمة في حب الوطن");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [eventState, setEventState] = useState<EventState>("loading");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const savedStudent = getStudentData();
    setStudent(savedStudent);
    setParticipantName(savedStudent.studentName);
    setClassroom(savedStudent.classroom);

    const updateEventState = () => {
      const now = Date.now();
      setEventState(now < EVENT_START ? "upcoming" : now > EVENT_END ? "closed" : "open");
    };

    updateEventState();
    const timer = window.setInterval(updateEventState, 60000);
    return () => window.clearInterval(timer);
  }, []);

  function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    if (eventState !== "open") {
      event.target.value = "";
      setError(eventState === "upcoming" ? "تفتح المشاركة يوم 20 سبتمبر 2026." : "انتهى وقت استقبال المشاركات.");
      return;
    }

    const selected = event.target.files?.[0] || null;
    setError("");
    setMessage("");

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setDuration(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (!selected.type.startsWith("video/")) {
      event.target.value = "";
      setFile(null);
      setError("اختر مقطع فيديو فقط.");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      event.target.value = "";
      setFile(null);
      setError("حجم الفيديو كبير. اختر مقطعًا لا يتجاوز 100 ميجابايت.");
      return;
    }

    const url = URL.createObjectURL(selected);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const seconds = video.duration;
      if (!Number.isFinite(seconds) || seconds > MAX_DURATION_SECONDS) {
        URL.revokeObjectURL(url);
        event.target.value = "";
        setFile(null);
        setPreviewUrl("");
        setError("يجب ألا تتجاوز مدة المقطع دقيقة واحدة.");
        return;
      }
      setDuration(seconds);
      setFile(selected);
      setPreviewUrl(url);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      setError("تعذر قراءة المقطع. جرّب فيديو آخر.");
    };
    video.src = url;
  }

  async function submit() {
    if (eventState !== "open") {
      setError(eventState === "upcoming" ? "تفتح المشاركة يوم 20 سبتمبر 2026." : "انتهى وقت استقبال المشاركات.");
      return;
    }

    if (!participantName.trim() || !classroom.trim() || !school.trim() || !title.trim() || !file || duration === null) {
      setError("أكمل البيانات واختر فيديو لا يتجاوز دقيقة واحدة.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setMessage("جارٍ رفع المقطع… لا تغلق الصفحة.");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
        { method: "POST", body: formData }
      );
      const uploaded = (await uploadResponse.json()) as UploadResult;

      if (!uploadResponse.ok || !uploaded.secure_url) {
        throw new Error("تعذر رفع الفيديو. حاول مرة أخرى.");
      }

      const response = await fetch("/api/national-day/voice-of-nation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.studentId,
          studentName: participantName.trim(),
          classroom: classroom.trim(),
          grade,
          school: school.trim(),
          title: title.trim(),
          fileUrl: uploaded.secure_url,
          cloudinaryPublicId: uploaded.public_id || "",
          duration: uploaded.duration ?? duration,
        }),
      });
      const result = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !result.success) throw new Error(result.message || "تعذر إرسال المشاركة.");

      setMessage(result.message || "وصلت مشاركتك بنجاح وهي بانتظار مراجعة المعلم ✅");
      setFile(null);
      setPreviewUrl("");
      setSubmitted(true);
    } catch (submitError) {
      setMessage("");
      setError(submitError instanceof Error ? submitError.message : "تعذر إرسال المشاركة.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main dir="rtl" style={{ minHeight: "100vh", padding: 20, color: "#153f33", background: "linear-gradient(180deg,#effcf6,#fff)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Link href="/national-day" style={{ color: "#087b52", fontWeight: 900, textDecoration: "none" }}>→ العودة إلى أسبوع الوطن</Link>

        <section style={{ marginTop: 16, padding: "clamp(24px,5vw,44px)", borderRadius: 32, color: "white", textAlign: "center", background: "linear-gradient(135deg,#064e3b,#0a8c5c)", boxShadow: "0 18px 45px rgba(6,78,59,.2)" }}>
          <div style={{ fontSize: 52 }}>🎙️</div>
          <h1 style={{ margin: "5px 0", fontSize: "clamp(30px,6vw,50px)" }}>مسابقة صوت الوطن</h1>
          <p style={{ margin: "0 auto", maxWidth: 650, color: "#dcfce7", lineHeight: 1.9 }}>قدّم كلمة وطنية أو إلقاءً جميلًا بصوتك في مقطع لا يتجاوز دقيقة واحدة.</p>
        </section>

        <section style={{ marginTop: 20, padding: "clamp(20px,4vw,34px)", borderRadius: 28, background: "white", border: "1px solid #ccebdd", boxShadow: "0 12px 35px rgba(15,118,72,.08)" }}>
          <div style={{ padding: 15, marginBottom: 20, borderRadius: 16, color: "#7a5900", background: "#fff8d8", border: "1px solid #efd572", lineHeight: 1.8 }}>
            مشاركة واحدة لكل طالب • فيديو فقط • المدة القصوى دقيقة • تخضع المشاركة لمراجعة المعلم.
          </div>

          {eventState !== "open" ? (
            <div style={{ padding: 15, marginBottom: 20, borderRadius: 16, color: eventState === "closed" ? "#991b1b" : "#075f46", background: eventState === "closed" ? "#fff1f2" : "#ecfdf5", border: `1px solid ${eventState === "closed" ? "#fecdd3" : "#a7f3d0"}`, textAlign: "center", fontWeight: 950 }}>
              {eventState === "loading" ? "جارٍ التحقق من موعد المسابقة…" : eventState === "upcoming" ? "تفتح المشاركة يوم 20 سبتمبر 2026 ⏳" : "انتهى وقت استقبال المشاركات"}
            </div>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 15 }}>
            <Field label="اسم الطالب" value={participantName} onChange={setParticipantName} placeholder="اكتب اسم الطالب الثلاثي" disabled={Boolean(student.studentName)} />
            <label style={labelStyle}>الصف<select value={grade} onChange={(e) => setGrade(e.target.value)} style={inputStyle}>{["الصف الثاني","الصف الثالث","الصف الرابع","الصف الخامس","الصف السادس"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <Field
              label="الفصل"
              value={classroom}
              onChange={setClassroom}
              placeholder="مثال: الثاني أ"
              disabled={Boolean(student.classroom)}
            />
            <Field label="المدرسة" value={school} onChange={setSchool} placeholder="اكتب اسم المدرسة" />
          </div>

          <div style={{ marginTop: 15 }}><Field label="عنوان المشاركة" value={title} onChange={setTitle} placeholder="مثال: كلمة في حب الوطن" /></div>

          <label style={{ ...labelStyle, marginTop: 18 }}>
            مقطع الإلقاء
            <input type="file" accept="video/*" onChange={chooseFile} disabled={uploading || eventState !== "open"} style={{ ...inputStyle, padding: 12, cursor: eventState === "open" ? "pointer" : "not-allowed" }} />
          </label>

          {previewUrl ? <video src={previewUrl} controls style={{ width: "100%", maxHeight: 430, marginTop: 15, borderRadius: 18, background: "#000" }} /> : null}
          {duration !== null ? <div style={{ marginTop: 8, color: "#087b52", fontWeight: 800 }}>مدة المقطع: {Math.ceil(duration)} ثانية ✅</div> : null}
          {error ? <div style={{ marginTop: 15, padding: 13, borderRadius: 14, color: "#b91c1c", background: "#fff1f2" }}>{error}</div> : null}
          {message ? <div style={{ marginTop: 15, padding: 13, borderRadius: 14, color: "#087b52", background: "#ecfdf5" }}>{message}</div> : null}

          <button type="button" onClick={() => void submit()} disabled={uploading || submitted || eventState !== "open"} style={{ width: "100%", marginTop: 18, padding: 15, border: 0, borderRadius: 16, color: "white", background: uploading || submitted || eventState !== "open" ? "#94a3b8" : "#087b52", fontSize: 18, fontWeight: 950, cursor: uploading ? "wait" : submitted || eventState !== "open" ? "not-allowed" : "pointer" }}>
            {uploading ? "جارٍ إرسال المشاركة…" : submitted ? "تم إرسال مشاركتك بنجاح ✅" : eventState === "upcoming" ? "يفتح الإرسال يوم 20 سبتمبر" : eventState === "closed" ? "انتهى استقبال المشاركات" : "إرسال مشاركتي للمعلم"}
          </button>
        </section>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = { display: "grid", gap: 7, color: "#234c40", fontWeight: 900 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 14, border: "1px solid #cddfd8", background: "#fff", color: "#183f34", fontSize: 16 };

function Field({ label, value, onChange, placeholder, disabled = false }: { label: string; value: string; onChange?: (value: string) => void; placeholder?: string; disabled?: boolean }) {
  return <label style={labelStyle}>{label}<input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} disabled={disabled} style={{ ...inputStyle, background: disabled ? "#f3f7f5" : "#fff" }} /></label>;
}
