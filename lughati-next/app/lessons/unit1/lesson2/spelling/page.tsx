"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

const STORAGE_KEY =
  "lughati-unit1-lesson2-progress";

type LessonTwoStation =
  | "reading"
  | "comprehension"
  | "words"
  | "language"
  | "spelling"
  | "writing";

const spellingWords = [
  "جَدِّي",
  "عَطُوفٌ",
  "تَعْتَذِرُ",
  "السَّمَاحَ",
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

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function completeSpellingStation() {
  const current =
    getProgress();

  if (
    current.includes(
      "spelling"
    )
  ) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      ...current,
      "spelling",
    ])
  );
}

function normalizeArabic(
  value: string
) {
  return value
    .trim()
    .replace(
      /[\u064B-\u065F\u0670]/g,
      ""
    )
    .replace(/\s+/g, " ");
}

export default function LessonTwoSpellingPage() {
  const [
    wordIndex,
    setWordIndex,
  ] = useState(0);

  const [
    showWord,
    setShowWord,
  ] = useState(true);

  const [
    input,
    setInput,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    sentenceMode,
    setSentenceMode,
  ] = useState(false);

  const [
    sentenceInput,
    setSentenceInput,
  ] = useState("");

  const [
    finished,
    setFinished,
  ] = useState(false);

  const currentWord =
    spellingWords[wordIndex];

  const progress =
    useMemo(() => {
      if (finished) {
        return 100;
      }

      if (sentenceMode) {
        return 80;
      }

      return Math.round(
        (wordIndex /
          spellingWords.length) *
          80
      );
    }, [
      wordIndex,
      sentenceMode,
      finished,
    ]);

  function checkWord() {
    const student =
      normalizeArabic(input);

    const correct =
      normalizeArabic(
        currentWord
      );

    if (
      student !== correct
    ) {
      setMessage(
        "✍️ حاول مرة أخرى. شاهد الكلمة جيدًا ثم أخفها واكتبها من ذاكرتك."
      );

      return;
    }

    setMessage(
      "🌟 أحسنت! كتبت الكلمة كتابة صحيحة."
    );

    window.setTimeout(() => {
      setMessage("");
      setInput("");
      setShowWord(true);

      if (
        wordIndex ===
        spellingWords.length - 1
      ) {
        setSentenceMode(true);
        return;
      }

      setWordIndex(
        (value) =>
          value + 1
      );
    }, 700);
  }

  function checkSentence() {
    const student =
      normalizeArabic(
        sentenceInput
      );

    const accepted = [
      "اعتذر فواز إلى جده",
      "اعتذر فواز الى جده",
    ];

    if (
      !accepted.includes(
        student
      )
    ) {
      setMessage(
        "💡 حاول مرة أخرى. اكتب الجملة: اعتذر فواز إلى جده"
      );

      return;
    }

    completeSpellingStation();

    setFinished(true);

    setMessage(
      "🏆 رائع! أتممت محطة إملائي الجميل."
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding:
          "28px 16px 70px",
        background:
          "linear-gradient(180deg,#fff1f4 0%,#fff8fb 52%,#effcf7 100%)",
        fontFamily:
          "Arial, sans-serif",
        color:
          "#173f32",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <Link
            href="/lessons/unit1/lesson2"
            style={{
              textDecoration:
                "none",
              padding:
                "11px 17px",
              borderRadius: 15,
              background:
                "#ffffff",
              color:
                "#c9003c",
              border:
                "1px solid #f0d0da",
              fontWeight: 900,
            }}
          >
            ← العودة إلى محطات الدرس
          </Link>

          <span
            style={{
              padding:
                "8px 14px",
              borderRadius: 999,
              background:
                "#ffe5ec",
              color:
                "#c9003c",
              fontWeight: 900,
            }}
          >
            ✍️ المحطة الخامسة
          </span>
        </div>

        <header
          style={{
            padding:
              "32px 22px",
            borderRadius: 30,
            textAlign: "center",
            background:
              "linear-gradient(135deg,#fff1f4,#ffffff,#eef9f4)",
            border:
              "2px solid #f0d2dc",
            boxShadow:
              "0 12px 34px rgba(160,20,70,.07)",
          }}
        >
          <div
            style={{
              fontSize: 65,
            }}
          >
            ✍️
          </div>

          <h1
            style={{
              margin:
                "8px 0",
              color:
                "#c9003c",
              fontSize:
                "clamp(30px,5vw,44px)",
            }}
          >
            إملائي الجميل
          </h1>

          <p
            style={{
              maxWidth: 680,
              margin: "0 auto",
              color:
                "#71676a",
              lineHeight: 1.9,
              fontWeight: 700,
            }}
          >
            شاهد الكلمة، أخفها، ثم اكتبها من ذاكرتك.
            وبعد الكلمات ستكتب جملة قصيرة من الدرس.
          </p>
        </header>

        <section
          style={{
            marginTop: 18,
            padding: 17,
            borderRadius: 21,
            background: "#ffffff",
            border:
              "1px solid #eed8df",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 10,
              marginBottom: 10,
              color:
                "#c9003c",
              fontWeight: 900,
            }}
          >
            <span>
              ✨ تقدمي
            </span>

            <span>
              {finished
                ? "100%"
                : `${progress}%`}
            </span>
          </div>

          <div
            style={{
              height: 14,
              background:
                "#f0e8eb",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width:
                  `${progress}%`,
                borderRadius: 999,
                background:
                  "linear-gradient(90deg,#c9003c,#ff4f77)",
                transition:
                  "width .4s ease",
              }}
            />
          </div>
        </section>

        <section
          style={{
            marginTop: 20,
            padding:
              "28px 20px",
            borderRadius: 30,
            background: "#ffffff",
            border:
              "1px solid #ecd9df",
            boxShadow:
              "0 12px 30px rgba(100,40,60,.06)",
          }}
        >
          {finished ? (
            <FinishCard />
          ) : sentenceMode ? (
            <>
              <div
                style={{
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 54,
                  }}
                >
                  📝
                </div>

                <h2
                  style={{
                    margin:
                      "8px 0",
                    color:
                      "#c9003c",
                    fontSize: 29,
                  }}
                >
                  تحدي الجملة
                </h2>

                <p
                  style={{
                    color:
                      "#6d6669",
                    fontWeight: 700,
                    lineHeight: 1.8,
                  }}
                >
                  اكتب الجملة التالية من ذاكرتك:
                </p>

                <div
                  style={{
                    maxWidth: 600,
                    margin:
                      "16px auto",
                    padding: 18,
                    borderRadius: 20,
                    background:
                      "#fff6f8",
                    border:
                      "1px solid #f0d4dc",
                    color:
                      "#9f2347",
                    fontWeight: 900,
                    fontSize:
                      "clamp(21px,4vw,28px)",
                  }}
                >
                  اعتذر فواز إلى جده
                </div>
              </div>

              <input
                value={
                  sentenceInput
                }
                onChange={(event) =>
                  setSentenceInput(
                    event.target.value
                  )
                }
                placeholder="اكتب الجملة هنا"
                style={{
                  width: "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "16px 18px",
                  borderRadius: 17,
                  border:
                    "2px solid #efd4dc",
                  outline: "none",
                  textAlign: "center",
                  fontSize: 20,
                  color:
                    "#173f32",
                  fontWeight: 900,
                }}
              />

              <button
                type="button"
                disabled={
                  !sentenceInput.trim()
                }
                onClick={
                  checkSentence
                }
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: 650,
                  margin:
                    "22px auto 0",
                  padding:
                    "15px 18px",
                  border: "none",
                  borderRadius: 17,
                  background:
                    !sentenceInput.trim()
                      ? "#d3d5d4"
                      : "linear-gradient(135deg,#c9003c,#ff2051)",
                  color:
                    "#ffffff",
                  fontWeight: 900,
                  fontSize: 17,
                  cursor:
                    !sentenceInput.trim()
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                🏆 إنهاء إملائي الجميل
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 50,
                  }}
                >
                  🔤
                </div>

                <span
                  style={{
                    display:
                      "inline-block",
                    marginTop: 5,
                    padding:
                      "5px 10px",
                    borderRadius: 999,
                    background:
                      "#fff0f4",
                    color:
                      "#c9003c",
                    fontWeight: 900,
                    fontSize: 12,
                  }}
                >
                  الكلمة {wordIndex + 1} من 4
                </span>

                <h2
                  style={{
                    margin:
                      "10px 0 7px",
                    color:
                      "#c9003c",
                  }}
                >
                  شاهد ثم اكتب
                </h2>

                <p
                  style={{
                    color:
                      "#6d6669",
                    fontWeight: 700,
                  }}
                >
                  شاهد الكلمة جيدًا، ثم أخفها واكتبها من ذاكرتك.
                </p>
              </div>

              <div
                style={{
                  maxWidth: 600,
                  margin:
                    "20px auto",
                  padding:
                    "24px 18px",
                  borderRadius: 22,
                  textAlign: "center",
                  background:
                    "#fff5f8",
                  border:
                    "2px solid #efd4dc",
                  minHeight: 80,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {showWord ? (
                  <strong
                    style={{
                      color:
                        "#9f2347",
                      fontSize:
                        "clamp(30px,6vw,44px)",
                    }}
                  >
                    {currentWord}
                  </strong>
                ) : (
                  <span
                    style={{
                      fontSize: 40,
                    }}
                  >
                    🙈
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowWord(
                    !showWord
                  )
                }
                style={{
                  display: "block",
                  margin:
                    "0 auto 16px",
                  padding:
                    "10px 16px",
                  borderRadius: 14,
                  border:
                    "1px solid #efd4dc",
                  background:
                    "#ffffff",
                  color:
                    "#a5294d",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {showWord
                  ? "🙈 أخفِ الكلمة"
                  : "👀 أظهر الكلمة"}
              </button>

              <input
                value={input}
                onChange={(event) =>
                  setInput(
                    event.target.value
                  )
                }
                placeholder="اكتب الكلمة هنا"
                style={{
                  width: "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "16px 18px",
                  borderRadius: 17,
                  border:
                    "2px solid #efd4dc",
                  outline: "none",
                  textAlign: "center",
                  fontSize: 22,
                  color:
                    "#173f32",
                  fontWeight: 900,
                }}
              />

              <button
                type="button"
                disabled={
                  !input.trim()
                }
                onClick={
                  checkWord
                }
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: 650,
                  margin:
                    "22px auto 0",
                  padding:
                    "15px 18px",
                  border: "none",
                  borderRadius: 17,
                  background:
                    !input.trim()
                      ? "#d3d5d4"
                      : "linear-gradient(135deg,#c9003c,#ff2051)",
                  color:
                    "#ffffff",
                  fontWeight: 900,
                  fontSize: 17,
                  cursor:
                    !input.trim()
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                ✍️ تحقق من كتابتي
              </button>
            </>
          )}

          {message && (
            <div
              style={{
                marginTop: 18,
                padding:
                  "14px 16px",
                borderRadius: 17,
                background:
                  "#edf9f3",
                border:
                  "1px solid #cee8db",
                color:
                  "#176c46",
                textAlign: "center",
                fontWeight: 900,
                lineHeight: 1.8,
              }}
            >
              {message}
            </div>
          )}
        </section>

        {!finished && (
          <section
            style={{
              marginTop: 18,
              padding:
                "16px 18px",
              borderRadius: 21,
              background:
                "#fff2f5",
              border:
                "1px solid #efd6de",
              display: "flex",
              gap: 12,
              alignItems:
                "center",
            }}
          >
            <span
              style={{
                fontSize: 34,
              }}
            >
              🦸
            </span>

            <p
              style={{
                margin: 0,
                color:
                  "#a3294d",
                fontWeight: 800,
                lineHeight: 1.8,
              }}
            >
              فارس يقول: انظر إلى الكلمة، اقرأها، أخفها، ثم حاول أن تراها في خيالك قبل أن تكتبها.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function FinishCard() {
  return (
    <div
      style={{
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 72,
        }}
      >
        ✍️
      </div>

      <h2
        style={{
          margin:
            "8px 0",
          color:
            "#c9003c",
          fontSize:
            "clamp(28px,5vw,38px)",
        }}
      >
        أحسنت! أتممت إملائي الجميل
      </h2>

      <p
        style={{
          color:
            "#667d74",
          lineHeight: 1.9,
          fontWeight: 700,
        }}
      >
        تدربت على كلمات الدرس وجملة قصيرة، وبقيت لك المحطة السادسة والأخيرة.
      </p>

      <div
        style={{
          maxWidth: 550,
          margin:
            "18px auto",
          padding: 16,
          borderRadius: 18,
          background:
            "#edf9f3",
          border:
            "1px solid #cce8da",
          color:
            "#176c46",
          fontWeight: 900,
        }}
      >
        ✅ المحطة الخامسة مكتملة
      </div>

      <Link
        href="/lessons/unit1/lesson2/writing"
        style={{
          display: "block",
          maxWidth: 650,
          margin: "0 auto",
          padding:
            "15px 18px",
          borderRadius: 18,
          background:
            "linear-gradient(135deg,#087d76,#079b90)",
          color:
            "#ffffff",
          textDecoration:
            "none",
          fontWeight: 900,
          fontSize: 18,
        }}
      >
        🖊️ انتقل إلى أكتب وأستخدم
      </Link>
    </div>
  );
}