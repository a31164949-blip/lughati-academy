"use client";


import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../firebase";

type StudentQuestion = {
  id: number;
  text: string;
  options?: string[];
  correctAnswer?: number;
  questionType?: "multiple-choice" | "essay" | "yes-no" | "short-text";
  required?: boolean;
  points?: number;
};
type StudentQuiz = {
questions?: StudentQuestion[];
  id: string;
  title: string;
  description?: string;
  classroom?: string;
  totalQuestions?: number;
  totalPoints?: number;
  audience?: "student" | "family";
  contentKind?: "quiz" | "diagnostic-form" | "case-study-form";
  published?: boolean;
  status?: "draft" | "published";
};


    function TakeQuizPageContent() {
      const searchParams = useSearchParams();
const quizId = searchParams.get("quizId");
  const [quizzes, setQuizzes] = useState<StudentQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState<StudentQuiz | null>(null);
const [answers, setAnswers] = useState<Record<number, string | number>>({});
const [studentId, setStudentId] = useState("");
const [studentName, setStudentName] = useState("");
useEffect(() => {
  const savedStudentId =
    window.localStorage.getItem("student-id") ?? "";

  const savedStudentName =
    window.localStorage.getItem("student-name") ?? "";

  setStudentId(savedStudentId);
  setStudentName(savedStudentName);
}, []);
function updateAnswer(questionId: number, answer: string | number) {
  setAnswers((current) => ({
    ...current,
    [questionId]: answer,
  }));
}
function calculateQuizResult() {
  if (!selectedQuiz?.questions) {
    return {
      autoScore: 0,
      autoTotal: 0,
      needsTeacherReview: false,
    };
  }

  let autoScore = 0;
  let autoTotal = 0;
  let needsTeacherReview = false;

  selectedQuiz.questions.forEach((question, questionIndex) => {
    const questionType = question.questionType ?? "multiple-choice";
    const points = question.points ?? 1;

    if (
      questionType === "multiple-choice" ||
      questionType === "yes-no"
    ) {
      autoTotal += points;

      if (answers[questionIndex] === question.correctAnswer) {
        autoScore += points;
      }
    } else {
      needsTeacherReview = true;
    }
  });

  return {
    autoScore,
    autoTotal,
    needsTeacherReview,
  };
}

async function submitQuiz() {
  if (!selectedQuiz) return;

  try {
    setLoading(true);
    setError("");

   const currentUser = auth.currentUser;

if (!currentUser) {
  throw new Error("تعذر التحقق من تسجيل دخول الطالب.");
}

const idToken = await currentUser.getIdToken();

const response = await fetch("/api/quiz-submit", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  },
  body: JSON.stringify({
    quizId: selectedQuiz.id,
    answers,
  }),
});

const data = await response.json();

if (!response.ok || !data.success) {
  throw new Error(
    data?.message || "تعذر إرسال الاختبار."
  );
}

alert(
  data.needsTeacherReview
    ? "✅ تم إرسال الاختبار بنجاح، وبعض الإجابات بانتظار مراجعة المعلم."
    : `✅ تم إرسال الاختبار بنجاح. درجتك: ${data.autoScore} من ${data.autoTotal}`
);
  } catch (submitError) {
  console.error("تعذر إرسال الاختبار:", submitError);

  setError(
    submitError instanceof Error
      ? submitError.message
      : "تعذر إرسال الاختبار. حاول مرة أخرى."
  );
}
   finally {
    setLoading(false);
  }
}

async function loadSelectedQuiz(quizId: string) {
  try {
    setLoading(true);
    setError("");

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setSelectedQuiz(null);
      setError("يجب تسجيل الدخول بحساب الطالب أولًا.");
      return;
    }

    const idToken = await currentUser.getIdToken();

    const response = await fetch("/api/student-quizzes", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data?.message || "تعذر تحميل الاختبار."
      );
    }

    const quizzes = Array.isArray(data.quizzes)
      ? (data.quizzes as StudentQuiz[])
      : [];

    const selected = quizzes.find(
      (quiz) => quiz.id === quizId
    );

    if (!selected) {
      setSelectedQuiz(null);
      setError("لم يتم العثور على الاختبار.");
      return;
    }

    setSelectedQuiz(selected);
  } catch (error) {
    console.error("تعذر تحميل الاختبار:", error);
    setSelectedQuiz(null);
    setError("تعذر تحميل الاختبار. حاول مرة أخرى.");
  } finally {
    setLoading(false);
  }
}



  useEffect(() => {
    if (quizId) {
  loadSelectedQuiz(quizId);
  return;
}
    async function loadPublishedQuizzes() {
  try {
    setLoading(true);
    setError("");

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setQuizzes([]);
      setError("يجب تسجيل الدخول بحساب الطالب أولًا.");
      return;
    }

    const idToken = await currentUser.getIdToken();

    const response = await fetch("/api/student-quizzes", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data?.message || "تعذر تحميل الاختبارات المنشورة."
      );
    }

    const loadedQuizzes = Array.isArray(data.quizzes)
      ? (data.quizzes as StudentQuiz[])
      : [];

    setQuizzes(loadedQuizzes);
  } catch (loadError) {
    console.error("تعذر تحميل الاختبارات:", loadError);
    setQuizzes([]);

    setError(
      loadError instanceof Error
        ? loadError.message
        : "تعذر تحميل الاختبارات المنشورة."
    );
  } finally {
    setLoading(false);
  }
}

    loadPublishedQuizzes();
  }, [quizId]);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f7fbf9",
        padding: "24px",
        fontFamily: "inherit",
      }}
    >
      <a
  href="/journey"
  style={{
    display: "inline-block",
    marginBottom: "18px",
    padding: "10px 16px",
    borderRadius: "14px",
    border: "1px solid #b7d7c8",
    background: "#ffffff",
    color: "#176b4b",
    textDecoration: "none",
    fontWeight: 700,
  }}
>
  ← العودة إلى رحلتي
</a>
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {selectedQuiz && (
  <div
    style={{
      background: "white",
      borderRadius: "24px",
      padding: "28px",
      marginBottom: "20px",
      textAlign: "center",
      boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    }}
  >
    <div style={{ fontSize: "42px" }}>📝</div>

    <h1
      style={{
        color: "#087f5b",
        margin: "10px 0",
      }}
    >
      {selectedQuiz.title}
    </h1>

    {selectedQuiz.description && (
      <p style={{ color: "#64748b" }}>
        {selectedQuiz.description}
      </p>
    )}

    <p style={{ fontWeight: 700 }}>
      📚 عدد الأسئلة: {selectedQuiz.totalQuestions ?? 0}
    </p>
  </div>
)}
{selectedQuiz &&
  selectedQuiz.questions?.map((question, questionIndex) => (
    <div
      key={questionIndex}
      style={{
        background: "white",
        borderRadius: "20px",
        padding: "22px",
        marginBottom: "16px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          color: "#087f5b",
          fontWeight: 800,
          marginBottom: "10px",
        }}
      >
        السؤال {questionIndex + 1}
      </div>

      <div
        style={{
          fontSize: "19px",
          fontWeight: 700,
          color: "#173b31",
          lineHeight: 1.8,
        }}
      >
        {question.text}
      </div>
      {(question.questionType ?? "multiple-choice") === "multiple-choice" && (
  <div
    style={{
      display: "grid",
      gap: "10px",
      marginTop: "16px",
    }}
  >
    {(question.options ?? []).map((option, optionIndex) => (
      <button
        key={optionIndex}
        type="button"
        onClick={() => updateAnswer(questionIndex, optionIndex)}
        style={{
          width: "100%",
          border:
          answers[questionIndex]  === optionIndex
              ? "2px solid #087f5b"
              : "1px solid #dbe7e2",
          borderRadius: "14px",
          padding: "14px",
          background:
         answers[questionIndex]   === optionIndex
              ? "#e9f8f2"
              : "white",
          color: "#173b31",
          fontSize: "16px",
          textAlign: "right",
          cursor: "pointer",
        }}
      >
        {option}
      </button>
    ))}
  </div>
)}
{question.questionType === "yes-no" && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px",
      marginTop: "16px",
    }}
  >
    {["نعم", "لا"].map((option, optionIndex) => (
      <button
        key={option}
        type="button"
        onClick={() => updateAnswer(questionIndex, optionIndex)}
        style={{
          border:
            answers[questionIndex] === optionIndex
              ? "2px solid #087f5b"
              : "1px solid #dbe7e2",
          borderRadius: "14px",
          padding: "16px",
          background:
            answers[questionIndex] === optionIndex
              ? "#e9f8f2"
              : "white",
          color: "#173b31",
          fontSize: "17px",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        {option === "نعم" ? "✅ نعم" : "❌ لا"}
      </button>
    ))}
  </div>
)}
{question.questionType === "short-text" && (
  <input
    type="text"
    value={
  typeof answers[questionIndex] === "string"
    ? String(answers[questionIndex])
    : ""
}
    onChange={(event) =>
      updateAnswer(questionIndex, event.target.value)
    }
    placeholder="اكتب إجابتك هنا..."
    style={{
      width: "100%",
      marginTop: "16px",
      padding: "14px",
      border: "1px solid #dbe7e2",
      borderRadius: "14px",
      fontSize: "16px",
      boxSizing: "border-box",
      textAlign: "right",
    }}
  />
)}
{question.questionType === "essay" && (
  <textarea
    value={
      typeof answers[questionIndex] === "string"
        ? String(answers[questionIndex])
        : ""
    }
    onChange={(event) =>
      updateAnswer(questionIndex, event.target.value)
    }
    placeholder="اكتب إجابتك بالتفصيل هنا..."
    rows={6}
    style={{
      width: "100%",
      marginTop: "16px",
      padding: "16px",
      border: "1px solid #dbe7e2",
      borderRadius: "14px",
      fontSize: "16px",
      boxSizing: "border-box",
      textAlign: "right",
      resize: "vertical",
      lineHeight: 1.8,
      fontFamily: "inherit",
    }}
  />
)}
    </div>
  ))}
  {selectedQuiz && (
  <button
    type="button"
    onClick={submitQuiz}
    style={{
      width: "100%",
      marginBottom: "20px",
      padding: "16px",
      border: "none",
      borderRadius: "16px",
      background: "#087f5b",
      color: "white",
      fontSize: "18px",
      fontWeight: 800,
      cursor: "pointer",
    }}
  >
    إرسال الاختبار ✅
  </button>
)}
        <div
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "28px",
            marginBottom: "20px",
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: "42px" }}>📝</div>

          <h1
            style={{
              color: "#087f5b",
              margin: "10px 0",
            }}
          >
            الاختبارات الإلكترونية
          </h1>

          <p style={{ color: "#64748b" }}>
            اختر الاختبار الذي نشره معلمك وابدأ الحل.
          </p>
        </div>

        {loading && (
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "20px",
              textAlign: "center",
            }}
          >
            جاري تحميل الاختبارات...
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fff1f2",
              color: "#b91c1c",
              padding: "18px",
              borderRadius: "18px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && quizzes.length === 0 && (
          <div
            style={{
              background: "white",
              padding: "28px",
              borderRadius: "20px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            لا توجد اختبارات منشورة حاليًا.
          </div>
        )}

        {!loading &&
          quizzes.map((quiz) => (
            <div
              key={quiz.id}
              style={{
                background: "white",
                borderRadius: "22px",
                padding: "22px",
                marginBottom: "16px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 10px",
                  color: "#173b31",
                }}
              >
                {quiz.title}
              </h2>

              {quiz.description && (
                <p style={{ color: "#64748b" }}>
                  {quiz.description}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "14px",
                }}
              >
                <span>📚 {quiz.totalQuestions ?? 0} سؤال</span>
                <span>⭐ {quiz.totalPoints ?? 0} درجة</span>
                {quiz.classroom && <span>🏫 {quiz.classroom}</span>}
              </div>
              <button
  type="button"
  onClick={() => {
    window.location.href = `/quizzes/take?quizId=${quiz.id}`;
  }}
  style={{
    width: "100%",
    marginTop: "18px",
    border: "none",
    borderRadius: "14px",
    padding: "14px",
    background: "#087f5b",
    color: "white",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  }}
>
  ابدأ الاختبار 🚀
</button>
            </div>
          ))}
      </div>
    </main>
  );
}
export default function TakeQuizPage() {
  return (
    <Suspense fallback={<div>جاري تحميل الاختبار...</div>}>
      <TakeQuizPageContent />
    </Suspense>
  );
}