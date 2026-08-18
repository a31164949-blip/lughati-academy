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

function getProgress(): LessonTwoStation[] {
  if (typeof window === "undefined") {
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

function completeLanguageStation() {
  const current =
    getProgress();

  if (
    current.includes(
      "language"
    )
  ) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      ...current,
      "language",
    ])
  );
}

export default function LessonTwoLanguagePage() {
  const [stage, setStage] =
    useState(1);

  const [
    answer,
    setAnswer,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    finished,
    setFinished,
  ] = useState(false);

  const progress =
    useMemo(() => {
      if (finished) {
        return 100;
      }

      return Math.round(
        ((stage - 1) / 4) *
          100
      );
    }, [stage, finished]);

  function moveNext(
    nextStage: number
  ) {
    setMessage(
      "🌟 أحسنت! إجابة صحيحة."
    );

    window.setTimeout(() => {
      setStage(nextStage);
      setAnswer("");
      setMessage("");
    }, 650);
  }

  function checkStageOne() {
    if (
      answer ===
      "كتابٌ"
    ) {
      moveNext(2);
      return;
    }

    setMessage(
      "💡 حاول مرة أخرى. ابحث عن الكلمة التي تنتهي بتنوين الضم."
    );
  }

  function checkStageTwo() {
    if (
      answer ===
      "مدرسة"
    ) {
      moveNext(3);
      return;
    }

    setMessage(
      "💡 راجع شكل التاء المربوطة في آخر الكلمة."
    );
  }

  function checkStageThree() {
    if (
      answer ===
      "الشَّمْس"
    ) {
      moveNext(4);
      return;
    }

    setMessage(
      "🔎 تذكّر: في اللام الشمسية لا ننطق اللام، ويأتي بعدَها حرف مشدد."
    );
  }

 function finishStation() {
  if (
    answer !==
    "مُ / عَلْ / لِ / م"
  ) {
    setMessage(
      "💡 حاول مرة أخرى. اختر التحليل الصحيح للكلمة."
    );

    return;
  }

  completeLanguageStation();

  setFinished(true);

  setMessage(
    "🏆 رائع! أتممت محطة مكتشف اللغة."
  );
}

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding:
          "28px 16px 70px",
        background:
          "linear-gradient(180deg,#f6f1ff 0%,#f8fbff 52%,#effcf7 100%)",
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
                "#7021d4",
              border:
                "1px solid #e2d7f3",
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
                "#f1eaff",
              color:
                "#7021d4",
              fontWeight: 900,
            }}
          >
            🔎 المحطة الرابعة
          </span>
        </div>

        <header
          style={{
            padding:
              "32px 22px",
            borderRadius: 30,
            textAlign: "center",
            background:
              "linear-gradient(135deg,#f6f1ff,#ffffff,#eef9f4)",
            border:
              "2px solid #e2d5f4",
            boxShadow:
              "0 12px 34px rgba(100,50,150,.07)",
          }}
        >
          <div
            style={{
              fontSize: 65,
            }}
          >
            🔎
          </div>

          <h1
            style={{
              margin:
                "8px 0",
              color:
                "#7021d4",
              fontSize:
                "clamp(30px,5vw,44px)",
            }}
          >
            مكتشف اللغة
          </h1>

          <p
            style={{
              maxWidth: 680,
              margin: "0 auto",
              color:
                "#6d6673",
              lineHeight: 1.9,
              fontWeight: 700,
            }}
          >
            اكتشف المهارات اللغوية في كلمات الدرس،
            وحل التحديات خطوةً خطوة.
          </p>
        </header>

        <section
          style={{
            marginTop: 18,
            padding: 17,
            borderRadius: 21,
            background: "#ffffff",
            border:
              "1px solid #e4dced",
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
                "#7021d4",
              fontWeight: 900,
            }}
          >
            <span>
              🧭 تقدمي
            </span>

            <span>
              {finished
                ? "4 من 4"
                : `${stage} من 4`}
            </span>
          </div>

          <div
            style={{
              height: 14,
              background:
                "#eee9f2",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width:
                  `${progress}%`,
                background:
                  "linear-gradient(90deg,#7021d4,#a36bf1)",
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
              "28px 20px",
            borderRadius: 30,
            background: "#ffffff",
            border:
              "1px solid #e5dcef",
            boxShadow:
              "0 12px 30px rgba(80,50,100,.06)",
          }}
        >
          {finished ? (
            <FinishCard />
          ) : (
            <>
              {stage === 1 && (
                <Challenge
                  icon="🔤"
                  title="التنوين"
                  question="أي كلمة تنتهي بتنوين الضم؟"
                  options={[
                    "كتابٌ",
                    "كتابَ",
                    "كتابِ",
                  ]}
                  answer={answer}
                  setAnswer={
                    setAnswer
                  }
                  onCheck={
                    checkStageOne
                  }
                />
              )}

              {stage === 2 && (
                <Challenge
                  icon="ة"
                  title="التاء المربوطة"
                  question="أي كلمة تنتهي بتاء مربوطة؟"
                  options={[
                    "مدرسة",
                    "بيت",
                    "وجه",
                  ]}
                  answer={answer}
                  setAnswer={
                    setAnswer
                  }
                  onCheck={
                    checkStageTwo
                  }
                />
              )}

              {stage === 3 && (
                <Challenge
                  icon="☀️"
                  title="اللام الشمسية والقمرية"
                  question="أي كلمة تبدأ بلام شمسية؟"
                  options={[
                    "القَمَر",
                    "الشَّمْس",
                    "الكِتَاب",
                  ]}
                  answer={answer}
                  setAnswer={
                    setAnswer
                  }
                  onCheck={
                    checkStageThree
                  }
                />
              )}
{stage === 4 && (
  <Challenge
    icon="🧩"
    title="حلّل الكلمة"
    question="أي تحليل يناسب كلمة «مُعَلِّم»؟"
    options={[
      "مُعَ / لِّ / م",
      "مُ / عَلْ / لِ / م",
      "مُعَلْ / لِم",
    ]}
    answer={answer}
    setAnswer={setAnswer}
    onCheck={finishStation}
    final
  />
)}
            </>
          )}

          {message && (
            <div
              style={{
                marginTop: 18,
                padding:
                  "14px 16px",
                borderRadius: 17,
                background:
                  "#edf9f3",
                border:
                  "1px solid #cee8db",
                color:
                  "#176c46",
                textAlign: "center",
                fontWeight: 900,
                lineHeight: 1.8,
              }}
            >
              {message}
            </div>
          )}
        </section>

        {!finished && (
          <section
            style={{
              marginTop: 18,
              padding:
                "16px 18px",
              borderRadius: 21,
              background:
                "#f6f1ff",
              border:
                "1px solid #e1d7ef",
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
                  "#70428e",
                fontWeight: 800,
                lineHeight: 1.8,
              }}
            >
              فارس يقول: راقب شكل الكلمة وصوتها قبل أن تختار، فالمكتشف الذكي يبحث عن الدليل.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function Challenge({
  icon,
  title,
  question,
  options,
  answer,
  setAnswer,
  onCheck,
  final = false,
}: {
  icon: string;
  title: string;
  question: string;
  options: string[];
  answer: string;
  setAnswer: (
    value: string
  ) => void;
  onCheck: () => void;
  final?: boolean;
}) {
  return (
    <>
      <div
        style={{
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 52,
          }}
        >
          {icon}
        </div>

        <h2
          style={{
            margin:
              "8px 0",
            color:
              "#7021d4",
            fontSize: 28,
          }}
        >
          {title}
        </h2>

        <p
          style={{
            maxWidth: 650,
            margin: "0 auto",
            color:
              "#6d6673",
            lineHeight: 1.8,
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {question}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 12,
          marginTop: 22,
        }}
      >
        {options.map(
          (option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                setAnswer(
                  option
                )
              }
              style={{
                minHeight: 105,
                padding: 14,
                borderRadius: 19,
                border:
                  answer ===
                  option
                    ? "2px solid #7d35d8"
                    : "1px solid #e1d8e8",
                background:
                  answer ===
                  option
                    ? "#f2eaff"
                    : "#ffffff",
                color:
                  "#173f32",
                fontSize: 18,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {answer === option
                ? "✅ "
                : ""}
              {option}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        disabled={!answer}
        onClick={onCheck}
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
            !answer
              ? "#d3d5d4"
              : "linear-gradient(135deg,#7021d4,#8d3ce5)",
          color: "#ffffff",
          fontWeight: 900,
          fontSize: 17,
          cursor:
            !answer
              ? "not-allowed"
              : "pointer",
        }}
      >
        {final
          ? "🏆 إنهاء مكتشف اللغة"
          : "🔎 تحقق من إجابتي"}
      </button>
    </>
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
          fontSize: 72,
        }}
      >
        🔎
      </div>

      <h2
        style={{
          margin:
            "8px 0",
          color:
            "#7021d4",
          fontSize:
            "clamp(28px,5vw,38px)",
        }}
      >
        أحسنت! أصبحت مكتشفًا للغة
      </h2>

      <p
        style={{
          color:
            "#667d74",
          lineHeight: 1.9,
          fontWeight: 700,
        }}
      >
        أتممت مهارات اللغة، والآن حان وقت الانتقال إلى إملائي الجميل.
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
        ✅ المحطة الرابعة مكتملة
      </div>

      <Link
        href="/lessons/unit1/lesson2/spelling"
        style={{
          display: "block",
          maxWidth: 650,
          margin: "0 auto",
          padding:
            "15px 18px",
          borderRadius: 18,
          background:
            "linear-gradient(135deg,#c9003c,#ff2051)",
          color:
            "#ffffff",
          textDecoration:
            "none",
          fontWeight: 900,
          fontSize: 18,
        }}
      >
        ✍️ انتقل إلى إملائي الجميل
      </Link>
    </div>
  );
}