"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type LongVowelType = "alif" | "yaa" | "waw";

type Question = {
  id: number;
  prompt: string;
  display: string;
  answer: LongVowelType | string;
  choices: {
    id: LongVowelType | string;
    label: string;
    example?: string;
  }[];
  explanation: string;
  mode?: "visual" | "audio";
};

const questions: Question[] = [
  {
    id: 1,
    prompt: "أي مقطع فيه مد بالألف؟",
    display: "بَ / با",
    answer: "alif",
    choices: [
      { id: "alif", label: "با", example: "مد بالألف" },
      { id: "yaa", label: "بي", example: "مد بالياء" },
      { id: "waw", label: "بو", example: "مد بالواو" },
    ],
    explanation:
      "با فيها مد بالألف، وصوتها أطول من بَ.",
  },
  {
    id: 2,
    prompt: "أي مقطع فيه مد بالياء؟",
    display: "بِ / بي",
    answer: "yaa",
    choices: [
      { id: "alif", label: "با", example: "مد بالألف" },
      { id: "yaa", label: "بي", example: "مد بالياء" },
      { id: "waw", label: "بو", example: "مد بالواو" },
    ],
    explanation:
      "بي فيها مد بالياء، وصوتها أطول من بِ.",
  },
  {
    id: 3,
    prompt: "أي مقطع فيه مد بالواو؟",
    display: "بُ / بو",
    answer: "waw",
    choices: [
      { id: "alif", label: "با", example: "مد بالألف" },
      { id: "yaa", label: "بي", example: "مد بالياء" },
      { id: "waw", label: "بو", example: "مد بالواو" },
    ],
    explanation:
      "بو فيها مد بالواو، وصوتها أطول من بُ.",
  },
  {
    id: 4,
    prompt: "ما حرف المد في كلمة: باب؟",
    display: "بَاب",
    answer: "alif",
    choices: [
      { id: "alif", label: "الألف ا" },
      { id: "yaa", label: "الياء ي" },
      { id: "waw", label: "الواو و" },
    ],
    explanation:
      "في كلمة باب، حرف المد هو الألف.",
  },
  {
    id: 5,
    prompt: "🎧 استمع ثم اختر المقطع الذي سمعته",
    display: "بي",
    answer: "بي",
    choices: [
      { id: "با", label: "با" },
      { id: "بي", label: "بي" },
      { id: "بو", label: "بو" },
    ],
    explanation:
      "سمعتَ بي، وهذا مد بالياء.",
    mode: "audio",
  },
  {
    id: 6,
    prompt: "🎧 استمع ثم اختر المقطع الذي سمعته",
    display: "بو",
    answer: "بو",
    choices: [
      { id: "با", label: "با" },
      { id: "بي", label: "بي" },
      { id: "بو", label: "بو" },
    ],
    explanation:
      "سمعتَ بو، وهذا مد بالواو.",
    mode: "audio",
  },
];

export default function LongVowelsGamePage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] =
    useState<LongVowelType | string>("");
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

  function chooseAnswer(answer: LongVowelType | string) {
    if (answered) return;

    setSelectedAnswer(answer);
    setAnswered(true);

    if (answer === currentQuestion.answer) {
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
          "linear-gradient(180deg,#fffaf0 0%,#fffdf8 45%,#f3fbf7 100%)",
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
              color: "#9b7416",
              border: "1px solid #efddb0",
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
              color: "#9b7416",
              border: "1px solid #efddb0",
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
              "linear-gradient(135deg,#d89d19,#f2bf47)",
            color: "#fff",
            borderRadius: 30,
            padding: "34px 20px",
            textAlign: "center",
            boxShadow:
              "0 15px 38px rgba(216,157,25,.18)",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 58 }}>⭐</div>

          <h1
            style={{
              margin: "8px 0",
              fontSize: "clamp(32px,5vw,46px)",
            }}
          >
            حروف المد
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              opacity: 0.95,
            }}
          >
            تعرّف على المد بالألف والواو والياء، وميّز
            بين الصوت القصير والصوت الطويل.
          </p>
        </section>

        {!finished ? (
          <>
            <section
              style={{
                background: "#fff",
                borderRadius: 22,
                border: "1px solid #f0e3c4",
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
                  color: "#9b7416",
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
                  background: "#f5f0e4",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg,#d89d19,#f2c968)",
                  }}
                />
              </div>
            </section>

            <section
              style={{
                background: "#fff",
                borderRadius: 28,
                padding: "30px 22px",
                border: "1px solid #f0e3c4",
                boxShadow:
                  "0 14px 35px rgba(150,110,20,.08)",
              }}
            >
              <p
                style={{
                  margin: "0 0 14px",
                  textAlign: "center",
                  color: "#7e755e",
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
                      : "clamp(48px,9vw,82px)",
                  fontWeight: 900,
                  color: "#705714",
                  marginBottom: 24,
                  lineHeight: 1.5,
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
                  border: "1px solid #eed99e",
                  background: "#fff9e8",
                  color: "#9b7416",
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
                    "repeat(auto-fit,minmax(180px,1fr))",
                  gap: 14,
                }}
              >
                {currentQuestion.choices.map((choice) => {
                  const isCorrect =
                    answered &&
                    choice.id === currentQuestion.answer;

                  const isWrong =
                    answered &&
                    choice.id === selectedAnswer &&
                    choice.id !== currentQuestion.answer;

                  return (
                    <button
                      key={String(choice.id)}
                      type="button"
                      disabled={answered}
                      onClick={() =>
                        chooseAnswer(choice.id)
                      }
                      style={{
                        border: isCorrect
                          ? "2px solid #2fa96c"
                          : isWrong
                            ? "2px solid #e15c5c"
                            : "2px solid #efe4c8",
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
                        color: "#705714",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 31,
                          fontWeight: 900,
                        }}
                      >
                        {choice.label}
                      </div>

                      {choice.example && (
                        <div
                          style={{
                            marginTop: 8,
                            color: "#8c8370",
                            fontSize: 14,
                          }}
                        >
                          {choice.example}
                        </div>
                      )}
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
                      : "🌱 انتبه إلى طول الصوت وحرف المد"}
                  </div>

                  <div
                    style={{
                      background: "#fffaf0",
                      border: "1px solid #f0e3c4",
                      borderRadius: 16,
                      padding: 15,
                      textAlign: "center",
                      color: "#756b53",
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
                        "linear-gradient(135deg,#d89d19,#eba92b)",
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
              border: "1px solid #f0e3c4",
              textAlign: "center",
              boxShadow:
                "0 14px 35px rgba(150,110,20,.08)",
            }}
          >
            <div style={{ fontSize: 68 }}>🏆</div>

            <h2
              style={{
                color: "#9b7416",
                fontSize: 30,
                marginBottom: 10,
              }}
            >
              أحسنت يا بطل!
            </h2>

            <p
              style={{
                color: "#786f5c",
                fontSize: 18,
                lineHeight: 1.8,
              }}
            >
              أنهيت تدريب حروف المد وحصلت على{" "}
              <strong style={{ color: "#9b7416" }}>
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
                  "linear-gradient(135deg,#d89d19,#eba92b)",
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
                border: "1px solid #efddb0",
                borderRadius: 17,
                padding: 14,
                color: "#9b7416",
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