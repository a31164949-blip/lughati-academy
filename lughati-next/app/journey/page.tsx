"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const journeyCards = [
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
    icon: "🗓️",
    title: "الخطة الأسبوعية",
    description: "تعرّف على مهام الأسبوع",
    href: "/weekly-plan",
    background: "#e9f9ee",
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
    description: "شاهد أبطال الأكاديمية",
    href: "/honor-board",
    background: "#fff8d8",
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

export default function JourneyPage() {
  const [completedTasks, setCompletedTasks] = useState<number[]>([1]);

  const completedCount = completedTasks.length;
  const allTasksCompleted = completedCount === dailyTasks.length;

  const progress = useMemo(() => {
    return Math.round((completedCount / dailyTasks.length) * 100);
  }, [completedCount]);

  function toggleTask(taskId: number) {
    setCompletedTasks((currentTasks) =>
      currentTasks.includes(taskId)
        ? currentTasks.filter((id) => id !== taskId)
        : [...currentTasks, taskId]
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #effbf4 0%, #f7fbff 48%, #fffaf0 100%)",
        fontFamily: "Arial, sans-serif",
        color: "#17352a",
        paddingBottom: "50px",
      }}
    >
      <header
        style={{
          background: "linear-gradient(135deg, #157347, #239764)",
          color: "white",
          padding: "22px 18px",
          boxShadow: "0 6px 20px rgba(20, 90, 60, 0.18)",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
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
                fontSize: "clamp(27px, 5vw, 42px)",
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

          <Link
            href="/student/profile"
            style={{
              textDecoration: "none",
              background: "white",
              color: "#157347",
              padding: "12px 18px",
              borderRadius: "16px",
              fontWeight: "bold",
              boxShadow: "0 5px 12px rgba(0,0,0,0.12)",
            }}
          >
            👤 ملفي
          </Link>
        </div>
      </header>

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "22px 16px",
        }}
      >
        <section
          style={{
            background: "white",
            borderRadius: "25px",
            padding: "22px",
            marginBottom: "20px",
            boxShadow: "0 10px 28px rgba(38, 105, 75, 0.1)",
            border: "1px solid #dcf2e5",
          }}
        >
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
                فارس سعيد بوجودك اليوم، هيا نكمل رحلتنا ونحقق إنجازًا
                جديدًا.
              </p>
            </div>
          </div>
        </section>

        {allTasksCompleted && (
  <section
    style={{
      background:
        "linear-gradient(135deg, #fff4bd, #fffdf2)",
      border: "3px solid #f3c94f",
      borderRadius: "26px",
      padding: "26px 20px",
      marginBottom: "22px",
      textAlign: "center",
      boxShadow:
        "0 12px 30px rgba(165, 125, 15, 0.18)",
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
        fontSize: "27px",
      }}
    >
      أحسنت يا بطل!
    </h2>

    <p
      style={{
        margin: "0 0 16px",
        color: "#6f5a1c",
        lineHeight: 1.8,
        fontSize: "17px",
      }}
    >
      أكملت جميع مهام اليوم وحصلت على
      <strong> وسام النشاط اليومي</strong>.
    </p>

    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "10px 16px",
          color: "#157347",
          fontWeight: "bold",
          boxShadow: "0 5px 12px rgba(0,0,0,0.08)",
        }}
      >
        ⭐ +3 نجوم
      </span>

      <span
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "10px 16px",
          color: "#157347",
          fontWeight: "bold",
          boxShadow: "0 5px 12px rgba(0,0,0,0.08)",
        }}
      >
        💎 +10 نقاط
      </span>

      <span
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "10px 16px",
          color: "#8a6500",
          fontWeight: "bold",
          boxShadow: "0 5px 12px rgba(0,0,0,0.08)",
        }}
      >
        🏅 وسام جديد
      </span>
    </div>
  </section>
)}
        
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          <StatCard icon="⭐" title="نجومي" value="12" />
          <StatCard icon="💎" title="نقاطي" value="35" />
          <StatCard icon="🔥" title="سلسلة الإنجاز" value="3 أيام" />
          <StatCard icon="👑" title="رتبتي" value="بطل نشيط" />
        </section>

        <section
          style={{
            background: "white",
            borderRadius: "25px",
            padding: "22px",
            marginBottom: "20px",
            boxShadow: "0 10px 28px rgba(38, 105, 75, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
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
                أنجزت {completedCount} من {dailyTasks.length} مهام
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
              borderRadius: "999px",
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
                borderRadius: "999px",
                transition: "width 0.35s ease",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {dailyTasks.map((task) => {
              const completed = completedTasks.includes(task.id);

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  style={{
                    width: "100%",
                    border: completed
                      ? "2px solid #3bb978"
                      : "2px solid #e3ece7",
                    background: completed ? "#edfbf3" : "#ffffff",
                    borderRadius: "18px",
                    padding: "15px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    textAlign: "right",
                    color: "#17352a",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        width: "42px",
                        height: "42px",
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "13px",
                        background: completed ? "#c9f1d9" : "#f3f7f5",
                        fontSize: "23px",
                      }}
                    >
                      {completed ? "✅" : task.icon}
                    </span>

                    <span>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "17px",
                          marginBottom: "5px",
                          textDecoration: completed
                            ? "line-through"
                            : "none",
                        }}
                      >
                        {task.title}
                      </strong>

                      <small
                        style={{
                          color: "#718077",
                        }}
                      >
                        المكافأة: {task.reward}
                      </small>
                    </span>
                  </span>

                  <span
                    style={{
                      fontSize: "22px",
                    }}
                  >
                    {completed ? "🌟" : "⬜"}
                  </span>
                </button>
              );
            })}
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
            style={{
              background: "linear-gradient(135deg, #fff8d8, #fffdf1)",
              border: "2px solid #f6da66",
              borderRadius: "24px",
              padding: "20px",
              boxShadow: "0 8px 22px rgba(125, 100, 20, 0.08)",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>
              🎁
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                color: "#7b5c00",
                fontSize: "21px",
              }}
            >
              المكافأة القادمة
            </h3>

            <p
              style={{
                margin: 0,
                lineHeight: 1.8,
                color: "#6e623a",
              }}
            >
              بقيت لك{" "}
              <strong>{dailyTasks.length - completedCount} مهام</strong>{" "}
              لتحصل على وسام النشاط اليومي.
            </p>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #ffece8, #fff8f5)",
              border: "2px solid #ffbcae",
              borderRadius: "24px",
              padding: "20px",
              boxShadow: "0 8px 22px rgba(150, 70, 45, 0.08)",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>
              🔥
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                color: "#a34025",
                fontSize: "21px",
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
              أنت مستمر منذ <strong>3 أيام متتالية</strong>. واصل
              تألقك يا بطل!
            </p>
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
            {journeyCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                style={{
                  textDecoration: "none",
                  color: "#17352a",
                  background: card.background,
                  borderRadius: "23px",
                  padding: "21px",
                  minHeight: "150px",
                  border: "2px solid rgba(255,255,255,0.85)",
                  boxShadow: "0 8px 22px rgba(40, 80, 65, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "39px",
                  }}
                >
                  {card.icon}
                </span>

                <div>
                  <h3
                    style={{
                      margin: "12px 0 7px",
                      fontSize: "21px",
                    }}
                  >
                    {card.title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#627168",
                      lineHeight: 1.7,
                    }}
                  >
                    {card.description}
                  </p>
                </div>
              </Link>
            ))}
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
          <strong>أكاديمية لغتي الرقمية</strong>
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
        boxShadow: "0 8px 22px rgba(38, 105, 75, 0.08)",
        border: "1px solid #e5f1ea",
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
