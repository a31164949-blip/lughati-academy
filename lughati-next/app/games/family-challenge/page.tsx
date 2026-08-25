"use client";

import Link from "next/link";
import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type TeamId = "child" | "family";

type Challenge = {
  id: number;
  category: string;
  icon: string;
  prompt: string;
  options: string[];
  answer: string;
  points: number;
};

const CHILD_QUESTIONS: Challenge[] = [
  { id: 1, category: "مرادف", icon: "🧠", prompt: "ما مرادف كلمة «سعيد»؟", options: ["فرِح", "غاضب", "متعب", "خائف"], answer: "فرِح", points: 10 },
  { id: 2, category: "ضد الكلمة", icon: "↔️", prompt: "ما ضد كلمة «كبير»؟", options: ["صغير", "طويل", "قريب", "جميل"], answer: "صغير", points: 10 },
  { id: 3, category: "ترتيب الحروف", icon: "🔤", prompt: "رتّب الحروف لتكوين كلمة صحيحة: ب ـ ا ـ ت ـ ك", options: ["كتاب", "كاتب", "تكاب", "بتاك"], answer: "كتاب", points: 10 },
  { id: 4, category: "حرف المد", icon: "🎯", prompt: "أي كلمة تحتوي على مدّ بالألف؟", options: ["باب", "كتب", "مِن", "قُل"], answer: "باب", points: 10 },
  { id: 5, category: "أكمل الجملة", icon: "✍️", prompt: "أكمل: ذهب خالد إلى ____ ليتعلم.", options: ["المدرسة", "يلعب", "سريع", "جميل"], answer: "المدرسة", points: 10 },
  { id: 6, category: "مفرد وجمع", icon: "📚", prompt: "ما جمع كلمة «كتاب»؟", options: ["كُتُب", "كاتب", "مكتبة", "كتابة"], answer: "كُتُب", points: 10 },
  { id: 7, category: "الكلمة المختلفة", icon: "🔎", prompt: "أي كلمة تختلف عن البقية؟", options: ["تفاحة", "برتقالة", "موزة", "سيارة"], answer: "سيارة", points: 10 },
  { id: 8, category: "الحرف الأول", icon: "⚡", prompt: "أي كلمة تبدأ بحرف الشين؟", options: ["شجرة", "قمر", "باب", "ورد"], answer: "شجرة", points: 10 },
  { id: 9, category: "ترتيب جملة", icon: "🧩", prompt: "أي ترتيب يصنع جملة صحيحة؟", options: ["قرأَ محمدٌ القصةَ", "محمدٌ القصةَ قرأَ", "القصةَ قرأَ محمدٌ", "قرأَ القصةَ محمدٌ"], answer: "قرأَ محمدٌ القصةَ", points: 10 },
  { id: 10, category: "فهم سريع", icon: "💡", prompt: "«شرب سامي الماء لأنه عطشان». لماذا شرب سامي الماء؟", options: ["لأنه عطشان", "لأنه نائم", "لأنه يكتب", "لأنه يلعب"], answer: "لأنه عطشان", points: 10 },
  { id: 11, category: "التاء المربوطة", icon: "🌟", prompt: "أي كلمة تنتهي بتاء مربوطة؟", options: ["مدرسة", "بيت", "كتاب", "باب"], answer: "مدرسة", points: 10 },
  { id: 12, category: "اختيار الكلمة", icon: "🎈", prompt: "أي كلمة تدل على حيوان؟", options: ["حصان", "قلم", "شجرة", "كرسي"], answer: "حصان", points: 10 },
];

const FAMILY_QUESTIONS: Challenge[] = [
  { id: 101, category: "نحو", icon: "🧠", prompt: "أي الجمل الآتية اشتملت على نائب فاعل؟", options: ["كُسِرَ الزجاجُ", "كَسَرَ الطفلُ الزجاجَ", "الزجاجُ مكسورٌ", "لن يُكسَرَ الزجاجُ"], answer: "كُسِرَ الزجاجُ", points: 10 },
  { id: 102, category: "بلاغة", icon: "🎭", prompt: "في قولنا «ابتسم الصباح» ما الصورة البلاغية الأقرب؟", options: ["استعارة مكنية", "تشبيه صريح", "طباق", "جناس"], answer: "استعارة مكنية", points: 10 },
  { id: 103, category: "إملاء", icon: "✍️", prompt: "أي الكلمات الآتية كُتبت همزتها المتوسطة كتابة صحيحة؟", options: ["مسؤول", "مسئول", "مسأول", "مسؤل"], answer: "مسؤول", points: 10 },
  { id: 104, category: "لغز لغوي", icon: "🕵️", prompt: "كلمة إذا حذفت أول حرف منها أصبحت اسم شيء نشربه: «سماء». ما الناتج؟", options: ["ماء", "سماء", "مسا", "سما"], answer: "ماء", points: 10 },
  { id: 105, category: "صرف", icon: "⚙️", prompt: "ما اسم الفاعل من الفعل «استخرج»؟", options: ["مُستخرِج", "مُستخرَج", "استخراج", "خارِج"], answer: "مُستخرِج", points: 10 },
  { id: 106, category: "معنى دقيق", icon: "📖", prompt: "ما أقرب معنى لكلمة «وَئيدًا»؟", options: ["ببطء وتؤدة", "بسرعة شديدة", "بصوت مرتفع", "بغضب"], answer: "ببطء وتؤدة", points: 10 },
  { id: 107, category: "اكتشف الخطأ", icon: "🎯", prompt: "أي جملة تحتوي على خطأ نحوي؟", options: ["إنَّ الطالبينِ مجتهدان", "كان المعلمان حاضرين", "لن يهملَ المجتهدُ عمله", "الطالباتُ مجتهداتٌ"], answer: "إنَّ الطالبينِ مجتهدان", points: 10 },
  { id: 108, category: "جمع التكسير", icon: "📚", prompt: "أي الكلمات الآتية جمع تكسير؟", options: ["مفاتيح", "معلمون", "طالبات", "مهندسان"], answer: "مفاتيح", points: 10 },
  { id: 109, category: "أسلوب", icon: "🔍", prompt: "ما نوع الأسلوب في «ما أجملَ الوفاءَ!»؟", options: ["تعجب", "استفهام", "نفي", "نداء"], answer: "تعجب", points: 10 },
  { id: 110, category: "مثل عربي", icon: "🏺", prompt: "أكمل المثل: «خير الكلام ما قلَّ و____».", options: ["دلَّ", "طال", "كثر", "صَعُب"], answer: "دلَّ", points: 10 },
  { id: 111, category: "دلالة", icon: "💡", prompt: "أي الكلمات أدق في وصف شخص يتثبت قبل اتخاذ القرار؟", options: ["متروٍّ", "متهور", "متردد دائمًا", "عجول"], answer: "متروٍّ", points: 10 },
  { id: 112, category: "نحو متقدم", icon: "🏆", prompt: "أي الكلمات الآتية ممنوعة من الصرف؟", options: ["مساجد", "كاتب", "مدرسة", "معلمون"], answer: "مساجد", points: 10 },
  { id: 113, category: "همزة الوصل والقطع", icon: "🔤", prompt: "أي كلمة تبدأ بهمزة قطع؟", options: ["أحمد", "استغفار", "ابن", "اجتماع"], answer: "أحمد", points: 10 },
  { id: 114, category: "استنتاج", icon: "🧩", prompt: "إذا كان كل شاعر أديبًا، وبعض الأدباء نقادًا؛ فأي عبارة مؤكدة؟", options: ["كل شاعر أديب", "كل ناقد شاعر", "كل أديب شاعر", "لا شاعر ناقد"], answer: "كل شاعر أديب", points: 10 },
  { id: 115, category: "مفردات", icon: "🌙", prompt: "ما معنى «السُّرى» في العربية؟", options: ["السير ليلًا", "السير نهارًا", "النوم الطويل", "شدة المطر"], answer: "السير ليلًا", points: 10 },
  { id: 116, category: "تمييز لغوي", icon: "⚡", prompt: "أي الجمل أدق استعمالًا؟", options: ["اعتذر عن التأخر", "اعتذر من التأخر", "اعتذر بالتأخر", "اعتذر على التأخر"], answer: "اعتذر عن التأخر", points: 10 },
];

function shuffleQuestions(items: Challenge[]) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function createRounds(): Challenge[] {
  const children = shuffleQuestions(CHILD_QUESTIONS).slice(0, 3);
  const family = shuffleQuestions(FAMILY_QUESTIONS).slice(0, 3);

  return [
    children[0],
    family[0],
    children[1],
    family[1],
    children[2],
    family[2],
  ];
}

function formatTime(totalSeconds: number) {
  const safe = Math.max(
    0,
    Math.floor(totalSeconds)
  );

  const minutes =
    Math.floor(safe / 60);

  const seconds =
    safe % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

export default function FamilyChallengePage() {
  const [
    rounds,
    setRounds,
  ] = useState<Challenge[]>(() => createRounds());

  const [
    roundIndex,
    setRoundIndex,
  ] = useState(0);

  const [
    activeTeam,
    setActiveTeam,
  ] = useState<TeamId>("child");

  const [
    childScore,
    setChildScore,
  ] = useState(0);

  const [
    familyScore,
    setFamilyScore,
  ] = useState(0);

  const [
    selectedAnswer,
    setSelectedAnswer,
  ] = useState<string | null>(null);

  const [
    locked,
    setLocked,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState(
    "ابدأوا التحدي بالتناوب بين الطفل والأسرة."
  );

  const [
    seconds,
    setSeconds,
  ] = useState(0);

  const [
    started,
    setStarted,
  ] = useState(false);

  const [
    completed,
    setCompleted,
  ] = useState(false);

  const [
    showResult,
    setShowResult,
  ] = useState(false);

  const [
    savingRecord,
    setSavingRecord,
  ] = useState(false);

  const [
    isNewRecord,
    setIsNewRecord,
  ] = useState(false);

  const current =
    rounds[roundIndex];

  const totalRounds =
    rounds.length;

  const progress =
    Math.round(
      ((roundIndex +
        (completed ? 1 : 0)) /
        totalRounds) *
        100
    );

  const winner = useMemo(() => {
    if (!completed) {
      return null;
    }

    if (
      childScore >
      familyScore
    ) {
      return "child";
    }

    if (
      familyScore >
      childScore
    ) {
      return "family";
    }

    return "draw";
  }, [
    completed,
    childScore,
    familyScore,
  ]);

  useEffect(() => {
    if (
      !started ||
      completed
    ) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setSeconds(
          (currentTime) =>
            currentTime + 1
        );
      }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [started, completed]);

  function ensureStarted() {
    if (!started) {
      setStarted(true);
      setSeconds(0);
    }
  }

  function chooseAnswer(
    option: string
  ) {
    if (
      locked ||
      completed
    ) {
      return;
    }

    ensureStarted();

    setSelectedAnswer(
      option
    );

    setLocked(true);

    const correct =
      option ===
      current.answer;

    if (correct) {
      if (
        activeTeam ===
        "child"
      ) {
        setChildScore(
          (score) =>
            score +
            current.points
        );
      } else {
        setFamilyScore(
          (score) =>
            score +
            current.points
        );
      }

      setMessage(
        `✅ إجابة صحيحة! +${current.points} نقاط`
      );
    } else {
      setMessage(
        `🌱 الإجابة الصحيحة هي: ${current.answer}`
      );
    }
  }

  async function saveFamilyRecord(
    finalChildScore: number,
    finalFamilyScore: number,
    finalTime: number
  ) {
    try {
      setSavingRecord(true);

      const winningScore = Math.max(
        finalChildScore,
        finalFamilyScore
      );

      const safeTime = Math.max(
        1,
        Math.floor(finalTime)
      );

      const recordRef = doc(
        db,
        "gameRecords",
        "lughati-family-challenge"
      );

      let newRecord = false;

      await runTransaction(
        db,
        async (transaction) => {
          const snapshot =
            await transaction.get(
              recordRef
            );

          const data = snapshot.exists()
            ? snapshot.data()
            : null;

          const previousScore =
            typeof data?.bestScore === "number"
              ? data.bestScore
              : null;

          const previousTime =
            typeof data?.bestTime === "number"
              ? data.bestTime
              : null;

          const betterScore =
            previousScore === null ||
            winningScore > previousScore;

          const sameScoreFaster =
            previousScore !== null &&
            winningScore === previousScore &&
            (
              previousTime === null ||
              safeTime < previousTime
            );

          if (
            betterScore ||
            sameScoreFaster
          ) {
            transaction.set(
              recordRef,
              {
                gameId:
                  "lughati-family-challenge",
                bestScore:
                  winningScore,
                bestTime:
                  safeTime,
                childScore:
                  finalChildScore,
                familyScore:
                  finalFamilyScore,
                winner:
                  finalChildScore >
                  finalFamilyScore
                    ? "child"
                    : finalFamilyScore >
                      finalChildScore
                    ? "family"
                    : "draw",
                updatedAt:
                  serverTimestamp(),
              },
              { merge: true }
            );

            newRecord = true;
          }
        }
      );

      setIsNewRecord(
        newRecord
      );
    } catch (error) {
      console.error(
        "تعذر حفظ نتيجة التحدي العائلي:",
        error
      );
    } finally {
      setSavingRecord(false);
    }
  }

  function nextRound() {
    if (!locked) {
      return;
    }

    if (
      roundIndex ===
      totalRounds - 1
    ) {
      setCompleted(true);
      setShowResult(true);
      setMessage(
        "🏆 انتهى التحدي العائلي!"
      );

      void saveFamilyRecord(
        childScore,
        familyScore,
        seconds
      );

      return;
    }

    setRoundIndex(
      (index) =>
        index + 1
    );

    setActiveTeam(
      (team) =>
        team === "child"
          ? "family"
          : "child"
    );

    setSelectedAnswer(
      null
    );

    setLocked(false);

    setMessage(
      "الدور انتقل للفريق الآخر."
    );
  }

  function restartGame() {
    setRounds(createRounds());
    setRoundIndex(0);
    setActiveTeam("child");
    setChildScore(0);
    setFamilyScore(0);
    setSelectedAnswer(null);
    setLocked(false);
    setMessage(
      "ابدأوا التحدي بالتناوب بين الطفل والأسرة."
    );
    setSeconds(0);
    setStarted(false);
    setCompleted(false);
    setShowResult(false);
    setIsNewRecord(false);
    setSavingRecord(false);
  }

  function optionStyle(
    option: string
  ): React.CSSProperties {
    if (!locked) {
      return {
        ...baseOption,
      };
    }

    if (
      option ===
      current.answer
    ) {
      return {
        ...baseOption,
        border:
          "2px solid #22c55e",
        background:
          "#ecfdf5",
        color:
          "#166534",
      };
    }

    if (
      option ===
      selectedAnswer
    ) {
      return {
        ...baseOption,
        border:
          "2px solid #ef4444",
        background:
          "#fef2f2",
        color:
          "#991b1b",
      };
    }

    return {
      ...baseOption,
      opacity: 0.68,
    };
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f2fbf6 0%,#f8fbff 52%,#fff8ed 100%)",
        padding:
          "24px 14px 60px",
        fontFamily:
          "Arial, sans-serif",
        color:
          "#173f31",
      }}
    >
      <div
        style={{
          maxWidth:
            "1100px",
          margin:
            "0 auto",
        }}
      >
        <div
          style={{
            marginBottom:
              "15px",
          }}
        >
          <Link
            href="/#weekly-games"
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: "7px",
              textDecoration:
                "none",
              color:
                "#176d4c",
              background:
                "#ffffff",
              border:
                "1px solid #d4e8dd",
              padding:
                "11px 17px",
              borderRadius:
                "15px",
              fontWeight:
                900,
            }}
          >
            ← العودة إلى الألعاب
          </Link>
        </div>

        <header
          style={{
            position:
              "relative",
            overflow:
              "hidden",
            borderRadius:
              "32px",
            padding:
              "28px",
            background:
              "linear-gradient(135deg,#166534 0%,#15803d 50%,#22c55e 100%)",
            color:
              "#ffffff",
            boxShadow:
              "0 18px 42px rgba(22,101,52,.20)",
          }}
        >
          <div
            style={{
              position:
                "absolute",
              width:
                "250px",
              height:
                "250px",
              borderRadius:
                "50%",
              background:
                "rgba(255,255,255,.09)",
              top:
                "-100px",
              left:
                "-70px",
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
                  "8px 13px",
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
              👨‍👩‍👧‍👦 تحدي العائلة
            </span>

            <h1
              style={{
                margin:
                  "11px 0 7px",
                fontSize:
                  "clamp(34px,5vw,50px)",
              }}
            >
              من يعرف لغتي أكثر؟
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
                  0.95,
              }}
            >
              ست جولات متجددة في كل مرة:
              أسئلة تعليمية ممتعة للطفل،
              وأسئلة لغوية أصعب ومتنوعة للأسرة.
              كل إجابة صحيحة تمنح عشر نقاط،
              والفريق الأعلى يفوز بالكأس.
            </p>
          </div>
        </header>

        <section
          style={{
            marginTop:
              "17px",
            display:
              "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: "12px",
          }}
          className="familyStats"
        >
          <ScoreCard
            icon="🧒"
            title="فريق الطفل"
            value={`${childScore} نقطة`}
            active={
              activeTeam ===
                "child" &&
              !completed
            }
          />

          <ScoreCard
            icon="⏱️"
            title="الوقت"
            value={formatTime(
              seconds
            )}
          />

          <ScoreCard
            icon="👨‍👩‍👧"
            title="فريق الأسرة"
            value={`${familyScore} نقطة`}
            active={
              activeTeam ===
                "family" &&
              !completed
            }
          />
        </section>

        <section
          style={{
            marginTop:
              "14px",
            padding:
              "13px 15px",
            borderRadius:
              "18px",
            background:
              "#ffffff",
            border:
              "1px solid #dce9e1",
            color:
              "#4d655b",
            textAlign:
              "center",
            fontWeight:
              900,
          }}
        >
          {message}
        </section>

        <div
          style={{
            marginTop:
              "14px",
            height:
              "11px",
            borderRadius:
              "999px",
            background:
              "#e7efe9",
            overflow:
              "hidden",
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
                "linear-gradient(90deg,#166534,#22c55e)",
              transition:
                "width .3s ease",
            }}
          />
        </div>

        {!completed && (
          <section
            style={{
              marginTop:
                "18px",
              background:
                "#ffffff",
              borderRadius:
                "28px",
              padding:
                "24px",
              border:
                "1px solid #dfeae3",
              boxShadow:
                "0 12px 32px rgba(20,70,45,.07)",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap: "12px",
                flexWrap:
                  "wrap",
              }}
            >
              <div>
                <span
                  style={{
                    display:
                      "inline-flex",
                    padding:
                      "7px 11px",
                    borderRadius:
                      "999px",
                    background:
                      "#ecfdf5",
                    color:
                      "#166534",
                    fontWeight:
                      900,
                    fontSize:
                      "12px",
                  }}
                >
                  {current.icon}{" "}
                  {
                    current.category
                  }
                </span>

                <h2
                  style={{
                    margin:
                      "12px 0 0",
                    color:
                      "#174c3b",
                    fontSize:
                      "clamp(24px,4vw,32px)",
                    lineHeight:
                      1.6,
                  }}
                >
                  {
                    current.prompt
                  }
                </h2>
              </div>

              <div
                style={{
                  padding:
                    "10px 14px",
                  borderRadius:
                    "16px",
                  background:
                    activeTeam ===
                    "child"
                      ? "#eff6ff"
                      : "#fff7ed",
                  color:
                    activeTeam ===
                    "child"
                      ? "#1d4ed8"
                      : "#9a3412",
                  fontWeight:
                    900,
                }}
              >
                الدور الآن:{" "}
                {activeTeam ===
                "child"
                  ? "🧒 الطفل"
                  : "👨‍👩‍👧 الأسرة"}
              </div>
            </div>

            <div
              style={{
                marginTop:
                  "20px",
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(2,minmax(0,1fr))",
                gap:
                  "12px",
              }}
              className="familyOptions"
            >
              {current.options.map(
                (option) => (
                  <button
                    key={
                      option
                    }
                    type="button"
                    disabled={
                      locked
                    }
                    onClick={() =>
                      chooseAnswer(
                        option
                      )
                    }
                    style={optionStyle(
                      option
                    )}
                  >
                    {option}
                  </button>
                )
              )}
            </div>

            <div
              style={{
                marginTop:
                  "18px",
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap:
                  "10px",
                flexWrap:
                  "wrap",
              }}
            >
              <strong
                style={{
                  color:
                    "#64748b",
                }}
              >
                الجولة{" "}
                {roundIndex + 1} من{" "}
                {totalRounds}
              </strong>

              <button
                type="button"
                onClick={
                  nextRound
                }
                disabled={
                  !locked
                }
                style={{
                  border:
                    "none",
                  borderRadius:
                    "15px",
                  padding:
                    "12px 19px",
                  background:
                    locked
                      ? "#166534"
                      : "#cbd5e1",
                  color:
                    "#ffffff",
                  fontWeight:
                    900,
                  cursor:
                    locked
                      ? "pointer"
                      : "default",
                }}
              >
                {roundIndex ===
                totalRounds - 1
                  ? "🏆 عرض النتيجة"
                  : "الجولة التالية ←"}
              </button>
            </div>
          </section>
        )}

        <section
          style={{
            marginTop:
              "18px",
            display:
              "flex",
            justifyContent:
              "center",
          }}
        >
          <button
            type="button"
            onClick={
              restartGame
            }
            style={{
              border:
                "1px solid #d7e7df",
              borderRadius:
                "15px",
              padding:
                "12px 18px",
              background:
                "#ffffff",
              color:
                "#176d4c",
              fontWeight:
                900,
              cursor:
                "pointer",
            }}
          >
            🔄 إعادة التحدي
          </button>
        </section>
      </div>

      {completed &&
        showResult && (
          <div
            style={{
              position:
                "fixed",
              inset: 0,
              zIndex:
                999,
              display:
                "grid",
              placeItems:
                "center",
              padding:
                "18px",
              background:
                "rgba(15,23,42,.58)",
              backdropFilter:
                "blur(8px)",
            }}
          >
            <section
              dir="rtl"
              style={{
                position:
                  "relative",
                width:
                  "min(520px,100%)",
                borderRadius:
                  "30px",
                padding:
                  "34px 24px 26px",
                background:
                  "linear-gradient(180deg,#ffffff,#f2fff7)",
                textAlign:
                  "center",
                boxShadow:
                  "0 28px 75px rgba(15,23,42,.28)",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setShowResult(
                    false
                  )
                }
                aria-label="إغلاق نافذة النتيجة"
                style={{
                  position:
                    "absolute",
                  top:
                    "14px",
                  left:
                    "14px",
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
                {winner ===
                "child"
                  ? "🧒🏆"
                  : winner ===
                    "family"
                  ? "👨‍👩‍👧🏆"
                  : "🤝🏆"}
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
                {winner ===
                "child"
                  ? "فريق الطفل يفوز!"
                  : winner ===
                    "family"
                  ? "فريق الأسرة يفوز!"
                  : "تعادل رائع!"}
              </h2>

              <p
                style={{
                  margin:
                    "0 0 18px",
                  color:
                    "#64748b",
                  lineHeight:
                    1.8,
                  fontWeight:
                    700,
                }}
              >
                انتهى التحدي
                العائلي بعد ست
                جولات ممتعة.
              </p>

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(2,minmax(0,1fr))",
                  gap:
                    "10px",
                  marginBottom:
                    "16px",
                }}
              >
                <ResultBox
                  title="🧒 الطفل"
                  value={`${childScore} نقطة`}
                />

                <ResultBox
                  title="👨‍👩‍👧 الأسرة"
                  value={`${familyScore} نقطة`}
                />
              </div>

              <div
                style={{
                  padding:
                    "13px",
                  borderRadius:
                    "17px",
                  background:
                    "#ffffff",
                  border:
                    "1px solid #d8e8df",
                  color:
                    "#176d4c",
                  fontWeight:
                    900,
                  marginBottom:
                    "16px",
                }}
              >
                ⏱️ مدة التحدي:{" "}
                {formatTime(
                  seconds
                )}
              </div>

              {isNewRecord && (
                <div
                  style={{
                    marginBottom:
                      "14px",
                    padding:
                      "11px 14px",
                    borderRadius:
                      "15px",
                    background:
                      "#fff7d6",
                    border:
                      "1px solid #f2d56b",
                    color:
                      "#8a5a00",
                    fontWeight:
                      900,
                  }}
                >
                  🥇 رقم قياسي عائلي جديد!
                </div>
              )}

              {savingRecord && (
                <div
                  style={{
                    marginBottom:
                      "14px",
                    color:
                      "#64748b",
                    fontWeight:
                      800,
                  }}
                >
                  ⏳ جارٍ حفظ النتيجة...
                </div>
              )}

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "center",
                  gap:
                    "10px",
                  flexWrap:
                    "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={
                    restartGame
                  }
                  style={{
                    border:
                      "none",
                    borderRadius:
                      "15px",
                    padding:
                      "12px 17px",
                    background:
                      "#16a36a",
                    color:
                      "#ffffff",
                    fontWeight:
                      900,
                    cursor:
                      "pointer",
                  }}
                >
                  🔄 تحدي جديد
                </button>

                <Link
                  href="/#weekly-games"
                  style={{
                    textDecoration:
                      "none",
                    borderRadius:
                      "15px",
                    padding:
                      "12px 17px",
                    background:
                      "#ffffff",
                    color:
                      "#176d4c",
                    border:
                      "1px solid #d4e7dc",
                    fontWeight:
                      900,
                  }}
                >
                  🎮 ألعاب أخرى
                </Link>
              </div>
            </section>
          </div>
        )}

      <style>{`
        @media (max-width: 720px) {
          .familyStats {
            grid-template-columns: 1fr !important;
          }

          .familyOptions {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

function ScoreCard({
  icon,
  title,
  value,
  active = false,
}: {
  icon: string;
  title: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      style={{
        background:
          active
            ? "#ecfdf5"
            : "#ffffff",
        border:
          active
            ? "2px solid #22c55e"
            : "1px solid #dce9e2",
        borderRadius:
          "21px",
        padding:
          "17px",
        textAlign:
          "center",
        boxShadow:
          active
            ? "0 11px 24px rgba(34,197,94,.13)"
            : "0 8px 20px rgba(30,80,50,.05)",
      }}
    >
      <div
        style={{
          fontSize:
            "28px",
        }}
      >
        {icon}
      </div>

      <p
        style={{
          margin:
            "6px 0 2px",
          color:
            "#64748b",
          fontSize:
            "12px",
          fontWeight:
            800,
        }}
      >
        {title}
      </p>

      <strong
        style={{
          color:
            active
              ? "#166534"
              : "#174c3b",
          fontSize:
            "21px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function ResultBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background:
          "#ffffff",
        border:
          "1px solid #d8e8df",
        borderRadius:
          "17px",
        padding:
          "14px 10px",
      }}
    >
      <span
        style={{
          display:
            "block",
          color:
            "#64748b",
          fontSize:
            "12px",
          fontWeight:
            800,
        }}
      >
        {title}
      </span>

      <strong
        style={{
          display:
            "block",
          marginTop:
            "5px",
          color:
            "#166534",
          fontSize:
            "20px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

const baseOption:
  React.CSSProperties = {
    border:
      "1px solid #dce8e1",
    borderRadius:
      "17px",
    background:
      "#ffffff",
    color:
      "#174c3b",
    padding:
      "17px",
    fontSize:
      "17px",
    fontWeight:
      900,
    cursor:
      "pointer",
    textAlign:
      "center",
    transition:
      "transform .16s ease, border .16s ease, background .16s ease",
  };