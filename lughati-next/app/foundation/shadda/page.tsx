"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Question = {
  id: number;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

const worksheetQuestions: Question[] = [
  {
    id: 1,
    prompt: "اختر الكلمة التي تحتوي على شدة:",
    options: ["كَتَبَ", "مُعَلِّم", "لَعِبَ"],
    answer: "مُعَلِّم",
    explanation: "في كلمة «مُعَلِّم» اللام مشددة: لِّ.",
  },
  {
    id: 2,
    prompt: "أي مقطع يحتوي على حرف مشدد؟",
    options: ["بَ", "بَّ", "بُ"],
    answer: "بَّ",
    explanation: "علامة الشدة فوق الحرف: ّ",
  },
  {
    id: 3,
    prompt: "اختر القراءة الصحيحة للمقطع «مَّ»:",
    options: ["مَ", "مَّ", "مُ"],
    answer: "مَّ",
    explanation: "الحرف المشدد يُنطق أقوى قليلًا من الحرف غير المشدد.",
  },
  {
    id: 4,
    prompt: "أي كلمة تحتوي على شدة؟",
    options: ["سَمَك", "جَدَّة", "قَمَر"],
    answer: "جَدَّة",
    explanation: "في كلمة «جَدَّة» الدال مشددة: دَّ.",
  },
  {
    id: 5,
    prompt: "فكّ الحرف المشدد «لَّ» إلى صوتين:",
    options: ["لْ + لَ", "لَ + لَ", "لُ + لَ"],
    answer: "لْ + لَ",
    explanation: "الحرف المشدد يتكوّن من حرف ساكن ثم حرف متحرك من الجنس نفسه.",
  },
  {
    id: 6,
    prompt: "اختر الكلمة التي فيها حرف مشدد:",
    options: ["أُمّ", "أَب", "أَخ"],
    answer: "أُمّ",
    explanation: "في كلمة «أُمّ» الميم مشددة: مّ.",
  },
];

const masteryQuestions: Question[] = [
  {
    id: 1,
    prompt: "اختر الحرف المشدد:",
    options: ["سَ", "سَّ", "سُ"],
    answer: "سَّ",
    explanation: "سَّ حرف مشدد.",
  },
  {
    id: 2,
    prompt: "اختر الكلمة التي تحتوي على شدة:",
    options: ["مَدْرَسَة", "قِطَّة", "كِتَاب"],
    answer: "قِطَّة",
    explanation: "في كلمة «قِطَّة» الطاء مشددة.",
  },
  {
    id: 3,
    prompt: "فكّ «بِّ» إلى صوتين:",
    options: ["بْ + بِ", "بِ + بِ", "بُ + بِ"],
    answer: "بْ + بِ",
    explanation: "الشدة تعني حرفًا ساكنًا ثم الحرف نفسه متحركًا.",
  },
];

const examples = [
  { plain: "دَ", strong: "دَّ", label: "دال مشددة" },
  { plain: "لِ", strong: "لِّ", label: "لام مشددة" },
  { plain: "مُ", strong: "مُّ", label: "ميم مشددة" },
];

export default function ShaddaFoundationPage() {
  const [step, setStep] = useState(0);
  const [practiceChoice, setPracticeChoice] = useState("");
  const [feedback, setFeedback] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [worksheetScore, setWorksheetScore] = useState(0);
  const [masteryIndex, setMasteryIndex] = useState(0);
  const [masteryScore, setMasteryScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentQuestion = worksheetQuestions[questionIndex];
  const currentMastery = masteryQuestions[masteryIndex];
  const answeredCount = Object.keys(answers).length;

  const progress = useMemo(() => {
    if (step === 0) return 15;
    if (step === 1) return 30;
    if (step === 2) return 45 + Math.round((answeredCount / worksheetQuestions.length) * 25);
    if (step === 3) return 80;
    if (step === 4) {
      return finished
        ? 100
        : 85 + Math.round((masteryIndex / masteryQuestions.length) * 15);
    }
    return 100;
  }, [step, answeredCount, masteryIndex, finished]);

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = 0.68;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function choosePractice(option: string) {
    setPracticeChoice(option);

    if (option === "نَّ") {
      setFeedback("✅ ممتاز! هذه نون مشددة: نَّ.");
    } else {
      setFeedback("🌱 ابحث عن علامة الشدة فوق الحرف.");
    }
  }

  function answerWorksheet(option: string) {
    if (!currentQuestion || answers[currentQuestion.id]) return;

    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: option,
    }));

    const correct = option === currentQuestion.answer;

    if (correct) {
      setWorksheetScore((score) => score + 1);
      setFeedback(`✅ أحسنت! ${currentQuestion.explanation}`);
    } else {
      setFeedback(`🌱 راجع علامة الشدة. ${currentQuestion.explanation}`);
    }
  }

  function nextWorksheetQuestion() {
    setFeedback("");

    if (questionIndex < worksheetQuestions.length - 1) {
      setQuestionIndex((index) => index + 1);
    } else {
      setStep(3);
    }
  }

  function answerMastery(option: string) {
    if (!currentMastery) return;

    const correct = option === currentMastery.answer;

    if (masteryIndex < masteryQuestions.length - 1) {
      if (correct) setMasteryScore((score) => score + 1);
      setMasteryIndex((index) => index + 1);
    } else {
      const finalScore = masteryScore + (correct ? 1 : 0);
      setMasteryScore(finalScore);
      setFinished(true);
    }
  }

  function restart() {
    setStep(0);
    setPracticeChoice("");
    setFeedback("");
    setQuestionIndex(0);
    setAnswers({});
    setWorksheetScore(0);
    setMasteryIndex(0);
    setMasteryScore(0);
    setFinished(false);
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <div style={styles.topRow}>
          <Link href="/foundation" style={styles.backButton}>
            ← العودة إلى أساس لغتي
          </Link>
          <div style={styles.badge}>🌱 أساس لغتي</div>
        </div>

        <header style={styles.hero}>
          <div>
            <p style={styles.eyebrow}>مهمتك الصغيرة اليوم</p>
            <h1 style={styles.title}>✨ الشَّدَّة</h1>
            <p style={styles.subtitle}>
              نتعلم كيف نقرأ الحرف المشدد، ثم نفكّه إلى حرفين ونركّبه من جديد.
            </p>
          </div>

          <div style={styles.timeCard}>
            <strong>⏱️ 5 دقائق</strong>
            <span>تدريب قصير وواضح</span>
          </div>
        </header>

        <div style={styles.progressWrap}>
          <div style={styles.progressLabels}>
            <span>تقدمك</span>
            <strong>{progress}%</strong>
          </div>

          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }} />
          </div>
        </div>

        {step === 0 && (
          <section style={styles.card}>
            <span style={styles.stepPill}>👂 1. اسمع واكتشف</span>
            <h2 style={styles.cardTitle}>ما الشدة؟</h2>

            <p style={styles.largeText}>
              الشدة تعني أن الحرف يُنطق بقوة أكبر، وكأنه حرفان من النوع نفسه.
            </p>

            <div style={styles.examplesGrid}>
              {examples.map((example) => (
                <article key={example.label} style={styles.exampleCard}>
                  <strong style={styles.exampleLabel}>{example.label}</strong>

                  <div style={styles.compareRow}>
                    <button
                      type="button"
                      style={styles.normalSoundButton}
                      onClick={() => speak(example.plain)}
                    >
                      🔊 {example.plain}
                    </button>

                    <span style={styles.arrow}>←</span>

                    <button
                      type="button"
                      style={styles.strongSoundButton}
                      onClick={() => speak(example.strong)}
                    >
                      🔊 {example.strong}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div style={styles.discoveryNote}>
              <strong>لاحظ 👇</strong>
              <div style={styles.breakdown}>
                <span style={styles.breakPart}>لْ</span>
                <span style={styles.plus}>+</span>
                <span style={styles.breakPart}>لَ</span>
                <span style={styles.equals}>=</span>
                <span style={styles.strongPart}>لَّ</span>
              </div>

              <p>
                الحرف المشدد يتكوّن من حرف ساكن ثم الحرف نفسه متحركًا.
              </p>
            </div>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => {
                setFeedback("");
                setStep(1);
              }}
            >
              فهمت، دعني أجرّب ←
            </button>
          </section>
        )}

        {step === 1 && (
          <section style={styles.card}>
            <span style={styles.stepPill}>✋ 2. جرّب بنفسك</span>
            <h2 style={styles.cardTitle}>أين الحرف المشدد؟</h2>

            <p style={styles.largeText}>
              اختر الحرف الذي عليه شدة.
            </p>

            <div style={styles.choiceGrid}>
              {["نَ", "نَّ", "نُ"].map((option) => (
                <button
                  key={option}
                  type="button"
                  style={{
                    ...styles.choiceButton,
                    ...(practiceChoice === option
                      ? styles.choiceButtonSelected
                      : {}),
                  }}
                  onClick={() => {
                    speak(option);
                    choosePractice(option);
                  }}
                >
                  🔊 {option}
                </button>
              ))}
            </div>

            {feedback && <div style={styles.feedback}>{feedback}</div>}

            <button
              type="button"
              style={{
                ...styles.primaryButton,
                opacity: practiceChoice === "نَّ" ? 1 : 0.55,
              }}
              disabled={practiceChoice !== "نَّ"}
              onClick={() => {
                setFeedback("");
                setStep(2);
              }}
            >
              ابدأ ورقة العمل الإلكترونية ←
            </button>
          </section>
        )}

        {step === 2 && currentQuestion && (
          <section style={styles.card}>
            <div style={styles.cardTop}>
              <span style={styles.stepPill}>📝 3. ورقة إلكترونية قصيرة</span>
              <strong style={styles.counter}>
                {questionIndex + 1} / {worksheetQuestions.length}
              </strong>
            </div>

            <h2 style={styles.question}>{currentQuestion.prompt}</h2>

            <div style={styles.options}>
              {currentQuestion.options.map((option) => {
                const selected = answers[currentQuestion.id] === option;
                const locked = Boolean(answers[currentQuestion.id]);

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={locked}
                    style={{
                      ...styles.optionButton,
                      ...(selected ? styles.optionSelected : {}),
                    }}
                    onClick={() => answerWorksheet(option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {feedback && (
              <>
                <div style={styles.feedback}>{feedback}</div>

                <button
                  type="button"
                  style={styles.primaryButton}
                  onClick={nextWorksheetQuestion}
                >
                  {questionIndex === worksheetQuestions.length - 1
                    ? "انتقل للتحدي 🎮"
                    : "السؤال التالي ←"}
                </button>
              </>
            )}
          </section>
        )}

        {step === 3 && (
          <section style={styles.card}>
            <span style={styles.stepPill}>🎮 4. تحدي سريع</span>
            <h2 style={styles.cardTitle}>فكّ الشدة</h2>

            <p style={styles.largeText}>
              حصلت في التدريب على{" "}
              <strong>
                {worksheetScore} من {worksheetQuestions.length}
              </strong>
              .
            </p>

            <div style={styles.challengeBox}>
              <div style={styles.challengeIcon}>🧩</div>
              <div>
                <strong>مهمة فارس</strong>
                <p style={styles.challengeText}>
                  استمع للحروف المشددة، ثم حاول أن تتخيل الحرفين الموجودين داخلها.
                </p>
              </div>
            </div>

            <div style={styles.challengeSounds}>
              {["دَّ", "مِّ", "رُّ", "سَّ", "لِّ", "بُّ"].map((sound) => (
                <button
                  key={sound}
                  type="button"
                  style={styles.wordChip}
                  onClick={() => speak(sound)}
                >
                  🔊 {sound}
                </button>
              ))}
            </div>

            <div style={styles.ruleBox}>
              <strong>قاعدة البطل 🌟</strong>
              <p>
                الشدة = حرف ساكن + الحرف نفسه متحرك.
              </p>
            </div>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => setStep(4)}
            >
              أنا جاهز لاختبار الإتقان 🏆
            </button>
          </section>
        )}

        {step === 4 && !finished && currentMastery && (
          <section style={styles.card}>
            <div style={styles.cardTop}>
              <span style={styles.stepPill}>🏆 5. تحقق من الإتقان</span>
              <strong style={styles.counter}>
                {masteryIndex + 1} / {masteryQuestions.length}
              </strong>
            </div>

            <h2 style={styles.question}>{currentMastery.prompt}</h2>

            <div style={styles.options}>
              {currentMastery.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  style={styles.optionButton}
                  onClick={() => answerMastery(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 4 && finished && (
          <section style={styles.successCard}>
            <div style={styles.trophy}>
              {masteryScore === 3 ? "🏆" : "🌱"}
            </div>

            <h2 style={styles.successTitle}>
              {masteryScore >= 2
                ? "أحسنت يا بطل!"
                : "اقتربت جدًا يا بطل!"}
            </h2>

            <p style={styles.successText}>
              {masteryScore >= 2
                ? "أتقنت مهارة الشدة وأصبحت قادرًا على قراءة الحرف المشدد وفكّه."
                : "نحتاج جولة قصيرة إضافية على الحرف المشدد."}
            </p>

            <div style={styles.resultCard}>
              <span>نتيجة الإتقان</span>
              <strong>
                {masteryScore} / {masteryQuestions.length}
              </strong>
            </div>

            <div style={styles.finalActions}>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={restart}
              >
                🔄 أعد التدريب
              </button>

              <Link href="/foundation" style={styles.primaryLink}>
                العودة إلى أساس لغتي ←
              </Link>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#f4fbf7 0%,#f8fbff 48%,#fffaf0 100%)",
    padding: "24px 14px 50px",
    fontFamily: "Tahoma, Arial, sans-serif",
    color: "#173f31",
  },
  shell: { maxWidth: "980px", margin: "0 auto" },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },
  backButton: {
    textDecoration: "none",
    color: "#176c46",
    background: "#ffffff",
    border: "1px solid #d9ebe2",
    borderRadius: "14px",
    padding: "10px 14px",
    fontWeight: 900,
  },
  badge: {
    background: "#e7f8ef",
    color: "#0f7a4f",
    border: "1px solid #cfeadd",
    borderRadius: "999px",
    padding: "9px 14px",
    fontWeight: 900,
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
    background:
      "linear-gradient(135deg,#5d477b 0%,#7b5aa6 58%,#9d7bc5 100%)",
    color: "#ffffff",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 18px 40px rgba(85,65,120,.16)",
  },
  eyebrow: {
    margin: "0 0 5px",
    fontSize: "14px",
    fontWeight: 900,
    color: "#f2eaff",
  },
  title: {
    margin: 0,
    fontSize: "clamp(30px,5vw,48px)",
  },
  subtitle: {
    margin: "8px 0 0",
    lineHeight: 1.8,
    maxWidth: "620px",
    color: "#fbf8ff",
    fontWeight: 700,
  },
  timeCard: {
    minWidth: "150px",
    padding: "14px 16px",
    borderRadius: "18px",
    background: "rgba(255,255,255,.14)",
    border: "1px solid rgba(255,255,255,.18)",
    display: "grid",
    gap: "4px",
    textAlign: "center",
  },
  progressWrap: {
    margin: "16px 0",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "13px 15px",
    border: "1px solid #e8e0ee",
  },
  progressLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontWeight: 900,
  },
  progressTrack: {
    height: "10px",
    borderRadius: "999px",
    background: "#eee9f2",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg,#7f60a8,#ad8bd1)",
    transition: "width .3s ease",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e8e0ee",
    borderRadius: "26px",
    padding: "24px",
    boxShadow: "0 14px 34px rgba(70,50,95,.08)",
  },
  successCard: {
    background: "linear-gradient(180deg,#ffffff,#f8f3fb)",
    border: "1px solid #e4d9eb",
    borderRadius: "30px",
    padding: "32px 24px",
    textAlign: "center",
    boxShadow: "0 16px 36px rgba(70,50,95,.10)",
  },
  stepPill: {
    display: "inline-flex",
    background: "#f1eaf7",
    color: "#6e4e91",
    borderRadius: "999px",
    padding: "8px 12px",
    fontWeight: 900,
    fontSize: "14px",
  },
  cardTitle: {
    margin: "16px 0 8px",
    fontSize: "28px",
  },
  largeText: {
    fontSize: "19px",
    lineHeight: 1.9,
    color: "#5d6470",
  },
  examplesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
    gap: "14px",
    margin: "22px 0",
  },
  exampleCard: {
    background: "linear-gradient(180deg,#ffffff,#faf7fc)",
    border: "1px solid #e6ddeb",
    borderRadius: "22px",
    padding: "18px",
    textAlign: "center",
  },
  exampleLabel: {
    display: "block",
    color: "#624782",
    fontSize: "17px",
  },
  compareRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: "8px",
    marginTop: "15px",
  },
  normalSoundButton: {
    border: "1px solid #e0d8e6",
    background: "#ffffff",
    borderRadius: "14px",
    padding: "11px",
    color: "#5e6470",
    fontSize: "18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  strongSoundButton: {
    border: "2px solid #b99dce",
    background: "#f6effa",
    borderRadius: "14px",
    padding: "11px",
    color: "#654487",
    fontSize: "21px",
    fontWeight: 900,
    cursor: "pointer",
  },
  arrow: {
    color: "#9b8fa2",
    fontWeight: 900,
  },
  discoveryNote: {
    background: "#fff9e8",
    border: "1px solid #f0dfaa",
    borderRadius: "20px",
    padding: "17px",
    textAlign: "center",
    lineHeight: 1.8,
  },
  breakdown: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "11px",
    flexWrap: "wrap",
    margin: "14px 0",
  },
  breakPart: {
    minWidth: "72px",
    textAlign: "center",
    padding: "15px",
    borderRadius: "16px",
    background: "#ffffff",
    border: "2px solid #e1d7e7",
    fontSize: "30px",
    fontWeight: 900,
  },
  strongPart: {
    minWidth: "82px",
    textAlign: "center",
    padding: "15px",
    borderRadius: "16px",
    background: "#f3eaf8",
    border: "2px solid #b99dce",
    color: "#60427f",
    fontSize: "31px",
    fontWeight: 900,
  },
  plus: { fontSize: "25px", fontWeight: 900 },
  equals: { fontSize: "25px", fontWeight: 900 },
  choiceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
    gap: "12px",
    margin: "20px 0",
  },
  choiceButton: {
    border: "2px solid #e1d8e7",
    borderRadius: "18px",
    background: "#ffffff",
    padding: "22px",
    fontSize: "28px",
    fontWeight: 900,
    color: "#5f4678",
    cursor: "pointer",
  },
  choiceButtonSelected: {
    borderTopColor: "#8f6bad",
    borderRightColor: "#8f6bad",
    borderBottomColor: "#8f6bad",
    borderLeftColor: "#8f6bad",
    background: "#f7f1fa",
  },
  feedback: {
    marginTop: "14px",
    padding: "14px",
    borderRadius: "16px",
    background: "#f8f3fb",
    border: "1px solid #e6daed",
    lineHeight: 1.8,
    fontWeight: 800,
  },
  primaryButton: {
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg,#77539a,#5e3e80)",
    color: "#ffffff",
    borderRadius: "16px",
    padding: "14px 18px",
    fontWeight: 900,
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "12px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  counter: { color: "#716679" },
  question: {
    margin: "22px 0",
    fontSize: "clamp(22px,4vw,30px)",
    lineHeight: 1.6,
  },
  options: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
    gap: "12px",
  },
  optionButton: {
    border: "2px solid #e2d9e8",
    background: "#ffffff",
    color: "#5d4476",
    borderRadius: "18px",
    padding: "17px",
    fontSize: "24px",
    fontWeight: 900,
    cursor: "pointer",
  },
  optionSelected: {
    borderTopColor: "#8f6bad",
    borderRightColor: "#8f6bad",
    borderBottomColor: "#8f6bad",
    borderLeftColor: "#8f6bad",
    background: "#f4edf8",
  },
  challengeBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    borderRadius: "18px",
    background: "#fff8e6",
    border: "1px solid #f2dfaa",
    fontSize: "18px",
  },
  challengeIcon: { fontSize: "38px" },
  challengeText: {
    margin: "5px 0 0",
    color: "#6d6a55",
    lineHeight: 1.7,
    fontSize: "14px",
  },
  challengeSounds: {
    display: "flex",
    gap: "9px",
    flexWrap: "wrap",
    margin: "18px 0",
  },
  wordChip: {
    border: "1px solid #ddd2e5",
    background: "#fbf8fd",
    color: "#684b85",
    borderRadius: "999px",
    padding: "11px 15px",
    fontSize: "18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  ruleBox: {
    padding: "15px",
    borderRadius: "17px",
    background: "#eef8ff",
    border: "1px solid #d7eaf8",
    color: "#285b75",
    lineHeight: 1.8,
  },
  trophy: { fontSize: "72px" },
  successTitle: {
    margin: "10px 0 5px",
    fontSize: "32px",
    color: "#654485",
  },
  successText: {
    color: "#67616d",
    fontSize: "17px",
    lineHeight: 1.8,
  },
  resultCard: {
    margin: "20px auto",
    maxWidth: "260px",
    padding: "16px",
    borderRadius: "18px",
    background: "#ffffff",
    border: "1px solid #e3d9e9",
    display: "grid",
    gap: "7px",
  },
  finalActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  secondaryButton: {
    border: "1px solid #dfd5e5",
    background: "#ffffff",
    color: "#684b85",
    borderRadius: "15px",
    padding: "12px 16px",
    fontWeight: 900,
    cursor: "pointer",
  },
  primaryLink: {
    textDecoration: "none",
    background: "#77539a",
    color: "#ffffff",
    borderRadius: "15px",
    padding: "12px 16px",
    fontWeight: 900,
  },
};