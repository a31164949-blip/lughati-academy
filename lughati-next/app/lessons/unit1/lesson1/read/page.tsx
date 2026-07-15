"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const readingText =
  "صلة الرحم خُلُق جميل. أتواصل مع أقاربي، وأسأل عنهم، وأزورهم، وأساعدهم عند الحاجة. أحب جدتي وجدي، وأحترم عمي وعمتي، وأزور خالي وخالتي. عندما أصل رحمي أنشر المحبة والسعادة بين أفراد عائلتي.";

const vocabulary = [
  {
    word: "صلة الرحم",
    meaning: "التواصل مع الأقارب والإحسان إليهم.",
    icon: "🤝",
  },
  {
    word: "أقاربي",
    meaning: "أفراد عائلتي من جهة الأب والأم.",
    icon: "👨‍👩‍👧‍👦",
  },
  {
    word: "أطمئن",
    meaning: "أسأل عن الشخص لأعرف أنه بخير.",
    icon: "💚",
  },
];

const questions = [
  {
    question: "أيُّ سلوك يدل على صلة الرحم؟",
    options: [
      "زيارة الأقارب والسؤال عنهم",
      "تجاهل الأقارب",
      "عدم مساعدة أفراد العائلة",
    ],
    correctAnswer: 0,
  },
  {
    question: "من أقاربي؟",
    options: ["عمي وخالتي", "كتابي وقلمي", "مقعدي وحقيبتي"],
    correctAnswer: 0,
  },
  {
    question: "ماذا أنشر عندما أصل رحمي؟",
    options: ["المحبة والسعادة", "الحزن والخلاف", "الإهمال"],
    correctAnswer: 0,
  },
];

export default function ReadPage() {
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [showResults, setShowResults] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const savedCompletion = window.localStorage.getItem(
      "unit1-lesson1-read-completed",
    );

    if (savedCompletion === "true") {
      setCompleted(true);
    }
  }, []);

  const score = questions.reduce((total, question, index) => {
    return selectedAnswers[index] === question.correctAnswer
      ? total + 1
      : total;
  }, 0);

  const allQuestionsAnswered =
    Object.keys(selectedAnswers).length === questions.length;

  function selectAnswer(questionIndex: number, answerIndex: number) {
    if (showResults) return;

    setSelectedAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionIndex]: answerIndex,
    }));
  }

  function checkAnswers() {
    if (!allQuestionsAnswered) return;

    setShowResults(true);

    if (score === questions.length) {
      setCompleted(true);
      window.localStorage.setItem(
        "unit1-lesson1-read-completed",
        "true",
      );
    }
  }

  function tryAgain() {
    setSelectedAnswers({});
    setShowResults(false);
  }

  function readTextAloud() {
  
if (!("speechSynthesis" in window)) {
  return;
}
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(readingText);
    speech.lang = "ar-SA";
    speech.rate = 0.8;
    speech.pitch = 1;

    speech.onstart = () => setIsSpeaking(true);
    speech.onend = () => setIsSpeaking(false);
    speech.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(speech);
  }

  function stopReading() {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-sky-50 px-4 py-6 text-slate-900 md:px-8 md:py-10"
    >
      <section className="mx-auto max-w-6xl">
        <header className="mb-7 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm md:p-9">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="mb-2 font-bold text-emerald-700">
                أكاديمية لغتي
              </p>

              <span className="mb-3 inline-block rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">
                📖 أقرأ وأفهم
              </span>

              <h1 className="mb-3 text-3xl font-bold md:text-5xl">
                صلة الرحم
              </h1>

              <p className="max-w-3xl text-lg leading-9 text-slate-600">
                اقرأ النص بهدوء، واستمع إليه، ثم أجب عن الأسئلة لتحصل
                على نجمة القراءة.
              </p>
            </div>

            <Link
              href="/lessons/unit1/lesson1"
              className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              العودة إلى الدرس
            </Link>
          </div>

          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-600">
              <span>تقدم نشاط القراءة</span>
              <span>{completed ? "100%" : "50%"}</span>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full bg-emerald-500 transition-all duration-500 ${
                  completed ? "w-full" : "w-1/2"
                }`}
              />
            </div>
          </div>
        </header>

        <section className="mb-7 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
          <div className="grid md:grid-cols-[280px_1fr]">
            <div className="flex min-h-64 items-center justify-center bg-gradient-to-br from-emerald-100 to-sky-100 p-8">
              <div className="text-center">
                <div className="mb-4 text-8xl">👨‍👩‍👧‍👦</div>

                <p className="text-xl font-bold text-emerald-800">
                  عائلتي مصدر المحبة
                </p>
              </div>
            </div>

            <div className="p-6 md:p-9">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-3xl font-bold">
                  📚 نص القراءة
                </h2>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={readTextAloud}
                    disabled={isSpeaking}
                    className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSpeaking ? "🔊 جاري الاستماع..." : "🔊 استمع إلى النص"}
                  </button>

                  {isSpeaking && (
                    <button
                      type="button"
                      onClick={stopReading}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 font-bold text-rose-700"
                    >
                      ⏹ إيقاف
                    </button>
                  )}
                </div>
              </div>

              <p className="rounded-3xl bg-amber-50 p-6 text-2xl leading-[2.2] text-slate-800">
                صلة الرحم خُلُق جميل. أتواصل مع{" "}
                <span className="font-bold text-emerald-700">
                  أقاربي
                </span>
                ، وأسأل عنهم، وأزورهم، وأساعدهم عند الحاجة. أحب جدتي
                وجدي، وأحترم عمي وعمتي، وأزور خالي وخالتي. عندما{" "}
                <span className="font-bold text-emerald-700">
                  أصل رحمي
                </span>{" "}
                أنشر المحبة والسعادة بين أفراد عائلتي.
              </p>

              <div className="mt-5 rounded-2xl border-r-4 border-emerald-500 bg-emerald-50 p-5">
                <p className="text-lg font-bold leading-8 text-emerald-900">
                  💡 الفكرة الرئيسة: أتواصل مع أقاربي وأحسن إليهم
                  لتسود المحبة بين أفراد العائلة.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-7 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-6 text-3xl font-bold">
            🌱 كلمات جديدة
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {vocabulary.map((item) => (
              <article
                key={item.word}
                className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5"
              >
                <div className="mb-3 text-4xl">{item.icon}</div>

                <h3 className="mb-2 text-2xl font-bold text-emerald-800">
                  {item.word}
                </h3>

                <p className="leading-8 text-slate-700">
                  {item.meaning}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-7 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-7">
            <span className="mb-3 inline-block rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-800">
              اختبر فهمك
            </span>

            <h2 className="text-3xl font-bold">
              ✍️ أجب عن الأسئلة
            </h2>
          </div>

          <div className="space-y-7">
            {questions.map((question, questionIndex) => (
              <article
                key={question.question}
                className="rounded-3xl border border-slate-200 p-5 md:p-6"
              >
                <h3 className="mb-5 text-xl font-bold leading-9">
                  {questionIndex + 1}. {question.question}
                </h3>

                <div className="grid gap-3">
                  {question.options.map((option, answerIndex) => {
                    const isSelected =
                      selectedAnswers[questionIndex] === answerIndex;
                    const isCorrect =
                      question.correctAnswer === answerIndex;

                    let answerStyle =
                      "border-slate-200 bg-white text-slate-700";

                    if (isSelected && !showResults) {
                      answerStyle =
                        "border-emerald-500 bg-emerald-50 text-emerald-900";
                    }

                    if (showResults && isCorrect) {
                      answerStyle =
                        "border-emerald-500 bg-emerald-100 text-emerald-900";
                    }

                    if (showResults && isSelected && !isCorrect) {
                      answerStyle =
                        "border-rose-400 bg-rose-50 text-rose-800";
                    }

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          selectAnswer(questionIndex, answerIndex)
                        }
                        className={`rounded-2xl border-2 p-4 text-right text-lg font-bold transition ${answerStyle}`}
                      >
                        {option}

                        {showResults && isCorrect && (
                          <span className="mr-2">✅</span>
                        )}

                        {showResults && isSelected && !isCorrect && (
                          <span className="mr-2">❌</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            {!showResults ? (
              <button
                type="button"
                onClick={checkAnswers}
                disabled={!allQuestionsAnswered}
                className="rounded-2xl bg-emerald-600 px-7 py-4 text-lg font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                تحقق من إجاباتي
              </button>
            ) : (
              <button
                type="button"
                onClick={tryAgain}
                className="rounded-2xl border border-emerald-300 bg-white px-7 py-4 text-lg font-bold text-emerald-700"
              >
                إعادة المحاولة
              </button>
            )}

            {!allQuestionsAnswered && !showResults && (
              <p className="text-slate-500">
                أجب عن جميع الأسئلة أولًا.
              </p>
            )}
          </div>

          {showResults && (
            <div
              className={`mt-7 rounded-3xl p-6 ${
                score === questions.length
                  ? "bg-emerald-100"
                  : "bg-amber-100"
              }`}
            >
              <h3 className="mb-2 text-2xl font-bold">
                نتيجتك: {score} من {questions.length}
              </h3>

              <p className="text-lg leading-8">
                {score === questions.length
                  ? "🌟 أحسنت يا بطل! أجبت عن جميع الأسئلة بصورة صحيحة وحصلت على نجمة القراءة."
                  : "محاولة جميلة! راجع النص ثم أعد المحاولة حتى تحصل على النجمة."}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="mb-2 text-3xl font-bold">
                {completed
                  ? "⭐ حصلت على نجمة القراءة"
                  : "🏆 أكمل النشاط لتحصل على النجمة"}
              </h2>

              <p className="leading-8 text-slate-600">
                {completed
                  ? "تم حفظ إنجازك على هذا الجهاز. تستطيع العودة إلى الدرس ومتابعة رحلتك التعليمية."
                  : "اقرأ النص وأجب عن جميع الأسئلة بصورة صحيحة."}
              </p>
            </div>

            <Link
              href="/lessons/unit1/lesson1"
              className={`rounded-2xl px-7 py-4 text-lg font-bold text-white ${
                completed ? "bg-emerald-600" : "bg-slate-400"
              }`}
            >
              العودة إلى أنشطة الدرس
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}