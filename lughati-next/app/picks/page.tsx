"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

type WeeklyPicksData = {
  story?: {
    title?: string;
    description?: string;
    href?: string;
    published?: boolean;
  };
  word?: {
    word?: string;
    vocalizedWord?: string;
    meaning?: string;
    published?: boolean;
  };
  didYouKnow?: {
    title?: string;
    text?: string;
    published?: boolean;
  };
  challenge?: {
    question?: string;
    published?: boolean;
  };
};

export default function PicksPage() {
  const [data, setData] = useState<WeeklyPicksData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPicks() {
      try {
        const ref = doc(db, "weeklyPicks", "current");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setData(snap.data());
        }
      } catch (error) {
        console.error("تعذر تحميل المختارات:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadPicks();
  }, []);

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#f7fbf8] px-4 py-8"
      >
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-10 text-center text-xl font-black text-emerald-700 shadow-sm">
          ⏳ جاري تحميل المختارات...
        </div>
      </main>
    );
  }

  const cards = [
    {
      id: "story",
      icon: "📖",
      label: "قصة الأسبوع",
      title: data.story?.title || "صندوق الصور في بيت جدي",
      description:
        data.story?.description ||
        "قصة قصيرة نقرأها ونستمتع بها ونكتشف منها فكرة جميلة.",
      href: data.story?.href || "/picks/story",
      published: data.story?.published !== false,
      color: "#6d4bd8",
      bg: "#f2efff",
    },
    {
      id: "word",
      icon: "💎",
      label: "كلمة جميلة",
      title:
        data.word?.vocalizedWord ||
        data.word?.word ||
        "صِلَة",
      description:
        data.word?.meaning ||
        "اكتشف معنى كلمة جديدة واستخدمها في جملة من إنشائك.",
      href: "/picks/word",
      published: data.word?.published !== false,
      color: "#168a63",
      bg: "#eaf9f2",
    },
    {
      id: "did-you-know",
      icon: "💡",
      label: "هل تعلم؟",
      title: data.didYouKnow?.title || "هل تعلم؟",
      description:
        data.didYouKnow?.text ||
        "معلومة قصيرة وممتعة تضيف إلى معرفتك شيئًا جديدًا.",
      href: "/picks/did-you-know",
      published: data.didYouKnow?.published !== false,
      color: "#d77a17",
      bg: "#fff5e7",
    },
    {
      id: "challenge",
      icon: "⚡",
      label: "التحدي السريع",
      title: "هل تستطيع حل التحدي؟",
      description:
        data.challenge?.question ||
        "سؤال قصير يحتاج إلى تركيز واختيار الإجابة الصحيحة.",
      href: "/picks/challenge",
      published: data.challenge?.published !== false,
      color: "#167bb2",
      bg: "#eaf7ff",
    },
  ].filter((item) => item.published);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-[#f4fbf7] via-white to-[#f7f9ff] px-4 py-6 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 font-black text-emerald-700 no-underline shadow-sm"
          >
            ← العودة إلى الصفحة الرئيسية
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-[38px] bg-gradient-to-l from-emerald-900 via-emerald-700 to-teal-600 p-7 text-white shadow-xl sm:p-10">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 left-12 h-52 w-52 rounded-full bg-yellow-300/10" />

          <div className="relative">
            <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-black">
              ✨ من اختيار أكاديمية لغتي
            </span>

            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              مختارات متنوعة
            </h1>

            <p className="mt-3 max-w-2xl text-lg font-bold leading-8 text-emerald-50">
              اقرأ، اكتشف، فكّر واستمتع بمحتوى جديد ومتجدد كل أسبوع.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-2">
          {cards.map((item) => (
            <article
              key={item.id}
              className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="grid h-16 w-16 place-items-center rounded-2xl text-4xl"
                style={{ background: item.bg }}
              >
                {item.icon}
              </div>

              <p
                className="mt-4 text-sm font-black"
                style={{ color: item.color }}
              >
                {item.label}
              </p>

              <h2 className="mt-2 text-2xl font-black leading-[1.6] text-slate-800">
                {item.title}
              </h2>

              <p className="mt-3 min-h-[72px] leading-8 text-slate-600">
                {item.description}
              </p>

              <Link
                href={item.href}
                className="mt-5 flex items-center justify-between rounded-2xl px-4 py-3 font-black no-underline"
                style={{
                  background: item.bg,
                  color: item.color,
                }}
              >
                <span>افتح المختارة</span>
                <span>←</span>
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[30px] border border-amber-200 bg-gradient-to-l from-amber-50 to-white p-6 text-center shadow-sm">
          <div className="text-5xl">🌟</div>

          <h2 className="mt-3 text-2xl font-black text-slate-800">
            اختر ما يعجبك وابدأ رحلتك
          </h2>

          <p className="mt-2 leading-8 text-slate-600">
            كل مختارة هنا تساعدك على القراءة والفهم والتفكير بطريقة ممتعة.
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