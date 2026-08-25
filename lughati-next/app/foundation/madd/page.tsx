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
    prompt: "اختر المقطع الذي فيه مد بالألف:",
    options: ["بَ", "بَا", "بُ"],
    answer: "بَا",
    explanation: "بعد الفتحة جاء الألف، لذلك نمد الصوت: بَا.",
  },
  {
    id: 2,
    prompt: "اختر المقطع الذي فيه مد بالواو:",
    options: ["مُو", "مُ", "مِ"],
    answer: "مُو",
    explanation: "بعد الضمة جاءت الواو، لذلك نمد الصوت: مُو.",
  },
  {
    id: 3,
    prompt: "اختر المقطع الذي فيه مد بالياء:",
    options: ["سِ", "سِي", "سَ"],
    answer: "سِي",
    explanation: "بعد الكسرة جاءت الياء، لذلك نمد الصوت: سِي.",
  },
  {
    id: 4,
    prompt: "أي كلمة تحتوي على مد بالألف؟",
    options: ["بَاب", "بِنْت", "كُتُب"],
    answer: "بَاب",
    explanation: "في كلمة «بَاب» نسمع صوتًا ممدودًا بالألف: بَا.",
  },
  {
    id: 5,
    prompt: "أي كلمة تحتوي على مد بالواو؟",
    options: ["نُور", "نَمِر", "نِعَم"],
    answer: "نُور",
    explanation: "في كلمة «نُور» نسمع المد بالواو: نُو.",
  },
  {
    id: 6,
    prompt: "أي كلمة تحتوي على مد بالياء؟",
    options: ["فِيل", "فَتَحَ", "فُرُش"],
    answer: "فِيل",
    explanation: "في كلمة «فِيل» نسمع المد بالياء: فِي.",
  },
];

const masteryQuestions: Question[] = [
  {
    id: 1,
    prompt: "اختر المقطع الممدود بالألف:",
    options: ["دَ", "دَا", "دُ"],
    answer: "دَا",
    explanation: "دَا فيه مد بالألف.",
  },
  {
    id: 2,
    prompt: "اختر المقطع الممدود بالواو:",
    options: ["رُو", "رَ", "رِ"],
    answer: "رُو",
    explanation: "رُو فيه مد بالواو.",
  },
  {
    id: 3,
    prompt: "اختر المقطع الممدود بالياء:",
    options: ["لِ", "لِي", "لُ"],
    answer: "لِي",
    explanation: "لِي فيه مد بالياء.",
  },
];

const comparisonGroups = [
  {
    title: "المد بالألف",
    short: "بَ",
    long: "بَا",
    letter: "ا",
    note: "فتحة + ألف",
  },
  {
    title: "المد بالواو",
    short: "بُ",
    long: "بُو",
    letter: "و",
    note: "ضمة + واو",
  },
  {
    title: "المد بالياء",
    short: "بِ",
    long: "بِي",
    letter: "ي",
    note: "كسرة + ياء",
  },
];

export default function MaddFoundationPage() {
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
    utterance.rate = 0.68;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }

  function choosePractice(option: string) {
    setPracticeChoice(option);

    if (option === "سِي") {
      setFeedback("✅ ممتاز! هذا صوت ممدود بالياء: سِي.");
    } else {
      setFeedback("🌱 استمع جيدًا وابحث عن الصوت الأطول.");
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
      setFeedback(`🌱 لاحظ طول الصوت. ${currentQuestion.explanation}`);
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
            <h1 style={styles.title}>🎵 حروف المد</h1>
            <p style={styles.subtitle}>
              نسمع الفرق بين الصوت القصير والصوت الممدود، ثم نتدرب على الألف والواو والياء.
            </p>
          </div>

          <div style={styles.timeCard}>
            <strong>⏱️ 5 دقائق</strong>
            <span>استماع وتدريب خفيف</span>
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
            <span style={styles.stepPill}>👂 1. اسمع وقارن</span>
            <h2 style={styles.cardTitle}>الصوت القصير والصوت الممدود</h2>

            <p style={styles.largeText}>
              اضغط على الأزرار واسمع الفرق. الصوت الممدود أطول قليلًا من الصوت القصير.
            </p>

            <div style={styles.compareGrid}>
              {comparisonGroups.map((group) => (
                <article key={group.title} style={styles.compareCard}>
                  <div style={styles.maddLetter}>{group.letter}</div>
                  <strong style={styles.compareTitle}>{group.title}</strong>
                  <span style={styles.compareNote}>{group.note}</span>

                  <div style={styles.soundCompareRow}>
                    <button
                      type="button"
                      style={styles.shortSoundButton}
                      onClick={() => speak(group.short)}
                    >
                      🔊 {group.short}
                    </button>

                    <span style={styles.arrow}>←</span>

                    <button
                      type="button"
                      style={styles.longSoundButton}
                      onClick={() => speak(group.long)}
                    >
                      🔊 {group.long}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div style={styles.discoveryNote}>
              <strong>قاعدة سهلة 🌟</strong>
              <p>
                بَ صوت قصير، أما بَا فصوته أطول. وكذلك بُ ← بُو، وبِ ← بِي.
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
              سمعت الفرق، دعني أجرّب ←
            </button>
          </section>
        )}

        {step === 1 && (
          <section style={styles.card}>
            <span style={styles.stepPill}>✋ 2. اختر الصوت الممدود</span>
            <h2 style={styles.cardTitle}>أين المد بالياء؟</h2>

            <p style={styles.largeText}>
              استمع ثم اختر المقطع الذي صوته أطول.
            </p>

            <div style={styles.choiceGrid}>
              {["سِ", "سِي", "سُ"].map((option) => (
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
                opacity: practiceChoice === "سِي" ? 1 : 0.55,
              }}
              disabled={practiceChoice !== "سِي"}
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
            <h2 style={styles.cardTitle}>صائد المدود</h2>

            <p style={styles.largeText}>
              حصلت في التدريب على{" "}
              <strong>
                {worksheetScore} من {worksheetQuestions.length}
              </strong>
              .
            </p>

            <div style={styles.challengeBox}>
              <div style={styles.challengeIcon}>🎧</div>
              <div>
                <strong>مهمة فارس</strong>
                <p style={styles.challengeText}>
                  استمع للمقاطع التالية وحاول أن تلاحظ حرف المد في كل مقطع.
                </p>
              </div>
            </div>

            <div style={styles.challengeSounds}>
              {["دَا", "رُو", "لِي", "مَا", "نُو", "فِي"].map((sound) => (
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
                الألف يأتي بعد الفتحة، والواو بعد الضمة، والياء بعد الكسرة.
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
                ? "أتقنت حروف المد وأصبحت قادرًا على التمييز بين الألف والواو والياء."
                : "نحتاج جولة قصيرة إضافية على أصوات المد."}
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
      "linear-gradient(135deg,#176a5a 0%,#218f73 55%,#4bbd98 100%)",
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
  compareGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "14px",
    margin: "22px 0",
  },
  compareCard: {
    background: "linear-gradient(180deg,#ffffff,#f7fbfa)",
    border: "1px solid #dceae3",
    borderRadius: "22px",
    padding: "18px",
    textAlign: "center",
  },
  maddLetter: {
    width: "58px",
    height: "58px",
    margin: "0 auto 8px",
    display: "grid",
    placeItems: "center",
    borderRadius: "18px",
    background: "#eaf9f0",
    color: "#126b49",
    fontSize: "31px",
    fontWeight: 900,
  },
  compareTitle: {
    display: "block",
    fontSize: "20px",
    color: "#174c36",
  },
  compareNote: {
    display: "block",
    marginTop: "5px",
    color: "#718178",
    fontSize: "12px",
    fontWeight: 700,
  },
  soundCompareRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: "8px",
    marginTop: "16px",
  },
  shortSoundButton: {
    border: "1px solid #dbe9e2",
    background: "#ffffff",
    borderRadius: "14px",
    padding: "11px",
    color: "#506d60",
    fontSize: "18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  longSoundButton: {
    border: "2px solid #93d6b5",
    background: "#effbf5",
    borderRadius: "14px",
    padding: "11px",
    color: "#126b49",
    fontSize: "20px",
    fontWeight: 900,
    cursor: "pointer",
  },
  arrow: {
    color: "#8b9a92",
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
    fontSize: "28px",
    fontWeight: 900,
    color: "#174c36",
    cursor: "pointer",
  },
  choiceButtonSelected: {
    borderTopColor: "#1da66f",
    borderRightColor: "#1da66f",
    borderBottomColor: "#1da66f",
    borderLeftColor: "#1da66f",
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
  counter: { color: "#62756b" },
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
    borderTopColor: "#1da66f",
    borderRightColor: "#1da66f",
    borderBottomColor: "#1da66f",
    borderLeftColor: "#1da66f",
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
  trophy: { fontSize: "72px" },
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