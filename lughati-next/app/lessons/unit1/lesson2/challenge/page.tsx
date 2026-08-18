"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

const LESSON_COMPLETED_KEY =
  "lughati-unit1-lesson2-completed";

type Question = {
  id: number;
  icon: string;
  title: string;
  question: string;
  options: string[];
  correct: string;
  success: string;
};

const questions: Question[] = [
  {
    id: 1,
    icon: "😔",
    title: "بوابة الفهم",
    question:
      "لماذا كان فواز نادمًا؟",
    options: [
      "لأنه لم يذهب إلى المدرسة",
      "لأنه لم يخفض صوت التلفاز عندما طلب منه جده",
      "لأنه نسي كتابه",
    ],
    correct:
      "لأنه لم يخفض صوت التلفاز عندما طلب منه جده",
    success:
      "أحسنت! فهمت سبب ندم فواز.",
  },
  {
    id: 2,
    icon: "💎",
    title: "بوابة الكلمات",
    question:
      "ما معنى كلمة «عَطُوفٌ»؟",
    options: [
      "غاضب",
      "حزين",
      "رحيم ومحب",
    ],
    correct:
      "رحيم ومحب",
    success:
      "رائع! عطوف تعني رحيمًا ومحبًّا.",
  },
  {
    id: 3,
    icon: "🔎",
    title: "بوابة اللغة",
    question:
      "أي جملة صحيحة باستخدام «إنَّ»؟",
    options: [
      "إِنَّ الْجَدُّ عَطُوفٌ.",
      "إِنَّ الْجَدَّ عَطُوفٌ.",
      "إِنَّ الْجَدِّ عَطُوفٌ.",
    ],
    correct:
      "إِنَّ الْجَدَّ عَطُوفٌ.",
    success:
      "ممتاز! استخدمت «إنَّ» استخدامًا صحيحًا.",
  },
  {
    id: 4,
    icon: "✍️",
    title: "بوابة الإملاء",
    question:
      "اختر الكلمة المكتوبة كتابة صحيحة:",
    options: [
      "السماح",
      "السماحح",
      "السماااح",
    ],
    correct:
      "السماح",
    success:
      "أحسنت! الكلمة الصحيحة هي «السماح».",
  },
  {
    id: 5,
    icon: "🤝",
    title: "بوابة الموقف",
    question:
      "إذا أخطأت في حق جدك، فما التصرف الأفضل؟",
    options: [
      "أتجاهل الخطأ",
      "أغادر المكان",
      "أعتذر وأطلب السماح",
    ],
    correct:
      "أعتذر وأطلب السماح",
    success:
      "رائع يا بطل! هذا هو السلوك الصحيح.",
  },
];

export default function LessonTwoChallengePage() {
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

      return;
    }

    setMessage(
      "💡 حاول مرة أخرى، وفكّر في أحداث الدرس والمهارات التي تدربت عليها."
    );
  }

  function nextQuestion() {
    if (
      selected !==
      currentQuestion.correct
    ) {
      setSelected("");
      setChecked(false);
      setMessage("");
      return;
    }

    if (
      currentIndex ===
      questions.length - 1
    ) {
      localStorage.setItem(
        LESSON_COMPLETED_KEY,
        "true"
      );

      setFinished(true);
      setMessage(
        "🏆 أحسنت! أتقنت درس «عذرًا يا جدي»."
      );

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

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding:
          "28px 16px 70px",
        background:
          "linear-gradient(180deg,#fff8df 0%,#fffdf5 45%,#effcf7 100%)",
        fontFamily:
          "Arial, sans-serif",
        color:
          "#173f32",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
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
                "#8b6200",
              border:
                "1px solid #ead9a2",
              fontWeight: 900,
            }}
          >
            ← العودة إلى الدرس
          </Link>

          <span
            style={{
              padding:
                "8px 14px",
              borderRadius: 999,
              background:
                "#fff0b8",
              color:
                "#8b6200",
              fontWeight: 900,
            }}
          >
            🏆 التحدي الختامي
          </span>
        </div>

        <header
          style={{
            padding:
              "34px 22px",
            borderRadius: 30,
            textAlign: "center",
            background:
              "linear-gradient(135deg,#fff3b8,#ffffff,#eef9f4)",
            border:
              "2px solid #edca59",
            boxShadow:
              "0 14px 35px rgba(150,100,20,.08)",
          }}
        >
          <div
            style={{
              fontSize: 74,
            }}
          >
            🏆
          </div>

          <h1
            style={{
              margin:
                "8px 0",
              color:
                "#946600",
              fontSize:
                "clamp(30px,5vw,44px)",
            }}
          >
            تحدي اعتذار فواز
          </h1>

          <p
            style={{
              maxWidth: 700,
              margin: "0 auto",
              color:
                "#716b58",
              lineHeight: 1.9,
              fontWeight: 700,
            }}
          >
            خمس بوابات أخيرة تجمع أهم ما تعلمته في درس «عذرًا يا جدي».
          </p>
        </header>

        <section
          style={{
            marginTop: 18,
            padding: 17,
            borderRadius: 21,
            background: "#ffffff",
            border:
              "1px solid #eadfbe",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 10,
              marginBottom: 10,
              color:
                "#8b6200",
              fontWeight: 900,
            }}
          >
            <span>
              🚪 تقدمي في البوابات
            </span>

            <span>
              {finished
                ? "5 من 5"
                : `${currentIndex + 1} من 5`}
            </span>
          </div>

          <div
            style={{
              height: 14,
              borderRadius: 999,
              background:
                "#eee9dc",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width:
                  `${progress}%`,
                height: "100%",
                borderRadius: 999,
                background:
                  "linear-gradient(90deg,#d49716,#f0b52d)",
                transition:
                  "width .4s ease",
              }}
            />
          </div>
        </section>

        <section
          style={{
            marginTop: 20,
            padding:
              "30px 20px",
            borderRadius: 30,
            background:
              "#ffffff",
            border:
              "1px solid #e8dfc5",
            boxShadow:
              "0 12px 30px rgba(100,80,30,.06)",
          }}
        >
          {finished ? (
            <FinishCard />
          ) : (
            <>
              <div
                style={{
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    fontSize: 56,
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
                      "5px 11px",
                    borderRadius: 999,
                    background:
                      "#fff4cd",
                    color:
                      "#8b6200",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  البوابة {currentQuestion.id}
                </span>

                <h2
                  style={{
                    margin:
                      "10px 0 8px",
                    color:
                      "#946600",
                    fontSize: 28,
                  }}
                >
                  {currentQuestion.title}
                </h2>

                <p
                  style={{
                    maxWidth: 720,
                    margin: "0 auto",
                    color:
                      "#686554",
                    lineHeight: 1.8,
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {currentQuestion.question}
                </p>
              </div>

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
                          setChecked(false);
                          setMessage("");
                        }}
                        style={{
                          minHeight: 112,
                          padding: 14,
                          borderRadius: 20,
                          border:
                            isCorrect
                              ? "2px solid #22a66c"
                              : isWrong
                                ? "2px solid #dc5b5b"
                                : isSelected
                                  ? "2px solid #d49a18"
                                  : "1px solid #e5dcc4",
                          background:
                            isCorrect
                              ? "#eaf9f1"
                              : isWrong
                                ? "#fff0f0"
                                : isSelected
                                  ? "#fff4cd"
                                  : "#ffffff",
                          color:
                            "#173f32",
                          fontWeight: 900,
                          fontSize: 17,
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

              {message && (
                <div
                  style={{
                    marginTop: 18,
                    padding:
                      "14px 16px",
                    borderRadius: 17,
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
                    textAlign: "center",
                    fontWeight: 900,
                    lineHeight: 1.8,
                  }}
                >
                  {message}
                </div>
              )}

              {!checked ||
              selected !==
                currentQuestion.correct ? (
                <button
                  type="button"
                  disabled={!selected}
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
                        ? "#d3d5d4"
                        : "linear-gradient(135deg,#d49716,#f0b52d)",
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
                    ? "🏆 إنهاء التحدي"
                    : "البوابة التالية ←"}
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function FinishCard() {
  return (
    <div
      style={{
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 82,
        }}
      >
        👑
      </div>

      <h2
        style={{
          margin:
            "8px 0",
          color:
            "#946600",
          fontSize:
            "clamp(30px,5vw,40px)",
        }}
      >
        أحسنت! أتقنت «عذرًا يا جدي»
      </h2>

      <p
        style={{
          maxWidth: 680,
          margin: "0 auto",
          color:
            "#686554",
          lineHeight: 1.9,
          fontWeight: 700,
        }}
      >
        اجتزت البوابات الخمس وأكملت الدرس الثاني من وحدة «أقاربي» بنجاح.
      </p>

      <div
        style={{
          maxWidth: 580,
          margin:
            "20px auto",
          padding:
            "18px 20px",
          borderRadius: 20,
          background:
            "#fff7cf",
          border:
            "2px solid #edca59",
          color:
            "#8a6200",
          fontWeight: 900,
          fontSize: 18,
          lineHeight: 1.9,
        }}
      >
        🏆 درس «عذرًا يا جدي» مكتمل
        <br />
        ⭐ أصبحت مراجعة الوحدة متاحة
      </div>

      <Link
        href="/lessons/unit1"
        style={{
          display: "block",
          maxWidth: 650,
          margin: "0 auto",
          padding:
            "16px 18px",
          borderRadius: 18,
          background:
            "linear-gradient(135deg,#168a63,#0f7654)",
          color:
            "#ffffff",
          textDecoration:
            "none",
          fontWeight: 900,
          fontSize: 18,
        }}
      >
        🗺️ العودة إلى وحدة أقاربي
      </Link>
    </div>
  );
}