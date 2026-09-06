"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../firebase";

type SurpriseChallenge = {
  id: string;
  title: string;
  question: string;
  correctAnswer: string;
  points: number;
  targetClassroom: string;
  durationMinutes: number;
  active: boolean;
  createdAt?: unknown;
  expiresAt?: string;
};

type ChallengeAnswer = {
  id: string;
  challengeId: string;
  studentId: string;
  studentName: string;
  classroom: string;
  answer: string;
  isCorrect: boolean;
  submittedAt?: {
    toDate?: () => Date;
  } | null;
};

const ACTIVE_CHALLENGE_ID =
  "active-surprise-challenge";

export default function SurpriseChallengeTeacherPage() {
  const [title, setTitle] =
    useState("لغز البرق");

  const [question, setQuestion] =
    useState("");

  const [correctAnswer, setCorrectAnswer] =
    useState("");

  const [points, setPoints] =
    useState(3);

  const [targetClassroom, setTargetClassroom] =
    useState("الجميع");

  const [durationMinutes, setDurationMinutes] =
    useState(15);

  const [activeChallenge, setActiveChallenge] =
    useState<SurpriseChallenge | null>(null);

  const [answers, setAnswers] =
    useState<ChallengeAnswer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function loadChallenge() {
    setLoading(true);

    try {
      const challengeRef = doc(
        db,
        "surpriseChallenges",
        ACTIVE_CHALLENGE_ID
      );

      const snapshot =
        await getDoc(challengeRef);

      if (!snapshot.exists()) {
        setActiveChallenge(null);
        setAnswers([]);
        return;
      }

      const data = snapshot.data();

      const challenge: SurpriseChallenge = {
        id: snapshot.id,

        title:
          typeof data.title === "string"
            ? data.title
            : "لغز البرق",

        question:
          typeof data.question === "string"
            ? data.question
            : "",

        correctAnswer:
          typeof data.correctAnswer === "string"
            ? data.correctAnswer
            : "",

        points:
          typeof data.points === "number"
            ? data.points
            : 3,

        targetClassroom:
          typeof data.targetClassroom === "string"
            ? data.targetClassroom
            : "الجميع",

        durationMinutes:
          typeof data.durationMinutes === "number"
            ? data.durationMinutes
            : 15,

        active:
          data.active === true,

        createdAt:
          data.createdAt,

        expiresAt:
          typeof data.expiresAt === "string"
            ? data.expiresAt
            : "",
      };

      setActiveChallenge(challenge);

      if (challenge.active) {
        await loadAnswers();
      } else {
        setAnswers([]);
      }
    } catch (error) {
      console.error(
        "تعذر تحميل التحدي:",
        error
      );

      setMessage(
        "تعذر تحميل التحدي."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadAnswers() {
    try {
      const answersQuery = query(
        collection(
          db,
          "surpriseChallengeAnswers"
        ),
        orderBy("submittedAt", "asc"),
        limit(100)
      );

      const snapshot =
        await getDocs(answersQuery);

      const items =
        snapshot.docs
          .map((answerDocument) => {
            const data =
              answerDocument.data();

            return {
              id: answerDocument.id,

              challengeId:
                typeof data.challengeId ===
                "string"
                  ? data.challengeId
                  : "",

              studentId:
                typeof data.studentId ===
                "string"
                  ? data.studentId
                  : "",

              studentName:
                typeof data.studentName ===
                "string"
                  ? data.studentName
                  : "طالب",

              classroom:
                typeof data.classroom ===
                "string"
                  ? data.classroom
                  : "",

              answer:
                typeof data.answer ===
                "string"
                  ? data.answer
                  : "",

              isCorrect:
                data.isCorrect === true,

              submittedAt:
                data.submittedAt ?? null,
            } satisfies ChallengeAnswer;
          })
          .filter(
            (answer) =>
              answer.challengeId ===
              ACTIVE_CHALLENGE_ID
          );

      setAnswers(items);
    } catch (error) {
      console.error(
        "تعذر تحميل الإجابات:",
        error
      );
    }
  }

  useEffect(() => {
    void loadChallenge();
  }, []);

  async function handleLaunchChallenge() {
    if (!question.trim()) {
      setMessage(
        "اكتب سؤال التحدي أولًا."
      );

      return;
    }

    if (!correctAnswer.trim()) {
      setMessage(
        "اكتب الإجابة الصحيحة."
      );

      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const now = new Date();

      const expiresAt =
        new Date(
          now.getTime() +
            durationMinutes *
              60 *
              1000
        ).toISOString();

      await setDoc(
        doc(
          db,
          "surpriseChallenges",
          ACTIVE_CHALLENGE_ID
        ),
        {
          title:
            title.trim() ||
            "لغز البرق",

          question:
            question.trim(),

          correctAnswer:
            correctAnswer
              .trim()
              .toLowerCase(),

          points,

          targetClassroom,

          durationMinutes,

          active: true,

          challengeVersion:
            Date.now().toString(),

          createdAt:
            serverTimestamp(),

          expiresAt,
        }
      );

      setMessage(
        "⚡ تم إطلاق التحدي المفاجئ بنجاح!"
      );

      await loadChallenge();
    } catch (error) {
      console.error(
        "تعذر إطلاق التحدي:",
        error
      );

      setMessage(
        "حدث خطأ أثناء إطلاق التحدي."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCloseChallenge() {
    if (!activeChallenge) {
      return;
    }

    try {
      await updateDoc(
        doc(
          db,
          "surpriseChallenges",
          ACTIVE_CHALLENGE_ID
        ),
        {
          active: false,
          closedAt:
            serverTimestamp(),
        }
      );

      setMessage(
        "تم إنهاء التحدي."
      );

      await loadChallenge();
    } catch (error) {
      console.error(
        "تعذر إنهاء التحدي:",
        error
      );

      setMessage(
        "تعذر إنهاء التحدي."
      );
    }
  }

  const correctAnswers =
    answers.filter(
      (answer) => answer.isCorrect
    );

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f4fbf7 0%, #eef7f2 100%)",
        padding: "24px 16px 60px",
        fontFamily:
          "Tahoma, Arial, sans-serif",
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
            gap: "12px",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/teacher"
            style={{
              textDecoration: "none",
              color: "#146c43",
              background: "#ffffff",
              padding: "10px 16px",
              borderRadius: "14px",
              fontWeight: 800,
              boxShadow:
                "0 4px 14px rgba(0,0,0,0.07)",
            }}
          >
            ← العودة للوحة المعلم
          </Link>

          <button
            onClick={() =>
              void loadChallenge()
            }
            style={{
              border: 0,
              cursor: "pointer",
              borderRadius: "14px",
              padding: "10px 16px",
              fontWeight: 800,
              background: "#e8f7ef",
              color: "#146c43",
            }}
          >
            🔄 تحديث
          </button>
        </div>

        <section
          style={{
            background:
              "linear-gradient(135deg, #135f3d, #20895b)",
            color: "white",
            borderRadius: "28px",
            padding: "28px 22px",
            marginBottom: "22px",
            boxShadow:
              "0 14px 34px rgba(16, 96, 59, 0.18)",
          }}
        >
          <div
            style={{
              fontSize: "42px",
              marginBottom: "8px",
            }}
          >
            ⚡
          </div>

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "30px",
            }}
          >
            لغز البرق
          </h1>

          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              opacity: 0.95,
            }}
          >
            أطلق سؤالًا مفاجئًا
            لطلاب الأكاديمية واستقبل
            إجاباتهم مباشرة.
          </p>
        </section>

        {message && (
          <div
            style={{
              padding: "14px 16px",
              background: "#fff7d6",
              borderRadius: "16px",
              marginBottom: "18px",
              fontWeight: 800,
              color: "#715700",
            }}
          >
            {message}
          </div>
        )}

        <section
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            padding: "22px",
            boxShadow:
              "0 10px 26px rgba(0,0,0,0.07)",
            marginBottom: "22px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#145c3d",
            }}
          >
            ✨ إنشاء تحدٍ مفاجئ
          </h2>

          <label style={labelStyle}>
            اسم التحدي
          </label>

          <input
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
            style={inputStyle}
          />

          <label style={labelStyle}>
            السؤال أو اللغز
          </label>

          <textarea
            value={question}
            onChange={(event) =>
              setQuestion(
                event.target.value
              )
            }
            placeholder="مثال: كلمة تبدأ بحرف م وتنتهي بحرف ة، فما هي؟"
            style={{
              ...inputStyle,
              minHeight: "110px",
              resize: "vertical",
            }}
          />

          <label style={labelStyle}>
            الإجابة الصحيحة
          </label>

          <input
            value={correctAnswer}
            onChange={(event) =>
              setCorrectAnswer(
                event.target.value
              )
            }
            placeholder="الإجابة التي سيقارن بها النظام"
            style={inputStyle}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
            }}
          >
            <div>
              <label style={labelStyle}>
                النقاط
              </label>

              <input
                type="number"
                min={0}
                max={20}
                value={points}
                onChange={(event) =>
                  setPoints(
                    Number(
                      event.target.value
                    )
                  )
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                مدة التحدي بالدقائق
              </label>

              <input
                type="number"
                min={1}
                max={120}
                value={
                  durationMinutes
                }
                onChange={(event) =>
                  setDurationMinutes(
                    Number(
                      event.target.value
                    )
                  )
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                المستهدف
              </label>

              <select
                value={targetClassroom}
                onChange={(event) =>
                  setTargetClassroom(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="الجميع">
                  جميع الطلاب
                </option>

                <option value="الثاني أ">
                  الثاني أ
                </option>

                <option value="الثاني ب">
                  الثاني ب
                </option>
              </select>
            </div>
          </div>

          <button
            onClick={() =>
              void handleLaunchChallenge()
            }
            disabled={saving}
            style={{
              width: "100%",
              marginTop: "20px",
              border: 0,
              borderRadius: "18px",
              padding: "16px",
              fontSize: "18px",
              fontWeight: 900,
              cursor: saving
                ? "default"
                : "pointer",
              background:
                "linear-gradient(135deg, #ffb703, #fb8500)",
              color: "#ffffff",
              boxShadow:
                "0 8px 20px rgba(251,133,0,0.25)",
              opacity: saving
                ? 0.7
                : 1,
            }}
          >
            {saving
              ? "جارٍ الإطلاق..."
              : "⚡ إطلاق التحدي الآن"}
          </button>
        </section>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "30px",
            }}
          >
            جارٍ التحميل...
          </div>
        ) : activeChallenge?.active ? (
          <>
            <section
              style={{
                background:
                  "#fff8e1",
                border:
                  "2px solid #ffcf4a",
                borderRadius: "24px",
                padding: "22px",
                marginBottom:
                  "22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: "14px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      color:
                        "#a35c00",
                      fontWeight: 900,
                      marginBottom:
                        "6px",
                    }}
                  >
                    🟢 التحدي نشط الآن
                  </div>

                  <h3
                    style={{
                      margin:
                        "0 0 8px",
                    }}
                  >
                    {
                      activeChallenge.question
                    }
                  </h3>

                  <div>
                    المستهدف:{" "}
                    <strong>
                      {
                        activeChallenge.targetClassroom
                      }
                    </strong>
                  </div>
                </div>

                <button
                  onClick={() =>
                    void handleCloseChallenge()
                  }
                  style={{
                    border: 0,
                    borderRadius:
                      "14px",
                    padding:
                      "12px 18px",
                    cursor:
                      "pointer",
                    background:
                      "#b42318",
                    color: "white",
                    fontWeight: 900,
                  }}
                >
                  ⛔ إنهاء التحدي
                </button>
              </div>
            </section>

            <section
              style={{
                background: "#fff",
                borderRadius:
                  "24px",
                padding: "22px",
                boxShadow:
                  "0 10px 26px rgba(0,0,0,0.07)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom:
                    "18px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color:
                      "#145c3d",
                  }}
                >
                  📥 إجابات الطلاب
                </h2>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <span
                    style={
                      statBadgeStyle
                    }
                  >
                    المشاركات:{" "}
                    {answers.length}
                  </span>

                  <span
                    style={
                      statBadgeStyle
                    }
                  >
                    الصحيحة:{" "}
                    {
                      correctAnswers.length
                    }
                  </span>
                </div>
              </div>

              {answers.length ===
              0 ? (
                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "30px 10px",
                    color:
                      "#6b7c73",
                  }}
                >
                  لم تصل إجابات
                  حتى الآن.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  {answers.map(
                    (
                      answer,
                      index
                    ) => {
                      const date =
                        answer
                          .submittedAt
                          ?.toDate?.();

                      return (
                        <div
                          key={
                            answer.id
                          }
                          style={{
                            border:
                              answer.isCorrect
                                ? "2px solid #84d6aa"
                                : "1px solid #e3e8e5",
                            borderRadius:
                              "18px",
                            padding:
                              "16px",
                            background:
                              answer.isCorrect
                                ? "#effbf4"
                                : "#fafafa",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              gap: "12px",
                              flexWrap:
                                "wrap",
                            }}
                          >
                            <div>
                              <strong>
                                {index +
                                  1}
                                .{" "}
                                {
                                  answer.studentName
                                }
                              </strong>

                              <div
                                style={{
                                  color:
                                    "#66766e",
                                  marginTop:
                                    "4px",
                                }}
                              >
                                {
                                  answer.classroom
                                }
                              </div>
                            </div>

                            <strong
                              style={{
                                color:
                                  answer.isCorrect
                                    ? "#087443"
                                    : "#9b2c2c",
                              }}
                            >
                              {answer.isCorrect
                                ? "✅ صحيحة"
                                : "❌ غير صحيحة"}
                            </strong>
                          </div>

                          <div
                            style={{
                              marginTop:
                                "12px",
                              background:
                                "#ffffff",
                              padding:
                                "12px",
                              borderRadius:
                                "12px",
                            }}
                          >
                            {
                              answer.answer
                            }
                          </div>

                          {date && (
                            <div
                              style={{
                                fontSize:
                                  "13px",
                                color:
                                  "#748078",
                                marginTop:
                                  "9px",
                              }}
                            >
                              🕒{" "}
                              {date.toLocaleTimeString(
                                "ar-SA"
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </>
        ) : (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              background: "#ffffff",
              borderRadius: "20px",
              color: "#66766e",
            }}
          >
            لا يوجد تحدٍّ مفاجئ
            نشط حاليًا.
          </div>
        )}
      </div>
    </main>
  );
}

const labelStyle = {
  display: "block",
  marginTop: "14px",
  marginBottom: "7px",
  fontWeight: 800,
  color: "#214d39",
};

const inputStyle = {
  width: "100%",
  boxSizing:
    "border-box" as const,
  border: "1px solid #cbd8d1",
  borderRadius: "14px",
  padding: "13px 14px",
  fontSize: "16px",
  outline: "none",
  background: "#fbfdfc",
};

const statBadgeStyle = {
  background: "#eaf7ef",
  color: "#17633f",
  borderRadius: "999px",
  padding: "8px 12px",
  fontSize: "14px",
  fontWeight: 800,
};