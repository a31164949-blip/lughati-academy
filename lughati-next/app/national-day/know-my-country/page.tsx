"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Question = {
  question: string;
  options: string[];
  answer: string;
  emoji: string;
  fact: string;
};

const questions: Question[] = [
  {
    question: "ما عاصمة المملكة العربية السعودية؟",
    options: ["جدة", "الرياض", "أبها"],
    answer: "الرياض",
    emoji: "🏙️",
    fact: "الرياض هي عاصمة المملكة العربية السعودية.",
  },
  {
    question: "ما لون علم المملكة العربية السعودية؟",
    options: ["الأخضر", "الأزرق", "الأصفر"],
    answer: "الأخضر",
    emoji: "🇸🇦",
    fact: "يتميز علم المملكة بلونه الأخضر.",
  },
  {
    question: "ماذا يوجد على علم المملكة؟",
    options: ["نخلة فقط", "الشهادتان والسيف", "جبل"],
    answer: "الشهادتان والسيف",
    emoji: "⚔️",
    fact: "يحمل علم المملكة الشهادتين وتحتهما سيف.",
  },
  {
    question: "في أي مدينة توجد الكعبة المشرفة؟",
    options: ["الرياض", "المدينة المنورة", "مكة المكرمة"],
    answer: "مكة المكرمة",
    emoji: "🕋",
    fact: "تقع الكعبة المشرفة في مكة المكرمة.",
  },
  {
    question: "ما العملة الرسمية للمملكة العربية السعودية؟",
    options: ["الريال السعودي", "الدينار", "الدرهم"],
    answer: "الريال السعودي",
    emoji: "💰",
    fact: "الريال السعودي هو العملة الرسمية للمملكة.",
  },
];

export default function KnowMyCountryPage() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const question = questions[current];

  const progress = useMemo(() => {
    if (finished) return 100;
    return ((current + 1) / questions.length) * 100;
  }, [current, finished]);

  const chooseAnswer = (option: string) => {
    if (selected) return;

    setSelected(option);

    if (option === question.answer) {
      setScore((prev) => prev + 10);
    }
  };

  const nextQuestion = () => {
    if (!selected) return;

    if (current === questions.length - 1) {
      setFinished(true);
      return;
    }

    setCurrent((prev) => prev + 1);
    setSelected(null);
  };

  const restart = () => {
    setStarted(true);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
  };

  const getResult = () => {
    if (score === 50) {
      return {
        title: "بطل أعرف وطني",
        emoji: "🏆",
        message: "مذهل! تعرف وطنك جيدًا يا بطل.",
      };
    }

    if (score >= 30) {
      return {
        title: "نجم الوطن",
        emoji: "⭐",
        message: "أداء رائع.. واصل اكتشاف وطنك الجميل.",
      };
    }

    return {
      title: "مستكشف الوطن",
      emoji: "🌱",
      message: "بداية جميلة.. أعد التحدي واكتشف المزيد.",
    };
  };

  if (!started) {
    return (
      <main className="nationalPage" dir="rtl">
        <div className="decor decorOne">🇸🇦</div>
        <div className="decor decorTwo">⭐</div>

        <section className="startCard">
          <div className="brain">🧠</div>

          <span className="smallBadge">فعاليات اليوم الوطني</span>

          <h1>تحدي أعرف وطني</h1>

          <p className="intro">
            خمسة أسئلة ممتعة نكتشف من خلالها معلومات جميلة عن وطننا
            المملكة العربية السعودية.
          </p>

          <div className="infoRow">
            <div>
              <strong>5</strong>
              <span>أسئلة</span>
            </div>

            <div>
              <strong>50</strong>
              <span>نقطة</span>
            </div>

            <div>
              <strong>🏆</strong>
              <span>لقب وطني</span>
            </div>
          </div>

          <button className="mainButton" onClick={() => setStarted(true)}>
           ابدأ التحدي 🏆
          </button>

          <Link href="/national-day" className="backLink">
            العودة إلى فعاليات اليوم الوطني
          </Link>
        </section>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (finished) {
    const result = getResult();

    return (
      <main className="nationalPage" dir="rtl">
        <section className="resultCard">
          <div className="resultEmoji">{result.emoji}</div>

          <span className="smallBadge">أكاديمية لغتي الرقمية</span>

          <p className="completed">أتممت تحدي أعرف وطني</p>

          <h1>{result.title}</h1>

          <div className="scoreCircle">
            <strong>{score}</strong>
            <span>من 50</span>
          </div>

          <p className="resultMessage">{result.message}</p>

          <div className="resultActions">
            <button className="mainButton" onClick={restart}>
              🔄 أعد التحدي
            </button>

            <Link href="/national-day" className="secondaryButton">
              🏠 فعاليات اليوم الوطني
            </Link>
          </div>

          <p className="academyFooter">
            أكاديمية لغتي الرقمية • تعلم • اقرأ • أبدع
          </p>
        </section>

        <style jsx>{styles}</style>
      </main>
    );
  }

  const isCorrect = selected === question.answer;

  return (
    <main className="nationalPage" dir="rtl">
      <section className="gameCard">
        <div className="topRow">
          <span className="questionNumber">
            السؤال {current + 1} من {questions.length}
          </span>

          <span className="points">⭐ {score} نقطة</span>
        </div>

        <div className="progressTrack">
          <div
            className="progressBar"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="questionEmoji">{question.emoji}</div>

        <h1 className="questionTitle">{question.question}</h1>

        <div className="options">
          {question.options.map((option) => {
            let className = "optionButton";

            if (selected) {
              if (option === question.answer) {
                className += " correct";
              } else if (option === selected) {
                className += " wrong";
              } else {
                className += " disabled";
              }
            }

            return (
              <button
                key={option}
                className={className}
                onClick={() => chooseAnswer(option)}
                disabled={Boolean(selected)}
              >
                {option}

                {selected && option === question.answer && (
                  <span>✓</span>
                )}

                {selected &&
                  option === selected &&
                  option !== question.answer && <span>✕</span>}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className={`feedback ${isCorrect ? "good" : "tryAgain"}`}>
            <strong>
              {isCorrect
                ? "أحسنت يا بطل! +10 نقاط ⭐"
                : "محاولة جميلة 🌟"}
            </strong>

            <p>{question.fact}</p>
          </div>
        )}

        {selected && (
          <button className="nextButton" onClick={nextQuestion}>
            {current === questions.length - 1
              ? "شاهد نتيجتي 🏆"
              : "السؤال التالي ←"}
          </button>
        )}

        <Link href="/national-day" className="exitLink">
          خروج من التحدي
        </Link>
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  .nationalPage {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px 18px;
    position: relative;
    overflow: hidden;
    font-family: Tahoma, Arial, sans-serif;
    background:
      radial-gradient(circle at 10% 15%, rgba(214, 177, 79, .15), transparent 25%),
      radial-gradient(circle at 90% 85%, rgba(0, 108, 67, .12), transparent 28%),
      linear-gradient(145deg, #fbfdfb, #f2faf6);
  }

  .decor {
    position: absolute;
    font-size: 70px;
    opacity: .08;
    user-select: none;
  }

  .decorOne {
    top: 8%;
    right: 7%;
    transform: rotate(10deg);
  }

  .decorTwo {
    bottom: 8%;
    left: 8%;
    font-size: 100px;
  }

  .startCard,
  .gameCard,
  .resultCard {
    width: min(680px, 100%);
    background: rgba(255,255,255,.97);
    border: 1px solid #d9eee4;
    border-radius: 32px;
    padding: 38px;
    box-shadow: 0 22px 60px rgba(0, 90, 55, .10);
    text-align: center;
    position: relative;
    z-index: 2;
  }

  .brain,
  .resultEmoji {
    font-size: 70px;
    margin-bottom: 10px;
  }

  .smallBadge {
    display: inline-block;
    background: #fff3c8;
    color: #956b00;
    padding: 8px 16px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 14px;
  }

  h1 {
    color: #006c43;
    margin: 18px 0 12px;
    font-size: clamp(28px, 5vw, 42px);
  }

  .intro {
    color: #64756d;
    font-size: 18px;
    line-height: 2;
    max-width: 540px;
    margin: 0 auto 26px;
  }

  .infoRow {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin: 25px 0;
  }

  .infoRow div {
    background: #f5faf7;
    border: 1px solid #e0eee7;
    border-radius: 20px;
    padding: 16px 8px;
  }

  .infoRow strong {
    display: block;
    color: #006c43;
    font-size: 25px;
    margin-bottom: 5px;
  }

  .infoRow span {
    color: #718078;
    font-size: 14px;
  }

  .mainButton,
  .nextButton {
    border: none;
    background: linear-gradient(135deg, #008653, #006c43);
    color: white;
    font-size: 19px;
    font-weight: 800;
    padding: 16px 28px;
    border-radius: 17px;
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(0, 108, 67, .18);
    transition: .2s ease;
  }

  .mainButton:hover,
  .nextButton:hover {
    transform: translateY(-2px);
  }

  .backLink,
  .exitLink {
    display: block;
    margin-top: 20px;
    color: #73827a;
    text-decoration: none;
    font-size: 14px;
  }

  .topRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }

  .questionNumber,
  .points {
    font-weight: 700;
    color: #53665c;
  }

  .points {
    color: #9b7307;
    background: #fff6d9;
    padding: 7px 12px;
    border-radius: 999px;
  }

  .progressTrack {
    height: 11px;
    background: #e7f1ec;
    border-radius: 999px;
    overflow: hidden;
  }

  .progressBar {
    height: 100%;
    background: linear-gradient(90deg, #00a868, #006c43);
    border-radius: 999px;
    transition: width .4s ease;
  }

  .questionEmoji {
    font-size: 58px;
    margin: 28px 0 8px;
  }

  .questionTitle {
    font-size: clamp(24px, 4vw, 34px);
    line-height: 1.7;
    margin-bottom: 24px;
  }

  .options {
    display: grid;
    gap: 13px;
  }

  .optionButton {
    width: 100%;
    border: 2px solid #e2eee8;
    background: white;
    color: #30473c;
    border-radius: 18px;
    padding: 16px 20px;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: .18s ease;
  }

  .optionButton:hover:not(:disabled) {
    border-color: #008653;
    background: #f3fbf7;
    transform: translateY(-1px);
  }

  .optionButton.correct {
    background: #e8f8ef;
    border-color: #15945e;
    color: #006c43;
  }

  .optionButton.wrong {
    background: #fff0ef;
    border-color: #dc716a;
    color: #a63b35;
  }

  .optionButton.disabled {
    opacity: .55;
  }

  .feedback {
    margin-top: 18px;
    padding: 15px 18px;
    border-radius: 17px;
    text-align: right;
    line-height: 1.7;
  }

  .feedback p {
    margin: 5px 0 0;
    font-size: 14px;
  }

  .good {
    background: #eaf8f0;
    color: #09673f;
  }

  .tryAgain {
    background: #fff7e1;
    color: #7b5a09;
  }

  .nextButton {
    width: 100%;
    margin-top: 18px;
  }

  .completed {
    color: #738078;
    margin: 15px 0 0;
  }

  .scoreCircle {
    width: 145px;
    height: 145px;
    margin: 25px auto;
    border-radius: 50%;
    background: #f1faf5;
    border: 7px solid #d8efe3;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .scoreCircle strong {
    color: #006c43;
    font-size: 40px;
  }

  .scoreCircle span {
    color: #718078;
  }

  .resultMessage {
    color: #596d62;
    font-size: 18px;
    margin-bottom: 24px;
  }

  .resultActions {
    display: grid;
    gap: 12px;
  }

  .secondaryButton {
    display: block;
    padding: 15px;
    border: 2px solid #d9ebe2;
    border-radius: 17px;
    color: #006c43;
    text-decoration: none;
    font-weight: 800;
  }

  .academyFooter {
    border-top: 1px solid #edf2ef;
    margin: 25px 0 0;
    padding-top: 18px;
    color: #9a7b27;
    font-size: 13px;
  }

  @media (max-width: 600px) {
    .startCard,
    .gameCard,
    .resultCard {
      padding: 26px 18px;
      border-radius: 24px;
    }

    .infoRow {
      gap: 7px;
    }

    .topRow {
      font-size: 13px;
    }

    .optionButton {
      font-size: 16px;
    }
  }
`;