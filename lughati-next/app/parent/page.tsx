"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../../firebase";

import DailyPulseCard from "./components/DailyPulseCard";
import FamilyRecommendationCard from "./components/FamilyRecommendationCard";
import FamilyImpactCard from "./components/FamilyImpactCard";

type ParentQuizResult = {
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
type ParentSmartFollowUp = {
  date: string;

  homeworkLevel: string;
  homeworkLabel: string;

  readingLevel: string;
  readingLevelLabel: string;

  readingAccuracy: string;
  readingAccuracyLabel: string;

  readingFluency: string;
  readingFluencyLabel: string;

  readingDiacritics: string;
  readingDiacriticsLabel: string;

  readingNote: string;

  participated: boolean;
  note: string;
};
const defaultStudent = {
  name: "الطالب",
  className: "الصف الثاني الابتدائي",
};

const parentDailyTasks = [
  {
    id: 1,
    title: "قراءة درس اليوم",
    icon: "📖",
  },
  {
    id: 2,
    title: "حل الواجب اليومي",
    icon: "✏️",
  },
  {
    id: 3,
    title: "التدرب على القراءة",
    icon: "🎙️",
  },
  {
    id: 4,
    title: "مراجعة كلمات الإملاء",
    icon: "🔤",
  },
];

export default function ParentPage() {
  const router = useRouter();
const [smartFollowUp, setSmartFollowUp] =
  useState<ParentSmartFollowUp | null>(null);
  const [student, setStudent] = useState(defaultStudent);
const [
  personalPhotoPreview,
  setPersonalPhotoPreview,
] = useState("");

const [
  personalPhotoStatus,
  setPersonalPhotoStatus,
] = useState<
  "none" | "pending" | "approved" | "rejected"
>("none");

const [
  personalPhotoFile,
  setPersonalPhotoFile,
] = useState<File | null>(null);
const [
  personalPhotoUploading,
  setPersonalPhotoUploading,
] = useState(false);

const [
  personalPhotoSavedUrl,
  setPersonalPhotoSavedUrl,
] = useState("");
  const [points, setPoints] = useState(0);
  const [stars, setStars] = useState(0);
  const [absenceDays, setAbsenceDays] = useState(0);

  const [readingDays, setReadingDays] = useState(0);

  const [
    tomorrowSpellingWords,
    setTomorrowSpellingWords,
  ] = useState<string[]>([]);

  const [
    tomorrowSpellingDay,
    setTomorrowSpellingDay,
  ] = useState("");

  const [
    completedTaskIds,
    setCompletedTaskIds,
  ] = useState<number[]>([]);

  const [teacherMessage, setTeacherMessage] =
    useState("");

  const [
    teacherMessageUpdatedAt,
    setTeacherMessageUpdatedAt,
  ] = useState<Date | null>(null);

  const [quizResults, setQuizResults] =
    useState<ParentQuizResult[]>([]);

  const [
    quizResultsLoading,
    setQuizResultsLoading,
  ] = useState(true);

  const [
    quizResultsError,
    setQuizResultsError,
  ] = useState("");

  /* =========================
     بيانات الطالب الأساسية
  ========================== */

  useEffect(() => {
    async function loadStudentRewards() {
      const studentId =
        localStorage.getItem("student-id");

      if (
        !studentId ||
        studentId === "student-demo"
      ) {
        setPoints(0);
        setStars(0);
        setAbsenceDays(0);
        setTeacherMessage("");
        setTeacherMessageUpdatedAt(null);
        return;
      }

      try {
        const studentSnapshot = await getDoc(
          doc(db, "students", studentId)
        );

        if (!studentSnapshot.exists()) {
          setPoints(0);
          setStars(0);
          setAbsenceDays(0);
          setTeacherMessage("");
          setTeacherMessageUpdatedAt(null);
          return;
        }

        const studentData =
          studentSnapshot.data();

        const savedPersonalPhotoStatus =
          studentData.personalPhotoStatus;

        if (
          savedPersonalPhotoStatus === "pending" ||
          savedPersonalPhotoStatus === "approved" ||
          savedPersonalPhotoStatus === "rejected"
        ) {
          setPersonalPhotoStatus(
            savedPersonalPhotoStatus
          );
        } else {
          setPersonalPhotoStatus("none");
        }

        const savedPersonalPhotoUrl =
          savedPersonalPhotoStatus === "approved" &&
          typeof studentData.personalPhotoUrl === "string"
            ? studentData.personalPhotoUrl
            : typeof studentData.personalPhotoPendingUrl === "string"
              ? studentData.personalPhotoPendingUrl
              : "";

        setPersonalPhotoSavedUrl(
          savedPersonalPhotoUrl
        );

        if (savedPersonalPhotoUrl) {
          setPersonalPhotoPreview(
            savedPersonalPhotoUrl
          );
        }
const savedSmartFollowUp =
  studentData.smartFollowUp;

if (
  savedSmartFollowUp &&
  typeof savedSmartFollowUp === "object"
) {
  setSmartFollowUp({
    date:
      typeof savedSmartFollowUp.date ===
      "string"
        ? savedSmartFollowUp.date
        : "",

    homeworkLevel:
      typeof savedSmartFollowUp.homeworkLevel ===
      "string"
        ? savedSmartFollowUp.homeworkLevel
        : "",

    homeworkLabel:
      typeof savedSmartFollowUp.homeworkLabel ===
      "string"
        ? savedSmartFollowUp.homeworkLabel
        : "",

    readingLevel:
      typeof savedSmartFollowUp.readingLevel ===
      "string"
        ? savedSmartFollowUp.readingLevel
        : "",

    readingLevelLabel:
      typeof savedSmartFollowUp.readingLevelLabel ===
      "string"
        ? savedSmartFollowUp.readingLevelLabel
        : "",

    readingAccuracy:
      typeof savedSmartFollowUp.readingAccuracy ===
      "string"
        ? savedSmartFollowUp.readingAccuracy
        : "",

    readingAccuracyLabel:
      typeof savedSmartFollowUp.readingAccuracyLabel ===
      "string"
        ? savedSmartFollowUp.readingAccuracyLabel
        : "",

    readingFluency:
      typeof savedSmartFollowUp.readingFluency ===
      "string"
        ? savedSmartFollowUp.readingFluency
        : "",

    readingFluencyLabel:
      typeof savedSmartFollowUp.readingFluencyLabel ===
      "string"
        ? savedSmartFollowUp.readingFluencyLabel
        : "",

    readingDiacritics:
      typeof savedSmartFollowUp.readingDiacritics ===
      "string"
        ? savedSmartFollowUp.readingDiacritics
        : "",

    readingDiacriticsLabel:
      typeof savedSmartFollowUp.readingDiacriticsLabel ===
      "string"
        ? savedSmartFollowUp.readingDiacriticsLabel
        : "",

    readingNote:
      typeof savedSmartFollowUp.readingNote ===
      "string"
        ? savedSmartFollowUp.readingNote
        : "",

    participated:
      savedSmartFollowUp.participated ===
      true,

    note:
      typeof savedSmartFollowUp.note ===
      "string"
        ? savedSmartFollowUp.note
        : "",
  });
} else {
  setSmartFollowUp(null);
}
        setTeacherMessage(
          typeof studentData.teacherMessage ===
            "string"
            ? studentData.teacherMessage
            : ""
        );

        const messageDate =
          studentData.teacherMessageUpdatedAt;

        setTeacherMessageUpdatedAt(
          messageDate?.toDate
            ? messageDate.toDate()
            : messageDate instanceof Date
              ? messageDate
              : null
        );

        const attendanceHistory =
          Array.isArray(
            studentData.attendanceHistory
          )
            ? studentData.attendanceHistory
            : [];

        const totalAbsenceDays =
          attendanceHistory.filter(
            (attendance) =>
              attendance.status === "غائب"
          ).length;

        setAbsenceDays(totalAbsenceDays);

        setPoints(
          typeof studentData.points === "number"
            ? studentData.points
            : 0
        );

        setStars(
          typeof studentData.stars === "number"
            ? studentData.stars
            : 0
        );
      } catch (error) {
        console.error(
          "تعذر تحميل بيانات الطالب:",
          error
        );
      }
    }

    function loadStudentIdentity() {
      const savedStudent =
        localStorage.getItem("lughatiStudent");

      if (!savedStudent) {
        setStudent(defaultStudent);
        return;
      }

      try {
        const loggedInStudent =
          JSON.parse(savedStudent);

        setStudent({
          name:
            typeof loggedInStudent.studentName ===
            "string"
              ? loggedInStudent.studentName
              : typeof loggedInStudent.name ===
                  "string"
                ? loggedInStudent.name
                : defaultStudent.name,

          className:
            typeof loggedInStudent.classroom ===
            "string"
              ? loggedInStudent.classroom
              : typeof loggedInStudent.className ===
                  "string"
                ? loggedInStudent.className
                : defaultStudent.className,
        });
      } catch (error) {
        console.error(
          "تعذر قراءة بيانات الطالب:",
          error
        );

        setStudent(defaultStudent);
      }
    }

    async function loadReadingDays() {
      try {
        const studentId =
          localStorage.getItem("student-id");

        if (
          !studentId ||
          studentId === "student-demo"
        ) {
          setReadingDays(0);
          return;
        }

        const readingQuery = query(
          collection(
            db,
            "dailyReadingRecords"
          ),
          where(
            "studentId",
            "==",
            studentId
          ),
          where("approved", "==", true)
        );

        const readingSnapshot =
          await getDocs(readingQuery);

        setReadingDays(
          readingSnapshot.size
        );
      } catch (error) {
        console.error(
          "تعذر تحميل أيام القراءة لولي الأمر:",
          error
        );

        setReadingDays(0);
      }
    }

    async function loadTomorrowSpellingWords() {
      try {
        const weeklyPlanSnapshot =
          await getDoc(
            doc(
              db,
              "weeklyPlans",
              "current"
            )
          );

        if (!weeklyPlanSnapshot.exists()) {
          setTomorrowSpellingWords([]);
          setTomorrowSpellingDay("");
          return;
        }

        const data =
          weeklyPlanSnapshot.data();

        const days = Array.isArray(data.days)
          ? data.days
          : [];

        const saudiNow = new Date(
          new Date().toLocaleString(
            "en-US",
            {
              timeZone: "Asia/Riyadh",
            }
          )
        );

        const dayNumber =
          saudiNow.getDay();

        const nextSchoolDayMap: Record<
          number,
          string
        > = {
          0: "الاثنين",
          1: "الثلاثاء",
          2: "الأربعاء",
          3: "الخميس",
          4: "الأحد",
          5: "الأحد",
          6: "الأحد",
        };

        const nextDayName =
          nextSchoolDayMap[dayNumber] || "";

        setTomorrowSpellingDay(
          nextDayName
        );

        const nextDayPlan = days.find(
          (day) =>
            day?.day === nextDayName
        );

        const rawWords =
          typeof nextDayPlan?.spellingWords ===
          "string"
            ? nextDayPlan.spellingWords
            : "";

        const words = rawWords
          .split(/[\s،,]+/)
          .map(
            (word: string) =>
              word.trim()
          )
          .filter(Boolean);

        setTomorrowSpellingWords(words);
      } catch (error) {
        console.error(
          "تعذر تحميل كلمات الإملاء:",
          error
        );

        setTomorrowSpellingWords([]);
        setTomorrowSpellingDay("");
      }
    }

    loadStudentIdentity();

    void loadStudentRewards();
    void loadReadingDays();
    void loadTomorrowSpellingWords();
  }, []);

  /* =========================
     نتائج الاختبارات
  ========================== */

  useEffect(() => {
    async function loadParentQuizResults() {
      try {
        setQuizResultsLoading(true);
        setQuizResultsError("");

        const studentId =
          localStorage.getItem("student-id");

        if (!studentId) {
          setQuizResults([]);
          setQuizResultsError(
            "تعذر معرفة حساب الطالب الحالي."
          );
          return;
        }

        const resultsQuery = query(
          collection(db, "quizResults"),
          where(
            "studentId",
            "==",
            studentId
          )
        );

        const snapshot =
          await getDocs(resultsQuery);

        const loadedResults: ParentQuizResult[] =
          snapshot.docs.map(
            (docSnap) => {
              const data =
                docSnap.data();

              return {
                id: docSnap.id,

                quizId:
                  typeof data.quizId ===
                  "string"
                    ? data.quizId
                    : "",

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

                assessmentCategory:
                  data.assessmentCategory ===
                    "تشخيصي" ||
                  data.assessmentCategory ===
                    "بنائي"
                    ? data.assessmentCategory
                    : "فتري",

                assessmentType:
                  data.assessmentType ===
                  "إلكتروني"
                    ? "إلكتروني"
                    : "ورقي",

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

                teacherNote:
                  typeof data.teacherNote ===
                  "string"
                    ? data.teacherNote
                    : "",

                testPaperImageUrl:
                  typeof data.testPaperImageUrl ===
                  "string"
                    ? data.testPaperImageUrl
                    : "",

                parentViewed:
                  data.parentViewed ===
                  true,
              };
            }
          );

        setQuizResults(
          loadedResults.filter(
            (result) =>
              result.totalScore > 0
          )
        );
      } catch (error) {
        console.error(
          "تعذر تحميل نتائج الاختبارات لولي الأمر:",
          error
        );

        setQuizResults([]);

        setQuizResultsError(
          "تعذر تحميل نتائج الاختبارات حاليًا."
        );
      } finally {
        setQuizResultsLoading(false);
      }
    }

    void loadParentQuizResults();
  }, []);

  /* =========================
     إنجاز الطالب الحقيقي
  ========================== */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          if (!currentUser) {
            setCompletedTaskIds([]);
            return;
          }

          const loggedInUser =
            currentUser;

          async function loadRealDailyProgress() {
            try {
              const token =
                await loggedInUser.getIdToken();

              const response =
                await fetch(
                  "/api/student-journey",
                  {
                    method: "GET",
                    headers: {
                      Authorization:
                        `Bearer ${token}`,
                    },
                    cache: "no-store",
                  }
                );

              const data =
                await response.json();

              if (
                !response.ok ||
                !data.success
              ) {
                throw new Error(
                  data.message ||
                    "تعذر تحميل إنجاز اليوم."
                );
              }

              setCompletedTaskIds(
                Array.isArray(
                  data.completedTaskIds
                )
                  ? data.completedTaskIds
                  : []
              );

              if (
                typeof data.points ===
                "number"
              ) {
                setPoints(data.points);
              }

              if (
                typeof data.stars ===
                "number"
              ) {
                setStars(data.stars);
              }

              if (
                typeof data.readingDays ===
                "number"
              ) {
                setReadingDays(
                  data.readingDays
                );
              }
            } catch (error) {
              console.error(
                "تعذر تحميل إنجاز الطالب لولي الأمر:",
                error
              );

              setCompletedTaskIds([]);
            }
          }

          void loadRealDailyProgress();
        }
      );

    return unsubscribe;
  }, []);

  /* =========================
     الحسابات
  ========================== */

  const liveDailyTasks =
    parentDailyTasks.map(
      (task) => ({
        ...task,
        completed:
          completedTaskIds.includes(
            task.id
          ),
      })
    );

  const completedCount =
    liveDailyTasks.filter(
      (task) => task.completed
    ).length;

  const totalDailyTasks =
    liveDailyTasks.length;

  const progressPercentage =
    totalDailyTasks > 0
      ? Math.round(
          (completedCount /
            totalDailyTasks) *
            100
        )
      : 0;

  const readingProgress =
    readingDays % 5;

  const displayedReadingProgress =
    readingDays > 0 &&
    readingProgress === 0
      ? 5
      : readingProgress;

  const remainingReadingDays =
    displayedReadingProgress === 5
      ? 0
      : 5 -
        displayedReadingProgress;

  /* =========================
     اطلاع ولي الأمر
  ========================== */

  async function markParentQuizAsViewed(
    resultId: string
  ) {
    const confirmed =
      window.confirm(
        "هل تؤكد أنك اطلعت على نتيجة الاختبار؟"
      );

    if (!confirmed) return;

    try {
      await updateDoc(
        doc(
          db,
          "quizResults",
          resultId
        ),
        {
          parentViewed: true,
          parentViewedAt:
            serverTimestamp(),
          viewedFrom:
            "parent-account",
        }
      );

      setQuizResults(
        (currentResults) =>
          currentResults.map(
            (result) =>
              result.id === resultId
                ? {
                    ...result,
                    parentViewed: true,
                  }
                : result
          )
      );
    } catch (error) {
      console.error(
        "تعذر تسجيل اطلاع ولي الأمر:",
        error
      );

      window.alert(
        "تعذر تسجيل الاطلاع، حاول مرة أخرى."
      );
    }
  }

  function handlePersonalPhotoSelect(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      window.alert(
        "يرجى اختيار صورة فقط."
      );
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      window.alert(
        "حجم الصورة كبير. اختر صورة أقل من 5 ميجابايت."
      );
      return;
    }

    if (
      personalPhotoPreview.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        personalPhotoPreview
      );
    }

    setPersonalPhotoFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setPersonalPhotoPreview(
      previewUrl
    );

    setPersonalPhotoSavedUrl("");
    setPersonalPhotoStatus("none");
  }

  async function uploadPersonalPhotoToCloudinary(
    file: File
  ) {
    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "upload_preset",
      "lughati_homework_upload"
    );

    const response =
      await fetch(
        "https://api.cloudinary.com/v1_1/ffv5igmg/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        `فشل رفع الصورة: ${errorText}`
      );
    }

    const data =
      await response.json();

    if (
      typeof data.secure_url !==
      "string"
    ) {
      throw new Error(
        "لم يرجع Cloudinary رابطًا صالحًا للصورة."
      );
    }

    return data.secure_url as string;
  }

  async function sendPersonalPhotoForApproval() {
    if (!personalPhotoFile) {
      window.alert(
        "اختر صورة أولًا."
      );
      return;
    }

    const studentId =
      localStorage.getItem(
        "student-id"
      );

    if (
      !studentId ||
      studentId ===
        "student-demo"
    ) {
      window.alert(
        "تعذر معرفة حساب الطالب الحالي."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "هل تريد إرسال هذه الصورة للمعلم لاعتمادها؟"
      );

    if (!confirmed) {
      return;
    }

    try {
      setPersonalPhotoUploading(
        true
      );

      const secureUrl =
        await uploadPersonalPhotoToCloudinary(
          personalPhotoFile
        );

      await updateDoc(
        doc(
          db,
          "students",
          studentId
        ),
        {
          personalPhotoPendingUrl:
            secureUrl,

          personalPhotoStatus:
            "pending",

          personalPhotoRequestedAt:
            serverTimestamp(),

          personalPhotoRequestedBy:
            "parent",

          personalPhotoApprovedAt:
            null,

          personalPhotoRejectedAt:
            null,
        }
      );

      setPersonalPhotoSavedUrl(
        secureUrl
      );

      setPersonalPhotoPreview(
        secureUrl
      );

      setPersonalPhotoStatus(
        "pending"
      );

      setPersonalPhotoFile(
        null
      );

      window.alert(
        "✅ تم إرسال الصورة للمعلم بنجاح، وهي الآن بانتظار الاعتماد."
      );
    } catch (error) {
      console.error(
        "تعذر إرسال صورة الطالب:",
        error
      );

      window.alert(
        "تعذر إرسال الصورة حاليًا. تحقق من الاتصال ثم حاول مرة أخرى."
      );
    } finally {
      setPersonalPhotoUploading(
        false
      );
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f4f8fc",
        padding: "20px 14px 100px",
        fontFamily:
          "Arial, sans-serif",
        color: "#173b57",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "780px",
          margin: "0 auto",
        }}
      >
        {/* الترويسة */}

        <header
          style={{
            background:
              "linear-gradient(135deg, #ffffff 0%, #eef9f2 100%)",
            borderRadius: "26px",
            padding: "22px",
            marginBottom: "18px",
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.07)",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            أكاديمية لغتي الرقمية
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "28px",
            }}
          >
            ❤️ رحلة ابني
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "#475569",
              lineHeight: 1.8,
            }}
          >
            متابعة مختصرة وواضحة
            لتقدم ابنكم دون أعباء
            إضافية.
          </p>
        </header>

        {/* نتائج الاختبارات */}

        <section style={cardStyle}>
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "22px",
            }}
          >
            📝 نتائج اختبارات ابني
          </h2>

          <p
            style={{
              margin: "0 0 18px",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            تابع نتائج الاختبارات
            وملاحظات المعلم.
          </p>

          {quizResultsLoading ? (
            <p>جارٍ تحميل النتائج...</p>
          ) : quizResultsError ? (
            <p
              style={{
                color: "#b42318",
              }}
            >
              {quizResultsError}
            </p>
          ) : quizResults.length ===
            0 ? (
            <div
              style={{
                padding: "20px",
                background: "#f8fbfa",
                borderRadius: "18px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              لا توجد نتائج اختبارات
              حتى الآن.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              {quizResults.map(
                (result) => (
                  <div
                    key={result.id}
                    style={{
                      padding: "18px",
                      borderRadius:
                        "20px",
                      background:
                        "#f7fbf9",
                      border:
                        "1px solid #dcebe5",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: "12px",
                        flexWrap:
                          "wrap",
                        marginBottom:
                          "14px",
                      }}
                    >
                      <strong
                        style={{
                          fontSize:
                            "18px",
                        }}
                      >
                        {
                          result.quizTitle
                        }
                      </strong>

                      <span
                        style={{
                          background:
                            "#eaf8f2",
                          color:
                            "#147a5b",
                          padding:
                            "6px 12px",
                          borderRadius:
                            "999px",
                          fontWeight:
                            700,
                        }}
                      >
                        ⭐ تم التصحيح
                      </span>
                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(130px, 1fr))",
                        gap: "10px",
                      }}
                    >
                      <div>
                        📋{" "}
                        {
                          result.assessmentCategory
                        }
                      </div>

                      <div>
                        📝{" "}
                        {
                          result.assessmentType
                        }
                      </div>

                      <div>
                        ⭐ الدرجة:{" "}
                        {
                          result.studentScore
                        }{" "}
                        /{" "}
                        {
                          result.totalScore
                        }
                      </div>
                    </div>

                    {result.teacherNote && (
                      <div
                        style={{
                          marginTop:
                            "14px",
                          padding:
                            "14px",
                          borderRadius:
                            "16px",
                          background:
                            "#fff9e9",
                        }}
                      >
                        💬{" "}
                        <strong>
                          ملاحظة
                          المعلم:
                        </strong>{" "}
                        {
                          result.teacherNote
                        }
                      </div>
                    )}

                    {result.testPaperImageUrl && (
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
                          width:
                            "100%",
                          marginTop:
                            "14px",
                          padding:
                            "13px",
                          border:
                            "none",
                          borderRadius:
                            "16px",
                          background:
                            "#147a5b",
                          color:
                            "white",
                          fontWeight:
                            700,
                          cursor:
                            "pointer",
                        }}
                      >
                        👀 عرض صورة ورقة
                        الاختبار
                      </button>
                    )}

                    <div
                      style={{
                        marginTop:
                          "14px",
                      }}
                    >
                      {result.parentViewed ? (
                        <div
                          style={{
                            padding:
                              "12px",
                            borderRadius:
                              "14px",
                            textAlign:
                              "center",
                            background:
                              "#eaf8f2",
                            color:
                              "#147a5b",
                            fontWeight:
                              700,
                          }}
                        >
                          ✅ تمت متابعة
                          الأسرة والاطلاع
                          على النتيجة
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            markParentQuizAsViewed(
                              result.id
                            )
                          }
                          style={{
                            width:
                              "100%",
                            padding:
                              "13px",
                            border:
                              "2px solid #147a5b",
                            borderRadius:
                              "16px",
                            background:
                              "white",
                            color:
                              "#147a5b",
                            fontWeight:
                              700,
                            cursor:
                              "pointer",
                          }}
                        >
                          ✅ اطلعت على نتيجة
                          الاختبار
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* نبض اليوم */}

        <DailyPulseCard
          completedCount={
            completedCount
          }
          totalCount={totalDailyTasks}
        />

        {/* بطاقة الطالب */}

        <section style={cardStyle}>
          
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: "78px",
                height: "78px",
                borderRadius: "22px",
                background: "#e5f7ea",
                display: "grid",
                placeItems: "center",
                fontSize: "40px",
              }}
            >
              👦
            </div>

            <div
              style={{
                flex: 1,
                minWidth: "180px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#64748b",
                }}
              >
                الطالب
              </p>

              <h2
                style={{
                  margin: "5px 0",
                  fontSize: "24px",
                }}
              >
                {student.name}
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#475569",
                }}
              >
                {student.className}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/journey")
              }
              style={primaryButtonStyle}
            >
              👀 عرض كما يراه ابني
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "18px",
            }}
          >
            <span style={yellowBadgeStyle}>
              ⭐ {stars} نجوم
            </span>

            <span style={blueBadgeStyle}>
              🏅 {points} نقطة
            </span>

            <span style={redBadgeStyle}>
              📅 {absenceDays} أيام غياب
            </span>
          </div>

          <div
            style={{
              marginTop: "22px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: "10px",
                marginBottom: "9px",
              }}
            >
              <strong>
                إنجاز اليوم
              </strong>

              <strong
                style={{
                  color: "#1f7a4d",
                }}
              >
                {completedCount} من{" "}
                {totalDailyTasks} مهام
              </strong>
            </div>

            <div
              style={{
                height: "12px",
                background: "#e2e8f0",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPercentage}%`,
                  height: "100%",
                  background: "#1f7a4d",
                  borderRadius: "999px",
                }}
              />
            </div>

            <p
              style={{
                margin: "12px 0 0",
                color: "#475569",
                lineHeight: 1.7,
              }}
            >
              {completedCount ===
              totalDailyTasks
                ? "🎉 أحسنتم، أكمل ابنكم جميع مهام اليوم بنجاح."
                : completedCount === 0
                  ? "لم يبدأ ابنكم مهام اليوم بعد، ويمكنكم تشجيعه على الانطلاق. 🌱"
                  : `أحسن ابنكم اليوم، وبقي له ${
                      totalDailyTasks -
                      completedCount
                    } من المهام لإكمال رحلته اليومية. 🌟`}
                    
            </p>
          </div>
        </section>

        {/* صورة ابني */}

        <section
          style={{
            ...cardStyle,
            border: "1px solid #d8e7f4",
            background:
              "linear-gradient(135deg,#ffffff 0%,#f3f9ff 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  color: "#17547a",
                }}
              >
                📷 صورة ابني
              </h2>

              <p
                style={{
                  margin: "7px 0 0",
                  color: "#64748b",
                  lineHeight: 1.7,
                }}
              >
                يمكنكم استخدام الشخصية الرمزية أو اختيار صورة شخصية للطالب.
              </p>
            </div>

            <span
              style={{
                padding: "7px 12px",
                borderRadius: "999px",
                background: "#eef6ff",
                color: "#17547a",
                fontWeight: 800,
                fontSize: "13px",
              }}
            >
              🛡️ بإشراف المعلم
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: "14px",
            }}
          >
            <div
              style={{
                padding: "18px",
                borderRadius: "18px",
                background: "#f3fbf6",
                border: "1px solid #d5eadc",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "56px",
                  marginBottom: "10px",
                }}
              >
                👦🏻
              </div>

              <strong
                style={{
                  color: "#176c46",
                  fontSize: "17px",
                }}
              >
                استخدام الشخصية الرمزية
              </strong>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#64748b",
                  lineHeight: 1.7,
                  fontSize: "14px",
                }}
              >
                يبقى الطالب على شخصيته المختارة داخل الأكاديمية.
              </p>
            </div>

            <label
              style={{
                padding: "18px",
                borderRadius: "18px",
                background: "#eef7ff",
                border: "1px solid #d5e7f7",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontSize: "56px",
                  marginBottom: "10px",
                }}
              >
                📸
              </div>

              <strong
                style={{
                  color: "#17547a",
                  fontSize: "17px",
                }}
              >
                رفع صورة شخصية
              </strong>

              <p
                style={{
                  margin: "8px 0 12px",
                  color: "#64748b",
                  lineHeight: 1.7,
                  fontSize: "14px",
                }}
              >
                اختر صورة واضحة للطالب.
              </p>

              <span
                style={{
                  display: "inline-block",
                  padding: "10px 15px",
                  borderRadius: "14px",
                  background: "#17547a",
                  color: "white",
                  fontWeight: 800,
                }}
              >
                اختر صورة
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={
                  handlePersonalPhotoSelect
                }
                style={{
                  display: "none",
                }}
              />
            </label>
          </div>

          {personalPhotoPreview && (
            <div
              style={{
                marginTop: "16px",
                padding: "18px",
                borderRadius: "18px",
                background: "#ffffff",
                border: "1px solid #dbe5ec",
                textAlign: "center",
              }}
            >
              <img
                src={
                  personalPhotoPreview
                }
                alt="معاينة صورة الطالب"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "4px solid #e5eef5",
                  marginBottom: "12px",
                }}
              />

              <div
                style={{
                  fontWeight: 800,
                  color:
                    personalPhotoStatus ===
                    "approved"
                      ? "#147a5b"
                      : personalPhotoStatus ===
                          "rejected"
                        ? "#b42318"
                        : "#475569",
                  lineHeight: 1.8,
                }}
              >
                {personalPhotoStatus ===
                "pending"
                  ? "⏳ تم إرسال الصورة وهي بانتظار اعتماد المعلم"
                  : personalPhotoStatus ===
                      "approved"
                    ? "✅ تم اعتماد الصورة الشخصية"
                    : personalPhotoStatus ===
                        "rejected"
                      ? "❌ لم يعتمد المعلم الصورة، ويمكنكم اختيار صورة أخرى"
                      : personalPhotoFile
                        ? "✅ الصورة جاهزة للإرسال لاعتماد المعلم"
                        : ""}
              </div>

              {personalPhotoFile && (
                <>
                  <div
                    style={{
                      marginTop: "8px",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {personalPhotoFile.name}
                  </div>

                  <button
                    type="button"
                    onClick={
                      sendPersonalPhotoForApproval
                    }
                    disabled={
                      personalPhotoUploading
                    }
                    style={{
                      width: "100%",
                      marginTop: "14px",
                      padding: "13px",
                      border: "none",
                      borderRadius: "15px",
                      background:
                        personalPhotoUploading
                          ? "#94a3b8"
                          : "#17547a",
                      color: "white",
                      fontWeight: 800,
                      cursor:
                        personalPhotoUploading
                          ? "default"
                          : "pointer",
                    }}
                  >
                    {personalPhotoUploading
                      ? "⏳ جارٍ رفع الصورة وإرسالها..."
                      : "📤 إرسال الصورة لاعتماد المعلم"}
                  </button>
                </>
              )}

              {!personalPhotoFile &&
                personalPhotoSavedUrl &&
                personalPhotoStatus ===
                  "pending" && (
                  <div
                    style={{
                      marginTop: "10px",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    لا يلزم إرسالها مرة أخرى.
                  </div>
                )}
            </div>
          )}

          <div
            style={{
              marginTop: "16px",
              padding: "13px",
              borderRadius: "15px",
              background: "#fff9e8",
              color: "#7a5b16",
              lineHeight: 1.8,
              fontWeight: 700,
            }}
          >
            🛡️ بعد الإرسال تبقى الشخصية الرمزية ظاهرة، ولن تصبح الصورة الشخصية الرسمية إلا بعد اعتماد المعلم.
          </div>
        </section>

        {/* السجل الذكي */}

<section
  style={{
    ...cardStyle,
    border: "1px solid #cfe8dd",
    background:
      "linear-gradient(135deg,#ffffff 0%,#f0fbf6 100%)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "18px",
    }}
  >
    <div>
      <h2
        style={{
          margin: 0,
          fontSize: "22px",
          color: "#126a4b",
        }}
      >
        📋 متابعة ابني
      </h2>

      <p
        style={{
          margin: "7px 0 0",
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        آخر متابعة سجلها المعلم
      </p>
    </div>

    {smartFollowUp?.date && (
      <span
        style={{
          background: "#e5f7ed",
          color: "#147a5b",
          padding: "7px 12px",
          borderRadius: "999px",
          fontWeight: 700,
          fontSize: "13px",
        }}
      >
        📅 {smartFollowUp.date}
      </span>
    )}
  </div>

  {!smartFollowUp ? (
    <div
      style={{
        padding: "18px",
        borderRadius: "16px",
        background: "#f8fafc",
        textAlign: "center",
        color: "#64748b",
      }}
    >
      لا توجد متابعة جديدة مسجلة حتى الآن.
    </div>
  ) : (
    <>
      {/* الواجب */}

      <div
        style={{
          padding: "16px",
          borderRadius: "18px",
          background: "#fff9e8",
          border: "1px solid #f1dfaa",
          marginBottom: "14px",
        }}
      >
        <strong
          style={{
            display: "block",
            marginBottom: "8px",
            color: "#8a5700",
            fontSize: "17px",
          }}
        >
          📝 مستوى إنجاز الواجب
        </strong>

        <div
          style={{
            fontWeight: 800,
            color: "#684d17",
            lineHeight: 1.8,
          }}
        >
          {smartFollowUp.homeworkLabel ||
            "لم تسجل متابعة للواجب."}
        </div>
      </div>

      {/* القراءة */}

      <div
        style={{
          padding: "16px",
          borderRadius: "18px",
          background: "#eef8ff",
          border: "1px solid #d5eafb",
          marginBottom: "14px",
        }}
      >
        <strong
          style={{
            display: "block",
            marginBottom: "10px",
            color: "#075985",
            fontSize: "17px",
          }}
        >
          📖 مستوى القراءة
        </strong>

        <div
          style={{
            padding: "12px",
            background: "white",
            borderRadius: "14px",
            marginBottom: "12px",
            fontWeight: 800,
            color: "#173b57",
          }}
        >
          المستوى العام:{" "}
          <strong>
            {smartFollowUp.readingLevelLabel ||
              "لم يُقيّم بعد"}
          </strong>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(140px,1fr))",
            gap: "10px",
          }}
        >
          <div style={smartMetricStyle}>
            <span>🎯 الدقة</span>

            <strong>
              {smartFollowUp.readingAccuracyLabel ||
                "لم يُقيّم"}
            </strong>
          </div>

          <div style={smartMetricStyle}>
            <span>⚡ الطلاقة</span>

            <strong>
              {smartFollowUp.readingFluencyLabel ||
                "لم يُقيّم"}
            </strong>
          </div>

          <div style={smartMetricStyle}>
            <span>🎨 الحركات</span>

            <strong>
              {smartFollowUp.readingDiacriticsLabel ||
                "لم يُقيّم"}
            </strong>
          </div>
        </div>

        {smartFollowUp.readingNote && (
          <div
            style={{
              marginTop: "12px",
              padding: "13px",
              borderRadius: "14px",
              background: "#ffffff",
              color: "#475569",
              lineHeight: 1.8,
            }}
          >
            💬{" "}
            <strong>
              ملاحظة المعلم:
            </strong>{" "}
            {smartFollowUp.readingNote}
          </div>
        )}
      </div>

      {/* المشاركة والملاحظة */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(190px,1fr))",
          gap: "10px",
        }}
      >
        <div
          style={{
            padding: "13px",
            borderRadius: "15px",
            background: smartFollowUp.participated
              ? "#eefaf2"
              : "#f8fafc",
            color: smartFollowUp.participated
              ? "#166534"
              : "#64748b",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          {smartFollowUp.participated
            ? "🌟 شارك في الحصة اليوم"
            : "المشاركة لم تُسجل اليوم"}
        </div>

        {smartFollowUp.note && (
          <div
            style={{
              padding: "13px",
              borderRadius: "15px",
              background: "#f8fafc",
              color: "#475569",
              fontWeight: 700,
            }}
          >
            💬 {smartFollowUp.note}
          </div>
        )}
      </div>
    </>
  )}
</section>
        {/* ماذا أنجز اليوم */}

        <section style={cardStyle}>
          <h2
            style={sectionTitleStyle}
          >
            ✅ ماذا أنجز ابني اليوم؟
          </h2>

          <p
            style={{
              margin: "0 0 18px",
              color: "#475569",
              fontSize: "17px",
              lineHeight: 1.8,
              fontWeight: 600,
            }}
          >
            أنجز ابنكم{" "}
            {completedCount} من{" "}
            {totalDailyTasks} مهام اليوم.
            {completedCount ===
            totalDailyTasks
              ? " اكتملت جميع المهام، أحسنتم في دعمه وتشجيعه. 🎉"
              : ` بقي ${
                  totalDailyTasks -
                  completedCount
                } فقط لإكمال رحلته اليومية.`}
          </p>

          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >
            {liveDailyTasks.map(
              (task) => (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: "12px",
                    padding: "13px",
                    borderRadius:
                      "16px",
                    background:
                      task.completed
                        ? "#f0faf4"
                        : "#fff8e8",
                    border:
                      task.completed
                        ? "1px solid #d5efdf"
                        : "1px solid #f3dfad",
                  }}
                >
                  <span
                    style={{
                      fontSize: "24px",
                    }}
                  >
                    {task.icon}
                  </span>

                  <span
                    style={{
                      flex: 1,
                      fontWeight:
                        "bold",
                    }}
                  >
                    {task.title}
                  </span>

                  <span
                    style={{
                      fontWeight:
                        "bold",
                      color:
                        task.completed
                          ? "#1f7a4d"
                          : "#b7791f",
                    }}
                  >
                    {task.completed
                      ? "مكتمل ✅"
                      : "بانتظار الإنجاز ⏳"}
                  </span>
                </div>
              )
            )}
          </div>
        </section>

        {/* كلمات الإملاء */}

        <section style={cardStyle}>
          <h2
            style={sectionTitleStyle}
          >
            ✍️ كلمات إملاء الغد
          </h2>

          {tomorrowSpellingDay && (
            <p
              style={{
                margin: "0 0 8px",
                color: "#147a5b",
                fontWeight: 700,
              }}
            >
              اليوم الدراسي القادم:{" "}
              {tomorrowSpellingDay}
            </p>
          )}

          <p
            style={{
              marginTop: 0,
              color: "#64748b",
              lineHeight: 1.7,
            }}
          >
            كلمات قصيرة يمكن التدريب
            عليها مع ابنكم في دقائق
            قليلة.
          </p>

          {tomorrowSpellingWords.length >
          0 ? (
            <>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom:
                    "16px",
                }}
              >
                {tomorrowSpellingWords.map(
                  (word) => (
                    <span
                      key={word}
                      style={{
                        padding:
                          "10px 15px",
                        borderRadius:
                          "14px",
                        background:
                          "#eef6ff",
                        border:
                          "1px solid #d5e7fb",
                        fontWeight:
                          "bold",
                      }}
                    >
                      {word}
                    </span>
                  )
                )}
              </div>

              <button
                type="button"
                style={
                  secondaryButtonStyle
                }
              >
                ✅ تدربنا معًا
              </button>
            </>
          ) : (
            <div
              style={{
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "16px",
                color: "#64748b",
                textAlign: "center",
              }}
            >
              لا توجد كلمات إملاء
              منشورة لليوم الدراسي
              القادم حتى الآن.
            </div>
          )}
        </section>

        {/* آخر إنجاز */}

        <section style={cardStyle}>
          <h2
            style={sectionTitleStyle}
          >
            🏆 آخر إنجاز
          </h2>

          <div
            style={{
              padding: "16px",
              borderRadius: "18px",
              background: "#fff9e8",
              border:
                "1px solid #f1e2aa",
            }}
          >
            <strong
              style={{
                fontSize: "18px",
              }}
            >
              {completedCount ===
              totalDailyTasks
                ? "🏅 وسام النشاط اليومي"
                : completedCount > 0
                  ? "🌟 تقدم جميل اليوم"
                  : "🚀 بداية رحلة جديدة"}
            </strong>

            <p
              style={{
                margin: "9px 0 0",
                color: "#475569",
                lineHeight: 1.7,
              }}
            >
              {completedCount ===
              totalDailyTasks
                ? "أكمل ابنكم جميع مهام اليوم، وحصل على مكافأة النشاط اليومي."
                : completedCount > 0
                  ? `أنجز ابنكم ${completedCount} من ${totalDailyTasks} مهام اليوم.`
                  : "بانتظار أول إنجاز للطالب اليوم."}
            </p>
          </div>
        </section>

        <FamilyRecommendationCard
          completedCount={
            completedCount
          }
          totalCount={totalDailyTasks}
        />

        <FamilyImpactCard
          completedCount={
            completedCount
          }
          totalCount={totalDailyTasks}
        />

        {/* رسالة المعلم */}

        <section style={cardStyle}>
          <h2
            style={sectionTitleStyle}
          >
            💌 رسالة المعلم
          </h2>

          <p style={messageStyle}>
            {teacherMessage ||
              "لا توجد رسالة جديدة من المعلم حاليًا."}
          </p>

          {teacherMessageUpdatedAt && (
            <p
              style={{
                marginTop: "10px",
                marginBottom: 0,
                fontSize: "13px",
                color: "#64748b",
                textAlign: "left",
              }}
            >
              آخر تحديث:{" "}
              {teacherMessageUpdatedAt.toLocaleString(
                "ar-SA",
                {
                  dateStyle:
                    "medium",
                  timeStyle:
                    "short",
                }
              )}
            </p>
          )}
        </section>

        {/* رحلة القراءة */}

        <section
          style={{
            ...cardStyle,
            border:
              "1px solid #d9eee5",
            background:
              "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#0f6b52",
                  fontSize: "22px",
                }}
              >
                📖 رحلة القراءة
              </h2>

              <p
                style={{
                  margin: "7px 0 0",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                استمرارية ابنكم في
                القراءة المنزلية
              </p>
            </div>

            <div
              style={{
                padding: "8px 14px",
                borderRadius: "999px",
                background: "#dcfce7",
                color: "#047857",
                fontWeight: 900,
                fontSize: "18px",
              }}
            >
              {displayedReadingProgress} /
              5
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(5, 1fr)",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            {[1, 2, 3, 4, 5].map(
              (day) => (
                <div
                  key={day}
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "10px 4px",
                    borderRadius:
                      "12px",

                    background:
                      day <=
                      displayedReadingProgress
                        ? "#dcfce7"
                        : "#f1f5f9",

                    border:
                      day <=
                      displayedReadingProgress
                        ? "1px solid #86efac"
                        : "1px solid #e2e8f0",

                    fontSize:
                      "20px",
                  }}
                >
                  {day <=
                  displayedReadingProgress
                    ? day === 5
                      ? "👑"
                      : "⭐"
                    : "○"}
                </div>
              )
            )}
          </div>

          <p
            style={{
              margin: 0,
              textAlign: "center",
              color:
                displayedReadingProgress ===
                5
                  ? "#047857"
                  : "#475569",
              fontWeight: 800,
              lineHeight: 1.8,
            }}
          >
            {displayedReadingProgress ===
            5
              ? "🎉 أكمل ابنكم خمسة أيام قراءة وحصل على مكافأة الاستمرارية!"
              : remainingReadingDays ===
                  1
                ? "🔥 بقي لابنكم يوم واحد فقط لإكمال تحدي القراءة!"
                : `قرأ ابنكم ${displayedReadingProgress} من 5 أيام، وبقيت ${remainingReadingDays} أيام لإكمال التحدي.`}
          </p>
        </section>

        {/* رسالة فارس */}

        <section style={cardStyle}>
          <h2
            style={sectionTitleStyle}
          >
            🤖 رسالة فارس
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "18px",
                background: "#e7f7ed",
                display: "grid",
                placeItems: "center",
                fontSize: "32px",
                flexShrink: 0,
              }}
            >
              🦸
            </div>

            <p
              style={{
                margin: 0,
                lineHeight: 1.8,
                color: "#475569",
              }}
            >
              {completedCount ===
              totalDailyTasks
                ? "🎉 أحسنتم! بطلنا أكمل جميع مهام اليوم، شكرًا لدعمكم وتشجيعكم."
                : completedCount === 0
                  ? "رحلة اليوم ما زالت في بدايتها، كلمة تشجيع منكم قد تصنع فرقًا كبيرًا. 🌱"
                  : `بقي ${
                      totalDailyTasks -
                      completedCount
                    } من المهام، شجعوا بطلنا على إكمال رحلته اليوم. ⭐`}
            </p>
          </div>
        </section>
      </div>

      {/* شريط التنقل */}

      <nav
        style={{
          position: "fixed",
          right: 0,
          left: 0,
          bottom: 0,
          background: "white",
          borderTop:
            "1px solid #e2e8f0",
          padding: "10px 8px",
          display: "flex",
          justifyContent:
            "space-around",
          zIndex: 20,
        }}
      >
        {[
          ["🏠", "الرئيسية"],
          ["📸", "يوميات الفصل"],
          ["🎨", "معرض ابني"],
          ["💬", "الرسائل"],
          ["📋", "دراسة الحالة"],
          ["👤", "حسابي"],
        ].map(([icon, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (
                label === "الرئيسية"
              ) {
                window.location.href =
                  "/parent";
                return;
              }

              if (
                label ===
                "يوميات الفصل"
              ) {
                alert(
                  "📸 يوميات الفصل\nقريبًا بإذن الله"
                );
                return;
              }

              if (
                label ===
                "معرض ابني"
              ) {
                window.location.href =
                  "/gallery?from=parent";
                return;
              }

              if (
                label === "الرسائل"
              ) {
                alert(
                  "💬 الرسائل\nقريبًا بإذن الله"
                );
                return;
              }

              if (
                label ===
                "دراسة الحالة"
              ) {
                window.location.href =
                  "/parent/case-study";
                return;
              }

              if (
                label === "حسابي"
              ) {
                window.location.href =
                  "/parent/profile";
              }
            }}
            style={{
              border: "none",
              background:
                "transparent",
              color: "#475569",
              display: "grid",
              gap: "4px",
              justifyItems:
                "center",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                fontSize: "21px",
              }}
            >
              {icon}
            </span>

            {label}
          </button>
        ))}
      </nav>
    </main>
  );
}

const cardStyle = {
  background: "white",
  borderRadius: "24px",
  padding: "20px",
  marginBottom: "16px",
  boxShadow:
    "0 8px 24px rgba(0,0,0,0.06)",
};

const sectionTitleStyle = {
  margin: "0 0 16px",
  fontSize: "21px",
  color: "#173b57",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "16px",
  background: "#1f7a4d",
  color: "white",
  padding: "13px 18px",
  fontSize: "15px",
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  border: "none",
  borderRadius: "15px",
  background: "#e7f7ed",
  color: "#166534",
  padding: "12px 18px",
  fontSize: "15px",
  fontWeight: "bold",
  cursor: "pointer",
};

const messageStyle = {
  margin: 0,
  padding: "16px",
  borderRadius: "18px",
  background: "#f1f7ff",
  color: "#475569",
  lineHeight: 1.9,
};

const yellowBadgeStyle = {
  padding: "8px 12px",
  borderRadius: "12px",
  background: "#fff7d6",
  fontWeight: 700,
};

const blueBadgeStyle = {
  padding: "8px 12px",
  borderRadius: "12px",
  background: "#eef7ff",
  fontWeight: 700,
};

const redBadgeStyle = {
  padding: "8px 12px",
  borderRadius: "12px",
  background: "#fff1f2",
  fontWeight: 700,
};
const smartMetricStyle = {
  display: "grid",
  gap: "7px",
  padding: "13px",
  borderRadius: "14px",
  background: "#ffffff",
  textAlign: "center" as const,
  color: "#475569",
};