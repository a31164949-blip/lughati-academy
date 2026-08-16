"use client";

import Link from "next/link";
import { completeLessonOneStation } from "../progress";
import { useMemo, useState } from "react";

type ChoiceQuestion = {
  id: number;
  type: "choice";
  stage: "direct" | "inference";
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
};

type OrderQuestion = {
  id: number;
  type: "order";
  stage: "order";
  question: string;
  events: string[];
  correctOrder: string[];
  explanation: string;
};

type Question = ChoiceQuestion | OrderQuestion;

const questions: Question[] = [
  {
    id: 1,
    type: "choice",
    stage: "direct",
    question: "بِمَ أَمَرَ الرَّسُولُ ﷺ فِي الْحَدِيثِ؟",
    choices: [
      "بِصِلَةِ الرَّحِمِ",
      "بِالسَّفَرِ",
      "بِاللَّعِبِ",
      "بِالنَّوْمِ مُبَكِّرًا",
    ],
    answer: "بِصِلَةِ الرَّحِمِ",
    explanation:
      "يَحُثُّ الْحَدِيثُ عَلَى صِلَةِ الرَّحِمِ وَالتَّوَاصُلِ مَعَ الْأَقَارِبِ.",
  },
  {
    id: 2,
    type: "choice",
    stage: "direct",
    question: "مَنِ الْأَرْحَامُ؟",
    choices: [
      "الْأَقَارِبُ",
      "زُمَلَاءُ الْفَصْلِ فَقَطْ",
      "الْجِيرَانُ فَقَطْ",
      "الْأَصْدِقَاءُ فَقَطْ",
    ],
    answer: "الْأَقَارِبُ",
    explanation:
      "الْأَرْحَامُ هُمُ الْأَقَارِبُ الَّذِينَ تَرْبِطُنَا بِهِمْ صِلَةُ قَرَابَةٍ.",
  },
  {
    id: 3,
    type: "choice",
    stage: "direct",
    question: "مَا مَعْنَى صِلَةِ الرَّحِمِ؟",
    choices: [
      "زِيَارَةُ الْأَقَارِبِ وَالسُّؤَالُ عَنْهُمْ وَمُسَاعَدَتُهُمْ",
      "الِابْتِعَادُ عَنِ الْأَقَارِبِ",
      "عَدَمُ التَّحَدُّثِ مَعَهُمْ",
      "زِيَارَتُهُمْ فِي الْأَعْيَادِ فَقَطْ",
    ],
    answer:
      "زِيَارَةُ الْأَقَارِبِ وَالسُّؤَالُ عَنْهُمْ وَمُسَاعَدَتُهُمْ",
    explanation:
      "صِلَةُ الرَّحِمِ تَشْمَلُ زِيَارَةَ الْأَقَارِبِ وَالسُّؤَالَ عَنْهُمْ وَتَفَقُّدَ أَحْوَالِهِمْ وَمُسَاعَدَتَهُمْ.",
  },
  {
    id: 4,
    type: "choice",
    stage: "direct",
    question: "مَا الْفِكْرَةُ الَّتِي عَرَضَهَا فَوَّازٌ عَلَى أَبِيهِ؟",
    choices: [
      "أَنْ يُخَصِّصُوا يَوْمًا لِصِلَةِ أَرْحَامِهِمْ",
      "أَنْ يَشْتَرُوا سَيَّارَةً جَدِيدَةً",
      "أَنْ يَذْهَبُوا إِلَى الْمَدْرَسَةِ",
      "أَنْ يُسَافِرُوا فِي إِجَازَةٍ",
    ],
    answer: "أَنْ يُخَصِّصُوا يَوْمًا لِصِلَةِ أَرْحَامِهِمْ",
    explanation:
      "اقْتَرَحَ فَوَّازٌ أَنْ تُخَصِّصَ الْأُسْرَةُ يَوْمًا لِصِلَةِ الْأَرْحَامِ.",
  },
  {
    id: 5,
    type: "order",
    stage: "order",
    question: "رَتِّبْ أَحْدَاثَ النَّصِّ مِنَ الْأَوَّلِ إِلَى الْأَخِيرِ.",
    events: [
      "اقْتَرَحَ فَوَّازٌ تَخْصِيصَ يَوْمٍ لِصِلَةِ الْأَرْحَامِ.",
      "اسْتَمَعَتِ الْأُسْرَةُ إِلَى الْحَدِيثِ.",
      "شَرَحَ الْأَبُ مَعْنَى صِلَةِ الرَّحِمِ.",
      "سَأَلَ فَوَّازٌ أَبَاهُ عَنْ مَعْنَى الرَّحِمِ.",
    ],
    correctOrder: [
      "اسْتَمَعَتِ الْأُسْرَةُ إِلَى الْحَدِيثِ.",
      "سَأَلَ فَوَّازٌ أَبَاهُ عَنْ مَعْنَى الرَّحِمِ.",
      "شَرَحَ الْأَبُ مَعْنَى صِلَةِ الرَّحِمِ.",
      "اقْتَرَحَ فَوَّازٌ تَخْصِيصَ يَوْمٍ لِصِلَةِ الْأَرْحَامِ.",
    ],
    explanation:
      "بَدَأَتِ الْأَحْدَاثُ بِسَمَاعِ الْحَدِيثِ، ثُمَّ السُّؤَالِ، ثُمَّ الشَّرْحِ، وَانْتَهَتْ بِفِكْرَةِ فَوَّازٍ.",
  },
  {
    id: 6,
    type: "choice",
    stage: "inference",
    question: "لِمَاذَا أَعْجَبَ الْأَبَ رَأْيُ فَوَّازٍ؟",
    choices: [
      "لِأَنَّهُ يُسَاعِدُ الْأُسْرَةَ عَلَى صِلَةِ أَرْحَامِهَا",
      "لِأَنَّهُ يُرِيدُ اللَّعِبَ",
      "لِأَنَّهُ يُرِيدُ شِرَاءَ هَدِيَّةٍ",
      "لِأَنَّهُ لَا يُرِيدُ زِيَارَةَ أَحَدٍ",
    ],
    answer:
      "لِأَنَّهُ يُسَاعِدُ الْأُسْرَةَ عَلَى صِلَةِ أَرْحَامِهَا",
    explanation:
      "فِكْرَةُ فَوَّازٍ تُسَاعِدُ الْأُسْرَةَ عَلَى التَّوَاصُلِ مَعَ الْأَقَارِبِ وَالْمُحَافَظَةِ عَلَى صِلَةِ الرَّحِمِ.",
  },
];

function getStageInfo(question: Question) {
  if (question.stage === "direct") {
    return {
      title: "🧠 أفهم مباشرة",
      note: "أبحث عن الإجابة من النص.",
    };
  }

  if (question.stage === "order") {
    return {
      title: "🧩 أرتب الأحداث",
      note: "أفكر: ماذا حدث أولًا؟",
    };
  }

  return {
    title: "🔎 أستنتج",
    note: "أفكر فيما فهمته من أحداث النص.",
  };
}

export default function ComprehensionPage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [orderedEvents, setOrderedEvents] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

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

  function selectOrderEvent(event: string) {
    if (
      answered ||
      currentQuestion.type !== "order" ||
      orderedEvents.includes(event)
    ) {
      return;
    }

    setOrderedEvents((current) => [
      ...current,
      event,
    ]);
  }

  function removeLastOrderEvent() {
    if (answered) return;

    setOrderedEvents((current) =>
      current.slice(0, -1)
    );
  }

  function checkOrder() {
    if (
      answered ||
      currentQuestion.type !== "order" ||
      orderedEvents.length !==
        currentQuestion.correctOrder.length
    ) {
      return;
    }

    const correct =
      orderedEvents.every(
        (event, index) =>
          event ===
          currentQuestion.correctOrder[index]
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
    completeLessonOneStation("comprehension");
    setFinished(true);
    return;
  }

  setQuestionIndex(
    (current) => current + 1
  );

    setSelectedAnswer("");
  setOrderedEvents([]);
  setAnswered(false);
  setAnswerCorrect(false);
}

function restart() {
  setQuestionIndex(0);
  setSelectedAnswer("");
  setOrderedEvents([]);
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
          "linear-gradient(180deg,#eefaf6 0%,#f7fbff 52%,#fffaf0 100%)",
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
        {/* أعلى الصفحة */}
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
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
              color: "#176d4c",
              border:
                "1px solid #cfe8dd",
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
              color: "#176d4c",
              border:
                "1px solid #cfe8dd",
              borderRadius: 15,
              padding: "11px 18px",
              fontWeight: 900,
            }}
          >
            ⭐ نقاط الفهم: {score}
          </div>
        </div>

        {/* رأس المحطة */}
        <section
          style={{
            background:
              "linear-gradient(135deg,#15936a,#36b884)",
            color: "#fff",
            borderRadius: 30,
            padding: "34px 20px",
            textAlign: "center",
            boxShadow:
              "0 15px 38px rgba(21,147,106,.18)",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 58 }}>
            🧠
          </div>

          <h1
            style={{
              margin: "8px 0",
              fontSize:
                "clamp(32px,5vw,46px)",
            }}
          >
            أفهم النص
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              opacity: 0.95,
            }}
          >
            افهم الأحداث، ورتبها،
            واستنتج ما تعلمته من درس
            صلة الرحم.
          </p>
        </section>

        {!finished ? (
          <>
            {/* المرحلة الحالية */}
            <section
              style={{
                background: "#fff",
                borderRadius: 22,
                border:
                  "1px solid #dcebe5",
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
                      color: "#176d4c",
                    }}
                  >
                    {stageInfo.title}
                  </div>

                  <div
                    style={{
                      color: "#71877f",
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  >
                    {stageInfo.note}
                  </div>
                </div>

                <strong
                  style={{
                    color: "#176d4c",
                  }}
                >
                  السؤال{" "}
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
                  color: "#71877f",
                  fontWeight: 800,
                }}
              >
                <span>
                  تقدم محطة الفهم
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
                    height: "100%",
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg,#2da96f,#67d79a)",
                    transition:
                      "width .35s ease",
                  }}
                />
              </div>
            </section>

            {/* بطاقة السؤال */}
            <section
              style={{
                background: "#fff",
                borderRadius: 28,
                padding: "32px 22px",
                border:
                  "1px solid #dcebe5",
                boxShadow:
                  "0 14px 35px rgba(30,100,70,.08)",
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
                  "order"
                    ? "🧩"
                    : currentQuestion.stage ===
                        "inference"
                      ? "🔎"
                      : "💡"}
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "clamp(23px,4vw,31px)",
                    lineHeight: 1.9,
                    color: "#194e3b",
                  }}
                >
                  {currentQuestion.question}
                </h2>
              </div>

              {/* أسئلة الاختيار */}
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
                                : "2px solid #dce8e2",
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
                              "#244b3d",
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

              {/* سؤال ترتيب الأحداث */}
              {currentQuestion.type ===
                "order" && (
                <div>
                  <div
                    style={{
                      background:
                        "#f4fbf8",
                      border:
                        "1px solid #d8eee5",
                      borderRadius: 20,
                      padding: 18,
                      marginBottom: 18,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 900,
                        color: "#176d4c",
                        marginBottom: 12,
                      }}
                    >
                      👆 اضغط الأحداث
                      بالترتيب الصحيح:
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      {currentQuestion.events.map(
                        (event) => {
                          const used =
                            orderedEvents.includes(
                              event
                            );

                          return (
                            <button
                              key={event}
                              type="button"
                              disabled={
                                used ||
                                answered
                              }
                              onClick={() =>
                                selectOrderEvent(
                                  event
                                )
                              }
                              style={{
                                border:
                                  "1px solid #cfe5dc",
                                background:
                                  used
                                    ? "#edf3f0"
                                    : "#fff",
                                color: used
                                  ? "#9aa9a3"
                                  : "#244b3d",
                                borderRadius: 16,
                                padding:
                                  "14px 16px",
                                fontSize: 17,
                                fontWeight: 800,
                                lineHeight: 1.8,
                                cursor:
                                  used ||
                                  answered
                                    ? "default"
                                    : "pointer",
                                textAlign:
                                  "right",
                              }}
                            >
                              {event}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* ترتيب الطالب */}
                  <div
                    style={{
                      border:
                        "2px dashed #b9ddce",
                      borderRadius: 20,
                      padding: 18,
                      minHeight: 120,
                      background:
                        "#fcfffd",
                    }}
                  >
                    <strong
                      style={{
                        color: "#176d4c",
                      }}
                    >
                      🧩 ترتيبي:
                    </strong>

                    {orderedEvents.length ===
                    0 ? (
                      <p
                        style={{
                          color: "#8a9c95",
                          textAlign:
                            "center",
                        }}
                      >
                        اختر الحدث الذي
                        حدث أولًا.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gap: 9,
                          marginTop: 12,
                        }}
                      >
                        {orderedEvents.map(
                          (
                            event,
                            index
                          ) => (
                            <div
                              key={event}
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: 10,
                                background:
                                  "#eef9f4",
                                borderRadius: 14,
                                padding:
                                  "12px 14px",
                                color:
                                  "#315c4d",
                                fontWeight:
                                  800,
                              }}
                            >
                              <span
                                style={{
                                  minWidth: 30,
                                  height: 30,
                                  borderRadius:
                                    "50%",
                                  background:
                                    "#168a63",
                                  color:
                                    "#fff",
                                  display:
                                    "inline-flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                }}
                              >
                                {index + 1}
                              </span>

                              {event}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {!answered && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "1fr 1fr",
                          gap: 10,
                          marginTop: 16,
                        }}
                      >
                        <button
                          type="button"
                          onClick={
                            removeLastOrderEvent
                          }
                          disabled={
                            orderedEvents.length ===
                            0
                          }
                          style={{
                            border:
                              "1px solid #d8e4df",
                            background:
                              "#fff",
                            color:
                              "#60776e",
                            borderRadius: 14,
                            padding: 12,
                            fontWeight: 900,
                            cursor:
                              orderedEvents.length ===
                              0
                                ? "default"
                                : "pointer",
                          }}
                        >
                          ↩️ تراجع خطوة
                        </button>

                        <button
                          type="button"
                          onClick={
                            checkOrder
                          }
                          disabled={
                            orderedEvents.length !==
                            currentQuestion
                              .correctOrder
                              .length
                          }
                          style={{
                            border: "none",
                            background:
                              orderedEvents.length ===
                              currentQuestion
                                .correctOrder
                                .length
                                ? "#168a63"
                                : "#dce7e2",
                            color:
                              orderedEvents.length ===
                              currentQuestion
                                .correctOrder
                                .length
                                ? "#fff"
                                : "#8c9c95",
                            borderRadius: 14,
                            padding: 12,
                            fontWeight: 900,
                            cursor:
                              orderedEvents.length ===
                              currentQuestion
                                .correctOrder
                                .length
                                ? "pointer"
                                : "default",
                          }}
                        >
                          ✅ تحقق من الترتيب
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* التغذية الراجعة */}
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
                      ? "🎉 أحسنت! فهمك رائع +10 نقاط"
                      : currentQuestion.type ===
                          "order"
                        ? "🌱 الترتيب يحتاج مراجعة بسيطة"
                        : "🌱 فكر في أحداث النص مرة أخرى"}
                  </div>

                  <div
                    style={{
                      background:
                        "#f5fbf8",
                      border:
                        "1px solid #d8eee5",
                      borderRadius: 16,
                      padding: 15,
                      textAlign:
                        "center",
                      color: "#55766a",
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
          /* شاشة النهاية */
          <section
            style={{
              background: "#fff",
              borderRadius: 28,
              padding: "38px 22px",
              border:
                "1px solid #dceee6",
              textAlign: "center",
              boxShadow:
                "0 14px 35px rgba(30,100,70,.08)",
            }}
          >
            <div
              style={{ fontSize: 70 }}
            >
              🏆
            </div>

            <h2
              style={{
                color: "#176d4c",
                fontSize: 30,
                marginBottom: 10,
              }}
            >
              بطل فهم النص!
            </h2>

            <p
              style={{
                color: "#687d74",
                fontSize: 18,
                lineHeight: 1.9,
              }}
            >
              أنهيت تحديات الفهم
              والترتيب والاستنتاج وحصلت
              على{" "}
              <strong
                style={{
                  color: "#98720d",
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
              <div
                style={resultCardStyle}
              >
                🧠
                <strong>
                  فهم مباشر
                </strong>
                <span>مكتمل</span>
              </div>

              <div
                style={resultCardStyle}
              >
                🧩
                <strong>
                  ترتيب الأحداث
                </strong>
                <span>مكتمل</span>
              </div>

              <div
                style={resultCardStyle}
              >
                🔎
                <strong>
                  الاستنتاج
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
                  "linear-gradient(135deg,#168a63,#0f7654)",
                color: "#fff",
                padding: 15,
                fontSize: 18,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              🔁 أعد محطة الفهم
            </button>

            <Link
              href="/lessons/unit1/lesson1"
              style={{
                display: "block",
                marginTop: 12,
                textDecoration: "none",
                border:
                  "1px solid #cfe7dd",
                borderRadius: 17,
                padding: 14,
                color: "#17674d",
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
  background: "#f4fbf8",
  border: "1px solid #d8eee5",
  borderRadius: 18,
  padding: 16,
  display: "grid",
  gap: 6,
  fontSize: 22,
  color: "#176d4c",
} as const;