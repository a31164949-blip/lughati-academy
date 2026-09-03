"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../../firebase";

type ChallengeQuestion = {
  id: string;
  question: string;
  choices: string[];
  correctAnswer: number;
};

type ChallengeData = {
  title: string;
  skills: string;
  questions: ChallengeQuestion[];
  durationSeconds: number;
  rewardPoints: number;
  published: boolean;
};

export default function WeeklyChallengePage() {
  const [challenge, setChallenge] =
    useState<ChallengeData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [started, setStarted] =
    useState(false);

  const [finished, setFinished] =
    useState(false);

  const [timeLeft, setTimeLeft] =
    useState(60);

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  const [correctAnswers, setCorrectAnswers] =
    useState(0);

  const [answeredCount, setAnsweredCount] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function loadChallenge() {
      try {
        setLoading(true);
        setErrorMessage("");

        const challengeReference =
          doc(
            db,
            "weeklyChallenges",
            "current"
          );

        const snapshot =
          await getDoc(
            challengeReference
          );

        if (!active) {
          return;
        }

        if (!snapshot.exists()) {
          setErrorMessage(
            "لا يوجد تحدٍ منشور حاليًا."
          );
          return;
        }

        const data =
          snapshot.data();

        if (data.published !== true) {
          setErrorMessage(
            "تحدي هذا الأسبوع غير متاح حاليًا."
          );
          return;
        }

        const questions =
          Array.isArray(data.questions)
            ? data.questions
                .map(
                  (
                    item: unknown,
                    index: number
                  ) => {
                    if (
                      !item ||
                      typeof item !==
                        "object"
                    ) {
                      return null;
                    }

                    const value =
                      item as {
                        id?: unknown;
                        question?: unknown;
                        choices?: unknown;
                        correctAnswer?: unknown;
                      };

                    const choices =
                      Array.isArray(
                        value.choices
                      )
                        ? value.choices
                            .filter(
                              (
                                choice
                              ): choice is string =>
                                typeof choice ===
                                "string"
                            )
                            .slice(
                              0,
                              4
                            )
                        : [];

                    if (
                      typeof value.question !==
                        "string" ||
                      choices.length ===
                        0
                    ) {
                      return null;
                    }

                    return {
                      id:
                        typeof value.id ===
                        "string"
                          ? value.id
                          : `q-${index}`,

                      question:
                        value.question,

                      choices,

                      correctAnswer:
                        typeof value.correctAnswer ===
                        "number"
                          ? value.correctAnswer
                          : 0,
                    } as ChallengeQuestion;
                  }
                )
                .filter(
                  (
                    item
                  ): item is ChallengeQuestion =>
                    item !== null
                )
            : [];

        if (
          questions.length === 0
        ) {
          setErrorMessage(
            "لا توجد أسئلة جاهزة في التحدي."
          );
          return;
        }

        const durationSeconds =
          typeof data.durationSeconds ===
            "number"
            ? data.durationSeconds
            : 60;

        setChallenge({
          title:
            typeof data.title ===
            "string"
              ? data.title
              : "⚡ تحدي 60 ثانية",

          skills:
            typeof data.skills ===
            "string"
              ? data.skills
              : "",

          questions,

          durationSeconds,

          rewardPoints:
            typeof data.rewardPoints ===
            "number"
              ? data.rewardPoints
              : 0,

          published: true,
        });

        setTimeLeft(
          durationSeconds
        );
      } catch (error) {
        console.error(
          "تعذر تحميل تحدي 60 ثانية:",
          error
        );

        setErrorMessage(
          "تعذر تحميل التحدي حاليًا."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadChallenge();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      !started ||
      finished
    ) {
      return;
    }

    if (timeLeft <= 0) {
      setFinished(true);
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setTimeLeft(
            (current) =>
              Math.max(
                0,
                current - 1
              )
          );
        },
        1000
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    started,
    finished,
    timeLeft,
  ]);

  const currentQuestion =
    challenge?.questions[
      currentQuestionIndex
    ] ?? null;

  const progress =
    useMemo(() => {
      if (!challenge) {
        return 0;
      }

      return Math.round(
        ((challenge.durationSeconds -
          timeLeft) /
          challenge.durationSeconds) *
          100
      );
    }, [
      challenge,
      timeLeft,
    ]);

  function startChallenge() {
    if (!challenge) {
      return;
    }

    setStarted(true);
    setFinished(false);
    setCorrectAnswers(0);
    setAnsweredCount(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setTimeLeft(
      challenge.durationSeconds
    );
  }

  function answerQuestion(
    answerIndex: number
  ) {
    if (
      !challenge ||
      !currentQuestion ||
      selectedAnswer !== null ||
      finished
    ) {
      return;
    }

    setSelectedAnswer(
      answerIndex
    );

    const isCorrect =
      answerIndex ===
      currentQuestion.correctAnswer;

    if (isCorrect) {
      setCorrectAnswers(
        (current) =>
          current + 1
      );
    }

    setAnsweredCount(
      (current) =>
        current + 1
    );

    window.setTimeout(
      () => {
        if (
          currentQuestionIndex >=
          challenge.questions.length -
            1
        ) {
          setFinished(true);
          return;
        }

        setCurrentQuestionIndex(
          (current) =>
            current + 1
        );

        setSelectedAnswer(
          null
        );
      },
      450
    );
  }

  const successRate =
    answeredCount > 0
      ? Math.round(
          (correctAnswers /
            answeredCount) *
            100
        )
      : 0;

  if (loading) {
    return (
      <main
        dir="rtl"
        style={centerPageStyle}
      >
        <strong
          style={{
            color: "#126b49",
            fontSize: "21px",
          }}
        >
          ⏳ جارٍ تجهيز التحدي...
        </strong>
      </main>
    );
  }

  if (
    errorMessage ||
    !challenge
  ) {
    return (
      <main
        dir="rtl"
        style={centerPageStyle}
      >
        <div
          style={{
            width:
              "min(520px,100%)",
            background:
              "#ffffff",
            borderRadius:
              "24px",
            padding: "28px",
            textAlign:
              "center",
            border:
              "1px solid #dcebe3",
          }}
        >
          <div
            style={{
              fontSize:
                "48px",
              marginBottom:
                "12px",
            }}
          >
            ⚡
          </div>

          <h1
            style={{
              color:
                "#126b49",
            }}
          >
            تحدي 60 ثانية
          </h1>

          <p
            style={{
              color:
                "#64748b",
              lineHeight: 1.8,
              fontWeight:
                700,
            }}
          >
            {errorMessage}
          </p>

          <Link
            href="/journey"
            style={
              linkButtonStyle
            }
          >
            ← العودة إلى رحلتي
          </Link>
        </div>
      </main>
    );
  }

  if (!started) {
    return (
      <main
        dir="rtl"
        style={pageStyle}
      >
        <div
          style={{
            maxWidth:
              "760px",
            margin:
              "0 auto",
          }}
        >
          <div
            style={{
              textAlign:
                "center",
              marginBottom:
                "24px",
            }}
          >
            <div
              style={{
                fontSize:
                  "70px",
              }}
            >
              ⚡
            </div>

            <h1
              style={{
                margin:
                  "8px 0",
                color:
                  "#126b49",
                fontSize:
                  "clamp(30px,6vw,48px)",
              }}
            >
              {challenge.title}
            </h1>

            <p
              style={{
                color:
                  "#64748b",
                fontWeight:
                  800,
                lineHeight:
                  1.8,
              }}
            >
              أمامك 60 ثانية فقط. أجب بسرعة وركز جيدًا.
            </p>
          </div>

          <section
            style={
              cardStyle
            }
          >
            <h2
              style={{
                color:
                  "#126b49",
                marginTop: 0,
              }}
            >
              🎯 مهارات التحدي
            </h2>

            <div
              style={{
                background:
                  "#f0fbf5",
                padding:
                  "16px",
                borderRadius:
                  "16px",
                color:
                  "#365c49",
                fontWeight:
                  800,
                lineHeight:
                  1.8,
              }}
            >
              {challenge.skills ||
                "مهارات هذا الأسبوع"}
            </div>
          </section>

          <section
            style={
              cardStyle
            }
          >
            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(160px,1fr))",
                gap: "12px",
              }}
            >
              <div
                style={
                  statStyle
                }
              >
                <span>
                  ⏱️ الوقت
                </span>
                <strong>
                  {
                    challenge.durationSeconds
                  }{" "}
                  ثانية
                </strong>
              </div>

              <div
                style={
                  statStyle
                }
              >
                <span>
                  🧠 الأسئلة
                </span>
                <strong>
                  {
                    challenge.questions
                      .length
                  }
                </strong>
              </div>

              <div
                style={
                  statStyle
                }
              >
                <span>
                  ⭐ المكافأة
                </span>
                <strong>
                  {
                    challenge.rewardPoints
                  }{" "}
                  نقاط
                </strong>
              </div>
            </div>
          </section>

          <button
            type="button"
            onClick={
              startChallenge
            }
            style={
              startButtonStyle
            }
          >
            🚀 ابدأ التحدي الآن
          </button>
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main
        dir="rtl"
        style={pageStyle}
      >
        <div
          style={{
            maxWidth:
              "620px",
            margin:
              "0 auto",
          }}
        >
          <section
            style={{
              ...cardStyle,
              textAlign:
                "center",
              padding:
                "30px 22px",
            }}
          >
            <div
              style={{
                fontSize:
                  "72px",
              }}
            >
              🏆
            </div>

            <h1
              style={{
                color:
                  "#126b49",
                fontSize:
                  "34px",
              }}
            >
              انتهى التحدي!
            </h1>

            <p
              style={{
                color:
                  "#64748b",
                fontWeight:
                  800,
              }}
            >
              أحسنت يا بطل 🌟
            </p>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(150px,1fr))",
                gap: "12px",
                margin:
                  "24px 0",
              }}
            >
              <div
                style={
                  statStyle
                }
              >
                <span>
                  ✅ الصحيحة
                </span>
                <strong>
                  {
                    correctAnswers
                  }
                </strong>
              </div>

              <div
                style={
                  statStyle
                }
              >
                <span>
                  📝 المجاب عنها
                </span>
                <strong>
                  {
                    answeredCount
                  }
                </strong>
              </div>

              <div
                style={
                  statStyle
                }
              >
                <span>
                  🎯 النسبة
                </span>
                <strong>
                  {
                    successRate
                  }
                  %
                </strong>
              </div>
            </div>

            <div
              style={{
                padding:
                  "15px",
                borderRadius:
                  "16px",
                background:
                  successRate >=
                  80
                    ? "#eafaf1"
                    : successRate >=
                      50
                    ? "#fffbea"
                    : "#fff7ed",
                fontWeight:
                  900,
                color:
                  "#365c49",
                marginBottom:
                  "18px",
              }}
            >
              {successRate >=
              80
                ? "🌟 أداء رائع جدًا!"
                : successRate >=
                  50
                ? "👏 أحسنت، واصل التدريب!"
                : "🌱 بداية جميلة، حاول مرة أخرى!"}
            </div>

            <Link
              href="/journey"
              style={
                linkButtonStyle
              }
            >
              ← العودة إلى رحلتي
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      style={pageStyle}
    >
      <div
        style={{
          maxWidth:
            "760px",
          margin:
            "0 auto",
        }}
      >
        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: "12px",
            flexWrap:
              "wrap",
            marginBottom:
              "16px",
          }}
        >
          <div
            style={{
              fontWeight:
                900,
              color:
                "#126b49",
            }}
          >
            ⚡ تحدي 60 ثانية
          </div>

          <div
            style={{
              padding:
                "9px 15px",
              borderRadius:
                "999px",
              background:
                timeLeft <=
                10
                  ? "#fee2e2"
                  : "#e8f8ef",
              color:
                timeLeft <=
                10
                  ? "#b91c1c"
                  : "#08734b",
              fontWeight:
                900,
              fontSize:
                "18px",
            }}
          >
            ⏱️ {timeLeft}
          </div>
        </div>

        <div
          style={{
            height: "10px",
            background:
              "#e5eee9",
            borderRadius:
              "999px",
            overflow:
              "hidden",
            marginBottom:
              "20px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background:
                "linear-gradient(90deg,#168a63,#f2c94c)",
              transition:
                "width .3s ease",
            }}
          />
        </div>

        <section
          style={{
            ...cardStyle,
            padding:
              "26px",
          }}
        >
          <div
            style={{
              color:
                "#64748b",
              fontWeight:
                800,
              marginBottom:
                "8px",
            }}
          >
            السؤال{" "}
            {currentQuestionIndex +
              1}{" "}
            من{" "}
            {
              challenge.questions
                .length
            }
          </div>

          <h2
            style={{
              margin:
                "0 0 22px",
              color:
                "#17352a",
              fontSize:
                "clamp(24px,5vw,34px)",
              lineHeight:
                1.6,
            }}
          >
            {
              currentQuestion?.question
            }
          </h2>

          <div
            style={{
              display:
                "grid",
              gap: "12px",
            }}
          >
            {currentQuestion?.choices.map(
              (
                choice,
                index
              ) => {
                const selected =
                  selectedAnswer ===
                  index;

                const correct =
                  selectedAnswer !==
                    null &&
                  index ===
                    currentQuestion.correctAnswer;

                const wrong =
                  selected &&
                  index !==
                    currentQuestion.correctAnswer;

                return (
                  <button
                    key={
                      index
                    }
                    type="button"
                    disabled={
                      selectedAnswer !==
                      null
                    }
                    onClick={() =>
                      answerQuestion(
                        index
                      )
                    }
                    style={{
                      border:
                        correct
                          ? "2px solid #22a06b"
                          : wrong
                          ? "2px solid #dc2626"
                          : "1px solid #dce8e1",

                      background:
                        correct
                          ? "#dcfce7"
                          : wrong
                          ? "#fee2e2"
                          : "#ffffff",

                      color:
                        correct
                          ? "#08734b"
                          : wrong
                          ? "#b91c1c"
                          : "#17352a",

                      borderRadius:
                        "18px",

                      padding:
                        "17px",

                      textAlign:
                        "right",

                      fontSize:
                        "18px",

                      fontWeight:
                        900,

                      cursor:
                        selectedAnswer ===
                        null
                          ? "pointer"
                          : "default",

                      transition:
                        "all .15s ease",
                    }}
                  >
                    {choice}
                  </button>
                );
              }
            )}
          </div>
        </section>

        <div
          style={{
            textAlign:
              "center",
            color:
              "#64748b",
            fontWeight:
              800,
            marginTop:
              "14px",
          }}
        >
          ✅ صحيحة:{" "}
          {correctAnswers}
          {"   "}•{"   "}
          📝 إجابات:{" "}
          {answeredCount}
        </div>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg,#effbf4 0%,#f7fbff 50%,#fffaf0 100%)",
  padding:
    "30px 16px 60px",
  fontFamily:
    "Arial, sans-serif",
  color: "#17352a",
};

const centerPageStyle = {
  ...pageStyle,
  display: "grid",
  placeItems: "center",
};

const cardStyle = {
  background: "#ffffff",
  border:
    "1px solid #dcebe3",
  borderRadius:
    "24px",
  padding: "22px",
  marginBottom:
    "18px",
  boxShadow:
    "0 10px 28px rgba(20,90,60,.08)",
};

const statStyle = {
  padding: "16px",
  borderRadius:
    "18px",
  background:
    "#f8fcfa",
  border:
    "1px solid #dcebe3",
  display: "grid",
  gap: "7px",
  textAlign:
    "center" as const,
  color: "#126b49",
  fontWeight: 900,
};

const startButtonStyle = {
  width: "100%",
  border: "none",
  borderRadius:
    "18px",
  padding: "17px",
  background:
    "linear-gradient(135deg,#168a63,#0f7654)",
  color: "#ffffff",
  fontSize: "19px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow:
    "0 10px 22px rgba(22,138,99,.20)",
};

const linkButtonStyle = {
  display:
    "inline-block",
  textDecoration:
    "none",
  borderRadius:
    "15px",
  padding:
    "12px 17px",
  background:
    "#126b49",
  color: "#ffffff",
  fontWeight: 900,
};