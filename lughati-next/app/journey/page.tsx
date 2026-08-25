"use client";

import InstallAppButton from "../components/InstallAppButton";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../../firebase";

const journeyCards = [
  {
    icon: "🏡",
    title: "مدينة الإنجاز",
    description:
      "ابنِ مدينتك مع كل تقدم جديد",
    href: "/journey/city",
    background: "#fff7d6",
  },
  {
  icon: "👦🏻",
  title: "شخصيتي",
  description:
    "اختر شخصيتك وافتح صورًا جديدة مع تقدمك",
  href: "/student-avatar",
  background: "#eefbf6",
},
  {
    icon: "📚",
    title: "الدروس",
    description:
      "تعلّم واقرأ واستمتع",
    href: "/lessons",
    background: "#e8f2ff",
  },
  {
    icon: "📝",
    title: "واجباتي",
    description:
      "أنجز واجباتك اليومية",
    href: "/homeworks",
    background: "#fff3df",
  },
  {
    icon: "🎙️",
    title: "رحلة القراءة",
    description:
      "سجّل دقيقة قراءة يومية وواصل سلسلة إنجازك",
    href: "/reading-journey",
    background: "#ecfdf5",
  },
  {
    icon: "🗓️",
    title: "الخطة الأسبوعية",
    description:
      "تعرّف على مهام الأسبوع",
    href: "/weekly-plan",
    background: "#e9f9ee",
  },
  {
    icon: "📝",
    title: "اختباراتي",
    description:
      "ادخل إلى اختباراتك الإلكترونية وابدأ الحل",
    href: "/quizzes/take",
    background: "#eef8f2",
  },
  {
    icon: "🌱",
    title: "رحلة الدعم",
    description:
      "تدريبات تساعدني على التقدم",
    href: "/support",
    background: "#f2ebff",
  },
  {
    icon: "🏆",
    title: "لوحة الشرف",
    description:
      "شاهد أوسمتك وألقابك وإنجازاتك المميزة",
    href: "/honor-board",
    background: "#fff8d8",
  },
  {
    icon: "🌟",
    title: "أبطال الأكاديمية",
    description:
      "شاهد أبطال القراءة والإملاء والإنجاز",
    href: "/heroes",
    background: "#fff6dc",
  },
  {
    icon: "📝",
    title: "نتائج اختباراتي",
    description:
      "شاهد درجاتك ونتائج اختباراتك وتابع تقدمك",
    href: "/quizzes",
    background: "#eef4ff",
  },
  {
    icon: "🎨",
    title: "معرض الطلاب",
    description:
      "شاهد إبداعاتك وإبداعات زملائك ✨",
    href: "/gallery",
    background: "#fff3e8",
  },
  {
    icon: "📤",
    title: "ارفع عملي",
    description:
      "أرسل صوتًا أو صورة أو فيديو",
    href: "/upload",
    background: "#e9fbff",
  },
  {
    icon: "💬",
    title: "تواصل مع معلمي",
    description:
      "أرسل استفسارك أو طلب المساعدة إلى معلمك",
    href: "/student-contact",
    background: "#eefbf6",
  },
];

const dailyTasks = [
  {
    id: 1,
    title: "قراءة درس اليوم",
    reward: "نجمتان",
    icon: "📖",
  },
  {
    id: 2,
    title: "حل الواجب اليومي",
    reward: "3 نقاط",
    icon: "✏️",
  },
  {
    id: 3,
    title: "التدرب على القراءة",
    reward: "نجمة",
    icon: "🎙️",
  },
  {
    id: 4,
    title: "مراجعة كلمات الإملاء",
    reward: "نقطتان",
    icon: "🔤",
  },
];

type JourneyData = {
  success: boolean;
  points?: number;
  stars?: number;
  streak?: number;
  readingDays?: number;
  personalPhotoUrl?: string;
  selectedAvatarIcon?: string;
  completedTaskIds?: number[];
  message?: string;
};
type CrownAchievement = {
  id: string;
  mode: string;
  lessonName: string;
  king: boolean;
  kingTitle: string;
  fullMastery: boolean;
  personalPhotoUrl: string;
  selectedAvatarIcon: string;
};

type CrownData = {
  success: boolean;
  readingKingCount?: number;
  spellingKingCount?: number;
  masteryCount?: number;
  latestAchievement?: CrownAchievement | null;
  achievements?: CrownAchievement[];
  message?: string;
};
type StudentSmartFollowUp = {
  date: string;

  homeworkLabel: string;

  readingLevelLabel: string;
  readingAccuracyLabel: string;
  readingFluencyLabel: string;
  readingDiacriticsLabel: string;

  readingNote: string;
};

export default function JourneyPage() {
  const [studentName] = useState(() => {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    window.localStorage.getItem("student-name") || ""
  );
});
  const [user, setUser] =
    useState<User | null>(null);

  const [
    smartFollowUp,
    setSmartFollowUp,
  ] =
    useState<StudentSmartFollowUp | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [points, setPoints] =
    useState(0);

  const [stars, setStars] =
    useState(0);

  const [streak, setStreak] =
    useState(0);

  const [readingDays, setReadingDays] =
    useState(0);

  const [
    completedTasks,
    setCompletedTasks,
  ] = useState<number[]>([]);

  const [
    savingTaskId,
    setSavingTaskId,
  ] =
    useState<number | null>(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
  personalPhotoUrl,
  setPersonalPhotoUrl,
] = useState("");

const [
  selectedAvatarIcon,
  setSelectedAvatarIcon,
] = useState("🧒🏻");
const [
  crownLoading,
  setCrownLoading,
] = useState(true);

const [
  readingKingCount,
  setReadingKingCount,
] = useState(0);

const [
  spellingKingCount,
  setSpellingKingCount,
] = useState(0);

const [
  masteryCount,
  setMasteryCount,
] = useState(0);

const [
  latestCrownAchievement,
  setLatestCrownAchievement,
] =
  useState<CrownAchievement | null>(
    null
  );
  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
        }
      );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const currentUser = user;

    async function loadJourneyData() {
      try {
        setLoading(true);
        setErrorMessage("");

        const token =
          await currentUser.getIdToken();

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
          (await response.json()) as JourneyData;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "تعذر تحميل بيانات الرحلة."
          );
        }

        setPoints(
          typeof data.points ===
            "number"
            ? data.points
            : 0
        );

        setStars(
          typeof data.stars ===
            "number"
            ? data.stars
            : 0
        );

        setStreak(
          typeof data.streak ===
            "number"
            ? data.streak
            : 0
        );

        setReadingDays(
          typeof data.readingDays ===
            "number"
            ? data.readingDays
            : 0
        );

        setPersonalPhotoUrl(
          typeof data.personalPhotoUrl ===
            "string"
            ? data.personalPhotoUrl
            : ""
        );

        setSelectedAvatarIcon(
          typeof data.selectedAvatarIcon ===
            "string"
            ? data.selectedAvatarIcon
            : "🧒🏻"
        );

        setCompletedTasks(
          Array.isArray(
            data.completedTaskIds
          )
            ? data.completedTaskIds
            : []
        );
      } catch (error) {
        console.error(
          "تعذر تحميل رحلة الطالب:",
          error
        );

        setErrorMessage(
          "تعذر تحميل بعض بيانات الرحلة حاليًا."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadJourneyData();
  }, [user]);
useEffect(() => {
  if (!user) {
    return;
  }

  const currentUser = user;

  async function loadCrownData() {
    try {
      setCrownLoading(true);

      const token =
        await currentUser.getIdToken();

      const response =
        await fetch(
          "/api/student-crown",
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
        (await response.json()) as CrownData;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "تعذر تحميل تاج لغتي."
        );
      }

      setReadingKingCount(
        typeof data.readingKingCount ===
          "number"
          ? data.readingKingCount
          : 0
      );

      setSpellingKingCount(
        typeof data.spellingKingCount ===
          "number"
          ? data.spellingKingCount
          : 0
      );

      setMasteryCount(
        typeof data.masteryCount ===
          "number"
          ? data.masteryCount
          : 0
      );

      setLatestCrownAchievement(
        data.latestAchievement ??
          null
      );
    } catch (error) {
      console.error(
        "تعذر تحميل تاج لغتي:",
        error
      );

      setReadingKingCount(0);
      setSpellingKingCount(0);
      setMasteryCount(0);

      setLatestCrownAchievement(
        null
      );
    } finally {
      setCrownLoading(false);
    }
  }

  void loadCrownData();
}, [user]);
  useEffect(() => {
    async function loadSmartFollowUp() {
      try {
        const studentId =
          localStorage.getItem(
            "student-id"
          );
 
        if (
          !studentId ||
          studentId === "student-demo"
        ) {
          setSmartFollowUp(null);
          return;
        }

        const studentSnapshot =
          await getDoc(
            doc(
              db,
              "students",
              studentId
            )
          );

        if (
          !studentSnapshot.exists()
        ) {
          setSmartFollowUp(null);
          return;
        }

        const studentData =
          studentSnapshot.data();

        const saved =
          studentData.smartFollowUp;

        if (
          !saved ||
          typeof saved !== "object"
        ) {
          setSmartFollowUp(null);
          return;
        }

        setSmartFollowUp({
          date:
            typeof saved.date ===
              "string"
              ? saved.date
              : "",

          homeworkLabel:
            typeof saved.homeworkLabel ===
              "string"
              ? saved.homeworkLabel
              : "",

          readingLevelLabel:
            typeof saved.readingLevelLabel ===
              "string"
              ? saved.readingLevelLabel
              : "",

          readingAccuracyLabel:
            typeof saved.readingAccuracyLabel ===
              "string"
              ? saved.readingAccuracyLabel
              : "",

          readingFluencyLabel:
            typeof saved.readingFluencyLabel ===
              "string"
              ? saved.readingFluencyLabel
              : "",

          readingDiacriticsLabel:
            typeof saved.readingDiacriticsLabel ===
              "string"
              ? saved.readingDiacriticsLabel
              : "",

          readingNote:
            typeof saved.readingNote ===
              "string"
              ? saved.readingNote
              : "",
        });
      } catch (error) {
        console.error(
          "تعذر تحميل متابعة الطالب:",
          error
        );

        setSmartFollowUp(null);
      }
    }

    void loadSmartFollowUp();
  }, []);

  const completedCount =
    completedTasks.length;

  const allTasksCompleted =
    completedCount ===
    dailyTasks.length;

  const progress = useMemo(() => {
    return Math.round(
      (completedCount /
        dailyTasks.length) *
        100
    );
  }, [completedCount]);

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

  const rank =
    points > 0 || stars > 0
      ? "بطل نشيط"
      : "بداية الرحلة";

  async function completeTask(
    taskId: number
  ) {
    if (!user) {
      alert(
        "يرجى تسجيل الدخول من جديد."
      );
      return;
    }

    if (
      completedTasks.includes(taskId)
    ) {
      return;
    }

    if (savingTaskId !== null) {
      return;
    }

    try {
      setSavingTaskId(taskId);

      const token =
        await user.getIdToken();

      const response =
        await fetch(
          "/api/student-journey",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              taskId,
            }),
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
            "تعذر حفظ المهمة."
        );
      }

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
        typeof data.streak ===
        "number"
      ) {
        setStreak(data.streak);
      }

      setCompletedTasks(
        (currentTasks) =>
          currentTasks.includes(
            taskId
          )
            ? currentTasks
            : [
                ...currentTasks,
                taskId,
              ]
      );
    } catch (error) {
      console.error(
        "تعذر إكمال المهمة:",
        error
      );

      alert(
        "تعذر حفظ المهمة ومكافأتها، حاول مرة أخرى."
      );
    } finally {
      setSavingTaskId(null);
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #effbf4 0%, #f7fbff 48%, #fffaf0 100%)",
        fontFamily:
          "Arial, sans-serif",
        color: "#17352a",
        paddingBottom: "50px",
      }}
    >
      <header
        style={{
          background:
            "linear-gradient(135deg, #157347, #239764)",
          color: "white",
          padding: "22px 18px",
          boxShadow:
            "0 6px 20px rgba(20, 90, 60, 0.18)",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 5px",
                fontSize: "14px",
                opacity: 0.9,
              }}
            >
              أكاديمية لغتي الرقمية
            </p>

            <h1
              style={{
                margin: 0,
                fontSize:
                  "clamp(27px, 5vw, 42px)",
              }}
            >
              رحلتي 🚀
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                fontSize: "16px",
                lineHeight: 1.7,
              }}
            >
              نتعلّم… نقرأ… نبدع
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <InstallAppButton />
            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/parent";
              }}
              style={
                headerButtonStyle
              }
            >
              👨‍👩‍👦 ولي الأمر
            </button>

            <button
              type="button"
              onClick={() => {
                const confirmed =
                  window.confirm(
                    "هل تريد تسجيل الخروج؟"
                  );

                if (confirmed) {
                  window.location.href =
                    "/login";
                }
              }}
              style={
                headerButtonStyle
              }
            >
              🚪 تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "22px 16px",
        }}
      >
        {/* الترحيب */}

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
        <div
  style={{
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "#e6f8ed",
    display: "grid",
    placeItems: "center",
    fontSize: "40px",
    flexShrink: 0,
    overflow: "hidden",
    border:
      "3px solid #d5eee1",
  }}
>
  {personalPhotoUrl ? (
    <img
      src={personalPhotoUrl}
      alt="صورة الطالب"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  ) : (
    <span>
      {selectedAvatarIcon}
    </span>
  )}
</div>

            <div>
              <h2
                style={{
                  margin: "0 0 7px",
                  color: "#176c46",
                  fontSize: "23px",
                }}
              >
               {studentName
  ? `أهلاً بك يا ${studentName} 🌟`
  : "أهلاً بك يا بطل! 🌟"}
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#587064",
                  lineHeight: 1.8,
                }}
              >
                فارس سعيد بوجودك
                اليوم، هيا نكمل
                رحلتنا ونحقق إنجازًا
                جديدًا.
              </p>
            </div>
          </div>
        </section>

        {/* أساس لغتي - تنبيه مراجعة المهارات */}
        <Link
          href="/foundation"
          style={{
            display: "block",
            textDecoration: "none",
            color: "inherit",
            marginBottom: "20px",
          }}
        >
          <section
            style={{
              border: "2px solid #a7dfc2",
              background:
                "linear-gradient(135deg, #eafff3 0%, #ffffff 58%, #fff8df 100%)",
              borderRadius: "24px",
              padding: "20px",
              boxShadow: "0 10px 28px rgba(20, 110, 70, 0.10)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: "-18px", left: "-12px", width: "90px", height: "90px", borderRadius: "50%", background: "rgba(34, 197, 94, 0.08)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: "1 1 430px" }}>
                <div style={{ width: "62px", height: "62px", borderRadius: "19px", background: "linear-gradient(135deg, #d8f7e6, #fff4c9)", display: "grid", placeItems: "center", fontSize: "34px", flexShrink: 0, border: "1px solid #c5ead6" }}>🌱</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "5px" }}>
                    <strong style={{ color: "#126b49", fontSize: "21px" }}>راجع معلوماتك واختبر مهاراتك</strong>
                    <span style={{ background: "#fff1b8", color: "#7a5900", padding: "5px 9px", borderRadius: "999px", fontSize: "12px", fontWeight: 900 }}>أساس لغتي</span>
                  </div>
                  <p style={{ margin: 0, color: "#5d7167", lineHeight: 1.8, fontWeight: 700 }}>مهمة قصيرة تساعدك على تقوية مهاراتك السابقة. ابدأ اليوم بمهارة السكون.</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ background: "#ffffff", border: "1px solid #d7e9df", color: "#5c6f65", borderRadius: "13px", padding: "10px 12px", fontWeight: 800, whiteSpace: "nowrap" }}>⏱️ 4 دقائق</span>
                <span style={{ background: "linear-gradient(135deg, #168a63, #0f7654)", color: "#ffffff", borderRadius: "14px", padding: "11px 16px", fontWeight: 900, whiteSpace: "nowrap", boxShadow: "0 6px 14px rgba(22, 138, 99, 0.18)" }}>ابدأ الآن ←</span>
              </div>
            </div>
          </section>
        </Link>

        {/* مستواي اليوم */}

        <section
          style={{
            ...cardStyle,
            border:
              "2px solid #cfe9dd",
            background:
              "linear-gradient(135deg,#ffffff 0%,#effcf6 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
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
                  color: "#126b49",
                  fontSize: "24px",
                }}
              >
                🌟 مستواي اليوم
              </h2>

              <p
                style={{
                  margin: "7px 0 0",
                  color: "#64748b",
                  lineHeight: 1.7,
                }}
              >
                شاهد ما أتقنته وما يمكنني تحسينه.
              </p>
            </div>

            {smartFollowUp?.date && (
              <span
                style={{
                  padding:
                    "7px 12px",
                  borderRadius:
                    "999px",
                  background:
                    "#dcfce7",
                  color: "#08734b",
                  fontWeight: 800,
                  fontSize: "13px",
                }}
              >
                📅{" "}
                {smartFollowUp.date}
              </span>
            )}
          </div>

          {!smartFollowUp ? (
            <div
              style={{
                padding: "18px",
                borderRadius:
                  "18px",
                background:
                  "#f8fafc",
                color: "#64748b",
                textAlign: "center",
                fontWeight: 700,
              }}
            >
              ⏳ لم يسجل المعلم تقييمًا جديدًا حتى الآن.
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: "17px",
                  borderRadius:
                    "20px",
                  background:
                    "#eef8ff",
                  border:
                    "1px solid #d4eafb",
                  marginBottom:
                    "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: "10px",
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
                      color:
                        "#075985",
                    }}
                  >
                    📖 قراءتي
                  </strong>

                  <span
                    style={{
                      background:
                        "#ffffff",
                      borderRadius:
                        "999px",
                      padding:
                        "7px 12px",
                      fontWeight: 900,
                      color:
                        "#075985",
                    }}
                  >
                    {smartFollowUp.readingLevelLabel ||
                      "لم أُقيّم بعد"}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(135px,1fr))",
                    gap: "10px",
                  }}
                >
                  <div
                    style={
                      studentLevelCardStyle
                    }
                  >
                    <span>
                      🎯 الدقة
                    </span>

                    <strong>
                      {smartFollowUp.readingAccuracyLabel ||
                        "لم أُقيّم"}
                    </strong>
                  </div>

                  <div
                    style={
                      studentLevelCardStyle
                    }
                  >
                    <span>
                      ⚡ الطلاقة
                    </span>

                    <strong>
                      {smartFollowUp.readingFluencyLabel ||
                        "لم أُقيّم"}
                    </strong>
                  </div>

                  <div
                    style={
                      studentLevelCardStyle
                    }
                  >
                    <span>
                      🎨 الحركات
                    </span>

                    <strong>
                      {smartFollowUp.readingDiacriticsLabel ||
                        "لم أُقيّم"}
                    </strong>
                  </div>
                </div>

                {smartFollowUp.readingNote && (
                  <div
                    style={{
                      marginTop:
                        "12px",
                      padding:
                        "13px",
                      background:
                        "#ffffff",
                      borderRadius:
                        "15px",
                      color:
                        "#475569",
                      lineHeight: 1.8,
                      fontWeight: 700,
                    }}
                  >
                    💬 معلمي يقول:{" "}
                    {
                      smartFollowUp.readingNote
                    }
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: "17px",
                  borderRadius:
                    "20px",
                  background:
                    "#fff8e7",
                  border:
                    "1px solid #f0dfae",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    color:
                      "#8a5b00",
                    marginBottom:
                      "8px",
                    fontSize:
                      "18px",
                  }}
                >
                  📝 إنجاز واجبي
                </strong>

                <div
                  style={{
                    fontWeight: 900,
                    color:
                      "#735316",
                    lineHeight: 1.8,
                  }}
                >
                  {smartFollowUp.homeworkLabel ||
                    "لم تُسجل متابعة الواجب بعد"}
                </div>
              </div>

              <div
                style={{
                  marginTop: "14px",
                  padding: "15px",
                  borderRadius:
                    "18px",
                  background:
                    "linear-gradient(135deg,#eaf9f1,#ffffff)",
                  border:
                    "1px solid #cfead9",
                  color: "#176c46",
                  lineHeight: 1.8,
                  fontWeight: 800,
                }}
              >
                🦸 فارس يقول: استمر يا بطل! كل تدريب صغير اليوم يجعلك قارئًا أقوى غدًا. 🌟
              </div>
            </>
          )}
        </section>

        {errorMessage && (
          <section
            style={{
              ...cardStyle,
              background: "#fff7ed",
              color: "#9a3412",
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            {errorMessage}
          </section>
        )}

        {/* مدرستي اليوم */}

        <section
          style={{
            ...cardStyle,
            padding: "20px",
            border:
              "2px solid #cdeee0",
            background:
              "linear-gradient(135deg, #f0fff7, #f7fbff)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 6px",
                  color: "#126b49",
                  fontSize: "24px",
                }}
              >
                🏫 مدرستي اليوم
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#627168",
                  lineHeight: 1.7,
                }}
              >
                اعرف جدولك، وتابع حصتك الحالية والقادمة بسهولة.
              </p>
            </div>

            <span
              style={{
                background: "#dcfce7",
                color: "#08734b",
                padding: "8px 13px",
                borderRadius:
                  "999px",
                fontWeight: 800,
                fontSize: "14px",
              }}
            >
              يوم منظم ✨
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "14px",
            }}
          >
            <Link
              href="/school-day"
              style={{
                textDecoration:
                  "none",
                color: "#17352a",
                background:
                  "linear-gradient(135deg, #e8fff2, #ffffff)",
                border:
                  "2px solid #9ee3bf",
                borderRadius:
                  "20px",
                padding: "18px",
                display: "flex",
                alignItems:
                  "center",
                gap: "15px",
                boxShadow:
                  "0 6px 16px rgba(20, 100, 70, 0.07)",
              }}
            >
              <span
                style={{
                  width: "55px",
                  height: "55px",
                  borderRadius:
                    "17px",
                  background:
                    "#d7f7e6",
                  display: "grid",
                  placeItems:
                    "center",
                  fontSize: "30px",
                  flexShrink: 0,
                }}
              >
                ⏰
              </span>

              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "20px",
                    color: "#126b49",
                    marginBottom:
                      "5px",
                  }}
                >
                  يومي الدراسي
                </strong>

                <span
                  style={{
                    color: "#64756d",
                    lineHeight: 1.6,
                  }}
                >
                  الحصة الحالية، القادمة، وبقية اليوم
                </span>
              </div>
            </Link>

     <Link
  href="/school-schedule"
  style={{
    textDecoration: "none",
    color: "#17352a",
    background:
      "linear-gradient(135deg, #edf6ff, #ffffff)",
    border: "2px solid #b9d9f5",
    borderRadius: "20px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow:
      "0 6px 16px rgba(40, 90, 130, 0.07)",
  }}
>
  <span
    style={{
      width: "55px",
      height: "55px",
      borderRadius: "17px",
      background: "#dceeff",
      display: "grid",
      placeItems: "center",
      fontSize: "30px",
      flexShrink: 0,
    }}
  >
    📅
  </span>

  <div>
    <strong
      style={{
        display: "block",
        fontSize: "20px",
        color: "#185b89",
        marginBottom: "5px",
      }}
    >
      جدولي المدرسي
    </strong>

    <span
      style={{
        color: "#64748b",
        lineHeight: 1.6,
      }}
    >
      شاهد حصص الأسبوع كاملة في مكان واحد
    </span>
  </div>
</Link>

<Link
  href="/madrasati-bridge"
  style={{
    textDecoration: "none",
    color: "#17352a",
    background:
      "linear-gradient(135deg, #fff7e8, #ffffff)",
    border: "2px solid #f4d39a",
    borderRadius: "20px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow:
      "0 6px 16px rgba(130, 90, 20, 0.07)",
  }}
>
  <span
    style={{
      width: "55px",
      height: "55px",
      borderRadius: "17px",
      background: "#fff0cf",
      display: "grid",
      placeItems: "center",
      fontSize: "30px",
      flexShrink: 0,
    }}
  >
    🌉
  </span>

  <div>
    <strong
      style={{
        display: "block",
        fontSize: "20px",
        color: "#9a6400",
        marginBottom: "5px",
      }}
    >
      جسر مدرستي
    </strong>

    <span
      style={{
        color: "#6f746f",
        lineHeight: 1.6,
      }}
    >
      أنجز مهامك في مدرستي ثم عد للأكاديمية
    </span>
  </div>
</Link>
          </div>
        </section>

        {/* الإحصاءات */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          <StatCard
            icon="⭐"
            title="نقاطي"
            value={
              loading
                ? "..."
                : String(points)
            }
          />

          <StatCard
            icon="🔥"
            title="سلسلة الإنجاز"
            value={
              loading
                ? "..."
                : `${streak} ${
                    streak === 1
                      ? "يوم"
                      : "أيام"
                  }`
            }
          />

          <StatCard
            icon="👑"
            title="رتبتي"
            value={
              loading
                ? "..."
                : rank
            }
          />
        </section>
{/* تاج لغتي */}

<section
  style={{
    ...cardStyle,
    border: "2px solid #edc84d",
    background:
      "linear-gradient(135deg,#fff7c9 0%,#fffdf2 55%,#ffffff 100%)",
    position: "relative",
    overflow: "hidden",
  }}
>
  <div
    style={{
      position: "absolute",
      top: "12px",
      left: "18px",
      fontSize: "30px",
      opacity: 0.35,
    }}
  >
    ✨
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "14px",
      flexWrap: "wrap",
      marginBottom: "18px",
    }}
  >
    <div>
      <h2
        style={{
          margin: "0 0 6px",
          color: "#805b00",
          fontSize: "25px",
        }}
      >
        👑 تاج لغتي
      </h2>

      <p
        style={{
          margin: 0,
          color: "#7f7147",
          lineHeight: 1.7,
        }}
      >
        هنا أحتفظ بتيجاني وإنجازاتي في القراءة والإملاء.
      </p>
    </div>

    <Link
      href="/lughati-crown"
      style={{
        textDecoration: "none",
        padding: "10px 15px",
        borderRadius: "14px",
        background: "#8a6500",
        color: "#ffffff",
        fontWeight: 900,
      }}
    >
      شاهد تيجاني ←
    </Link>
  </div>

  {crownLoading ? (
    <div
      style={{
        padding: "18px",
        borderRadius: "18px",
        background: "rgba(255,255,255,.65)",
        textAlign: "center",
        color: "#8a783e",
        fontWeight: 800,
      }}
    >
      ⏳ جارٍ تجهيز تيجاني...
    </div>
  ) : (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(150px,1fr))",
          gap: "11px",
        }}
      >
        <div style={crownStatStyle}>
          <span
            style={{
              fontSize: "29px",
            }}
          >
            📖👑
          </span>

          <strong>
            {readingKingCount}
          </strong>

          <small>
            تاج قراءة
          </small>
        </div>

        <div style={crownStatStyle}>
          <span
            style={{
              fontSize: "29px",
            }}
          >
            ✍️👑
          </span>

          <strong>
            {spellingKingCount}
          </strong>

          <small>
            تاج إملاء
          </small>
        </div>

        <div style={crownStatStyle}>
          <span
            style={{
              fontSize: "29px",
            }}
          >
            💎
          </span>

          <strong>
            {masteryCount}
          </strong>

          <small>
            إتقان كامل
          </small>
        </div>
      </div>

      {latestCrownAchievement ? (
        <div
          style={{
            marginTop: "14px",
            padding: "15px",
            borderRadius: "18px",
            background: "#ffffff",
            border: "1px solid #edd88a",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              background: "#fff8d9",
              border: "2px solid #e6bf3d",
              fontSize: "31px",
              flexShrink: 0,
            }}
          >
            {latestCrownAchievement.personalPhotoUrl ? (
              <img
                src={
                  latestCrownAchievement.personalPhotoUrl
                }
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span>
                {latestCrownAchievement.selectedAvatarIcon ||
                  selectedAvatarIcon}
              </span>
            )}
          </div>

          <div>
            <div
              style={{
                color: "#8a6500",
                fontWeight: 900,
                fontSize: "17px",
              }}
            >
              {
                latestCrownAchievement.kingTitle
              }
            </div>

            <div
              style={{
                marginTop: "4px",
                color: "#6c705f",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              في درس:{" "}
              {
                latestCrownAchievement.lessonName
              }
            </div>

            {latestCrownAchievement.fullMastery && (
              <div
                style={{
                  marginTop: "5px",
                  color: "#16724d",
                  fontSize: "13px",
                  fontWeight: 900,
                }}
              >
                💎 إتقان كامل للدرس
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            marginTop: "14px",
            padding: "15px",
            textAlign: "center",
            borderRadius: "18px",
            background: "rgba(255,255,255,.6)",
            color: "#8b7a46",
            fontWeight: 800,
          }}
        >
          🌱 ابدأ رحلتك نحو أول تاج في القراءة أو الإملاء.
        </div>
      )}
    </>
  )}
</section>
        {allTasksCompleted && (
          <section
            style={{
              background:
                "linear-gradient(135deg, #fff4bd, #fffdf2)",
              border:
                "3px solid #f3c94f",
              borderRadius: "26px",
              padding: "26px 20px",
              marginBottom: "22px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "46px",
                marginBottom: "10px",
              }}
            >
              🎉 ⭐ 🏅 ⭐ 🎉
            </div>

            <h2
              style={{
                margin: "0 0 10px",
                color: "#8a6500",
              }}
            >
              أحسنت يا بطل!
            </h2>

            <p
              style={{
                margin: 0,
                color: "#6f5a1c",
                lineHeight: 1.8,
              }}
            >
              أكملت جميع مهام اليوم
              وحصلت على مكافأة النشاط اليومي:
              <strong>
                {" "}
                10 نقاط و3 نجوم 🏅
              </strong>
            </p>
          </section>
        )}

        {/* تقدمي اليوم */}

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "14px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 5px",
                  fontSize: "24px",
                  color: "#176c46",
                }}
              >
                🌟 تقدمي اليوم
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#687b72",
                }}
              >
                أنجزت{" "}
                {completedCount} من{" "}
                {dailyTasks.length} مهام
              </p>
            </div>

            <strong
              style={{
                background: "#e7f8ee",
                color: "#157347",
                padding: "9px 14px",
                borderRadius: "20px",
                fontSize: "18px",
              }}
            >
              {progress}%
            </strong>
          </div>

          <div
            style={{
              width: "100%",
              height: "18px",
              background: "#e5eee9",
              borderRadius:
                "999px",
              overflow: "hidden",
              marginBottom: "22px",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg, #25a765, #64d58f)",
                borderRadius:
                  "999px",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {dailyTasks.map(
              (task) => {
                const completed =
                  completedTasks.includes(
                    task.id
                  );

                return (
                  <button
                    key={task.id}
                    type="button"
                    disabled={
                      completed ||
                      savingTaskId !==
                        null ||
                      loading
                    }
                    onClick={() =>
                      completeTask(
                        task.id
                      )
                    }
                    style={{
                      width: "100%",
                      border:
                        completed
                          ? "2px solid #3bb978"
                          : "2px solid #e3ece7",
                      background:
                        completed
                          ? "#edfbf3"
                          : "#ffffff",
                      borderRadius:
                        "18px",
                      padding: "15px",
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: "12px",
                      cursor:
                        completed
                          ? "default"
                          : "pointer",
                      textAlign:
                        "right",
                      color: "#17352a",
                      opacity:
                        savingTaskId !==
                          null &&
                        savingTaskId !==
                          task.id
                          ? 0.7
                          : 1,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          width: "42px",
                          height:
                            "42px",
                          display:
                            "grid",
                          placeItems:
                            "center",
                          borderRadius:
                            "13px",
                          background:
                            completed
                              ? "#c9f1d9"
                              : "#f3f7f5",
                          fontSize:
                            "23px",
                        }}
                      >
                        {completed
                          ? "✅"
                          : task.icon}
                      </span>

                      <span>
                        <strong
                          style={{
                            display:
                              "block",
                            fontSize:
                              "17px",
                            marginBottom:
                              "5px",
                          }}
                        >
                          {task.title}
                        </strong>

                        <small
                          style={{
                            color:
                              "#718077",
                          }}
                        >
                          المكافأة:{" "}
                          {task.reward}
                        </small>
                      </span>
                    </span>

                    <span
                      style={{
                        fontSize:
                          "22px",
                      }}
                    >
                      {savingTaskId ===
                      task.id
                        ? "⏳"
                        : completed
                          ? "🌟"
                          : "⬜"}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* المكافأة والسلسلة */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={
              rewardCardStyle
            }
          >
            <div
              style={{
                fontSize: "36px",
                marginBottom: "8px",
              }}
            >
              🎁
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                color: "#7b5c00",
              }}
            >
              {allTasksCompleted
                ? "تم فتح المكافأة 🎉"
                : "المكافأة القادمة"}
            </h3>

            <p
              style={{
                margin: 0,
                lineHeight: 1.8,
                color: "#6e623a",
              }}
            >
              {allTasksCompleted
                ? "أحسنت! حصلت على مكافأة النشاط اليومي."
                : `بقيت لك ${
                    dailyTasks.length -
                    completedCount
                  } مهام لإكمال تحدي اليوم.`}
            </p>
          </div>

          <div
            style={
              streakCardStyle
            }
          >
            <div
              style={{
                fontSize: "36px",
                marginBottom: "8px",
              }}
            >
              🔥
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                color: "#a34025",
              }}
            >
              سلسلة الإنجاز
            </h3>

            <p
              style={{
                margin: 0,
                lineHeight: 1.8,
                color: "#795044",
              }}
            >
              {streak > 0 ? (
                <>
                  أنت مستمر منذ{" "}
                  <strong>
                    {streak} أيام
                  </strong>
                  . واصل تألقك يا بطل!
                </>
              ) : (
                <>
                  ابدأ اليوم أول خطوة
                  في سلسلة إنجازك 🔥
                </>
              )}
            </p>
          </div>
        </section>

        {/* رحلة القراءة */}

        <section style={cardStyle}>
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
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 900,
                  color: "#0f6b52",
                }}
              >
                🔥 رحلة القراءة
              </div>

              <div
                style={{
                  marginTop: "6px",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                اقرأ في 5 أيام لتحصل
                على 50 نقطة
              </div>
            </div>

            <div
              style={{
                background: "#ecfdf5",
                color: "#047857",
                padding: "8px 14px",
                borderRadius:
                  "999px",
                fontWeight: 900,
              }}
            >
              {
                displayedReadingProgress
              }{" "}
              / 5
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
                      "11px 4px",
                    borderRadius:
                      "14px",
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
                      "21px",
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

          <div
            style={{
              textAlign: "center",
              fontWeight: 800,
              color: "#475569",
            }}
          >
            {displayedReadingProgress ===
            5
              ? "🎉 أكملت خمسة أيام قراءة وحصلت على المكافأة!"
              : remainingReadingDays ===
                  1
                ? "🔥 بقي يوم واحد فقط لتحصل على +50 نقطة!"
                : `بقيت ${remainingReadingDays} أيام لتحصل على +50 نقطة 🎁`}
          </div>
        </section>

        {/* المحطات */}

        <section>
          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <h2
              style={{
                margin: "0 0 6px",
                fontSize: "25px",
                color: "#176c46",
              }}
            >
              🗺️ محطات رحلتي
            </h2>

            <p
              style={{
                margin: 0,
                color: "#687b72",
              }}
            >
              اختر المحطة التي ترغب في زيارتها
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            {journeyCards.map(
              (card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  style={{
                    textDecoration:
                      "none",
                    color: "#17352a",
                    background:
                      card.background,
                    borderRadius:
                      "23px",
                    padding: "21px",
                    minHeight:
                      "150px",
                    border:
                      "2px solid rgba(255,255,255,0.85)",
                    boxShadow:
                      "0 8px 22px rgba(40, 80, 65, 0.08)",
                    display: "flex",
                    flexDirection:
                      "column",
                    justifyContent:
                      "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "39px",
                    }}
                  >
                    {card.icon}
                  </span>

                  <div>
                    <h3
                      style={{
                        margin:
                          "12px 0 7px",
                        fontSize:
                          "21px",
                      }}
                    >
                      {card.title}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color:
                          "#627168",
                        lineHeight:
                          1.7,
                      }}
                    >
                      {
                        card.description
                      }
                    </p>
                  </div>
                </Link>
              )
            )}
          </div>
        </section>

        <footer
          style={{
            textAlign: "center",
            marginTop: "35px",
            color: "#6a7b72",
            fontSize: "14px",
            lineHeight: 1.9,
          }}
        >
          <strong>
            أكاديمية لغتي الرقمية
          </strong>
          <br />
          بإشراف الأستاذ / إبراهيم أحمد
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "20px",
        padding: "17px",
        textAlign: "center",
        boxShadow:
          "0 8px 22px rgba(38, 105, 75, 0.08)",
        border:
          "1px solid #e5f1ea",
      }}
    >
      <div
        style={{
          fontSize: "31px",
          marginBottom: "7px",
        }}
      >
        {icon}
      </div>

      <p
        style={{
          margin: "0 0 6px",
          color: "#718077",
          fontSize: "14px",
        }}
      >
        {title}
      </p>

      <strong
        style={{
          color: "#176c46",
          fontSize: "19px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

const cardStyle = {
  background: "white",
  borderRadius: "25px",
  padding: "22px",
  marginBottom: "20px",
  boxShadow:
    "0 10px 28px rgba(38, 105, 75, 0.1)",
};

const headerButtonStyle = {
  background: "white",
  color: "#157347",
  padding: "12px 18px",
  borderRadius: "16px",
  fontWeight: "bold",
  boxShadow:
    "0 5px 12px rgba(0,0,0,0.12)",
  border: "none",
  cursor: "pointer",
};

const rewardCardStyle = {
  background:
    "linear-gradient(135deg, #fff8d8, #fffdf1)",
  border: "2px solid #f6da66",
  borderRadius: "24px",
  padding: "20px",
};

const streakCardStyle = {
  background:
    "linear-gradient(135deg, #ffece8, #fff8f5)",
  border: "2px solid #ffbcae",
  borderRadius: "24px",
  padding: "20px",
};

const studentLevelCardStyle = {
  background: "#ffffff",
  borderRadius: "15px",
  padding: "13px",
  display: "grid",
  gap: "6px",
  textAlign: "center" as const,
  color: "#475569",
};
const crownStatStyle = {
  background:
    "rgba(255,255,255,.82)",
  border:
    "1px solid #ead487",
  borderRadius:
    "17px",
  padding:
    "14px",
  textAlign:
    "center" as const,
  display:
    "grid",
  gap:
    "5px",
  color:
    "#7c620d",
};