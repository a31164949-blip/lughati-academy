"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { completeLessonOneStation } from "../progress";
type SpellingItem = {
  id: number;
  kind: "word" | "sentence";
  prompt: string;
  answer: string;
  hint: string;
};

const items: SpellingItem[] = [
  {
    id: 1,
    kind: "word",
    prompt: "الْأَقَارِبُ",
    answer: "الأقارب",
    hint: "ابدأ بـ (الـ) ثم اكتب الكلمة كما رأيتها.",
  },
  {
    id: 2,
    kind: "word",
    prompt: "الرَّحِمُ",
    answer: "الرحم",
    hint: "انتبه إلى الراء والحاء والميم.",
  },
  {
    id: 3,
    kind: "word",
    prompt: "الْحَاجَةُ",
    answer: "الحاجة",
    hint: "فيها مد بالألف بعد الحاء.",
  },
  {
    id: 4,
    kind: "word",
    prompt: "أَرْحَامُنَا",
    answer: "أرحامنا",
    hint: "ابدأ بالهمزة، ثم تذكّر المد بالألف.",
  },
  {
    id: 5,
    kind: "sentence",
    prompt: "أَزُورُ أَقَارِبِي.",
    answer: "أزور أقاربي",
    hint: "اكتب الجملة كلمتين.",
  },
  {
    id: 6,
    kind: "sentence",
    prompt: "أَسْأَلُ عَنْ أَحْوَالِهِمْ.",
    answer: "أسأل عن أحوالهم",
    hint: "الجملة أربع كلمات.",
  },
];

function normalizeArabic(text: string) {
  return text
    .trim()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[ـ]/g, "")
    .replace(/[.!؟،]/g, "")
    .replace(/\s+/g, " ");
}

export default function SpellingPage() {
  const [index, setIndex] = useState(0);
  const [showWord, setShowWord] = useState(true);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = items[index];

  const progress = useMemo(
    () =>
      Math.round(
        ((index + 1) / items.length) * 100
      ),
    [index]
  );

  function hideWord() {
    setShowWord(false);
    setInput("");
    setChecked(false);
    setCorrect(false);
  }

  function checkAnswer() {
    if (!input.trim() || checked) return;

    const isCorrect =
      normalizeArabic(input) ===
      normalizeArabic(current.answer);

    setChecked(true);
    setCorrect(isCorrect);

    if (isCorrect) {
      setScore((currentScore) => currentScore + 10);
    }
  }

  function nextItem() {
    if (!checked) return;

    if (index === items.length - 1) {
  completeLessonOneStation("spelling");
  setFinished(true);
  return;
}

    setIndex((currentIndex) => currentIndex + 1);
    setShowWord(true);
    setInput("");
    setChecked(false);
    setCorrect(false);
  }

  function restart() {
    setIndex(0);
    setShowWord(true);
    setInput("");
    setChecked(false);
    setCorrect(false);
    setScore(0);
    setFinished(false);
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#fff7f7 0%,#fffdf8 50%,#f2fbf7 100%)",
        padding: "28px 16px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#3f2b2b",
      }}
    >
      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <Link
            href="/lessons/unit1/lesson1"
            style={{
              textDecoration: "none",
              background: "#fff",
              color: "#a04444",
              border: "1px solid #f0d1d1",
              borderRadius: 15,
              padding: "11px 18px",
              fontWeight: 900,
            }}
          >
            ← العودة إلى محطات الدرس
          </Link>

          <div
            style={{
              background: "#fff",
              color: "#a04444",
              border: "1px solid #f0d1d1",
              borderRadius: 15,
              padding: "11px 18px",
              fontWeight: 900,
            }}
          >
            ✍️ نقاط الإملاء: {score}
          </div>
        </div>

        <section
          style={{
            background:
              "linear-gradient(135deg,#d85b5b,#ed8a8a)",
            color: "#fff",
            borderRadius: 30,
            padding: "34px 20px",
            textAlign: "center",
            boxShadow:
              "0 15px 38px rgba(216,91,91,.18)",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 58 }}>✍️</div>

          <h1
            style={{
              margin: "8px 0",
              fontSize: "clamp(32px,5vw,46px)",
            }}
          >
            إملائي الجميل
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              opacity: 0.95,
            }}
          >
            انظر جيدًا، احفظ الكلمة، ثم أخفها واكتبها بنفسك.
          </p>
        </section>

        {!finished ? (
          <>
            <section
              style={{
                background: "#fff",
                borderRadius: 22,
                border: "1px solid #f0dddd",
                padding: 20,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  fontWeight: 900,
                  color: "#a04444",
                }}
              >
                <span>
                  التحدي {index + 1} من {items.length}
                </span>

                <span>{progress}%</span>
              </div>

              <div
                style={{
                  height: 14,
                  background: "#f3e8e8",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg,#d85b5b,#f0a2a2)",
                    transition: "width .35s ease",
                  }}
                />
              </div>
            </section>

            <section
              style={{
                background: "#fff",
                borderRadius: 28,
                padding: "32px 22px",
                border: "1px solid #f0dddd",
                boxShadow:
                  "0 14px 35px rgba(130,60,60,.08)",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                <div style={{ fontSize: 50 }}>
                  {current.kind === "word" ? "📝" : "📖"}
                </div>

                <h2
                  style={{
                    margin: "10px 0 0",
                    color: "#8d3f3f",
                  }}
                >
                  {current.kind === "word"
                    ? "احفظ الكلمة"
                    : "احفظ الجملة"}
                </h2>
              </div>

              {showWord ? (
                <>
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg,#fff8f8,#fffdf8)",
                      border: "2px solid #f2d4d4",
                      borderRadius: 24,
                      padding: "30px 20px",
                      textAlign: "center",
                      fontSize: "clamp(36px,7vw,58px)",
                      fontWeight: 900,
                      color: "#5b2929",
                      lineHeight: 1.8,
                    }}
                  >
                    {current.prompt}
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      background: "#fff7e8",
                      border: "1px solid #f1dfb5",
                      borderRadius: 16,
                      padding: 14,
                      color: "#8a681e",
                      textAlign: "center",
                      fontWeight: 800,
                    }}
                  >
                    👀 اقرأها ثلاث مرات، ثم أخفها.
                  </div>

                  <button
                    type="button"
                    onClick={hideWord}
                    style={{
                      width: "100%",
                      marginTop: 18,
                      border: "none",
                      borderRadius: 17,
                      background:
                        "linear-gradient(135deg,#d85b5b,#bc4747)",
                      color: "#fff",
                      padding: 15,
                      fontSize: 18,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    🙈 أخفِها واكتبها
                  </button>
                </>
              ) : (
                <>
                  <div
                    style={{
                      background: "#f8faf9",
                      border: "2px dashed #d7e3de",
                      borderRadius: 24,
                      padding: "28px 20px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 48,
                        marginBottom: 10,
                      }}
                    >
                      ✏️
                    </div>

                    <p
                      style={{
                        color: "#6f7f78",
                        fontWeight: 800,
                      }}
                    >
                      اكتب ما حفظته:
                    </p>

                    <input
                      value={input}
                      onChange={(event) =>
                        setInput(event.target.value)
                      }
                      disabled={checked}
                      placeholder="اكتب هنا..."
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        border: "2px solid #d9e5df",
                        borderRadius: 18,
                        padding: "16px 18px",
                        fontSize: 24,
                        fontWeight: 800,
                        textAlign: "center",
                        outline: "none",
                        background: "#fff",
                        color: "#31483f",
                      }}
                    />

                    <div
                      style={{
                        marginTop: 12,
                        color: "#8b9a94",
                        fontSize: 14,
                      }}
                    >
                      💡 {current.hint}
                    </div>
                  </div>

                  {!checked && (
                    <button
                      type="button"
                      onClick={checkAnswer}
                      disabled={!input.trim()}
                      style={{
                        width: "100%",
                        marginTop: 18,
                        border: "none",
                        borderRadius: 17,
                        background: input.trim()
                          ? "#d85b5b"
                          : "#eadede",
                        color: input.trim()
                          ? "#fff"
                          : "#9c8c8c",
                        padding: 15,
                        fontSize: 18,
                        fontWeight: 900,
                        cursor: input.trim()
                          ? "pointer"
                          : "default",
                      }}
                    >
                      ✅ تحقق من كتابتي
                    </button>
                  )}

                  {checked && (
                    <div style={{ marginTop: 20 }}>
                      <div
                        style={{
                          textAlign: "center",
                          borderRadius: 17,
                          padding: 17,
                          marginBottom: 14,
                          fontWeight: 900,
                          background: correct
                            ? "#eaf9f0"
                            : "#fff3f3",
                          color: correct
                            ? "#147148"
                            : "#a63f3f",
                        }}
                      >
                        {correct
                          ? "🎉 رائع! كتبتها بشكل صحيح +10 نقاط"
                          : "🌱 محاولة جميلة، شاهد الكتابة الصحيحة"}
                      </div>

                      <div
                        style={{
                          background: "#fff8e8",
                          border: "1px solid #f0dfb5",
                          borderRadius: 16,
                          padding: 15,
                          textAlign: "center",
                          fontWeight: 900,
                          color: "#795d1c",
                          fontSize: 22,
                          marginBottom: 14,
                        }}
                      >
                        ✅ الكتابة الصحيحة: {current.prompt}
                      </div>

                      <button
                        type="button"
                        onClick={nextItem}
                        style={{
                          width: "100%",
                          border: "none",
                          borderRadius: 17,
                          background:
                            "linear-gradient(135deg,#d85b5b,#bc4747)",
                          color: "#fff",
                          padding: 15,
                          fontSize: 18,
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        {index === items.length - 1
                          ? "🏁 عرض النتيجة"
                          : "التحدي التالي ←"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        ) : (
          <section
            style={{
              background: "#fff",
              borderRadius: 28,
              padding: "38px 22px",
              border: "1px solid #f0dddd",
              textAlign: "center",
              boxShadow:
                "0 14px 35px rgba(130,60,60,.08)",
            }}
          >
            <div style={{ fontSize: 72 }}>🏆</div>

            <h2
              style={{
                color: "#a04444",
                fontSize: 30,
                marginBottom: 10,
              }}
            >
              بطل الإملاء!
            </h2>

            <p
              style={{
                color: "#7c6d6d",
                fontSize: 18,
                lineHeight: 1.9,
              }}
            >
              أنهيت تدريب الكلمات والجمل وحصلت على{" "}
              <strong style={{ color: "#a04444" }}>
                {score} من 60 نقطة ⭐
              </strong>
            </p>

            <button
              type="button"
              onClick={restart}
              style={{
                width: "100%",
                marginTop: 20,
                border: "none",
                borderRadius: 17,
                background:
                  "linear-gradient(135deg,#d85b5b,#bc4747)",
                color: "#fff",
                padding: 15,
                fontSize: 18,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              🔁 أعد تدريب الإملاء
            </button>

            <Link
              href="/lessons/unit1/lesson1"
              style={{
                display: "block",
                marginTop: 12,
                textDecoration: "none",
                border: "1px solid #f0d1d1",
                borderRadius: 17,
                padding: 14,
                color: "#a04444",
                fontWeight: 900,
              }}
            >
              🚗 العودة إلى محطات الدرس
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}