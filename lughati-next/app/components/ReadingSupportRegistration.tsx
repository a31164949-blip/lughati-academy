"use client";

import { useEffect, useState } from "react";

type StudentDetails = {
  id: string;
  name: string;
  grade: string;
  classroom: string;
};

const grades = [
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
] as const;

const skills = [
  "نطق الحروف",
  "الحركات القصيرة",
  "حروف المد",
  "المقاطع الساكنة",
  "قراءة الكلمات والجمل",
] as const;

function getFirstTwoNames(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
}

export default function ReadingSupportRegistration() {
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [studentName, setStudentName] = useState("");
  const [grade, setGrade] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [skill, setSkill] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    try {
      const rawStudent = localStorage.getItem("lughatiStudent");
      const savedStudent = rawStudent ? JSON.parse(rawStudent) as {
        id?: unknown;
        studentName?: unknown;
        classroom?: unknown;
        loggedIn?: unknown;
      } : null;
      const id = localStorage.getItem("student-id") || "";
      const name = localStorage.getItem("student-name") || "";
      const classroom = localStorage.getItem("student-classroom") || "";
      const gradeFromClassroom = grades.find((item) =>
        classroom.includes(item)
      ) || "";

      if (
        savedStudent?.loggedIn === true &&
        id &&
        name &&
        classroom
      ) {
        setStudent({
          id,
          name,
          grade: gradeFromClassroom,
          classroom,
        });
        setStudentName(name);
        setGrade(gradeFromClassroom);
        setStudentClass(classroom);
      }
    } catch {
      setStudent(null);
    }
  }, []);

  function openForm() {
    setMessage("");
    setSuccess(false);
    setOpen(true);
  }

  async function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage("");
    const submittedName = student
      ? studentName.trim()
      : getFirstTwoNames(studentName);

    if (!submittedName) {
      setMessage("يرجى كتابة اسم الطالب.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/reading-support-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId:
            student?.id ||
            `guest-${encodeURIComponent(`${studentName}-${grade}-${studentClass}`)}`,
          studentName: submittedName,
          grade,
          studentClass,
          skill,
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || data.success !== true) {
        setMessage(data.message || "تعذر إرسال التسجيل حاليًا.");
        return;
      }

      setSuccess(true);
      setMessage("تم استلام طلبك يا بطل 🌟 سيحدد معلمك المقبولين وموعد الحصة.");
    } catch {
      setMessage("تعذر إرسال التسجيل حاليًا.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="reading-support-title"
      style={{
        maxWidth: "1180px",
        margin: "18px auto",
        padding: "22px",
        borderRadius: "24px",
        border: "1px solid #bfdbfe",
        background: "linear-gradient(135deg, #eff6ff 0%, #ecfeff 100%)",
        boxShadow: "0 12px 30px rgba(30, 64, 175, 0.1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <div aria-hidden="true" style={{ fontSize: "38px" }}>📚</div>
        <div style={{ flex: "1 1 520px" }}>
          <h2 id="reading-support-title" style={{ margin: 0, color: "#1e3a8a", fontSize: "22px", fontWeight: 900 }}>
            حصص التمكين القرائي لجميع أبطال المرحلة الابتدائية
          </h2>
          <p style={{ margin: "7px 0 0", color: "#334155", fontSize: "15px", fontWeight: 700, lineHeight: 1.8 }}>
            سجّل لتطوير قراءتك وإتقان المهارات الأساسية. المقاعد محدودة: 6 طلاب فقط في كل حصة، والأولوية لطلاب الصف الثاني.
          </p>
        </div>
        <button type="button" onClick={openForm} style={{ border: 0, borderRadius: "14px", padding: "12px 18px", background: "#2563eb", color: "white", fontSize: "15px", fontWeight: 900, cursor: "pointer", boxShadow: "0 8px 18px rgba(37, 99, 235, 0.2)" }}>
          سجّلني في الحصة
        </button>
      </div>

      {open && (
        <form onSubmit={submitRegistration} style={{ marginTop: "20px", paddingTop: "18px", borderTop: "1px solid #bfdbfe", display: "grid", gap: "12px" }}>
          <label style={{ display: "grid", gap: "6px", color: "#1e3a8a", fontWeight: 800 }}>
            اسم الطالب
            <input value={studentName} onChange={(event) => setStudentName(event.target.value)} readOnly={student !== null} required style={{ border: "1px solid #cbd5e1", borderRadius: "12px", padding: "11px", background: student ? "#e2e8f0" : "white" }} />
          </label>
          <label style={{ display: "grid", gap: "6px", color: "#1e3a8a", fontWeight: 800 }}>
            الصف
            <select value={grade} onChange={(event) => setGrade(event.target.value)} disabled={student !== null} required style={{ border: "1px solid #cbd5e1", borderRadius: "12px", padding: "11px", background: student ? "#e2e8f0" : "white" }}>
              <option value="">اختر الصف</option>
              {grades.map((item) => <option key={item} value={item}>الصف {item}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: "6px", color: "#1e3a8a", fontWeight: 800 }}>
            الفصل
            <input value={studentClass} onChange={(event) => setStudentClass(event.target.value)} readOnly={student !== null} required style={{ border: "1px solid #cbd5e1", borderRadius: "12px", padding: "11px", background: student ? "#e2e8f0" : "white" }} />
          </label>
          <label style={{ display: "grid", gap: "6px", color: "#1e3a8a", fontWeight: 800 }}>
            المهارة التي تحتاج إلى تحسينها
            <select value={skill} onChange={(event) => setSkill(event.target.value)} required style={{ border: "1px solid #cbd5e1", borderRadius: "12px", padding: "11px", background: "white" }}>
              <option value="">اختر المهارة</option>
              {skills.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button type="submit" disabled={submitting} style={{ border: 0, borderRadius: "14px", padding: "12px", background: submitting ? "#94a3b8" : "#0f766e", color: "white", fontWeight: 900, cursor: submitting ? "wait" : "pointer" }}>
            {submitting ? "جارٍ التسجيل..." : "تأكيد التسجيل"}
          </button>
          {message && <p role="status" style={{ margin: 0, color: success ? "#166534" : "#b91c1c", fontWeight: 800, lineHeight: 1.8 }}>{message}</p>}
        </form>
      )}
    </section>
  );
}
