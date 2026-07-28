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
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
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
const [teacherMessage, setTeacherMessage] = useState("");
const [teacherMessageUpdatedAt, setTeacherMessageUpdatedAt] =
  useState<Date | null>(null);
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
  loadStudentRewards();
}, [demoStudent]);
  const completedCount = dailyTasks.filter(
    (task) => task.completed
  ).length;

  const progressPercentage = Math.round(
    (completedCount / dailyTasks.length) * 100
  );

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