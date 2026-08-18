"use client";

"use client";

import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function MadrasatiBridgePage() {
  const [completed, setCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
async function handleCompleteMadrasati() {
  try {
    const studentId = localStorage.getItem("student-id");

    if (!studentId) {
      alert("تعذر العثور على بيانات الطالب.");
      return;
    }

    setIsSaving(true);

    const today = new Date().toLocaleDateString("en-CA");
    const completionId = `${studentId}_madrasati_${today}`;

    await setDoc(
      doc(db, "homeworkCompletions", completionId),
      {
        studentId,
        homeworkId: `madrasati_${today}`,
        homeworkTitle: "واجب منصة مدرستي",
        completionMethod: "🏫 عبر مدرستي",
        completed: true,
        teacherReviewed: false,
        status: "pending",
        completedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setCompleted(true);
  } catch (error) {
    console.error("تعذر حفظ إنجاز مدرستي:", error);
    alert("تعذر تسجيل الإنجاز الآن.");
  } finally {
    setIsSaving(false);
  }
}
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "28px",
            padding: "32px",
            border: "1px solid #dbeafe",
          }}
        >
          <div style={{ fontSize: "56px" }}>🏫</div>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: 900,
              marginBottom: "10px",
            }}
          >
            جسر مدرستي
          </h1>

          <p
            style={{
              fontSize: "18px",
              color: "#64748b",
              lineHeight: 1.8,
            }}
          >
            انتقل إلى منصة مدرستي، أنجز واجبك، ثم عد إلى الأكاديمية.
          </p>

          <a
            href="https://schools.madrasati.sa/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              marginTop: "28px",
              padding: "16px",
              borderRadius: "18px",
              background: "#0f766e",
              color: "white",
              fontSize: "20px",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            🔗 فتح منصة مدرستي
          </a>

          <button
            type="button"
            onClick={handleCompleteMadrasati}
            disabled={completed || isSaving}
            style={{
              width: "100%",
              marginTop: "14px",
              padding: "16px",
              borderRadius: "18px",
              border: "2px solid #0f766e",
              background: completed ? "#dcfce7" : "white",
              color: "#0f766e",
              fontSize: "20px",
              fontWeight: 900,
            }}
          >
            {isSaving
  ? "⏳ جارٍ تسجيل الإنجاز..."
  : completed
  ? "✅ تم تسجيل الإنجاز"
  : "✅ أنجزت واجب مدرستي"}
          </button>

          {completed && (
            <p
              style={{
                marginTop: "18px",
                fontWeight: 800,
                color: "#166534",
              }}
            >
              ⏳ تم تسجيل إنجازك، وسيتم ربط المكافأة بعد اعتماد المعلم.
            </p>
          )}

          <a
            href="/journey"
            style={{
              display: "inline-block",
              marginTop: "28px",
              color: "#0f766e",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            ← العودة إلى رحلتي
          </a>
        </div>
      </div>
    </main>
  );
}