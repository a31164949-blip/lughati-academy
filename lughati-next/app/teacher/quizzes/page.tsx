"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc, 
  getDocs,
query,
where,
updateDoc,
setDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";
import type { Question } from "./types";
type TeacherQuizResult = {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  studentScore: number;
  totalScore: number;
  parentViewed: boolean;
  viewedFrom: string;
  answers: Record<string, string | number>;
  quizQuestions: Question[];
needsTeacherReview: boolean;
reviewStatus: string;
autoScore: number;
autoTotal: number;
manualScores: Record<string, number>;
manualScoreTotal: number;
  parentViewedAt?: {
    toDate?: () => Date;
  } | null;
};
import { createEmptyQuestion } from "./helpers";
import { styles } from "./styles";
import { useSearchParams } from "next/navigation";

export default function TeacherQuizzesPage() {
  const [title, setTitle] = useState("");
  const searchParams = useSearchParams();
const editQuizId = searchParams.get("quizId");
  const [description, setDescription] = useState("");
  const [classroom, setClassroom] = useState("الصف الثاني أ");
  const [audience, setAudience] = useState<"student" | "family">("student");

const [contentKind, setContentKind] = useState<
  "quiz" | "diagnostic-form" | "case-study-form"
>("quiz");
  const [questions, setQuestions] = useState<Question[]>([
    createEmptyQuestion(1),
  ]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [quizId, setQuizId] = useState<string | null>(null);
const [assessmentCategory, setAssessmentCategory] = useState<
  "فتري" | "تشخيصي" | "بنائي"
>("فتري");

const [assessmentType, setAssessmentType] = useState<
  "ورقي" | "إلكتروني"
>("ورقي");

const [studentScore, setStudentScore] = useState("");
const [totalScore, setTotalScore] = useState("");
const [testPaperImageUrl, setTestPaperImageUrl] = useState("");
const [testPaperFile, setTestPaperFile] = useState<File | null>(null);
const [resultStudentId, setResultStudentId] = useState("");
const [resultStudentName, setResultStudentName] = useState("");
const [teacherResultNote, setTeacherResultNote] = useState("");
const [quizResults, setQuizResults] = useState<TeacherQuizResult[]>([]);
const [quizResultsLoading, setQuizResultsLoading] = useState(true);
const [quizResultsError, setQuizResultsError] = useState("");
useEffect(() => {
  async function loadQuizForEditing() {
    if (!editQuizId) return;

    try {
      const quizSnapshot = await getDoc(
        doc(db, "quizzes", editQuizId)
      );

      if (!quizSnapshot.exists()) {
        setMessage("لم يتم العثور على الاختبار.");
        return;
      }
      const quizData = quizSnapshot.data();
      console.log("Quiz loaded:", quizData);
      setQuizId(quizSnapshot.id);
      setTitle(quizData.title ?? "");
      setDescription(quizData.description ?? "");
      setClassroom(quizData.classroom ?? "الصف الثاني أ");
      setAudience(quizData.audience ?? "student");
setContentKind(quizData.contentKind ?? "quiz");
      setQuestions(
        Array.isArray(quizData.questions) && quizData.questions.length > 0
          ? quizData.questions
          : [createEmptyQuestion(1)]
      );
      setMessage("تم تحميل الاختبار للتعديل.");
    } catch (error) {
      console.error("تعذر تحميل الاختبار:", error);
      setMessage("تعذر تحميل بيانات الاختبار.");
    }
  }

  loadQuizForEditing();
}, [editQuizId]);
useEffect(() => {
  async function loadQuizResultsForTeacher() {
    try {
      setQuizResultsLoading(true);
      setQuizResultsError("");

      const snapshot = await getDocs(
        collection(db, "quizResults")
      );

      const loadedResults: TeacherQuizResult[] = await Promise.all(
  snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
const quizSnapshot = await getDoc(
  doc(
    db,
    "quizzes",
    typeof data.quizId === "string" ? data.quizId : ""
  )
);

const quizData = quizSnapshot.exists()
  ? quizSnapshot.data()
  : null;
          return {
            id: docSnap.id,
            quizId:
              typeof data.quizId === "string"
                ? data.quizId
                : "",
            quizTitle:
              typeof data.quizTitle === "string"
                ? data.quizTitle
                : "اختبار لغتي",
            studentId:
              typeof data.studentId === "string"
                ? data.studentId
                : "",
            studentName:
              typeof data.studentName === "string"
                ? data.studentName
                : "",
                answers:
  data.answers && typeof data.answers === "object"
    ? (data.answers as Record<string, string | number>)
    : {},
quizQuestions:
  quizData && Array.isArray(quizData.questions)
    ? (quizData.questions as Question[])
    : [],
needsTeacherReview:
  data.needsTeacherReview === true,

reviewStatus:
  typeof data.reviewStatus === "string"
    ? data.reviewStatus
    : "completed",

autoScore:
  typeof data.autoScore === "number"
    ? data.autoScore
    : 0,

autoTotal:
  typeof data.autoTotal === "number"
    ? data.autoTotal
    : 0,
    manualScores:
  data.manualScores && typeof data.manualScores === "object"
    ? (data.manualScores as Record<string, number>)
    : {},

manualScoreTotal:
  typeof data.manualScoreTotal === "number"
    ? data.manualScoreTotal
    : 0,
            studentScore:
              typeof data.studentScore === "number"
                ? data.studentScore
                : 0,
            totalScore:
              typeof data.totalScore === "number"
                ? data.totalScore
                : 0,
            parentViewed: data.parentViewed === true,
            viewedFrom:
              typeof data.viewedFrom === "string"
                ? data.viewedFrom
                : "",
            parentViewedAt:
              data.parentViewedAt ?? null,
          };
        })
);

      setQuizResults(loadedResults);
    } catch (error) {
      console.error(
        "تعذر تحميل نتائج الطلاب للمعلم:",
        error
      );
      setQuizResults([]);
      setQuizResultsError(
        "تعذر تحميل متابعة نتائج الطلاب حاليًا."
      );
    } finally {
      setQuizResultsLoading(false);
    }
  }

  void loadQuizResultsForTeacher();
}, []);
  function updateQuestionText(questionId: number, value: string) {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question) =>
        question.id === questionId
          ? { ...question, text: value }
          : question
      )
    );
  }

  function updateOption(
    questionId: number,
    optionIndex: number,
    value: string
  ) {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question) => {
        if (question.id !== questionId) return question;

        const newOptions = [...question.options];
        newOptions[optionIndex] = value;

        return {
          ...question,
          options: newOptions,
        };
      })
    );
  }

  function updateCorrectAnswer(
    questionId: number,
    optionIndex: number
  ) {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question) =>
        question.id === questionId
          ? { ...question, correctAnswer: optionIndex }
          : question
      )
    );
  }

  function addQuestion() {
    const nextId =
      questions.length === 0
        ? 1
        : Math.max(...questions.map((question) => question.id)) + 1;

    setQuestions((currentQuestions) => [
      ...currentQuestions,
      createEmptyQuestion(nextId),
    ]);
  }
function createNewQuiz() {
  setQuizId(null);
  setTitle("");
  setDescription("");
  setQuestions([createEmptyQuestion(1)]);
  setMessage("");
}
  function removeQuestion(questionId: number) {
    if (questions.length === 1) {
      setMessage("يجب أن يحتوي الاختبار على سؤال واحد على الأقل.");
      return;
    }

    setQuestions((currentQuestions) =>
      currentQuestions.filter(
        (question) => question.id !== questionId
      )
    );
  }

  function validateQuiz() {
    if (!title.trim()) {
      return "اكتب عنوان الاختبار.";
    }

    if (questions.length === 0) {
      return "أضف سؤالًا واحدًا على الأقل.";
    }

    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];

      if (!question.text.trim()) {
        return `اكتب نص السؤال رقم ${index + 1}.`;
      }

      if (question.options.some((option) => !option.trim())) {
        return `أكمل جميع خيارات السؤال رقم ${index + 1}.`;
      }
    }

    return "";
  }

  async function saveQuiz(published: boolean) {
    setMessage("");

    const validationMessage = validateQuiz();

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    try {
      setSaving(true);

      const quizData = {
        audience,
contentKind,
  title: title.trim(),
  description: description.trim(),
  classroom,
  published,
  status: published ? "published" : "draft",
assessmentCategory,
assessmentType,
totalScore: totalScore.trim()
  ? Number(totalScore)
  : questions.length,
  questions: questions.map((question, index) => ({
    order: index + 1,
    text: question.text.trim(),
    questionType: question.questionType ?? "multiple-choice",
    options: question.options.map((option) => option.trim()),
    correctAnswer: question.correctAnswer,
    points: question.points ?? 1,
  })),

  totalQuestions: questions.length,
  totalPoints: questions.reduce(
  (sum, question) => sum + (question.points ?? 1),
  0
),
  updatedAt: serverTimestamp(),
};

if (quizId) {
  await updateDoc(doc(db, "quizzes", quizId), quizData);
} else {
  const quizReference = await addDoc(collection(db, "quizzes"), {
    ...quizData,
    createdAt: serverTimestamp(),
  });

  setQuizId(quizReference.id);
}

      setMessage(
        published
          ? "تم نشر الاختبار بنجاح ✅"
          : "تم حفظ الاختبار كمسودة ✅"
      );

    
    } catch (error) {
      console.error("تعذر حفظ الاختبار:", error);
      setMessage(
        "تعذر حفظ الاختبار. تحقق من الاتصال بقاعدة البيانات."
      );
    } finally {
      setSaving(false);
    }
  }
  async function uploadTestPaperImage(file: File) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", "lughati_homework_upload");

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/ffv5igmg/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`فشل رفع صورة ورقة الاختبار: ${errorText}`);
  }

  const data = await response.json();

  return data.secure_url as string;
}
  async function saveStudentResult() {
  if (!quizId) {
    setMessage("احفظ الاختبار أولًا قبل إضافة نتيجة الطالب.");
    return;
  }

  if (!resultStudentId.trim() || !resultStudentName.trim()) {
    setMessage("أكمل رقم الطالب واسم الطالب أولًا.");
    return;
  }

  if (!studentScore.trim()) {
    setMessage("أدخل درجة الطالب.");
    return;
  }

  const numericStudentScore = Number(studentScore);
  const numericTotalScore = totalScore.trim()
    ? Number(totalScore)
    : questions.length;

  if (
    Number.isNaN(numericStudentScore) ||
    Number.isNaN(numericTotalScore) ||
    numericStudentScore < 0 ||
    numericTotalScore <= 0 ||
    numericStudentScore > numericTotalScore
  ) {
    setMessage("تحقق من درجة الطالب والدرجة الكلية.");
    return;
  }

  try {
    setSaving(true);
    setMessage("");
let uploadedTestPaperImageUrl = testPaperImageUrl;

if (testPaperFile) {
  uploadedTestPaperImageUrl = await uploadTestPaperImage(testPaperFile);
  setTestPaperImageUrl(uploadedTestPaperImageUrl);
}
    const resultId = `${quizId}_${resultStudentId.trim()}`;

    await setDoc(
      doc(db, "quizResults", resultId),
      {
        quizId,
        quizTitle: title.trim(),

        studentId: resultStudentId.trim(),
        studentName: resultStudentName.trim(),

        assessmentCategory,
        assessmentType,

        studentScore: numericStudentScore,
        totalScore: numericTotalScore,

        teacherNote: teacherResultNote.trim(),

        testPaperImageUrl: uploadedTestPaperImageUrl.trim(),

        parentViewed: false,
        parentViewedAt: null,

        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setMessage("✅ تم حفظ نتيجة الطالب بنجاح");
  } catch (error) {
    console.error("تعذر حفظ نتيجة الطالب:", error);
    setMessage("تعذر حفظ نتيجة الطالب، حاول مرة أخرى.");
  } finally {
    setSaving(false);
  }
}
async function handleApproveQuizReview(result: TeacherQuizResult) {
  try {
    const manualScoreTotal = Object.values(result.manualScores).reduce(
      (sum, score) => sum + Number(score || 0),
      0
    );

    const finalScore = result.autoScore + manualScoreTotal;

    await updateDoc(doc(db, "quizResults", result.id), {
      manualScores: result.manualScores,
      manualScoreTotal,
      studentScore: finalScore,
      reviewStatus: "completed",
      needsTeacherReview: false,
      reviewedAt: serverTimestamp(),
    });

    setQuizResults((currentResults) =>
      currentResults.map((currentResult) =>
        currentResult.id === result.id
          ? {
              ...currentResult,
              manualScoreTotal,
              studentScore: finalScore,
              reviewStatus: "completed",
              needsTeacherReview: false,
            }
          : currentResult
      )
    );

    alert(`✅ تم اعتماد التصحيح النهائي. الدرجة: ${finalScore} من ${result.totalScore}`);
  } catch (error) {
    console.error("تعذر اعتماد التصحيح:", error);
    alert("تعذر اعتماد التصحيح. حاول مرة أخرى.");
  }
}
  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.container}>
        <div style={styles.hero}>
          <div style={styles.heroIcon}>📝</div>

          <div>
            <p style={styles.label}>أكاديمية لغتي الرقمية</p>
            <h1 style={styles.title}>إدارة الاختبارات</h1>
            <p style={styles.subtitle}>
              أنشئ اختبارًا قصيرًا، وحدد الإجابات الصحيحة، ثم احفظه
              كمسودة أو انشره للطلاب.
            </p>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>بيانات الاختبار</h2>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  }}
>
  <label style={styles.field}>
    <span style={styles.fieldLabel}>نوع المحتوى</span>
    <select
      value={audience}
      onChange={(event) => {
        const value = event.target.value as "student" | "family";
        setAudience(value);

        if (value === "student") {
          setContentKind("quiz");
        } else {
          setContentKind("diagnostic-form");
        }
      }}
      style={styles.input}
    >
      <option value="student">📝 اختبار طالب</option>
      <option value="family">👨‍👩‍👦 نموذج أسرة</option>
    </select>
  </label>

  {audience === "family" && (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>نوع نموذج الأسرة</span>
      <select
        value={contentKind}
        onChange={(event) =>
          setContentKind(
            event.target.value as
              | "diagnostic-form"
              | "case-study-form"
          )
        }
        style={styles.input}
      >
        <option value="diagnostic-form">🔎 استمارة تشخيص الطالب</option>
        <option value="case-study-form">📋 دراسة حالة الطالب</option>
      </select>
    </label>
  )}
</div>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>عنوان الاختبار</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثال: اختبار آداب التعامل"
              style={styles.input}
            />
          </label>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  }}
>
  <label style={styles.field}>
    <span style={styles.fieldLabel}>تصنيف الاختبار</span>
    <select
      value={assessmentCategory}
      onChange={(event) =>
        setAssessmentCategory(
          event.target.value as "فتري" | "تشخيصي" | "بنائي"
        )
      }
      style={styles.input}
    >
      <option value="فتري">فتري</option>
      <option value="تشخيصي">تشخيصي</option>
      <option value="بنائي">بنائي</option>
    </select>
  </label>

  <label style={styles.field}>
    <span style={styles.fieldLabel}>نوع الاختبار</span>
    <select
      value={assessmentType}
      onChange={(event) =>
        setAssessmentType(
          event.target.value as "ورقي" | "إلكتروني"
        )
      }
      style={styles.input}
    >
      <option value="ورقي">ورقي</option>
      <option value="إلكتروني">إلكتروني</option>
    </select>
  </label>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  }}
>
  <label style={styles.field}>
    <span style={styles.fieldLabel}>رقم الطالب</span>
    <input
      value={resultStudentId}
      onChange={(event) => setResultStudentId(event.target.value)}
      placeholder="مثال: 08"
      style={styles.input}
    />
  </label>

  <label style={styles.field}>
    <span style={styles.fieldLabel}>اسم الطالب</span>
    <input
      value={resultStudentName}
      onChange={(event) => setResultStudentName(event.target.value)}
      placeholder="اكتب اسم الطالب"
      style={styles.input}
    />
  </label>
</div>
  <label style={styles.field}>
    <span style={styles.fieldLabel}>درجة الطالب</span>
    <input
      type="number"
      min="0"
      value={studentScore}
      onChange={(event) => setStudentScore(event.target.value)}
      placeholder="مثال: 18"
      style={styles.input}
    />
  </label>

  <label style={styles.field}>
    <span style={styles.fieldLabel}>الدرجة الكلية</span>
    <input
      type="number"
      min="0"
      value={totalScore}
      onChange={(event) => setTotalScore(event.target.value)}
      placeholder="مثال: 20"
      style={styles.input}
    />
  </label>
</div>
<label style={styles.field}>
  <span style={styles.fieldLabel}>📄 صورة ورقة الاختبار — اختيارية</span>

  <input
    type="file"
    accept="image/*"
    onChange={(event) => {
      const file = event.target.files?.[0] ?? null;
      setTestPaperFile(file);
    }}
    style={styles.input}
  />

  <span
    style={{
      fontSize: 13,
      color: "#6b7f78",
      lineHeight: 1.7,
    }}
  >
    ارفع صورة الورقة فقط إذا رغبت في إتاحتها للطالب وولي الأمر.
  </span>
</label>
<label style={styles.field}>
  <span style={styles.fieldLabel}>💬 ملاحظة المعلم — اختيارية</span>

  <textarea
    value={teacherResultNote}
    onChange={(event) => setTeacherResultNote(event.target.value)}
    placeholder="مثال: أداء مميز، استمر يا بطل 🌟"
    style={styles.textarea}
  />
</label>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>وصف مختصر</span>
            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="اكتب تعليمات أو وصفًا مختصرًا للاختبار"
              style={styles.textarea}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.fieldLabel}>الفصل المستهدف</span>
            <select
              value={classroom}
              onChange={(event) =>
                setClassroom(event.target.value)
              }
              style={styles.input}
            >
              <option value="الصف الثاني أ">الصف الثاني أ</option>
              <option value="الصف الثاني ب">الصف الثاني ب</option>
              <option value="جميع طلاب الصف الثاني">
                جميع طلاب الصف الثاني
              </option>
            </select>
          </label>
        </div>
<div
  style={{
    ...styles.card,
    marginTop: "18px",
  }}
>
  <h2 style={styles.sectionTitle}>
    👨‍👩‍👦 متابعة اطلاع الأسرة على النتائج
  </h2>

  {quizResultsLoading ? (
    <p style={styles.helperText}>
      جارٍ تحميل نتائج الطلاب...
    </p>
  ) : quizResultsError ? (
    <p
      style={{
        ...styles.helperText,
        color: "#b42318",
      }}
    >
      {quizResultsError}
    </p>
  ) : quizResults.length === 0 ? (
    <div
      style={{
        padding: "18px",
        borderRadius: "16px",
        background: "#f8fbfa",
        textAlign: "center",
      }}
    >
      لا توجد نتائج طلاب حتى الآن.
    </div>
  ) : (
    <div
      style={{
        display: "grid",
        gap: "14px",
      }}
    >
      {quizResults.map((result) => {
        const viewedDate =
          result.parentViewedAt?.toDate?.() ?? null;
          

        return (
          <div
            key={result.id}
            style={{
              padding: "16px",
              borderRadius: "18px",
              border: "1px solid #dbe9e3",
              background: "#f9fcfb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <strong>
                {result.studentName || result.studentId}
              </strong>

              <span>
                {result.studentScore} / {result.totalScore}
              </span>
            </div>

            <div
              style={{
                marginTop: "8px",
                fontWeight: 700,
              }}
            >
              📝 {result.quizTitle}
            </div>
{result.needsTeacherReview && (
  <div
    style={{
      marginTop: "14px",
      padding: "14px",
      borderRadius: "14px",
      background: "white",
      border: "1px solid #dbe9e3",
    }}
  >
    <div
      style={{
        fontWeight: 800,
        marginBottom: "12px",
        color: "#147a5b",
      }}
    >
      ✍️ إجابات تحتاج مراجعة المعلم
    </div>

    {result.quizQuestions.map((question, questionIndex) => {
      const questionType =
        question.questionType ?? "multiple-choice";

      if (
        questionType !== "essay" &&
        questionType !== "short-text"
      ) {
        return null;
      }

      const studentAnswer =
        result.answers[String(questionIndex)];

      return (
        <div
          key={questionIndex}
          style={{
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "12px",
            background: "#f8fbfa",
          }}
        >
          <div style={{ fontWeight: 800 }}>
            السؤال {questionIndex + 1}: {question.text}
          </div>

          <div style={{ marginTop: "8px" }}>
            <strong>إجابة الطالب:</strong>{" "}
            {studentAnswer !== undefined &&
            String(studentAnswer).trim() !== ""
              ? String(studentAnswer)
              : "لم يُجب"}
          </div>

          <div style={{ marginTop: "6px" }}>
            الدرجة القصوى: {question.points ?? 1}
          </div>
          <div style={{ marginTop: "10px" }}>
  <label
    style={{
      display: "block",
      fontWeight: 800,
      marginBottom: "6px",
    }}
  >
    ⭐ درجة المعلم
  </label>

  <input
    type="number"
    min={0}
    max={question.points ?? 1}
    value={
      result.manualScores[String(questionIndex)] ?? ""
    }
    onChange={(event) => {
      const maxScore = question.points ?? 1;
      const enteredScore = Number(event.target.value);

      const safeScore = Math.max(
        0,
        Math.min(enteredScore, maxScore)
      );

      setQuizResults((currentResults) =>
        currentResults.map((currentResult) =>
          currentResult.id === result.id
            ? {
                ...currentResult,
                manualScores: {
                  ...currentResult.manualScores,
                  [String(questionIndex)]: safeScore,
                },
              }
            : currentResult
        )
      );
    }}
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: "10px",
      border: "1px solid #cbded6",
      fontSize: "16px",
      boxSizing: "border-box",
    }}
  />
</div>
        </div>
      );
    })}
  <button
  type="button"
  onClick={() => handleApproveQuizReview(result)}
  style={{
    width: "100%",
    marginTop: "14px",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "#147a5b",
    color: "white",
    fontSize: "17px",
    fontWeight: 800,
    cursor: "pointer",
  }}
>
  ✅ اعتماد التصحيح النهائي
</button>
  </div>
)}
            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                borderRadius: "14px",
                background: result.parentViewed
                  ? "#eaf8f2"
                  : "#fff8e8",
                color: result.parentViewed
                  ? "#147a5b"
                  : "#8a6a16",
              }}
            >
              {result.parentViewed ? (
                <>
                  <div>
                    ✅ تمت متابعة الأسرة
                  </div>

                  {viewedDate && (
                    <div style={{ marginTop: "6px" }}>
                      🕒{" "}
                      {viewedDate.toLocaleString("ar-SA")}
                    </div>
                  )}

                  <div style={{ marginTop: "6px" }}>
                    📱 المصدر:{" "}
                    {result.viewedFrom === "parent-account"
                      ? "حساب ولي الأمر"
                      : result.viewedFrom === "student-account"
                      ? "حساب الطالب"
                      : "غير محدد"}
                  </div>
                </>
              ) : (
                <div>
                  ⏳ لم تطّلع الأسرة على النتيجة بعد
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>
        <div style={styles.questionsHeader}>
          <div>
            <h2 style={styles.sectionTitle}>أسئلة الاختبار</h2>
            <p style={styles.helperText}>
              عدد الأسئلة الحالي: {questions.length}
            </p>
          </div>

          <button
            type="button"
            onClick={addQuestion}
            style={styles.addButton}
          >
            + إضافة سؤال
          </button>
        </div>

        {questions.map((question, questionIndex) => (
          <div key={question.id} style={styles.questionCard}>
            <div style={styles.questionTop}>
              <h3 style={styles.questionTitle}>
                السؤال {questionIndex + 1}
              </h3>

              <button
                type="button"
                onClick={() => removeQuestion(question.id)}
                style={styles.deleteButton}
              >
                حذف السؤال
              </button>
            </div>
<label style={styles.field}>
  <span style={styles.fieldLabel}>نوع السؤال</span>

  <select
    value={question.questionType ?? "multiple-choice"}
    onChange={(event) => {
      const selectedType = event.target.value as
        | "multiple-choice"
        | "essay"
        | "yes-no"
        | "short-text";

      setQuestions((currentQuestions) =>
        currentQuestions.map((item) =>
          item.id === question.id
            ? {
                ...item,
                questionType: selectedType,
                options:
                  selectedType === "yes-no"
                    ? ["نعم", "لا"]
                    : selectedType === "multiple-choice"
                    ? item.options.length > 0
                      ? item.options
                      : ["", "", "", ""]
                    : [],
                correctAnswer: 0,
              }
            : item
        )
      );
    }}
    style={styles.input}
  >
    <option value="multiple-choice">🔘 اختيار من متعدد</option>
    <option value="essay">✍️ سؤال مقالي</option>
    <option value="yes-no">✅ نعم / لا</option>
    <option value="short-text">📝 إجابة قصيرة</option>
  </select>
</label>
<label style={styles.field}>
  <span style={styles.fieldLabel}>درجة السؤال</span>

  <input
    type="number"
    min="0"
    value={question.points ?? 1}
    onChange={(event) => {
      const pointsValue = Number(event.target.value);

      setQuestions((currentQuestions) =>
        currentQuestions.map((item) =>
          item.id === question.id
            ? {
                ...item,
                points: Number.isFinite(pointsValue) ? pointsValue : 1,
              }
            : item
        )
      );
    }}
    style={styles.input}
  />
</label>
            <label style={styles.field}>
              <span style={styles.fieldLabel}>نص السؤال</span>
              <input
                value={question.text}
                onChange={(event) =>
                  updateQuestionText(
                    question.id,
                    event.target.value
                  )
                }
                placeholder="اكتب السؤال هنا"
                style={styles.input}
              />
            </label>
{(question.questionType ?? "multiple-choice") !== "essay" &&
  (question.questionType ?? "multiple-choice") !== "short-text" && (
            <div style={styles.optionsGrid}>
              {question.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  style={{
                    ...styles.optionBox,
                    ...(question.correctAnswer === optionIndex
                      ? styles.correctOption
                      : {}),
                  }}
                >
                  <div style={styles.optionHeader}>
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={
                        question.correctAnswer === optionIndex
                      }
                      onChange={() =>
                        updateCorrectAnswer(
                          question.id,
                          optionIndex
                        )
                      }
                    />

                    <span>
                      الخيار {optionIndex + 1}
                      {question.correctAnswer === optionIndex
                        ? " — الإجابة الصحيحة ✅"
                        : ""}
                    </span>
                  </div>

                  <input
                    value={option}
                    onChange={(event) =>
                      updateOption(
                        question.id,
                        optionIndex,
                        event.target.value
                      )
                    }
                    placeholder={`اكتب الخيار ${optionIndex + 1}`}
                    style={styles.optionInput}
                  />
                </label>
              ))}
            </div>
            )}
          </div>
        
        ))}

        {message && (
          <div style={styles.message}>{message}</div>
        )}

        <div style={styles.actions}>
          <button
  type="button"
  onClick={createNewQuiz}
  style={styles.secondaryButton}
>
  ➕ اختبار جديد
</button>
          <button
            type="button"
            disabled={saving}
            onClick={() => saveQuiz(false)}
            style={{
              ...styles.draftButton,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "جارٍ الحفظ..." : "حفظ كمسودة"}
          </button>
<button
  type="button"
  onClick={saveStudentResult}
  style={styles.secondaryButton}
>
  💾 حفظ نتيجة الطالب
</button>
          <button
            type="button"
            onClick={() => saveQuiz(true)}
            style={{
              ...styles.publishButton,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "جارٍ النشر..." : "نشر الاختبار للطلاب"}
          </button>
        </div>
      </section>
    </main>
  );
}