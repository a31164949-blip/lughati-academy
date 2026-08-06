"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../../../firebase";
import type { Quiz } from "../types";
import Link from "next/link";


export default function SavedQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadQuizzes() {
      try {
        setLoading(true);
        setMessage("");

        const quizzesQuery = query( 
          collection(db, "quizzes"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(quizzesQuery);

        const loadedQuizzes: Quiz[] = snapshot.docs.map((quizDocument) => ({
          id: quizDocument.id,
          ...(quizDocument.data() as Omit<Quiz, "id">),
        }));

        setQuizzes(loadedQuizzes);
      } catch (error) {
        console.error("تعذر تحميل الاختبارات:", error);
        setMessage("تعذر تحميل الاختبارات. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    }

    loadQuizzes();
  }, []);

async function handleDeleteQuiz(quizId: string, quizTitle: string) {
  const confirmed = window.confirm(
    `هل أنت متأكد من حذف اختبار "${quizTitle}"؟`
  );

  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, "quizzes", quizId));

    setQuizzes((currentQuizzes) =>
      currentQuizzes.filter((quiz) => quiz.id !== quizId)
    );

    setMessage("تم حذف الاختبار بنجاح.");
  } catch (error) {
    console.error("تعذر حذف الاختبار:", error);
    setMessage("تعذر حذف الاختبار، حاول مرة أخرى.");
  }
}
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: "32px 20px",
        background: "#f4fbf8",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1>📚 الاختبارات المحفوظة</h1>
        <p>إدارة المسودات والاختبارات المنشورة.</p>

        {loading && <p>جارٍ تحميل الاختبارات...</p>}

        {message && (
          <p
            style={{
              padding: 14,
              borderRadius: 12,
              background: "#fff1f1",
              color: "#b42318",
            }}
          >
            {message}
          </p>
        )}

        {!loading && !message && quizzes.length === 0 && (
          <p>لا توجد اختبارات محفوظة حتى الآن.</p>
        )}

        {!loading &&
          quizzes.map((quiz) => (
            <article
              key={quiz.id}
              style={{
                marginTop: 18,
                padding: 20,
                borderRadius: 18,
                background: "white",
                border: "1px solid #d8ebe3",
              }}
            >
              <h2 style={{ marginTop: 0 }}>{quiz.title}</h2>

              <p>{quiz.description || "لا يوجد وصف للاختبار."}</p>

              <p>
                الفصل: <strong>{quiz.classroom}</strong>
              </p>

              <p>
                عدد الأسئلة: <strong>{quiz.totalQuestions}</strong>
              </p>

              <p>
                الحالة:{" "}
                <strong>
                  {quiz.published ? "🟢 منشور" : "🟡 مسودة"}
                </strong>
              </p>
              <Link
  href={`/teacher/quizzes?quizId=${quiz.id}`}
  style={{
  display: "inline-block",
  marginTop: 16,
  padding: "10px 18px",
  backgroundColor: "#166534",
  color: "#ffffff",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: "bold",
  textAlign: "center",
}}
>
  ✏️ تعديل الاختبار
</Link>
<button
  type="button"
  onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
  style={{
    marginTop: 16,
    marginRight: 10,
    padding: "10px 18px",
    backgroundColor: "#ffffff",
    color: "#b91c1c",
    border: "1px solid #fca5a5",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  🗑 حذف الاختبار
</button>
            </article>
          ))}
      </div>
    </main>
  );
}