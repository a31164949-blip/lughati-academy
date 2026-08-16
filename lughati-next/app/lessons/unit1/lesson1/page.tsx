"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getLessonOneProgress,
  type LessonOneStation,
} from "./progress";

type Station = {
  id: LessonOneStation;
  number: number;
  icon: string;
  title: string;
  description: string;
  href: string;
  color: string;
  light: string;
  border: string;
  button: string;
};

const stations: Station[] = [
  {
    id: "reading",
    number: 1,
    icon: "📖",
    title: "رحلة القراءة",
    description:
      "اقرأ نص صلة الرحم بالحركات الملوّنة، ثم جرّب القراءة دون حركات كتحدٍ إضافي.",
    href: "/lessons/unit1/lesson1/read",
    color: "#087a55",
    light: "#eaf9f2",
    border: "#cdeee0",
    button: "#08a16f",
  },
  {
    id: "comprehension",
    number: 2,
    icon: "🧠",
    title: "أفهم النص",
    description:
      "اختبر فهمك المباشر، ورتّب أحداث النص، ثم استنتج ما تعلمته.",
    href: "/lessons/unit1/lesson1/comprehension",
    color: "#0878b5",
    light: "#eef8ff",
    border: "#cfe9f7",
    button: "#098fd4",
  },
  {
    id: "words",
    number: 3,
    icon: "💎",
    title: "كنز الكلمات",
    description:
      "اكتشف معاني كلمات الدرس، وطابقها، واستخدمها في جمل ومواقف.",
    href: "/lessons/unit1/lesson1/words",
    color: "#a65c00",
    light: "#fff9e9",
    border: "#f1ddb0",
    button: "#f59a00",
  },
  {
    id: "language",
    number: 4,
    icon: "🔎",
    title: "مكتشف اللغة",
    description:
      "اكتشف اللام الشمسية والقمرية، وحلّل الكلمات، وميّز المقاطع.",
    href: "/lessons/unit1/lesson1/language",
    color: "#7021d4",
    light: "#f6f1ff",
    border: "#e4d7fa",
    button: "#8125f5",
  },
  {
    id: "spelling",
    number: 5,
    icon: "✍️",
    title: "إملائي الجميل",
    description:
      "شاهد الكلمة، أخفها، ثم اكتبها بنفسك وتدرّب على جمل الدرس.",
    href: "/lessons/unit1/lesson1/spelling",
    color: "#c9003c",
    light: "#fff1f4",
    border: "#f3d2dc",
    button: "#ff2051",
  },
  {
    id: "handwriting",
    number: 6,
    icon: "🖊️",
    title: "خطي أجمل",
    description:
      "شاهد الجملة، وتتبعها بصريًا، ثم اكتبها بنفسك بخط واضح وجميل.",
    href: "/lessons/unit1/lesson1/handwriting",
    color: "#087d76",
    light: "#edfafa",
    border: "#cee9e7",
    button: "#079b90",
  },
];

export default function LessonOnePage() {
  const [completed, setCompleted] =
    useState<LessonOneStation[]>([]);

  useEffect(() => {
    function loadProgress() {
      setCompleted(getLessonOneProgress());
    }

    loadProgress();

    window.addEventListener("focus", loadProgress);

    return () => {
      window.removeEventListener("focus", loadProgress);
    };
  }, []);

  const completedCount = completed.length;

  const progress = useMemo(
    () =>
      Math.round(
        (completedCount / stations.length) * 100
      ),
    [completedCount]
  );

  const challengeUnlocked =
    completedCount === stations.length;

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#effcf7 0%,#f5fbff 55%,#fffaf0 100%)",
        padding: "28px 16px 60px",
        fontFamily: "Arial, sans-serif",
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
        <header
          style={{
            background: "#ffffff",
            borderRadius: 30,
            padding: "28px 24px",
            border: "1px solid #dceee6",
            boxShadow:
              "0 12px 35px rgba(30,100,70,.08)",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color: "#16835f",
                  fontWeight: 900,
                  marginBottom: 8,
                }}
              >
                أكاديمية لغتي
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(30px,5vw,46px)",
                  color: "#124e3a",
                }}
              >
                🤝 الدرس الأول: صلة الرحم
              </h1>

              <p
                style={{
                  maxWidth: 700,
                  color: "#657d74",
                  lineHeight: 1.9,
                  fontSize: 17,
                  marginBottom: 0,
                }}
              >
                نتعلم أهمية التواصل مع الأقارب، والسؤال عنهم،
                وزيارتهم، والإحسان إليهم.
              </p>
            </div>

            <Link
              href="/lessons/unit1"
              style={{
                textDecoration: "none",
                background: "#ffffff",
                color: "#176d4c",
                border: "1px solid #cfe7dd",
                borderRadius: 16,
                padding: "12px 18px",
                fontWeight: 900,
              }}
            >
              ← العودة إلى الوحدة
            </Link>
          </div>

          <div
            style={{
              marginTop: 28,
              background: "#f7fbf9",
              borderRadius: 20,
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 11,
              }}
            >
              <strong
                style={{
                  color: "#176d4c",
                }}
              >
                🚗 تقدمك في الدرس
              </strong>

              <strong
                style={{
                  color: "#176d4c",
                }}
              >
                {completedCount} من 6 — {progress}%
              </strong>
            </div>

            <div
              style={{
                height: 16,
                borderRadius: 999,
                background: "#e1ece7",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background:
                    "linear-gradient(90deg,#1ca76e,#63d49a)",
                  transition: "width .5s ease",
                }}
              />
            </div>

            {challengeUnlocked && (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 15,
                  padding: 12,
                  background: "#fff7d8",
                  border: "1px solid #f1d36b",
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

        <section>
          <div
            style={{
              marginBottom: 22,
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#126a4b",
                fontSize: "clamp(25px,4vw,34px)",
              }}
            >
              🚗 رحلتي في درس صلة الرحم
            </h2>

            <p
              style={{
                color: "#667d74",
                lineHeight: 1.9,
              }}
            >
              أكمل المحطات، وكل محطة تنهيها ستظهر عليها علامة الإنجاز ✅.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(280px,1fr))",
              gap: 20,
            }}
          >
            {stations.map((station) => {
              const isCompleted =
                completed.includes(station.id);

              return (
                <article
                  key={station.id}
                  style={{
                    position: "relative",
                    background: "#ffffff",
                    border: isCompleted
                      ? "2px solid #36b879"
                      : `1px solid ${station.border}`,
                    borderRadius: 28,
                    padding: 24,
                    boxShadow:
                      "0 10px 28px rgba(30,80,60,.06)",
                  }}
                >
                  {isCompleted && (
                    <div
                      style={{
                        position: "absolute",
                        top: 16,
                        left: 16,
                        background: "#159765",
                        color: "#ffffff",
                        borderRadius: 999,
                        padding: "7px 11px",
                        fontSize: 13,
                        fontWeight: 900,
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
                      alignItems: "center",
                      justifyContent: "center",
                      background: station.light,
                      borderRadius: 22,
                      fontSize: 38,
                      marginBottom: 22,
                    }}
                  >
                    {station.icon}
                  </div>

                  <div
                    style={{
                      color: station.color,
                      fontWeight: 900,
                      marginBottom: 8,
                    }}
                  >
                    المحطة {station.number}
                  </div>

                  <h3
                    style={{
                      margin: "0 0 12px",
                      color: station.color,
                      fontSize: 25,
                    }}
                  >
                    {station.title}
                  </h3>

                  <p
                    style={{
                      minHeight: 78,
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
                      textDecoration: "none",
                      textAlign: "center",
                      background: isCompleted
                        ? "#edf9f3"
                        : station.button,
                      color: isCompleted
                        ? "#14734e"
                        : "#ffffff",
                      border: isCompleted
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
            })}
          </div>

          <article
            style={{
              marginTop: 22,
              borderRadius: 30,
              padding: "32px 24px",
              textAlign: "center",
              border: challengeUnlocked
                ? "2px solid #edc448"
                : "2px solid #e3e8e5",
              background: challengeUnlocked
                ? "linear-gradient(135deg,#fff8d9,#ffffff,#fff3bf)"
                : "#f5f7f6",
              boxShadow: challengeUnlocked
                ? "0 14px 38px rgba(180,130,20,.10)"
                : "none",
            }}
          >
            <div
              style={{
                fontSize: 70,
                filter: challengeUnlocked
                  ? "none"
                  : "grayscale(1)",
                opacity: challengeUnlocked ? 1 : 0.45,
              }}
            >
              🏆
            </div>

            <div
              style={{
                marginTop: 9,
                fontWeight: 900,
                color: challengeUnlocked
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
                color: challengeUnlocked
                  ? "#9a6200"
                  : "#87918d",
              }}
            >
              تحدي صلة الرحم
            </h3>

            <p
              style={{
                maxWidth: 670,
                margin: "0 auto",
                color: challengeUnlocked
                  ? "#766741"
                  : "#929b97",
                lineHeight: 1.9,
              }}
            >
              {challengeUnlocked
                ? "أكملت المحطات الست. الآن اجتز البوابات الختامية واكتشف لقبك!"
                : `أكمل المحطات الست أولًا. أنجزت ${completedCount} من 6 محطات.`}
            </p>

            {challengeUnlocked ? (
              <Link
                href="/lessons/unit1/lesson1/challenge"
                style={{
                  display: "block",
                  maxWidth: 700,
                  margin: "22px auto 0",
                  textDecoration: "none",
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
                  margin: "22px auto 0",
                  background: "#e8ecea",
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
        </section>
      </div>
    </main>
  );
}