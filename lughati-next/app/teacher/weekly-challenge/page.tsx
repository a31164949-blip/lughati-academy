"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../../../firebase";

type ChallengeQuestion = {
  id: string;
  question: string;
  choices: string[];
  correctAnswer: number;
};

type WeeklyChallengeData = {
  title: string;
  skills: string;
  questions: ChallengeQuestion[];
  durationSeconds: number;
  rewardPoints: number;
  published: boolean;
};

function createEmptyQuestion(): ChallengeQuestion {
  return {
    id:
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    question: "",
    choices: ["", "", "", ""],
    correctAnswer: 0,
  };
}

export default function WeeklyChallengePage() {
  const [
    title,
    setTitle,
  ] = useState(
    "⚡ تحدي 60 ثانية"
  );

  const [
    skills,
    setSkills,
  ] = useState("");

  const [
    questions,
    setQuestions,
  ] = useState<ChallengeQuestion[]>([
    createEmptyQuestion(),
  ]);

  const [
    rewardPoints,
    setRewardPoints,
  ] = useState(5);

  const [
    published,
    setPublished,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function loadChallenge() {
      try {
        setLoading(true);

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

        if (
          !active ||
          !snapshot.exists()
        ) {
          return;
        }

        const data =
          snapshot.data();

        setTitle(
          typeof data.title === "string"
            ? data.title
            : "⚡ تحدي 60 ثانية"
        );

        setSkills(
          typeof data.skills === "string"
            ? data.skills
            : ""
        );

        setRewardPoints(
          typeof data.rewardPoints ===
            "number"
            ? data.rewardPoints
            : 5
        );

        setPublished(
          data.published === true
        );

        if (
          Array.isArray(data.questions)
        ) {
          const loadedQuestions =
            data.questions
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

                  const loadedChoices =
                    Array.isArray(
                      value.choices
                    )
                      ? value.choices.map(
                          (
                            choice:
                              unknown
                          ) =>
                            typeof choice ===
                            "string"
                              ? choice
                              : ""
                        )
                      : [
                          "",
                          "",
                          "",
                          "",
                        ];

                  while (
                    loadedChoices.length <
                    4
                  ) {
                    loadedChoices.push("");
                  }

                  return {
                    id:
                      typeof value.id ===
                      "string"
                        ? value.id
                        : `question-${index}`,

                    question:
                      typeof value.question ===
                      "string"
                        ? value.question
                        : "",

                    choices:
                      loadedChoices.slice(
                        0,
                        4
                      ),

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
              );

          if (
            loadedQuestions.length > 0
          ) {
            setQuestions(
              loadedQuestions
            );
          }
        }
      } catch (error) {
        console.error(
          "تعذر تحميل تحدي الأسبوع:",
          error
        );

        setMessage(
          "تعذر تحميل بيانات التحدي."
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

  function updateQuestionText(
    questionId: string,
    value: string
  ) {
    setQuestions(
      (current) =>
        current.map(
          (question) =>
            question.id ===
            questionId
              ? {
                  ...question,
                  question: value,
                }
              : question
        )
    );
  }

  function updateChoice(
    questionId: string,
    choiceIndex: number,
    value: string
  ) {
    setQuestions(
      (current) =>
        current.map(
          (question) => {
            if (
              question.id !==
              questionId
            ) {
              return question;
            }

            const nextChoices = [
              ...question.choices,
            ];

            nextChoices[
              choiceIndex
            ] = value;

            return {
              ...question,
              choices: nextChoices,
            };
          }
        )
    );
  }

  function updateCorrectAnswer(
    questionId: string,
    answerIndex: number
  ) {
    setQuestions(
      (current) =>
        current.map(
          (question) =>
            question.id ===
            questionId
              ? {
                  ...question,
                  correctAnswer:
                    answerIndex,
                }
              : question
        )
    );
  }

  function addQuestion() {
    setQuestions(
      (current) => [
        ...current,
        createEmptyQuestion(),
      ]
    );
  }

  function removeQuestion(
    questionId: string
  ) {
    setQuestions(
      (current) => {
        if (
          current.length <= 1
        ) {
          return current;
        }

        return current.filter(
          (question) =>
            question.id !==
            questionId
        );
      }
    );
  }

  function validateChallenge() {
    if (!skills.trim()) {
      return "اكتب مهارات هذا الأسبوع أولًا.";
    }

    if (
      questions.length === 0
    ) {
      return "أضف سؤالًا واحدًا على الأقل.";
    }

    for (
      let index = 0;
      index < questions.length;
      index += 1
    ) {
      const question =
        questions[index];

      if (
        !question.question.trim()
      ) {
        return `اكتب نص السؤال رقم ${
          index + 1
        }.`;
      }

      if (
        question.choices.some(
          (choice) =>
            !choice.trim()
        )
      ) {
        return `أكمل جميع خيارات السؤال رقم ${
          index + 1
        }.`;
      }
    }

    return "";
  }

  async function saveChallenge(
    publishValue: boolean
  ) {
    const validationMessage =
      validateChallenge();

    if (validationMessage) {
      setMessage(
        validationMessage
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const challengeReference =
        doc(
          db,
          "weeklyChallenges",
          "current"
        );

      const challengeData: WeeklyChallengeData =
        {
          title:
            title.trim() ||
            "⚡ تحدي 60 ثانية",

          skills:
            skills.trim(),

          questions,

          durationSeconds: 60,

          rewardPoints:
            Math.max(
              0,
              rewardPoints
            ),

          published:
            publishValue,
        };

      await setDoc(
        challengeReference,
        {
          ...challengeData,

          updatedAt:
            serverTimestamp(),

          ...(publishValue
            ? {
                publishedAt:
                  serverTimestamp(),
              }
            : {}),
        },
        {
          merge: true,
        }
      );

      setPublished(
        publishValue
      );

      setMessage(
        publishValue
          ? "✅ تم حفظ التحدي ونشره للطلاب."
          : "✅ تم حفظ التحدي كمسودة."
      );
    } catch (error) {
      console.error(
        "تعذر حفظ تحدي الأسبوع:",
        error
      );

      setMessage(
        "تعذر حفظ التحدي، حاول مرة أخرى."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "#f4fbf7",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <strong
          style={{
            color: "#126b49",
            fontSize: "20px",
          }}
        >
          ⏳ جارٍ تحميل تحدي الأسبوع...
        </strong>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#effbf4 0%,#f8fbff 50%,#fffaf0 100%)",
        padding:
          "30px 16px 60px",
        fontFamily:
          "Arial, sans-serif",
        color: "#17352a",
      }}
    >
      <div
        style={{
          maxWidth: "920px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <div>
            <div
              style={{
                color: "#64748b",
                fontWeight: 800,
                marginBottom: "5px",
              }}
            >
              لوحة المعلم
            </div>

            <h1
              style={{
                margin: 0,
                color: "#126b49",
                fontSize:
                  "clamp(28px,5vw,42px)",
              }}
            >
              ⚡ تحدي 60 ثانية
            </h1>
          </div>

          <Link
            href="/teacher"
            style={{
              textDecoration:
                "none",
              padding:
                "11px 16px",
              borderRadius:
                "14px",
              background:
                "#ffffff",
              border:
                "1px solid #d8e9df",
              color:
                "#126b49",
              fontWeight: 900,
            }}
          >
            ← العودة للوحة المعلم
          </Link>
        </div>

        <section
          style={cardStyle}
        >
          <h2
            style={sectionTitleStyle}
          >
            🎯 مهارات هذا الأسبوع
          </h2>

          <p
            style={hintStyle}
          >
            اكتب المهارات التي ركزت عليها داخل الفصل.
            مثال: الحركات القصيرة، حروف المد، المقطع الساكن.
          </p>

          <textarea
            value={skills}
            onChange={(event) =>
              setSkills(
                event.target.value
              )
            }
            placeholder="مثال: الفتحة والضمة والكسرة، المد بالألف..."
            style={{
              ...inputStyle,
              minHeight: "110px",
              resize: "vertical",
            }}
          />
        </section>

        <section
          style={cardStyle}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "12px",
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <h2
                style={
                  sectionTitleStyle
                }
              >
                🧠 أسئلة التحدي
              </h2>

              <p
                style={hintStyle}
              >
                التحدي يستمر لمدة 60 ثانية، ويجيب الطالب عن أكبر عدد ممكن.
              </p>
            </div>

            <button
              type="button"
              onClick={
                addQuestion
              }
              style={
                secondaryButtonStyle
              }
            >
              + إضافة سؤال
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gap: "18px",
              marginTop: "20px",
            }}
          >
            {questions.map(
              (
                question,
                questionIndex
              ) => (
                <div
                  key={
                    question.id
                  }
                  style={{
                    padding:
                      "18px",
                    borderRadius:
                      "20px",
                    background:
                      "#f8fcfa",
                    border:
                      "1px solid #d9eade",
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
                      gap: "10px",
                      marginBottom:
                        "13px",
                    }}
                  >
                    <strong
                      style={{
                        color:
                          "#126b49",
                        fontSize:
                          "18px",
                      }}
                    >
                      السؤال{" "}
                      {questionIndex +
                        1}
                    </strong>

                    {questions.length >
                      1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeQuestion(
                            question.id
                          )
                        }
                        style={{
                          border:
                            "none",
                          background:
                            "#fee2e2",
                          color:
                            "#b91c1c",
                          borderRadius:
                            "10px",
                          padding:
                            "8px 11px",
                          cursor:
                            "pointer",
                          fontWeight:
                            900,
                        }}
                      >
                        حذف
                      </button>
                    )}
                  </div>

                  <input
                    value={
                      question.question
                    }
                    onChange={(
                      event
                    ) =>
                      updateQuestionText(
                        question.id,
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="اكتب السؤال..."
                    style={
                      inputStyle
                    }
                  />

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(190px,1fr))",
                      gap: "10px",
                      marginTop:
                        "12px",
                    }}
                  >
                    {question.choices.map(
                      (
                        choice,
                        choiceIndex
                      ) => (
                        <label
                          key={
                            choiceIndex
                          }
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "9px",
                            padding:
                              "10px",
                            borderRadius:
                              "14px",
                            background:
                              question.correctAnswer ===
                              choiceIndex
                                ? "#e7f8ef"
                                : "#ffffff",
                            border:
                              question.correctAnswer ===
                              choiceIndex
                                ? "2px solid #69c697"
                                : "1px solid #dce8e1",
                          }}
                        >
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={
                              question.correctAnswer ===
                              choiceIndex
                            }
                            onChange={() =>
                              updateCorrectAnswer(
                                question.id,
                                choiceIndex
                              )
                            }
                          />

                          <input
                            value={
                              choice
                            }
                            onChange={(
                              event
                            ) =>
                              updateChoice(
                                question.id,
                                choiceIndex,
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder={`الخيار ${
                              choiceIndex +
                              1
                            }`}
                            style={{
                              width:
                                "100%",
                              border:
                                "none",
                              outline:
                                "none",
                              background:
                                "transparent",
                              fontWeight:
                                700,
                              color:
                                "#17352a",
                            }}
                          />
                        </label>
                      )
                    )}
                  </div>

                  <p
                    style={{
                      margin:
                        "10px 0 0",
                      color:
                        "#5f7067",
                      fontSize:
                        "12px",
                      fontWeight:
                        700,
                    }}
                  >
                    اختر الدائرة بجانب
                    الإجابة الصحيحة.
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        <section
          style={cardStyle}
        >
          <h2
            style={sectionTitleStyle}
          >
            ⭐ إعدادات المكافأة
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(190px,1fr))",
              gap: "14px",
            }}
          >
            <div>
              <label
                style={
                  labelStyle
                }
              >
                ⏱️ مدة التحدي
              </label>

              <div
                style={{
                  ...inputStyle,
                  background:
                    "#f1f5f9",
                  fontWeight:
                    900,
                }}
              >
                60 ثانية
              </div>
            </div>

            <div>
              <label
                style={
                  labelStyle
                }
              >
                ⭐ نقاط النجاح
              </label>

              <input
                type="number"
                min={0}
                max={100}
                value={
                  rewardPoints
                }
                onChange={(
                  event
                ) =>
                  setRewardPoints(
                    Number(
                      event.target
                        .value
                    ) || 0
                  )
                }
                style={
                  inputStyle
                }
              />
            </div>
          </div>
        </section>

        {message && (
          <div
            style={{
              padding:
                "14px 16px",
              borderRadius:
                "16px",
              background:
                message.startsWith(
                  "✅"
                )
                  ? "#eafaf1"
                  : "#fff7ed",
              color:
                message.startsWith(
                  "✅"
                )
                  ? "#08734b"
                  : "#9a3412",
              border:
                "1px solid #d9e9df",
              fontWeight: 900,
              marginBottom:
                "16px",
              lineHeight: 1.8,
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: "12px",
          }}
        >
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void saveChallenge(
                false
              )
            }
            style={{
              ...secondaryButtonStyle,
              padding:
                "15px",
              opacity:
                saving
                  ? 0.6
                  : 1,
            }}
          >
            💾 حفظ كمسودة
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void saveChallenge(
                true
              )
            }
            style={{
              ...primaryButtonStyle,
              opacity:
                saving
                  ? 0.6
                  : 1,
            }}
          >
            {saving
              ? "جارٍ الحفظ..."
              : published
              ? "🔄 تحديث التحدي المنشور"
              : "🚀 حفظ ونشر التحدي"}
          </button>
        </div>

        {published && (
          <div
            style={{
              marginTop:
                "14px",
              textAlign:
                "center",
              fontWeight:
                900,
              color:
                "#08734b",
            }}
          >
            🟢 التحدي منشور حاليًا
          </div>
        )}
      </div>
    </main>
  );
}

const cardStyle = {
  background: "#ffffff",
  border:
    "1px solid #dcebe3",
  borderRadius: "24px",
  padding: "22px",
  marginBottom: "18px",
  boxShadow:
    "0 8px 24px rgba(20,90,60,.07)",
};

const sectionTitleStyle = {
  margin: "0 0 7px",
  color: "#126b49",
  fontSize: "22px",
};

const hintStyle = {
  margin: "0 0 14px",
  color: "#64748b",
  lineHeight: 1.8,
  fontWeight: 700,
};

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  color: "#476054",
  fontWeight: 900,
};

const inputStyle = {
  width: "100%",
  boxSizing:
    "border-box" as const,
  padding: "13px 14px",
  borderRadius: "14px",
  border:
    "1px solid #cfe2d7",
  background: "#ffffff",
  outline: "none",
  fontSize: "15px",
  color: "#17352a",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "16px",
  padding: "15px",
  background:
    "linear-gradient(135deg,#168a63,#0f7654)",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow:
    "0 8px 18px rgba(22,138,99,.18)",
};

const secondaryButtonStyle = {
  border:
    "1px solid #cfe2d7",
  borderRadius: "14px",
  padding: "11px 15px",
  background: "#ffffff",
  color: "#126b49",
  fontWeight: 900,
  cursor: "pointer",
};