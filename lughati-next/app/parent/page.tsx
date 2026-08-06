"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DailyPulseCard from "./components/DailyPulseCard";
import FamilyRecommendationCard from "./components/FamilyRecommendationCard";
import FamilyImpactCard from "./components/FamilyImpactCard";
import WeeklyStarsCard from "./components/WeeklyStarsCard";
import WeeklyReportCard from "./components/WeeklyReportCard";
import CelebrationCard from "./components/CelebrationCard";
import { parentDemoData } from "./data/parentDemoData";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
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
export default function ParentPage() {
    const {
    student: demoStudent,
    dailyTasks,
    weeklyProgress,
    skills,
    spelling,
    achievement,
    family,
    teacher,
    fares,
  } = parentDemoData;
  const router = useRouter();
const [student, setStudent] = useState(demoStudent);
const [points, setPoints] = useState(0);
const [stars, setStars] = useState(0);
const [absenceDays, setAbsenceDays] = useState(0);
const [readingDays, setReadingDays] = useState(0);
const [teacherMessage, setTeacherMessage] = useState("");
const [teacherMessageUpdatedAt, setTeacherMessageUpdatedAt] =
  useState<Date | null>(null);
  const [quizResults, setQuizResults] = useState<ParentQuizResult[]>([]);
const [quizResultsLoading, setQuizResultsLoading] = useState(true);
const [quizResultsError, setQuizResultsError] = useState("");
useEffect(() => {
  async function loadStudentRewards() {
  const studentId = localStorage.getItem("student-id");

  if (!studentId || studentId === "student-demo") {
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

    const studentData = studentSnapshot.data();
    setTeacherMessage(
  typeof studentData.teacherMessage === "string"
    ? studentData.teacherMessage
    : ""
);
const messageDate = studentData.teacherMessageUpdatedAt;

setTeacherMessageUpdatedAt(
  messageDate?.toDate
    ? messageDate.toDate()
    : messageDate instanceof Date
      ? messageDate
      : null
);
const attendanceHistory = Array.isArray(studentData.attendanceHistory)
  ? studentData.attendanceHistory
  : [];

const totalAbsenceDays = attendanceHistory.filter(
  (attendance) => attendance.status === "غائب"
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
    console.error("تعذر تحميل مكافآت الطالب:", error);
  }
}
  const savedStudent = localStorage.getItem("lughatiStudent");

  if (!savedStudent) return;

  try {
    const loggedInStudent = JSON.parse(savedStudent);

    setStudent({
      ...demoStudent,
      ...loggedInStudent,
    });
  } catch (error) {
    console.error("تعذر قراءة بيانات الطالب:", error);
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
      collection(db, "dailyReadingRecords"),
      where("studentId", "==", studentId),
      where("approved", "==", true)
    );

    const readingSnapshot =
      await getDocs(readingQuery);

    setReadingDays(readingSnapshot.size);
  } catch (error) {
    console.error(
      "تعذر تحميل أيام القراءة لولي الأمر:",
      error
    );

    setReadingDays(0);
  }
}
  loadStudentRewards();
  loadReadingDays();
}, [demoStudent]);
useEffect(() => {
  async function loadParentQuizResults() {
    try {
      setQuizResultsLoading(true);
      setQuizResultsError("");

      const studentId = localStorage.getItem("student-id");

      if (!studentId) {
        setQuizResults([]);
        setQuizResultsError("تعذر معرفة حساب الطالب الحالي.");
        return;
      }

      const resultsQuery = query(
        collection(db, "quizResults"),
        where("studentId", "==", studentId)
      );

      const snapshot = await getDocs(resultsQuery);

      const loadedResults: ParentQuizResult[] = snapshot.docs.map((docSnap) => {
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

      setQuizResults(loadedResults);
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
  const completedCount = dailyTasks.filter(
    (task) => task.completed
  ).length;
const readingProgress = readingDays % 5;

const displayedReadingProgress =
  readingDays > 0 && readingProgress === 0
    ? 5
    : readingProgress;

const remainingReadingDays =
  displayedReadingProgress === 5
    ? 0
    : 5 - displayedReadingProgress;
  const progressPercentage = Math.round(
    (completedCount / dailyTasks.length) * 100
  );
async function markParentQuizAsViewed(resultId: string) {
  const confirmed = window.confirm(
    "هل تؤكد أنك اطلعت على نتيجة الاختبار؟"
  );

  if (!confirmed) return;

  try {
    await updateDoc(doc(db, "quizResults", resultId), {
      parentViewed: true,
      parentViewedAt: serverTimestamp(),
      viewedFrom: "parent-account",
    });

    setQuizResults((currentResults) =>
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
        background: "#f4f8fc",
        padding: "20px 14px 100px",
        fontFamily: "Arial, sans-serif",
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
            boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
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
            متابعة مختصرة وواضحة لتقدم ابنكم دون أعباء إضافية.
          </p>
        </header>
<section
  style={{
    background: "white",
    borderRadius: "26px",
    padding: "22px",
    marginBottom: "18px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
  }}
>
  <h2 style={{ margin: "0 0 8px", fontSize: "22px" }}>
    📝 نتائج اختبارات ابني
  </h2>

  <p
    style={{
      margin: "0 0 18px",
      color: "#64748b",
      fontSize: "14px",
    }}
  >
    تابع نتائج الاختبارات وملاحظات المعلم.
  </p>

  {quizResultsLoading ? (
    <p>جارٍ تحميل النتائج...</p>
  ) : quizResultsError ? (
    <p style={{ color: "#b42318" }}>{quizResultsError}</p>
  ) : quizResults.length === 0 ? (
    <div
      style={{
        padding: "20px",
        background: "#f8fbfa",
        borderRadius: "18px",
        textAlign: "center",
        color: "#64748b",
      }}
    >
      لا توجد نتائج اختبارات حتى الآن.
    </div>
  ) : (
    <div style={{ display: "grid", gap: "16px" }}>
      {quizResults.map((result) => (
        <div
          key={result.id}
          style={{
            padding: "18px",
            borderRadius: "20px",
            background: "#f7fbf9",
            border: "1px solid #dcebe5",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "14px",
            }}
          >
            <strong style={{ fontSize: "18px" }}>
              {result.quizTitle}
            </strong>

            <span
              style={{
                background: "#eaf8f2",
                color: "#147a5b",
                padding: "6px 12px",
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
                "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "10px",
            }}
          >
            <div>📋 {result.assessmentCategory}</div>
            <div>📝 {result.assessmentType}</div>
            <div>
              ⭐ الدرجة: {result.studentScore} / {result.totalScore}
            </div>
          </div>

          {result.teacherNote && (
            <div
              style={{
                marginTop: "14px",
                padding: "14px",
                borderRadius: "16px",
                background: "#fff9e9",
              }}
            >
              💬 <strong>ملاحظة المعلم:</strong>{" "}
              {result.teacherNote}
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
                width: "100%",
                marginTop: "14px",
                padding: "13px",
                border: "none",
                borderRadius: "16px",
                background: "#147a5b",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              👀 عرض صورة ورقة الاختبار
            </button>
          )}

          <div
            style={{
              marginTop: "14px",
              padding: "12px",
              borderRadius: "14px",
              textAlign: "center",
              background: result.parentViewed
                ? "#eaf8f2"
                : "#fff8e8",
              color: result.parentViewed
                ? "#147a5b"
                : "#8a6a16",
              fontWeight: 700,
            }}
          >
            {result.parentViewed ? (
  <div
    style={{
      marginTop: "14px",
      padding: "12px",
      borderRadius: "14px",
      textAlign: "center",
      background: "#eaf8f2",
      color: "#147a5b",
      fontWeight: 700,
    }}
  >
    ✅ تمت متابعة الأسرة والاطلاع على النتيجة
  </div>
) : (
  <button
    type="button"
    onClick={() => markParentQuizAsViewed(result.id)}
    style={{
      width: "100%",
      marginTop: "14px",
      padding: "13px",
      border: "2px solid #147a5b",
      borderRadius: "16px",
      background: "white",
      color: "#147a5b",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    ✅ اطلعت على نتيجة الاختبار
  </button>
)}
          </div>
        </div>
      ))}
    </div>
  )}
</section>
<DailyPulseCard
  completedCount={completedCount}
  totalCount={dailyTasks.length}
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

            <div style={{ flex: 1, minWidth: "180px" }}>
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
                أحمد محمد
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#475569",
                }}
              >
                {student.className ||  "الصف الثاني الابتدائي"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/journey")}
              style={primaryButtonStyle}
            >
              👀 عرض كما يراه ابني
            </button>
            <div
  style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "14px",
  }}
>
  <span
    style={{
      padding: "8px 12px",
      borderRadius: "12px",
      background: "#fff7d6",
      fontWeight: 700,
    }}
  >
    ⭐ {stars} نجوم
  </span>

  <span
    style={{
      padding: "8px 12px",
      borderRadius: "12px",
      background: "#eef7ff",
      fontWeight: 700,
    }}
  >
    🏅 {points} نقطة
  </span>
  <span
  style={{
    padding: "8px 12px",
    borderRadius: "12px",
    background: "#fff1f2",
    fontWeight: 700,
  }}
>
  📅 {absenceDays} أيام غياب
</span>
</div>
          </div>

          <div style={{ marginTop: "22px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "9px",
              }}
            >
              <strong>إنجاز اليوم</strong>
              <strong style={{ color: "#1f7a4d" }}>
                {completedCount} من {dailyTasks.length} مهام
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
              أحسن ابنكم اليوم، وقد بقي له نشاط واحد فقط لإكمال
              رحلته اليومية. 🌟
            </p>
          </div>
        </section>

        {/* ماذا أنجز اليوم */}
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>
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
  أنجز ابنكم {completedCount} من {dailyTasks.length} مهام اليوم.
  {completedCount === dailyTasks.length
    ? " اكتملت جميع المهام، أحسنتم في دعمه وتشجيعه. 🎉"
    : ` بقي ${
        dailyTasks.length - completedCount
      } فقط لإكمال رحلته اليومية.`}
</p>
          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >
            {dailyTasks.map((task) => (
              <div
                key={task.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "13px",
                  borderRadius: "16px",
                  background: task.completed
                    ? "#f0faf4"
                    : "#fff8e8",
                  border: task.completed
                    ? "1px solid #d5efdf"
                    : "1px solid #f3dfad",
                }}
              >
                <span style={{ fontSize: "24px" }}>
                  {task.icon}
                </span>

                <span
                  style={{
                    flex: 1,
                    fontWeight: "bold",
                  }}
                >
                  {task.title}
                </span>

                <span
                  style={{
                    fontWeight: "bold",
                    color: task.completed
                      ? "#1f7a4d"
                      : "#b7791f",
                  }}
                >
                  {task.completed ? "مكتمل ✅" : "بانتظار الإنجاز ⏳"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* كلمات إملاء الغد */}
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            ✍️ {spelling.title}
          </h2>

          <p
            style={{
              marginTop: 0,
              color: "#64748b",
              lineHeight: 1.7,
            }}
          >
            كلمات قصيرة يمكن التدريب عليها مع ابنكم في دقائق قليلة.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            {spelling.words.map((word: string) => (
              <span
                key={word}
                style={{
                  padding: "10px 15px",
                  borderRadius: "14px",
                  background: "#eef6ff",
                  border: "1px solid #d5e7fb",
                  fontWeight: "bold",
                }}
              >
                {word}
              </span>
            ))}
          </div>

          <button
            type="button"
            style={secondaryButtonStyle}
          >
            ✅ تدربنا معًا
          </button>
        </section>

        {/* آخر إنجاز */}
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            🏆 آخر إنجاز
          </h2>

          <div
            style={{
              padding: "16px",
              borderRadius: "18px",
              background: "#fff9e8",
              border: "1px solid #f1e2aa",
            }}
          >
            <strong style={{ fontSize: "18px" }}>
  {achievement.icon} {achievement.title}
</strong>

            <p
              style={{
                margin: "9px 0 0",
                color: "#475569",
                lineHeight: 1.7,
              }}
            >
              {achievement.description}
            </p>
          </div>
        </section>
        <WeeklyStarsCard
  readingStars={weeklyProgress.readingStars}
  spellingStars={weeklyProgress.spellingStars}
  comprehensionStars={weeklyProgress.comprehensionStars}
  badgesCount={weeklyProgress.badgesCount}
  streakDays={weeklyProgress.streakDays}
     />
  <WeeklyReportCard
  completedTasks={weeklyProgress.completedTasks}
  totalTasks={weeklyProgress.totalTasks}
  strongestSkill={skills.strongestSkill}
  supportSkill={skills.supportSkill}
  familyStep={family.nextWeekStep}
/> 
<CelebrationCard
  completedTasks={weeklyProgress.completedTasks}
  totalTasks={weeklyProgress.totalTasks}
/>
<FamilyRecommendationCard
  completedCount={completedCount}
  totalCount={dailyTasks.length}
/>
<FamilyImpactCard
  completedCount={completedCount}
  totalCount={dailyTasks.length}
/>
        {/* رسالة المعلم */}
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            💌 رسالة المعلم
          </h2>

          <p style={messageStyle}>
             {teacherMessage || teacher.message}
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
    {teacherMessageUpdatedAt.toLocaleString("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    })}
  </p>
)}
        </section>
        <section
  style={{
    ...cardStyle,
    marginTop: "18px",
    border: "1px solid #d9eee5",
    background:
      "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
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
        استمرارية ابنك في القراءة المنزلية
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
      {displayedReadingProgress} / 5
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: "8px",
      marginBottom: "14px",
    }}
  >
    {[1, 2, 3, 4, 5].map((day) => (
      <div
        key={day}
        style={{
          textAlign: "center",
          padding: "10px 4px",
          borderRadius: "12px",
          background:
            day <= displayedReadingProgress
              ? "#dcfce7"
              : "#f1f5f9",
          border:
            day <= displayedReadingProgress
              ? "1px solid #86efac"
              : "1px solid #e2e8f0",
          fontSize: "20px",
        }}
      >
        {day <= displayedReadingProgress
          ? day === 5
            ? "👑"
            : "⭐"
          : "○"}
      </div>
    ))}
  </div>

  <p
    style={{
      margin: 0,
      textAlign: "center",
      color:
        displayedReadingProgress === 5
          ? "#047857"
          : "#475569",
      fontWeight: 800,
      lineHeight: 1.8,
    }}
  >
    {displayedReadingProgress === 5
      ? "🎉 أكمل ابنك خمسة أيام قراءة وحصل على مكافأة الاستمرارية!"
      : remainingReadingDays === 1
        ? "🔥 بقي لابنك يوم واحد فقط لإكمال تحدي القراءة!"
        : `قرأ ابنك ${displayedReadingProgress} من 5 أيام، وبقيت ${remainingReadingDays} أيام لإكمال التحدي.`}
  </p>
</section>
  

        {/* رسالة فارس */}
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            🤖 {fares.message}
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
              بقي نشاط واحد فقط، شجعوا بطلنا على إكماله ليحصل
              على نجمة جديدة. ⭐
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
          borderTop: "1px solid #e2e8f0",
          padding: "10px 8px",
          display: "flex",
          justifyContent: "space-around",
          zIndex: 20,
        }}
      >
        {[
          ["🏠", "الرئيسية"],
          ["📸", "يوميات الفصل"],
          ["🎨", "معرض ابني"],
          ["💬", "الرسائل"],
          ["👤", "حسابي"],
        ].map(([icon, label]) => (
          <button
            key={label}
            type="button"
            style={{
              border: "none",
              background: "transparent",
              color: "#475569",
              display: "grid",
              gap: "4px",
              justifyItems: "center",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "21px" }}>
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
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
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