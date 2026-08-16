"use client";

import Link from "next/link";
import { completeLessonOneStation } from "../progress";
import { Fragment, useMemo, useState } from "react";

const readingParts = [
  {
    title: "بِدَايَةُ الرِّحْلَةِ",
    text:
      "عِنْدَ عَوْدَةِ فَوَّازٍ وَنُورَةَ مِنَ الْمَدْرَسَةِ بِصُحْبَةِ أَبِيهِمَا، اسْتَمَعُوا إِلَى مُذِيعٍ يَقْرَأُ فِي الْإِذَاعَةِ قَوْلَ الرَّسُولِ ﷺ: «مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَصِلْ رَحِمَهُ».",
    icon: "🚗",
  },
  {
    title: "مَا مَعْنَى الرَّحِمِ؟",
    text:
      "سَأَلَ فَوَّازٌ أَبَاهُ: مَا مَعْنَى الرَّحِمِ يَا أَبِي؟ فَقَالَ الْأَبُ: الرَّحِمُ اسْمٌ لِكُلِّ مَنْ تَرْبِطُنَا بِهِمْ صِلَةُ قُرْبَى.",
    icon: "👨‍👧‍👦",
  },
  {
    title: "مَا مَعْنَى صِلَةِ الرَّحِمِ؟",
    text:
      "سَأَلَتْ نُورَةُ: وَمَا مَعْنَى صِلَةِ الرَّحِمِ؟ فَقَالَ الْأَبُ: صِلَةُ الرَّحِمِ تَعْنِي زِيَارَةَ الْأَقَارِبِ، وَالسُّؤَالَ عَنْهُمْ، وَتَفَقُّدَ أَحْوَالِهِمْ، وَمُسَاعَدَتَهُمْ عِنْدَ الْحَاجَةِ، وَمُشَارَكَتَهُمْ أَفْرَاحَهُمْ وَأَحْزَانَهُمْ.",
    icon: "🤝",
  },
  {
    title: "فِكْرَةُ فَوَّازٍ",
    text:
      "قَالَ فَوَّازٌ: مَا رَأْيُكَ يَا أَبِي أَنْ نُخَصِّصَ يَوْمًا نَصِلُ فِيهِ أَرْحَامَنَا؟ فَقَالَ الْأَبُ: إِنَّهُ رَأْيٌ جَمِيلٌ، بَارَكَ اللَّهُ فِيكَ يَا بُنَيَّ.",
    icon: "💡",
  },
  {
    title: "نُورَةُ مُتَشَوِّقَةٌ",
    text:
      "قَالَتْ نُورَةُ: أَنَا مُتَشَوِّقَةٌ لِهَذَا الْيَوْمِ يَا أَبِي. فَقَالَ الْأَبُ: بَارَكَ اللَّهُ فِيكِ يَا بُنَيَّتِي.",
    icon: "🌟",
  },
];

const wordMeanings: Record<string, string> = {
  الرحم: "الأقارب الذين تربطنا بهم صلة قرابة.",
  الأقارب: "أفراد العائلة الذين تجمعنا بهم صلة قرابة.",
  تفقد: "السؤال عن أحوال الشخص والاطمئنان عليه.",
  الحاجة: "وقت احتياج الشخص إلى المساعدة.",
  أرحامنا: "أقاربنا.",
};

const diacriticColors: Record<string, string> = {
  "َ": "#ef4444", // فتحة
  "ِ": "#2563eb", // كسرة
  "ُ": "#16a34a", // ضمة
  "ْ": "#7c3aed", // سكون
  "ّ": "#f59e0b", // شدة
  "ً": "#ef4444",
  "ٍ": "#2563eb",
  "ٌ": "#16a34a",
};

const arabicDiacriticsRegex = /[\u064B-\u0652]/g;

function removeDiacritics(text: string) {
  return text.replace(arabicDiacriticsRegex, "");
}

function ColoredArabicText({
  text,
  showDiacritics,
}: {
  text: string;
  showDiacritics: boolean;
}) {
  if (!showDiacritics) {
    return <>{removeDiacritics(text)}</>;
  }

  return (
    <>
      {Array.from(text).map((char, index) => {
        const color = diacriticColors[char];

        if (color) {
          return (
            <span
              key={`${char}-${index}`}
              style={{
                color,
                fontWeight: 900,
              }}
            >
              {char}
            </span>
          );
        }

        return (
          <Fragment key={`${char}-${index}`}>
            {char}
          </Fragment>
        );
      })}
    </>
  );
}

export default function LessonReadPage() {
  const [partIndex, setPartIndex] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [showDiacritics, setShowDiacritics] = useState(true);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const currentPart = readingParts[partIndex];

  const progress = useMemo(
    () =>
      Math.round(
        ((partIndex + 1) / readingParts.length) * 100
      ),
    [partIndex]
  );
function nextPart() {
  if (partIndex === readingParts.length - 1) {
    completeLessonOneStation("reading");
    setFinished(true);
    return;
  }

  setPartIndex((current) => current + 1);
  setSelectedWord(null);
}

  function previousPart() {
    if (partIndex === 0) return;

    setPartIndex((current) => current - 1);
    setSelectedWord(null);
  }

  function restartReading() {
    setPartIndex(0);
    setFinished(false);
    setSelectedWord(null);
    setShowDiacritics(true);
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#eefaf5 0%,#f8fbff 55%,#fff9ed 100%)",
        padding: "24px 16px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#174c3b",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
        {/* أعلى الصفحة */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <Link
            href="/lessons/unit1/lesson1"
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
            ← العودة إلى محطات الدرس
          </Link>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setShowDiacritics((current) => !current)
              }
              style={{
                border: showDiacritics
                  ? "1px solid #f0d47a"
                  : "1px solid #cfe7dd",
                background: showDiacritics
                  ? "#fff8d9"
                  : "#ffffff",
                color: showDiacritics
                  ? "#8a6500"
                  : "#176d4c",
                borderRadius: 16,
                padding: "12px 18px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {showDiacritics
                ? "👁️ أخفِ الحركات — أتحدى نفسي"
                : "🎨 أظهر الحركات الملوّنة"}
            </button>

            <button
              type="button"
              onClick={() =>
                setFocusMode((current) => !current)
              }
              style={{
                border: "1px solid #d4e7df",
                background: focusMode
                  ? "#176d4c"
                  : "#ffffff",
                color: focusMode
                  ? "#ffffff"
                  : "#176d4c",
                borderRadius: 16,
                padding: "12px 18px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              ☝️{" "}
              {focusMode
                ? "إيقاف إصبع القراءة"
                : "إصبع القراءة"}
            </button>
          </div>
        </div>

        {/* دليل ألوان الحركات */}
        {showDiacritics && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <span style={legendStyle}>
              <strong style={{ color: "#ef4444" }}>َ</strong>{" "}
              الفتحة
            </span>

            <span style={legendStyle}>
              <strong style={{ color: "#2563eb" }}>ِ</strong>{" "}
              الكسرة
            </span>

            <span style={legendStyle}>
              <strong style={{ color: "#16a34a" }}>ُ</strong>{" "}
              الضمة
            </span>

            <span style={legendStyle}>
              <strong style={{ color: "#7c3aed" }}>ْ</strong>{" "}
              السكون
            </span>

            <span style={legendStyle}>
              <strong style={{ color: "#f59e0b" }}>ّ</strong>{" "}
              الشدة
            </span>
          </div>
        )}

        {/* رأس الرحلة */}
        <section
          style={{
            background:
              "linear-gradient(135deg,#168a63,#2fb889)",
            color: "#ffffff",
            borderRadius: 30,
            padding: "34px 20px",
            textAlign: "center",
            boxShadow:
              "0 16px 40px rgba(22,138,99,.18)",
            marginBottom: 22,
          }}
        >
          <div style={{ fontSize: 56 }}>📖</div>

          <div
            style={{
              display: "inline-block",
              marginTop: 10,
              background: "rgba(255,255,255,.16)",
              borderRadius: 999,
              padding: "7px 15px",
              fontWeight: 900,
            }}
          >
            رحلة القراءة
          </div>

          <h1
            style={{
              margin: "14px 0 8px",
              fontSize: "clamp(32px,5vw,48px)",
            }}
          >
            صلة الرحم
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.9,
              fontSize: 17,
            }}
          >
            اقرأ بهدوء، وانتقل بين أجزاء النص حتى تصل إلى
            نجمة القراءة ⭐
          </p>
        </section>

        {!finished ? (
          <>
            {/* التقدم */}
            <section
              style={{
                background: "#ffffff",
                border: "1px solid #dcece5",
                borderRadius: 22,
                padding: 18,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 10,
                  fontWeight: 900,
                  color: "#176d4c",
                }}
              >
                <span>
                  المحطة {partIndex + 1} من{" "}
                  {readingParts.length}
                </span>

                <span>{progress}%</span>
              </div>

              <div
                style={{
                  height: 14,
                  background: "#e7efeb",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background:
                      "linear-gradient(90deg,#26a96d,#6bd69b)",
                    transition: "width .35s ease",
                  }}
                />
              </div>
            </section>

            {/* بطاقة القراءة */}
            <section
              style={{
                background: "#ffffff",
                border: "1px solid #dcece5",
                borderRadius: 30,
                padding: "32px 24px",
                boxShadow:
                  "0 14px 40px rgba(30,100,70,.08)",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 26,
                }}
              >
                <div style={{ fontSize: 56 }}>
                  {currentPart.icon}
                </div>

                <div
                  style={{
                    marginTop: 9,
                    color: "#16835f",
                    fontSize: 15,
                    fontWeight: 900,
                  }}
                >
                  الجزء {partIndex + 1}
                </div>

                <h2
                  style={{
                    margin: "8px 0 0",
                    fontSize: "clamp(25px,4vw,34px)",
                    color: "#174c3b",
                  }}
                >
                  <ColoredArabicText
                    text={currentPart.title}
                    showDiacritics={showDiacritics}
                  />
                </h2>
              </div>

              <div
                style={{
                  background: focusMode
                    ? "#fffdf5"
                    : "linear-gradient(135deg,#f7fcf9,#fffdf8)",
                  border: focusMode
                    ? "2px solid #f1d582"
                    : "1px solid #e5eee9",
                  borderRadius: 24,
                  padding: "28px 22px",
                  fontSize: "clamp(24px,4vw,34px)",
                  lineHeight: 2.15,
                  fontWeight: 700,
                  color: "#183f32",
                  textAlign: "right",
                  transition: "all .25s ease",
                }}
              >
                <ColoredArabicText
                  text={currentPart.text}
                  showDiacritics={showDiacritics}
                />
              </div>

              {/* كلمات تفاعلية */}
              <div
                style={{
                  marginTop: 24,
                  background: "#f4fbf8",
                  border: "1px solid #dceee6",
                  borderRadius: 20,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    marginBottom: 13,
                    fontWeight: 900,
                    color: "#176d4c",
                  }}
                >
                  💎 كنوز صغيرة في النص
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 9,
                  }}
                >
                  {Object.keys(wordMeanings).map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() =>
                        setSelectedWord(word)
                      }
                      style={{
                        border: "1px solid #bfe3d3",
                        background:
                          selectedWord === word
                            ? "#168a63"
                            : "#ffffff",
                        color:
                          selectedWord === word
                            ? "#ffffff"
                            : "#176d4c",
                        borderRadius: 999,
                        padding: "9px 14px",
                        fontSize: 16,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      {word}
                    </button>
                  ))}
                </div>

                {selectedWord && (
                  <div
                    style={{
                      marginTop: 14,
                      background: "#ffffff",
                      borderRadius: 16,
                      padding: 14,
                      color: "#55766a",
                      lineHeight: 1.8,
                      fontWeight: 800,
                    }}
                  >
                    💡{" "}
                    <strong
                      style={{
                        color: "#176d4c",
                      }}
                    >
                      {selectedWord}:
                    </strong>{" "}
                    {wordMeanings[selectedWord]}
                  </div>
                )}
              </div>

              {/* تشجيع فارس */}
              <div
                style={{
                  marginTop: 22,
                  borderRadius: 20,
                  padding: 17,
                  textAlign: "center",
                  background: "#fff8e6",
                  border: "1px solid #f2dfab",
                  color: "#806116",
                  fontWeight: 900,
                  lineHeight: 1.8,
                }}
              >
                🧒🏻 فارس يقول: اقرأ الكلمات بهدوء، ولا
                تستعجل. أنت تتقدم بشكل رائع!
              </div>

              {/* التنقل */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    partIndex === 0 ? "1fr" : "1fr 1fr",
                  gap: 12,
                  marginTop: 22,
                }}
              >
                {partIndex > 0 && (
                  <button
                    type="button"
                    onClick={previousPart}
                    style={{
                      border: "1px solid #cfe7dd",
                      background: "#ffffff",
                      color: "#17674d",
                      borderRadius: 17,
                      padding: 14,
                      fontSize: 17,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    → الجزء السابق
                  </button>
                )}

                <button
                  type="button"
                  onClick={nextPart}
                  style={{
                    border: "none",
                    background:
                      "linear-gradient(135deg,#168a63,#0f7654)",
                    color: "#ffffff",
                    borderRadius: 17,
                    padding: 14,
                    fontSize: 17,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  {partIndex === readingParts.length - 1
                    ? "⭐ أنهيت القراءة"
                    : "الجزء التالي ←"}
                </button>
              </div>
            </section>
          </>
        ) : (
          <section
            style={{
              background: "#ffffff",
              borderRadius: 30,
              padding: "42px 24px",
              border: "1px solid #dceee6",
              textAlign: "center",
              boxShadow:
                "0 15px 40px rgba(30,100,70,.08)",
            }}
          >
            <div style={{ fontSize: 76 }}>⭐</div>

            <h2
              style={{
                margin: "12px 0 8px",
                fontSize: 32,
                color: "#176d4c",
              }}
            >
              أصبحت بطل القراءة!
            </h2>

            <p
              style={{
                color: "#687f75",
                fontSize: 18,
                lineHeight: 1.9,
                maxWidth: 600,
                margin: "0 auto",
              }}
            >
              أحسنت قراءة نص صلة الرحم. الآن أنت مستعد
              لتثبت فهمك في المحطة التالية.
            </p>

            <Link
              href="/lessons/unit1/lesson1/comprehension"
              style={{
                display: "block",
                marginTop: 24,
                textDecoration: "none",
                background:
                  "linear-gradient(135deg,#168a63,#0f7654)",
                color: "#ffffff",
                borderRadius: 17,
                padding: 15,
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              🧠 انتقل إلى محطة أفهم النص
            </Link>

            <button
              type="button"
              onClick={restartReading}
              style={{
                width: "100%",
                marginTop: 12,
                border: "1px solid #cfe7dd",
                background: "#ffffff",
                color: "#17674d",
                borderRadius: 17,
                padding: 14,
                fontSize: 17,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              🔁 أقرأ النص مرة أخرى
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

const legendStyle = {
  background: "#ffffff",
  border: "1px solid #e3ebe7",
  borderRadius: 999,
  padding: "7px 12px",
  color: "#526d63",
  fontSize: 14,
  fontWeight: 800,
};