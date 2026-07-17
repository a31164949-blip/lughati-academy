"use client";

import { useState } from "react";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../../../firebase";

type SetupStatus = "idle" | "creating" | "success" | "error";

export default function StudentsSetupPage() {
  const [status, setStatus] = useState<SetupStatus>("idle");
  const [message, setMessage] = useState("");
  const [studentsCount, setStudentsCount] = useState<number | null>(null);

  async function createStudents() {
    const confirmed = window.confirm(
      "سيتم إنشاء أو تحديث 60 طالبًا تجريبيًا في Firebase. هل تريد المتابعة؟"
    );

    if (!confirmed) return;

    try {
      setStatus("creating");
      setMessage("جاري إنشاء الطلاب التجريبيين...");

      const batch = writeBatch(db);

      for (let number = 1; number <= 60; number += 1) {
        const studentId = `student-${String(number).padStart(3, "0")}`;
        const studentName = `طالب ${String(number).padStart(2, "0")}`;
        const classroom = number <= 30 ? "الثاني أ" : "الثاني ب";

        batch.set(
          doc(db, "students", studentId),
          {
            studentId,
            studentName,
            classroom,
            active: true,
            temporary: true,
            loginCode: String(number).padStart(4, "0"),
            stars: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      await batch.commit();

      setStudentsCount(60);
      setStatus("success");
      setMessage(
        "تم إنشاء 60 طالبًا تجريبيًا بنجاح: 30 في الثاني أ و30 في الثاني ب."
      );
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(
        "تعذر إنشاء الطلاب. تحقق من اتصال Firebase وقواعد Firestore."
      );
    }
  }

  async function checkStudents() {
    try {
      setMessage("جاري التحقق من سجل الطلاب...");

      const snapshot = await getDocs(collection(db, "students"));

      setStudentsCount(snapshot.size);
      setMessage(`عدد الطلاب الموجودين حاليًا: ${snapshot.size} طالبًا.`);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("تعذر قراءة سجل الطلاب من Firebase.");
    }
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.header}>
        <div style={styles.icon}>👨‍🎓</div>

        <div>
          <p style={styles.smallTitle}>لوحة المعلم</p>
          <h1 style={styles.title}>إعداد سجل الطلاب</h1>
          <p style={styles.subtitle}>
            إنشاء طلاب تجريبيين مؤقتًا حتى تتوفر الأسماء الحقيقية.
          </p>
        </div>
      </section>

      <section style={styles.summaryGrid}>
        <article style={styles.summaryCard}>
          <strong style={styles.number}>60</strong>
          <span style={styles.label}>إجمالي الطلاب</span>
        </article>

        <article style={styles.summaryCard}>
          <strong style={styles.number}>30</strong>
          <span style={styles.label}>طلاب الثاني أ</span>
        </article>

        <article style={styles.summaryCard}>
          <strong style={styles.number}>30</strong>
          <span style={styles.label}>طلاب الثاني ب</span>
        </article>
      </section>

      <section style={styles.setupCard}>
        <h2 style={styles.sectionTitle}>إنشاء القائمة التجريبية</h2>

        <p style={styles.description}>
          ستُنشأ أسماء من طالب 01 إلى طالب 60، ولكل طالب معرّف ثابت يمكن
          الاحتفاظ به عند استبدال الاسم لاحقًا.
        </p>

        <div style={styles.examples}>
          <div style={styles.example}>
            <strong>طالب 01</strong>
            <span>الثاني أ</span>
            <code>student-001</code>
          </div>

          <div style={styles.example}>
            <strong>طالب 31</strong>
            <span>الثاني ب</span>
            <code>student-031</code>
          </div>
        </div>

        <button
          type="button"
          disabled={status === "creating"}
          onClick={createStudents}
          style={{
            ...styles.createButton,
            opacity: status === "creating" ? 0.65 : 1,
          }}
        >
          {status === "creating"
            ? "جاري إنشاء الطلاب..."
            : "إنشاء 60 طالبًا تجريبيًا"}
        </button>

        <button
          type="button"
          onClick={checkStudents}
          style={styles.checkButton}
        >
          التحقق من عدد الطلاب
        </button>

        {message && (
          <div
            style={{
              ...styles.message,
              background:
                status === "error"
                  ? "#feecec"
                  : status === "success"
                  ? "#e8f8ef"
                  : "#eef7f3",
              color: status === "error" ? "#993333" : "#195d43",
            }}
          >
            {message}
          </div>
        )}

        {studentsCount !== null && (
          <div style={styles.countBox}>
            عدد السجلات في Firebase: <strong>{studentsCount}</strong>
          </div>
        )}
      </section>

      <section style={styles.note}>
        <span style={styles.noteIcon}>🛡️</span>

        <div>
          <h3 style={styles.noteTitle}>أسماء مؤقتة قابلة للتعديل</h3>
          <p style={styles.noteText}>
            عندما تتوفر الأسماء الحقيقية، سنغيّر اسم الطالب وفصله فقط مع
            الاحتفاظ بمعرّفه وسجل إنجازاته.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "28px 18px 50px",
    background:
      "linear-gradient(180deg, #f3faf6 0%, #eef7f3 55%, #ffffff 100%)",
    color: "#143f32",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    maxWidth: "950px",
    margin: "0 auto 24px",
    padding: "26px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "26px",
    boxShadow: "0 12px 35px rgba(25, 104, 76, 0.08)",
  },

  icon: {
    width: "78px",
    height: "78px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    borderRadius: "23px",
    background: "#16845f",
    fontSize: "40px",
  },

  smallTitle: {
    margin: "0 0 6px",
    color: "#16845f",
    fontWeight: 800,
  },

  title: {
    margin: "0 0 8px",
    fontSize: "clamp(27px, 4vw, 40px)",
  },

  subtitle: {
    margin: 0,
    color: "#617a70",
    lineHeight: 1.8,
  },

  summaryGrid: {
    maxWidth: "950px",
    margin: "0 auto 24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
  },

  summaryCard: {
    padding: "24px",
    display: "grid",
    placeItems: "center",
    gap: "8px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "22px",
  },

  number: {
    fontSize: "39px",
    color: "#16845f",
  },

  label: {
    color: "#587368",
    fontWeight: 800,
  },

  setupCard: {
    maxWidth: "950px",
    margin: "0 auto 24px",
    padding: "28px",
    background: "#ffffff",
    border: "1px solid #d8ebe2",
    borderRadius: "28px",
    boxShadow: "0 14px 40px rgba(25, 104, 76, 0.08)",
  },

  sectionTitle: {
    margin: "0 0 12px",
    fontSize: "30px",
  },

  description: {
    margin: "0 0 22px",
    color: "#5a756a",
    lineHeight: 1.9,
  },

  examples: {
    marginBottom: "22px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "14px",
  },

  example: {
    padding: "18px",
    display: "grid",
    gap: "8px",
    borderRadius: "18px",
    background: "#f1f8f5",
    border: "1px solid #d6e9df",
  },

  createButton: {
    width: "100%",
    padding: "17px",
    border: "none",
    borderRadius: "17px",
    background: "#16845f",
    color: "#ffffff",
    fontSize: "19px",
    fontWeight: 900,
    cursor: "pointer",
  },

  checkButton: {
    width: "100%",
    marginTop: "12px",
    padding: "15px",
    border: "1px solid #bfdccf",
    borderRadius: "17px",
    background: "#ffffff",
    color: "#23634d",
    fontSize: "17px",
    fontWeight: 800,
    cursor: "pointer",
  },

  message: {
    marginTop: "18px",
    padding: "18px",
    borderRadius: "17px",
    lineHeight: 1.8,
    fontWeight: 800,
  },

  countBox: {
    marginTop: "14px",
    padding: "16px",
    textAlign: "center",
    borderRadius: "16px",
    background: "#fff7d8",
    color: "#735800",
  },

  note: {
    maxWidth: "950px",
    margin: "0 auto",
    padding: "23px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    borderRadius: "24px",
    background: "#eef7f3",
    border: "1px solid #cfe5da",
  },

  noteIcon: {
    fontSize: "38px",
  },

  noteTitle: {
    margin: "0 0 6px",
  },

  noteText: {
    margin: 0,
    color: "#5c776c",
    lineHeight: 1.8,
  },
};