"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type LessonTwoStation =
  | "reading"
  | "comprehension"
  | "words"
  | "language"
  | "spelling"
  | "writing";

const STORAGE_KEY =
  "lughati-unit1-lesson2-progress";

const LESSON_COMPLETED_KEY =
  "lughati-unit1-lesson2-completed";

type Station = {
  id: LessonTwoStation;
  number: number;
  icon: string;
  title: string;
  description: string;
  href: string;
  color: string;
  light: string;
  button: string;
};

const stations: Station[] = [
  {
    id: "reading",
    number: 1,
    icon: "📖",
    title: "رحلة القراءة",
    description:
      "اقرأ قصة عذرًا يا جدي، وتعرّف إلى موقف فواز وسبب ندمه وما نصحه به معلمه.",
    href: "/lessons/unit1/lesson2/read",
    color: "#087a55",
    light: "#eaf9f2",
    button: "#08a16f",
  },
  {
    id: "comprehension",
    number: 2,
    icon: "🧠",
    title: "أفهم وأستنتج",
    description:
      "أجب عن أسئلة القصة، وحدد الخطأ الذي وقع فيه فواز وما الذي تعلمه من الموقف.",
    href: "/lessons/unit1/lesson2/comprehension",
    color: "#0878b5",
    light: "#eef8ff",
    button: "#098fd4",
  },
  {
    id: "words",
    number: 3,
    icon: "💎",
    title: "كنز الكلمات",
    description:
      "اكتشف معاني كلمات مثل: عطوف، تعتذر، طاعة، وصحب، وتدرّب على استخدامها.",
    href: "/lessons/unit1/lesson2/words",
    color: "#a65c00",
    light: "#fff9e9",
    button: "#f59a00",
  },
  {
    id: "language",
    number: 4,
    icon: "🔎",
    title: "مكتشف اللغة",
    description:
      "تدرّب على التنوين، والتاء المفتوحة والمربوطة، والهاء، واللام الشمسية والقمرية.",
    href: "/lessons/unit1/lesson2/language",
    color: "#7021d4",
    light: "#f6f1ff",
    button: "#8125f5",
  },
  {
    id: "spelling",
    number: 5,
    icon: "✍️",
    title: "إملائي الجميل",
    description:
      "تدرّب على جمل الدرس وكلماته، ثم اختبر نفسك في الكتابة الصحيحة.",
    href: "/lessons/unit1/lesson2/spelling",
    color: "#c9003c",
    light: "#fff1f4",
    button: "#ff2051",
  },
  {
    id: "writing",
    number: 6,
    icon: "🖊️",
    title: "أكتب وأستخدم",
    description:
      "تدرّب على استخدام «إنَّ» وتحويل الجمل، واكتب جملًا تعبّر عن الاعتذار وطاعة الجد.",
    href: "/lessons/unit1/lesson2/writing",
    color: "#087d76",
    light: "#edfafa",
    button: "#079b90",
  },
];

function getProgress(): LessonTwoStation[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is LessonTwoStation =>
        [
          "reading",
          "comprehension",
          "words",
          "language",
          "spelling",
          "writing",
        ].includes(item)
    );
  } catch {
    return [];
  }
}

export default function LessonTwoPage() {
  const [
    completed,
    setCompleted,
  ] = useState<
    LessonTwoStation[]
  >([]);

  useEffect(() => {
    function loadProgress() {
      setCompleted(
        getProgress()
      );
    }

    loadProgress();

    window.addEventListener(
      "focus",
      loadProgress
    );

    window.addEventListener(
      "pageshow",
      loadProgress
    );

    return () => {
      window.removeEventListener(
        "focus",
        loadProgress
      );

      window.removeEventListener(
        "pageshow",
        loadProgress
      );
    };
  }, []);

  const completedCount =
    completed.length;

  const progress =
    useMemo(() => {
      return Math.round(
        (completedCount /
          stations.length) *
          100
      );
    }, [completedCount]);

  const challengeUnlocked =
    completedCount ===
    stations.length;

  useEffect(() => {
    if (
      challengeUnlocked
    ) {
      localStorage.setItem(
        LESSON_COMPLETED_KEY,
        "true"
      );
    }
  }, [challengeUnlocked]);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f7f3fb 0%,#f5fbff 52%,#fffaf0 100%)",
        padding:
          "28px 16px 60px",
        fontFamily:
          "Arial, sans-serif",
        color: "#173f32",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        {/* رأس الدرس */}

        <header
          style={{
            background:
              "linear-gradient(135deg,#ffffff,#faf6ff,#fff9e6)",
            borderRadius: 30,
            padding:
              "28px 24px",
            border:
              "1px solid #e7dced",
            boxShadow:
              "0 12px 35px rgba(90,50,110,.08)",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color: "#7a4d9b",
                  fontWeight: 900,
                  marginBottom: 8,
                }}
              >
                أكاديمية لغتي
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize:
                    "clamp(30px,5vw,46px)",
                  color: "#5d3478",
                }}
              >
                👴🏻 الدرس الثاني: عذرًا يا جدي
              </h1>

              <p
                style={{
                  maxWidth: 760,
                  color: "#6f6b73",
                  lineHeight: 1.9,
                  fontSize: 17,
                  marginBottom: 0,
                }}
              >
                نتعلم من قصة فواز أهمية طاعة الكبير،
                والاعتذار عند الخطأ، وطلب السماح،
                واحترام الجد والإحسان إليه.
              </p>
            </div>

            <Link
              href="/lessons/unit1"
              style={{
                textDecoration: "none",
                background: "#ffffff",
                color: "#70428e",
                border:
                  "1px solid #e0d3e8",
                borderRadius: 16,
                padding:
                  "12px 18px",
                fontWeight: 900,
              }}
            >
              ← العودة إلى الوحدة
            </Link>
          </div>

          {/* التقدم */}

          <div
            style={{
              marginTop: 28,
              background:
                "#faf8fb",
              borderRadius: 20,
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 11,
              }}
            >
              <strong
                style={{
                  color: "#70428e",
                }}
              >
                🚗 تقدمك في الدرس
              </strong>

              <strong
                style={{
                  color: "#70428e",
                }}
              >
                {completedCount} من 6 — {progress}%
              </strong>
            </div>

            <div
              style={{
                height: 16,
                borderRadius: 999,
                background: "#ece6ef",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width:
                    `${progress}%`,
                  background:
                    "linear-gradient(90deg,#8b5cab,#c28ad8)",
                  transition:
                    "width .5s ease",
                }}
              />
            </div>

            {challengeUnlocked && (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 15,
                  padding: 12,
                  background:
                    "#fff7d8",
                  border:
                    "1px solid #f1d36b",
                  textAlign: "center",
                  color: "#806000",
                  fontWeight: 900,
                }}
              >
                🎉 أحسنت! أكملت المحطات الست وفتحت التحدي الختامي.
              </div>
            )}
          </div>
        </header>

        {/* عنوان الرحلة */}

        <section
          style={{
            marginBottom: 22,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#694188",
              fontSize:
                "clamp(25px,4vw,34px)",
            }}
          >
            🗺️ رحلتي في «عذرًا يا جدي»
          </h2>

          <p
            style={{
              color: "#6d7772",
              lineHeight: 1.9,
            }}
          >
            أكمل المحطات الست، وكل محطة تنهيها ستظهر عليها علامة الإنجاز ✅.
          </p>
        </section>

        {/* المحطات */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(280px,1fr))",
            gap: 20,
          }}
        >
          {stations.map(
            (station) => {
              const isCompleted =
                completed.includes(
                  station.id
                );

              return (
                <article
                  key={station.id}
                  style={{
                    position:
                      "relative",
                    background:
                      "#ffffff",
                    border:
                      isCompleted
                        ? "2px solid #36b879"
                        : "1px solid #e4dce8",
                    borderRadius: 28,
                    padding: 24,
                    boxShadow:
                      "0 10px 28px rgba(70,50,90,.06)",
                  }}
                >
                  {isCompleted && (
                    <div
                      style={{
                        position:
                          "absolute",
                        top: 16,
                        left: 16,
                        background:
                          "#159765",
                        color:
                          "#ffffff",
                        borderRadius:
                          999,
                        padding:
                          "7px 11px",
                        fontSize: 13,
                        fontWeight:
                          900,
                      }}
                    >
                      ✅ مكتملة
                    </div>
                  )}

                  <div
                    style={{
                      width: 76,
                      height: 76,
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      background:
                        station.light,
                      borderRadius: 22,
                      fontSize: 38,
                      marginBottom: 22,
                    }}
                  >
                    {station.icon}
                  </div>

                  <div
                    style={{
                      color:
                        station.color,
                      fontWeight: 900,
                      marginBottom: 8,
                    }}
                  >
                    المحطة {station.number}
                  </div>

                  <h3
                    style={{
                      margin:
                        "0 0 12px",
                      color:
                        station.color,
                      fontSize: 25,
                    }}
                  >
                    {station.title}
                  </h3>

                  <p
                    style={{
                      minHeight: 88,
                      color: "#657b73",
                      lineHeight: 1.9,
                      fontSize: 16,
                    }}
                  >
                    {station.description}
                  </p>

                  <Link
                    href={station.href}
                    style={{
                      display: "block",
                      marginTop: 18,
                      textDecoration:
                        "none",
                      textAlign:
                        "center",
                      background:
                        isCompleted
                          ? "#edf9f3"
                          : station.button,
                      color:
                        isCompleted
                          ? "#14734e"
                          : "#ffffff",
                      border:
                        isCompleted
                          ? "1px solid #bde4d2"
                          : "none",
                      borderRadius: 17,
                      padding: 14,
                      fontWeight: 900,
                    }}
                  >
                    {isCompleted
                      ? `🔁 أعد ${station.title}`
                      : `ابدأ ${station.title} ${station.icon}`}
                  </Link>
                </article>
              );
            }
          )}
        </div>

        {/* التحدي الختامي */}

        <article
          style={{
            marginTop: 22,
            borderRadius: 30,
            padding:
              "32px 24px",
            textAlign: "center",
            border:
              challengeUnlocked
                ? "2px solid #edc448"
                : "2px solid #e3e8e5",
            background:
              challengeUnlocked
                ? "linear-gradient(135deg,#fff8d9,#ffffff,#fff3bf)"
                : "#f5f7f6",
          }}
        >
          <div
            style={{
              fontSize: 70,
              filter:
                challengeUnlocked
                  ? "none"
                  : "grayscale(1)",
              opacity:
                challengeUnlocked
                  ? 1
                  : 0.45,
            }}
          >
            🏆
          </div>

          <div
            style={{
              marginTop: 9,
              fontWeight: 900,
              color:
                challengeUnlocked
                  ? "#9a6b05"
                  : "#8e9994",
            }}
          >
            المحطة الأخيرة
          </div>

          <h3
            style={{
              margin: "9px 0",
              fontSize: 30,
              color:
                challengeUnlocked
                  ? "#9a6200"
                  : "#87918d",
            }}
          >
            تحدي اعتذار فواز
          </h3>

          <p
            style={{
              maxWidth: 670,
              margin: "0 auto",
              color:
                challengeUnlocked
                  ? "#766741"
                  : "#929b97",
              lineHeight: 1.9,
            }}
          >
            {challengeUnlocked
              ? "أكملت المحطات الست. الآن اجتز التحدي الختامي وأثبت أنك أتقنت درس عذرًا يا جدي!"
              : `أكمل المحطات الست أولًا. أنجزت ${completedCount} من 6 محطات.`}
          </p>

          {challengeUnlocked ? (
            <Link
              href="/lessons/unit1/lesson2/challenge"
              style={{
                display: "block",
                maxWidth: 700,
                margin:
                  "22px auto 0",
                textDecoration:
                  "none",
                background:
                  "linear-gradient(135deg,#d49716,#f0b52d)",
                color: "#ffffff",
                borderRadius: 18,
                padding: 16,
                fontWeight: 900,
                fontSize: 18,
              }}
            >
              🏆 ابدأ التحدي الختامي
            </Link>
          ) : (
            <div
              style={{
                maxWidth: 700,
                margin:
                  "22px auto 0",
                background:
                  "#e8ecea",
                color: "#939c98",
                borderRadius: 18,
                padding: 16,
                fontWeight: 900,
              }}
            >
              🔒 يفتح بعد إكمال المحطات الست
            </div>
          )}
        </article>
      </div>
    </main>
  );
}