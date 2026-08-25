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
    prompt: "اختر الحرف الذي عليه فتحة:",
    options: ["بَ", "بُ", "بِ"],
    answer: "بَ",
    explanation: "الفتحة توضع فوق الحرف ونقرأ: بَ.",
  },
  {
    id: 2,
    prompt: "اختر الحرف الذي عليه ضمة:",
    options: ["تِ", "تُ", "تَ"],
    answer: "تُ",
    explanation: "الضمة توضع فوق الحرف ونقرأ: تُ.",
  },
  {
    id: 3,
    prompt: "اختر الحرف الذي عليه كسرة:",
    options: ["سَ", "سِ", "سُ"],
    answer: "سِ",
    explanation: "الكسرة توضع تحت الحرف ونقرأ: سِ.",
  },
  {
    id: 4,
    prompt: "أي مقطع نقرأه «مَ»؟",
    options: ["مُ", "مِ", "مَ"],
    answer: "مَ",
    explanation: "عندما تكون الفتحة فوق الميم نقرأ: مَ.",
  },
  {
    id: 5,
    prompt: "اختر القراءة الصحيحة للحرف «لُ»:",
    options: ["لَ", "لُ", "لِ"],
    answer: "لُ",
    explanation: "الضمة على اللام تجعلنا نقرأ: لُ.",
  },
  {
    id: 6,
    prompt: "أي كلمة تبدأ بحرف مكسور؟",
    options: ["بِنْت", "كَتَبَ", "مُدُن"],
    answer: "بِنْت",
    explanation: "في كلمة «بِنْت» تبدأ الباء بكسرة: بِ.",
  },
];

const masteryQuestions: Question[] = [
  {
    id: 1,
    prompt: "اختر الحرف المفتوح:",
    options: ["رِ", "رَ", "رُ"],
    answer: "رَ",
    explanation: "رَ حرف مفتوح.",
  },
  {
    id: 2,
    prompt: "اختر الحرف المضموم:",
    options: ["فُ", "فَ", "فِ"],
    answer: "فُ",
    explanation: "فُ حرف مضموم.",
  },
  {
    id: 3,
    prompt: "اختر الحرف المكسور:",
    options: ["نَ", "نُ", "نِ"],
    answer: "نِ",
    explanation: "نِ حرف مكسور.",
  },
];

const soundGroups = [
  { label: "الفتحة", examples: ["بَ", "تَ", "مَ"], symbol: "َ", hint: "صوت قصير مفتوح" },
  { label: "الضمة", examples: ["بُ", "تُ", "مُ"], symbol: "ُ", hint: "صوت قصير مضموم" },
  { label: "الكسرة", examples: ["بِ", "تِ", "مِ"], symbol: "ِ", hint: "صوت قصير مكسور" },
];

export default function HarakatFoundationPage() {
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
    if (step === 2) {
      return 45 + Math.round((answeredCount / worksheetQuestions.length) * 25);
    }
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
    utterance.rate = 0.72;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }

  function choosePractice(option: string) {
    setPracticeChoice(option);

    if (option === "مِ") {
      setFeedback("✅ ممتاز! الكسرة تحت الحرف، لذلك نقرأ: مِ.");
    } else {
      setFeedback("🌱 جرّب مرة أخرى، وابحث عن الحركة الموجودة تحت الحرف.");
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
      setFeedback(`🌱 راجع الحركة ثم جرّب في السؤال التالي. ${currentQuestion.explanation}`);
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
      if (correct) {
        setMasteryScore((score) => score + 1);
      }

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
            <h1 style={styles.title}>🎨 الحركات القصيرة</h1>
            <p style={styles.subtitle}>
              نراجع الفتحة والضمة والكسرة بطريقة سريعة، ثم نتأكد من الإتقان.
            </p>
          </div>

          <div style={styles.timeCard}>
            <strong>⏱️ 4 دقائق</strong>
            <span>تدريب قصير بلا حشو</span>
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
            <span style={styles.stepPill}>👀 1. شاهد واكتشف</span>
            <h2 style={styles.cardTitle}>الحركة تغيّر صوت الحرف</h2>

            <p style={styles.largeText}>
              الحرف نفسه يمكن أن نقرأه بثلاثة أصوات قصيرة:
            </p>

            <div style={styles.soundGrid}>
              {soundGroups.map((group) => (
                <article key={group.label} style={styles.soundCard}>
                  <div style={styles.soundSymbol}>{group.symbol}</div>
                  <strong style={styles.soundTitle}>{group.label}</strong>
                  <span style={styles.soundHint}>{group.hint}</span>

                  <div style={styles.soundExamples}>
                    {group.examples.map((example) => (
                      <button
                        key={example}
                        type="button"
                        style={styles.soundExampleButton}
                        onClick={() => speak(example)}
                      >
                        🔊 {example}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div style={styles.discoveryNote}>
              <strong>لاحظ 👇</strong>
              <div style={styles.discoveryExample}>
                <span>بَ</span>
                <span>بُ</span>
                <span>بِ</span>
              </div>
              <p>
                الحرف واحد، لكن الحركة تغيّر طريقة نطقه.
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
            <h2 style={styles.cardTitle}>أين الكسرة؟</h2>

            <p style={styles.largeText}>
              اختر الحرف الذي نقرأه <strong>«مِ»</strong>.
            </p>

            <div style={styles.choiceGrid}>
              {["مَ", "مُ", "مِ"].map((option) => (
                <button
                  key={option}
                  type="button"
                  style={{
                    ...styles.choiceButton,
                    ...(practiceChoice === option
                      ? styles.choiceButtonSelected
                      : {}),
                  }}
                  onClick={() => choosePractice(option)}
                >
                  {option}
                </button>
              ))}
            </div>

            {feedback && <div style={styles.feedback}>{feedback}</div>}

            <button
              type="button"
              style={{
                ...styles.primaryButton,
                opacity: practiceChoice === "مِ" ? 1 : 0.55,
              }}
              disabled={practiceChoice !== "مِ"}
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
            <h2 style={styles.cardTitle}>محقق الحركات</h2>

            <p style={styles.largeText}>
              حصلت في التدريب على{" "}
              <strong>
                {worksheetScore} من {worksheetQuestions.length}
              </strong>
              .
            </p>

            <div style={styles.challengeBox}>
              <div style={styles.challengeIcon}>🕵️</div>

              <div>
                <strong>مهمة فارس</strong>
                <p style={styles.challengeText}>
                  استمع إلى المقاطع، ثم لاحظ كيف يتغير الصوت مع الحركة.
                </p>
              </div>
            </div>

            <div style={styles.challengeSounds}>
              {["دَ", "دُ", "دِ", "رَ", "رُ", "رِ"].map((sound) => (
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
                الفتحة فوق الحرف، والضمة فوق الحرف، والكسرة تحت الحرف.
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
                ? "أتقنت الحركات القصيرة وأصبحت جاهزًا للمهارة التالية."
                : "نحتاج جولة قصيرة إضافية على الفتحة والضمة والكسرة."}
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
  shell: {
    maxWidth: "980px",
    margin: "0 auto",
  },
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
      "linear-gradient(135deg,#116f50 0%,#1e9b68 58%,#42c487 100%)",
    color: "#ffffff",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 18px 40px rgba(26,110,73,.16)",
  },
  eyebrow: {
    margin: "0 0 5px",
    fontSize: "14px",
    fontWeight: 900,
    color: "#d9fff0",
  },
  title: {
    margin: 0,
    fontSize: "clamp(30px,5vw,48px)",
  },
  subtitle: {
    margin: "8px 0 0",
    lineHeight: 1.8,
    maxWidth: "620px",
    color: "#effff7",
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
    border: "1px solid #dcece4",
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
    background: "#e8f2ed",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg,#18a567,#57cf8e)",
    transition: "width .3s ease",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #dcece4",
    borderRadius: "26px",
    padding: "24px",
    boxShadow: "0 14px 34px rgba(25,80,55,.08)",
  },
  successCard: {
    background: "linear-gradient(180deg,#ffffff,#f2fff7)",
    border: "1px solid #cfeadd",
    borderRadius: "30px",
    padding: "32px 24px",
    textAlign: "center",
    boxShadow: "0 16px 36px rgba(25,80,55,.10)",
  },
  stepPill: {
    display: "inline-flex",
    background: "#eaf9f0",
    color: "#14744d",
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
    color: "#526b60",
  },
  soundGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
    gap: "14px",
    margin: "22px 0",
  },
  soundCard: {
    background: "linear-gradient(180deg,#ffffff,#f7fbf9)",
    border: "1px solid #dceae3",
    borderRadius: "22px",
    padding: "18px",
    textAlign: "center",
  },
  soundSymbol: {
    width: "58px",
    height: "58px",
    margin: "0 auto 8px",
    display: "grid",
    placeItems: "center",
    borderRadius: "18px",
    background: "#eaf9f0",
    color: "#126b49",
    fontSize: "38px",
    fontWeight: 900,
  },
  soundTitle: {
    display: "block",
    fontSize: "20px",
    color: "#174c36",
  },
  soundHint: {
    display: "block",
    marginTop: "5px",
    color: "#718178",
    fontSize: "12px",
    fontWeight: 700,
  },
  soundExamples: {
    display: "grid",
    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
    gap: "7px",
    marginTop: "14px",
  },
  soundExampleButton: {
    border: "1px solid #d8e8df",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "10px 5px",
    color: "#176c46",
    fontSize: "17px",
    fontWeight: 900,
    cursor: "pointer",
  },
  discoveryNote: {
    background: "#fff9e8",
    border: "1px solid #f0dfaa",
    borderRadius: "20px",
    padding: "17px",
    textAlign: "center",
  },
  discoveryExample: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
    margin: "12px 0",
  },
  choiceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
    gap: "12px",
    margin: "20px 0",
  },
  choiceButton: {
    border: "2px solid #d7e7df",
    borderRadius: "18px",
    background: "#ffffff",
    padding: "22px",
    fontSize: "34px",
    fontWeight: 900,
    color: "#174c36",
    cursor: "pointer",
  },
  choiceButtonSelected: {
    border: "2px solid #1da66f",
    background: "#effbf5",
  },
  feedback: {
    marginTop: "14px",
    padding: "14px",
    borderRadius: "16px",
    background: "#f1faf5",
    border: "1px solid #d4ecdf",
    lineHeight: 1.8,
    fontWeight: 800,
  },
  primaryButton: {
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg,#168a63,#0f7654)",
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
  counter: {
    color: "#62756b",
  },
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
    border: "2px solid #d8e6df",
    background: "#ffffff",
    color: "#174c36",
    borderRadius: "18px",
    padding: "17px",
    fontSize: "24px",
    fontWeight: 900,
    cursor: "pointer",
  },
  optionSelected: {
    border: "2px solid #1da66f",
    background: "#eaf9f0",
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
  challengeIcon: {
    fontSize: "38px",
  },
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
    border: "1px solid #d5e7de",
    background: "#f7fcf9",
    color: "#176c46",
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
  trophy: {
    fontSize: "72px",
  },
  successTitle: {
    margin: "10px 0 5px",
    fontSize: "32px",
    color: "#146b47",
  },
  successText: {
    color: "#60756a",
    fontSize: "17px",
    lineHeight: 1.8,
  },
  resultCard: {
    margin: "20px auto",
    maxWidth: "260px",
    padding: "16px",
    borderRadius: "18px",
    background: "#ffffff",
    border: "1px solid #d5e8df",
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
    border: "1px solid #d4e6dd",
    background: "#ffffff",
    color: "#176c46",
    borderRadius: "15px",
    padding: "12px 16px",
    fontWeight: 900,
    cursor: "pointer",
  },
  primaryLink: {
    textDecoration: "none",
    background: "#168a63",
    color: "#ffffff",
    borderRadius: "15px",
    padding: "12px 16px",
    fontWeight: 900,
  },
};