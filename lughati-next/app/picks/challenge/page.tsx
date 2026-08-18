"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

type ChallengeData = {
  title: string;
  question: string;
  options: string[];
  correctIndex: number;
  successMessage: string;
  published: boolean;
};

const fallbackData: ChallengeData = {
  title: "التحدي السريع",
  question: "ما السلوك الذي يدل على صلة الرحم؟",
  options: [
    "زيارة الأقارب والسؤال عنهم",
    "عدم التحدث معهم",
    "الابتعاد عن الأسرة",
  ],
 correctIndex: 0,
successMessage: "أحسنت يا بطل! 🌟",
  published: true,
};

export default function ChallengePage() {
  const [data, setData] = useState<ChallengeData>(fallbackData);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function loadChallenge() {
      try {
        const ref = doc(db, "weeklyPicks", "current");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const saved = snap.data();

          if (saved.challenge) {
            setData({
              ...fallbackData,
              ...saved.challenge,
              options:
                Array.isArray(saved.challenge.options) &&
                saved.challenge.options.length > 0
                  ? saved.challenge.options
                  : fallbackData.options,
            });
          }
        }
      } catch (error) {
        console.error("تعذر تحميل التحدي السريع:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadChallenge();
  }, []);

  const isCorrect = selected === data.correctIndex;

  function checkAnswer() {
    if (selected === null) return;
    setChecked(true);
  }

  function tryAgain() {
    setSelected(null);
    setChecked(false);
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#f7fbf8] px-4 py-8"
      >
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center text-xl font-black text-emerald-700 shadow-sm">
          ⏳ جاري تجهيز التحدي...
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-[#f4fbf7] via-white to-[#f7f9ff] px-4 py-6 sm:px-6"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 font-black text-emerald-700 no-underline shadow-sm"
          >
            ← العودة إلى الصفحة الرئيسية
          </Link>

          <Link
            href="/picks"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-black text-slate-700 no-underline shadow-sm"
          >
            جميع المختارات ←
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-l from-[#0f766e] via-[#059669] to-[#34d399] p-6 text-white shadow-xl sm:p-9">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-yellow-300/20" />

          <div className="relative grid gap-7 md:grid-cols-[1.3fr_.7fr] md:items-center">
            <div>
              <span className="inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-black">
                ⚡ من مختارات هذا الأسبوع
              </span>

              <p className="mt-5 font-black text-yellow-200">
                مستعد للتحدي؟
              </p>

              <h1 className="mt-2 text-4xl font-black sm:text-5xl">
                {data.title || "التحدي السريع"}
              </h1>

              <p className="mt-4 text-lg font-bold text-white/90">
                اختر الإجابة الصحيحة ثم اضغط «تحقق من إجابتي».
              </p>
            </div>

            <div className="mx-auto grid h-52 w-52 place-items-center rounded-full border border-white/30 bg-white/15 shadow-lg">
              <div className="text-center">
                <div className="text-8xl">⚡</div>
                <div className="mt-2 text-4xl">🏆</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-black text-emerald-700">
            🧠 سؤال التحدي
          </p>

          <h2 className="mt-3 text-2xl font-black leading-[1.7] text-slate-800 sm:text-3xl">
            {data.question}
          </h2>

          <div className="mt-7 grid gap-4">
            {data.options.map((option, index) => {
              const active = selected === index;

              return (
                <button
                  key={`${option}-${index}`}
                  type="button"
                  disabled={checked}
                  onClick={() => setSelected(index)}
                  className={`w-full rounded-[22px] border-2 p-5 text-right text-lg font-black transition ${
                    active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-slate-100 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50"
                  } disabled:cursor-default`}
                >
                  <span className="ml-3 inline-grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm">
                    {String.fromCharCode(65 + index)}
                  </span>

                  {option}
                </button>
              );
            })}
          </div>

          {!checked && (
            <button
              type="button"
              onClick={checkAnswer}
              disabled={selected === null}
              className="mt-7 w-full rounded-[22px] bg-emerald-700 px-6 py-4 text-xl font-black text-white shadow-md transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              تحقق من إجابتي ✓
            </button>
          )}

          {checked && isCorrect && (
            <div className="mt-7 rounded-[26px] border border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="text-5xl">🎉</div>

              <h3 className="mt-3 text-2xl font-black text-emerald-800">
                إجابة صحيحة!
              </h3>

              <p className="mt-2 text-lg font-bold text-emerald-700">
                {data.successMessage || "أحسنت يا بطل! 🌟"}
              </p>
            </div>
          )}

          {checked && !isCorrect && (
            <div className="mt-7 rounded-[26px] border border-amber-200 bg-amber-50 p-6 text-center">
              <div className="text-5xl">💪</div>

              <h3 className="mt-3 text-2xl font-black text-amber-800">
                محاولة جميلة
              </h3>

              <p className="mt-2 font-bold text-amber-700">
                فكّر مرة أخرى، فأنت قريب من الإجابة الصحيحة.
              </p>

              <button
                type="button"
                onClick={tryAgain}
                className="mt-5 rounded-2xl bg-amber-500 px-6 py-3 font-black text-white"
              >
                🔄 أحاول مرة أخرى
              </button>
            </div>
          )}
        </section>

        <footer className="py-7 text-center text-sm text-slate-500">
          <strong className="text-emerald-700">
            أكاديمية لغتي الرقمية
          </strong>
          <br />
          ⚡ التحدي السريع
        </footer>
      </div>
    </main>
  );
}