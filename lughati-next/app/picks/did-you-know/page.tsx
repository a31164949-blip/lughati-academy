"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

type DidYouKnowData = {
  title: string;
  text: string;
  published: boolean;
};

const fallbackData: DidYouKnowData = {
  title: "هل تعلم؟",
  text: "صلة الرحم تعني الإحسان إلى الأقارب وزيارتهم والسؤال عنهم.",
  published: true,
};

export default function DidYouKnowPage() {
  const [data, setData] = useState<DidYouKnowData>(fallbackData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const ref = doc(db, "weeklyPicks", "current");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const saved = snap.data();

          if (saved.didYouKnow) {
            setData({
              ...fallbackData,
              ...saved.didYouKnow,
            });
          }
        }
      } catch (error) {
        console.error("تعذر تحميل هل تعلم:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#f7fbf8] px-4 py-8"
      >
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center text-xl font-black text-emerald-700 shadow-sm">
          ⏳ جاري تحميل المعلومة...
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

        <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-l from-amber-300 via-yellow-200 to-emerald-100 p-6 shadow-xl sm:p-9">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/30" />
          <div className="absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-emerald-300/20" />

          <div className="relative grid gap-8 md:grid-cols-[1.35fr_.65fr] md:items-center">
            <div>
              <span className="inline-flex rounded-full bg-white/75 px-4 py-2 text-sm font-black text-amber-800">
                💡 من مختارات هذا الأسبوع
              </span>

              <p className="mt-5 text-sm font-black text-emerald-700">
                هل تعلم؟
              </p>

              <h1 className="mt-2 text-4xl font-black leading-[1.5] text-slate-900 sm:text-5xl">
                {data.title}
              </h1>

              <div className="mt-6 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
                <p className="text-xl font-bold leading-[2] text-slate-700 sm:text-2xl">
                  {data.text}
                </p>
              </div>
            </div>

            <div className="mx-auto grid h-60 w-60 place-items-center rounded-full border border-white/70 bg-white/50 shadow-lg">
              <div className="text-center">
                <div className="text-8xl">💡</div>
                <div className="mt-3 text-4xl">✨</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[30px] border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-black text-emerald-700">
            🧠 فكّر قليلًا
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-800">
            كيف تطبق هذه المعلومة في حياتك؟
          </h2>

          <p className="mt-3 leading-8 text-slate-600">
            حاول أن تذكر موقفًا أو عملًا يمكنك القيام به اليوم.
          </p>
        </section>

        <footer className="py-7 text-center text-sm text-slate-500">
          <strong className="text-emerald-700">
            أكاديمية لغتي الرقمية
          </strong>
          <br />
          مختارات متنوعة ✨
        </footer>
      </div>
    </main>
  );
}