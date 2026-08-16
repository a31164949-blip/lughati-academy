"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { completeLessonOneStation } from "../progress";
type QuestionType = "solar-lunar" | "analysis" | "syllable";

type ChoiceQuestion = {
  id: number;
  type: QuestionType;
  question: string;
  display?: string;
  choices: string[];
  answer: string;
  explanation: string;
};

const questions: ChoiceQuestion[] = [
  {
    id: 1,
    type: "solar-lunar",
    question: "ما نوع (ال) في كلمة: الرَّحِم؟",
    display: "الرَّحِم",
    choices: [
      "لام شمسية ☀️",
      "لام قمرية 🌙",
    ],
    answer: "لام شمسية ☀️",
    explanation:
      "في كلمة الرَّحِم لا ننطق اللام، والحرف بعدها مشدد، لذلك هي لام شمسية.",
  },
  {
    id: 2,
    type: "solar-lunar",
    question: "ما نوع (ال) في كلمة: الْأَقَارِب؟",
    display: "الْأَقَارِب",
    choices: [
      "لام شمسية ☀️",
      "لام قمرية 🌙",
    ],
    answer: "لام قمرية 🌙",
    explanation:
      "في كلمة الْأَقَارِب ننطق اللام بوضوح، لذلك هي لام قمرية.",
  },
  {
    id: 3,
    type: "solar-lunar",
    question: "اختر الكلمة التي تحتوي على لام قمرية.",
    choices: [
      "الرَّحِم",
      "السُّؤَال",
      "الْحَاجَة",
      "النَّاس",
    ],
    answer: "الْحَاجَة",
    explanation:
      "في كلمة الْحَاجَة ننطق اللام، ولذلك فهي لام قمرية.",
  },
  {
    id: 4,
    type: "analysis",
    question: "أي تحليل هو الصحيح لكلمة: فَوَّاز؟",
    display: "فَوَّاز",
    choices: [
      "فَ / وَّا / ز",
      "فَوْ / وَاز",
      "فَ / وَ / از",
      "فَوَّ / از",
    ],
    answer: "فَ / وَّا / ز",
    explanation:
      "نحلل الكلمة بحسب نطقها إلى مقاطع تساعدنا على القراءة الصحيحة.",
  },
  {
    id: 5,
    type: "analysis",
    question: "أي كلمة تبدأ بالمقطع: صِ؟",
    choices: [
      "صِلَة",
      "سُؤَال",
      "رَحِم",
      "حَاجَة",
    ],
    answer: "صِلَة",
    explanation:
      "كلمة صِلَة تبدأ بالمقطع صِ.",
  },
  {
    id: 6,
    type: "syllable",
    question: "ما المقطع الأول في كلمة: مُذِيع؟",
    display: "مُذِيع",
    choices: [
      "مُ",
      "ذِ",
      "يع",
      "مَ",
    ],
    answer: "مُ",
    explanation:
      "المقطع الأول في كلمة مُذِيع هو مُ.",
  },
];

function getStageInfo(type: QuestionType) {
  if (type === "solar-lunar") {
    return {
      title: "☀️🌙 خبير اللام",
      note: "أميز بين اللام الشمسية والقمرية.",
    };
  }

  if (type === "analysis") {
    return {
      title: "🧩 أحلل الكلمة",
      note: "أقسم الكلمة إلى أجزاء تساعدني على قراءتها.",
    };
  }

  return {
    title: "🔤 أكتشف المقطع",
    note: "أحدد المقطع المطلوب داخل الكلمة.",
  };
}

export default function LanguagePage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions[questionIndex];
  const stageInfo = getStageInfo(currentQuestion.type);

  const progress = useMemo(
    () =>
      Math.round(
        ((questionIndex + 1) / questions.length) * 100
      ),
    [questionIndex]
  );

  function chooseAnswer(choice: string) {
    if (answered) return;

    const correct =
      choice === currentQuestion.answer;

    setSelectedAnswer(choice);
    setAnswered(true);
    setAnswerCorrect(correct);

    if (correct) {
      setScore((current) => current + 10);
    }
  }

  function nextQuestion() {
    if (!answered) return;

   if (questionIndex === questions.length - 1) {
  completeLessonOneStation("language");
  setFinished(true);
  return;
}

    setQuestionIndex(
      (current) => current + 1
    );

    setSelectedAnswer("");
    setAnswered(false);
    setAnswerCorrect(false);
  }

  function restart() {
    setQuestionIndex(0);
    setSelectedAnswer("");
    setAnswered(false);
    setAnswerCorrect(false);
    setScore(0);
    setFinished(false);
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f5f1ff 0%,#f7fbff 50%,#eefaf6 100%)",
        padding: "28px 16px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#183d31",
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
              color: "#6d4ba5",
              border: "1px solid #ded4ef",
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
              color: "#6d4ba5",
              border: "1px solid #ded4ef",
              borderRadius: 15,
              padding: "11px 18px",
              fontWeight: 900,
            }}
          >
            🔎 نقاط المكتشف: {score}
          </div>
        </div>

        <section
          style={{
            background:
              "linear-gradient(135deg,#6d4ba5,#9c7bd6)",
            color: "#fff",
            borderRadius: 30,
            padding: "34px 20px",
            textAlign: "center",
            boxShadow:
              "0 15px 38px rgba(109,75,165,.18)",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 58 }}>
            🔎
          </div>

          <h1
            style={{
              margin: "8px 0",
              fontSize:
                "clamp(32px,5vw,46px)",
            }}
          >
            مكتشف اللغة
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              opacity: 0.95,
            }}
          >
            اكتشف أسرار الكلمات، وميّز اللام
            الشمسية والقمرية، وحلل المقاطع.
          </p>
        </section>

        {!finished ? (
          <>
            <section
              style={{
                background: "#fff",
                borderRadius: 22,
                border:
                  "1px solid #e4dff0",
                padding: 20,
                marginBottom: 18,
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
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#6d4ba5",
                    }}
                  >
                    {stageInfo.title}
                  </div>

                  <div
                    style={{
                      color: "#817991",
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  >
                    {stageInfo.note}
                  </div>
                </div>

                <strong
                  style={{
                    color: "#6d4ba5",
                  }}
                >
                  التحدي{" "}
                  {questionIndex + 1} من{" "}
                  {questions.length}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginBottom: 10,
                  color: "#817991",
                  fontWeight: 800,
                }}
              >
                <span>
                  تقدم مكتشف اللغة
                </span>
                <span>{progress}%</span>
              </div>

              <div
                style={{
                  height: 14,
                  background: "#eeeaf5",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg,#6d4ba5,#b094df)",
                    transition:
                      "width .35s ease",
                  }}
                />
              </div>
            </section>

            <section
              style={{
                background: "#fff",
                borderRadius: 28,
                padding: "32px 22px",
                border:
                  "1px solid #e4dff0",
                boxShadow:
                  "0 14px 35px rgba(100,75,150,.08)",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 26,
                }}
              >
                <div
                  style={{
                    fontSize: 52,
                    marginBottom: 12,
                  }}
                >
                  {currentQuestion.type ===
                  "solar-lunar"
                    ? "☀️🌙"
                    : currentQuestion.type ===
                        "analysis"
                      ? "🧩"
                      : "🔤"}
                </div>

                {currentQuestion.display && (
                  <div
                    style={{
                      display:
                        "inline-block",
                      marginBottom: 14,
                      background:
                        "#f5f1ff",
                      border:
                        "1px solid #ded4ef",
                      color: "#5c3e91",
                      borderRadius: 20,
                      padding:
                        "12px 22px",
                      fontSize: 34,
                      fontWeight: 900,
                    }}
                  >
                    {currentQuestion.display}
                  </div>
                )}

                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "clamp(23px,4vw,31px)",
                    lineHeight: 1.9,
                    color: "#4a3867",
                  }}
                >
                  {currentQuestion.question}
                </h2>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 14,
                }}
              >
                {currentQuestion.choices.map(
                  (choice) => {
                    const isCorrect =
                      answered &&
                      choice ===
                        currentQuestion.answer;

                    const isWrong =
                      answered &&
                      choice ===
                        selectedAnswer &&
                      choice !==
                        currentQuestion.answer;

                    return (
                      <button
                        key={choice}
                        type="button"
                        disabled={answered}
                        onClick={() =>
                          chooseAnswer(choice)
                        }
                        style={{
                          border: isCorrect
                            ? "2px solid #2fa96c"
                            : isWrong
                              ? "2px solid #e15c5c"
                              : "2px solid #e3ddec",
                          background:
                            isCorrect
                              ? "#e9f9ef"
                              : isWrong
                                ? "#fff0f0"
                                : "#fff",
                          borderRadius: 20,
                          padding:
                            "20px 16px",
                          cursor: answered
                            ? "default"
                            : "pointer",
                          color: "#4a3867",
                          fontSize: 20,
                          fontWeight: 900,
                          lineHeight: 1.8,
                        }}
                      >
                        {choice}
                      </button>
                    );
                  }
                )}
              </div>

              {answered && (
                <div
                  style={{
                    marginTop: 22,
                  }}
                >
                  <div
                    style={{
                      textAlign:
                        "center",
                      borderRadius: 17,
                      padding: 17,
                      marginBottom: 14,
                      fontWeight: 900,
                      background:
                        answerCorrect
                          ? "#eaf9f0"
                          : "#fff3f3",
                      color:
                        answerCorrect
                          ? "#147148"
                          : "#a63f3f",
                    }}
                  >
                    {answerCorrect
                      ? "🎉 اكتشاف صحيح! +10 نقاط"
                      : "🌱 اقتربت! راجع الكلمة وحاول أن تلاحظ علاماتها"}
                  </div>

                  <div
                    style={{
                      background:
                        "#f7f4fc",
                      border:
                        "1px solid #e5dff1",
                      borderRadius: 16,
                      padding: 15,
                      textAlign:
                        "center",
                      color: "#746789",
                      fontWeight: 800,
                      marginBottom: 14,
                      lineHeight: 1.9,
                    }}
                  >
                    🔎{" "}
                    {
                      currentQuestion.explanation
                    }
                  </div>

                  <button
                    type="button"
                    onClick={
                      nextQuestion
                    }
                    style={{
                      width: "100%",
                      border: "none",
                      borderRadius: 17,
                      background:
                        "linear-gradient(135deg,#6d4ba5,#8b68c4)",
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
                      : "التحدي التالي ←"}
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
              border:
                "1px solid #e4dff0",
              textAlign: "center",
              boxShadow:
                "0 14px 35px rgba(100,75,150,.08)",
            }}
          >
            <div
              style={{
                fontSize: 72,
              }}
            >
              🔎
            </div>

            <h2
              style={{
                color: "#6d4ba5",
                fontSize: 30,
                marginBottom: 10,
              }}
            >
              أصبحت مكتشف اللغة!
            </h2>

            <p
              style={{
                color: "#756d80",
                fontSize: 18,
                lineHeight: 1.9,
              }}
            >
              أنهيت تحديات اللام والتحليل
              والمقاطع وحصلت على{" "}
              <strong
                style={{
                  color: "#6d4ba5",
                }}
              >
                {score} من 60 نقطة ⭐
              </strong>
            </p>

            <div
              style={{
                marginTop: 20,
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(170px,1fr))",
                gap: 10,
              }}
            >
              <div style={resultCardStyle}>
                ☀️🌙
                <strong>
                  اللام الشمسية والقمرية
                </strong>
                <span>مكتمل</span>
              </div>

              <div style={resultCardStyle}>
                🧩
                <strong>
                  تحليل الكلمات
                </strong>
                <span>مكتمل</span>
              </div>

              <div style={resultCardStyle}>
                🔤
                <strong>
                  المقاطع
                </strong>
                <span>مكتمل</span>
              </div>
            </div>

            <button
              type="button"
              onClick={restart}
              style={{
                width: "100%",
                marginTop: 20,
                border: "none",
                borderRadius: 17,
                background:
                  "linear-gradient(135deg,#6d4ba5,#8b68c4)",
                color: "#fff",
                padding: 15,
                fontSize: 18,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              🔁 أعد تحديات اللغة
            </button>

            <Link
              href="/lessons/unit1/lesson1"
              style={{
                display: "block",
                marginTop: 12,
                textDecoration: "none",
                border:
                  "1px solid #ded4ef",
                borderRadius: 17,
                padding: 14,
                color: "#6d4ba5",
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

const resultCardStyle = {
  background: "#f7f4fc",
  border: "1px solid #e4dff0",
  borderRadius: 18,
  padding: 16,
  display: "grid",
  gap: 6,
  fontSize: 22,
  color: "#6d4ba5",
} as const;