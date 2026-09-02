"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";

import { db } from "../../../firebase";
import type { Question } from "./types";
import { createEmptyQuestion } from "./helpers";
import { styles } from "./styles";

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
  parentViewedAt?: { toDate?: () => Date } | null;
};

type PaperStudent = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
};

const paperTableColumns =
  "minmax(220px, 2fr) minmax(120px, 0.8fr) 120px minmax(190px, 1fr)";


const CACHE_DURATION_MS = 5 * 60 * 1000;
const QUIZ_RESULTS_CACHE_KEY = "teacher-quizzes-results-cache-v1";
const PAPER_STUDENTS_CACHE_KEY = "teacher-quizzes-students-cache-v1";

type CachedTeacherQuizResult = Omit<TeacherQuizResult, "parentViewedAt"> & {
  parentViewedAtMillis: number | null;
};

function getCachedValue<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      cachedAt?: number;
      value?: T;
    };

    if (
      typeof parsed.cachedAt !== "number" ||
      Date.now() - parsed.cachedAt >= CACHE_DURATION_MS
    ) {
      sessionStorage.removeItem(key);
      return null;
    }

    return parsed.value ?? null;
  } catch (error) {
    console.warn(`تعذر قراءة الذاكرة المؤقتة: ${key}`, error);
    return null;
  }
}

function setCachedValue<T>(key: string, value: T) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        cachedAt: Date.now(),
        value,
      })
    );
  } catch (error) {
    console.warn(`تعذر حفظ الذاكرة المؤقتة: ${key}`, error);
  }
}

function clearQuizResultsCache() {
  try {
    sessionStorage.removeItem(QUIZ_RESULTS_CACHE_KEY);
  } catch (error) {
    console.warn("تعذر حذف ذاكرة نتائج الاختبارات.", error);
  }
}

function toCachedQuizResult(
  result: TeacherQuizResult
): CachedTeacherQuizResult {
  const { parentViewedAt, ...rest } = result;
  const parentViewedDate = parentViewedAt?.toDate?.() ?? null;

  return {
    ...rest,
    parentViewedAtMillis: parentViewedDate
      ? parentViewedDate.getTime()
      : null,
  };
}

function fromCachedQuizResult(
  result: CachedTeacherQuizResult
): TeacherQuizResult {
  const {
    parentViewedAtMillis,
    ...rest
  } = result;

  return {
    ...rest,
    parentViewedAt:
      typeof parentViewedAtMillis === "number"
        ? {
            toDate: () =>
              new Date(parentViewedAtMillis),
          }
        : null,
  };
}

function normalizeClassroom(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.includes("جميع")) return "all";
  if (normalized.endsWith("ب")) return "ب";
  if (normalized.endsWith("أ")) return "أ";
  return normalized;
}

export default function TeacherQuizzesPage() {
  const searchParams = useSearchParams();
  const editQuizId = searchParams.get("quizId");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classroom, setClassroom] = useState("الصف الثاني أ");
  const [audience, setAudience] = useState<"student" | "family">("student");
  const [contentKind, setContentKind] = useState<
    "quiz" | "diagnostic-form" | "case-study-form"
  >("quiz");

  const [questions, setQuestions] = useState<Question[]>([
    createEmptyQuestion(1),
  ]);

  const [assessmentCategory, setAssessmentCategory] = useState<
    "فتري" | "تشخيصي" | "بنائي"
  >("فتري");
  const [assessmentType, setAssessmentType] = useState<
    "ورقي" | "إلكتروني"
  >("ورقي");

  const [totalScore, setTotalScore] = useState("");
  const [teacherResultNote, setTeacherResultNote] = useState("");
  const [allPaperStudents, setAllPaperStudents] = useState<PaperStudent[]>([]);
  const [paperScores, setPaperScores] = useState<Record<string, string>>({});
  const [paperFiles, setPaperFiles] = useState<Record<string, File | null>>({});

  const [quizResults, setQuizResults] = useState<TeacherQuizResult[]>([]);
  const [quizResultsLoading, setQuizResultsLoading] = useState(true);
  const [quizResultsError, setQuizResultsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [quizId, setQuizId] = useState<string | null>(null);

  const effectiveTotalScore = useMemo(() => {
    const typedTotal = Number(totalScore);
    if (totalScore.trim() && Number.isFinite(typedTotal) && typedTotal > 0) {
      return typedTotal;
    }
    if (assessmentType === "إلكتروني") {
      return questions.reduce(
        (sum, question) => sum + Number(question.points ?? 1),
        0
      );
    }
    return 0;
  }, [assessmentType, questions, totalScore]);

  const paperStudents = useMemo(() => {
    if (assessmentType !== "ورقي") {
      return [];
    }

    return allPaperStudents
      .filter((student) => {
        if (classroom === "جميع طلاب الصف الثاني") {
          return true;
        }

        return (
          normalizeClassroom(student.classroom) ===
          normalizeClassroom(classroom)
        );
      })
      .sort((a, b) =>
        a.studentName.localeCompare(b.studentName, "ar")
      );
  }, [allPaperStudents, assessmentType, classroom]);

  useEffect(() => {
    async function loadQuizForEditing() {
      if (!editQuizId) return;
      try {
        const quizSnapshot = await getDoc(doc(db, "quizzes", editQuizId));
        if (!quizSnapshot.exists()) {
          setMessage("لم يتم العثور على الاختبار.");
          return;
        }
        const quizData = quizSnapshot.data();
        setQuizId(quizSnapshot.id);
        setTitle(String(quizData.title ?? ""));
        setDescription(String(quizData.description ?? ""));
        setClassroom(String(quizData.classroom ?? "الصف الثاني أ"));
        setAudience(quizData.audience === "family" ? "family" : "student");
        setContentKind(
          quizData.contentKind === "diagnostic-form" ||
            quizData.contentKind === "case-study-form"
            ? quizData.contentKind
            : "quiz"
        );
        setAssessmentCategory(
          quizData.assessmentCategory === "تشخيصي" ||
            quizData.assessmentCategory === "بنائي"
            ? quizData.assessmentCategory
            : "فتري"
        );
        setAssessmentType(
          quizData.assessmentType === "إلكتروني" ? "إلكتروني" : "ورقي"
        );
        setTotalScore(
          typeof quizData.totalScore === "number"
            ? String(quizData.totalScore)
            : ""
        );
        setQuestions(
          Array.isArray(quizData.questions) && quizData.questions.length > 0
            ? (quizData.questions as Question[])
            : [createEmptyQuestion(1)]
        );
        setMessage("تم تحميل الاختبار للتعديل.");
      } catch (error) {
        console.error("تعذر تحميل الاختبار:", error);
        setMessage("تعذر تحميل بيانات الاختبار.");
      }
    }
    void loadQuizForEditing();
  }, [editQuizId]);

  useEffect(() => {
    let active = true;

    async function loadQuizResultsForTeacher() {
      try {
        setQuizResultsLoading(true);
        setQuizResultsError("");

        const cachedResults =
          getCachedValue<CachedTeacherQuizResult[]>(
            QUIZ_RESULTS_CACHE_KEY
          );

        if (cachedResults) {
          if (active) {
            setQuizResults(
              cachedResults.map(fromCachedQuizResult)
            );
          }
          return;
        }

        const snapshot = await getDocs(
          collection(db, "quizResults")
        );

        const rawResults = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          return {
            docSnap,
            data,
            resultQuizId:
              typeof data.quizId === "string"
                ? data.quizId
                : "",
          };
        });

        /*
          بدل قراءة وثيقة الاختبار مرة لكل نتيجة طالب،
          نجلب كل اختبار فريد مرة واحدة فقط.
        */
        const uniqueQuizIds = Array.from(
          new Set(
            rawResults
              .map((item) => item.resultQuizId)
              .filter(Boolean)
          )
        );

        const questionsByQuizId =
          new Map<string, Question[]>();

        await Promise.all(
          uniqueQuizIds.map(async (resultQuizId) => {
            try {
              const quizSnapshot = await getDoc(
                doc(db, "quizzes", resultQuizId)
              );

              if (!quizSnapshot.exists()) {
                questionsByQuizId.set(
                  resultQuizId,
                  []
                );
                return;
              }

              const quizData =
                quizSnapshot.data();

              questionsByQuizId.set(
                resultQuizId,
                Array.isArray(
                  quizData.questions
                )
                  ? (quizData.questions as Question[])
                  : []
              );
            } catch (error) {
              console.error(
                `تعذر تحميل أسئلة الاختبار ${resultQuizId}:`,
                error
              );

              questionsByQuizId.set(
                resultQuizId,
                []
              );
            }
          })
        );

        const loadedResults: TeacherQuizResult[] =
          rawResults.map(
            ({
              docSnap,
              data,
              resultQuizId,
            }) => ({
              id: docSnap.id,
              quizId: resultQuizId,
              quizTitle:
                typeof data.quizTitle ===
                "string"
                  ? data.quizTitle
                  : "اختبار لغتي",
              studentId:
                typeof data.studentId ===
                "string"
                  ? data.studentId
                  : "",
              studentName:
                typeof data.studentName ===
                "string"
                  ? data.studentName
                  : "",
              studentScore:
                typeof data.studentScore ===
                "number"
                  ? data.studentScore
                  : 0,
              totalScore:
                typeof data.totalScore ===
                "number"
                  ? data.totalScore
                  : 0,
              parentViewed:
                data.parentViewed === true,
              viewedFrom:
                typeof data.viewedFrom ===
                "string"
                  ? data.viewedFrom
                  : "",
              parentViewedAt:
                data.parentViewedAt ?? null,
              answers:
                data.answers &&
                typeof data.answers ===
                  "object"
                  ? (data.answers as Record<
                      string,
                      string | number
                    >)
                  : {},
              quizQuestions:
                questionsByQuizId.get(
                  resultQuizId
                ) ?? [],
              needsTeacherReview:
                data.needsTeacherReview ===
                true,
              reviewStatus:
                typeof data.reviewStatus ===
                "string"
                  ? data.reviewStatus
                  : "completed",
              autoScore:
                typeof data.autoScore ===
                "number"
                  ? data.autoScore
                  : 0,
              autoTotal:
                typeof data.autoTotal ===
                "number"
                  ? data.autoTotal
                  : 0,
              manualScores:
                data.manualScores &&
                typeof data.manualScores ===
                  "object"
                  ? (data.manualScores as Record<
                      string,
                      number
                    >)
                  : {},
              manualScoreTotal:
                typeof data.manualScoreTotal ===
                "number"
                  ? data.manualScoreTotal
                  : 0,
            })
          );

        if (!active) {
          return;
        }

        setQuizResults(loadedResults);

        setCachedValue(
          QUIZ_RESULTS_CACHE_KEY,
          loadedResults.map(
            toCachedQuizResult
          )
        );
      } catch (error) {
        console.error(
          "تعذر تحميل نتائج الطلاب للمعلم:",
          error
        );

        if (active) {
          setQuizResults([]);
          setQuizResultsError(
            "تعذر تحميل متابعة نتائج الطلاب حاليًا."
          );
        }
      } finally {
        if (active) {
          setQuizResultsLoading(false);
        }
      }
    }

    void loadQuizResultsForTeacher();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPaperStudents() {
      if (assessmentType !== "ورقي") {
        return;
      }

      if (allPaperStudents.length > 0) {
        return;
      }

      try {
        const cachedStudents =
          getCachedValue<PaperStudent[]>(
            PAPER_STUDENTS_CACHE_KEY
          );

        if (cachedStudents) {
          if (active) {
            setAllPaperStudents(
              cachedStudents
            );
          }
          return;
        }

        /*
          نقرأ الطلاب مرة واحدة فقط،
          ثم يتم فلترة الفصل محليًا بواسطة useMemo.
        */
        const snapshot = await getDocs(
          collection(db, "students")
        );

        const loadedStudents: PaperStudent[] =
          snapshot.docs
            .map((studentDoc) => {
              const data =
                studentDoc.data();

              return {
                id: studentDoc.id,
                studentId: String(
                  data.studentId ??
                    studentDoc.id
                ),
                studentName: String(
                  data.studentName ??
                    data.name ??
                    "طالب دون اسم"
                ),
                classroom: String(
                  data.classroom ??
                    "غير محدد"
                ),
                active:
                  data.active !== false &&
                  data.archived !== true,
              };
            })
            .filter(
              (student) =>
                student.active
            )
            .map(
              ({
                active: _active,
                ...student
              }) => student
            );

        if (!active) {
          return;
        }

        setAllPaperStudents(
          loadedStudents
        );

        setCachedValue(
          PAPER_STUDENTS_CACHE_KEY,
          loadedStudents
        );
      } catch (error) {
        console.error(
          "تعذر تحميل طلاب الاختبار الورقي:",
          error
        );

        if (active) {
          setAllPaperStudents([]);
        }
      }
    }

    void loadPaperStudents();

    return () => {
      active = false;
    };
  }, [
    assessmentType,
    allPaperStudents.length,
  ]);

  function updateQuestionText(questionId: number, value: string) {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question) =>
        question.id === questionId ? { ...question, text: value } : question
      )
    );
  }

  function updateOption(questionId: number, optionIndex: number, value: string) {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question) => {
        if (question.id !== questionId) return question;
        const newOptions = [...question.options];
        newOptions[optionIndex] = value;
        return { ...question, options: newOptions };
      })
    );
  }

  function updateCorrectAnswer(questionId: number, optionIndex: number) {
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

  function removeQuestion(questionId: number) {
    if (questions.length === 1) {
      setMessage("يجب أن يحتوي الاختبار على سؤال واحد على الأقل.");
      return;
    }
    setQuestions((currentQuestions) =>
      currentQuestions.filter((question) => question.id !== questionId)
    );
  }

  function createNewQuiz() {
    setQuizId(null);
    setTitle("");
    setDescription("");
    setClassroom("الصف الثاني أ");
    setAudience("student");
    setContentKind("quiz");
    setAssessmentCategory("فتري");
    setAssessmentType("ورقي");
    setTotalScore("");
    setTeacherResultNote("");
    setQuestions([createEmptyQuestion(1)]);
    setPaperScores({});
    setPaperFiles({});
    setMessage("");
  }

  function validateQuiz() {
    if (!title.trim()) return "اكتب عنوان الاختبار.";
    if (assessmentType === "ورقي") {
      if (!totalScore.trim() || effectiveTotalScore <= 0) {
        return "أدخل الدرجة الكلية للاختبار الورقي.";
      }
      return "";
    }
    if (questions.length === 0) return "أضف سؤالًا واحدًا على الأقل.";
    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      const questionType = question.questionType ?? "multiple-choice";
      if (!question.text.trim()) return `اكتب نص السؤال رقم ${index + 1}.`;
      if (
        questionType !== "essay" &&
        questionType !== "short-text" &&
        question.options.some((option) => !option.trim())
      ) {
        return `أكمل جميع خيارات السؤال رقم ${index + 1}.`;
      }
    }
    return "";
  }

  function buildQuizData(published: boolean) {
    const electronicQuestions =
      assessmentType === "إلكتروني"
        ? questions.map((question, index) => ({
            order: index + 1,
            id: question.id,
            text: question.text.trim(),
            questionType: question.questionType ?? "multiple-choice",
            options: question.options.map((option) => option.trim()),
            correctAnswer: question.correctAnswer,
            points: question.points ?? 1,
          }))
        : [];
    return {
      audience,
      contentKind,
      title: title.trim(),
      description: description.trim(),
      classroom,
      published,
      status: published ? "published" : "draft",
      assessmentCategory,
      assessmentType,
      totalScore:
        assessmentType === "ورقي"
          ? effectiveTotalScore
          : questions.reduce(
              (sum, question) => sum + Number(question.points ?? 1),
              0
            ),
      questions: electronicQuestions,
      totalQuestions: electronicQuestions.length,
      totalPoints: electronicQuestions.reduce(
        (sum, question) => sum + Number(question.points ?? 1),
        0
      ),
      updatedAt: serverTimestamp(),
    };
  }

  async function persistQuiz(published: boolean) {
    const validationMessage = validateQuiz();
    if (validationMessage) {
      setMessage(validationMessage);
      return null;
    }
    const quizData = buildQuizData(published);
    if (quizId) {
      await updateDoc(doc(db, "quizzes", quizId), quizData);
      clearQuizResultsCache();
      return quizId;
    }
    const quizReference = await addDoc(collection(db, "quizzes"), {
      ...quizData,
      createdAt: serverTimestamp(),
    });
    setQuizId(quizReference.id);
    clearQuizResultsCache();
    return quizReference.id;
  }

  async function saveQuiz(published: boolean) {
    try {
      setSaving(true);
      setMessage("");
      const savedQuizId = await persistQuiz(published);
      if (!savedQuizId) return;
      setMessage(
        published ? "تم نشر الاختبار بنجاح ✅" : "تم حفظ الاختبار كمسودة ✅"
      );
    } catch (error) {
      console.error("تعذر حفظ الاختبار:", error);
      setMessage("تعذر حفظ الاختبار. تحقق من الاتصال بقاعدة البيانات.");
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
      { method: "POST", body: formData }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`فشل رفع صورة ورقة الاختبار: ${errorText}`);
    }
    const data = await response.json();
    return String(data.secure_url ?? "");
  }

  async function savePaperResults() {
    if (assessmentType !== "ورقي") return;
    const numericTotalScore = effectiveTotalScore;
    if (numericTotalScore <= 0) {
      setMessage("أدخل الدرجة الكلية أولًا.");
      return;
    }
    const studentsWithScores = paperStudents.filter(
      (student) => (paperScores[student.studentId] ?? "").trim() !== ""
    );
    if (studentsWithScores.length === 0) {
      setMessage("أدخل درجة طالب واحد على الأقل.");
      return;
    }
    const invalidStudent = studentsWithScores.find((student) => {
      const score = Number(paperScores[student.studentId]);
      return !Number.isFinite(score) || score < 0 || score > numericTotalScore;
    });
    if (invalidStudent) {
      setMessage(
        `تحقق من درجة الطالب: ${invalidStudent.studentName}. يجب أن تكون من 0 إلى ${numericTotalScore}.`
      );
      return;
    }
    try {
      setSaving(true);
      setMessage("");
      const savedQuizId = await persistQuiz(true);
      if (!savedQuizId) return;
      for (const student of studentsWithScores) {
        const studentScoreValue = Number(paperScores[student.studentId]);
        const paperFile = paperFiles[student.studentId] ?? null;
        let testPaperImageUrl = "";
        if (paperFile) {
          testPaperImageUrl = await uploadTestPaperImage(paperFile);
        }
        const resultId = `${savedQuizId}_${student.studentId}`;
        await setDoc(
          doc(db, "quizResults", resultId),
          {
            quizId: savedQuizId,
            quizTitle: title.trim(),
            studentId: student.studentId,
            studentName: student.studentName,
            classroom: student.classroom,
            assessmentCategory,
            assessmentType: "ورقي",
            studentScore: studentScoreValue,
            totalScore: numericTotalScore,
            teacherNote: teacherResultNote.trim(),
            testPaperImageUrl,
            parentViewed: false,
            parentViewedAt: null,
            reviewStatus: "completed",
            needsTeacherReview: false,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      clearQuizResultsCache();

      setMessage(
        `✅ تم حفظ وإرسال نتائج ${studentsWithScores.length} طالبًا للأسر`
      );
    } catch (error) {
      console.error("تعذر حفظ نتائج الاختبار الورقي:", error);
      setMessage("تعذر حفظ نتائج الاختبار الورقي. حاول مرة أخرى.");
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
      clearQuizResultsCache();

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
      alert(
        `✅ تم اعتماد التصحيح النهائي. الدرجة: ${finalScore} من ${result.totalScore}`
      );
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
              أنشئ اختبارًا إلكترونيًا، أو ارصد اختبارًا ورقيًا للفصل كاملًا
              بسرعة، ثم أرسل النتائج مباشرة إلى الأسر.
            </p>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>بيانات الاختبار</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "14px",
              marginBottom: "16px",
            }}
          >
            <label style={styles.field}>
              <span style={styles.fieldLabel}>نوع المحتوى</span>
              <select
                value={audience}
                onChange={(event) => {
                  const value = event.target.value as "student" | "family";
                  setAudience(value);
                  setContentKind(value === "student" ? "quiz" : "diagnostic-form");
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

            <label style={styles.field}>
              <span style={styles.fieldLabel}>الفصل المستهدف</span>
              <select
                value={classroom}
                onChange={(event) => setClassroom(event.target.value)}
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

          <label style={styles.field}>
            <span style={styles.fieldLabel}>عنوان الاختبار</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثال: اختبار آداب التعامل"
              style={styles.input}
            />
          </label>

          <label style={{ ...styles.field, marginTop: "14px" }}>
            <span style={styles.fieldLabel}>وصف مختصر</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="اكتب تعليمات أو وصفًا مختصرًا للاختبار"
              style={styles.textarea}
            />
          </label>
        </div>

        {assessmentType === "ورقي" && (
          <div style={{ ...styles.card, marginTop: "18px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: "16px",
              }}
            >
              <div>
                <h2 style={styles.sectionTitle}>📝 رصد درجات الاختبار الورقي</h2>
                <p style={styles.helperText}>
                  أدخل الدرجة الكلية، ثم اكتب درجات الطلاب. يمكنك إرفاق صورة
                  ورقة مختلفة لكل طالب.
                </p>
              </div>
              <div style={{ minWidth: "180px" }}>
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
            </div>

            <div
              style={{
                width: "100%",
                overflowX: "auto",
                border: "1px solid #e4ece8",
                borderRadius: "16px",
                background: "#fff",
              }}
            >
              <div style={{ minWidth: "760px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: paperTableColumns,
                    gap: "12px",
                    alignItems: "center",
                    padding: "12px 14px",
                    background: "#f5faf8",
                    fontWeight: 800,
                    borderBottom: "1px solid #e4ece8",
                  }}
                >
                  <div>اسم الطالب</div>
                  <div style={{ textAlign: "center" }}>الفصل</div>
                  <div style={{ textAlign: "center" }}>الدرجة</div>
                  <div style={{ textAlign: "center" }}>صورة الورقة</div>
                </div>

                {paperStudents.length === 0 ? (
                  <div
                    style={{
                      padding: "22px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    لا يوجد طلاب في الفصل المحدد.
                  </div>
                ) : (
                  paperStudents.map((student) => {
                    const selectedFile = paperFiles[student.studentId] ?? null;
                    return (
                      <div
                        key={student.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: paperTableColumns,
                          gap: "12px",
                          alignItems: "center",
                          padding: "10px 14px",
                          borderBottom: "1px solid #eef3f0",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800 }}>{student.studentName}</div>
                          <div
                            style={{
                              marginTop: "3px",
                              fontSize: "12px",
                              color: "#7a8b84",
                            }}
                          >
                            {student.studentId}
                          </div>
                        </div>

                        <div
                          style={{
                            textAlign: "center",
                            color: "#5d7068",
                            fontWeight: 700,
                          }}
                        >
                          {student.classroom}
                        </div>

                        <input
                          type="number"
                          min="0"
                          max={effectiveTotalScore > 0 ? effectiveTotalScore : undefined}
                          value={paperScores[student.studentId] ?? ""}
                          onChange={(event) =>
                            setPaperScores((current) => ({
                              ...current,
                              [student.studentId]: event.target.value,
                            }))
                          }
                          placeholder="الدرجة"
                          style={{
                            width: "100%",
                            height: "42px",
                            borderRadius: "10px",
                            border: "1px solid #cbded6",
                            textAlign: "center",
                            fontSize: "16px",
                            boxSizing: "border-box",
                          }}
                        />

                        <label
                          style={{
                            height: "42px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            padding: "0 10px",
                            borderRadius: "10px",
                            border: selectedFile
                              ? "1px solid #1d8f68"
                              : "1px solid #cbded6",
                            background: selectedFile ? "#edf9f4" : "#f8fbfa",
                            color: selectedFile ? "#147a5b" : "#36584c",
                            fontWeight: 800,
                            cursor: "pointer",
                            boxSizing: "border-box",
                          }}
                        >
                          {selectedFile ? "✅ تم اختيار الصورة" : "📎 إرفاق صورة"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              setPaperFiles((current) => ({
                                ...current,
                                [student.studentId]: file,
                              }));
                            }}
                            style={{ display: "none" }}
                          />
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <label style={{ ...styles.field, marginTop: "16px" }}>
              <span style={styles.fieldLabel}>💬 ملاحظة المعلم — اختيارية</span>
              <textarea
                value={teacherResultNote}
                onChange={(event) => setTeacherResultNote(event.target.value)}
                placeholder="مثال: أداء مميز، استمر يا بطل 🌟"
                style={styles.textarea}
              />
            </label>

            <button
              type="button"
              disabled={saving}
              onClick={savePaperResults}
              style={{
                width: "100%",
                marginTop: "16px",
                padding: "15px",
                border: "none",
                borderRadius: "14px",
                background: "#147a5b",
                color: "#fff",
                fontSize: "17px",
                fontWeight: 800,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.65 : 1,
              }}
            >
              {saving
                ? "جارٍ حفظ النتائج..."
                : "💾 حفظ وإرسال نتائج الفصل للأسر"}
            </button>
          </div>
        )}

        {assessmentType === "إلكتروني" && (
          <div style={{ ...styles.card, marginTop: "18px" }}>
            <div style={styles.questionsHeader}>
              <div>
                <h2 style={styles.sectionTitle}>أسئلة الاختبار</h2>
                <p style={styles.helperText}>عدد الأسئلة الحالي: {questions.length}</p>
              </div>
              <button type="button" onClick={addQuestion} style={styles.addButton}>
                + إضافة سؤال
              </button>
            </div>

            {questions.map((question, questionIndex) => {
              const questionType = question.questionType ?? "multiple-choice";
              return (
                <div key={question.id} style={styles.questionCard}>
                  <div style={styles.questionTop}>
                    <h3 style={styles.questionTitle}>السؤال {questionIndex + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      style={styles.deleteButton}
                    >
                      حذف السؤال
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    <label style={styles.field}>
                      <span style={styles.fieldLabel}>نوع السؤال</span>
                      <select
                        value={questionType}
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
                                    points: Number.isFinite(pointsValue)
                                      ? pointsValue
                                      : 1,
                                  }
                                : item
                            )
                          );
                        }}
                        style={styles.input}
                      />
                    </label>
                  </div>

                  <label style={{ ...styles.field, marginTop: "12px" }}>
                    <span style={styles.fieldLabel}>نص السؤال</span>
                    <input
                      value={question.text}
                      onChange={(event) =>
                        updateQuestionText(question.id, event.target.value)
                      }
                      placeholder="اكتب السؤال هنا"
                      style={styles.input}
                    />
                  </label>

                  {questionType !== "essay" && questionType !== "short-text" && (
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
                              checked={question.correctAnswer === optionIndex}
                              onChange={() =>
                                updateCorrectAnswer(question.id, optionIndex)
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
              );
            })}
          </div>
        )}

        <div style={{ ...styles.card, marginTop: "18px" }}>
          <h2 style={styles.sectionTitle}>👨‍👩‍👦 متابعة اطلاع الأسرة على النتائج</h2>
          {quizResultsLoading ? (
            <p style={styles.helperText}>جارٍ تحميل نتائج الطلاب...</p>
          ) : quizResultsError ? (
            <p style={{ ...styles.helperText, color: "#b42318" }}>
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
            <div style={{ display: "grid", gap: "14px" }}>
              {quizResults.map((result) => {
                const viewedDate = result.parentViewedAt?.toDate?.() ?? null;
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
                      <strong>{result.studentName || result.studentId}</strong>
                      <span dir="ltr">
                        {result.studentScore} / {result.totalScore}
                      </span>
                    </div>
                    <div style={{ marginTop: "8px", fontWeight: 700 }}>
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
                                    const enteredScore = Number(
                                      event.target.value
                                    );
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
                        background: result.parentViewed ? "#eaf8f2" : "#fff8e8",
                        color: result.parentViewed ? "#147a5b" : "#8a6a16",
                      }}
                    >
                      {result.parentViewed ? (
                        <>
                          <div>✅ تمت متابعة الأسرة</div>
                          {viewedDate && (
                            <div style={{ marginTop: "6px" }}>
                              🕒 {viewedDate.toLocaleString("ar-SA")}
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
                        <div>⏳ لم تطّلع الأسرة على النتيجة بعد</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {message && <div style={styles.message}>{message}</div>}

        <div style={styles.actions}>
          <button type="button" onClick={createNewQuiz} style={styles.secondaryButton}>
            ➕ اختبار جديد
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => saveQuiz(false)}
            style={{ ...styles.draftButton, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "جارٍ الحفظ..." : "حفظ كمسودة"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => saveQuiz(true)}
            style={{ ...styles.publishButton, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "جارٍ النشر..." : "نشر الاختبار"}
          </button>
        </div>
      </section>
    </main>
  );
}