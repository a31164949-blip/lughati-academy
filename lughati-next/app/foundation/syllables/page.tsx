"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type PracticeWord = {
  id: number;
  word: string;
  syllables: string[];
  meaning: string;
  icon: string;
};

type Question = {
  id: number;
  word: string;
  correct: string[];
  choices: string[][];
};

const WORDS: PracticeWord[] = [
  {
    id: 1,
    word: "قَلَمٌ",
    syllables: ["قَ", "لَ", "مٌ"],
    meaning: "أداة نكتب بها",
    icon: "✏️",
  },
  {
    id: 2,
    word: "كِتَابٌ",
    syllables: ["كِ", "تَا", "بٌ"],
    meaning: "نقرأ فيه",
    icon: "📘",
  },
  {
    id: 3,
    word: "مَكْتَبٌ",
    syllables: ["مَكْ", "تَ", "بٌ"],
    meaning: "نكتب ونعمل عليه",
    icon: "🪑",
  },
  {
    id: 4,
    word: "سُوقٌ",
    syllables: ["سُو", "قٌ"],
    meaning: "مكان نشتري منه",
    icon: "🛍️",
  },
  {
    id: 5,
    word: "شَمْسٌ",
    syllables: ["شَمْ", "سٌ"],
    meaning: "تضيء لنا النهار",
    icon: "☀️",
  },
  {
    id: 6,
    word: "مَدْرَسَةٌ",
    syllables: ["مَدْ", "رَ", "سَ", "ةٌ"],
    meaning: "مكان نتعلم فيه",
    icon: "🏫",
  },
  {
    id: 7,
    word: "كَاتِبٌ",
    syllables: ["كَا", "تِ", "بٌ"],
    meaning: "من يكتب",
    icon: "📝",
  },
  {
    id: 8,
    word: "عُصْفُورٌ",
    syllables: ["عُصْ", "فُو", "رٌ"],
    meaning: "طائر صغير",
    icon: "🐦",
  },
];

const QUESTIONS: Question[] = [
  {
    id: 1,
    word: "مَكْتَبٌ",
    correct: ["مَكْ", "تَ", "بٌ"],
    choices: [
      ["مَ", "كْ", "تَ", "بٌ"],
      ["مَكْ", "تَ", "بٌ"],
      ["مَكْتَ", "بٌ"],
    ],
  },
  {
    id: 2,
    word: "كِتَابٌ",
    correct: ["كِ", "تَا", "بٌ"],
    choices: [
      ["كِ", "تَا", "بٌ"],
      ["كِتْ", "ا", "بٌ"],
      ["كِتَا", "بٌ"],
    ],
  },
  {
    id: 3,
    word: "شَمْسٌ",
    correct: ["شَمْ", "سٌ"],
    choices: [
      ["شَ", "مْ", "سٌ"],
      ["شَمْسٌ"],
      ["شَمْ", "سٌ"],
    ],
  },
];

function normalize(
  syllables: string[]
) {
  return syllables.join("|");
}

function wait(
  milliseconds: number
) {
  return new Promise<void>(
    (resolve) =>
      window.setTimeout(
        resolve,
        milliseconds
      )
  );
}

export default function SyllablesPage() {
  const [
    wordIndex,
    setWordIndex,
  ] = useState(0);

  const [
    activeSyllable,
    setActiveSyllable,
  ] = useState<number | null>(null);

  const [
    speaking,
    setSpeaking,
  ] = useState(false);

  const [
    mode,
    setMode,
  ] = useState<
    "learn" | "practice" | "done"
  >("learn");

  const [
    questionIndex,
    setQuestionIndex,
  ] = useState(0);

  const [
    selectedChoice,
    setSelectedChoice,
  ] = useState<number | null>(
    null
  );

  const [
    score,
    setScore,
  ] = useState(0);

  const [
    message,
    setMessage,
  ] = useState(
    "استمع إلى الكلمة، ثم استمع إلى مقاطعها ببطء."
  );

  const cancelledRef =
    useRef(false);

  const currentWord =
    WORDS[wordIndex];

  const currentQuestion =
    QUESTIONS[questionIndex];

  const progress =
    mode === "learn"
      ? Math.round(
          ((wordIndex + 1) /
            WORDS.length) *
            70
        )
      : mode === "practice"
      ? 70 +
        Math.round(
          ((questionIndex + 1) /
            QUESTIONS.length) *
            30
        )
      : 100;

  const voices =
    useMemo(() => {
      if (
        typeof window ===
          "undefined" ||
        !("speechSynthesis" in window)
      ) {
        return [];
      }

      return window.speechSynthesis
        .getVoices();
    }, []);

  useEffect(() => {
    if (
      typeof window ===
        "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    const refresh = () => {
      window.speechSynthesis
        .getVoices();
    };

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      refresh
    );

    return () => {
      cancelledRef.current = true;

      window.speechSynthesis.cancel();

      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        refresh
      );
    };
  }, []);

  function getArabicVoice() {
    const available =
      window.speechSynthesis
        .getVoices();

    return (
      available.find((voice) =>
        voice.lang
          .toLowerCase()
          .startsWith("ar-sa")
      ) ??
      available.find((voice) =>
        voice.lang
          .toLowerCase()
          .startsWith("ar")
      ) ??
      null
    );
  }

  function speakText(
    text: string,
    rate = 0.68
  ) {
    return new Promise<void>(
      (resolve) => {
        if (
          typeof window ===
            "undefined" ||
          !("speechSynthesis" in window)
        ) {
          resolve();
          return;
        }

        const utterance =
          new SpeechSynthesisUtterance(
            text
          );

        const voice =
          getArabicVoice();

        if (voice) {
          utterance.voice = voice;
        }

        utterance.lang =
          voice?.lang ?? "ar-SA";

        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () =>
          resolve();

        utterance.onerror = () =>
          resolve();

        window.speechSynthesis.speak(
          utterance
        );
      }
    );
  }

  async function speakWholeWord() {
    if (speaking) {
      return;
    }

    cancelledRef.current = false;
    setSpeaking(true);
    setActiveSyllable(null);
    setMessage(
      "🎧 استمع إلى الكلمة كاملة."
    );

    window.speechSynthesis.cancel();

    await speakText(
      currentWord.word,
      0.72
    );

    if (
      !cancelledRef.current
    ) {
      setSpeaking(false);
      setMessage(
        "الآن استمع إلى المقاطع ببطء."
      );
    }
  }

  async function speakSyllables() {
    if (speaking) {
      return;
    }

    cancelledRef.current = false;
    setSpeaking(true);

    window.speechSynthesis.cancel();

    setMessage(
      "🐢 انتبه: كل مقطع سيضيء وقت نطقه."
    );

    for (
      let index = 0;
      index <
      currentWord.syllables.length;
      index++
    ) {
      if (
        cancelledRef.current
      ) {
        break;
      }

      setActiveSyllable(
        index
      );

      await speakText(
        currentWord.syllables[
          index
        ],
        0.58
      );

      await wait(330);
    }

    setActiveSyllable(null);

    if (
      !cancelledRef.current
    ) {
      await wait(180);

      await speakText(
        currentWord.word,
        0.7
      );

      setMessage(
        "✅ أحسنت! سمعت المقاطع ثم الكلمة كاملة."
      );

      setSpeaking(false);
    }
  }

  async function speakOneSyllable(
    syllable: string,
    index: number
  ) {
    if (speaking) {
      return;
    }

    setSpeaking(true);
    setActiveSyllable(index);

    window.speechSynthesis.cancel();

    await speakText(
      syllable,
      0.56
    );

    setActiveSyllable(null);
    setSpeaking(false);
  }

  function goNextWord() {
    window.speechSynthesis.cancel();
    setActiveSyllable(null);

    if (
      wordIndex <
      WORDS.length - 1
    ) {
      setWordIndex(
        (current) =>
          current + 1
      );

      setMessage(
        "استمع إلى الكلمة الجديدة، ثم حلّلها إلى مقاطع."
      );

      return;
    }

    setMode("practice");
    setMessage(
      "🎯 حان وقت التدريب: اختر التحليل الصحيح للكلمة."
    );
  }

  function chooseAnswer(
    choiceIndex: number
  ) {
    if (
      selectedChoice !==
      null
    ) {
      return;
    }

    setSelectedChoice(
      choiceIndex
    );

    const selected =
      currentQuestion.choices[
        choiceIndex
      ];

    const correct =
      normalize(selected) ===
      normalize(
        currentQuestion.correct
      );

    if (correct) {
      setScore(
        (current) =>
          current + 1
      );

      setMessage(
        "✅ إجابة صحيحة! أحسنت في تحليل الكلمة."
      );
    } else {
      setMessage(
        `🌱 حاول أن تستمع جيدًا. التحليل الصحيح: ${currentQuestion.correct.join(
          " — "
        )}`
      );
    }
  }

  function nextQuestion() {
    if (
      selectedChoice ===
      null
    ) {
      return;
    }

    if (
      questionIndex <
      QUESTIONS.length - 1
    ) {
      setQuestionIndex(
        (current) =>
          current + 1
      );

      setSelectedChoice(
        null
      );

      setMessage(
        "🎧 اقرأ الكلمة ببطء ثم اختر مقاطعها الصحيحة."
      );

      return;
    }

    setMode("done");
  }

  function restart() {
    window.speechSynthesis.cancel();
    setWordIndex(0);
    setActiveSyllable(null);
    setSpeaking(false);
    setMode("learn");
    setQuestionIndex(0);
    setSelectedChoice(null);
    setScore(0);
    setMessage(
      "استمع إلى الكلمة، ثم استمع إلى مقاطعها ببطء."
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f3fbf7 0%,#f8fbff 55%,#fffaf0 100%)",
        padding:
          "24px 14px 60px",
        fontFamily:
          "Arial, sans-serif",
        color: "#174c3b",
      }}
    >
      <div
        style={{
          maxWidth: "1040px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "14px",
          }}
        >
          <Link
            href="/foundation"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              textDecoration: "none",
              background: "#ffffff",
              color: "#176d4c",
              border:
                "1px solid #d4e8dd",
              borderRadius: "15px",
              padding: "11px 17px",
              fontWeight: 900,
            }}
          >
            ← العودة إلى أساس لغتي
          </Link>
        </div>

        <header
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "30px",
            padding: "27px",
            background:
              "linear-gradient(135deg,#0f766e 0%,#0d9488 52%,#22c55e 100%)",
            color: "#ffffff",
            boxShadow:
              "0 16px 38px rgba(15,118,110,.18)",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "230px",
              height: "230px",
              borderRadius: "50%",
              top: "-95px",
              left: "-60px",
              background:
                "rgba(255,255,255,.09)",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                padding: "7px 12px",
                borderRadius: "999px",
                background:
                  "rgba(255,255,255,.17)",
                fontWeight: 900,
                fontSize: "13px",
              }}
            >
              🧩 المهارة 7
            </span>

            <h1
              style={{
                margin: "10px 0 6px",
                fontSize:
                  "clamp(34px,5vw,50px)",
              }}
            >
              تحليل المقاطع
            </h1>

            <p
              style={{
                margin: 0,
                maxWidth: "760px",
                lineHeight: 1.9,
                fontWeight: 700,
                opacity: 0.96,
              }}
            >
              استمع إلى الكلمة بوضوح، ثم
              قسّمها إلى مقاطع صوتية قصيرة.
              اضغط على كل مقطع لسماعه منفردًا.
            </p>
          </div>
        </header>

        <div
          style={{
            marginTop: "14px",
            height: "11px",
            borderRadius: "999px",
            overflow: "hidden",
            background: "#e1ece7",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background:
                "linear-gradient(90deg,#0f766e,#22c55e)",
              transition:
                "width .3s ease",
            }}
          />
        </div>

        <section
          style={{
            marginTop: "14px",
            padding: "13px 15px",
            borderRadius: "17px",
            background: "#ffffff",
            border:
              "1px solid #dce9e2",
            textAlign: "center",
            color: "#52665d",
            fontWeight: 900,
          }}
        >
          {message}
        </section>

        {mode === "learn" && (
          <section
            style={{
              marginTop: "18px",
              background: "#ffffff",
              borderRadius: "28px",
              border:
                "1px solid #dce9e2",
              padding: "24px",
              boxShadow:
                "0 12px 30px rgba(30,80,55,.07)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0,1fr) minmax(250px,.6fr)",
                gap: "18px",
              }}
              className="syllablesLayout"
            >
              <div>
                <div
                  style={{
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "70px",
                    }}
                  >
                    {currentWord.icon}
                  </div>

                  <div
                    style={{
                      marginTop: "6px",
                      color: "#718078",
                      fontWeight: 800,
                    }}
                  >
                    كلمة رقم {wordIndex + 1} من{" "}
                    {WORDS.length}
                  </div>

                  <h2
                    style={{
                      margin: "8px 0 3px",
                      fontSize:
                        "clamp(38px,7vw,58px)",
                      color: "#174c3b",
                      lineHeight: 1.5,
                    }}
                  >
                    {currentWord.word}
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color: "#718078",
                      fontWeight: 700,
                    }}
                  >
                    {currentWord.meaning}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: "22px",
                    display: "flex",
                    justifyContent: "center",
                    gap: "11px",
                    flexWrap: "wrap",
                  }}
                >
                  {currentWord.syllables.map(
                    (syllable, index) => {
                      const active =
                        activeSyllable ===
                        index;

                      return (
                        <button
                          key={`${syllable}-${index}`}
                          type="button"
                          disabled={speaking}
                          onClick={() =>
                            void speakOneSyllable(
                              syllable,
                              index
                            )
                          }
                          style={{
                            minWidth: "88px",
                            minHeight: "76px",
                            border: active
                              ? "3px solid #f59e0b"
                              : "2px solid #bfe3d1",
                            borderRadius: "20px",
                            background: active
                              ? "#fff7d6"
                              : "#f2fbf6",
                            color: "#176d4c",
                            fontSize: "30px",
                            fontWeight: 900,
                            cursor: speaking
                              ? "default"
                              : "pointer",
                            boxShadow: active
                              ? "0 10px 22px rgba(245,158,11,.18)"
                              : "0 7px 18px rgba(30,90,60,.06)",
                            transform: active
                              ? "scale(1.06)"
                              : "none",
                            transition:
                              "all .18s ease",
                          }}
                        >
                          {syllable}
                        </button>
                      );
                    }
                  )}
                </div>

                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    justifyContent: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    disabled={speaking}
                    onClick={() =>
                      void speakWholeWord()
                    }
                    style={primaryButton}
                  >
                    🔊 استمع إلى الكلمة
                  </button>

                  <button
                    type="button"
                    disabled={speaking}
                    onClick={() =>
                      void speakSyllables()
                    }
                    style={slowButton}
                  >
                    🐢 استمع إلى المقاطع ببطء
                  </button>
                </div>
              </div>

              <aside
                style={{
                  display: "grid",
                  gap: "12px",
                  alignContent: "start",
                }}
              >
                <InfoCard
                  icon="👂"
                  title="استمع"
                  text="اسمع الكلمة كاملة أولًا."
                />

                <InfoCard
                  icon="🧩"
                  title="حلّل"
                  text="استمع إلى كل مقطع منفصلًا."
                />

                <InfoCard
                  icon="🗣️"
                  title="ردّد"
                  text="ردّد المقاطع، ثم انطق الكلمة كاملة."
                />
              </aside>
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                onClick={goNextWord}
                disabled={speaking}
                style={{
                  border: "none",
                  borderRadius: "15px",
                  padding: "13px 22px",
                  background: "#176d4c",
                  color: "#ffffff",
                  fontWeight: 900,
                  fontSize: "15px",
                  cursor: speaking
                    ? "default"
                    : "pointer",
                  opacity: speaking
                    ? 0.6
                    : 1,
                }}
              >
                {wordIndex ===
                WORDS.length - 1
                  ? "🎯 ابدأ التدريب"
                  : "الكلمة التالية ←"}
              </button>
            </div>
          </section>
        )}

        {mode === "practice" && (
          <section
            style={{
              marginTop: "18px",
              background: "#ffffff",
              borderRadius: "28px",
              border:
                "1px solid #dce9e2",
              padding: "24px",
              boxShadow:
                "0 12px 30px rgba(30,80,55,.07)",
            }}
          >
            <div
              style={{
                textAlign: "center",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  padding: "7px 11px",
                  borderRadius: "999px",
                  background: "#ecfdf5",
                  color: "#166534",
                  fontWeight: 900,
                }}
              >
                🎯 التدريب
              </span>

              <p
                style={{
                  margin: "11px 0 2px",
                  color: "#718078",
                  fontWeight: 800,
                }}
              >
                السؤال {questionIndex + 1} من{" "}
                {QUESTIONS.length}
              </p>

              <h2
                style={{
                  margin: "4px 0 10px",
                  fontSize:
                    "clamp(40px,7vw,58px)",
                  color: "#174c3b",
                }}
              >
                {currentQuestion.word}
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontWeight: 700,
                }}
              >
                اختر التحليل الصحيح للكلمة.
              </p>
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "grid",
                gap: "11px",
              }}
            >
              {currentQuestion.choices.map(
                (choice, index) => {
                  const chosen =
                    selectedChoice ===
                    index;

                  const correct =
                    normalize(choice) ===
                    normalize(
                      currentQuestion.correct
                    );

                  const showCorrect =
                    selectedChoice !== null &&
                    correct;

                  const showWrong =
                    chosen &&
                    !correct;

                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={
                        selectedChoice !== null
                      }
                      onClick={() =>
                        chooseAnswer(index)
                      }
                      style={{
                        border: showCorrect
                          ? "2px solid #22c55e"
                          : showWrong
                          ? "2px solid #ef4444"
                          : "1px solid #dce8e1",
                        borderRadius: "18px",
                        background: showCorrect
                          ? "#ecfdf5"
                          : showWrong
                          ? "#fef2f2"
                          : "#ffffff",
                        padding: "15px",
                        cursor:
                          selectedChoice === null
                            ? "pointer"
                            : "default",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        {choice.map(
                          (
                            syllable,
                            syllableIndex
                          ) => (
                            <span
                              key={
                                syllableIndex
                              }
                              style={{
                                minWidth: "66px",
                                padding:
                                  "8px 12px",
                                borderRadius:
                                  "13px",
                                background:
                                  "#f3f8f5",
                                color:
                                  "#176d4c",
                                fontSize:
                                  "25px",
                                fontWeight:
                                  900,
                              }}
                            >
                              {syllable}
                            </span>
                          )
                        )}
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            <div
              style={{
                marginTop: "18px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                onClick={nextQuestion}
                disabled={
                  selectedChoice === null
                }
                style={{
                  border: "none",
                  borderRadius: "15px",
                  padding: "13px 22px",
                  background:
                    selectedChoice === null
                      ? "#cbd5e1"
                      : "#176d4c",
                  color: "#ffffff",
                  fontWeight: 900,
                  cursor:
                    selectedChoice === null
                      ? "default"
                      : "pointer",
                }}
              >
                {questionIndex ===
                QUESTIONS.length - 1
                  ? "🏆 عرض النتيجة"
                  : "السؤال التالي ←"}
              </button>
            </div>
          </section>
        )}

        {mode === "done" && (
          <section
            style={{
              marginTop: "18px",
              background:
                "linear-gradient(180deg,#ffffff,#effcf5)",
              border:
                "1px solid #cfe8da",
              borderRadius: "30px",
              padding: "36px 24px",
              textAlign: "center",
              boxShadow:
                "0 16px 38px rgba(30,90,60,.10)",
            }}
          >
            <div
              style={{
                fontSize: "74px",
              }}
            >
              🏆
            </div>

            <h2
              style={{
                margin: "8px 0 6px",
                color: "#166534",
                fontSize: "32px",
              }}
            >
              أحسنت يا بطل!
            </h2>

            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              أنهيت مراجعة تحليل المقاطع.
            </p>

            <div
              style={{
                margin:
                  "20px auto 0",
                maxWidth: "290px",
                padding: "17px",
                borderRadius: "19px",
                background: "#ffffff",
                border:
                  "1px solid #d8e8df",
              }}
            >
              <span
                style={{
                  display: "block",
                  color: "#718078",
                  fontSize: "12px",
                  fontWeight: 800,
                }}
              >
                نتيجة الإتقان
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "6px",
                  color: "#166534",
                  fontSize: "29px",
                }}
              >
                {score} / {QUESTIONS.length}
              </strong>
            </div>

            <div
              style={{
                marginTop: "19px",
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={restart}
                style={slowButton}
              >
                🔄 أعد التدريب
              </button>

              <Link
                href="/foundation"
                style={{
                  textDecoration: "none",
                  borderRadius: "15px",
                  padding: "12px 18px",
                  background: "#176d4c",
                  color: "#ffffff",
                  fontWeight: 900,
                }}
              >
                العودة إلى أساس لغتي ←
              </Link>
            </div>
          </section>
        )}
      </div>

      <style>{`
        @media (max-width: 760px) {
          .syllablesLayout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        background: "#f7fbf9",
        border:
          "1px solid #dce9e2",
        borderRadius: "18px",
        padding: "15px",
      }}
    >
      <div
        style={{
          fontSize: "27px",
        }}
      >
        {icon}
      </div>

      <strong
        style={{
          display: "block",
          marginTop: "5px",
          color: "#176d4c",
        }}
      >
        {title}
      </strong>

      <p
        style={{
          margin: "5px 0 0",
          color: "#718078",
          lineHeight: 1.7,
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        {text}
      </p>
    </div>
  );
}

const primaryButton:
  React.CSSProperties = {
    border: "none",
    borderRadius: "15px",
    padding: "12px 17px",
    background: "#0f766e",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  };

const slowButton:
  React.CSSProperties = {
    border:
      "1px solid #d4e6dc",
    borderRadius: "15px",
    padding: "12px 17px",
    background: "#ffffff",
    color: "#176d4c",
    fontWeight: 900,
    cursor: "pointer",
  };
