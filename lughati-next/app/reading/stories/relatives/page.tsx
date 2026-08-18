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
    question: "إلى أين ذهب فواز مع أسرته؟",
    options: [
      "إلى بيت جده",
      "إلى المدرسة",
      "إلى الحديقة",
    ],
    correctIndex: 0,
  },
  {
    id: 2,
    question: "ماذا وجد فواز في بيت جده؟",
    options: [
      "حقيبة مدرسية",
      "صندوق صور قديمًا",
      "لعبة جديدة",
    ],
    correctIndex: 1,
  },
  {
    id: 3,
    question: "ما الفكرة التي تعلمها فواز؟",
    options: [
      "صلة الأقارب تزيد المحبة",
      "اللعب أهم من الزيارة",
      "عدم زيارة الأقارب",
    ],
    correctIndex: 0,
  },
];

export default function RelativesStoryPage() {
  const [answers, setAnswers] =
    useState<Record<number, number>>({});

  const [checked, setChecked] =
    useState(false);

  const correctAnswers =
    questions.filter(
      (question) =>
        answers[question.id] ===
        question.correctIndex
    ).length;

  function chooseAnswer(
    questionId: number,
    optionIndex: number
  ) {
    if (checked) return;

    setAnswers((current) => ({
      ...current,
      [questionId]: optionIndex,
    }));
  }

  function checkAnswers() {
    if (
      Object.keys(answers).length <
      questions.length
    ) {
      return;
    }

    setChecked(true);
  }

  function restartQuestions() {
    setAnswers({});
    setChecked(false);
  }

  function printStory() {
    window.print();
  }

  return (
    <main
      dir="rtl"
      className="storyPage min-h-screen bg-[#f7fbf8] px-3 py-5 sm:px-5"
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

        .storyFloat {
          animation: storyFloat 4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .storyFloat {
            animation: none;
          }
        }

    @media print {
  @page {
    size: A4 portrait;
    margin: 8mm;
  }

  html,
  body {
    background: white !important;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .storyPage {
    background: white !important;
    padding: 0 !important;
  }

  .noPrint {
    display: none !important;
  }

  .avoidBreak {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .printBreak {
    break-before: page !important;
    page-break-before: always !important;
  }

  .storyFloat {
    animation: none !important;
  }

  /* الغلاف يكون صفحة مستقلة */
  .storyPage > div > section:first-of-type {
    min-height: 270mm !important;
    height: 270mm !important;
    page-break-after: always !important;
    break-after: page !important;
    overflow: hidden !important;
    padding: 14mm 12mm !important;
    display: flex !important;
    align-items: center !important;
  }

  /* شبكة الغلاف */
  .storyPage > div > section:first-of-type > div.relative.grid {
    width: 100% !important;
    grid-template-columns: 1fr !important;
    gap: 10mm !important;
    align-items: center !important;
  }

  /* نص الغلاف */
  .storyPage > div > section:first-of-type h1 {
    font-size: 34pt !important;
    line-height: 1.4 !important;
    margin-top: 5mm !important;
  }

  .storyPage > div > section:first-of-type p {
    font-size: 14pt !important;
  }

  /* منطقة الرسم */
  .storyPage > div > section:first-of-type .storyFloat {
    height: 105mm !important;
    max-width: 145mm !important;
    width: 145mm !important;
    margin: 0 auto !important;
    transform: scale(0.82) !important;
    transform-origin: center top !important;
  }

  /* منع الرسم من النزول خارج الصفحة */
  .storyPage > div > section:first-of-type .storyFloat > div,
  .storyPage > div > section:first-of-type .storyFloat > span {
    max-height: 100% !important;
  }

  /* تقليل الظلال في الطباعة */
  * {
    box-shadow: none !important;
  }

  /* تحسين أحجام النصوص داخل القصة */
  .storyPage h2 {
    font-size: 22pt !important;
  }

  .storyPage h3 {
    font-size: 16pt !important;
  }

  .storyPage p,
  .storyPage button,
  .storyPage span {
    line-height: 1.7 !important;
  }
}
      `}</style>

      <div className="mx-auto max-w-6xl">

        {/* أدوات الصفحة */}

       <div className="noPrint mb-4 flex flex-wrap items-center justify-between gap-3">

  {/* العودة */}

  <Link
    href="/reading"
    className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 font-black text-emerald-700 no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  >
    ← العودة إلى الفهم القرائي
  </Link>

  {/* أدوات القصة */}

  <div className="flex flex-wrap items-center gap-3">

    {/* الاختبار الورقي */}

    <Link
      href="/reading/stories/relatives/worksheet"
      className="rounded-2xl border-2 border-violet-200 bg-violet-50 px-5 py-3 font-black text-violet-700 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-100 hover:shadow-md"
    >
      📝 الاختبار الورقي A4
    </Link>

    {/* طباعة القصة */}

    <button
      type="button"
      onClick={printStory}
      className="rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md"
    >
      🖨️ طباعة القصة المصوّرة
    </button>

  </div>
</div>

        {/* الغلاف */}

        <section className="avoidBreak relative overflow-hidden rounded-[38px] bg-gradient-to-l from-sky-200 via-emerald-100 to-amber-100 p-6 shadow-xl sm:p-8">
          <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/35" />

          <div className="relative grid gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-rose-500 px-4 py-2 text-sm font-black text-white">
                📖 قصة مصوّرة
              </span>

              <p className="mt-4 text-sm font-black text-emerald-700">
                من سلسلة الفهم القرائي
              </p>

              <h1 className="mt-2 text-4xl font-black leading-[1.5] text-[#15513d] sm:text-5xl">
                صندوق الصور
                <br />
                في بيت جدي
              </h1>

              <p className="mt-4 text-lg font-bold leading-9 text-slate-600">
                قصة عن الأقارب والمحبة
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

            <div className="storyFloat relative mx-auto h-[300px] w-full max-w-[430px]">
              <div className="absolute bottom-0 left-1/2 h-[205px] w-[360px] max-w-[90%] -translate-x-1/2 rounded-[35px] bg-[#f3c88d]">
                <div className="absolute -top-[63px] left-1/2 h-[125px] w-[270px] max-w-[78%] -translate-x-1/2 rotate-45 rounded-[28px] bg-[#df734d]" />

                <div className="absolute bottom-0 left-1/2 h-[92px] w-[58px] -translate-x-1/2 rounded-t-[26px] bg-[#80533c]" />

                <div className="absolute left-[17%] top-[47px] h-[52px] w-[52px] rounded-xl border-[7px] border-white bg-sky-300" />

                <div className="absolute right-[17%] top-[47px] h-[52px] w-[52px] rounded-xl border-[7px] border-white bg-sky-300" />
              </div>

              <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-end justify-center">
                <FamilyPerson emoji="👴🏻" />
                <FamilyPerson emoji="👵🏻" />
                <FamilyPerson emoji="👨🏻" />
                <FamilyPerson emoji="👩🏻" />
                <FamilyPerson emoji="👦🏻" />
              </div>

              <span className="absolute right-[5%] top-[35px] text-5xl">
                ❤️
              </span>
            </div>
          </div>
        </section>

        {/* القصة */}

        <section className="mt-6 rounded-[34px] border border-emerald-100 bg-white p-5 sm:p-7">
          <div className="mb-6 text-center">
            <span className="inline-flex rounded-full bg-sky-100 px-4 py-2 font-black text-sky-700">
              📚 أقرأ القصة
            </span>

            <h2 className="mt-3 text-3xl font-black text-slate-800">
              رحلة فواز مع أقاربه
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <StoryScene
              number="1"
              color="#ef4444"
              illustration="👨🏻 👩🏻 👦🏻"
              title="زيارة جميلة"
            >
              في صباح الجمعة قال أبي:
              <strong>
                {" "}
                «سنزور جدك اليوم يا فواز».
              </strong>
              <br />
              فرح فواز وقال:
              <strong>
                {" "}
                «أحب زيارة جدي وجدتي!»
              </strong>
            </StoryScene>

            <StoryScene
              number="2"
              color="#22a06b"
              illustration="👴🏻 👵🏻 👦🏻"
              title="في بيت جدي"
            >
              استقبل الجد والجدة فوازًا
              بابتسامة كبيرة. جلس فواز
              بجوارهما وتحدث معهما عن
              المدرسة وأصدقائه.
            </StoryScene>

            <StoryScene
              number="3"
              color="#3b82f6"
              illustration="📦 🖼️"
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
                «هذا صندوق صور العائلة».
              </strong>
            </StoryScene>

            <StoryScene
              number="4"
              color="#8b5cf6"
              illustration="👨🏻 👩🏻 👨🏻‍🦱 👩🏻‍🦱"
              title="أقاربي"
            >
              أخذ الجد صورة وقال:
              <strong>
                {" "}
                «هذا عمك، وهذه عمتك،
                وهذا خالك، وهذه خالتك».
              </strong>
              <br />
              نظر فواز إلى الصور بسعادة.
            </StoryScene>

            <StoryScene
              number="5"
              color="#f59e0b"
              illustration="👦🏻 🧒🏻 👧🏻"
              title="وقت المرح"
            >
              جاء أبناء العم والخال،
              فلعب فواز معهم. ثم ساعد
              الجميع الجدة في ترتيب
              المجلس. كان التعاون جميلًا.
            </StoryScene>

            <StoryScene
              number="6"
              color="#0f9f72"
              illustration="👴🏻 ❤️ 👦🏻"
              title="كلمة جدي"
            >
              قبل أن يعود فواز إلى منزله
              قال الجد:
              <strong>
                {" "}
                «يا فواز، صلة الأقارب
                تزيد المحبة».
              </strong>
              <br />
              ابتسم فواز وقال:
              <strong>
                {" "}
                «سأزوركم دائمًا يا جدي».
              </strong>
            </StoryScene>
          </div>
        </section>

        {/* العبرة */}

        <section className="avoidBreak mt-5 rounded-[30px] border-2 border-rose-200 bg-gradient-to-l from-rose-50 via-white to-amber-50 p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[24px] bg-rose-100 text-5xl">
              ❤️
            </div>

            <div>
              <p className="text-sm font-black text-rose-600">
                العبرة من القصة
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-800">
                أقاربي جزء جميل من حياتي
              </h2>

              <p className="mt-2 leading-8 text-slate-600">
                أصل أقاربي، وأسأل عنهم،
                وأحسن إليهم، وأتعاون
                معهم؛ فصلة الأقارب تزيد
                المحبة بين أفراد الأسرة.
              </p>
            </div>
          </div>
        </section>

        {/* الكلمات */}

        <section className="printBreak mt-6 rounded-[32px] bg-white p-5 sm:p-7">
          <div className="text-center">
            <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 font-black text-emerald-700">
              💎 كنز الكلمات
            </span>

            <h2 className="mt-3 text-2xl font-black text-slate-800">
              كلمات أتعلمها من القصة
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
              meaning="أساعد غيري ويساعدني."
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

        {/* الفهم القرائي */}

        <section className="mt-6 rounded-[34px] border border-violet-100 bg-gradient-to-b from-violet-50 to-white p-5 sm:p-7">
          <div className="text-center">
            <span className="inline-flex rounded-full bg-violet-600 px-4 py-2 font-black text-white">
              🧠 أفهم القصة
            </span>

            <h2 className="mt-3 text-3xl font-black text-slate-800">
              هل كنت قارئًا منتبهًا؟
            </h2>

            <p className="mt-2 text-slate-500">
              اختر الإجابة الصحيحة.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {questions.map(
              (
                question,
                questionIndex
              ) => (
                <article
                  key={question.id}
                  className="avoidBreak rounded-[25px] border border-violet-100 bg-white p-5"
                >
                  <h3 className="text-lg font-black leading-8 text-slate-800">
                    {questionIndex + 1} ـ{" "}
                    {question.question}
                  </h3>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {question.options.map(
                      (
                        option,
                        optionIndex
                      ) => {
                        const selected =
                          answers[
                            question.id
                          ] === optionIndex;

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
                            className={`rounded-2xl border-2 px-4 py-4 font-black ${
                              correct
                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : wrong
                                  ? "border-rose-400 bg-rose-50 text-rose-700"
                                  : selected
                                    ? "border-violet-500 bg-violet-100 text-violet-800"
                                    : "border-slate-100 bg-slate-50 text-slate-700"
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
                </article>
              )
            )}
          </div>

          <div className="noPrint">
            {!checked ? (
              <button
                type="button"
                onClick={checkAnswers}
                disabled={
                  Object.keys(
                    answers
                  ).length <
                  questions.length
                }
                className="mx-auto mt-6 block w-full max-w-md rounded-2xl bg-violet-700 px-5 py-4 font-black text-white disabled:bg-slate-300"
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
                  {correctAnswers} من{" "}
                  {questions.length}
                </p>

                <button
                  type="button"
                  onClick={restartQuestions}
                  className="mt-4 rounded-2xl bg-white px-5 py-3 font-black text-amber-700"
                >
                  🔄 أعد الأسئلة
                </button>
              </div>
            )}
          </div>
        </section>

        {/* النشاط */}

        <section className="avoidBreak mt-6 rounded-[34px] bg-gradient-to-l from-amber-300 via-yellow-200 to-amber-100 p-6">
          <p className="font-black text-amber-800">
            ✏️ نشاط بعد القراءة
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-800">
            الآن دورك أنت
          </h2>

          <p className="mt-2 leading-8 text-slate-700">
            اذكر اسمَي اثنين من أقاربك،
            ثم اكتب عملًا جميلًا تستطيع
            القيام به لصلة أقاربك.
          </p>

          <div className="mt-5 space-y-4">
            <WritingLine>
              اسم قريب:
            </WritingLine>

            <WritingLine>
              اسم قريب:
            </WritingLine>

            <WritingLine>
              عمل جميل سأقوم به:
            </WritingLine>
          </div>
        </section>

        {/* النهاية */}

        <section className="avoidBreak mt-6 rounded-[32px] bg-emerald-800 p-7 text-center text-white">
          <div className="text-6xl">
            👦🏻❤️👨‍👩‍👧‍👦
          </div>

          <h2 className="mt-3 text-3xl font-black">
            وأنا أيضًا أصل أقاربي
          </h2>

          <p className="mx-auto mt-2 max-w-2xl leading-8 text-emerald-100">
            انتهت القصة، لكن أثرها
            الجميل يمكن أن يستمر في
            حياتنا كل يوم.
          </p>
        </section>

        <footer className="py-7 text-center text-sm text-slate-500">
          <strong className="text-emerald-700">
            أكاديمية لغتي الرقمية
          </strong>

          <br />

          قصة أصلية ضمن الفهم القرائي 📖✨
        </footer>
      </div>
    </main>
  );
}

function StoryTag({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-black text-emerald-800">
      {children}
    </span>
  );
}

function FamilyPerson({
  emoji,
}: {
  emoji: string;
}) {
  return (
    <span className="text-6xl">
      {emoji}
    </span>
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
  illustration: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className="avoidBreak overflow-hidden rounded-[28px] border bg-[#fffefa]"
      style={{
        borderColor: `${color}55`,
      }}
    >
      <div
        className="relative grid min-h-[175px] place-items-center p-5"
        style={{
          background: `${color}12`,
        }}
      >
        <div
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full font-black text-white"
          style={{
            background: color,
          }}
        >
          {number}
        </div>

        <div className="text-center text-6xl leading-[1.5]">
          {illustration}
        </div>
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
    <article className="avoidBreak rounded-[24px] border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-5 text-center">
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

function WritingLine({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-600/40 bg-white/65 px-5 py-5 font-black text-slate-700">
      {children}
      <span className="mr-3">
        ________________________________
      </span>
    </div>
  );
}