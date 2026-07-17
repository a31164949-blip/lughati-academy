"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

type Student = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  loginCode: string;
  active: boolean;
};

export default function LoginPage() {
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

        const snapshot = await getDocs(collection(db, "students"));

        const loadedStudents = snapshot.docs
          .map((studentDocument) => {
            const data = studentDocument.data();

            return {
              id: studentDocument.id,
              studentId: data.studentId || studentDocument.id,
              studentName: data.studentName || "طالب",
              classroom: data.classroom || "",
              loginCode: data.loginCode || "",
              active: data.active !== false,
            };
          })
          .filter((student) => student.active)
          .sort((first, second) =>
            first.studentId.localeCompare(second.studentId)
          );

        setStudents(loadedStudents);
      } catch (error) {
        console.error(error);
        setMessage("تعذر تحميل سجل الطلاب. أعد المحاولة بعد قليل.");
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, []);

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (student) => student.classroom === studentClass
      ),
    [students, studentClass]
  );

  function changeClass(classroom: string) {
    setStudentClass(classroom);
    setStudentId("");
    setStudentCode("");
    setMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!studentClass) {
      setMessage("اختر فصلك أولًا.");
      return;
    }

    if (!studentId) {
      setMessage("اختر اسمك من القائمة.");
      return;
    }

    if (!/^\d{4}$/.test(studentCode)) {
      setMessage("أدخل رمز الدخول المكوّن من أربعة أرقام.");
      return;
    }

    const selectedStudent = students.find(
      (student) => student.studentId === studentId
    );

    if (!selectedStudent) {
      setMessage("لم يتم العثور على بيانات الطالب.");
      return;
    }

    if (selectedStudent.loginCode !== studentCode) {
      setMessage("رمز الدخول غير صحيح. حاول مرة أخرى.");
      return;
    }

    setSubmitting(true);

    localStorage.setItem("student-id", selectedStudent.studentId);
    localStorage.setItem("student-name", selectedStudent.studentName);
    localStorage.setItem(
      "student-classroom",
      selectedStudent.classroom
    );
    localStorage.setItem("student-logged-in", "true");

    setMessage(
      `مرحبًا ${selectedStudent.studentName} 🌟 تم تسجيل دخولك بنجاح.`
    );

    window.setTimeout(() => {
      window.location.href = "/homework-check";
    }, 700);
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.card}>
        <div style={styles.farisBox}>
          <div style={styles.avatar}>👦🏻</div>
          <div>
            <p style={styles.academy}>أكاديمية لغتي الرقمية</p>
            <h1 style={styles.title}>تسجيل دخول الطالب</h1>
            <p style={styles.subtitle}>
              اختر فصلك واسمك، ثم أدخل رمز الدخول الخاص بك.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            الفصل
            <select
              value={studentClass}
              onChange={(event) => changeClass(event.target.value)}
              style={styles.input}
              disabled={loading}
            >
              <option value="">اختر الفصل</option>
              <option value="الثاني أ">الثاني أ</option>
              <option value="الثاني ب">الثاني ب</option>
            </select>
          </label>

          <label style={styles.label}>
            اسم الطالب
            <select
              value={studentId}
              onChange={(event) => {
                setStudentId(event.target.value);
                setStudentCode("");
                setMessage("");
              }}
              style={styles.input}
              disabled={!studentClass || loading}
            >
              <option value="">
                {loading
                  ? "جاري تحميل الطلاب..."
                  : studentClass
                  ? "اختر اسمك"
                  : "اختر الفصل أولًا"}
              </option>

              {filteredStudents.map((student) => (
                <option
                  key={student.studentId}
                  value={student.studentId}
                >
                  {student.studentName}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            رمز الدخول
            <input
              value={studentCode}
              onChange={(event) =>
                setStudentCode(
                  event.target.value.replace(/\D/g, "").slice(0, 4)
                )
              }
              inputMode="numeric"
              placeholder="أدخل 4 أرقام"
              style={styles.input}
              disabled={!studentId}
            />
          </label>

          <button
            type="submit"
            disabled={loading || submitting}
            style={{
              ...styles.button,
              opacity: loading || submitting ? 0.65 : 1,
            }}
          >
            {submitting ? "جاري الدخول..." : "دخول إلى الأكاديمية"}
          </button>

          {message && <div style={styles.message}>{message}</div>}
        </form>

        <div style={styles.tip}>
          <strong>💡 بيانات التجربة:</strong>
          <p style={styles.tipText}>
            طالب 01 رمزه 0001، وطالب 31 رمزه 0031.
          </p>
        </div>

        <p style={styles.privacy}>
          🛡️ لكل طالب رمز خاص، ولا تُعرض بياناته للزوار.
        </p>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "28px 18px",
    background:
      "linear-gradient(180deg, #f2faf6 0%, #eaf6f0 55%, #ffffff 100%)",
    fontFamily: "Arial, sans-serif",
    color: "#143f32",
  },

  card: {
    width: "100%",
    maxWidth: "720px",
    padding: "30px",
    background: "#ffffff",
    borderRadius: "30px",
    border: "1px solid #d5e9df",
    boxShadow: "0 18px 48px rgba(24, 105, 76, 0.12)",
  },

  farisBox: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "22px",
    marginBottom: "25px",
    borderRadius: "24px",
    background: "linear-gradient(135deg, #16845f, #20a174)",
    color: "#ffffff",
  },

  avatar: {
    width: "88px",
    height: "88px",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#ffffff",
    fontSize: "52px",
    border: "5px solid rgba(255,255,255,0.35)",
  },

  academy: {
    margin: "0 0 5px",
    fontWeight: 800,
  },

  title: {
    margin: "0 0 8px",
    fontSize: "clamp(27px, 5vw, 40px)",
  },

  subtitle: {
    margin: 0,
    lineHeight: 1.8,
  },

  form: {
    display: "grid",
    gap: "18px",
  },

  label: {
    display: "grid",
    gap: "8px",
    fontWeight: 900,
    fontSize: "18px",
  },

  input: {
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    border: "2px solid #d4e8de",
    background: "#fbfefc",
    color: "#143f32",
    fontSize: "17px",
    outline: "none",
  },

  button: {
    width: "100%",
    padding: "17px",
    border: "none",
    borderRadius: "17px",
    background: "#16845f",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: 900,
    cursor: "pointer",
  },

  message: {
    padding: "16px",
    borderRadius: "16px",
    background: "#fff6d5",
    color: "#705400",
    lineHeight: 1.8,
    fontWeight: 800,
    textAlign: "center",
  },

  tip: {
    marginTop: "22px",
    padding: "17px",
    borderRadius: "17px",
    background: "#eef8f3",
    color: "#285e4b",
  },

  tipText: {
    margin: "7px 0 0",
    lineHeight: 1.8,
  },

  privacy: {
    margin: "20px 0 0",
    color: "#607a70",
    textAlign: "center",
    lineHeight: 1.8,
  },
};