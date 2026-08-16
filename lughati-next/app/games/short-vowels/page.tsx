"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type VowelType = "fatha" | "kasra" | "damma";

type Question = {
  id: number;
  prompt: string;
  display: string;
  answer: VowelType;
  mode?: "visual" | "audio";
  options: {
    id: VowelType;
    label: string;
    symbol: string;
    example: string;
  }[];
  explanation: string;
};

const questions: Question[] = [
  {
    id: 1,
    prompt: "ما الحركة على حرف الباء؟",
    display: "بَ",
    answer: "fatha",
    options: [
      { id: "fatha", label: "الفتحة", symbol: "َ", example: "بَ" },
      { id: "kasra", label: "الكسرة", symbol: "ِ", example: "بِ" },
      { id: "damma", label: "الضمة", symbol: "ُ", example: "بُ" },
    ],
    explanation: "بَ: هذه فتحة، وصوتها قصير: بَ",
  },
  {
    id: 2,
    prompt: "اختر الحركة المناسبة للمقطع:",
    display: "مِ",
    answer: "kasra",
    options: [
      { id: "fatha", label: "الفتحة", symbol: "َ", example: "مَ" },
      { id: "kasra", label: "الكسرة", symbol: "ِ", example: "مِ" },
      { id: "damma", label: "الضمة", symbol: "ُ", example: "مُ" },
    ],
    explanation: "مِ: هذه كسرة، وصوتها قصير: مِ",
  },
  {
    id: 3,
    prompt: "ما الحركة على حرف الكاف؟",
    display: "كُ",
    answer: "damma",
    options: [
      { id: "fatha", label: "الفتحة", symbol: "َ", example: "كَ" },
      { id: "kasra", label: "الكسرة", symbol: "ِ", example: "كِ" },
      { id: "damma", label: "الضمة", symbol: "ُ", example: "كُ" },
    ],
    explanation: "كُ: هذه ضمة، وصوتها قصير: كُ",
  },
  {
    id: 4,
    prompt: "انظر إلى أول حرف في الكلمة، ما حركته؟",
    display: "كَتَبَ",
    answer: "fatha",
    options: [
      { id: "fatha", label: "الفتحة", symbol: "َ", example: "كَ" },
      { id: "kasra", label: "الكسرة", symbol: "ِ", example: "كِ" },
      { id: "damma", label: "الضمة", symbol: "ُ", example: "كُ" },
    ],
    explanation: "أول حرف هو كَ، وعليه فتحة.",
  },
  {
    id: 5,
    prompt: "انظر إلى أول حرف في الكلمة، ما حركته؟",
    display: "بِنت",
    answer: "kasra",
    mode: "audio",
    options: [
      { id: "fatha", label: "الفتحة", symbol: "َ", example: "بَ" },
      { id: "kasra", label: "الكسرة", symbol: "ِ", example: "بِ" },
      { id: "damma", label: "الضمة", symbol: "ُ", example: "بُ" },
    ],
    explanation: "أول حرف هو بِ، وعليه كسرة.",
  },
  {
    id: 6,
    prompt: "انظر إلى أول حرف في الكلمة، ما حركته؟",
    display: "كُتُب",
    answer: "damma",
    mode: "audio",
    options: [
      { id: "fatha", label: "الفتحة", symbol: "َ", example: "كَ" },
      { id: "kasra", label: "الكسرة", symbol: "ِ", example: "كِ" },
      { id: "damma", label: "الضمة", symbol: "ُ", example: "كُ" },
    ],
    explanation: "أول حرف هو كُ، وعليه ضمة.",
  },
];

export default function ShortVowelsGamePage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] =
    useState<VowelType | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions[questionIndex];

  const progress = useMemo(
    () =>
      Math.round(
        ((questionIndex + 1) / questions.length) * 100
      ),
    [questionIndex]
  );

  function chooseAnswer(answer: VowelType) {
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
    setSelectedAnswer(null);
    setAnswered(false);
  }

  function restartGame() {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnswered(false);
    setFinished(false);
  }
  function speakCurrentSound() {
  if (typeof window === "undefined") return;

  const utterance = new SpeechSynthesisUtterance(
    currentQuestion.display
  );

  utterance.lang = "ar-SA";
  utterance.rate = 0.7;
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
          "linear-gradient(180deg,#eefbf5 0%,#f8fbff 50%,#fffaf0 100%)",
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
              color: "#176d4c",
              border: "1px solid #cfe8dd",
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
              color: "#176d4c",
              border: "1px solid #cfe8dd",
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
              "linear-gradient(135deg,#176f9b,#26a6c8)",
            color: "#fff",
            borderRadius: 30,
            padding: "34px 20px",
            textAlign: "center",
            boxShadow: "0 15px 38px rgba(23,111,155,.18)",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 58 }}>🎯</div>

          <h1
            style={{
              margin: "8px 0",
              fontSize: "clamp(32px,5vw,46px)",
            }}
          >
            الحركات القصيرة
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              opacity: 0.94,
            }}
          >
            تعرّف على الفتحة والكسرة والضمة، ثم استخدمها
            في قراءة المقاطع والكلمات.
          </p>
        </section>

        {!finished ? (
          <>
            <section
              style={{
                background: "#fff",
                borderRadius: 22,
                border: "1px solid #deebe5",
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
                  color: "#176d4c",
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
                  background: "#e6efeb",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg,#28a96d,#69d799)",
                  }}
                />
              </div>
            </section>

            <section
              style={{
                background: "#fff",
                borderRadius: 28,
                padding: "30px 22px",
                border: "1px solid #deebe5",
                boxShadow:
                  "0 14px 35px rgba(30,100,70,.08)",
              }}
            >
              <p
                style={{
                  margin: "0 0 14px",
                  textAlign: "center",
                  color: "#698078",
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
    color: "#164d3a",
    marginBottom: 28,
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
    border: "1px solid #b9dfea",
    background: "#eefaff",
    color: "#176f9b",
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
                {currentQuestion.options.map((option) => {
                  const isCorrect =
                    answered &&
                    option.id === currentQuestion.answer;

                  const isWrong =
                    answered &&
                    option.id === selectedAnswer &&
                    option.id !== currentQuestion.answer;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={answered}
                      onClick={() =>
                        chooseAnswer(option.id)
                      }
                      style={{
                        border: isCorrect
                          ? "2px solid #2fa96c"
                          : isWrong
                            ? "2px solid #e15c5c"
                            : "2px solid #dce8e2",
                        background: isCorrect
                          ? "#e9f9ef"
                          : isWrong
                            ? "#fff0f0"
                            : "#fff",
                        borderRadius: 20,
                        padding: "20px 12px",
                        cursor: answered
                          ? "default"
                          : "pointer",
                        color: "#244b3d",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 42,
                          fontWeight: 900,
                          marginBottom: 6,
                        }}
                      >
                        {option.symbol}
                      </div>

                      <strong
                        style={{
                          display: "block",
                          fontSize: 19,
                        }}
                      >
                        {option.label}
                      </strong>

                      <div
                        style={{
                          marginTop: 7,
                          color: "#74877f",
                          fontSize: 18,
                        }}
                      >
                        مثال: {option.example}
                      </div>
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div
                  style={{
                    marginTop: 22,
                  }}
                >
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
                      : "🌱 حاول أن تلاحظ الحركة جيدًا"}
                  </div>

                  <div
                    style={{
                      background: "#f5fbf8",
                      border: "1px solid #d8eee5",
                      borderRadius: 16,
                      padding: 15,
                      textAlign: "center",
                      color: "#55766a",
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
                        "linear-gradient(135deg,#168a63,#0f7654)",
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
              border: "1px solid #dceee6",
              textAlign: "center",
              boxShadow:
                "0 14px 35px rgba(30,100,70,.08)",
            }}
          >
            <div style={{ fontSize: 68 }}>🏆</div>

            <h2
              style={{
                color: "#176d4c",
                fontSize: 30,
                marginBottom: 10,
              }}
            >
              رائع يا بطل!
            </h2>

            <p
              style={{
                color: "#687d74",
                fontSize: 18,
                lineHeight: 1.8,
              }}
            >
              أنهيت تدريب الحركات القصيرة وحصلت على{" "}
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
                  "linear-gradient(135deg,#168a63,#0f7654)",
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
                border: "1px solid #cfe7dd",
                borderRadius: 17,
                padding: 14,
                color: "#17674d",
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