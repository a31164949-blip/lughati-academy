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
  { id: 1, prompt: "اختر الكلمة التي تبدأ بلام شمسية:", options: ["الْقَمَر", "الشَّمْس", "الْبَيْت"], answer: "الشَّمْس", explanation: "في «الشَّمْس» لا نسمع صوت اللام، لذلك هي لام شمسية." },
  { id: 2, prompt: "اختر الكلمة التي تبدأ بلام قمرية:", options: ["النَّجْم", "الطَّائِر", "الْكِتَاب"], answer: "الْكِتَاب", explanation: "في «الْكِتَاب» نسمع صوت اللام، لذلك هي لام قمرية." },
  { id: 3, prompt: "في أي كلمة نسمع صوت اللام بوضوح؟", options: ["الشَّجَرَة", "الْقَلَم", "السَّمَاء"], answer: "الْقَلَم", explanation: "نسمع اللام في «الْقَلَم»، لذلك هي لام قمرية." },
  { id: 4, prompt: "اختر الكلمة ذات اللام الشمسية:", options: ["الْوَلَد", "الدَّرْس", "الْبَاب"], answer: "الدَّرْس", explanation: "في «الدَّرْس» لا ننطق اللام، وتأتي الدال مشددة." },
  { id: 5, prompt: "اختر الكلمة ذات اللام القمرية:", options: ["السَّمَك", "الرَّجُل", "الْفَصْل"], answer: "الْفَصْل", explanation: "في «الْفَصْل» نسمع صوت اللام بوضوح." },
  { id: 6, prompt: "أي كلمة تبدأ بلام شمسية؟", options: ["الْأَسَد", "النَّحْلَة", "الْقَمَر"], answer: "النَّحْلَة", explanation: "في «النَّحْلَة» لا ننطق اللام، والنون مشددة." },
];

const masteryQuestions: Question[] = [
  { id: 1, prompt: "اختر اللام الشمسية:", options: ["الْبَاب", "الشَّمْس", "الْقَلَم"], answer: "الشَّمْس", explanation: "الشَّمْس تبدأ بلام شمسية." },
  { id: 2, prompt: "اختر اللام القمرية:", options: ["النَّجْم", "الْوَرَق", "السَّيَّارَة"], answer: "الْوَرَق", explanation: "نسمع اللام في «الْوَرَق»." },
  { id: 3, prompt: "في أي كلمة لا نسمع صوت اللام؟", options: ["الْكِتَاب", "الرَّجُل", "الْبَيْت"], answer: "الرَّجُل", explanation: "في «الرَّجُل» لا ننطق اللام، لذلك هي شمسية." },
];

const sunWords = ["الشَّمْس", "النَّجْم", "السَّمَك", "الرَّجُل"];
const moonWords = ["الْقَمَر", "الْبَيْت", "الْكِتَاب", "الْوَرَق"];

export default function LamFoundationPage() {
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
    if (step === 4) return finished ? 100 : 85 + Math.round((masteryIndex / masteryQuestions.length) * 15);
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
    setFeedback(
      option === "الْقَمَر"
        ? "✅ ممتاز! نسمع اللام في «الْقَمَر»، فهي لام قمرية."
        : "🌱 استمع جيدًا: هل تسمع صوت اللام بعد «الـ»؟"
    );
  }

  function answerWorksheet(option: string) {
    if (!currentQuestion || answers[currentQuestion.id]) return;
    setAnswers((current) => ({ ...current, [currentQuestion.id]: option }));
    const correct = option === currentQuestion.answer;
    if (correct) {
      setWorksheetScore((score) => score + 1);
      setFeedback(`✅ أحسنت! ${currentQuestion.explanation}`);
    } else {
      setFeedback(`🌱 استمع لصوت اللام. ${currentQuestion.explanation}`);
    }
  }

  function nextWorksheetQuestion() {
    setFeedback("");
    if (questionIndex < worksheetQuestions.length - 1) setQuestionIndex((index) => index + 1);
    else setStep(3);
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
          <Link href="/foundation" style={styles.backButton}>← العودة إلى أساس لغتي</Link>
          <div style={styles.badge}>🌱 أساس لغتي</div>
        </div>

        <header style={styles.hero}>
          <div>
            <p style={styles.eyebrow}>مهمتك الصغيرة اليوم</p>
            <h1 style={styles.title}>☀️🌙 اللام الشمسية والقمرية</h1>
            <p style={styles.subtitle}>نستمع للكلمة، ثم نلاحظ: هل نسمع صوت اللام أم لا؟</p>
          </div>
          <div style={styles.timeCard}>
            <strong>⏱️ 5 دقائق</strong>
            <span>استماع وتصنيف ممتع</span>
          </div>
        </header>

        <div style={styles.progressWrap}>
          <div style={styles.progressLabels}><span>تقدمك</span><strong>{progress}%</strong></div>
          <div style={styles.progressTrack}><div style={{ ...styles.progressBar, width: `${progress}%` }} /></div>
        </div>

        {step === 0 && (
          <section style={styles.card}>
            <span style={styles.stepPill}>👂 1. اسمع واكتشف</span>
            <h2 style={styles.cardTitle}>هل نسمع اللام؟</h2>
            <p style={styles.largeText}>في اللام القمرية نسمع صوت اللام بوضوح، أما في اللام الشمسية فلا ننطق اللام.</p>

            <div style={styles.twoColumns}>
              <article style={styles.moonCard}>
                <div style={styles.bigIcon}>🌙</div>
                <h3 style={styles.groupTitle}>اللام القمرية</h3>
                <p style={styles.groupText}>نسمع صوت اللام.</p>
                <div style={styles.wordGrid}>
                  {moonWords.slice(0, 3).map((word) => (
                    <button key={word} type="button" style={styles.moonWordButton} onClick={() => speak(word)}>🔊 {word}</button>
                  ))}
                </div>
              </article>

              <article style={styles.sunCard}>
                <div style={styles.bigIcon}>☀️</div>
                <h3 style={styles.groupTitle}>اللام الشمسية</h3>
                <p style={styles.groupText}>لا نسمع صوت اللام.</p>
                <div style={styles.wordGrid}>
                  {sunWords.slice(0, 3).map((word) => (
                    <button key={word} type="button" style={styles.sunWordButton} onClick={() => speak(word)}>🔊 {word}</button>
                  ))}
                </div>
              </article>
            </div>

            <div style={styles.discoveryNote}>
              <strong>قاعدة سهلة 🌟</strong>
              <p>إذا سمعت اللام فهي قمرية 🌙، وإذا اختفى صوت اللام فهي شمسية ☀️.</p>
            </div>

            <button type="button" style={styles.primaryButton} onClick={() => { setFeedback(""); setStep(1); }}>
              فهمت، دعني أجرّب ←
            </button>
          </section>
        )}

        {step === 1 && (
          <section style={styles.card}>
            <span style={styles.stepPill}>✋ 2. جرّب بنفسك</span>
            <h2 style={styles.cardTitle}>أي كلمة لامها قمرية؟</h2>
            <p style={styles.largeText}>اضغط على كل كلمة واستمع، ثم اختر الكلمة التي تسمع فيها اللام.</p>

            <div style={styles.choiceGrid}>
              {["الشَّمْس", "الْقَمَر", "النَّجْم"].map((option) => (
                <button
                  key={option}
                  type="button"
                  style={{ ...styles.choiceButton, ...(practiceChoice === option ? styles.choiceButtonSelected : {}) }}
                  onClick={() => choosePractice(option)}
                >
                  🔊 {option}
                </button>
              ))}
            </div>

            {feedback && <div style={styles.feedback}>{feedback}</div>}

            <button
              type="button"
              style={{ ...styles.primaryButton, opacity: practiceChoice === "الْقَمَر" ? 1 : 0.55 }}
              disabled={practiceChoice !== "الْقَمَر"}
              onClick={() => { setFeedback(""); setStep(2); }}
            >
              ابدأ ورقة العمل الإلكترونية ←
            </button>
          </section>
        )}

        {step === 2 && currentQuestion && (
          <section style={styles.card}>
            <div style={styles.cardTop}>
              <span style={styles.stepPill}>📝 3. ورقة إلكترونية قصيرة</span>
              <strong style={styles.counter}>{questionIndex + 1} / {worksheetQuestions.length}</strong>
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
                    style={{ ...styles.optionButton, ...(selected ? styles.optionSelected : {}) }}
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
                <button type="button" style={styles.primaryButton} onClick={nextWorksheetQuestion}>
                  {questionIndex === worksheetQuestions.length - 1 ? "انتقل للتحدي 🎮" : "السؤال التالي ←"}
                </button>
              </>
            )}
          </section>
        )}

        {step === 3 && (
          <section style={styles.card}>
            <span style={styles.stepPill}>🎮 4. تحدي التصنيف</span>
            <h2 style={styles.cardTitle}>شمس أم قمر؟</h2>
            <p style={styles.largeText}>حصلت في التدريب على <strong>{worksheetScore} من {worksheetQuestions.length}</strong>.</p>

            <div style={styles.challengeBox}>
              <div style={styles.challengeIcon}>🎧</div>
              <div>
                <strong>مهمة فارس</strong>
                <p style={styles.challengeText}>استمع للكلمات التالية، ثم حاول أن تقول: شمسية أم قمرية؟</p>
              </div>
            </div>

            <div style={styles.challengeSounds}>
              {[...sunWords, ...moonWords].map((word) => (
                <button key={word} type="button" style={styles.wordChip} onClick={() => speak(word)}>🔊 {word}</button>
              ))}
            </div>

            <div style={styles.ruleBox}>
              <strong>قاعدة البطل 🌟</strong>
              <p>🌙 القمرية: نسمع اللام. ☀️ الشمسية: لا نسمع اللام، ويأتي الحرف بعدها مشددًا.</p>
            </div>

            <button type="button" style={styles.primaryButton} onClick={() => setStep(4)}>
              أنا جاهز لاختبار الإتقان 🏆
            </button>
          </section>
        )}

        {step === 4 && !finished && currentMastery && (
          <section style={styles.card}>
            <div style={styles.cardTop}>
              <span style={styles.stepPill}>🏆 5. تحقق من الإتقان</span>
              <strong style={styles.counter}>{masteryIndex + 1} / {masteryQuestions.length}</strong>
            </div>
            <h2 style={styles.question}>{currentMastery.prompt}</h2>
            <div style={styles.options}>
              {currentMastery.options.map((option) => (
                <button key={option} type="button" style={styles.optionButton} onClick={() => answerMastery(option)}>{option}</button>
              ))}
            </div>
          </section>
        )}

        {step === 4 && finished && (
          <section style={styles.successCard}>
            <div style={styles.trophy}>{masteryScore === 3 ? "🏆" : "🌱"}</div>
            <h2 style={styles.successTitle}>{masteryScore >= 2 ? "أحسنت يا بطل!" : "اقتربت جدًا يا بطل!"}</h2>
            <p style={styles.successText}>
              {masteryScore >= 2
                ? "أتقنت اللام الشمسية والقمرية وأصبحت تميزها بالاستماع والقراءة."
                : "نحتاج جولة قصيرة إضافية على سماع صوت اللام."}
            </p>
            <div style={styles.resultCard}><span>نتيجة الإتقان</span><strong>{masteryScore} / {masteryQuestions.length}</strong></div>
            <div style={styles.finalActions}>
              <button type="button" style={styles.secondaryButton} onClick={restart}>🔄 أعد التدريب</button>
              <Link href="/foundation" style={styles.primaryLink}>العودة إلى أساس لغتي ←</Link>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "linear-gradient(180deg,#f4fbf7 0%,#f8fbff 48%,#fffaf0 100%)", padding: "24px 14px 50px", fontFamily: "Tahoma, Arial, sans-serif", color: "#173f31" },
  shell: { maxWidth: "980px", margin: "0 auto" },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "14px" },
  backButton: { textDecoration: "none", color: "#176c46", background: "#ffffff", border: "1px solid #d9ebe2", borderRadius: "14px", padding: "10px 14px", fontWeight: 900 },
  badge: { background: "#e7f8ef", color: "#0f7a4f", border: "1px solid #cfeadd", borderRadius: "999px", padding: "9px 14px", fontWeight: 900 },
  hero: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "18px", flexWrap: "wrap", background: "linear-gradient(135deg,#1d6f8b 0%,#258aaa 52%,#efb43d 100%)", color: "#ffffff", borderRadius: "28px", padding: "24px", boxShadow: "0 18px 40px rgba(35,105,135,.16)" },
  eyebrow: { margin: "0 0 5px", fontSize: "14px", fontWeight: 900, color: "#e8fbff" },
  title: { margin: 0, fontSize: "clamp(30px,5vw,48px)" },
  subtitle: { margin: "8px 0 0", lineHeight: 1.8, maxWidth: "620px", color: "#f7fdff", fontWeight: 700 },
  timeCard: { minWidth: "150px", padding: "14px 16px", borderRadius: "18px", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.18)", display: "grid", gap: "4px", textAlign: "center" },
  progressWrap: { margin: "16px 0", background: "#ffffff", borderRadius: "18px", padding: "13px 15px", border: "1px solid #d9e9ee" },
  progressLabels: { display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: 900 },
  progressTrack: { height: "10px", borderRadius: "999px", background: "#e8f0f3", overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,#2483a0,#f0b43d)", transition: "width .3s ease" },
  card: { background: "#ffffff", border: "1px solid #dce9ed", borderRadius: "26px", padding: "24px", boxShadow: "0 14px 34px rgba(30,90,110,.08)" },
  successCard: { background: "linear-gradient(180deg,#ffffff,#f4fbfd)", border: "1px solid #d5e7ec", borderRadius: "30px", padding: "32px 24px", textAlign: "center", boxShadow: "0 16px 36px rgba(30,90,110,.10)" },
  stepPill: { display: "inline-flex", background: "#e9f6fa", color: "#1d6f8b", borderRadius: "999px", padding: "8px 12px", fontWeight: 900, fontSize: "14px" },
  cardTitle: { margin: "16px 0 8px", fontSize: "28px" },
  largeText: { fontSize: "19px", lineHeight: 1.9, color: "#596a70" },
  twoColumns: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "14px", margin: "22px 0" },
  moonCard: { background: "linear-gradient(180deg,#f7fbff,#ffffff)", border: "1px solid #d5e6f1", borderRadius: "22px", padding: "18px", textAlign: "center" },
  sunCard: { background: "linear-gradient(180deg,#fffaf0,#ffffff)", border: "1px solid #f0dfb8", borderRadius: "22px", padding: "18px", textAlign: "center" },
  bigIcon: { fontSize: "48px" },
  groupTitle: { margin: "4px 0 0", fontSize: "22px", color: "#174c36" },
  groupText: { color: "#6c7973", margin: "5px 0 0", fontWeight: 700 },
  wordGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: "8px", marginTop: "15px" },
  moonWordButton: { border: "1px solid #d7e7ef", background: "#ffffff", color: "#28637a", borderRadius: "13px", padding: "10px", fontWeight: 900, cursor: "pointer" },
  sunWordButton: { border: "1px solid #f0dfb7", background: "#ffffff", color: "#996714", borderRadius: "13px", padding: "10px", fontWeight: 900, cursor: "pointer" },
  discoveryNote: { background: "#f0fff7", border: "1px solid #d1ecdd", borderRadius: "20px", padding: "17px", textAlign: "center", lineHeight: 1.8 },
  choiceGrid: { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "12px", margin: "20px 0" },
  choiceButton: { border: "2px solid #dbe8ec", borderRadius: "18px", background: "#ffffff", padding: "22px", fontSize: "23px", fontWeight: 900, color: "#285c70", cursor: "pointer" },
  choiceButtonSelected: { borderTopColor: "#2790ad", borderRightColor: "#2790ad", borderBottomColor: "#2790ad", borderLeftColor: "#2790ad", background: "#f0fbff" },
  feedback: { marginTop: "14px", padding: "14px", borderRadius: "16px", background: "#f3fbfd", border: "1px solid #d7e9ee", lineHeight: 1.8, fontWeight: 800 },
  primaryButton: { width: "100%", border: "none", background: "linear-gradient(135deg,#2483a0,#1a6c86)", color: "#ffffff", borderRadius: "16px", padding: "14px 18px", fontWeight: 900, fontSize: "16px", cursor: "pointer", marginTop: "12px" },
  cardTop: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" },
  counter: { color: "#65757b" },
  question: { margin: "22px 0", fontSize: "clamp(22px,4vw,30px)", lineHeight: 1.6 },
  options: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "12px" },
  optionButton: { border: "2px solid #dbe8ec", background: "#ffffff", color: "#285c70", borderRadius: "18px", padding: "17px", fontSize: "22px", fontWeight: 900, cursor: "pointer" },
  optionSelected: { borderTopColor: "#2790ad", borderRightColor: "#2790ad", borderBottomColor: "#2790ad", borderLeftColor: "#2790ad", background: "#f0fbff" },
  challengeBox: { display: "flex", alignItems: "center", gap: "14px", padding: "16px", borderRadius: "18px", background: "#fff8e6", border: "1px solid #f2dfaa", fontSize: "18px" },
  challengeIcon: { fontSize: "38px" },
  challengeText: { margin: "5px 0 0", color: "#6d6a55", lineHeight: 1.7, fontSize: "14px" },
  challengeSounds: { display: "flex", gap: "9px", flexWrap: "wrap", margin: "18px 0" },
  wordChip: { border: "1px solid #d8e6ea", background: "#fafdff", color: "#276077", borderRadius: "999px", padding: "11px 15px", fontSize: "17px", fontWeight: 900, cursor: "pointer" },
  ruleBox: { padding: "15px", borderRadius: "17px", background: "#f0fff7", border: "1px solid #d1ecdd", color: "#216447", lineHeight: 1.8 },
  trophy: { fontSize: "72px" },
  successTitle: { margin: "10px 0 5px", fontSize: "32px", color: "#1d6f8b" },
  successText: { color: "#647277", fontSize: "17px", lineHeight: 1.8 },
  resultCard: { margin: "20px auto", maxWidth: "260px", padding: "16px", borderRadius: "18px", background: "#ffffff", border: "1px solid #d8e7eb", display: "grid", gap: "7px" },
  finalActions: { display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" },
  secondaryButton: { border: "1px solid #d6e5e9", background: "#ffffff", color: "#286078", borderRadius: "15px", padding: "12px 16px", fontWeight: 900, cursor: "pointer" },
  primaryLink: { textDecoration: "none", background: "#2483a0", color: "#ffffff", borderRadius: "15px", padding: "12px 16px", fontWeight: 900 },
};