"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { completeLessonOneStation } from "../progress";
type ChoiceQuestion = {
  id: number;
  type: "choice";
  stage: "meaning" | "sentence" | "situation";
  question: string;
  word?: string;
  choices: string[];
  answer: string;
  explanation: string;
};

type MatchQuestion = {
  id: number;
  type: "match";
  stage: "match";
  question: string;
  pairs: {
    word: string;
    meaning: string;
  }[];
  explanation: string;
};

type Question = ChoiceQuestion | MatchQuestion;

const questions: Question[] = [
  {
    id: 1,
    type: "choice",
    stage: "meaning",
    question: "ما معنى كلمة: الرَّحِم؟",
    word: "الرَّحِم",
    choices: [
      "الأقارب الذين تربطنا بهم صلة قرابة",
      "زملاء المدرسة",
      "الجيران فقط",
      "الأصدقاء فقط",
    ],
    answer: "الأقارب الذين تربطنا بهم صلة قرابة",
    explanation:
      "الرَّحِم هم الأقارب الذين تربطنا بهم صلة قرابة.",
  },
  {
    id: 2,
    type: "choice",
    stage: "meaning",
    question: "ما معنى كلمة: تَفَقُّد؟",
    word: "تَفَقُّد",
    choices: [
      "السؤال عن الشخص والاطمئنان عليه",
      "الابتعاد عن الشخص",
      "عدم زيارته",
      "اللعب معه فقط",
    ],
    answer: "السؤال عن الشخص والاطمئنان عليه",
    explanation:
      "تَفَقُّد الشخص يعني السؤال عن حاله والاطمئنان عليه.",
  },
  {
    id: 3,
    type: "match",
    stage: "match",
    question: "صِلْ كل كلمة بمعناها الصحيح.",
    pairs: [
      {
        word: "الأَقَارِب",
        meaning: "أفراد العائلة الذين تجمعنا بهم صلة قرابة",
      },
      {
        word: "الحَاجَة",
        meaning: "وقت احتياج الشخص إلى المساعدة",
      },
      {
        word: "أَرْحَامُنَا",
        meaning: "أقاربنا",
      },
    ],
    explanation:
      "أحسنت! هذه الكلمات تساعدنا على فهم معنى صلة الرحم.",
  },
  
    {
  id: 4,
  type: "choice",
  stage: "sentence",
  question: "أَزُورُ ______ وَأَسْأَلُ عَنْ أَحْوَالِهِمْ.",
  choices: [
    "الْأَقَارِبَ",
    "الْحَاجَةَ",
    "الْمَدْرَسَةَ",
    "اللَّعِبَ",
  ],
  answer: "الْأَقَارِبَ",
  explanation:
    "نَقُولُ: أَزُورُ الْأَقَارِبَ وَأَسْأَلُ عَنْ أَحْوَالِهِمْ.",
},
  {
    id: 5,
    type: "choice",
    stage: "sentence",
    question: "أكمل الجملة: أساعد قريبي عند ______.",
    choices: [
      "الحاجة",
      "النوم",
      "اللعب",
      "السفر",
    ],
    answer: "الحاجة",
    explanation:
      "من صلة الرحم أن نساعد أقاربنا عند الحاجة.",
  },
  {
    id: 6,
    type: "choice",
    stage: "situation",
    question:
      "سمعت أن قريبك مريض، ماذا تفعل لتطبق صلة الرحم؟",
    choices: [
      "أسأل عنه وأزوره وأدعو له",
      "أتجاهله",
      "لا أسأل عنه",
      "أنتظر حتى يزورني",
    ],
    answer: "أسأل عنه وأزوره وأدعو له",
    explanation:
      "هذا تطبيق جميل لصلة الرحم: السؤال والزيارة والاهتمام.",
  },
];

function getStageInfo(question: Question) {
  if (question.stage === "meaning") {
    return {
      title: "💎 أكتشف المعنى",
      note: "أفهم معنى الكلمة من الدرس.",
    };
  }

  if (question.stage === "match") {
    return {
      title: "🧩 أوصل الكلمة بمعناها",
      note: "أطابق الكلمات مع معانيها.",
    };
  }

  if (question.stage === "sentence") {
    return {
      title: "✍️ أستخدم الكلمة",
      note: "أضع الكلمة في جملة صحيحة.",
    };
  }

  return {
    title: "🌟 أطبق في موقف",
    note: "أستخدم معنى الكلمة في حياتي.",
  };
}

export default function WordsPage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const [selectedWord, setSelectedWord] = useState("");
  const [selectedMeaning, setSelectedMeaning] = useState("");
  const [matches, setMatches] = useState<Record<string, string>>({});

  const currentQuestion = questions[questionIndex];
  const stageInfo = getStageInfo(currentQuestion);

  const progress = useMemo(
    () =>
      Math.round(
        ((questionIndex + 1) / questions.length) * 100
      ),
    [questionIndex]
  );

  function chooseAnswer(choice: string) {
    if (
      answered ||
      currentQuestion.type !== "choice"
    ) {
      return;
    }

    const correct =
      choice === currentQuestion.answer;

    setSelectedAnswer(choice);
    setAnswered(true);
    setAnswerCorrect(correct);

    if (correct) {
      setScore((current) => current + 10);
    }
  }

  function handleWordClick(word: string) {
    if (
      answered ||
      currentQuestion.type !== "match"
    ) {
      return;
    }

    setSelectedWord(word);
  }

  function handleMeaningClick(meaning: string) {
    if (
      answered ||
      currentQuestion.type !== "match" ||
      !selectedWord
    ) {
      return;
    }

    setSelectedMeaning(meaning);

    setMatches((current) => ({
      ...current,
      [selectedWord]: meaning,
    }));

    setSelectedWord("");
    setSelectedMeaning("");
  }

  function removeMatch(word: string) {
    if (answered) return;

    setMatches((current) => {
      const copy = { ...current };
      delete copy[word];
      return copy;
    });
  }

  function checkMatches() {
    if (
      answered ||
      currentQuestion.type !== "match"
    ) {
      return;
    }

    const allMatched =
      currentQuestion.pairs.every(
        (pair) => matches[pair.word]
      );

    if (!allMatched) {
      return;
    }

    const correct =
      currentQuestion.pairs.every(
        (pair) =>
          matches[pair.word] === pair.meaning
      );

    setAnswered(true);
    setAnswerCorrect(correct);

    if (correct) {
      setScore((current) => current + 10);
    }
  }

  function nextQuestion() {
    if (!answered) return;

    if (
      questionIndex ===
      questions.length - 1
    ) {
      completeLessonOneStation("words");
      setFinished(true);
      return;
    }

    setQuestionIndex(
      (current) => current + 1
    );

    setSelectedAnswer("");
    setAnswered(false);
    setAnswerCorrect(false);
    setSelectedWord("");
    setSelectedMeaning("");
    setMatches({});
  }

  function restart() {
    setQuestionIndex(0);
    setSelectedAnswer("");
    setAnswered(false);
    setAnswerCorrect(false);
    setScore(0);
    setFinished(false);
    setSelectedWord("");
    setSelectedMeaning("");
    setMatches({});
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#fffaf0 0%,#f7fbff 48%,#eefaf6 100%)",
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
              color: "#8a6500",
              border: "1px solid #f0ddb0",
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
              color: "#8a6500",
              border: "1px solid #f0ddb0",
              borderRadius: 15,
              padding: "11px 18px",
              fontWeight: 900,
            }}
          >
            💎 نقاط الكلمات: {score}
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
          <div style={{ fontSize: 58 }}>
            💬
          </div>

          <h1
            style={{
              margin: "8px 0",
              fontSize:
                "clamp(32px,5vw,46px)",
            }}
          >
            كنز الكلمات
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              opacity: 0.95,
            }}
          >
            اكتشف معاني كلمات الدرس،
            ثم استخدمها في جمل ومواقف.
          </p>
        </section>

        {!finished ? (
          <>
            <section
              style={{
                background: "#fff",
                borderRadius: 22,
                border:
                  "1px solid #f0e3c4",
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
                      color: "#9b7416",
                    }}
                  >
                    {stageInfo.title}
                  </div>

                  <div
                    style={{
                      color: "#8b816b",
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  >
                    {stageInfo.note}
                  </div>
                </div>

                <strong
                  style={{
                    color: "#9b7416",
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
                  color: "#8b816b",
                  fontWeight: 800,
                }}
              >
                <span>
                  تقدم كنز الكلمات
                </span>
                <span>{progress}%</span>
              </div>

              <div
                style={{
                  height: 14,
                  background: "#f4efe3",
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
                  "1px solid #f0e3c4",
                boxShadow:
                  "0 14px 35px rgba(150,110,20,.08)",
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
                    fontSize: 50,
                    marginBottom: 12,
                  }}
                >
                  {currentQuestion.type ===
                  "match"
                    ? "🧩"
                    : currentQuestion.stage ===
                        "situation"
                      ? "🌟"
                      : currentQuestion.stage ===
                          "sentence"
                        ? "✍️"
                        : "💎"}
                </div>

                {currentQuestion.type ===
                  "choice" &&
                  currentQuestion.word && (
                    <div
                      style={{
                        display:
                          "inline-block",
                        marginBottom: 12,
                        background:
                          "#fff7db",
                        color: "#9b7416",
                        borderRadius: 999,
                        padding:
                          "8px 16px",
                        fontSize: 24,
                        fontWeight: 900,
                      }}
                    >
                      {currentQuestion.word}
                    </div>
                  )}

                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "clamp(23px,4vw,31px)",
                    lineHeight: 1.9,
                    color: "#5f4c19",
                  }}
                >
                  {currentQuestion.question}
                </h2>
              </div>

              {currentQuestion.type ===
                "choice" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(240px,1fr))",
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
                            chooseAnswer(
                              choice
                            )
                          }
                          style={{
                            border: isCorrect
                              ? "2px solid #2fa96c"
                              : isWrong
                                ? "2px solid #e15c5c"
                                : "2px solid #efe4c8",
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
                            color:
                              "#5f4c19",
                            fontSize: 18,
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
              )}

              {currentQuestion.type ===
                "match" && (
                <div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(220px,1fr))",
                      gap: 14,
                      marginBottom: 18,
                    }}
                  >
                    <div
                      style={{
                        background:
                          "#fffaf0",
                        border:
                          "1px solid #f1e1b8",
                        borderRadius: 20,
                        padding: 16,
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          marginBottom: 12,
                          color:
                            "#9b7416",
                        }}
                      >
                        الكلمات
                      </strong>

                      <div
                        style={{
                          display: "grid",
                          gap: 9,
                        }}
                      >
                        {currentQuestion.pairs.map(
                          (pair) => {
                            const used =
                              Boolean(
                                matches[
                                  pair.word
                                ]
                              );

                            const selected =
                              selectedWord ===
                              pair.word;

                            return (
                              <button
                                key={
                                  pair.word
                                }
                                type="button"
                                disabled={
                                  used ||
                                  answered
                                }
                                onClick={() =>
                                  handleWordClick(
                                    pair.word
                                  )
                                }
                                style={{
                                  border:
                                    selected
                                      ? "2px solid #d89d19"
                                      : "1px solid #eadcb9",
                                  background:
                                    used
                                      ? "#f1eee6"
                                      : selected
                                        ? "#fff5d6"
                                        : "#fff",
                                  color:
                                    used
                                      ? "#9a9588"
                                      : "#5f4c19",
                                  borderRadius:
                                    14,
                                  padding:
                                    "13px 12px",
                                  fontWeight:
                                    900,
                                  cursor:
                                    used ||
                                    answered
                                      ? "default"
                                      : "pointer",
                                }}
                              >
                                {pair.word}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        background:
                          "#fffaf0",
                        border:
                          "1px solid #f1e1b8",
                        borderRadius: 20,
                        padding: 16,
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          marginBottom: 12,
                          color:
                            "#9b7416",
                        }}
                      >
                        المعاني
                      </strong>

                      <div
                        style={{
                          display: "grid",
                          gap: 9,
                        }}
                      >
                        {currentQuestion.pairs.map(
                          (pair) => {
                            const used =
                              Object.values(
                                matches
                              ).includes(
                                pair.meaning
                              );

                            return (
                              <button
                                key={
                                  pair.meaning
                                }
                                type="button"
                                disabled={
                                  used ||
                                  answered ||
                                  !selectedWord
                                }
                                onClick={() =>
                                  handleMeaningClick(
                                    pair.meaning
                                  )
                                }
                                style={{
                                  border:
                                    "1px solid #eadcb9",
                                  background:
                                    used
                                      ? "#f1eee6"
                                      : "#fff",
                                  color:
                                    used
                                      ? "#9a9588"
                                      : "#5f4c19",
                                  borderRadius:
                                    14,
                                  padding:
                                    "13px 12px",
                                  fontWeight:
                                    800,
                                  lineHeight:
                                    1.7,
                                  cursor:
                                    used ||
                                    answered ||
                                    !selectedWord
                                      ? "default"
                                      : "pointer",
                                }}
                              >
                                {pair.meaning}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      border:
                        "2px dashed #ead8a5",
                      borderRadius: 20,
                      padding: 18,
                      background:
                        "#fffdf8",
                    }}
                  >
                    <strong
                      style={{
                        color: "#9b7416",
                      }}
                    >
                      🔗 مطابقاتي:
                    </strong>

                    {Object.keys(
                      matches
                    ).length === 0 ? (
                      <p
                        style={{
                          color: "#9b9483",
                          textAlign:
                            "center",
                        }}
                      >
                        اختر كلمة ثم
                        اضغط معناها.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gap: 9,
                          marginTop: 12,
                        }}
                      >
                        {Object.entries(
                          matches
                        ).map(
                          ([
                            word,
                            meaning,
                          ]) => (
                            <div
                              key={word}
                              style={{
                                display:
                                  "flex",
                                justifyContent:
                                  "space-between",
                                gap: 10,
                                alignItems:
                                  "center",
                                flexWrap:
                                  "wrap",
                                background:
                                  "#fff6d8",
                                borderRadius:
                                  14,
                                padding:
                                  "12px 14px",
                                color:
                                  "#5f4c19",
                                fontWeight:
                                  800,
                              }}
                            >
                              <span>
                                <strong>
                                  {word}
                                </strong>{" "}
                                ← {meaning}
                              </span>

                              {!answered && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeMatch(
                                      word
                                    )
                                  }
                                  style={{
                                    border:
                                      "none",
                                    background:
                                      "transparent",
                                    color:
                                      "#b05b4b",
                                    cursor:
                                      "pointer",
                                    fontWeight:
                                      900,
                                  }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {!answered && (
                      <button
                        type="button"
                        onClick={
                          checkMatches
                        }
                        disabled={
                          Object.keys(
                            matches
                          ).length !==
                          currentQuestion
                            .pairs.length
                        }
                        style={{
                          width: "100%",
                          marginTop: 16,
                          border: "none",
                          background:
                            Object.keys(
                              matches
                            ).length ===
                            currentQuestion
                              .pairs.length
                              ? "#d89d19"
                              : "#e8e1d0",
                          color:
                            Object.keys(
                              matches
                            ).length ===
                            currentQuestion
                              .pairs.length
                              ? "#fff"
                              : "#9d9687",
                          borderRadius: 14,
                          padding: 13,
                          fontWeight: 900,
                          cursor:
                            Object.keys(
                              matches
                            ).length ===
                            currentQuestion
                              .pairs.length
                              ? "pointer"
                              : "default",
                        }}
                      >
                        ✅ تحقق من المطابقة
                      </button>
                    )}
                  </div>
                </div>
              )}

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
                      ? "🎉 أحسنت! حصلت على 10 نقاط"
                      : currentQuestion.type ===
                          "match"
                        ? "🌱 راجع المطابقة وحاول مرة أخرى لاحقًا"
                        : "🌱 فكر في معنى الكلمة مرة أخرى"}
                  </div>

                  <div
                    style={{
                      background:
                        "#fffaf0",
                      border:
                        "1px solid #f0e3c4",
                      borderRadius: 16,
                      padding: 15,
                      textAlign:
                        "center",
                      color: "#756b53",
                      fontWeight: 800,
                      marginBottom: 14,
                      lineHeight: 1.9,
                    }}
                  >
                    📖{" "}
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
                "1px solid #f0e3c4",
              textAlign: "center",
              boxShadow:
                "0 14px 35px rgba(150,110,20,.08)",
            }}
          >
            <div
              style={{
                fontSize: 72,
              }}
            >
              💎
            </div>

            <h2
              style={{
                color: "#9b7416",
                fontSize: 30,
                marginBottom: 10,
              }}
            >
              جمعت كنز الكلمات!
            </h2>

            <p
              style={{
                color: "#786f5c",
                fontSize: 18,
                lineHeight: 1.9,
              }}
            >
              أنهيت تحديات المعاني
              والمطابقة والجمل والمواقف
              وحصلت على{" "}
              <strong
                style={{
                  color: "#9b7416",
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
                  "repeat(auto-fit,minmax(150px,1fr))",
                gap: 10,
              }}
            >
              <div style={resultCardStyle}>
                💎
                <strong>المعاني</strong>
                <span>مكتمل</span>
              </div>

              <div style={resultCardStyle}>
                🧩
                <strong>المطابقة</strong>
                <span>مكتمل</span>
              </div>

              <div style={resultCardStyle}>
                ✍️
                <strong>الجمل</strong>
                <span>مكتمل</span>
              </div>

              <div style={resultCardStyle}>
                🌟
                <strong>المواقف</strong>
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
                  "linear-gradient(135deg,#d89d19,#eba92b)",
                color: "#fff",
                padding: 15,
                fontSize: 18,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              🔁 أعد كنز الكلمات
            </button>

            <Link
              href="/lessons/unit1/lesson1"
              style={{
                display: "block",
                marginTop: 12,
                textDecoration: "none",
                border:
                  "1px solid #efddb0",
                borderRadius: 17,
                padding: 14,
                color: "#9b7416",
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
  background: "#fffaf0",
  border: "1px solid #f0e3c4",
  borderRadius: 18,
  padding: 16,
  display: "grid",
  gap: 6,
  fontSize: 22,
  color: "#9b7416",
} as const;