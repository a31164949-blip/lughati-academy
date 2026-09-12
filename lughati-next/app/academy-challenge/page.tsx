"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const READING_LEVEL_RESULT_KEY = "lughati-reading-level-last-result";
const CHALLENGE_PROGRESS_KEY = "lughati-academy-challenge-progress-v1";

const stations = [
  {
    id: "comprehension",
    icon: "🧠",
    title: "أفهم وأستنتج",
    description: "اقرأ نصًا قصيرًا وأجب عن أسئلة الفهم والاستنتاج.",
    color: "#146a8a",
    background: "#eaf7ff",
  },
  {
    id: "vocabulary",
    icon: "💎",
    title: "كنز المفردات",
    description: "اكتشف معاني الكلمات واختر استخدامها المناسب.",
    color: "#8a5a00",
    background: "#fff8df",
  },
  {
    id: "events",
    icon: "🧩",
    title: "أرتّب الأحداث",
    description: "رتّب أحداث القصة من البداية إلى النهاية.",
    color: "#176c46",
    background: "#eaf9f2",
  },
] as const;

type StationId = (typeof stations)[number]["id"];
type LocalProgress = Partial<Record<StationId, boolean>>;
type ReadingLevelResult = {
  level?: string;
  masteredSkills?: number;
  totalSkills?: number;
};

type Question = {
  prompt: string;
  options: string[];
  answer: string;
};

const comprehensionQuestions: Question[] = [
  {
    prompt: "اقرأ: «حملَ رائدٌ كتابَهُ، وجلسَ قربَ النافذةِ. قرأَ قصةً عن التعاون.» ماذا قرأ رائد؟",
    options: ["قصةً عن التعاون", "رسالةً قصيرة", "جدولَ الحصص"],
    answer: "قصةً عن التعاون",
  },
  {
    prompt: "لماذا جلس رائد قرب النافذة؟",
    options: ["ليقرأ بهدوء", "ليلعب بالكرة", "لينام في الفصل"],
    answer: "ليقرأ بهدوء",
  },
];

const vocabularyQuestions: Question[] = [
  {
    prompt: "ما معنى كلمة «عَطوف»؟",
    options: ["كثير الرحمة", "سريع الغضب", "كثير النوم"],
    answer: "كثير الرحمة",
  },
  {
    prompt: "اختر الجملة المناسبة لكلمة «مرتب». ",
    options: ["مكتبي مرتب ونظيف.", "الطائر مرتب في السماء.", "شربت مرتبًا من الماء."],
    answer: "مكتبي مرتب ونظيف.",
  },
];

const eventItems = [
  "غسلَ يديه.",
  "عادَ سامرٌ من المدرسة.",
  "جلسَ ليتناولَ الغداء.",
];
const correctEventOrder = [
  "عادَ سامرٌ من المدرسة.",
  "غسلَ يديه.",
  "جلسَ ليتناولَ الغداء.",
];

function readReadingResult(): ReadingLevelResult | null {
  try {
    const raw = window.localStorage.getItem(READING_LEVEL_RESULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReadingLevelResult;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readProgress(): LocalProgress {
  try {
    const raw = window.localStorage.getItem(CHALLENGE_PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalProgress;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: LocalProgress) {
  window.localStorage.setItem(CHALLENGE_PROGRESS_KEY, JSON.stringify(progress));
}

export default function AcademyChallengePage() {
  const [readingResult, setReadingResult] = useState<ReadingLevelResult | null>(null);
  const [progress, setProgress] = useState<LocalProgress>({});
  const [activeStation, setActiveStation] = useState<StationId | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [stationAttemptFinished, setStationAttemptFinished] = useState(false);
  const [eventAnswer, setEventAnswer] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReadingResult(readReadingResult());
      setProgress(readProgress());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const eligible =
    readingResult?.level === "قارئ متميز" ||
    (readingResult?.masteredSkills === readingResult?.totalSkills &&
      typeof readingResult?.totalSkills === "number");

  const currentQuestions =
    activeStation === "comprehension"
      ? comprehensionQuestions
      : vocabularyQuestions;
  const currentQuestion = currentQuestions[questionIndex];
  const completedCount = stations.filter((station) => progress[station.id]).length;
  const challengeFinished = completedCount === stations.length;

  const activeStationInfo = useMemo(
    () => stations.find((station) => station.id === activeStation) ?? null,
    [activeStation]
  );

  function startStation(stationId: StationId) {
    if (!eligible || progress[stationId]) return;
    setActiveStation(stationId);
    setQuestionIndex(0);
    setSelectedAnswer("");
    setChecked(false);
    setCorrectAnswers(0);
    setStationAttemptFinished(false);
    setEventAnswer([]);
    setMessage("");
  }

  function finishStation(stationId: StationId) {
    const nextProgress = { ...progress, [stationId]: true };
    setProgress(nextProgress);
    saveProgress(nextProgress);
    setActiveStation(null);
    setMessage("أحسنت! أتممت المحطة بنجاح 🌟");
  }

  function checkChoice() {
    if (!currentQuestion || !selectedAnswer || checked) return;
    setCorrectAnswers((current) => current + (selectedAnswer === currentQuestion.answer ? 1 : 0));
    setChecked(true);
  }

  function nextChoiceQuestion() {
    if (!checked) return;
    if (questionIndex === currentQuestions.length - 1) {
      // The last answer was already counted by checkChoice().
      const stationScore = correctAnswers;
      if (stationScore === currentQuestions.length) {
        finishStation(activeStation as StationId);
      } else {
        setMessage("اقتربت! أعد المحطة وحاول بهدوء مرة أخرى.");
        setStationAttemptFinished(true);
      }
      return;
    }
    setQuestionIndex((current) => current + 1);
    setSelectedAnswer("");
    setChecked(false);
  }

  function retryChoiceStation() {
    setQuestionIndex(0);
    setSelectedAnswer("");
    setChecked(false);
    setCorrectAnswers(0);
    setStationAttemptFinished(false);
    setMessage("");
  }

  function addEvent(event: string) {
    if (eventAnswer.includes(event)) return;
    setEventAnswer((current) => [...current, event]);
  }

  function removeLastEvent() {
    setEventAnswer((current) => current.slice(0, -1));
  }

  function checkEvents() {
    if (eventAnswer.length !== correctEventOrder.length) {
      setMessage("اختر الأحداث الثلاثة أولًا.");
      return;
    }
    if (eventAnswer.every((event, index) => event === correctEventOrder[index])) {
      finishStation("events");
    } else {
      setMessage("فكّر: ماذا حدث أولًا؟ أعد المحاولة.");
      setEventAnswer([]);
    }
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <div style={contentStyle}>
        <div style={topBarStyle}>
          <Link href="/" style={linkStyle}>← العودة إلى الرئيسية</Link>
          <span style={pillStyle}>🏆 للقراء المتميزين</span>
        </div>

        <header style={heroStyle}>
          <div style={{ fontSize: 48 }}>🏆</div>
          <p style={eyebrowStyle}>ركن إثرائي محلي</p>
          <h1 style={titleStyle}>تحدّي الأكاديمية</h1>
          <p style={subtitleStyle}>ثلاث محطات ممتعة في الفهم والمفردات وترتيب الأحداث، مصممة لتوسّع مهارات قارئ الصف الثاني.</p>
        </header>

        {!eligible ? (
          <section style={lockedCardStyle}>
            <div style={{ fontSize: 42 }}>🌱</div>
            <h2 style={{ color: "#14513d" }}>التحدّي ينتظرك</h2>
            <p style={{ color: "#5f756b", lineHeight: 1.9 }}>أكمل ركن تحديد المستوى وأتقن مهاراته أولًا، ثم نفتح لك تحديات الأكاديمية.</p>
            <Link href="/reading-level" style={primaryButtonStyle}>🎯 ابدأ تحديد المستوى</Link>
          </section>
        ) : activeStation ? (
          <section style={questionCardStyle}>
            <button type="button" onClick={() => setActiveStation(null)} style={backButtonStyle}>← العودة إلى المحطات</button>
            <div style={{ marginTop: 18, color: activeStationInfo?.color }}>{activeStationInfo?.icon} {activeStationInfo?.title}</div>
            {activeStation === "events" ? (
              <>
                <h2 style={questionTitleStyle}>رتّب أحداث اليوم من البداية إلى النهاية.</h2>
                <div style={eventBoxStyle}>{eventAnswer.length ? eventAnswer.map((event, index) => <div key={`${event}-${index}`} style={eventChosenStyle}>{index + 1}. {event}</div>) : <span style={{ color: "#718078" }}>ستظهر اختياراتك هنا</span>}</div>
                <div style={optionGridStyle}>{eventItems.map((event) => <button key={event} type="button" onClick={() => addEvent(event)} disabled={eventAnswer.includes(event)} style={optionStyle}>{event}</button>)}</div>
                <div style={actionsStyle}><button type="button" onClick={removeLastEvent} style={secondaryButtonStyle}>تراجع</button><button type="button" onClick={checkEvents} style={primaryButtonStyle}>تحقق من الترتيب</button></div>
              </>
            ) : (
              <>
                <p style={progressTextStyle}>السؤال {questionIndex + 1} من {currentQuestions.length}</p>
                <h2 style={questionTitleStyle}>{currentQuestion.prompt}</h2>
                <div style={optionGridStyle}>{currentQuestion.options.map((option) => <button key={option} type="button" onClick={() => setSelectedAnswer(option)} disabled={checked} style={{ ...optionStyle, ...(selectedAnswer === option ? selectedOptionStyle : {}) }}>{option}</button>)}</div>
                {checked && <p style={encouragementStyle}>أحسنت على المحاولة! واصل التفكير بهدوء 🌟</p>}
                <div style={actionsStyle}>
                  {!checked ? (
                    <button type="button" onClick={checkChoice} disabled={!selectedAnswer} style={{ ...primaryButtonStyle, opacity: selectedAnswer ? 1 : 0.5 }}>تحقق من الإجابة</button>
                  ) : stationAttemptFinished ? (
                    <button type="button" onClick={retryChoiceStation} style={primaryButtonStyle}>إعادة المحاولة</button>
                  ) : (
                    <button type="button" onClick={nextChoiceQuestion} style={primaryButtonStyle}>{questionIndex === currentQuestions.length - 1 ? "إنهاء المحطة" : "السؤال التالي ←"}</button>
                  )}
                </div>
              </>
            )}
            {message && <p style={encouragementStyle}>{message}</p>}
          </section>
        ) : (
          <>
            <section style={statusCardStyle}>
              <strong>{challengeFinished ? "أكملت تحدّي الأكاديمية!" : "جاهز للتحدّي؟"}</strong>
              <span>{completedCount} من {stations.length} محطات مكتملة</span>
            </section>
            <section style={stationGridStyle}>
              {stations.map((station) => (
                <article key={station.id} style={{ ...stationCardStyle, borderColor: station.background }}>
                  <div style={{ fontSize: 38 }}>{station.icon}</div>
                  <h2 style={{ color: station.color, fontSize: 21 }}>{station.title}</h2>
                  <p style={{ color: "#5f756b", lineHeight: 1.8 }}>{station.description}</p>
                  <button type="button" onClick={() => startStation(station.id)} disabled={Boolean(progress[station.id])} style={{ ...primaryButtonStyle, background: progress[station.id] ? "#8aa69a" : station.color }}>{progress[station.id] ? "✅ مكتملة" : "ابدأ المحطة"}</button>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

const pageStyle = { minHeight: "100vh", padding: "28px 16px 70px", background: "linear-gradient(180deg, #effcf7 0%, #f6fbff 55%, #fffaf0 100%)", color: "#173f32" } as const;
const contentStyle = { width: "100%", maxWidth: 1050, margin: "0 auto" } as const;
const topBarStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" as const, marginBottom: 18 };
const linkStyle = { display: "inline-flex", padding: "11px 16px", borderRadius: 14, background: "#ffffff", color: "#176c46", border: "1px solid #d2e8de", fontWeight: 900, textDecoration: "none" } as const;
const pillStyle = { display: "inline-flex", padding: "9px 14px", borderRadius: 999, background: "#fff7d8", color: "#806000", fontWeight: 900 } as const;
const heroStyle = { padding: "30px 22px", borderRadius: 30, textAlign: "center" as const, background: "linear-gradient(135deg, #eaf9f2, #ffffff, #fff8df)", border: "1px solid #dcefe7", boxShadow: "0 12px 34px rgba(24, 75, 57, 0.08)" };
const eyebrowStyle = { margin: "10px 0 0", color: "#0f8a67", fontWeight: 900 } as const;
const titleStyle = { margin: "7px 0", color: "#14513d", fontSize: "clamp(30px, 6vw, 48px)" } as const;
const subtitleStyle = { maxWidth: 700, margin: "10px auto 0", color: "#5f756b", lineHeight: 1.9, fontSize: 16 } as const;
const statusCardStyle = { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const, marginTop: 16, padding: "16px 19px", borderRadius: 18, background: "#ffffff", border: "1px solid #dcefe7", color: "#176c46", fontWeight: 900 } as const;
const stationGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14, marginTop: 16 } as const;
const stationCardStyle = { padding: 21, borderRadius: 23, background: "#ffffff", border: "2px solid", boxShadow: "0 10px 25px rgba(24, 75, 57, 0.07)" } as const;
const lockedCardStyle = { marginTop: 17, padding: "30px 22px", borderRadius: 25, background: "#ffffff", border: "1px solid #dcefe7", textAlign: "center" as const, boxShadow: "0 12px 30px rgba(24, 75, 57, 0.07)" } as const;
const questionCardStyle = { marginTop: 17, padding: "clamp(20px, 4vw, 34px)", borderRadius: 27, background: "#ffffff", border: "1px solid #dcefe7", boxShadow: "0 14px 38px rgba(24, 75, 57, 0.08)" } as const;
const questionTitleStyle = { margin: "22px 0 18px", color: "#173f32", fontSize: "clamp(21px, 3vw, 28px)", lineHeight: 1.8 } as const;
const progressTextStyle = { margin: "20px 0 0", color: "#718078", fontWeight: 800 } as const;
const optionGridStyle = { display: "grid", gap: 10 } as const;
const optionStyle = { width: "100%", padding: "14px 16px", borderRadius: 15, border: "1px solid #d4e8df", background: "#fbfefd", color: "#245646", font: "inherit", fontSize: 16, fontWeight: 800, textAlign: "right" as const, cursor: "pointer" };
const selectedOptionStyle = { border: "2px solid #16845b", background: "#eefaf4" };
const actionsStyle = { display: "flex", justifyContent: "flex-end", gap: 9, flexWrap: "wrap" as const, marginTop: 22 };
const primaryButtonStyle = { display: "inline-flex", justifyContent: "center", alignItems: "center", minHeight: 45, padding: "10px 17px", border: 0, borderRadius: 13, background: "#0f8a67", color: "#ffffff", font: "inherit", fontWeight: 900, cursor: "pointer", textDecoration: "none" } as const;
const secondaryButtonStyle = { ...linkStyle, minHeight: 45, alignItems: "center", cursor: "pointer" } as const;
const backButtonStyle = { ...linkStyle, cursor: "pointer" } as const;
const encouragementStyle = { margin: "16px 0 0", padding: "11px 13px", borderRadius: 12, background: "#ecfdf5", color: "#176c46", lineHeight: 1.8, fontWeight: 800 } as const;
const eventBoxStyle = { display: "grid", gap: 8, minHeight: 115, marginBottom: 14, padding: 12, borderRadius: 15, background: "#f7fbf8", border: "1px dashed #b9dcca" } as const;
const eventChosenStyle = { padding: "9px 11px", borderRadius: 10, background: "#eaf9f2", color: "#176c46", fontWeight: 800 } as const;
