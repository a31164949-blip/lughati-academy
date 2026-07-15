"use client";

import Link from "next/link";
import { useState } from "react";

const pictureChoices = [
  { icon: "🦁", word: "أسد", correct: true },
  { icon: "🍎", word: "تفاحة", correct: false },
  { icon: "🐪", word: "جمل", correct: false },
];

export default function AlefTrainingPage() {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) {
      alert("التشغيل الصوتي غير متاح في هذا المتصفح.");
      return;
    }

    window.speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = "ar-SA";
    voice.rate = 0.7;
    voice.pitch = 1;

    window.speechSynthesis.speak(voice);
  };

  const selectAnswer = (word: string, correct: boolean) => {
    setSelectedWord(word);

    if (correct) {
      setCompleted(true);
      speak("رائع");
    } else {
      setCompleted(false);
      speak("حاول مرة أخرى");
    }
  };

  return (
    <main className="letter-training-page" dir="rtl">
      <header className="letter-training-header">
        <Link href="/support/letters" className="back-to-letters">
          → العودة إلى الحروف
        </Link>

        <div className="training-title">
          <div className="training-letter">أ</div>

          <div>
            <span>تدريب الحرف الأول</span>
            <h1>حرف الألف</h1>
            <p>أستمع إلى الحرف، وأنطقه، ثم أتعرف الكلمات التي تبدأ به.</p>
          </div>
        </div>
      </header>

      <section className="training-hero">
        <div>
          <span className="training-badge">أنا فارس وسأتدرّب معك ⭐</span>
          <h2>أَ — أُ — إِ</h2>
          <p>
            اضغط على الأزرار، واستمع إلى صوت حرف الألف مع الحركات، ثم كرّر
            الصوت بصوت واضح.
          </p>
        </div>

        <div className="training-mascot">🧒🏻</div>
      </section>

      <section className="training-section">
        <div className="training-section-title">
          <span>الخطوة الأولى</span>
          <h2>استمع إلى صوت الحرف</h2>
        </div>

        <div className="sound-buttons">
          <button type="button" onClick={() => speak("أَ")}>
            <strong>أَ</strong>
            <span>استمع</span>
            <span>🔊</span>
          </button>

          <button type="button" onClick={() => speak("أُ")}>
            <strong>أُ</strong>
            <span>استمع</span>
            <span>🔊</span>
          </button>

          <button type="button" onClick={() => speak("إِ")}>
            <strong>إِ</strong>
            <span>استمع</span>
            <span>🔊</span>
          </button>
        </div>
      </section>

      <section className="training-section">
        <div className="training-section-title">
          <span>الخطوة الثانية</span>
          <h2>استمع إلى الكلمة ثم كرّرها</h2>
        </div>

        <div className="example-word-card">
          <div className="example-picture">🦁</div>

          <div className="example-content">
            <span>أَسَد</span>
            <h3>
              <mark>أ</mark>سد
            </h3>
            <p>تبدأ كلمة أسد بحرف الألف.</p>
          </div>

          <button type="button" onClick={() => speak("أَسَد")}>
            🔊 استمع إلى الكلمة
          </button>
        </div>
      </section>

      <section className="training-section">
        <div className="training-section-title">
          <span>الخطوة الثالثة</span>
          <h2>اختر الصورة التي تبدأ بحرف الألف</h2>
        </div>

        <div className="picture-choices">
          {pictureChoices.map((choice) => {
            const isSelected = selectedWord === choice.word;

            return (
              <button
                type="button"
                key={choice.word}
                onClick={() => selectAnswer(choice.word, choice.correct)}
                className={
                  isSelected
                    ? choice.correct
                      ? "picture-choice correct-choice"
                      : "picture-choice wrong-choice"
                    : "picture-choice"
                }
              >
                <span>{choice.icon}</span>
                <strong>{choice.word}</strong>

                {isSelected && (
                  <small>{choice.correct ? "أحسنت ✅" : "حاول مجددًا 🔄"}</small>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="training-section">
        <div className="training-section-title">
          <span>الخطوة الرابعة</span>
          <h2>كوّن كلمة أسد</h2>
        </div>

        <div className="word-building">
          <div className="word-letter highlighted-letter">أ</div>
          <div className="word-letter">س</div>
          <div className="word-letter">د</div>
          <span>=</span>
          <strong>أَسَد 🦁</strong>
        </div>
      </section>

      <section
        className={
          completed
            ? "training-result completed-result"
            : "training-result"
        }
      >
        <div className="result-star">{completed ? "⭐" : "🌱"}</div>

        <div>
          <span>{completed ? "تم إنجاز التدريب" : "أكمل التدريب"}</span>
          <h2>
            {completed
              ? "أحسنت يا بطل!"
              : "اختر الإجابة الصحيحة لتحصل على النجمة"}
          </h2>
          <p>
            {completed
              ? "تعرّفت حرف الألف وصوته وكلمة تبدأ به."
              : "استمع إلى الحرف وجرّب الإجابة مرة أخرى."}
          </p>
        </div>

        {completed && (
          <Link href="/support/letters" className="finish-training-button">
            العودة إلى الحروف ←
          </Link>
        )}
      </section>
    </main>
  );
}