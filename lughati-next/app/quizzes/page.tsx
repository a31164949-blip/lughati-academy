"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
updateDoc,
serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

type QuizResult = {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  assessmentCategory: "فتري" | "تشخيصي" | "بنائي";
  assessmentType: "ورقي" | "إلكتروني";
  studentScore: number;
  totalScore: number;
  teacherNote: string;
  testPaperImageUrl: string;
  parentViewed: boolean;
};




export default function QuizzesPage() {
  const [results, setResults] = useState<QuizResult[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
useEffect(() => {
  async function loadStudentQuizResults() {
    try {
      setLoading(true);
      setError("");

      const studentId = localStorage.getItem("student-id");

      if (!studentId) {
        setError("تعذر معرفة حساب الطالب الحالي.");
        setResults([]);
        return;
      }

      const resultsQuery = query(
        collection(db, "quizResults"),
        where("studentId", "==", studentId)
      );

      const snapshot = await getDocs(resultsQuery);

      const loadedResults: QuizResult[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          quizId: typeof data.quizId === "string" ? data.quizId : "",
          quizTitle:
            typeof data.quizTitle === "string"
              ? data.quizTitle
              : "اختبار لغتي",
          studentId:
            typeof data.studentId === "string" ? data.studentId : "",
          studentName:
            typeof data.studentName === "string" ? data.studentName : "",
          assessmentCategory:
            data.assessmentCategory === "تشخيصي" ||
            data.assessmentCategory === "بنائي"
              ? data.assessmentCategory
              : "فتري",
          assessmentType:
            data.assessmentType === "إلكتروني"
              ? "إلكتروني"
              : "ورقي",
          studentScore:
            typeof data.studentScore === "number"
              ? data.studentScore
              : 0,
          totalScore:
            typeof data.totalScore === "number"
              ? data.totalScore
              : 0,
          teacherNote:
            typeof data.teacherNote === "string"
              ? data.teacherNote
              : "",
          testPaperImageUrl:
            typeof data.testPaperImageUrl === "string"
              ? data.testPaperImageUrl
              : "",
          parentViewed: data.parentViewed === true,
        };
      });

      setResults(loadedResults);
    } catch (error) {
      console.error("تعذر تحميل نتائج الاختبارات:", error);
      setError("تعذر تحميل نتائج الاختبارات حاليًا.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  void loadStudentQuizResults();
}, []);
async function markResultAsViewed(resultId: string) {
  const confirmed = window.confirm(
    "هل تؤكد أن ولي أمرك اطّلع على نتيجة الاختبار؟"
  );

  if (!confirmed) return;

  try {
    await updateDoc(doc(db, "quizResults", resultId), {
      parentViewed: true,
      parentViewedAt: serverTimestamp(),
      viewedFrom: "student-account",
    });

    setResults((currentResults) =>
      currentResults.map((result) =>
        result.id === resultId
          ? {
              ...result,
              parentViewed: true,
            }
          : result
      )
    );
  } catch (error) {
    console.error("تعذر تسجيل اطلاع ولي الأمر:", error);
    window.alert("تعذر تسجيل الاطلاع، حاول مرة أخرى.");
  }
}
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f8fbf8",
        padding: "28px 18px 60px",
        fontFamily: "inherit",
        color: "#173b31",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* العنوان */}
        <section
          style={{
            background: "white",
            borderRadius: "28px",
            padding: "32px 22px",
            textAlign: "center",
            boxShadow: "0 10px 35px rgba(0,0,0,0.06)",
            marginBottom: "24px",
          }}
        >
          <div style={{ fontSize: "48px" }}>📝</div>

          <h1
            style={{
              margin: "10px 0",
              fontSize: "32px",
              color: "#147a5b",
            }}
          >
            اختباراتي
          </h1>

          <p
            style={{
              margin: 0,
              color: "#647b73",
              fontSize: "17px",
              lineHeight: 1.8,
            }}
          >
            هنا تشاهد اختباراتك ودرجاتك وتتابع تقدمك ⭐
          </p>
        </section>

        {/* بطاقة اختبار */}
        {loading ? (
  <section
    style={{
      background: "white",
      borderRadius: "26px",
      padding: "28px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
      textAlign: "center",
    }}
  >
    جارٍ تحميل نتائج اختباراتك...
  </section>
) : error ? (
  <section
    style={{
      background: "#fff5f5",
      borderRadius: "26px",
      padding: "28px",
      color: "#b42318",
      textAlign: "center",
    }}
  >
    {error}
  </section>
) : results.length === 0 ? (
  <section
    style={{
      background: "white",
      borderRadius: "26px",
      padding: "28px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: "36px", marginBottom: "12px" }}>📝</div>
    <h2 style={{ margin: "0 0 8px", fontSize: "22px" }}>
      لا توجد نتائج اختبارات بعد
    </h2>
    <p style={{ margin: 0, color: "#75877f" }}>
      ستظهر درجاتك هنا بعد أن يعتمدها المعلم.
    </p>
  </section>
) : (
  <div style={{ display: "grid", gap: "22px" }}>
    {results.map((result) => (
      <section
        key={result.id}
        style={{
          background: "white",
          borderRadius: "26px",
          padding: "24px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "22px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "23px" }}>
            {result.quizTitle}
          </h2>

          <span
            style={{
              background: "#eaf8f2",
              color: "#147a5b",
              padding: "8px 15px",
              borderRadius: "999px",
              fontWeight: 700,
            }}
          >
            ⭐ تم التصحيح
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
          }}
        >
          <InfoBox
            label="الاختبار"
            value={result.assessmentCategory}
            icon="📋"
          />

          <InfoBox
            label="نوع الاختبار"
            value={result.assessmentType}
            icon="📝"
          />

          <InfoBox
            label="درجة الاختبار"
            value={String(result.studentScore)}
            icon="⭐"
          />

          <InfoBox
            label="الدرجة الكلية"
            value={String(result.totalScore)}
            icon="🎯"
          />
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "18px",
            borderRadius: "20px",
            background: "#fff9e9",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "28px" }}>🌟</div>

          <strong style={{ fontSize: "18px" }}>
            أحسنت يا بطل!
          </strong>

          <p
            style={{
              margin: "8px 0 0",
              color: "#786c49",
            }}
          >
            {result.teacherNote ||
              "استمر في التقدم، وكل محاولة تقرّبك أكثر من التميز."}
          </p>
        </div>

        {result.testPaperImageUrl ? (
          <>
            <button
              type="button"
              onClick={() =>
                window.open(
                  result.testPaperImageUrl,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              style={{
                width: "100%",
                marginTop: "18px",
                padding: "16px",
                border: "none",
                borderRadius: "18px",
                background: "#147a5b",
                color: "white",
                fontSize: "17px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              👀 عرض صورة ورقة الاختبار
            </button>

            <p
              style={{
                textAlign: "center",
                color: "#75877f",
                fontSize: "14px",
                marginBottom: 0,
              }}
            >
              يمكن الاطلاع على صورة ورقة الاختبار عند إتاحتها.
            </p>
          </>
        ) : (
          <p
            style={{
              textAlign: "center",
              color: "#75877f",
              fontSize: "14px",
              marginTop: "18px",
              marginBottom: 0,
            }}
          >
            لم تُرفق صورة لورقة هذا الاختبار.
          </p>
        )}
        {result.parentViewed ? (
  <div
    style={{
      marginTop: "18px",
      padding: "16px",
      borderRadius: "18px",
      background: "#eaf8f2",
      color: "#147a5b",
      textAlign: "center",
      fontWeight: 700,
    }}
  >
    ✅ تمت متابعة الأسرة والاطلاع على النتيجة
  </div>
) : (
  <button
    type="button"
    onClick={() => markResultAsViewed(result.id)}
    style={{
      width: "100%",
      marginTop: "18px",
      padding: "16px",
      border: "2px solid #147a5b",
      borderRadius: "18px",
      background: "white",
      color: "#147a5b",
      fontSize: "16px",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    👨‍👩‍👦 ولي أمري اطّلع على النتيجة
  </button>
)}
      </section>
    ))}
  </div>
)}
      </div>
    </main>
  );
}

function InfoBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "#f4faf7",
        borderRadius: "18px",
        padding: "18px",
      }}
    >
      <div
        style={{
          color: "#6b8078",
          fontSize: "14px",
          marginBottom: "7px",
        }}
      >
        {icon} {label}
      </div>

      <strong
        style={{
          fontSize: "19px",
          color: "#173b31",
        }}
      >
        {value}
      </strong>
    </div>
  );
}