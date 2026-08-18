"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../../../firebase";

type WeeklyWord = {
  word: string;
  vocalizedWord: string;
  meaning: string;
  example: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
  published: boolean;
};

const fallbackWord: WeeklyWord = {
  word: "صلة",
  vocalizedWord: "صِلَة",
  meaning:
    "التواصل مع الأقارب والإحسان إليهم والسؤال عنهم.",
  example:
    "أحرص على صِلَةِ أقاربي وزيارتهم.",
  question:
    "ما المعنى الأقرب لكلمة «صِلَة»؟",
  options: [
    "التواصل والإحسان إلى الأقارب",
    "الابتعاد عن الأقارب",
    "اللعب وحدي",
  ],
  correctIndex: 0,
  hint:
    "تذكّر قصة فواز وزيارته لبيت جده.",
  published: true,
};

export default function WeeklyWordPage() {
  const [
    weeklyWord,
    setWeeklyWord,
  ] =
    useState<WeeklyWord>(
      fallbackWord
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    selectedAnswer,
    setSelectedAnswer,
  ] = useState<number | null>(
    null
  );

  const [
    checked,
    setChecked,
  ] = useState(false);

  const [
    sentence,
    setSentence,
  ] = useState("");

  const [
    showCelebration,
    setShowCelebration,
  ] = useState(false);

  useEffect(() => {
    async function loadWeeklyWord() {
      try {
        setLoading(true);

        /*
         * سنستخدم مستندًا ثابتًا:
         *
         * weeklyPicks/current
         *
         * وداخله حقل:
         *
         * word: {
         *   word,
         *   vocalizedWord,
         *   meaning,
         *   example,
         *   question,
         *   options,
         *   correctIndex,
         *   hint,
         *   published
         * }
         */

        const snapshot =
          await getDoc(
            doc(
              db,
              "weeklyPicks",
              "current"
            )
          );

        if (!snapshot.exists()) {
          setWeeklyWord(
            fallbackWord
          );
          return;
        }

        const data =
          snapshot.data();

        const wordData =
          data.word;

        if (
          !wordData ||
          wordData.published !==
            true
        ) {
          setWeeklyWord(
            fallbackWord
          );
          return;
        }

        const options =
          Array.isArray(
            wordData.options
          )
            ? wordData.options.filter(
                (
                  item: unknown
                ): item is string =>
                  typeof item ===
                  "string"
              )
            : [];

        setWeeklyWord({
          word:
            typeof wordData.word ===
            "string"
              ? wordData.word
              : fallbackWord.word,

          vocalizedWord:
            typeof wordData.vocalizedWord ===
            "string"
              ? wordData.vocalizedWord
              : fallbackWord.vocalizedWord,

          meaning:
            typeof wordData.meaning ===
            "string"
              ? wordData.meaning
              : fallbackWord.meaning,

          example:
            typeof wordData.example ===
            "string"
              ? wordData.example
              : fallbackWord.example,

          question:
            typeof wordData.question ===
            "string"
              ? wordData.question
              : fallbackWord.question,

          options:
            options.length >= 2
              ? options
              : fallbackWord.options,

          correctIndex:
            typeof wordData.correctIndex ===
            "number"
              ? wordData.correctIndex
              : fallbackWord.correctIndex,

          hint:
            typeof wordData.hint ===
            "string"
              ? wordData.hint
              : fallbackWord.hint,

          published: true,
        });
      } catch (error) {
        console.error(
          "تعذر تحميل كلمة الأسبوع:",
          error
        );

        setWeeklyWord(
          fallbackWord
        );
      } finally {
        setLoading(false);
      }
    }

    void loadWeeklyWord();
  }, []);

  const isCorrect =
    useMemo(
      () =>
        selectedAnswer ===
        weeklyWord.correctIndex,
      [
        selectedAnswer,
        weeklyWord.correctIndex,
      ]
    );

  function chooseAnswer(
    index: number
  ) {
    if (checked) {
      return;
    }

    setSelectedAnswer(
      index
    );
  }

  function checkAnswer() {
    if (
      selectedAnswer ===
      null
    ) {
      return;
    }

    setChecked(true);

    if (
      selectedAnswer ===
      weeklyWord.correctIndex
    ) {
      setShowCelebration(
        true
      );

      window.setTimeout(
        () =>
          setShowCelebration(
            false
          ),
        2500
      );
    }
  }

  function retryQuestion() {
    setSelectedAnswer(
      null
    );

    setChecked(false);
  }

  function speakWord() {
    if (
      typeof window ===
        "undefined" ||
      !(
        "speechSynthesis" in
        window
      )
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        weeklyWord.vocalizedWord
      );

    utterance.lang =
      "ar-SA";

    utterance.rate =
      0.72;

    utterance.pitch =
      1;

    window.speechSynthesis.speak(
      utterance
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-sky-50 px-3 py-5 sm:px-5"
    >
      <style>{`
        @keyframes gemFloat {
          0%,100% {
            transform:
              translateY(0)
              rotate(-3deg);
          }

          50% {
            transform:
              translateY(-9px)
              rotate(3deg);
          }
        }

        @keyframes glowPulse {
          0%,100% {
            transform: scale(1);
            opacity: .65;
          }

          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        @keyframes celebrationPop {
          0% {
            transform:
              scale(.4)
              rotate(-10deg);
            opacity: 0;
          }

          60% {
            transform:
              scale(1.15)
              rotate(4deg);
            opacity: 1;
          }

          100% {
            transform:
              scale(1)
              rotate(0);
            opacity: 1;
          }
        }

        .gem-float {
          animation:
            gemFloat
            4s
            ease-in-out
            infinite;
        }

        .glow-pulse {
          animation:
            glowPulse
            2.8s
            ease-in-out
            infinite;
        }

        .celebration-pop {
          animation:
            celebrationPop
            .45s
            ease-out;
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .gem-float,
          .glow-pulse {
            animation: none;
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">

        {/* أدوات الصفحة */}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 font-black text-emerald-700 no-underline shadow-sm"
          >
            ← العودة إلى الرئيسية
          </Link>

          <Link
            href="/picks"
            className="rounded-2xl bg-emerald-100 px-5 py-3 font-black text-emerald-700 no-underline"
          >
            ✨ جميع المختارات
          </Link>
        </div>

        {/* الغلاف */}

        <section className="relative overflow-hidden rounded-[38px] bg-gradient-to-l from-emerald-900 via-emerald-700 to-teal-600 p-6 text-white shadow-2xl sm:p-8">

          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />

          <div className="absolute -bottom-24 left-[28%] h-52 w-52 rounded-full bg-amber-300/10" />

          <div className="relative grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-center">

            <div>
              <span className="inline-flex rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-amber-900">
                💎 كلمة جميلة
              </span>

              <p className="mt-5 text-sm font-black text-emerald-100">
                كلمة هذا الأسبوع
              </p>

              <h1 className="mt-2 text-5xl font-black leading-[1.4] sm:text-7xl">
                {loading
                  ? "..."
                  : weeklyWord.vocalizedWord}
              </h1>

              <p className="mt-4 max-w-2xl text-lg font-bold leading-9 text-emerald-50">
                كلمة واحدة قد تفتح
                لنا بابًا جديدًا
                للفهم والتعبير.
              </p>

              <button
                type="button"
                onClick={
                  speakWord
                }
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-emerald-800 shadow-lg transition hover:-translate-y-1"
              >
                🔊 استمع إلى الكلمة
              </button>
            </div>

            {/* الجوهرة */}

            <div className="relative mx-auto grid h-[260px] w-[260px] place-items-center">

              <div className="glow-pulse absolute inset-4 rounded-full bg-amber-300/20 blur-xl" />

              <div className="gem-float relative grid h-[190px] w-[190px] place-items-center rounded-[42px] border border-white/20 bg-white/10 shadow-2xl backdrop-blur">
                <span className="text-[105px]">
                  💎
                </span>

                <span className="absolute right-2 top-3 text-4xl">
                  ✨
                </span>

                <span className="absolute bottom-3 left-3 text-3xl">
                  ⭐
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* المعنى */}

        <section className="mt-6 grid gap-4 md:grid-cols-2">

          <article className="rounded-[30px] border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-3xl">
              📖
            </div>

            <p className="mt-4 text-sm font-black text-emerald-700">
              معنى الكلمة
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-800">
              ماذا تعني{" "}
              {
                weeklyWord.vocalizedWord
              }
              ؟
            </h2>

            <p className="mt-3 text-lg font-bold leading-9 text-slate-600">
              {
                weeklyWord.meaning
              }
            </p>
          </article>

          <article className="rounded-[30px] border border-sky-200 bg-gradient-to-l from-sky-50 to-white p-6 shadow-sm">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-100 text-3xl">
              💬
            </div>

            <p className="mt-4 text-sm font-black text-sky-700">
              الكلمة في جملة
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-800">
              أقرأ المثال
            </h2>

            <p className="mt-3 rounded-2xl bg-white px-5 py-4 text-xl font-black leading-9 text-slate-700 shadow-sm">
              «
              {
                weeklyWord.example
              }
              »
            </p>
          </article>
        </section>

        {/* سؤال الفهم */}

        <section className="mt-6 rounded-[34px] border border-violet-100 bg-gradient-to-b from-violet-50 to-white p-5 shadow-sm sm:p-7">

          <div className="text-center">
            <span className="inline-flex rounded-full bg-violet-600 px-4 py-2 text-sm font-black text-white">
              🧠 أتأكد من فهمي
            </span>

            <h2 className="mt-3 text-2xl font-black text-slate-800 sm:text-3xl">
              {
                weeklyWord.question
              }
            </h2>

            <p className="mt-2 text-slate-500">
              اختر الإجابة ثم تحقق
              منها.
            </p>
          </div>

          <div className="mx-auto mt-6 grid max-w-4xl gap-3 sm:grid-cols-3">
            {weeklyWord.options.map(
              (
                option,
                index
              ) => {
                const selected =
                  selectedAnswer ===
                  index;

                const correct =
                  checked &&
                  index ===
                    weeklyWord.correctIndex;

                const wrong =
                  checked &&
                  selected &&
                  index !==
                    weeklyWord.correctIndex;

                return (
                  <button
                    key={`${option}-${index}`}
                    type="button"
                    onClick={() =>
                      chooseAnswer(
                        index
                      )
                    }
                    className={`min-h-[92px] rounded-[22px] border-2 px-4 py-4 text-base font-black leading-7 transition ${
                      correct
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : wrong
                          ? "border-rose-400 bg-rose-50 text-rose-700"
                          : selected
                            ? "border-violet-500 bg-violet-100 text-violet-800"
                            : "border-slate-100 bg-white text-slate-700 hover:border-violet-300"
                    }`}
                  >
                    {option}

                    {correct &&
                      " ✅"}

                    {wrong &&
                      " ❌"}
                  </button>
                );
              }
            )}
          </div>

          {!checked ? (
            <button
              type="button"
              onClick={
                checkAnswer
              }
              disabled={
                selectedAnswer ===
                null
              }
              className="mx-auto mt-5 block w-full max-w-sm rounded-2xl bg-violet-700 px-5 py-4 font-black text-white shadow-lg disabled:bg-slate-300"
            >
              ✅ تحقق من إجابتي
            </button>
          ) : (
            <div className="mx-auto mt-5 max-w-xl rounded-[24px] border bg-white p-5 text-center shadow-sm">

              {isCorrect ? (
                <>
                  <div className="text-5xl">
                    🏆
                  </div>

                  <h3 className="mt-2 text-xl font-black text-emerald-700">
                    رائع يا بطل!
                  </h3>

                  <p className="mt-2 text-slate-600">
                    فهمت معنى الكلمة
                    بشكل صحيح.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-5xl">
                    💡
                  </div>

                  <h3 className="mt-2 text-xl font-black text-amber-700">
                    حاول مرة أخرى
                  </h3>

                  <p className="mt-2 leading-7 text-slate-600">
                    {
                      weeklyWord.hint
                    }
                  </p>

                  <button
                    type="button"
                    onClick={
                      retryQuestion
                    }
                    className="mt-4 rounded-2xl bg-amber-100 px-5 py-3 font-black text-amber-800"
                  >
                    🔄 أحاول من جديد
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        {/* أستخدم الكلمة */}

        <section className="mt-6 rounded-[34px] border-2 border-amber-200 bg-gradient-to-l from-amber-50 via-white to-emerald-50 p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-start">

            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-amber-100 text-4xl">
              ✍️
            </div>

            <div className="flex-1">
              <p className="text-sm font-black text-amber-700">
                الآن دورك
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-800">
                استخدم كلمة{" "}
                {
                  weeklyWord.vocalizedWord
                }{" "}
                في جملة
              </h2>

              <p className="mt-2 leading-7 text-slate-500">
                فكّر في جملة جميلة
                من إنشائك.
              </p>

              <textarea
                value={sentence}
                onChange={(
                  event
                ) =>
                  setSentence(
                    event.target
                      .value
                  )
                }
                placeholder={`اكتب جملة تحتوي على كلمة ${weeklyWord.vocalizedWord}...`}
                className="mt-4 min-h-[120px] w-full resize-none rounded-[22px] border-2 border-amber-100 bg-white p-4 text-lg font-bold leading-8 text-slate-700 outline-none transition focus:border-amber-300"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-slate-500">
                  {sentence.trim()
                    ? "🌟 جملة جميلة، أحسنت المحاولة."
                    : "💭 لا توجد إجابة واحدة فقط؛ عبّر بطريقتك."}
                </span>

                <span className="font-black text-amber-700">
                  {
                    sentence.length
                  }{" "}
                  حرفًا
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* كنز لغتي */}

        <section className="mt-6 rounded-[34px] bg-gradient-to-l from-emerald-800 to-teal-700 p-7 text-center text-white shadow-xl">

          <div className="text-6xl">
            💎✨
          </div>

          <p className="mt-3 text-sm font-black text-emerald-100">
            كنز لغتي
          </p>

          <h2 className="mt-1 text-3xl font-black">
            أضفت كلمة جديدة
            إلى كنزك اللغوي
          </h2>

          <p className="mx-auto mt-3 max-w-2xl leading-8 text-emerald-50">
            كل كلمة جديدة تتعلمها
            تساعدك على القراءة
            والتحدث والكتابة
            بصورة أجمل.
          </p>

          <Link
            href="/"
            className="mt-5 inline-flex rounded-2xl bg-white px-6 py-3 font-black text-emerald-800 no-underline shadow-lg"
          >
            🏠 العودة إلى الأكاديمية
          </Link>
        </section>

        <footer className="py-7 text-center text-sm leading-7 text-slate-500">
          <strong className="text-emerald-700">
            أكاديمية لغتي الرقمية
          </strong>

          <br />

          كلمة جديدة كل أسبوع 💎
        </footer>
      </div>

      {/* احتفال الإجابة */}

      {showCelebration && (
        <div className="pointer-events-none fixed inset-0 z-[999] grid place-items-center bg-slate-900/15 backdrop-blur-[2px]">

          <div className="celebration-pop rounded-[34px] border border-white bg-white/95 px-10 py-8 text-center shadow-2xl">
            <div className="text-7xl">
              🏆✨
            </div>

            <h2 className="mt-3 text-2xl font-black text-emerald-700">
              إجابة صحيحة!
            </h2>

            <p className="mt-2 font-bold text-slate-600">
              لقد اكتشفت معنى
              كلمة{" "}
              {
                weeklyWord.vocalizedWord
              }
            </p>
          </div>
        </div>
      )}
    </main>
  );
}