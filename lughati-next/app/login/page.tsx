"use client";

import {
  type CSSProperties,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { signInWithCustomToken } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";

type Student = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  active: boolean;
};

type LoginResponse = {
  success?: boolean;
  token?: string;
  student?: Student;
  message?: string;
  error?: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [studentClass, setStudentClass] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentCode, setStudentCode] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true);
        setMessage("");

        const response = await fetch("/api/students", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || data?.error || "تعذر تحميل قائمة الطلاب."
          );
        }

        const receivedStudents = Array.isArray(data)
          ? data
          : Array.isArray(data?.students)
            ? data.students
            : [];

        const activeStudents = receivedStudents.filter(
          (student: Student) => student.active !== false
        );

        setStudents(activeStudents);
      } catch (error) {
        console.error("خطأ في تحميل الطلاب:", error);

        setMessage(
          error instanceof Error
            ? error.message
            : "تعذر تحميل قائمة الطلاب، حاول مرة أخرى."
        );
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, []);

  const classrooms = useMemo(() => {
    return Array.from(
      new Set(
        students
          .map((student) => student.classroom?.trim())
          .filter(Boolean)
      )
    ).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!studentClass) {
      return [];
    }

    return students
      .filter((student) => student.classroom === studentClass)
      .sort((firstStudent, secondStudent) =>
        firstStudent.studentName.localeCompare(
          secondStudent.studentName,
          "ar"
        )
      );
  }, [students, studentClass]);

  function handleClassChange(classroom: string) {
    setStudentClass(classroom);
    setStudentId("");
    setStudentCode("");
    setMessage("");
  }

  function handleStudentChange(selectedStudentId: string) {
    setStudentId(selectedStudentId);
    setStudentCode("");
    setMessage("");
  }

  function handleCodeChange(value: string) {
    const numbersOnly = value.replace(/\D/g, "").slice(0, 4);
    setStudentCode(numbersOnly);
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!studentClass) {
      setMessage("اختر الفصل أولًا.");
      return;
    }

    if (!studentId) {
      setMessage("اختر اسم الطالب.");
      return;
    }

    if (studentCode.length !== 4) {
      setMessage("أدخل رمز الدخول المكوّن من 4 أرقام.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response = await fetch("/api/student-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          studentCode,
          classroom: studentClass,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(
          data.message || data.error || "بيانات الدخول غير صحيحة."
        );
      }

      console.log("تم التحقق من بيانات الطالب بنجاح");

      const selectedStudent =
        data.student ||
        students.find((student) => student.studentId === studentId);

      if (selectedStudent) {
        localStorage.setItem(
          "lughatiStudent",
          JSON.stringify(selectedStudent)
        );
      }

      setMessage("تم تسجيل الدخول بنجاح، أهلًا بك في أكاديمية لغتي 🌟");

      router.push("/journey");
      router.refresh();
    } catch (error) {
      console.error("خطأ تسجيل الدخول:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تسجيل الدخول."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.decorativeCircleOne} />
      <div style={styles.decorativeCircleTwo} />

      <section style={styles.card}>
        <div style={styles.logoCircle}>ف</div>

        <p style={styles.smallTitle}>مرحبًا بك في</p>

        <h1 style={styles.title}>أكاديمية لغتي الرقمية</h1>

        <p style={styles.slogan}>نتعلّم… نقرأ… نبدع</p>

        <div style={styles.farisBox}>
          <div style={styles.farisEmoji}>👦🏻</div>

          <div>
            <strong style={styles.farisTitle}>أهلًا بك، أنا فارس!</strong>

            <p style={styles.farisText}>
              اختر فصلك واسمك، ثم أدخل رمز الدخول.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label} htmlFor="student-class">
            الفصل
          </label>

          <select
            id="student-class"
            value={studentClass}
            onChange={(event) => handleClassChange(event.target.value)}
            disabled={loading || submitting}
            style={styles.select}
          >
            <option value="">
              {loading ? "جاري تحميل الفصول..." : "اختر الفصل"}
            </option>

            {classrooms.map((classroom) => (
              <option key={classroom} value={classroom}>
                {classroom}
              </option>
            ))}
          </select>

          <label style={styles.label} htmlFor="student-name">
            اسم الطالب
          </label>

          <select
            id="student-name"
            value={studentId}
            onChange={(event) => handleStudentChange(event.target.value)}
            disabled={!studentClass || loading || submitting}
            style={styles.select}
          >
            <option value="">
              {!studentClass ? "اختر الفصل أولًا" : "اختر اسم الطالب"}
            </option>

            {filteredStudents.map((student) => (
              <option key={student.id} value={student.studentId}>
                {student.studentName}
              </option>
            ))}
          </select>

          <label style={styles.label} htmlFor="student-code">
            رمز الدخول
          </label>

          <input
            id="student-code"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={studentCode}
            onChange={(event) => handleCodeChange(event.target.value)}
            disabled={!studentId || submitting}
            placeholder="أدخل 4 أرقام"
            maxLength={4}
            style={styles.input}
          />

          <p style={styles.codeHint}>
            رمز الدخول خاص بالطالب ولا ينبغي مشاركته مع الآخرين.
          </p>

          {message && (
            <div
              style={{
                ...styles.message,
                ...(message.includes("بنجاح")
                  ? styles.successMessage
                  : styles.errorMessage),
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              submitting ||
              !studentClass ||
              !studentId ||
              studentCode.length !== 4
            }
            style={{
              ...styles.button,
              ...((loading ||
                submitting ||
                !studentClass ||
                !studentId ||
                studentCode.length !== 4) &&
                styles.disabledButton),
            }}
          >
            {submitting ? "جاري تسجيل الدخول..." : "دخول إلى الأكاديمية 🚀"}
          </button>
        </form>

        <p style={styles.teacher}>
          بإشراف الأستاذ / إبراهيم أحمد
        </p>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    direction: "rtl",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    padding: "24px 16px",
    background:
      "linear-gradient(145deg, #ecfdf5 0%, #f0fdf4 45%, #fff7ed 100%)",
    fontFamily:
      '"Tajawal", "Arial", "Tahoma", sans-serif',
  },

  decorativeCircleOne: {
    position: "absolute",
    width: "280px",
    height: "280px",
    borderRadius: "50%",
    background: "rgba(34, 197, 94, 0.10)",
    top: "-100px",
    right: "-90px",
  },

  decorativeCircleTwo: {
    position: "absolute",
    width: "240px",
    height: "240px",
    borderRadius: "50%",
    background: "rgba(251, 146, 60, 0.10)",
    bottom: "-90px",
    left: "-70px",
  },

  card: {
    width: "100%",
    maxWidth: "520px",
    position: "relative",
    zIndex: 1,
    background: "rgba(255, 255, 255, 0.97)",
    borderRadius: "28px",
    padding: "30px 24px",
    boxShadow: "0 22px 65px rgba(22, 101, 52, 0.15)",
    border: "1px solid rgba(34, 197, 94, 0.17)",
  },

  logoCircle: {
    width: "76px",
    height: "76px",
    borderRadius: "24px",
    margin: "0 auto 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "38px",
    boxShadow: "0 12px 28px rgba(22, 163, 74, 0.28)",
  },

  smallTitle: {
    margin: 0,
    textAlign: "center",
    color: "#64748b",
    fontSize: "15px",
  },

  title: {
    margin: "6px 0 4px",
    textAlign: "center",
    color: "#166534",
    fontSize: "30px",
    lineHeight: 1.4,
  },

  slogan: {
    margin: "0 0 22px",
    textAlign: "center",
    color: "#ea580c",
    fontSize: "17px",
    fontWeight: 800,
  },

  farisBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "15px",
    marginBottom: "22px",
    borderRadius: "20px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
  },

  farisEmoji: {
    width: "56px",
    height: "56px",
    flexShrink: 0,
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    fontSize: "33px",
    boxShadow: "0 6px 16px rgba(22, 101, 52, 0.10)",
  },

  farisTitle: {
    display: "block",
    marginBottom: "4px",
    color: "#166534",
    fontSize: "16px",
  },

  farisText: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.7,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  label: {
    color: "#14532d",
    fontWeight: 800,
    fontSize: "15px",
    marginTop: "3px",
  },

  select: {
    width: "100%",
    minHeight: "52px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 14px",
    fontSize: "16px",
    outline: "none",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "52px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    background: "#ffffff",
    color: "#0f172a",
    padding: "0 14px",
    fontSize: "21px",
    textAlign: "center",
    letterSpacing: "8px",
    outline: "none",
  },

  codeHint: {
    margin: "-2px 0 4px",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  message: {
    padding: "12px 14px",
    borderRadius: "13px",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: 1.6,
  },

  successMessage: {
    color: "#166534",
    background: "#dcfce7",
    border: "1px solid #86efac",
  },

  errorMessage: {
    color: "#b91c1c",
    background: "#fef2f2",
    border: "1px solid #fecaca",
  },

  button: {
    width: "100%",
    minHeight: "55px",
    marginTop: "7px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "17px",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(22, 163, 74, 0.25)",
  },

  disabledButton: {
    opacity: 0.55,
    cursor: "not-allowed",
    boxShadow: "none",
  },

  teacher: {
    margin: "23px 0 0",
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px",
  },
};