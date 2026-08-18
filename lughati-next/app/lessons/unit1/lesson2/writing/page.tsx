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

function completeWritingStation() {
  const current =
    getProgress();

  if (
    current.includes(
      "writing"
    )
  ) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      ...current,
      "writing",
    ])
  );
}

export default function LessonTwoWritingPage() {
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
    apology,
    setApology,
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
        ((stage - 1) / 4) * 100
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
      "إِنَّ الْجَدَّ عَطُوفٌ."
    ) {
      moveNext(2);
      return;
    }

    setMessage(
      "💡 حاول مرة أخرى. انتبه إلى الجملة التي تبدأ بـ «إنَّ»."
    );
  }

  function checkStageTwo() {
    if (
      answer ===
      "هِيَ تَعْتَذِرُ إِلَى جَدِّهَا."
    ) {
      moveNext(3);
      return;
    }

    setMessage(
      "💡 حوّل الجملة إلى المؤنث مع تغيير الضمير."
    );
  }

  function checkStageThree() {
    if (
      answer ===
      "أَعْتَذِرُ إِلَى جَدِّي عِنْدَمَا أُخْطِئُ."
    ) {
      moveNext(4);
      return;
    }

    setMessage(
      "🧩 رتّب الكلمات لتكوين جملة صحيحة."
    );
  }

  function finishStation() {
    if (
      apology.trim().length < 6
    ) {
      setMessage(
        "✍️ اكتب جملة اعتذار قصيرة وواضحة."
      );

      return;
    }

    completeWritingStation();

    setFinished(true);

    setMessage(
      "🏆 رائع! أتممت المحطة السادسة والأخيرة."
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
          "linear-gradient(180deg,#edfafa 0%,#f8fbff 52%,#fffaf0 100%)",
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
                "#087d76",
              border:
                "1px solid #cfe8e5",
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
                "#e8f8f7",
              color:
                "#087d76",
              fontWeight: 900,
            }}
          >
            🖊️ المحطة السادسة
          </span>
        </div>

        <header
          style={{
            padding:
              "32px 22px",
            borderRadius: 30,
            textAlign: "center",
            background:
              "linear-gradient(135deg,#edfafa,#ffffff,#fff8e8)",
            border:
              "2px solid #cfe8e5",
            boxShadow:
              "0 12px 34px rgba(20,120,110,.07)",
          }}
        >
          <div
            style={{
              fontSize: 65,
            }}
          >
            🖊️
          </div>

          <h1
            style={{
              margin:
                "8px 0",
              color:
                "#087d76",
              fontSize:
                "clamp(30px,5vw,44px)",
            }}
          >
            أكتب وأستخدم
          </h1>

          <p
            style={{
              maxWidth: 680,
              margin: "0 auto",
              color:
                "#667874",
              lineHeight: 1.9,
              fontWeight: 700,
            }}
          >
            استخدم ما تعلمته في جمل جديدة، ورتّب الكلمات، ثم اكتب جملة اعتذار جميلة.
          </p>
        </header>

        <section
          style={{
            marginTop: 18,
            padding: 17,
            borderRadius: 21,
            background: "#ffffff",
            border:
              "1px solid #dce9e6",
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
                "#087d76",
              fontWeight: 900,
            }}
          >
            <span>
              ✨ تقدمي
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
                "#e6efed",
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
                  "linear-gradient(90deg,#087d76,#35b6aa)",
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
              "1px solid #dce9e6",
            boxShadow:
              "0 12px 30px rgba(30,90,80,.06)",
          }}
        >
          {finished ? (
            <FinishCard />
          ) : (
            <>
              {stage === 1 && (
                <ChoiceStage
                  icon="✨"
                  title="استخدم «إنَّ»"
                  question="أي جملة صحيحة؟"
                  options={[
                    "إِنَّ الْجَدَّ عَطُوفٌ.",
                    "إِنَّ الْجَدُّ عَطُوفٌ.",
                    "إِنَّ الْجَدِّ عَطُوفٌ.",
                  ]}
                  answer={answer}
                  setAnswer={setAnswer}
                  onCheck={checkStageOne}
                />
              )}

              {stage === 2 && (
                <ChoiceStage
                  icon="👧"
                  title="حوّل إلى المؤنث"
                  question="حوّل الجملة: «هُوَ يَعْتَذِرُ إِلَى جَدِّهِ» إلى المؤنث."
                  options={[
                    "هِيَ تَعْتَذِرُ إِلَى جَدِّهَا.",
                    "هُوَ تَعْتَذِرُ إِلَى جَدِّهِ.",
                    "هِيَ يَعْتَذِرُ إِلَى جَدِّهَا.",
                  ]}
                  answer={answer}
                  setAnswer={setAnswer}
                  onCheck={checkStageTwo}
                />
              )}

              {stage === 3 && (
                <ChoiceStage
                  icon="🧩"
                  title="رتّب الجملة"
                  question="أي ترتيب يعطي جملة صحيحة؟"
                  options={[
                    "أَعْتَذِرُ إِلَى جَدِّي عِنْدَمَا أُخْطِئُ.",
                    "جَدِّي أَعْتَذِرُ عِنْدَمَا إِلَى أُخْطِئُ.",
                    "عِنْدَمَا إِلَى أَعْتَذِرُ أُخْطِئُ جَدِّي.",
                  ]}
                  answer={answer}
                  setAnswer={setAnswer}
                  onCheck={checkStageThree}
                />
              )}

              {stage === 4 && (
                <>
                  <div
                    style={{
                      textAlign:
                        "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 52,
                      }}
                    >
                      💬
                    </div>

                    <h2
                      style={{
                        margin:
                          "8px 0",
                        color:
                          "#087d76",
                        fontSize: 28,
                      }}
                    >
                      اكتب اعتذارًا
                    </h2>

                    <p
                      style={{
                        maxWidth: 650,
                        margin:
                          "0 auto",
                        color:
                          "#667874",
                        lineHeight: 1.8,
                        fontWeight: 700,
                      }}
                    >
                      تخيل أنك أخطأت في حق جدك. اكتب جملة اعتذار قصيرة ومهذبة.
                    </p>
                  </div>

                  <textarea
                    value={apology}
                    onChange={(event) =>
                      setApology(
                        event.target.value
                      )
                    }
                    placeholder="مثال: عذرًا يا جدي، لن أكرر الخطأ."
                    style={{
                      width: "100%",
                      minHeight: 130,
                      boxSizing:
                        "border-box",
                      marginTop: 22,
                      padding:
                        "16px 18px",
                      borderRadius: 18,
                      border:
                        "2px solid #cfe8e5",
                      outline: "none",
                      resize: "vertical",
                      textAlign: "right",
                      fontSize: 18,
                      color:
                        "#173f32",
                      fontWeight: 800,
                      lineHeight: 1.9,
                    }}
                  />

                  <button
                    type="button"
                    disabled={
                      apology.trim().length < 6
                    }
                    onClick={
                      finishStation
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
                        apology.trim().length < 6
                          ? "#d3d5d4"
                          : "linear-gradient(135deg,#087d76,#079b90)",
                      color:
                        "#ffffff",
                      fontWeight: 900,
                      fontSize: 17,
                      cursor:
                        apology.trim().length < 6
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    🏆 إنهاء المحطة السادسة
                  </button>
                </>
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
                "#edfafa",
              border:
                "1px solid #d0e8e5",
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
                  "#087d76",
                fontWeight: 800,
                lineHeight: 1.8,
              }}
            >
              فارس يقول: الكتابة الجميلة لا تعني الخط فقط؛ اختر كلمات مهذبة، ورتّب فكرتك بوضوح.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function ChoiceStage({
  icon,
  title,
  question,
  options,
  answer,
  setAnswer,
  onCheck,
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
              "#087d76",
            fontSize: 28,
          }}
        >
          {title}
        </h2>

        <p
          style={{
            maxWidth: 680,
            margin: "0 auto",
            color:
              "#667874",
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
            "repeat(auto-fit,minmax(190px,1fr))",
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
                minHeight: 110,
                padding: 14,
                borderRadius: 19,
                border:
                  answer === option
                    ? "2px solid #13998f"
                    : "1px solid #d9e7e4",
                background:
                  answer === option
                    ? "#e8f8f6"
                    : "#ffffff",
                color:
                  "#173f32",
                fontWeight: 900,
                fontSize: 17,
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
              : "linear-gradient(135deg,#087d76,#079b90)",
          color:
            "#ffffff",
          fontWeight: 900,
          fontSize: 17,
          cursor:
            !answer
              ? "not-allowed"
              : "pointer",
        }}
      >
        تحقق من إجابتي
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
          fontSize: 75,
        }}
      >
        🎉
      </div>

      <h2
        style={{
          margin:
            "8px 0",
          color:
            "#087d76",
          fontSize:
            "clamp(28px,5vw,38px)",
        }}
      >
        أحسنت! أكملت المحطات الست
      </h2>

      <p
        style={{
          color:
            "#667874",
          lineHeight: 1.9,
          fontWeight: 700,
        }}
      >
        أتممت رحلة «عذرًا يا جدي» التعليمية، والآن أصبح التحدي الختامي متاحًا لك.
      </p>

      <div
        style={{
          maxWidth: 560,
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
        ✅ المحطة السادسة مكتملة
        <br />
        🚗 6 من 6
      </div>

      <Link
        href="/lessons/unit1/lesson2"
        style={{
          display: "block",
          maxWidth: 650,
          margin: "0 auto",
          padding:
            "15px 18px",
          borderRadius: 18,
          background:
            "linear-gradient(135deg,#d49716,#f0b52d)",
          color:
            "#ffffff",
          textDecoration:
            "none",
          fontWeight: 900,
          fontSize: 18,
        }}
      >
        🏆 العودة وفتح التحدي الختامي
      </Link>
    </div>
  );
}