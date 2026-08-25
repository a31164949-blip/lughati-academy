"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type BuildWord = {
  id: number;
  word: string;
  syllables: string[];
  icon: string;
  hint: string;
};

const WORDS: BuildWord[] = [
  {
    id: 1,
    word: "سُوقٌ",
    syllables: ["سُو", "قٌ"],
    icon: "🛍️",
    hint: "مكان نشتري منه",
  },
  {
    id: 2,
    word: "شَمْسٌ",
    syllables: ["شَمْ", "سٌ"],
    icon: "☀️",
    hint: "تضيء لنا النهار",
  },
  {
    id: 3,
    word: "قَلَمٌ",
    syllables: ["قَ", "لَ", "مٌ"],
    icon: "✏️",
    hint: "أداة نكتب بها",
  },
  {
    id: 4,
    word: "كِتَابٌ",
    syllables: ["كِ", "تَا", "بٌ"],
    icon: "📘",
    hint: "نقرأ فيه",
  },
  {
    id: 5,
    word: "كَاتِبٌ",
    syllables: ["كَا", "تِ", "بٌ"],
    icon: "📝",
    hint: "من يكتب",
  },
  {
    id: 6,
    word: "مَكْتَبٌ",
    syllables: ["مَكْ", "تَ", "بٌ"],
    icon: "🪑",
    hint: "نكتب ونعمل عليه",
  },
  {
    id: 7,
    word: "عُصْفُورٌ",
    syllables: ["عُصْ", "فُو", "رٌ"],
    icon: "🐦",
    hint: "طائر صغير",
  },
  {
    id: 8,
    word: "مَدْرَسَةٌ",
    syllables: ["مَدْ", "رَ", "سَ", "ةٌ"],
    icon: "🏫",
    hint: "مكان نتعلم فيه",
  },
];

function deterministicShuffle(
  items: string[],
  seed: number
) {
  const copy = [...items];

  for (
    let index = copy.length - 1;
    index > 0;
    index--
  ) {
    const swapIndex =
      (seed * 13 +
        index * 5 +
        3) %
      (index + 1);

    [
      copy[index],
      copy[swapIndex],
    ] = [
      copy[swapIndex],
      copy[index],
    ];
  }

  const alreadySolved =
    copy.every(
      (item, index) =>
        item === items[index]
    );

  if (
    alreadySolved &&
    copy.length > 1
  ) {
    [
      copy[0],
      copy[1],
    ] = [
      copy[1],
      copy[0],
    ];
  }

  return copy;
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

export default function WordBuildingPage() {
  const [
    wordIndex,
    setWordIndex,
  ] = useState(0);

  const current =
    WORDS[wordIndex];

  const [
    bank,
    setBank,
  ] = useState<string[]>(
    () =>
      deterministicShuffle(
        WORDS[0].syllables,
        WORDS[0].id
      )
  );

  const [
    answer,
    setAnswer,
  ] = useState<string[]>([]);

  const [
    message,
    setMessage,
  ] = useState(
    "استمع إلى الكلمة، ثم رتّب المقاطع لتكوينها."
  );

  const [
    speaking,
    setSpeaking,
  ] = useState(false);

  const [
    activeSyllable,
    setActiveSyllable,
  ] = useState<number | null>(
    null
  );

  const [
    correctCount,
    setCorrectCount,
  ] = useState(0);

  const [
    completed,
    setCompleted,
  ] = useState(false);

  const [
    showCelebration,
    setShowCelebration,
  ] = useState(false);

  const cancelledRef =
    useRef(false);

  const progress =
    Math.round(
      ((wordIndex +
        (completed ? 1 : 0)) /
        WORDS.length) *
        100
    );

  const answerText =
    useMemo(
      () => answer.join(""),
      [answer]
    );

  useEffect(() => {
    return () => {
      cancelledRef.current =
        true;

      if (
        typeof window !==
          "undefined" &&
        "speechSynthesis" in
          window
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function getArabicVoice() {
    if (
      typeof window ===
        "undefined" ||
      !(
        "speechSynthesis" in
        window
      )
    ) {
      return null;
    }

    const voices =
      window.speechSynthesis
        .getVoices();

    return (
      voices.find((voice) =>
        voice.lang
          .toLowerCase()
          .startsWith("ar-sa")
      ) ??
      voices.find((voice) =>
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
          !(
            "speechSynthesis" in
            window
          )
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
          utterance.voice =
            voice;
        }

        utterance.lang =
          voice?.lang ??
          "ar-SA";

        utterance.rate =
          rate;

        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend =
          () => resolve();

        utterance.onerror =
          () => resolve();

        window.speechSynthesis.speak(
          utterance
        );
      }
    );
  }

  async function speakWord() {
    if (speaking) {
      return;
    }

    cancelledRef.current =
      false;

    setSpeaking(true);
    setActiveSyllable(null);

    window.speechSynthesis.cancel();

    setMessage(
      "🎧 استمع إلى الكلمة كاملة."
    );

    await speakText(
      current.word,
      0.72
    );

    if (
      !cancelledRef.current
    ) {
      setSpeaking(false);
      setMessage(
        "الآن رتّب المقاطع لتكوين الكلمة."
      );
    }
  }

  async function speakSyllables() {
    if (speaking) {
      return;
    }

    cancelledRef.current =
      false;

    setSpeaking(true);

    window.speechSynthesis.cancel();

    setMessage(
      "🐢 استمع إلى المقاطع ببطء."
    );

    for (
      let index = 0;
      index <
      current.syllables.length;
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
        current.syllables[
          index
        ],
        0.56
      );

      await wait(320);
    }

    setActiveSyllable(null);

    if (
      !cancelledRef.current
    ) {
      await wait(170);

      await speakText(
        current.word,
        0.7
      );

      setSpeaking(false);

      setMessage(
        "✅ سمعت المقاطع ثم الكلمة كاملة."
      );
    }
  }

  async function speakOneSyllable(
    syllable: string
  ) {
    if (speaking) {
      return;
    }

    setSpeaking(true);

    window.speechSynthesis.cancel();

    await speakText(
      syllable,
      0.56
    );

    setSpeaking(false);
  }

  function addSyllable(
    syllable: string,
    index: number
  ) {
    if (
      speaking ||
      completed
    ) {
      return;
    }

    setAnswer(
      (currentAnswer) => [
        ...currentAnswer,
        syllable,
      ]
    );

    setBank(
      (currentBank) =>
        currentBank.filter(
          (_, itemIndex) =>
            itemIndex !==
            index
        )
    );

    setMessage(
      "✨ أحسنت، واصل ترتيب المقاطع."
    );
  }

  function removeSyllable(
    syllable: string,
    index: number
  ) {
    if (
      speaking ||
      completed
    ) {
      return;
    }

    setAnswer(
      (currentAnswer) =>
        currentAnswer.filter(
          (_, itemIndex) =>
            itemIndex !==
            index
        )
    );

    setBank(
      (currentBank) => [
        ...currentBank,
        syllable,
      ]
    );

    setMessage(
      "أعد ترتيب المقاطع ثم تحقق من الكلمة."
    );
  }

  async function checkAnswer() {
    if (
      answer.length !==
      current.syllables.length
    ) {
      setMessage(
        "🧩 أكمل جميع المقاطع أولًا."
      );
      return;
    }

    const correct =
      answer.every(
        (syllable, index) =>
          syllable ===
          current.syllables[
            index
          ]
      );

    if (!correct) {
      setMessage(
        "🌱 الترتيب غير صحيح بعد. استمع إلى المقاطع ببطء وحاول مرة أخرى."
      );

      await speakSyllables();
      return;
    }

    setCorrectCount(
      (count) =>
        count + 1
    );

    setCompleted(true);
    setShowCelebration(true);

    setMessage(
      "🏆 أحسنت! كوّنت الكلمة بطريقة صحيحة."
    );

    window.speechSynthesis.cancel();

    setSpeaking(true);

    for (
      let index = 0;
      index <
      current.syllables.length;
      index++
    ) {
      setActiveSyllable(
        index
      );

      await speakText(
        current.syllables[
          index
        ],
        0.58
      );

      await wait(260);
    }

    setActiveSyllable(null);

    await speakText(
      current.word,
      0.72
    );

    setSpeaking(false);
  }

  function nextWord() {
    window.speechSynthesis.cancel();

    if (
      wordIndex ===
      WORDS.length - 1
    ) {
      setShowCelebration(false);
      return;
    }

    const nextIndex =
      wordIndex + 1;

    const nextWord =
      WORDS[nextIndex];

    setWordIndex(
      nextIndex
    );

    setAnswer([]);

    setBank(
      deterministicShuffle(
        nextWord.syllables,
        nextWord.id
      )
    );

    setCompleted(false);
    setShowCelebration(false);
    setActiveSyllable(null);

    setMessage(
      "استمع إلى الكلمة، ثم رتّب المقاطع لتكوينها."
    );
  }

  function resetCurrentWord() {
    window.speechSynthesis.cancel();

    setAnswer([]);

    setBank(
      deterministicShuffle(
        current.syllables,
        current.id
      )
    );

    setCompleted(false);
    setShowCelebration(false);
    setActiveSyllable(null);

    setMessage(
      "أعد المحاولة ورتّب المقاطع من جديد."
    );
  }

  function restartAll() {
    window.speechSynthesis.cancel();

    setWordIndex(0);
    setAnswer([]);
    setBank(
      deterministicShuffle(
        WORDS[0].syllables,
        WORDS[0].id
      )
    );
    setCompleted(false);
    setShowCelebration(false);
    setCorrectCount(0);
    setActiveSyllable(null);
    setMessage(
      "استمع إلى الكلمة، ثم رتّب المقاطع لتكوينها."
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
            marginBottom:
              "14px",
          }}
        >
          <Link
            href="/foundation"
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: "7px",
              textDecoration:
                "none",
              background:
                "#ffffff",
              color:
                "#176d4c",
              border:
                "1px solid #d4e8dd",
              borderRadius:
                "15px",
              padding:
                "11px 17px",
              fontWeight:
                900,
            }}
          >
            ← العودة إلى أساس لغتي
          </Link>
        </div>

        <header
          style={{
            position:
              "relative",
            overflow:
              "hidden",
            borderRadius:
              "30px",
            padding:
              "27px",
            background:
              "linear-gradient(135deg,#7c3aed 0%,#4f46e5 52%,#2563eb 100%)",
            color:
              "#ffffff",
            boxShadow:
              "0 16px 38px rgba(79,70,229,.18)",
          }}
        >
          <div
            style={{
              position:
                "absolute",
              width:
                "230px",
              height:
                "230px",
              borderRadius:
                "50%",
              top:
                "-95px",
              left:
                "-60px",
              background:
                "rgba(255,255,255,.09)",
            }}
          />

          <div
            style={{
              position:
                "relative",
              zIndex: 2,
            }}
          >
            <span
              style={{
                display:
                  "inline-flex",
                padding:
                  "7px 12px",
                borderRadius:
                  "999px",
                background:
                  "rgba(255,255,255,.17)",
                fontWeight:
                  900,
                fontSize:
                  "13px",
              }}
            >
              🔤 المهارة 8
            </span>

            <h1
              style={{
                margin:
                  "10px 0 6px",
                fontSize:
                  "clamp(34px,5vw,50px)",
              }}
            >
              تركيب الكلمات
            </h1>

            <p
              style={{
                margin: 0,
                maxWidth:
                  "760px",
                lineHeight:
                  1.9,
                fontWeight:
                  700,
                opacity:
                  0.96,
              }}
            >
              استمع إلى الكلمة،
              ثم رتّب المقاطع
              الصوتية لتكوينها
              بصورة صحيحة.
            </p>
          </div>
        </header>

        <div
          style={{
            marginTop:
              "14px",
            height:
              "11px",
            borderRadius:
              "999px",
            overflow:
              "hidden",
            background:
              "#e5e7f4",
          }}
        >
          <div
            style={{
              width:
                `${Math.min(
                  100,
                  progress
                )}%`,
              height:
                "100%",
              background:
                "linear-gradient(90deg,#7c3aed,#4f46e5,#2563eb)",
              transition:
                "width .3s ease",
            }}
          />
        </div>

        <section
          style={{
            marginTop:
              "14px",
            padding:
              "13px 15px",
            borderRadius:
              "17px",
            background:
              "#ffffff",
            border:
              "1px solid #dedff0",
            textAlign:
              "center",
            color:
              "#52665d",
            fontWeight:
              900,
          }}
        >
          {message}
        </section>

        <section
          style={{
            marginTop:
              "18px",
            background:
              "#ffffff",
            borderRadius:
              "28px",
            border:
              "1px solid #dedff0",
            padding:
              "24px",
            boxShadow:
              "0 12px 30px rgba(79,70,229,.07)",
          }}
        >
          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "minmax(0,1fr) minmax(250px,.58fr)",
              gap: "18px",
            }}
            className="wordBuildLayout"
          >
            <div>
              <div
                style={{
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "72px",
                  }}
                >
                  {current.icon}
                </div>

                <div
                  style={{
                    marginTop:
                      "5px",
                    color:
                      "#718078",
                    fontWeight:
                      800,
                  }}
                >
                  كلمة{" "}
                  {wordIndex + 1} من{" "}
                  {WORDS.length}
                </div>

                <h2
                  style={{
                    margin:
                      "7px 0 3px",
                    fontSize:
                      "clamp(40px,7vw,58px)",
                    color:
                      "#3730a3",
                    lineHeight:
                      1.5,
                  }}
                >
                  {current.word}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color:
                      "#718078",
                    fontWeight:
                      700,
                  }}
                >
                  {current.hint}
                </p>
              </div>

              <div
                style={{
                  marginTop:
                    "20px",
                  display:
                    "flex",
                  justifyContent:
                    "center",
                  gap: "10px",
                  flexWrap:
                    "wrap",
                }}
              >
                <button
                  type="button"
                  disabled={
                    speaking
                  }
                  onClick={() =>
                    void speakWord()
                  }
                  style={primaryButton}
                >
                  🔊 استمع إلى الكلمة
                </button>

                <button
                  type="button"
                  disabled={
                    speaking
                  }
                  onClick={() =>
                    void speakSyllables()
                  }
                  style={slowButton}
                >
                  🐢 استمع إلى المقاطع ببطء
                </button>
              </div>

              <div
                style={{
                  marginTop:
                    "24px",
                }}
              >
                <h3
                  style={{
                    margin:
                      "0 0 10px",
                    textAlign:
                      "center",
                    color:
                      "#4f46e5",
                  }}
                >
                  🧩 كوّن الكلمة هنا
                </h3>

                <div
                  style={{
                    minHeight:
                      "94px",
                    border:
                      "2px dashed #b8b5eb",
                    borderRadius:
                      "20px",
                    background:
                      "#f8f7ff",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    gap: "9px",
                    flexWrap:
                      "wrap",
                    padding:
                      "13px",
                  }}
                >
                  {answer.length ===
                  0 ? (
                    <span
                      style={{
                        color:
                          "#9aa1a7",
                        fontWeight:
                          800,
                      }}
                    >
                      اضغط على المقاطع بالترتيب الصحيح
                    </span>
                  ) : (
                    answer.map(
                      (
                        syllable,
                        index
                      ) => (
                        <button
                          key={`${syllable}-${index}`}
                          type="button"
                          onClick={() =>
                            removeSyllable(
                              syllable,
                              index
                            )
                          }
                          style={{
                            minWidth:
                              "72px",
                            padding:
                              "12px 14px",
                            border:
                              activeSyllable ===
                              index
                                ? "3px solid #f59e0b"
                                : "2px solid #a8a4e3",
                            borderRadius:
                              "15px",
                            background:
                              activeSyllable ===
                              index
                                ? "#fff7d6"
                                : "#ffffff",
                            color:
                              "#3730a3",
                            fontSize:
                              "28px",
                            fontWeight:
                              900,
                            cursor:
                              "pointer",
                          }}
                        >
                          {syllable}
                        </button>
                      )
                    )
                  )}
                </div>

                <div
                  style={{
                    marginTop:
                      "8px",
                    minHeight:
                      "28px",
                    textAlign:
                      "center",
                    color:
                      "#3730a3",
                    fontSize:
                      "22px",
                    fontWeight:
                      900,
                  }}
                >
                  {answerText}
                </div>
              </div>

              <div
                style={{
                  marginTop:
                    "18px",
                }}
              >
                <h3
                  style={{
                    margin:
                      "0 0 10px",
                    textAlign:
                      "center",
                    color:
                      "#176d4c",
                  }}
                >
                  🔤 المقاطع المبعثرة
                </h3>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "center",
                    gap: "10px",
                    flexWrap:
                      "wrap",
                  }}
                >
                  {bank.map(
                    (
                      syllable,
                      index
                    ) => (
                      <div
                        key={`${syllable}-${index}`}
                        style={{
                          display:
                            "grid",
                          gap: "6px",
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            speaking
                          }
                          onClick={() =>
                            addSyllable(
                              syllable,
                              index
                            )
                          }
                          style={{
                            minWidth:
                              "84px",
                            minHeight:
                              "68px",
                            border:
                              "2px solid #cfe3d7",
                            borderRadius:
                              "18px",
                            background:
                              "#f2fbf6",
                            color:
                              "#176d4c",
                            fontSize:
                              "28px",
                            fontWeight:
                              900,
                            cursor:
                              speaking
                                ? "default"
                                : "pointer",
                            boxShadow:
                              "0 7px 16px rgba(30,90,60,.06)",
                          }}
                        >
                          {syllable}
                        </button>

                        <button
                          type="button"
                          disabled={
                            speaking
                          }
                          onClick={() =>
                            void speakOneSyllable(
                              syllable
                            )
                          }
                          aria-label={`استمع إلى ${syllable}`}
                          style={{
                            border:
                              "none",
                            background:
                              "transparent",
                            color:
                              "#64748b",
                            cursor:
                              speaking
                                ? "default"
                                : "pointer",
                            fontWeight:
                              800,
                          }}
                        >
                          🔊 اسمعني
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop:
                    "21px",
                  display:
                    "flex",
                  justifyContent:
                    "center",
                  gap: "10px",
                  flexWrap:
                    "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    void checkAnswer()
                  }
                  disabled={
                    speaking ||
                    completed
                  }
                  style={{
                    border:
                      "none",
                    borderRadius:
                      "15px",
                    padding:
                      "13px 22px",
                    background:
                      completed
                        ? "#86efac"
                        : "#4f46e5",
                    color:
                      "#ffffff",
                    fontWeight:
                      900,
                    fontSize:
                      "15px",
                    cursor:
                      completed
                        ? "default"
                        : "pointer",
                  }}
                >
                  ✅ تحقق من الكلمة
                </button>

                <button
                  type="button"
                  onClick={
                    resetCurrentWord
                  }
                  style={slowButton}
                >
                  🔄 أعد الترتيب
                </button>
              </div>
            </div>

            <aside
              style={{
                display:
                  "grid",
                gap: "12px",
                alignContent:
                  "start",
              }}
            >
              <InfoCard
                icon="👂"
                title="1. استمع"
                text="اسمع الكلمة كاملة بنطق واضح."
              />

              <InfoCard
                icon="🧩"
                title="2. رتّب"
                text="اضغط على المقاطع بالترتيب الصحيح."
              />

              <InfoCard
                icon="🗣️"
                title="3. اقرأ"
                text="بعد النجاح استمع للمقاطع ثم الكلمة كاملة."
              />

              <div
                style={{
                  background:
                    "#f7fbf9",
                  border:
                    "1px solid #dce9e2",
                  borderRadius:
                    "18px",
                  padding:
                    "15px",
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "30px",
                  }}
                >
                  ⭐
                </div>

                <strong
                  style={{
                    display:
                      "block",
                    marginTop:
                      "4px",
                    color:
                      "#176d4c",
                  }}
                >
                  كلمات أتقنتها
                </strong>

                <div
                  style={{
                    marginTop:
                      "6px",
                    color:
                      "#3730a3",
                    fontSize:
                      "24px",
                    fontWeight:
                      900,
                  }}
                >
                  {correctCount} /{" "}
                  {WORDS.length}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>

      {showCelebration && (
        <div
          style={{
            position:
              "fixed",
            inset: 0,
            zIndex: 999,
            display:
              "grid",
            placeItems:
              "center",
            padding:
              "18px",
            background:
              "rgba(15,23,42,.55)",
            backdropFilter:
              "blur(7px)",
          }}
        >
          <section
            dir="rtl"
            style={{
              position:
                "relative",
              width:
                "min(500px,100%)",
              borderRadius:
                "30px",
              background:
                "linear-gradient(180deg,#ffffff,#f2fff7)",
              padding:
                "34px 24px 26px",
              textAlign:
                "center",
              boxShadow:
                "0 28px 75px rgba(15,23,42,.27)",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setShowCelebration(
                  false
                )
              }
              aria-label="إغلاق"
              style={{
                position:
                  "absolute",
                top: "14px",
                left: "14px",
                width:
                  "42px",
                height:
                  "42px",
                display:
                  "grid",
                placeItems:
                  "center",
                border:
                  "1px solid #d8e7df",
                borderRadius:
                  "50%",
                background:
                  "#ffffff",
                color:
                  "#49675a",
                fontSize:
                  "21px",
                fontWeight:
                  900,
                cursor:
                  "pointer",
              }}
            >
              ✕
            </button>

            <div
              style={{
                fontSize:
                  "72px",
              }}
            >
              🏆🔤
            </div>

            <h2
              style={{
                margin:
                  "8px 0 6px",
                color:
                  "#166534",
                fontSize:
                  "31px",
              }}
            >
              أحسنت يا بطل!
            </h2>

            <p
              style={{
                margin: 0,
                color:
                  "#64748b",
                fontWeight:
                  700,
                lineHeight:
                  1.8,
              }}
            >
              كوّنت كلمة{" "}
              <strong>
                {current.word}
              </strong>{" "}
              بطريقة صحيحة.
            </p>

            <div
              style={{
                margin:
                  "18px auto",
                maxWidth:
                  "300px",
                padding:
                  "15px",
                borderRadius:
                  "18px",
                background:
                  "#ffffff",
                border:
                  "1px solid #d7e8df",
              }}
            >
              <span
                style={{
                  display:
                    "block",
                  color:
                    "#718078",
                  fontSize:
                    "12px",
                  fontWeight:
                    800,
                }}
              >
                المقاطع الصحيحة
              </span>

              <strong
                style={{
                  display:
                    "block",
                  marginTop:
                    "7px",
                  color:
                    "#3730a3",
                  fontSize:
                    "24px",
                }}
              >
                {current.syllables.join(
                  " — "
                )}
              </strong>
            </div>

            {wordIndex <
            WORDS.length - 1 ? (
              <button
                type="button"
                onClick={
                  nextWord
                }
                style={primaryButton}
              >
                الكلمة التالية ←
              </button>
            ) : (
              <div
                style={{
                  display:
                    "grid",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    padding:
                      "11px",
                    borderRadius:
                      "15px",
                    background:
                      "#fff7d6",
                    color:
                      "#8a5a00",
                    fontWeight:
                      900,
                  }}
                >
                  🎉 أنهيت مراجعة تركيب الكلمات!
                </div>

                <button
                  type="button"
                  onClick={
                    restartAll
                  }
                  style={primaryButton}
                >
                  🔄 أعد المراجعة
                </button>

                <Link
                  href="/foundation"
                  style={{
                    textDecoration:
                      "none",
                    borderRadius:
                      "15px",
                    padding:
                      "12px 18px",
                    background:
                      "#176d4c",
                    color:
                      "#ffffff",
                    fontWeight:
                      900,
                  }}
                >
                  العودة إلى أساس لغتي ←
                </Link>
              </div>
            )}
          </section>
        </div>
      )}

      <style>{`
        @media (max-width: 760px) {
          .wordBuildLayout {
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
        background:
          "#f7fbf9",
        border:
          "1px solid #dce9e2",
        borderRadius:
          "18px",
        padding:
          "15px",
      }}
    >
      <div
        style={{
          fontSize:
            "27px",
        }}
      >
        {icon}
      </div>

      <strong
        style={{
          display:
            "block",
          marginTop:
            "5px",
          color:
            "#176d4c",
        }}
      >
        {title}
      </strong>

      <p
        style={{
          margin:
            "5px 0 0",
          color:
            "#718078",
          lineHeight:
            1.7,
          fontSize:
            "13px",
          fontWeight:
            700,
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
    borderRadius:
      "15px",
    padding:
      "12px 17px",
    background:
      "#4f46e5",
    color:
      "#ffffff",
    fontWeight:
      900,
    cursor:
      "pointer",
  };

const slowButton:
  React.CSSProperties = {
    border:
      "1px solid #d4e6dc",
    borderRadius:
      "15px",
    padding:
      "12px 17px",
    background:
      "#ffffff",
    color:
      "#176d4c",
    fontWeight:
      900,
    cursor:
      "pointer",
  };
