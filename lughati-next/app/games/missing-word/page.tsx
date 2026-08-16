"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Question = {
  id: number;
  sentence: string;
  answer: string;
  choices: string[];
  hint: string;
};

const questions: Question[] = [
  {
    id: 1,
    sentence: "ذهبَ خالدٌ إلى ____ صباحًا.",
    answer: "المدرسة",
    choices: ["المدرسة", "القلم", "الكتاب", "المطر"],
    hint: "مكان نذهب إليه للتعلّم 🏫",
  },
  {
    id: 2,
    sentence: "يقرأُ الطالبُ ____ المفيدة.",
    answer: "القصة",
    choices: ["السيارة", "القصة", "الشجرة", "النافذة"],
    hint: "نقرأها ونستمتع بأحداثها 📖",
  },
  {
    id: 3,
    sentence: "كتبَ محمدٌ واجبهُ بـ ____.",
    answer: "القلم",
    choices: ["الحقيبة", "القلم", "الكرسي", "الباب"],
    hint: "نستخدمه في الكتابة ✏️",
  },
  {
    id: 4,
    sentence: "شربَ الطفلُ ____ بعد اللعب.",
    answer: "الماء",
    choices: ["الماء", "الكتاب", "الطاولة", "الحذاء"],
    hint: "نشربه عندما نشعر بالعطش 💧",
  },
  {
    id: 5,
    sentence: "تشرقُ ____ في الصباح.",
    answer: "الشمس",
    choices: ["الشمس", "الحقيبة", "الكرة", "المسطرة"],
    hint: "تضيء السماء نهارًا ☀️",
  },
];

export default function MissingWordGamePage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions[questionIndex];

  const progress = useMemo(() => {
    return Math.round(((questionIndex + 1) / questions.length) * 100);
  }, [questionIndex]);

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

    const isLastQuestion = questionIndex === questions.length - 1;

    if (isLastQuestion) {
      setFinished(true);
      return;
    }

    setQuestionIndex((current) => current + 1);
    setSelectedAnswer("");
    setAnswered(false);
    setShowHint(false);
  }

  function restartGame() {
    setQuestionIndex(0);
    setSelectedAnswer("");
    setScore(0);
    setShowHint(false);
    setAnswered(false);
    setFinished(false);
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #effbf4 0%, #f7fbff 45%, #fffaf0 100%)",
        padding: "28px 16px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#17352a",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "22px",
          }}
        >
          <Link
            href="/games"
            style={{
              textDecoration: "none",
              background: "#ffffff",
              color: "#14734d",
              padding: "11px 17px",
              borderRadius: "15px",
              border: "1px solid #cfe9dc",
              fontWeight: 900,
            }}
          >
            ← العودة إلى الألعاب
          </Link>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #d8eee5",
              borderRadius: "16px",
              padding: "11px 16px",
              fontWeight: 900,
              color: "#176c46",
            }}
          >
            ⭐ نقاطك: {score}
          </div>
        </div>

        <section
          style={{
            background:
              "linear-gradient(135deg, #147c54, #20a06d)",
            color: "white",
            borderRadius: "28px",
            padding: "28px 22px",
            textAlign: "center",
            boxShadow: "0 14px 35px rgba(20, 120, 80, 0.18)",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              fontSize: "52px",
              marginBottom: "8px",
            }}
          >
            🧩
          </div>

          <h1
            style={{
              margin: "0 0 9px",
              fontSize: "34px",
            }}
          >
            الكلمة المفقودة
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              opacity: 0.92,
            }}
          >
            اختر الكلمة المناسبة لإكمال الجملة
          </p>
        </section>

        {!finished ? (
          <>
            <section
              style={{
                background: "#ffffff",
                border: "1px solid #dbeee6",
                borderRadius: "24px",
                padding: "20px",
                marginBottom: "18px",
                boxShadow: "0 10px 28px rgba(30, 100, 70, 0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <strong
                  style={{
                    color: "#176c46",
                  }}
                >
                  السؤال {questionIndex + 1} من {questions.length}
                </strong>

                <span
                  style={{
                    color: "#6c7d75",
                    fontSize: "14px",
                  }}
                >
                  {progress}%
                </span>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "14px",
                  background: "#e7efeb",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background:
                      "linear-gradient(90deg, #27a76a, #6bd697)",
                  }}
                />
              </div>
            </section>

            <section
              style={{
                background: "#ffffff",
                border: "1px solid #dceee7",
                borderRadius: "28px",
                padding: "30px 22px",
                boxShadow: "0 14px 35px rgba(30, 100, 70, 0.08)",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontSize: "27px",
                  fontWeight: 900,
                  lineHeight: 1.9,
                  marginBottom: "28px",
                  color: "#184b39",
                }}
              >
                {currentQuestion.sentence}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: "14px",
                  marginBottom: "20px",
                }}
              >
                {currentQuestion.choices.map((choice) => {
                  const isCorrect =
                    answered && choice === currentQuestion.answer;

                  const isWrong =
                    answered &&
                    choice === selectedAnswer &&
                    choice !== currentQuestion.answer;

                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => chooseAnswer(choice)}
                      disabled={answered}
                      style={{
                        border: isCorrect
                          ? "2px solid #2ea96b"
                          : isWrong
                            ? "2px solid #e65c5c"
                            : "2px solid #dfe9e4",
                        background: isCorrect
                          ? "#e9faef"
                          : isWrong
                            ? "#fff0f0"
                            : "#ffffff",
                        color: isCorrect
                          ? "#147148"
                          : isWrong
                            ? "#b73b3b"
                            : "#294f42",
                        borderRadius: "18px",
                        padding: "18px 12px",
                        fontSize: "19px",
                        fontWeight: 900,
                        cursor: answered ? "default" : "pointer",
                      }}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              {!answered && (
                <button
                  type="button"
                  onClick={() => setShowHint((current) => !current)}
                  style={{
                    width: "100%",
                    border: "1px solid #eedba3",
                    background: "#fff9e9",
                    color: "#8d6a0d",
                    borderRadius: "16px",
                    padding: "13px",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  💡 أحتاج تلميحًا
                </button>
              )}

              {showHint && !answered && (
                <div
                  style={{
                    marginTop: "14px",
                    background: "#f5fbf8",
                    border: "1px solid #d8eee5",
                    borderRadius: "16px",
                    padding: "14px",
                    textAlign: "center",
                    color: "#55766a",
                    fontWeight: 800,
                  }}
                >
                  {currentQuestion.hint}
                </div>
              )}

              {answered && (
                <div
                  style={{
                    marginTop: "20px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      background:
                        selectedAnswer === currentQuestion.answer
                          ? "#eaf9f0"
                          : "#fff3f3",
                      borderRadius: "18px",
                      padding: "17px",
                      marginBottom: "14px",
                      fontWeight: 900,
                      color:
                        selectedAnswer === currentQuestion.answer
                          ? "#147148"
                          : "#a63f3f",
                    }}
                  >
                    {selectedAnswer === currentQuestion.answer
                      ? "🎉 أحسنت يا بطل! إجابة صحيحة +10 نقاط"
                      : `🌱 محاولة جميلة! الإجابة الصحيحة هي: ${currentQuestion.answer}`}
                  </div>

                  <button
                    type="button"
                    onClick={nextQuestion}
                    style={{
                      width: "100%",
                      border: "none",
                      background:
                        "linear-gradient(135deg, #168a63, #0f7654)",
                      color: "white",
                      borderRadius: "17px",
                      padding: "15px",
                      fontWeight: 900,
                      fontSize: "18px",
                      cursor: "pointer",
                    }}
                  >
                    {questionIndex === questions.length - 1
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
              background: "#ffffff",
              borderRadius: "28px",
              padding: "35px 22px",
              textAlign: "center",
              border: "1px solid #dceee7",
              boxShadow: "0 14px 35px rgba(30, 100, 70, 0.09)",
            }}
          >
            <div
              style={{
                fontSize: "64px",
                marginBottom: "12px",
              }}
            >
              🏆
            </div>

            <h2
              style={{
                margin: "0 0 12px",
                color: "#176c46",
                fontSize: "30px",
              }}
            >
              أحسنت يا بطل!
            </h2>

            <p
              style={{
                color: "#61776d",
                lineHeight: 1.8,
                marginBottom: "22px",
                fontSize: "18px",
              }}
            >
              أنهيت تحدي الكلمة المفقودة وحصلت على
              <strong
                style={{
                  color: "#98720d",
                }}
              >
                {" "}
                {score} نقطة ⭐
              </strong>
            </p>

            <button
              type="button"
              onClick={restartGame}
              style={{
                width: "100%",
                border: "none",
                background:
                  "linear-gradient(135deg, #168a63, #0f7654)",
                color: "white",
                borderRadius: "17px",
                padding: "15px",
                fontWeight: 900,
                fontSize: "18px",
                cursor: "pointer",
                marginBottom: "12px",
              }}
            >
              🔁 العب مرة أخرى
            </button>

            <Link
              href="/games"
              style={{
                display: "block",
                textDecoration: "none",
                border: "1px solid #cfe7dd",
                color: "#17674d",
                background: "#ffffff",
                borderRadius: "17px",
                padding: "14px",
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