"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

const STORAGE_KEY =
  "lughati-unit1-lesson2-progress";

type LessonTwoStation =
  | "reading"
  | "comprehension"
  | "words"
  | "language"
  | "spelling"
  | "writing";

type Question = {
  id: number;
  icon: string;
  question: string;
  options: string[];
  correct: string;
  success: string;
};

const questions: Question[] = [
  {
    id: 1,
    icon: "🏫",
    question:
      "إلى أين صحب المعلم التلاميذ؟",
    options: [
      "إلى الملعب",
      "إلى مكتبة المدرسة",
      "إلى المنزل",
    ],
    correct:
      "إلى مكتبة المدرسة",
    success:
      "أحسنت! ذهب التلاميذ إلى مكتبة المدرسة للقراءة والاطلاع.",
  },
  {
    id: 2,
    icon: "😔",
    question:
      "كيف كان فواز عندما رآه المعلم؟",
    options: [
      "حزينًا",
      "فرحًا",
      "غاضبًا",
    ],
    correct: "حزينًا",
    success:
      "صحيح! كان فواز يجلس حزينًا لأنه نادم على ما فعله.",
  },
  {
    id: 3,
    icon: "📺",
    question:
      "ما الخطأ الذي ارتكبه فواز في حق جده؟",
    options: [
      "لم يزر جده",
      "لم يخفض صوت التلفاز عندما طلب منه جده",
      "نسي كتابه",
    ],
    correct:
      "لم يخفض صوت التلفاز عندما طلب منه جده",
    success:
      "رائع! عرفنا سبب ندم فواز.",
  },
  {
    id: 4,
    icon: "🎬",
    question:
      "لماذا لم يخفض فواز صوت التلفاز؟",
    options: [
      "لأنه لم يسمع جده",
      "لأنه كان نائمًا",
      "لانشغاله بمتابعة برنامجه المفضل",
    ],
    correct:
      "لانشغاله بمتابعة برنامجه المفضل",
    success:
      "أحسنت! كان منشغلًا بمتابعة برنامجه المفضل.",
  },
  {
    id: 5,
    icon: "🤝",
    question:
      "بمَ نصح المعلم فوازًا؟",
    options: [
      "أن يعتذر إلى جده ويطلب السماح منه",
      "أن يشاهد التلفاز",
      "أن يذهب إلى الملعب",
    ],
    correct:
      "أن يعتذر إلى جده ويطلب السماح منه",
    success:
      "ممتاز! الاعتذار عند الخطأ سلوك جميل.",
  },
  {
    id: 6,
    icon: "💡",
    question:
      "ماذا تعلمنا من النص؟",
    options: [
      "أن نرفع صوت التلفاز",
      "أن نطيع الكبار ونعتذر عند الخطأ",
      "أن نتجاهل النصيحة",
    ],
    correct:
      "أن نطيع الكبار ونعتذر عند الخطأ",
    success:
      "رائع يا بطل! فهمت الفكرة الرئيسة للدرس.",
  },
];

function getProgress(): LessonTwoStation[] {
  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function completeStation() {
  const current =
    getProgress();

  if (
    current.includes(
      "comprehension"
    )
  ) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      ...current,
      "comprehension",
    ])
  );
}

export default function LessonTwoComprehensionPage() {
  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    selected,
    setSelected,
  ] = useState("");

  const [
    checked,
    setChecked,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    correctCount,
    setCorrectCount,
  ] = useState(0);

  const [
    finished,
    setFinished,
  ] = useState(false);

  const currentQuestion =
    questions[currentIndex];

  const progress =
    useMemo(() => {
      if (finished) {
        return 100;
      }

      return Math.round(
        (currentIndex /
          questions.length) *
          100
      );
    }, [
      currentIndex,
      finished,
    ]);

  function checkAnswer() {
    if (!selected) {
      return;
    }

    setChecked(true);

    if (
      selected ===
      currentQuestion.correct
    ) {
      setMessage(
        currentQuestion.success
      );

      setCorrectCount(
        (value) =>
          value + 1
      );
    } else {
      setMessage(
        "💡 حاول مرة أخرى، واقرأ السؤال بهدوء."
      );
    }
  }

  function nextQuestion() {
    if (
      selected !==
      currentQuestion.correct
    ) {
      setChecked(false);
      setSelected("");
      setMessage("");
      return;
    }

    if (
      currentIndex ===
      questions.length - 1
    ) {
      completeStation();
      setFinished(true);
      return;
    }

    setCurrentIndex(
      (value) =>
        value + 1
    );

    setSelected("");
    setChecked(false);
    setMessage("");
  }

  function restart() {
    setCurrentIndex(0);
    setSelected("");
    setChecked(false);
    setMessage("");
    setCorrectCount(0);
    setFinished(false);
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding:
          "28px 16px 70px",
        background:
          "linear-gradient(180deg,#eef8ff 0%,#f7fbff 52%,#fffaf0 100%)",
        fontFamily:
          "Arial, sans-serif",
        color:
          "#173f32",
      }}
    >
      <div
        style={{
          maxWidth: 950,
          margin: "0 auto",
        }}
      >
        {/* التنقل */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <Link
            href="/lessons/unit1/lesson2"
            style={{
              textDecoration:
                "none",
              padding:
                "11px 17px",
              borderRadius: 15,
              background:
                "#ffffff",
              color:
                "#0878b5",
              border:
                "1px solid #cfe5f2",
              fontWeight: 900,
            }}
          >
            ← العودة إلى محطات الدرس
          </Link>

          <span
            style={{
              padding:
                "8px 14px",
              borderRadius: 999,
              background:
                "#eaf6fd",
              color:
                "#0878b5",
              fontWeight: 900,
            }}
          >
            🧠 المحطة الثانية
          </span>
        </div>

        {/* الرأس */}

        <header
          style={{
            textAlign: "center",
            padding:
              "32px 22px",
            borderRadius: 30,
            background:
              "linear-gradient(135deg,#eef8ff,#ffffff,#edf9f3)",
            border:
              "2px solid #cfe6f5",
            boxShadow:
              "0 12px 32px rgba(20,100,150,.07)",
          }}
        >
          <div
            style={{
              fontSize: 62,
            }}
          >
            🧠
          </div>

          <h1
            style={{
              margin:
                "8px 0",
              color:
                "#0878b5",
              fontSize:
                "clamp(30px,5vw,43px)",
            }}
          >
            أفهم وأستنتج
          </h1>

          <p
            style={{
              maxWidth: 650,
              margin: "0 auto",
              color:
                "#657d74",
              lineHeight: 1.9,
              fontWeight: 700,
            }}
          >
            أجب عن أسئلة قصة «عذرًا يا جدي»،
            واستخرج أهم ما تعلمته من موقف فواز.
          </p>
        </header>

        {/* التقدم */}

        <section
          style={{
            marginTop: 18,
            padding: 17,
            borderRadius: 21,
            background:
              "#ffffff",
            border:
              "1px solid #dce9ef",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 10,
              marginBottom: 10,
              fontWeight: 900,
              color:
                "#0878b5",
            }}
          >
            <span>
              🚀 تقدمي
            </span>

            <span>
              {finished
                ? "6 من 6"
                : `${currentIndex + 1} من 6`}
            </span>
          </div>

          <div
            style={{
              height: 14,
              borderRadius: 999,
              background:
                "#e8eef1",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width:
                  `${progress}%`,
                borderRadius: 999,
                background:
                  "linear-gradient(90deg,#0b8ccf,#65c6ed)",
                transition:
                  "width .35s ease",
              }}
            />
          </div>
        </section>

        {/* السؤال أو النهاية */}

        <section
          style={{
            marginTop: 20,
            padding:
              "28px 20px",
            borderRadius: 30,
            background:
              "#ffffff",
            border:
              "1px solid #dce9ef",
            boxShadow:
              "0 12px 30px rgba(30,80,100,.06)",
          }}
        >
          {finished ? (
            <div
              style={{
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 72,
                }}
              >
                🎉
              </div>

              <h2
                style={{
                  margin:
                    "8px 0",
                  color:
                    "#0878b5",
                  fontSize: 31,
                }}
              >
                أحسنت! فهمت النص
              </h2>

              <p
                style={{
                  color:
                    "#657d74",
                  lineHeight: 1.9,
                  fontWeight: 700,
                }}
              >
                أتممت المحطة الثانية
                وأصبحت جاهزًا للانتقال
                إلى كنز الكلمات.
              </p>

              <div
                style={{
                  maxWidth: 550,
                  margin:
                    "18px auto",
                  padding: 16,
                  borderRadius: 18,
                  background:
                    "#edf9f3",
                  border:
                    "1px solid #cce8da",
                  color:
                    "#176c46",
                  fontWeight: 900,
                }}
              >
                ⭐ المحطة الثانية مكتملة
              </div>

              <Link
                href="/lessons/unit1/lesson2/words"
                style={{
                  display: "block",
                  maxWidth: 650,
                  margin:
                    "0 auto",
                  padding:
                    "15px 18px",
                  borderRadius: 18,
                  textDecoration:
                    "none",
                  background:
                    "linear-gradient(135deg,#d98a00,#f0a51d)",
                  color:
                    "#ffffff",
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                💎 انتقل إلى كنز الكلمات
              </Link>

              <button
                type="button"
                onClick={restart}
                style={{
                  marginTop: 13,
                  border:
                    "1px solid #dce6e1",
                  borderRadius: 14,
                  padding:
                    "10px 15px",
                  background:
                    "#ffffff",
                  color:
                    "#657d74",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                🔁 أعد الأسئلة
              </button>
            </div>
          ) : (
            <>
              {/* السؤال */}

              <div
                style={{
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    fontSize: 50,
                  }}
                >
                  {currentQuestion.icon}
                </div>

                <span
                  style={{
                    display:
                      "inline-block",
                    marginTop: 6,
                    padding:
                      "5px 10px",
                    borderRadius: 999,
                    background:
                      "#eef8ff",
                    color:
                      "#0878b5",
                    fontWeight: 900,
                    fontSize: 12,
                  }}
                >
                  السؤال{" "}
                  {currentIndex + 1}
                </span>

                <h2
                  style={{
                    maxWidth: 720,
                    margin:
                      "12px auto 0",
                    color:
                      "#214d62",
                    lineHeight: 1.8,
                    fontSize:
                      "clamp(23px,4vw,30px)",
                  }}
                >
                  {currentQuestion.question}
                </h2>
              </div>

              {/* الخيارات */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(190px,1fr))",
                  gap: 12,
                  marginTop: 24,
                }}
              >
                {currentQuestion.options.map(
                  (option) => {
                    const isSelected =
                      selected ===
                      option;

                    const isCorrect =
                      checked &&
                      option ===
                        currentQuestion.correct;

                    const isWrong =
                      checked &&
                      isSelected &&
                      option !==
                        currentQuestion.correct;

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={
                          checked &&
                          selected ===
                            currentQuestion.correct
                        }
                        onClick={() => {
                          if (
                            checked &&
                            selected ===
                              currentQuestion.correct
                          ) {
                            return;
                          }

                          setSelected(
                            option
                          );

                          setChecked(
                            false
                          );

                          setMessage(
                            ""
                          );
                        }}
                        style={{
                          minHeight:
                            115,
                          padding:
                            "15px 14px",
                          borderRadius:
                            20,
                          border:
                            isCorrect
                              ? "2px solid #22a66c"
                              : isWrong
                                ? "2px solid #dc5b5b"
                                : isSelected
                                  ? "2px solid #209ad3"
                                  : "1px solid #dce7ec",
                          background:
                            isCorrect
                              ? "#eaf9f1"
                              : isWrong
                                ? "#fff0f0"
                                : isSelected
                                  ? "#eef8ff"
                                  : "#ffffff",
                          color:
                            "#173f32",
                          fontSize:
                            16,
                          fontWeight:
                            900,
                          cursor:
                            "pointer",
                        }}
                      >
                        {isCorrect
                          ? "✅ "
                          : isWrong
                            ? "❌ "
                            : ""}

                        {option}
                      </button>
                    );
                  }
                )}
              </div>

              {/* الرسالة */}

              {message && (
                <div
                  style={{
                    marginTop: 18,
                    padding:
                      "14px 16px",
                    borderRadius: 17,
                    textAlign:
                      "center",
                    background:
                      selected ===
                      currentQuestion.correct
                        ? "#edf9f3"
                        : "#fff8e6",
                    color:
                      selected ===
                      currentQuestion.correct
                        ? "#176c46"
                        : "#8a6500",
                    fontWeight: 900,
                    lineHeight: 1.8,
                  }}
                >
                  {message}
                </div>
              )}

              {/* الأزرار */}

              {!checked ||
              selected !==
                currentQuestion.correct ? (
                <button
                  type="button"
                  disabled={
                    !selected
                  }
                  onClick={
                    checkAnswer
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: 650,
                    margin:
                      "22px auto 0",
                    padding:
                      "15px 18px",
                    border: "none",
                    borderRadius: 17,
                    background:
                      !selected
                        ? "#cbd5d0"
                        : "linear-gradient(135deg,#098fd4,#0878b5)",
                    color:
                      "#ffffff",
                    fontWeight: 900,
                    fontSize: 17,
                    cursor:
                      !selected
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  تحقق من إجابتي
                </button>
              ) : (
                <button
                  type="button"
                  onClick={
                    nextQuestion
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: 650,
                    margin:
                      "22px auto 0",
                    padding:
                      "15px 18px",
                    border: "none",
                    borderRadius: 17,
                    background:
                      "linear-gradient(135deg,#159765,#08a16f)",
                    color:
                      "#ffffff",
                    fontWeight: 900,
                    fontSize: 17,
                    cursor:
                      "pointer",
                  }}
                >
                  {currentIndex ===
                  questions.length - 1
                    ? "🏆 إنهاء المحطة"
                    : "التالي ←"}
                </button>
              )}
            </>
          )}
        </section>

        {/* فارس */}

        {!finished && (
          <section
            style={{
              marginTop: 18,
              padding:
                "16px 18px",
              borderRadius: 21,
              background:
                "#edf9f3",
              border:
                "1px solid #d2e8dd",
              display: "flex",
              gap: 12,
              alignItems:
                "center",
            }}
          >
            <span
              style={{
                fontSize: 34,
              }}
            >
              🦸
            </span>

            <p
              style={{
                margin: 0,
                color:
                  "#176c46",
                fontWeight: 800,
                lineHeight: 1.8,
              }}
            >
              فارس يقول: ارجع إلى أحداث القصة في ذهنك قبل اختيار الإجابة، ولا تعتمد على مكان الخيار.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}