"use client";

import Link from "next/link";
import { useState } from "react";

type Challenge = {
  id: number;
  icon: string;
  station: string;
  question: string;
  choices: string[];
  answer: string;
  points: number;
};

const challenges: Challenge[] = [
  {
    id: 1,
    icon: "📖",
    station: "بوابة القراءة",
    question: "بِمَ أَمَرَنَا الرَّسُولُ ﷺ فِي الْحَدِيثِ؟",
    choices: [
      "بِصِلَةِ الرَّحِمِ",
      "بِالسَّفَرِ",
      "بِاللَّعِبِ",
      "بِالنَّوْمِ",
    ],
    answer: "بِصِلَةِ الرَّحِمِ",
    points: 10,
  },
  {
    id: 2,
    icon: "🧠",
    station: "بوابة الفهم",
    question: "مَا مَعْنَى صِلَةِ الرَّحِمِ؟",
    choices: [
      "زِيَارَةُ الْأَقَارِبِ وَالسُّؤَالُ عَنْهُمْ",
      "الِابْتِعَادُ عَنِ الْأَقَارِبِ",
      "اللَّعِبُ مَعَ الْأَصْدِقَاءِ",
      "السَّفَرُ فِي الْإِجَازَةِ",
    ],
    answer: "زِيَارَةُ الْأَقَارِبِ وَالسُّؤَالُ عَنْهُمْ",
    points: 10,
  },
  {
    id: 3,
    icon: "💎",
    station: "بوابة الكلمات",
    question: "مَا مَعْنَى كَلِمَةِ «تَفَقُّد»؟",
    choices: [
      "السُّؤَالُ عَنِ الْأَحْوَالِ وَالِاطْمِئْنَانُ",
      "النَّوْمُ",
      "اللَّعِبُ",
      "الْكِتَابَةُ",
    ],
    answer: "السُّؤَالُ عَنِ الْأَحْوَالِ وَالِاطْمِئْنَانُ",
    points: 10,
  },
  {
    id: 4,
    icon: "🔎",
    station: "بوابة اللغة",
    question: "أَيُّ الْكَلِمَاتِ تَبْدَأُ بِـ «الْ» الشَّمْسِيَّةِ؟",
    choices: [
      "الرَّحِمُ",
      "الْأَبُ",
      "الْأَقَارِبُ",
      "الْيَوْمُ",
    ],
    answer: "الرَّحِمُ",
    points: 10,
  },
  {
    id: 5,
    icon: "✍️",
    station: "بوابة الإملاء",
    question: "اخْتَرِ الْكَلِمَةَ الْمَكْتُوبَةَ كِتَابَةً صَحِيحَةً:",
    choices: [
      "الْأَقَارِبُ",
      "الْأَقَارِبْ",
      "الأقاربو",
      "الاقارب",
    ],
    answer: "الْأَقَارِبُ",
    points: 10,
  },
  {
    id: 6,
    icon: "🖊️",
    station: "بوابة الخط",
    question: "مَا السُّلُوكُ الَّذِي يُسَاعِدُنَا عَلَى جَمَالِ الْخَطِّ؟",
    choices: [
      "الْكِتَابَةُ بِهُدُوءٍ وَتَرْكُ مَسَافَاتٍ بَيْنَ الْكَلِمَاتِ",
      "الْكِتَابَةُ بِسُرْعَةٍ شَدِيدَةٍ",
      "عَدَمُ مُرَاعَاةِ السَّطْرِ",
      "وَصْلُ جَمِيعِ الْكَلِمَاتِ",
    ],
    answer:
      "الْكِتَابَةُ بِهُدُوءٍ وَتَرْكُ مَسَافَاتٍ بَيْنَ الْكَلِمَاتِ",
    points: 10,
  },
];

function shuffleArray<T>(array: T[]) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export default function ChallengePage() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const [shuffledChoices, setShuffledChoices] = useState<string[]>(
    () => shuffleArray(challenges[0].choices)
  );

  const current = challenges[index];

  const progress = Math.round(
    ((index + 1) / challenges.length) * 100
  );

  function chooseAnswer(choice: string) {
    if (answered) return;

    setSelected(choice);
    setAnswered(true);

    if (choice === current.answer) {
      setScore((value) => value + current.points);
    }
  }

  function nextChallenge() {
    if (!answered) return;

    if (index === challenges.length - 1) {
      setFinished(true);
      return;
    }

    const nextIndex = index + 1;

    setIndex(nextIndex);
    setSelected("");
    setAnswered(false);
    setShuffledChoices(
      shuffleArray(challenges[nextIndex].choices)
    );
  }

  function restart() {
    setIndex(0);
    setSelected("");
    setAnswered(false);
    setScore(0);
    setFinished(false);
    setShuffledChoices(
      shuffleArray(challenges[0].choices)
    );
  }

  function getTitle() {
    if (score === 60) {
      return "👑 بَطَلُ صِلَةِ الرَّحِمِ";
    }

    if (score >= 50) {
      return "🌟 مُتَمَيِّزٌ فِي الدَّرْسِ";
    }

    if (score >= 40) {
      return "⭐ قَارِئٌ مُجْتَهِدٌ";
    }

    return "🌱 بَطَلٌ فِي طَرِيقِ التَّقَدُّمِ";
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#eefaf5 0%,#f7fbff 50%,#fff8eb 100%)",
        padding: "28px 16px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#183f32",
      }}
    >
      <div
        style={{
          maxWidth: 950,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 22,
          }}
        >
          <Link
            href="/lessons/unit1/lesson1"
            style={{
              textDecoration: "none",
              background: "#fff",
              color: "#176d4c",
              border: "1px solid #cfe7dd",
              borderRadius: 16,
              padding: "12px 18px",
              fontWeight: 900,
            }}
          >
            ← العودة إلى محطات الدرس
          </Link>

          <div
            style={{
              background: "#fff",
              color: "#a87508",
              border: "1px solid #eed99d",
              borderRadius: 16,
              padding: "12px 18px",
              fontWeight: 900,
            }}
          >
            ⭐ {score} نقطة
          </div>
        </div>

        {!finished ? (
          <>
            <section
              style={{
                background:
                  "linear-gradient(135deg,#c88b13,#e8ad25)",
                color: "#fff",
                borderRadius: 30,
                padding: "34px 20px",
                textAlign: "center",
                boxShadow:
                  "0 16px 40px rgba(180,125,15,.20)",
                marginBottom: 22,
              }}
            >
              <div style={{ fontSize: 66 }}>
                🏆
              </div>

              <div
                style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,.18)",
                  padding: "7px 16px",
                  borderRadius: 999,
                  fontWeight: 900,
                  marginTop: 8,
                }}
              >
                التحدي الختامي
              </div>

              <h1
                style={{
                  margin: "14px 0 8px",
                  fontSize: "clamp(32px,5vw,48px)",
                }}
              >
                تحدي صلة الرحم
              </h1>

              <p
                style={{
                  margin: 0,
                  lineHeight: 1.9,
                  fontSize: 17,
                }}
              >
                اجتز البوابات الست واجمع النجوم لتصبح بطل الدرس.
              </p>
            </section>

            <section
              style={{
                background: "#fff",
                border: "1px solid #e8e3d7",
                borderRadius: 22,
                padding: 18,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 900,
                  marginBottom: 10,
                  color: "#8b650e",
                }}
              >
                <span>
                  البوابة {index + 1} من {challenges.length}
                </span>

                <span>{progress}%</span>
              </div>

              <div
                style={{
                  height: 14,
                  borderRadius: 999,
                  overflow: "hidden",
                  background: "#f1ede3",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background:
                      "linear-gradient(90deg,#d49719,#f0bc3d)",
                    transition: "width .35s ease",
                  }}
                />
              </div>
            </section>

            <section
              style={{
                background: "#fff",
                borderRadius: 30,
                padding: "32px 22px",
                border: "1px solid #ebe3cf",
                boxShadow:
                  "0 14px 38px rgba(90,70,20,.08)",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 28,
                }}
              >
                <div style={{ fontSize: 64 }}>
                  {current.icon}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    color: "#ad7b10",
                    fontWeight: 900,
                  }}
                >
                  {current.station}
                </div>

                <h2
                  style={{
                    margin: "14px auto 0",
                    maxWidth: 760,
                    fontSize: "clamp(23px,4vw,32px)",
                    lineHeight: 1.9,
                    color: "#234a3c",
                  }}
                >
                  {current.question}
                </h2>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(260px,1fr))",
                  gap: 14,
                }}
              >
                {shuffledChoices.map((choice) => {
                  const correct =
                    answered &&
                    choice === current.answer;

                  const wrong =
                    answered &&
                    choice === selected &&
                    choice !== current.answer;

                  return (
                    <button
                      key={choice}
                      type="button"
                      disabled={answered}
                      onClick={() => chooseAnswer(choice)}
                      style={{
                        border: correct
                          ? "2px solid #31a66b"
                          : wrong
                            ? "2px solid #dd5b5b"
                            : "2px solid #ebe5d6",
                        background: correct
                          ? "#eaf9f0"
                          : wrong
                            ? "#fff0f0"
                            : "#fffdf8",
                        borderRadius: 20,
                        padding: "21px 16px",
                        fontSize: 18,
                        fontWeight: 900,
                        lineHeight: 1.8,
                        color: "#28483d",
                        cursor: answered
                          ? "default"
                          : "pointer",
                      }}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div
                  style={{
                    marginTop: 22,
                  }}
                >
                  <div
                    style={{
                      borderRadius: 18,
                      padding: 17,
                      textAlign: "center",
                      fontWeight: 900,
                      fontSize: 17,
                      background:
                        selected === current.answer
                          ? "#eaf9f0"
                          : "#fff2f2",
                      color:
                        selected === current.answer
                          ? "#147148"
                          : "#a63f3f",
                    }}
                  >
                    {selected === current.answer
                      ? "⭐ أحسنت! فتحت البوابة وحصلت على 10 نقاط"
                      : "🌱 لا بأس، تعلّم من الإجابة الصحيحة وأكمل الرحلة"}
                  </div>

                  <button
                    type="button"
                    onClick={nextChallenge}
                    style={{
                      width: "100%",
                      marginTop: 14,
                      border: "none",
                      borderRadius: 18,
                      background:
                        "linear-gradient(135deg,#c88b13,#e5a91e)",
                      color: "#fff",
                      padding: 16,
                      fontSize: 18,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    {index === challenges.length - 1
                      ? "🏆 اكتشف لقبي"
                      : "افتح البوابة التالية ←"}
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          <section
            style={{
              background: "#fff",
              borderRadius: 32,
              padding: "44px 24px",
              border: "1px solid #ebdfbf",
              textAlign: "center",
              boxShadow:
                "0 18px 45px rgba(150,110,20,.12)",
            }}
          >
            <div
              style={{
                fontSize: 90,
                marginBottom: 8,
              }}
            >
              🏆
            </div>

            <div
              style={{
                color: "#9e720d",
                fontWeight: 900,
                marginBottom: 8,
              }}
            >
              أتممت جميع محطات الدرس
            </div>

            <h1
              style={{
                margin: "8px 0 14px",
                color: "#176d4c",
                fontSize: "clamp(30px,5vw,46px)",
              }}
            >
              {getTitle()}
            </h1>

            <p
              style={{
                color: "#6c7d76",
                fontSize: 19,
                lineHeight: 1.9,
              }}
            >
              أنهيت تحدي صلة الرحم وحصلت على
            </p>

            <div
              style={{
                display: "inline-block",
                margin: "10px 0 22px",
                background:
                  "linear-gradient(135deg,#fff4c9,#fff9e9)",
                border: "2px solid #efd27c",
                borderRadius: 22,
                padding: "18px 32px",
                color: "#956a08",
                fontSize: 27,
                fontWeight: 900,
              }}
            >
              ⭐ {score} من 60 نقطة
            </div>

            <div
              style={{
                maxWidth: 650,
                margin: "0 auto",
                background: "#eef9f5",
                border: "1px solid #d4ebe2",
                borderRadius: 22,
                padding: 20,
                color: "#426b5d",
                lineHeight: 1.9,
                fontWeight: 800,
              }}
            >
              🧒🏻 فارس يقول:
              <br />
              لقد قرأت وفهمت واكتشفت الكلمات واللغة وتدربت
              على الإملاء والخط. أنت الآن جاهز للدرس القادم!
            </div>

            <button
              type="button"
              onClick={restart}
              style={{
                width: "100%",
                marginTop: 24,
                border: "none",
                borderRadius: 18,
                background:
                  "linear-gradient(135deg,#c88b13,#e5a91e)",
                color: "#fff",
                padding: 16,
                fontSize: 18,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              🔁 أعد التحدي
            </button>

            <Link
              href="/lessons/unit1/lesson1"
              style={{
                display: "block",
                marginTop: 12,
                textDecoration: "none",
                border: "1px solid #d7e7df",
                borderRadius: 18,
                padding: 15,
                color: "#176d4c",
                fontWeight: 900,
              }}
            >
              🚗 العودة إلى محطات الدرس
            </Link>

            <Link
              href="/lessons/unit1"
              style={{
                display: "block",
                marginTop: 12,
                textDecoration: "none",
                background: "#176d4c",
                borderRadius: 18,
                padding: 15,
                color: "#fff",
                fontWeight: 900,
              }}
            >
              🎓 العودة إلى الوحدة الأولى
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}