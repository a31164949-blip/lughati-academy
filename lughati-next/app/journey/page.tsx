"use client";

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
import { auth } from "../../firebase";

const journeyCards = [
  {
    icon: "🏡",
    title: "مدينة الإنجاز",
    description: "ابنِ مدينتك مع كل تقدم جديد",
    href: "/journey/city",
    background: "#fff7d6",
  },
  {
    icon: "📚",
    title: "الدروس",
    description: "تعلّم واقرأ واستمتع",
    href: "/lessons",
    background: "#e8f2ff",
  },
  {
    icon: "📝",
    title: "واجباتي",
    description: "أنجز واجباتك اليومية",
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
    description: "تعرّف على مهام الأسبوع",
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
    description: "تدريبات تساعدني على التقدم",
    href: "/support",
    background: "#f2ebff",
  },
  {
      
    icon: "🏆",
    title: "لوحة الشرف",
    description: "شاهد أوسمتك وألقابك وإنجازاتك المميزة",
    href: "/honor-board",
    background: "#fff8d8",
  },
  {
    icon: "🌟",
    title: "أبطال الأكاديمية",
    description: "شاهد أبطال القراءة والإملاء والإنجاز",
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
    description: "أرسل صوتًا أو صورة أو فيديو",
    href: "/upload",
    background: "#e9fbff",
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
  completedTaskIds?: number[];
  message?: string;
};

export default function JourneyPage() {
  const [user, setUser] =
    useState<User | null>(null);

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

  const [completedTasks, setCompletedTasks] =
    useState<number[]>([]);

  const [savingTaskId, setSavingTaskId] =
    useState<number | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

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

        const response = await fetch(
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
          typeof data.points === "number"
            ? data.points
            : 0
        );

        setStars(
          typeof data.stars === "number"
            ? data.stars
            : 0
        );

        setStreak(
          typeof data.streak === "number"
            ? data.streak
            : 0
        );

        setReadingDays(
          typeof data.readingDays ===
            "number"
            ? data.readingDays
            : 0
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
      completedTasks.includes(
        taskId
      )
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

      const response = await fetch(
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
              }}
            >
              🧒🏻
            </div>

            <div>
              <h2
                style={{
                  margin: "0 0 7px",
                  color: "#176c46",
                  fontSize: "23px",
                }}
              >
                أهلاً بك يا بطل!
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
                اعرف جدولك، وتابع
                حصتك الحالية والقادمة
                بسهولة.
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
                  الحصة الحالية،
                  القادمة، وبقية اليوم
                </span>
              </div>
            </Link>

            <Link
              href="/school-schedule"
              style={{
                textDecoration:
                  "none",
                color: "#17352a",
                background:
                  "linear-gradient(135deg, #edf6ff, #ffffff)",
                border:
                  "2px solid #b9d9f5",
                borderRadius:
                  "20px",
                padding: "18px",
                display: "flex",
                alignItems:
                  "center",
                gap: "15px",
                boxShadow:
                  "0 6px 16px rgba(40, 90, 130, 0.07)",
              }}
            >
              <span
                style={{
                  width: "55px",
                  height: "55px",
                  borderRadius:
                    "17px",
                  background:
                    "#dceeff",
                  display: "grid",
                  placeItems:
                    "center",
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
                    marginBottom:
                      "5px",
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
                  شاهد حصص الأسبوع
                  كاملة في مكان واحد
                </span>
              </div>
            </Link>
          </div>
        </section>

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
              وحصلت على مكافأة النشاط
              اليومي:
              <strong>
                {" "}
                10 نقاط و3 نجوم 🏅
              </strong>
            </p>
          </section>
        )}

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
              اختر المحطة التي ترغب
              في زيارتها
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