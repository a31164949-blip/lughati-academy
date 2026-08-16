"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Question = {
  id: number;
  prompt: string;
  display: string;
  answer: string;
  choices: string[];
  explanation: string;
  mode?: "visual" | "audio";
};

const questions: Question[] = [
  {
    id: 1,
    prompt: "أين علامة السكون؟",
    display: "بْ",
    answer: "ْ",
    choices: ["َ", "ِ", "ُ", "ْ"],
    explanation: "هذه علامة السكون: ْ",
  },
  {
    id: 2,
    prompt: "أي حرف في المقطع ساكن؟",
    display: "أَبْ",
    answer: "بْ",
    choices: ["أَ", "بْ", "أ", "بَ"],
    explanation: "نقرأ المقطع: أَبْ، والحرف الساكن هو بْ.",
  },
  {
    id: 3,
    prompt: "أي حرف في الكلمة عليه سكون؟",
    display: "مَكْتَب",
    answer: "كْ",
    choices: ["مَ", "كْ", "تَ", "ب"],
    explanation: "في كلمة مَكْتَب الحرف الساكن هو كْ.",
  },
  {
    id: 4,
    prompt: "أي مقطع يحتوي على حرف ساكن؟",
    display: "لَمْ",
    answer: "مْ",
    choices: ["لَ", "مْ", "لِ", "مُ"],
    explanation: "نقرأ: لَمْ، والميم ساكنة.",
  },
  {
    id: 5,
    prompt: "🎧 استمع ثم اختر المقطع الذي سمعته",
    display: "أَبْ",
    answer: "أَبْ",
    choices: ["أَبْ", "أَبَ", "إِبْ", "أُبُ"],
    explanation: "سمعتَ أَبْ، والباء في آخر المقطع ساكنة.",
    mode: "audio",
  },
  {
    id: 6,
    prompt: "🎧 استمع ثم اختر المقطع الذي سمعته",
    display: "لَمْ",
    answer: "لَمْ",
    choices: ["لَمْ", "لَمَ", "لِمْ", "لُمُ"],
    explanation: "سمعتَ لَمْ، والميم ساكنة.",
    mode: "audio",
  },
];

export default function SukoonGamePage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions[questionIndex];

  const progress = useMemo(
    () =>
      Math.round(
        ((questionIndex + 1) / questions.length) * 100
      ),
    [questionIndex]
  );

  function chooseAnswer(choice: string) {
    if (answered) return;

    setSelectedAnswer(choice);
    setAnswered(true);

    if (choice === currentQuestion.answer) {
      setScore((current) => current + 10);
    }
  }

  function nextQuestion() {
    if (!answered) return;

    if (questionIndex === questions.length - 1) {
      setFinished(true);
      return;
    }

    setQuestionIndex((current) => current + 1);
    setSelectedAnswer("");
    setAnswered(false);
  }

  function restartGame() {
    setQuestionIndex(0);
    setSelectedAnswer("");
    setAnswered(false);
    setScore(0);
    setFinished(false);
  }

  function speakCurrentSound() {
    if (typeof window === "undefined") return;

    const utterance = new SpeechSynthesisUtterance(
      currentQuestion.display
    );

    utterance.lang = "ar-SA";
    utterance.rate = 0.65;
    utterance.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f3f7ff 0%,#f7fbff 48%,#fffaf0 100%)",
        padding: "28px 16px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#173f31",
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
            href="/games"
            style={{
              textDecoration: "none",
              background: "#fff",
              color: "#4f5fa8",
              border: "1px solid #d9def5",
              borderRadius: 15,
              padding: "11px 18px",
              fontWeight: 900,
            }}
          >
            ← العودة إلى الألعاب
          </Link>

          <div
            style={{
              background: "#fff",
              color: "#4f5fa8",
              border: "1px solid #d9def5",
              borderRadius: 15,
              padding: "11px 18px",
              fontWeight: 900,
            }}
          >
            ⭐ نقاطك: {score}
          </div>
        </div>

        <section
          style={{
            background:
              "linear-gradient(135deg,#4f5fa8,#7385df)",
            color: "#fff",
            borderRadius: 30,
            padding: "34px 20px",
            textAlign: "center",
            boxShadow:
              "0 15px 38px rgba(79,95,168,.18)",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 58 }}>🔒</div>

          <h1
            style={{
              margin: "8px 0",
              fontSize: "clamp(32px,5vw,46px)",
            }}
          >
            السكون
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              opacity: 0.94,
            }}
          >
            تعرّف على الحرف الساكن، واقرأه مع الحرف
            المتحرك الذي قبله.
          </p>
        </section>

        {!finished ? (
          <>
            <section
              style={{
                background: "#fff",
                borderRadius: 22,
                border: "1px solid #e2e5f3",
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
                  color: "#4f5fa8",
                }}
              >
                <span>
                  السؤال {questionIndex + 1} من{" "}
                  {questions.length}
                </span>
                <span>{progress}%</span>
              </div>

              <div
                style={{
                  height: 14,
                  background: "#eceef7",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg,#5e70c5,#9ba9f0)",
                  }}
                />
              </div>
            </section>

            <section
              style={{
                background: "#fff",
                borderRadius: 28,
                padding: "30px 22px",
                border: "1px solid #e2e5f3",
                boxShadow:
                  "0 14px 35px rgba(60,70,130,.08)",
              }}
            >
              <p
                style={{
                  margin: "0 0 14px",
                  textAlign: "center",
                  color: "#6f7890",
                  fontWeight: 800,
                }}
              >
                {currentQuestion.prompt}
              </p>

              <div
                style={{
                  textAlign: "center",
                  fontSize:
                    currentQuestion.mode === "audio"
                      ? "72px"
                      : "clamp(56px,10vw,88px)",
                  fontWeight: 900,
                  color: "#34406f",
                  marginBottom: 24,
                  lineHeight: 1.4,
                }}
              >
                {currentQuestion.mode === "audio"
                  ? "🎧"
                  : currentQuestion.display}
              </div>

              <button
                type="button"
                onClick={speakCurrentSound}
                style={{
                  width: "100%",
                  marginBottom: 24,
                  border: "1px solid #cbd2f2",
                  background: "#f3f5ff",
                  color: "#4f5fa8",
                  borderRadius: 17,
                  padding: "14px 16px",
                  fontSize: 18,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                🔊 استمع إلى الصوت
              </button>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(170px,1fr))",
                  gap: 14,
                }}
              >
                {currentQuestion.choices.map((choice) => {
                  const isCorrect =
                    answered &&
                    choice === currentQuestion.answer;

                  const isWrong =
                    answered &&
                    choice === selectedAnswer &&
                    choice !== currentQuestion.answer;

                  return (
                    <button
                      key={choice}
                      type="button"
                      disabled={answered}
                      onClick={() => chooseAnswer(choice)}
                      style={{
                        border: isCorrect
                          ? "2px solid #2fa96c"
                          : isWrong
                            ? "2px solid #e15c5c"
                            : "2px solid #e2e5f0",
                        background: isCorrect
                          ? "#e9f9ef"
                          : isWrong
                            ? "#fff0f0"
                            : "#fff",
                        borderRadius: 20,
                        padding: "21px 12px",
                        cursor: answered
                          ? "default"
                          : "pointer",
                        color: "#34406f",
                        fontSize: 26,
                        fontWeight: 900,
                      }}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div style={{ marginTop: 22 }}>
                  <div
                    style={{
                      textAlign: "center",
                      borderRadius: 17,
                      padding: 17,
                      marginBottom: 14,
                      fontWeight: 900,
                      background:
                        selectedAnswer ===
                        currentQuestion.answer
                          ? "#eaf9f0"
                          : "#fff3f3",
                      color:
                        selectedAnswer ===
                        currentQuestion.answer
                          ? "#147148"
                          : "#a63f3f",
                    }}
                  >
                    {selectedAnswer ===
                    currentQuestion.answer
                      ? "🎉 أحسنت! إجابتك صحيحة +10 نقاط"
                      : "🌱 حاول أن تلاحظ علامة السكون جيدًا"}
                  </div>

                  <div
                    style={{
                      background: "#f7f8ff",
                      border: "1px solid #e1e4f3",
                      borderRadius: 16,
                      padding: 15,
                      textAlign: "center",
                      color: "#66708c",
                      fontWeight: 800,
                      marginBottom: 14,
                    }}
                  >
                    📖 {currentQuestion.explanation}
                  </div>

                  <button
                    type="button"
                    onClick={nextQuestion}
                    style={{
                      width: "100%",
                      border: "none",
                      borderRadius: 17,
                      background:
                        "linear-gradient(135deg,#4f5fa8,#6578cf)",
                      color: "#fff",
                      padding: 15,
                      fontSize: 18,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    {questionIndex ===
                    questions.length - 1
                      ? "🏁 عرض النتيجة"
                      : "السؤال التالي ←"}
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          <section
            style={{
              background: "#fff",
              borderRadius: 28,
              padding: "38px 22px",
              border: "1px solid #e2e5f3",
              textAlign: "center",
              boxShadow:
                "0 14px 35px rgba(60,70,130,.08)",
            }}
          >
            <div style={{ fontSize: 68 }}>🏆</div>

            <h2
              style={{
                color: "#4f5fa8",
                fontSize: 30,
                marginBottom: 10,
              }}
            >
              رائع يا بطل!
            </h2>

            <p
              style={{
                color: "#68738d",
                fontSize: 18,
                lineHeight: 1.8,
              }}
            >
              أنهيت تدريب السكون وحصلت على{" "}
              <strong style={{ color: "#98720d" }}>
                {score} نقطة ⭐
              </strong>
            </p>

            <button
              type="button"
              onClick={restartGame}
              style={{
                width: "100%",
                marginTop: 16,
                border: "none",
                borderRadius: 17,
                background:
                  "linear-gradient(135deg,#4f5fa8,#6578cf)",
                color: "#fff",
                padding: 15,
                fontSize: 18,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              🔁 أعد التدريب
            </button>

            <Link
              href="/games"
              style={{
                display: "block",
                marginTop: 12,
                textDecoration: "none",
                border: "1px solid #d9def5",
                borderRadius: 17,
                padding: 14,
                color: "#4f5fa8",
                fontWeight: 900,
              }}
            >
              🎮 العودة إلى الألعاب
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}