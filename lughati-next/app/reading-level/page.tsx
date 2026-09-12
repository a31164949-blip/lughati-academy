"use client";

import Link from "next/link";
import { useState } from "react";
import { auth } from "../../firebase";

type Question = {
  id: string;
  skill: string;
  skillNumber: number;
  icon: string;
  prompt: string;
  options: string[];
  answer: string;
};

type ResultProfile = {
  title: string;
  icon: string;
  description: string;
  recommendation: string;
  color: string;
  background: string;
};

type SkillSummary = {
  skill: string;
  icon: string;
  correct: number;
  status: "متقن" | "يحتاج تدريبًا";
};

const questions: Question[] = [
  { id: "letters-1", skill: "الحروف وأصواتها", skillNumber: 1, icon: "🔤", prompt: "أي كلمة تبدأ بصوت حرف «م»؟", options: ["باب", "موز", "نور"], answer: "موز" },
  { id: "letters-2", skill: "الحروف وأصواتها", skillNumber: 1, icon: "🔤", prompt: "أي حرف تسمعه في أول كلمة «شَمْس»؟", options: ["س", "ش", "م"], answer: "ش" },
  { id: "short-vowels-1", skill: "الحركات القصيرة", skillNumber: 2, icon: "✏️", prompt: "كيف نقرأ المقطع «بُ»؟", options: ["بُ", "بَ", "بِ"], answer: "بُ" },
  { id: "short-vowels-2", skill: "الحركات القصيرة", skillNumber: 2, icon: "✏️", prompt: "أي مقطع نقرأه «مِ»؟", options: ["مَ", "مِ", "مُ"], answer: "مِ" },
  { id: "madd-1", skill: "المدود", skillNumber: 3, icon: "🌱", prompt: "أي كلمة فيها مد بالألف؟", options: ["بِنْت", "كُتُب", "باب"], answer: "باب" },
  { id: "madd-2", skill: "المدود", skillNumber: 3, icon: "🌱", prompt: "أي مقطع فيه مد بالواو؟", options: ["نُو", "نَ", "نِي"], answer: "نُو" },
  { id: "marks-1", skill: "السكون والشدة والتنوين", skillNumber: 4, icon: "⭐", prompt: "أي كلمة فيها حرف ساكن؟", options: ["كَتَبَ", "شَمْس", "لَعِبَ"], answer: "شَمْس" },
  { id: "marks-2", skill: "السكون والشدة والتنوين", skillNumber: 4, icon: "⭐", prompt: "أي كلمة تنتهي بتنوين الضم؟", options: ["كتابِ", "كتابَ", "كتابٌ"], answer: "كتابٌ" },
  { id: "syllables-1", skill: "تحليل المقاطع", skillNumber: 5, icon: "🧩", prompt: "ما المقاطع الصحيحة لكلمة «كَتَبَ»؟", options: ["كَتْ / بَ", "كَ / تَ / بَ", "كْ / تَ / بَ"], answer: "كَ / تَ / بَ" },
  { id: "syllables-2", skill: "تحليل المقاطع", skillNumber: 5, icon: "🧩", prompt: "أي ترتيب يكوّن كلمة «مَدْرَسَة»؟", options: ["مَدْ / رَ / سَة", "مَ / دْرَ / سَة", "مَ / دَ / رَ / سَة"], answer: "مَدْ / رَ / سَة" },
  { id: "words-1", skill: "قراءة الكلمات", skillNumber: 6, icon: "📖", prompt: "اختر الكلمة التي نقرأها ونتعلم منها.", options: ["ماء", "كتاب", "ملعب"], answer: "كتاب" },
  { id: "words-2", skill: "قراءة الكلمات", skillNumber: 6, icon: "📖", prompt: "أي كلمة تناسب معنى: مكان نتعلم فيه؟", options: ["مدرسة", "حديقة", "مطبخ"], answer: "مدرسة" },
  { id: "sentences-1", skill: "قراءة الجمل", skillNumber: 7, icon: "📝", prompt: "أي جملة مرتبة ترتيبًا صحيحًا؟", options: ["إلى ذهب سامي المدرسة.", "المدرسة سامي ذهب إلى.", "ذهب سامي إلى المدرسة."], answer: "ذهب سامي إلى المدرسة." },
  { id: "sentences-2", skill: "قراءة الجمل", skillNumber: 7, icon: "📝", prompt: "اختر الجملة التي تخبر أن ليلى تقرأ.", options: ["ليلى ترسم زهرة.", "ليلى تقرأ قصة.", "ليلى تلعب بالكرة."], answer: "ليلى تقرأ قصة." },
  { id: "comprehension-1", skill: "الفهم القرائي", skillNumber: 8, icon: "💡", prompt: "اقرأ: «زَرَعَتْ نُورَةُ نَبْتَةً، وَسَقَتْهَا كُلَّ يَوْمٍ.» ماذا فعلت نورة؟", options: ["قطفت النبتة", "نسيت النبتة", "سقت النبتة"], answer: "سقت النبتة" },
  { id: "comprehension-2", skill: "الفهم القرائي", skillNumber: 8, icon: "💡", prompt: "اقرأ: «عادَ خالدٌ من المدرسة، فرتّب كتبه على الرف.» أين وضع خالد كتبه؟", options: ["على الرف", "في الحقيبة", "تحت الطاولة"], answer: "على الرف" },
];

const skillNames = [
  "الحروف وأصواتها",
  "الحركات القصيرة",
  "المدود",
  "السكون والشدة والتنوين",
  "تحليل المقاطع",
  "قراءة الكلمات",
  "قراءة الجمل",
  "الفهم القرائي",
];

function getResultProfile(skillSummaries: SkillSummary[]): ResultProfile {
  const masteredSkills = skillSummaries.filter(
    (summary) => summary.status === "متقن"
  ).length;
  const readingCoreMastered = skillSummaries
    .slice(0, 6)
    .every((summary) => summary.status === "متقن");

  if (masteredSkills <= 2) {
    return {
      title: "بداية قوية",
      icon: "🌱",
      description: "أظهرت استعدادًا جميلًا، ومع التدريب الهادئ ستتقدم خطوة خطوة.",
      recommendation: "ابدأ بحصص التمكين للقراءة، وركّز على الحروف والحركات القصيرة.",
      color: "#176c46",
      background: "#eaf9f2",
    };
  }

  if (masteredSkills <= 5) {
    return {
      title: "أتقدم بثقة",
      icon: "⭐",
      description: "لديك أساس جيد في عدد من مهارات القراءة، واصل التدريب بثقة.",
      recommendation: "نوصي بحصص التمكين للمدود والمقاطع، مع قراءة كلمات قصيرة يوميًا.",
      color: "#806000",
      background: "#fff8d9",
    };
  }

  if (!readingCoreMastered || masteredSkills < 8) {
    return {
      title: "متقن لمهارات المستوى",
      icon: "🏆",
      description: "قرأت معظم المهارات المستهدفة بإتقان مناسب لمستوى الصف الثاني.",
      recommendation: "واصل التدريب في حصص التمكين على المهارات التي تحتاج ثباتًا، ثم جرّب نصوصًا قصيرة.",
      color: "#146a8a",
      background: "#eaf7ff",
    };
  }

  return {
    title: "قارئ متميز",
    icon: "💎",
    description: "أظهرت أداءً متميزًا في مهارات الحروف والقراءة والفهم.",
    recommendation: "انتقل إلى الركن الإثرائي: نصوص قصيرة وأسئلة استنتاجية وتحديات قراءة ممتعة.",
    color: "#6b3fa0",
    background: "#f5edff",
  };
}

export default function ReadingLevelPage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [answerResults, setAnswerResults] = useState<Record<string, boolean>>({});
  const [answerValues, setAnswerValues] = useState<Record<string, string>>({});
  const [finalResults, setFinalResults] = useState<Record<string, boolean>>({});
  const [finalAnswerValues, setFinalAnswerValues] = useState<Record<string, string>>({});
  const [finalSubmissionId, setFinalSubmissionId] = useState("");
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const currentQuestion = questions[questionIndex];
  const progress = Math.round(((questionIndex + (checked ? 1 : 0)) / questions.length) * 100);

  function chooseAnswer(answer: string) {
    if (checked) return;
    setSelectedAnswer(answer);
  }

  function checkAnswer() {
    if (!selectedAnswer || checked) return;
    setAnswerResults((current) => ({
      ...current,
      [currentQuestion.id]: selectedAnswer === currentQuestion.answer,
    }));
    setAnswerValues((current) => ({
      ...current,
      [currentQuestion.id]: selectedAnswer,
    }));
    setChecked(true);
  }

  function nextQuestion() {
    if (!checked) return;
    const completeResults = {
      ...answerResults,
      [currentQuestion.id]: selectedAnswer === currentQuestion.answer,
    };
    const completeAnswerValues = {
      ...answerValues,
      [currentQuestion.id]: selectedAnswer,
    };
    if (questionIndex === questions.length - 1) {
      setFinalResults(completeResults);
      setFinalAnswerValues(completeAnswerValues);
      setFinalSubmissionId(`reading-level-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      setFinished(true);
      return;
    }
    setQuestionIndex((current) => current + 1);
    setSelectedAnswer("");
    setChecked(false);
  }

  function restart() {
    setQuestionIndex(0);
    setSelectedAnswer("");
    setChecked(false);
    setAnswerResults({});
    setAnswerValues({});
    setFinalResults({});
    setFinalAnswerValues({});
    setFinalSubmissionId("");
    setFinished(false);
    setSubmitMessage("");
  }

  async function submitResult() {
    if (submitting || Object.keys(finalAnswerValues).length !== questions.length) return;

    try {
      setSubmitting(true);
      setSubmitMessage("");
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("يجب تسجيل الدخول بحساب الطالب أولًا.");
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/reading-level/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: questions.map((question) => finalAnswerValues[question.id] ?? ""),
          submissionId: finalSubmissionId,
        }),
      });
      const data = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || data.success !== true) throw new Error(data.message || "تعذر إرسال النتيجة.");
      setSubmitMessage("تم إرسال النتيجة إلى المعلم بنجاح ✅");
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : "تعذر إرسال النتيجة.");
    } finally {
      setSubmitting(false);
    }
  }

  if (finished) {
    const finalScore = Object.values(finalResults).filter(Boolean).length;
    const skillSummaries = skillNames.map((skill) => {
      const skillQuestions = questions.filter((question) => question.skill === skill);
      const correct = skillQuestions.filter((question) => finalResults[question.id] === true).length;

      return {
        skill,
        icon: skillQuestions[0]?.icon ?? "📚",
        correct,
        status: correct === skillQuestions.length ? "متقن" : "يحتاج تدريبًا",
      } as SkillSummary;
    });
    const finalResult = getResultProfile(skillSummaries);

    return (
      <main dir="rtl" style={pageStyle}>
        <div style={contentStyle}>
          <Link href="/" style={backLinkStyle}>← العودة إلى الرئيسية</Link>
          <section style={{ ...heroStyle, textAlign: "center" }}>
            <div style={{ fontSize: 52 }}>{finalResult.icon}</div>
            <p style={eyebrowStyle}>نتيجة تحديد المستوى القرائي</p>
            <h1 style={titleStyle}>{finalResult.title}</h1>
            <p style={subtitleStyle}>{finalResult.description}</p>
            <div style={{ ...scoreBadgeStyle, background: finalResult.background, color: finalResult.color }}>
              {finalScore} من {questions.length} إجابات صحيحة
            </div>
          </section>
          <section style={resultCardStyle}>
            <h2 style={{ marginTop: 0, color: "#14513d" }}>خطوتك التالية</h2>
            <p style={{ margin: 0, color: "#536b62", lineHeight: 1.9 }}>{finalResult.recommendation}</p>
            <div style={{ display: "grid", gap: 9, marginTop: 20 }}>
              {skillSummaries.map((summary) => (
                <div key={summary.skill} style={skillSummaryStyle}>
                  <span>{summary.icon} {summary.skill}</span>
                  <strong style={{ color: summary.status === "متقن" ? "#087f5b" : "#a14b16" }}>
                    {summary.status}
                  </strong>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
              <button type="button" onClick={restart} style={primaryButtonStyle}>🔄 إعادة الاختبار</button>
              <button type="button" onClick={() => void submitResult()} disabled={submitting || Boolean(submitMessage.includes("بنجاح"))} style={{ ...primaryButtonStyle, opacity: submitting || submitMessage.includes("بنجاح") ? 0.65 : 1 }}>
                {submitting ? "جارٍ الإرسال..." : submitMessage.includes("بنجاح") ? "تم الإرسال ✅" : "إرسال النتيجة للمعلم"}
              </button>
              <Link href={finalResult.title === "قارئ متميز" ? "/reading" : "/support"} style={secondaryButtonStyle}>
                {finalResult.title === "قارئ متميز" ? "📚 الركن الإثرائي" : "🌱 حصص التمكين"}
              </Link>
              <Link href="/" style={secondaryButtonStyle}>العودة إلى الرئيسية</Link>
            </div>
            {submitMessage && <p style={{ ...feedbackStyle, marginTop: 14, color: submitMessage.includes("بنجاح") ? "#087f5b" : "#a14b16", background: submitMessage.includes("بنجاح") ? "#ecfdf5" : "#fff5e9" }}>{submitMessage}</p>}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <div style={contentStyle}>
        <div style={topBarStyle}>
          <Link href="/" style={backLinkStyle}>← العودة إلى الرئيسية</Link>
          <span style={pillStyle}>🎯 للصف الثاني الابتدائي</span>
        </div>

        <header style={heroStyle}>
          <div style={{ fontSize: 44 }}>📚</div>
          <p style={eyebrowStyle}>ركن تحديد المستوى القرائي</p>
          <h1 style={titleStyle}>أقرأ، أفهم، وأتقدم</h1>
          <p style={subtitleStyle}>اختبار قصير ومتدرج يساعدك على معرفة مهاراتك القرائية. اختر الإجابة بهدوء، فكل محاولة تعلم جديد.</p>
        </header>

        <section style={progressCardStyle} aria-label="تقدم الاختبار">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "#176c46", fontWeight: 900 }}>
            <span>السؤال {questionIndex + 1} من {questions.length}</span>
            <span>{progress}%</span>
          </div>
          <div style={progressTrackStyle}><div style={{ ...progressBarStyle, width: `${progress}%` }} /></div>
          <div style={skillRowStyle}>{skillNames.map((skill, index) => <span key={skill} style={{ ...skillDotStyle, background: index < currentQuestion.skillNumber ? "#16845b" : "#dcece4" }} aria-label={skill} />)}</div>
        </section>

        <section style={questionCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={questionIconStyle}>{currentQuestion.icon}</span>
            <div><p style={{ margin: 0, color: "#0f8a67", fontWeight: 900 }}>المهارة {currentQuestion.skillNumber}</p><h2 style={{ margin: "4px 0 0", color: "#174c3b", fontSize: 23 }}>{currentQuestion.skill}</h2></div>
          </div>
          <p style={questionTextStyle}>{currentQuestion.prompt}</p>
          <div style={{ display: "grid", gap: 10 }}>
            {currentQuestion.options.map((option) => {
              const isSelected = selectedAnswer === option;
              return <button key={option} type="button" onClick={() => chooseAnswer(option)} style={{ ...optionStyle, ...(isSelected ? selectedOptionStyle : {}) }} disabled={checked}>{option}</button>;
            })}
          </div>
          {checked && <p style={{ ...feedbackStyle, color: "#176c46", background: "#ecfdf5" }}>أحسنت على محاولتك! واصل التقدم بهدوء 🌟</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
            {!checked ? <button type="button" onClick={checkAnswer} disabled={!selectedAnswer} style={{ ...primaryButtonStyle, opacity: selectedAnswer ? 1 : 0.5 }}>تحقق من الإجابة</button> : <button type="button" onClick={nextQuestion} style={primaryButtonStyle}>{questionIndex === questions.length - 1 ? "عرض النتيجة" : "السؤال التالي ←"}</button>}
          </div>
        </section>
      </div>
    </main>
  );
}

const pageStyle = { minHeight: "100vh", padding: "28px 16px 70px", background: "linear-gradient(180deg, #effcf7 0%, #f6fbff 55%, #fffaf0 100%)", color: "#173f32" } as const;
const contentStyle = { width: "100%", maxWidth: 980, margin: "0 auto" } as const;
const topBarStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" as const, marginBottom: 18 };
const backLinkStyle = { display: "inline-flex", padding: "11px 16px", borderRadius: 14, background: "#ffffff", color: "#176c46", border: "1px solid #d2e8de", fontWeight: 900, textDecoration: "none" } as const;
const pillStyle = { display: "inline-flex", padding: "9px 14px", borderRadius: 999, background: "#fff7d8", color: "#806000", fontWeight: 900 } as const;
const heroStyle = { padding: "30px 22px", borderRadius: 30, textAlign: "center" as const, background: "linear-gradient(135deg, #eaf9f2, #ffffff, #eef8ff)", border: "1px solid #dcefe7", boxShadow: "0 12px 34px rgba(24, 75, 57, 0.08)" };
const eyebrowStyle = { margin: "10px 0 0", color: "#0f8a67", fontWeight: 900 } as const;
const titleStyle = { margin: "7px 0", color: "#14513d", fontSize: "clamp(29px, 6vw, 48px)" } as const;
const subtitleStyle = { maxWidth: 680, margin: "10px auto 0", color: "#5f756b", lineHeight: 1.9, fontSize: 16 } as const;
const progressCardStyle = { marginTop: 16, padding: "17px 19px", borderRadius: 20, background: "#ffffff", border: "1px solid #dcefe7" } as const;
const progressTrackStyle = { height: 9, marginTop: 11, overflow: "hidden", borderRadius: 999, background: "#eaf4ef" } as const;
const progressBarStyle = { height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #16845b, #55b993)", transition: "width .25s ease" } as const;
const skillRowStyle = { display: "flex", gap: 5, marginTop: 12 } as const;
const skillDotStyle = { width: 9, height: 9, borderRadius: "50%" } as const;
const questionCardStyle = { marginTop: 16, padding: "clamp(20px, 4vw, 34px)", borderRadius: 28, background: "#ffffff", border: "1px solid #dcefe7", boxShadow: "0 14px 38px rgba(24, 75, 57, 0.08)" } as const;
const questionIconStyle = { display: "grid", placeItems: "center", width: 54, height: 54, borderRadius: 17, background: "#eaf9f2", fontSize: 28 } as const;
const questionTextStyle = { margin: "27px 0 18px", color: "#173f32", fontSize: "clamp(19px, 3vw, 25px)", fontWeight: 900, lineHeight: 1.9 } as const;
const optionStyle = { width: "100%", padding: "14px 16px", borderRadius: 15, border: "1px solid #d4e8df", background: "#fbfefd", color: "#245646", font: "inherit", fontSize: 16, fontWeight: 800, textAlign: "right" as const, cursor: "pointer" };
const selectedOptionStyle = { border: "2px solid #16845b", background: "#eefaf4" };
const feedbackStyle = { margin: "17px 0 0", padding: "12px 14px", borderRadius: 13, lineHeight: 1.8, fontWeight: 800 } as const;
const primaryButtonStyle = { display: "inline-flex", justifyContent: "center", alignItems: "center", minHeight: 46, padding: "10px 18px", border: 0, borderRadius: 13, background: "#0f8a67", color: "#ffffff", font: "inherit", fontWeight: 900, cursor: "pointer", textDecoration: "none" } as const;
const secondaryButtonStyle = { ...backLinkStyle, minHeight: 46, alignItems: "center" } as const;
const scoreBadgeStyle = { display: "inline-flex", marginTop: 17, padding: "11px 17px", borderRadius: 999, fontWeight: 900 } as const;
const resultCardStyle = { marginTop: 17, padding: "24px 22px", borderRadius: 24, background: "#ffffff", border: "1px solid #dcefe7", boxShadow: "0 12px 30px rgba(24, 75, 57, 0.07)" } as const;
const skillSummaryStyle = { display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderRadius: 12, background: "#f7fbf8", color: "#245646", fontWeight: 800 } as const;
