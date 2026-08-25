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

const questions: Question[] = [
  { id: 1, prompt: "اختر المقطع الذي يحتوي على سكون:", options: ["مَكَ", "مَكْ", "مُكُ"], answer: "مَكْ", explanation: "الحرف الساكن لا تصاحبه حركة، ونضع فوقه علامة السكون (ْ)." },
  { id: 2, prompt: "أي كلمة تحتوي على حرف ساكن؟", options: ["كَتَبَ", "مَدْرَسَة", "لَعِبَ"], answer: "مَدْرَسَة", explanation: "في كلمة «مَدْرَسَة» حرف الدال ساكن: دْ." },
  { id: 3, prompt: "كوّن المقطع الصحيح: مَ + دْ = ؟", options: ["مَدْ", "مَدَ", "مِدُ"], answer: "مَدْ", explanation: "نقرأ الحرف المتحرك مع الحرف الساكن في مقطع واحد: مَدْ." },
  { id: 4, prompt: "أين السكون في كلمة «يَكْتُبُ»؟", options: ["يَ", "كْ", "تُ"], answer: "كْ", explanation: "الكاف عليها علامة السكون: كْ." },
  { id: 5, prompt: "اختر القراءة الصحيحة للمقطع «بَيْ»:", options: ["بَيَ", "بَيْ", "بُيُ"], answer: "بَيْ", explanation: "الياء هنا ساكنة، فنقرأ المقطع: بَيْ." },
];

const masteryQuestions: Question[] = [
  { id: 1, prompt: "اختر الكلمة التي تحتوي على سكون:", options: ["قَلَم", "مَكْتَب", "كَتَبَ"], answer: "مَكْتَب", explanation: "في «مَكْتَب» الكاف ساكنة." },
  { id: 2, prompt: "مَ + نْ = ؟", options: ["مَنْ", "مَنَ", "مِنُ"], answer: "مَنْ", explanation: "النون ساكنة، لذلك نقرأها مع الحرف السابق: مَنْ." },
  { id: 3, prompt: "حدد الحرف الساكن في «يَفْتَحُ»:", options: ["يَ", "فْ", "تَ"], answer: "فْ", explanation: "الفاء عليها السكون." },
];

export default function SukoonFoundationPage() {
  const [step, setStep] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState("");
  const [challengeScore, setChallengeScore] = useState(0);
  const [masteryIndex, setMasteryIndex] = useState(0);
  const [masteryScore, setMasteryScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions[questionIndex];
  const currentMastery = masteryQuestions[masteryIndex];
  const answeredCount = Object.keys(answers).length;

  const progress = useMemo(() => {
    if (step === 0) return 15;
    if (step === 1) return 30;
    if (step === 2) return 45 + Math.round((answeredCount / questions.length) * 25);
    if (step === 3) return 80;
    if (step === 4) return finished ? 100 : 85 + Math.round((masteryIndex / masteryQuestions.length) * 15);
    return 100;
  }, [step, answeredCount, masteryIndex, finished]);

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = 0.75;
    window.speechSynthesis.speak(utterance);
  }

  function answerWorksheet(option: string) {
    if (!currentQuestion || answers[currentQuestion.id]) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
    const correct = option === currentQuestion.answer;
    setFeedback(correct ? `✅ أحسنت! ${currentQuestion.explanation}` : `🌱 حاول أن تلاحظ علامة السكون. ${currentQuestion.explanation}`);
    if (correct) setChallengeScore((prev) => prev + 1);
  }

  function nextWorksheetQuestion() {
    setFeedback("");
    if (questionIndex < questions.length - 1) setQuestionIndex((prev) => prev + 1);
    else setStep(3);
  }

  function answerMastery(option: string) {
    if (!currentMastery) return;
    const correct = option === currentMastery.answer;
    if (masteryIndex < masteryQuestions.length - 1) {
      if (correct) setMasteryScore((prev) => prev + 1);
      setMasteryIndex((prev) => prev + 1);
    } else {
      const finalScore = masteryScore + (correct ? 1 : 0);
      setMasteryScore(finalScore);
      setFinished(true);
    }
  }

  function restart() {
    setStep(0);
    setQuestionIndex(0);
    setAnswers({});
    setFeedback("");
    setChallengeScore(0);
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
            <h1 style={styles.title}>🔒 السكون</h1>
            <p style={styles.subtitle}>نتعلم مهارة واحدة فقط، بطريقة قصيرة وممتعة، ثم نتأكد من إتقانها.</p>
          </div>
          <div style={styles.timeCard}>
            <strong>⏱️ 4 دقائق</strong>
            <span>تدريب قصير بلا حشو</span>
          </div>
        </header>

        <div style={styles.progressWrap}>
          <div style={styles.progressLabels}><span>تقدمك</span><strong>{progress}%</strong></div>
          <div style={styles.progressTrack}><div style={{ ...styles.progressBar, width: `${progress}%` }} /></div>
        </div>

        {step === 0 && (
          <section style={styles.card}>
            <span style={styles.stepPill}>👀 1. شاهد واكتشف</span>
            <h2 style={styles.cardTitle}>ما السكون؟</h2>
            <p style={styles.largeText}>الحرف الساكن هو حرف لا توجد عليه فتحة أو ضمة أو كسرة.</p>
            <div style={styles.exampleBox}>
              <span style={styles.examplePart}>مَ</span><span style={styles.plus}>+</span><span style={styles.examplePart}>كْ</span><span style={styles.equals}>=</span><span style={styles.exampleResult}>مَكْ</span>
            </div>
            <button type="button" style={styles.listenButton} onClick={() => speak("مَكْ")}>🔊 استمع إلى «مَكْ»</button>
            <button type="button" style={styles.primaryButton} onClick={() => setStep(1)}>فهمت، دعني أجرّب ←</button>
          </section>
        )}

        {step === 1 && (
          <section style={styles.card}>
            <span style={styles.stepPill}>✋ 2. جرّب بنفسك</span>
            <h2 style={styles.cardTitle}>أين الحرف الساكن؟</h2>
            <p style={styles.largeText}>في المقطع: <strong>مَدْ</strong></p>
            <div style={styles.choiceGrid}>
              <button style={styles.choiceButton} onClick={() => setFeedback("🌱 الميم عليها فتحة، وليست ساكنة.")}>مَ</button>
              <button style={styles.choiceButton} onClick={() => setFeedback("✅ ممتاز! الدال هي الحرف الساكن: دْ.")}>دْ</button>
            </div>
            {feedback && <div style={styles.feedback}>{feedback}</div>}
            <button type="button" style={{ ...styles.primaryButton, opacity: feedback ? 1 : 0.55 }} disabled={!feedback} onClick={() => { setFeedback(""); setStep(2); }}>ابدأ ورقة العمل الإلكترونية ←</button>
          </section>
        )}

        {step === 2 && currentQuestion && (
          <section style={styles.card}>
            <div style={styles.cardTop}><span style={styles.stepPill}>📝 3. ورقة إلكترونية قصيرة</span><strong style={styles.counter}>{questionIndex + 1} / {questions.length}</strong></div>
            <h2 style={styles.question}>{currentQuestion.prompt}</h2>
            <div style={styles.options}>
              {currentQuestion.options.map((option) => {
                const selected = answers[currentQuestion.id] === option;
                const locked = Boolean(answers[currentQuestion.id]);
                return <button key={option} type="button" disabled={locked} onClick={() => answerWorksheet(option)} style={{ ...styles.optionButton, ...(selected ? styles.optionSelected : {}) }}>{option}</button>;
              })}
            </div>
            {feedback && <><div style={styles.feedback}>{feedback}</div><button type="button" style={styles.primaryButton} onClick={nextWorksheetQuestion}>{questionIndex === questions.length - 1 ? "انتقل للتحدي 🎮" : "السؤال التالي ←"}</button></>}
          </section>
        )}

        {step === 3 && (
          <section style={styles.card}>
            <span style={styles.stepPill}>🎮 4. تحدي سريع</span>
            <h2 style={styles.cardTitle}>صائد السكون</h2>
            <p style={styles.largeText}>أنهيت ورقة العمل. حصلت على <strong>{challengeScore} من {questions.length}</strong>.</p>
            <div style={styles.challengeBox}><span>🎯</span><div><strong>مهمة فارس</strong><p>اقرأ الكلمات التالية بصوتك وحدد السكون:</p></div></div>
            <div style={styles.wordRow}>{["مَكْتَب", "يَكْتُبُ", "بَيْت"].map((word) => <button key={word} type="button" style={styles.wordChip} onClick={() => speak(word)}>🔊 {word}</button>)}</div>
            <button type="button" style={styles.primaryButton} onClick={() => setStep(4)}>أنا جاهز لاختبار الإتقان 🏆</button>
          </section>
        )}

        {step === 4 && !finished && currentMastery && (
          <section style={styles.card}>
            <div style={styles.cardTop}><span style={styles.stepPill}>🏆 5. تحقق من الإتقان</span><strong style={styles.counter}>{masteryIndex + 1} / {masteryQuestions.length}</strong></div>
            <h2 style={styles.question}>{currentMastery.prompt}</h2>
            <div style={styles.options}>{currentMastery.options.map((option) => <button key={option} type="button" style={styles.optionButton} onClick={() => answerMastery(option)}>{option}</button>)}</div>
          </section>
        )}

        {step === 4 && finished && (
          <section style={styles.successCard}>
            <div style={styles.trophy}>🏆</div>
            <h2 style={styles.successTitle}>{masteryScore >= 2 ? "أحسنت يا بطل!" : "اقتربت جدًا يا بطل!"}</h2>
            <p style={styles.successText}>{masteryScore >= 2 ? "أتقنت مهارة السكون وأصبحت جاهزًا للمهارة التالية." : "نحتاج تدريبًا قصيرًا إضافيًا على السكون، وسنجرّب بطريقة أخرى."}</p>
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
  page: { minHeight: "100vh", background: "linear-gradient(180deg,#f4fbf7 0%,#fffaf0 100%)", padding: "24px 14px 50px", fontFamily: "Tahoma, Arial, sans-serif", color: "#173f31" },
  shell: { maxWidth: "980px", margin: "0 auto" },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "14px" },
  backButton: { textDecoration: "none", color: "#176c46", background: "#ffffff", border: "1px solid #d9ebe2", borderRadius: "14px", padding: "10px 14px", fontWeight: 900 },
  badge: { background: "#e7f8ef", color: "#0f7a4f", border: "1px solid #cfeadd", borderRadius: "999px", padding: "9px 14px", fontWeight: 900 },
  hero: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "18px", flexWrap: "wrap", background: "linear-gradient(135deg,#137a52,#20a56e)", color: "#ffffff", borderRadius: "28px", padding: "24px", boxShadow: "0 18px 40px rgba(26,110,73,.16)" },
  eyebrow: { margin: "0 0 5px", fontSize: "14px", fontWeight: 900, color: "#d9fff0" },
  title: { margin: 0, fontSize: "clamp(30px,5vw,48px)" },
  subtitle: { margin: "8px 0 0", lineHeight: 1.8, maxWidth: "620px", color: "#effff7", fontWeight: 700 },
  timeCard: { minWidth: "150px", padding: "14px 16px", borderRadius: "18px", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.18)", display: "grid", gap: "4px", textAlign: "center" },
  progressWrap: { margin: "16px 0", background: "#ffffff", borderRadius: "18px", padding: "13px 15px", border: "1px solid #dcece4" },
  progressLabels: { display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: 900 },
  progressTrack: { height: "10px", borderRadius: "999px", background: "#e8f2ed", overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,#18a567,#57cf8e)", transition: "width .3s ease" },
  card: { background: "#ffffff", border: "1px solid #dcece4", borderRadius: "26px", padding: "24px", boxShadow: "0 14px 34px rgba(25,80,55,.08)" },
  successCard: { background: "linear-gradient(180deg,#ffffff,#f2fff7)", border: "1px solid #cfeadd", borderRadius: "30px", padding: "32px 24px", textAlign: "center", boxShadow: "0 16px 36px rgba(25,80,55,.10)" },
  stepPill: { display: "inline-flex", background: "#eaf9f0", color: "#14744d", borderRadius: "999px", padding: "8px 12px", fontWeight: 900, fontSize: "14px" },
  cardTitle: { margin: "16px 0 8px", fontSize: "28px" },
  largeText: { fontSize: "19px", lineHeight: 1.9, color: "#526b60" },
  exampleBox: { display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", flexWrap: "wrap", margin: "24px 0", direction: "rtl" },
  examplePart: { minWidth: "78px", textAlign: "center", padding: "18px", borderRadius: "18px", background: "#fff7d6", border: "2px solid #f2c94c", fontSize: "36px", fontWeight: 900 },
  exampleResult: { minWidth: "95px", textAlign: "center", padding: "18px", borderRadius: "18px", background: "#eaf9f0", border: "2px solid #44b87c", fontSize: "36px", fontWeight: 900 },
  plus: { fontSize: "28px", fontWeight: 900 },
  equals: { fontSize: "28px", fontWeight: 900 },
  listenButton: { width: "100%", border: "1px solid #cfeadd", background: "#f4fbf7", color: "#176c46", borderRadius: "16px", padding: "13px", fontWeight: 900, cursor: "pointer", marginBottom: "12px" },
  primaryButton: { width: "100%", border: "none", background: "linear-gradient(135deg,#168a63,#0f7654)", color: "#ffffff", borderRadius: "16px", padding: "14px 18px", fontWeight: 900, fontSize: "16px", cursor: "pointer", marginTop: "12px" },
  choiceGrid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "12px", margin: "20px 0" },
  choiceButton: { border: "2px solid #d7e7df", borderRadius: "18px", background: "#ffffff", padding: "22px", fontSize: "32px", fontWeight: 900, color: "#174c36", cursor: "pointer" },
  feedback: { marginTop: "14px", padding: "14px", borderRadius: "16px", background: "#f1faf5", border: "1px solid #d4ecdf", lineHeight: 1.8, fontWeight: 800 },
  cardTop: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" },
  counter: { color: "#62756b" },
  question: { margin: "22px 0", fontSize: "clamp(22px,4vw,30px)", lineHeight: 1.6 },
  options: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "12px" },
  optionButton: { border: "2px solid #d8e6df", background: "#ffffff", color: "#174c36", borderRadius: "18px", padding: "17px", fontSize: "22px", fontWeight: 900, cursor: "pointer" },
  optionSelected: { borderColor: "#1da66f", background: "#eaf9f0" },
  challengeBox: { display: "flex", alignItems: "center", gap: "14px", padding: "16px", borderRadius: "18px", background: "#fff8e6", border: "1px solid #f2dfaa", fontSize: "18px" },
  wordRow: { display: "flex", gap: "10px", flexWrap: "wrap", margin: "18px 0" },
  wordChip: { border: "1px solid #d5e7de", background: "#f7fcf9", color: "#176c46", borderRadius: "999px", padding: "11px 15px", fontSize: "17px", fontWeight: 900, cursor: "pointer" },
  trophy: { fontSize: "72px" },
  successTitle: { margin: "10px 0 5px", fontSize: "32px", color: "#146b47" },
  successText: { color: "#60756a", fontSize: "17px", lineHeight: 1.8 },
  resultCard: { margin: "20px auto", maxWidth: "260px", padding: "16px", borderRadius: "18px", background: "#ffffff", border: "1px solid #d5e8df", display: "grid", gap: "7px" },
  finalActions: { display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" },
  secondaryButton: { border: "1px solid #d4e6dd", background: "#ffffff", color: "#176c46", borderRadius: "15px", padding: "12px 16px", fontWeight: 900, cursor: "pointer" },
  primaryLink: { textDecoration: "none", background: "#168a63", color: "#ffffff", borderRadius: "15px", padding: "12px 16px", fontWeight: 900 },
};