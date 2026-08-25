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
    prompt: "اختر الكلمة التي تنتهي بتنوين الفتح:",
    options: ["كِتَابًا", "كِتَابٌ", "كِتَابٍ"],
    answer: "كِتَابًا",
    explanation: "تنوين الفتح علامته فتحتان: ـً.",
  },
  {
    id: 2,
    prompt: "اختر الكلمة التي تنتهي بتنوين الضم:",
    options: ["قَلَمًا", "قَلَمٌ", "قَلَمٍ"],
    answer: "قَلَمٌ",
    explanation: "تنوين الضم علامته ضمتان: ـٌ.",
  },
  {
    id: 3,
    prompt: "اختر الكلمة التي تنتهي بتنوين الكسر:",
    options: ["بَيْتًا", "بَيْتٌ", "بَيْتٍ"],
    answer: "بَيْتٍ",
    explanation: "تنوين الكسر علامته كسرتان: ـٍ.",
  },
  {
    id: 4,
    prompt: "أي كلمة نقرأ آخرها بصوت «ـن» خفيف مع الفتح؟",
    options: ["وَرْدَةً", "وَرْدَةٌ", "وَرْدَةٍ"],
    answer: "وَرْدَةً",
    explanation: "في تنوين الفتح نسمع صوتًا خفيفًا يشبه النون في آخر الكلمة.",
  },
  {
    id: 5,
    prompt: "اختر القراءة الصحيحة لكلمة «عِلْمٌ»:",
    options: ["عِلْمَنْ", "عِلْمُنْ", "عِلْمِنْ"],
    answer: "عِلْمُنْ",
    explanation: "تنوين الضم يعطينا صوتًا خفيفًا: ـُنْ.",
  },
  {
    id: 6,
    prompt: "اختر الكلمة التي فيها تنوين كسر:",
    options: ["طَالِبًا", "طَالِبٌ", "طَالِبٍ"],
    answer: "طَالِبٍ",
    explanation: "علامة تنوين الكسر كسرتان تحت الحرف الأخير.",
  },
];

const masteryQuestions: Question[] = [
  {
    id: 1,
    prompt: "اختر تنوين الفتح:",
    options: ["ـً", "ـٌ", "ـٍ"],
    answer: "ـً",
    explanation: "تنوين الفتح هو ـً.",
  },
  {
    id: 2,
    prompt: "اختر الكلمة المنونة بالضم:",
    options: ["نَجْمًا", "نَجْمٌ", "نَجْمٍ"],
    answer: "نَجْمٌ",
    explanation: "نَجْمٌ فيها تنوين ضم.",
  },
  {
    id: 3,
    prompt: "اختر الكلمة المنونة بالكسر:",
    options: ["بَابًا", "بَابٌ", "بَابٍ"],
    answer: "بَابٍ",
    explanation: "بَابٍ فيها تنوين كسر.",
  },
];

const tanweenGroups = [
  {
    title: "تنوين الفتح",
    mark: "ـً",
    example: "كِتَابًا",
    soundHint: "صوت خفيف في آخر الكلمة",
  },
  {
    title: "تنوين الضم",
    mark: "ـٌ",
    example: "كِتَابٌ",
    soundHint: "صوت خفيف في آخر الكلمة",
  },
  {
    title: "تنوين الكسر",
    mark: "ـٍ",
    example: "كِتَابٍ",
    soundHint: "صوت خفيف في آخر الكلمة",
  },
];

export default function TanweenFoundationPage() {
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
    speak(option);

    if (option === "قَلَمٌ") {
      setFeedback("✅ ممتاز! هذه الكلمة منونة بالضم: قَلَمٌ.");
    } else {
      setFeedback("🌱 ابحث عن الضمتين في آخر الكلمة.");
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
      setFeedback(`🌱 راجع علامة التنوين. ${currentQuestion.explanation}`);
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
            <h1 style={styles.title}>🔤 التنوين</h1>
            <p style={styles.subtitle}>
              نتعرف على تنوين الفتح والضم والكسر، ثم نميز بينها في كلمات سهلة.
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
            <h2 style={styles.cardTitle}>ما التنوين؟</h2>

            <p style={styles.largeText}>
              التنوين حركة مضاعفة تأتي غالبًا في آخر الاسم، ونسمع معها صوتًا خفيفًا في نهاية الكلمة.
            </p>

            <div style={styles.tanweenGrid}>
              {tanweenGroups.map((group) => (
                <article key={group.title} style={styles.tanweenCard}>
                  <div style={styles.tanweenMark}>{group.mark}</div>
                  <strong style={styles.tanweenTitle}>{group.title}</strong>
                  <span style={styles.tanweenHint}>{group.soundHint}</span>

                  <button
                    type="button"
                    style={styles.listenWordButton}
                    onClick={() => speak(group.example)}
                  >
                    🔊 {group.example}
                  </button>
                </article>
              ))}
            </div>

            <div style={styles.discoveryNote}>
              <strong>لاحظ الفرق 👇</strong>
              <div style={styles.discoveryExamples}>
                <span>كِتَابًا</span>
                <span>كِتَابٌ</span>
                <span>كِتَابٍ</span>
              </div>
              <p>
                الكلمة واحدة تقريبًا، لكن علامة التنوين في آخرها تغيّر طريقة القراءة.
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
            <h2 style={styles.cardTitle}>أين تنوين الضم؟</h2>

            <p style={styles.largeText}>
              اختر الكلمة التي تنتهي بتنوين الضم.
            </p>

            <div style={styles.choiceGrid}>
              {["قَلَمًا", "قَلَمٌ", "قَلَمٍ"].map((option) => (
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
                  🔊 {option}
                </button>
              ))}
            </div>

            {feedback && <div style={styles.feedback}>{feedback}</div>}

            <button
              type="button"
              style={{
                ...styles.primaryButton,
                opacity: practiceChoice === "قَلَمٌ" ? 1 : 0.55,
              }}
              disabled={practiceChoice !== "قَلَمٌ"}
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
            <h2 style={styles.cardTitle}>صائد التنوين</h2>

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
                  استمع للكلمات التالية وحاول أن تحدد نوع التنوين في آخر كل كلمة.
                </p>
              </div>
            </div>

            <div style={styles.challengeSounds}>
              {["بَابًا", "نَجْمٌ", "طَالِبٍ", "قَلَمًا", "عِلْمٌ", "بَيْتٍ"].map(
                (word) => (
                  <button
                    key={word}
                    type="button"
                    style={styles.wordChip}
                    onClick={() => speak(word)}
                  >
                    🔊 {word}
                  </button>
                )
              )}
            </div>

            <div style={styles.ruleBox}>
              <strong>قاعدة البطل 🌟</strong>
              <p>
                ـً تنوين فتح، ـٌ تنوين ضم، ـٍ تنوين كسر.
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
                ? "أتقنت التنوين وأصبحت قادرًا على التمييز بين تنوين الفتح والضم والكسر."
                : "نحتاج جولة قصيرة إضافية على أنواع التنوين."}
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
      "linear-gradient(135deg,#9a6517 0%,#c8871f 58%,#e8ab45 100%)",
    color: "#ffffff",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 18px 40px rgba(135,90,20,.16)",
  },
  eyebrow: {
    margin: "0 0 5px",
    fontSize: "14px",
    fontWeight: 900,
    color: "#fff8df",
  },
  title: {
    margin: 0,
    fontSize: "clamp(30px,5vw,48px)",
  },
  subtitle: {
    margin: "8px 0 0",
    lineHeight: 1.8,
    maxWidth: "620px",
    color: "#fffdf7",
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
    border: "1px solid #eee3cc",
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
    background: "#f2eadb",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg,#c8871f,#e6b151)",
    transition: "width .3s ease",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #eee3cc",
    borderRadius: "26px",
    padding: "24px",
    boxShadow: "0 14px 34px rgba(100,75,30,.08)",
  },
  successCard: {
    background: "linear-gradient(180deg,#ffffff,#fffaf0)",
    border: "1px solid #eadfc7",
    borderRadius: "30px",
    padding: "32px 24px",
    textAlign: "center",
    boxShadow: "0 16px 36px rgba(100,75,30,.10)",
  },
  stepPill: {
    display: "inline-flex",
    background: "#fff4d8",
    color: "#91600f",
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
    color: "#665f53",
  },
  tanweenGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
    gap: "14px",
    margin: "22px 0",
  },
  tanweenCard: {
    background: "linear-gradient(180deg,#ffffff,#fffdf8)",
    border: "1px solid #eadfca",
    borderRadius: "22px",
    padding: "18px",
    textAlign: "center",
  },
  tanweenMark: {
    width: "62px",
    height: "62px",
    margin: "0 auto 8px",
    display: "grid",
    placeItems: "center",
    borderRadius: "18px",
    background: "#fff4d8",
    color: "#92600e",
    fontSize: "35px",
    fontWeight: 900,
  },
  tanweenTitle: {
    display: "block",
    color: "#815812",
    fontSize: "19px",
  },
  tanweenHint: {
    display: "block",
    marginTop: "5px",
    color: "#7a746a",
    fontSize: "12px",
    fontWeight: 700,
  },
  listenWordButton: {
    marginTop: "14px",
    width: "100%",
    border: "1px solid #eadfc7",
    background: "#ffffff",
    color: "#8b6116",
    borderRadius: "14px",
    padding: "11px",
    fontSize: "18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  discoveryNote: {
    background: "#eef8ff",
    border: "1px solid #d7eaf8",
    borderRadius: "20px",
    padding: "17px",
    textAlign: "center",
    lineHeight: 1.8,
  },
  discoveryExamples: {
    display: "flex",
    justifyContent: "center",
    gap: "11px",
    flexWrap: "wrap",
    margin: "13px 0",
  },
  choiceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
    gap: "12px",
    margin: "20px 0",
  },
  choiceButton: {
    border: "2px solid #eadfc9",
    borderRadius: "18px",
    background: "#ffffff",
    padding: "22px",
    fontSize: "25px",
    fontWeight: 900,
    color: "#795511",
    cursor: "pointer",
  },
  choiceButtonSelected: {
    borderTopColor: "#c58a28",
    borderRightColor: "#c58a28",
    borderBottomColor: "#c58a28",
    borderLeftColor: "#c58a28",
    background: "#fff9e9",
  },
  feedback: {
    marginTop: "14px",
    padding: "14px",
    borderRadius: "16px",
    background: "#fffaf0",
    border: "1px solid #eadfc9",
    lineHeight: 1.8,
    fontWeight: 800,
  },
  primaryButton: {
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg,#bd7f1d,#996312)",
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
  counter: { color: "#746b5c" },
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
    border: "2px solid #eadfc9",
    background: "#ffffff",
    color: "#795511",
    borderRadius: "18px",
    padding: "17px",
    fontSize: "23px",
    fontWeight: 900,
    cursor: "pointer",
  },
  optionSelected: {
    borderTopColor: "#c58a28",
    borderRightColor: "#c58a28",
    borderBottomColor: "#c58a28",
    borderLeftColor: "#c58a28",
    background: "#fff8e6",
  },
  challengeBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    borderRadius: "18px",
    background: "#eef8ff",
    border: "1px solid #d7eaf8",
    fontSize: "18px",
  },
  challengeIcon: { fontSize: "38px" },
  challengeText: {
    margin: "5px 0 0",
    color: "#5f6f79",
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
    border: "1px solid #eadfc9",
    background: "#fffdf8",
    color: "#8a6014",
    borderRadius: "999px",
    padding: "11px 15px",
    fontSize: "18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  ruleBox: {
    padding: "15px",
    borderRadius: "17px",
    background: "#f0fff7",
    border: "1px solid #d1ecdd",
    color: "#216447",
    lineHeight: 1.8,
  },
  trophy: { fontSize: "72px" },
  successTitle: {
    margin: "10px 0 5px",
    fontSize: "32px",
    color: "#91600f",
  },
  successText: {
    color: "#6d675c",
    fontSize: "17px",
    lineHeight: 1.8,
  },
  resultCard: {
    margin: "20px auto",
    maxWidth: "260px",
    padding: "16px",
    borderRadius: "18px",
    background: "#ffffff",
    border: "1px solid #eadfc9",
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
    border: "1px solid #e5d9bf",
    background: "#ffffff",
    color: "#8a6014",
    borderRadius: "15px",
    padding: "12px 16px",
    fontWeight: 900,
    cursor: "pointer",
  },
  primaryLink: {
    textDecoration: "none",
    background: "#bd7f1d",
    color: "#ffffff",
    borderRadius: "15px",
    padding: "12px 16px",
    fontWeight: 900,
  },
};