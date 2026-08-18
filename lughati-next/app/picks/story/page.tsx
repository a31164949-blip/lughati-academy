"use client";

import Link from "next/link";
import { useState } from "react";

type Question = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
};

const questions: Question[] = [
  {
    id: 1,
    question:
      "إلى أين ذهب فواز مع أسرته؟",
    options: [
      "إلى بيت جده",
      "إلى المدرسة",
      "إلى الحديقة",
    ],
    correctIndex: 0,
  },
  {
    id: 2,
    question:
      "ماذا وجد فواز في بيت جده؟",
    options: [
      "حقيبة مدرسية",
      "صندوق صور قديمًا",
      "لعبة جديدة",
    ],
    correctIndex: 1,
  },
  {
    id: 3,
    question:
      "ما الفكرة التي تعلمها فواز؟",
    options: [
      "صلة الأقارب تزيد المحبة",
      "اللعب أهم من الزيارة",
      "عدم زيارة الأقارب",
    ],
    correctIndex: 0,
  },
];

export default function WeeklyStoryPage() {
  const [
    selectedAnswers,
    setSelectedAnswers,
  ] = useState<Record<number, number>>(
    {}
  );

  const [
    checked,
    setChecked,
  ] = useState(false);

  const correctAnswers =
    questions.filter(
      (question) =>
        selectedAnswers[
          question.id
        ] ===
        question.correctIndex
    ).length;

  function chooseAnswer(
    questionId: number,
    optionIndex: number
  ) {
    if (checked) {
      return;
    }

    setSelectedAnswers(
      (current) => ({
        ...current,
        [questionId]:
          optionIndex,
      })
    );
  }

  function checkAnswers() {
    if (
      Object.keys(
        selectedAnswers
      ).length <
      questions.length
    ) {
      return;
    }

    setChecked(true);
  }

  function restartQuestions() {
    setSelectedAnswers({});
    setChecked(false);
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7fbf8] px-3 py-5 sm:px-5"
    >
      <style>{`
        @keyframes storyFloat {
          0%,100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes sparkle {
          0%,100% {
            transform: scale(1) rotate(0deg);
            opacity: .75;
          }

          50% {
            transform: scale(1.15) rotate(8deg);
            opacity: 1;
          }
        }

        .story-float {
          animation:
            storyFloat
            4s
            ease-in-out
            infinite;
        }

        .story-spark {
          animation:
            sparkle
            2.8s
            ease-in-out
            infinite;
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .story-float,
          .story-spark {
            animation:
              none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">

        {/* ==================== */}
        {/* شريط العودة */}
        {/* ==================== */}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 font-black text-emerald-700 no-underline shadow-sm"
          >
            ← العودة إلى الرئيسية
          </Link>

          <Link
            href="/picks"
            className="rounded-2xl bg-emerald-50 px-5 py-3 font-black text-emerald-700 no-underline"
          >
            ✨ جميع المختارات
          </Link>
        </div>

        {/* ==================== */}
        {/* الغلاف */}
        {/* ==================== */}

        <section className="relative overflow-hidden rounded-[38px] bg-gradient-to-l from-sky-200 via-emerald-100 to-amber-100 p-5 shadow-xl sm:p-8">

          <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/35" />

          <div className="absolute -bottom-16 left-[18%] h-44 w-44 rounded-full bg-amber-200/30" />

          <span className="story-spark absolute left-[8%] top-[12%] text-4xl">
            ✨
          </span>

          <span className="story-spark absolute right-[45%] top-[8%] text-3xl">
            ⭐
          </span>

          <div className="relative grid gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center">

            {/* العنوان */}

            <div>
              <span className="inline-flex rounded-full bg-rose-500 px-4 py-2 text-sm font-black text-white shadow-md">
                📖 قصة الأسبوع
              </span>

              <p className="mt-4 text-sm font-black text-emerald-700">
                من مجلة أكاديمية لغتي
              </p>

              <h1 className="mt-2 text-4xl font-black leading-[1.5] text-[#15513d] sm:text-5xl">
                صندوق الصور
                <br />
                في بيت جدي
              </h1>

              <p className="mt-4 max-w-xl text-lg font-bold leading-9 text-slate-600">
                قصة قصيرة عن
                الأقارب والمحبة
                وصلة الرحم.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <StoryTag>
                  👨‍👩‍👧‍👦 أقاربي
                </StoryTag>

                <StoryTag>
                  ❤️ المحبة
                </StoryTag>

                <StoryTag>
                  🤝 التعاون
                </StoryTag>
              </div>
            </div>

            {/* رسم الغلاف */}

            <div className="story-float relative mx-auto h-[300px] w-full max-w-[430px]">

              <div className="absolute bottom-0 left-1/2 h-[205px] w-[360px] max-w-[90%] -translate-x-1/2 rounded-[35px] bg-[#f3c88d] shadow-2xl">

                <div className="absolute -top-[63px] left-1/2 h-[125px] w-[270px] max-w-[78%] -translate-x-1/2 rotate-45 rounded-[28px] bg-[#df734d]" />

                <div className="absolute bottom-0 left-1/2 h-[92px] w-[58px] -translate-x-1/2 rounded-t-[26px] bg-[#80533c]" />

                <div className="absolute left-[17%] top-[47px] h-[52px] w-[52px] rounded-xl border-[7px] border-white bg-sky-300" />

                <div className="absolute right-[17%] top-[47px] h-[52px] w-[52px] rounded-xl border-[7px] border-white bg-sky-300" />
              </div>

              {/* العائلة */}

              <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-end justify-center">
                <FamilyPerson
                  emoji="👴🏻"
                  size="70px"
                />

                <FamilyPerson
                  emoji="👵🏻"
                  size="70px"
                />

                <FamilyPerson
                  emoji="👨🏻"
                  size="72px"
                />

                <FamilyPerson
                  emoji="👩🏻"
                  size="70px"
                />

                <FamilyPerson
                  emoji="👦🏻"
                  size="68px"
                />
              </div>

              <span className="absolute right-[4%] top-[38px] text-5xl">
                ❤️
              </span>
            </div>
          </div>
        </section>

        {/* ==================== */}
        {/* بداية القصة */}
        {/* ==================== */}

        <section className="mt-6 rounded-[34px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">

          <div className="mb-6 text-center">
            <span className="inline-flex rounded-full bg-sky-100 px-4 py-2 font-black text-sky-700">
              📚 أقرأ القصة
            </span>

            <h2 className="mt-3 text-3xl font-black text-slate-800">
              رحلة فواز مع أقاربه
            </h2>

            <p className="mt-2 text-slate-500">
              اقرأ المشاهد بالترتيب،
              ثم انتقل إلى أسئلة
              الفهم.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">

            <StoryScene
              number="1"
              color="#ef4444"
              illustration={
                <div className="flex items-end justify-center gap-1 text-6xl">
                  👨🏻 👩🏻 👦🏻
                </div>
              }
              title="زيارة جميلة"
            >
              في صباح الجمعة قال أبي:
              <strong>
                {" "}
                «سنزور جدك اليوم
                يا فواز».
              </strong>
              <br />
              فرح فواز وقال:
              <strong>
                {" "}
                «أحب زيارة جدي
                وجدتي!»
              </strong>
            </StoryScene>

            <StoryScene
              number="2"
              color="#22a06b"
              illustration={
                <div className="flex items-end justify-center gap-1 text-6xl">
                  👴🏻 👵🏻 👦🏻
                </div>
              }
              title="في بيت جدي"
            >
              استقبل الجد والجدة
              فوازًا بابتسامة كبيرة.
              جلس فواز بجوارهما
              وتحدث معهما عن المدرسة
              وأصدقائه.
            </StoryScene>

            <StoryScene
              number="3"
              color="#3b82f6"
              illustration={
                <div className="relative text-center">
                  <div className="text-7xl">
                    📦
                  </div>

                  <div className="-mt-2 text-4xl">
                    🖼️ 🖼️
                  </div>
                </div>
              }
              title="صندوق الصور"
            >
              رأى فواز صندوقًا قديمًا،
              فسأل:
              <strong>
                {" "}
                «ما هذا يا جدي؟»
              </strong>
              <br />
              قال الجد:
              <strong>
                {" "}
                «هذا صندوق صور
                العائلة».
              </strong>
            </StoryScene>

            <StoryScene
              number="4"
              color="#8b5cf6"
              illustration={
                <div className="flex flex-wrap justify-center gap-1 text-5xl">
                  👨🏻 👩🏻 👨🏻‍🦱 👩🏻‍🦱
                </div>
              }
              title="أقاربي"
            >
              أخذ الجد صورة وقال:
              <strong>
                {" "}
                «هذا عمك، وهذه
                عمتك، وهذا خالك،
                وهذه خالتك».
              </strong>
              <br />
              نظر فواز إلى الصور
              بسعادة.
            </StoryScene>

            <StoryScene
              number="5"
              color="#f59e0b"
              illustration={
                <div className="flex items-end justify-center gap-2 text-6xl">
                  👦🏻 🧒🏻 👧🏻
                </div>
              }
              title="وقت المرح"
            >
              جاء أبناء العم والخال،
              فلعب فواز معهم.
              ثم ساعد الجميع الجدة
              في ترتيب المجلس.
              كان التعاون جميلًا.
            </StoryScene>

            <StoryScene
              number="6"
              color="#0f9f72"
              illustration={
                <div className="text-center">
                  <div className="text-7xl">
                    👴🏻❤️👦🏻
                  </div>
                </div>
              }
              title="كلمة جدي"
            >
              قبل أن يعود فواز إلى
              منزله قال الجد:
              <strong>
                {" "}
                «يا فواز، صلة
                الأقارب تزيد
                المحبة».
              </strong>
              <br />
              ابتسم فواز وقال:
              <strong>
                {" "}
                «سأزوركم دائمًا
                يا جدي».
              </strong>
            </StoryScene>
          </div>
        </section>

        {/* ==================== */}
        {/* العبرة */}
        {/* ==================== */}

        <section className="mt-5 overflow-hidden rounded-[30px] border-2 border-rose-200 bg-gradient-to-l from-rose-50 via-white to-amber-50 p-6 shadow-sm">

          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-right">

            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[24px] bg-rose-100 text-5xl">
              ❤️
            </div>

            <div>
              <p className="text-sm font-black text-rose-600">
                العبرة من القصة
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-800">
                أقاربي جزء جميل
                من حياتي
              </h2>

              <p className="mt-2 leading-8 text-slate-600">
                أصل أقاربي،
                وأسأل عنهم،
                وأحسن إليهم،
                وأتعاون معهم؛
                فصلة الأقارب تزيد
                المحبة بين أفراد
                الأسرة.
              </p>
            </div>
          </div>
        </section>

        {/* ==================== */}
        {/* كلمات جديدة */}
        {/* ==================== */}

        <section className="mt-6 rounded-[32px] bg-white p-5 shadow-sm sm:p-7">

          <div className="text-center">
            <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 font-black text-emerald-700">
              ✏️ كلمات جديدة
            </span>

            <h2 className="mt-3 text-2xl font-black text-slate-800">
              كنز الكلمات
            </h2>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <WordCard
              icon="❤️"
              word="مَحَبَّة"
              meaning="مودة وحب."
            />

            <WordCard
              icon="🤝"
              word="أَتَعاوَنُ"
              meaning="أساعد غيري ويُساعدني."
            />

            <WordCard
              icon="👨‍👩‍👧‍👦"
              word="أَقارِبي"
              meaning="أفراد عائلتي وأرحامي."
            />

            <WordCard
              icon="🏠"
              word="زِيارَة"
              meaning="الذهاب لرؤية شخص."
            />
          </div>
        </section>

        {/* ==================== */}
        {/* الفهم */}
        {/* ==================== */}

        <section className="mt-6 rounded-[34px] border border-violet-100 bg-gradient-to-b from-violet-50 to-white p-5 shadow-sm sm:p-7">

          <div className="text-center">
            <span className="inline-flex rounded-full bg-violet-600 px-4 py-2 font-black text-white">
              🧠 أفهم القصة
            </span>

            <h2 className="mt-3 text-3xl font-black text-slate-800">
              هل كنت قارئًا منتبهًا؟
            </h2>

            <p className="mt-2 text-slate-500">
              اختر الإجابة الصحيحة
              لكل سؤال.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {questions.map(
              (
                question,
                questionIndex
              ) => (
                <article
                  key={
                    question.id
                  }
                  className="rounded-[25px] border border-violet-100 bg-white p-5"
                >
                  <div className="flex items-start gap-3">

                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-600 font-black text-white">
                      {questionIndex +
                        1}
                    </div>

                    <div className="flex-1">

                      <h3 className="text-lg font-black leading-8 text-slate-800">
                        {
                          question.question
                        }
                      </h3>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">

                        {question.options.map(
                          (
                            option,
                            optionIndex
                          ) => {
                            const selected =
                              selectedAnswers[
                                question.id
                              ] ===
                              optionIndex;

                            const correct =
                              checked &&
                              optionIndex ===
                                question.correctIndex;

                            const wrong =
                              checked &&
                              selected &&
                              optionIndex !==
                                question.correctIndex;

                            return (
                              <button
                                key={`${question.id}-${optionIndex}`}
                                type="button"
                                onClick={() =>
                                  chooseAnswer(
                                    question.id,
                                    optionIndex
                                  )
                                }
                                className={`rounded-2xl border-2 px-4 py-4 font-black transition ${
                                  correct
                                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                    : wrong
                                      ? "border-rose-400 bg-rose-50 text-rose-700"
                                      : selected
                                        ? "border-violet-500 bg-violet-100 text-violet-800"
                                        : "border-slate-100 bg-slate-50 text-slate-700 hover:border-violet-300"
                                }`}
                              >
                                {
                                  option
                                }

                                {correct &&
                                  " ✅"}

                                {wrong &&
                                  " ❌"}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>

          {!checked ? (
            <button
              type="button"
              onClick={
                checkAnswers
              }
              disabled={
                Object.keys(
                  selectedAnswers
                ).length <
                questions.length
              }
              className="mx-auto mt-6 block w-full max-w-md rounded-2xl bg-violet-700 px-5 py-4 font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              ✅ تحقق من إجاباتي
            </button>
          ) : (
            <div className="mx-auto mt-6 max-w-xl rounded-[28px] border-2 border-amber-300 bg-amber-50 p-6 text-center">

              <div className="text-6xl">
                {correctAnswers ===
                questions.length
                  ? "🏆"
                  : "🌟"}
              </div>

              <h3 className="mt-3 text-2xl font-black text-amber-800">
                {correctAnswers ===
                questions.length
                  ? "رائع! فهمت القصة جيدًا"
                  : "محاولة جميلة يا بطل"}
              </h3>

              <p className="mt-2 font-bold text-slate-600">
                أجبت إجابة صحيحة عن{" "}
                <strong className="text-amber-700">
                  {correctAnswers}
                </strong>{" "}
                من{" "}
                {
                  questions.length
                }
              </p>

              <button
                type="button"
                onClick={
                  restartQuestions
                }
                className="mt-4 rounded-2xl bg-white px-5 py-3 font-black text-amber-700 shadow-sm"
              >
                🔄 أعد الأسئلة
              </button>
            </div>
          )}
        </section>

        {/* ==================== */}
        {/* التحدي الأخير */}
        {/* ==================== */}

        <section className="mt-6 rounded-[34px] bg-gradient-to-l from-amber-300 via-yellow-200 to-amber-100 p-6 shadow-lg">

          <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">

            <div className="grid h-24 w-24 place-items-center rounded-[28px] bg-white/70 text-6xl shadow-sm">
              🏆
            </div>

            <div>
              <p className="font-black text-amber-800">
                ⭐ تحدي صغير
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-800">
                الآن دورك أنت
              </h2>

              <p className="mt-2 leading-8 text-slate-700">
                اذكر اسمَي اثنين
                من أقاربك،
                ثم أخبر أسرتك
                بعمل جميل تستطيع
                القيام به لصلة
                أقاربك هذا الأسبوع.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                <div className="rounded-2xl border-2 border-dashed border-amber-500/50 bg-white/60 px-5 py-4 text-center font-black text-slate-600">
                  ١ — اسم قريب
                  __________________
                </div>

                <div className="rounded-2xl border-2 border-dashed border-amber-500/50 bg-white/60 px-5 py-4 text-center font-black text-slate-600">
                  ٢ — اسم قريب
                  __________________
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== */}
        {/* النهاية */}
        {/* ==================== */}

        <section className="mt-6 rounded-[32px] bg-emerald-800 p-7 text-center text-white shadow-xl">

          <div className="text-6xl">
            👦🏻❤️👨‍👩‍👧‍👦
          </div>

          <h2 className="mt-3 text-3xl font-black">
            وأنا أيضًا أصل أقاربي
          </h2>

          <p className="mx-auto mt-2 max-w-2xl leading-8 text-emerald-100">
            انتهت قصة هذا الأسبوع،
            لكن أثرها الجميل يستطيع
            أن يستمر في حياتنا كل يوم.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">

            <Link
              href="/"
              className="rounded-2xl bg-white px-5 py-3 font-black text-emerald-800 no-underline"
            >
              🏠 العودة إلى الرئيسية
            </Link>

            <Link
              href="/picks"
              className="rounded-2xl border border-white/30 bg-white/10 px-5 py-3 font-black text-white no-underline"
            >
              ✨ مختارات أخرى
            </Link>
          </div>
        </section>

        <footer className="py-7 text-center text-sm text-slate-500">
          <strong className="text-emerald-700">
            أكاديمية لغتي الرقمية
          </strong>
          <br />
          قصة أصلية من إعداد أكاديمية لغتي 📖✨
        </footer>
      </div>
    </main>
  );
}

/* ============================ */
/* المكونات الصغيرة */
/* ============================ */

function StoryTag({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-black text-emerald-800 shadow-sm backdrop-blur">
      {children}
    </span>
  );
}

function FamilyPerson({
  emoji,
  size,
}: {
  emoji: string;
  size: string;
}) {
  return (
    <div
      className="grid place-items-center"
      style={{
        fontSize: size,
        filter:
          "drop-shadow(0 7px 5px rgba(0,0,0,.12))",
      }}
    >
      {emoji}
    </div>
  );
}

function StoryScene({
  number,
  color,
  illustration,
  title,
  children,
}: {
  number: string;
  color: string;
  illustration:
    React.ReactNode;
  title: string;
  children:
    React.ReactNode;
}) {
  return (
    <article
      className="overflow-hidden rounded-[28px] border bg-[#fffefa] shadow-sm"
      style={{
        borderColor:
          `${color}55`,
      }}
    >
      <div
        className="relative grid min-h-[180px] place-items-center overflow-hidden p-5"
        style={{
          background:
            `${color}12`,
        }}
      >
        <div
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full font-black text-white shadow-md"
          style={{
            background:
              color,
          }}
        >
          {number}
        </div>

        {illustration}
      </div>

      <div className="p-5">
        <h3
          className="text-xl font-black"
          style={{
            color,
          }}
        >
          {title}
        </h3>

        <p className="mt-2 text-[17px] leading-9 text-slate-700">
          {children}
        </p>
      </div>
    </article>
  );
}

function WordCard({
  icon,
  word,
  meaning,
}: {
  icon: string;
  word: string;
  meaning: string;
}) {
  return (
    <article className="rounded-[24px] border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-5 text-center">
      <div className="text-5xl">
        {icon}
      </div>

      <h3 className="mt-3 text-xl font-black text-emerald-800">
        {word}
      </h3>

      <p className="mt-2 text-sm font-bold leading-7 text-slate-500">
        {meaning}
      </p>
    </article>
  );
}