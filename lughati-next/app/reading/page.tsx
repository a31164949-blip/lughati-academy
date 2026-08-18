"use client";

import Link from "next/link";

type ReadingItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
  badge: string;
  color: string;
  lightColor: string;
  featured?: boolean;
};

const readingItems: ReadingItem[] = [
  {
    id: "relatives-story",
    icon: "📖",
    title: "صندوق الصور في بيت جدي",
    description:
      "قصة مصوّرة عن الأقارب والمحبة وصلة الرحم، مع كلمات جديدة وأسئلة فهم واختبار ورقي A4.",
    href: "/reading/stories/relatives",
    badge: "قصة مصوّرة",
    color: "#168a63",
    lightColor: "#eaf9f2",
    featured: true,
  },
  {
    id: "short-texts",
    icon: "📚",
    title: "نصوص قصيرة",
    description:
      "نصوص مبسطة ومتدرجة تساعدك على القراءة والفهم خطوة بخطوة.",
    href: "#",
    badge: "قريبًا",
    color: "#2878c7",
    lightColor: "#edf6ff",
  },
  {
    id: "comprehension-challenges",
    icon: "🧠",
    title: "تحديات الفهم",
    description:
      "أسئلة ممتعة تنمّي التركيز والاستنتاج وفهم المقروء.",
    href: "#",
    badge: "قريبًا",
    color: "#7a55cf",
    lightColor: "#f3efff",
  },
];

export default function ReadingPage() {
  const featured =
    readingItems.find(
      (item) => item.featured
    ) ?? readingItems[0];

  const others =
    readingItems.filter(
      (item) =>
        item.id !== featured.id
    );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50 px-3 py-5 sm:px-5"
    >
      <div className="mx-auto max-w-7xl">

        {/* الترويسة */}

        <header className="relative overflow-hidden rounded-[34px] bg-gradient-to-l from-emerald-900 via-emerald-700 to-teal-600 p-6 text-white shadow-2xl sm:p-8">
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/10" />

          <div className="absolute -bottom-20 right-[25%] h-48 w-48 rounded-full bg-amber-300/10" />

          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div>
              <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-black backdrop-blur">
                📚 ركن الفهم القرائي
              </span>

              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                أقرأ… أفهم… أكتشف
              </h1>

              <p className="mt-3 max-w-2xl leading-8 text-emerald-50">
                قصص ونصوص وتحديات
                تساعد الطالب والزائر
                على تنمية القراءة
                والفهم والاستنتاج.
              </p>
            </div>

            <Link
  href="/"
  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 font-black text-emerald-800 no-underline shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50"
  style={{
    color: "#065f46",
    opacity: 1,
  }}
>
  <span>←</span>
  <span>العودة إلى الرئيسية</span>
</Link>
          </div>
        </header>

        {/* القصة المميزة */}

        <section className="mt-6 overflow-hidden rounded-[34px] border border-emerald-100 bg-white shadow-xl">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_.85fr]">

            {/* النص */}

            <div className="p-6 sm:p-8">
              <span className="inline-flex rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-700">
                🌟 مميز هذا الأسبوع
              </span>

              <p className="mt-4 text-sm font-black text-emerald-700">
                {featured.badge}
              </p>

              <h2 className="mt-2 text-3xl font-black leading-[1.45] text-slate-800 sm:text-4xl">
                {featured.icon}{" "}
                {featured.title}
              </h2>

              <p className="mt-4 max-w-2xl text-[16px] font-bold leading-8 text-slate-600">
                {featured.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <ReadingChip>
                  📖 قراءة
                </ReadingChip>

                <ReadingChip>
                  🧠 فهم
                </ReadingChip>

                <ReadingChip>
                  💎 مفردات
                </ReadingChip>

                <ReadingChip>
                  📝 اختبار ورقي
                </ReadingChip>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={featured.href}
                  className="rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white no-underline shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-800"
                >
                  📖 افتح القصة
                </Link>

                <Link
                  href="/reading/stories/relatives/worksheet"
                  className="rounded-2xl border-2 border-violet-200 bg-violet-50 px-5 py-3 font-black text-violet-700 no-underline transition hover:bg-violet-100"
                >
                  📝 الاختبار الورقي A4
                </Link>
              </div>
            </div>

            {/* الرسم */}

            <div className="relative min-h-[300px] overflow-hidden bg-gradient-to-br from-sky-100 via-emerald-50 to-amber-100">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/50" />

              <div className="absolute bottom-5 left-1/2 h-[170px] w-[290px] -translate-x-1/2 rounded-[30px] bg-[#f2c88f] shadow-xl">
                <div className="absolute -top-[55px] left-1/2 h-[110px] w-[230px] -translate-x-1/2 rotate-45 rounded-[25px] bg-[#df734d]" />

                <div className="absolute bottom-0 left-1/2 h-[78px] w-[50px] -translate-x-1/2 rounded-t-[24px] bg-[#81543e]" />

                <div className="absolute left-[16%] top-[40px] h-[44px] w-[44px] rounded-xl border-[6px] border-white bg-sky-300" />

                <div className="absolute right-[16%] top-[40px] h-[44px] w-[44px] rounded-xl border-[6px] border-white bg-sky-300" />
              </div>

              <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-end text-5xl">
                👴🏻 👵🏻 👨🏻 👩🏻 👦🏻
              </div>

              <div className="absolute left-[12%] top-[18%] text-5xl">
                ❤️
              </div>
            </div>
          </div>
        </section>

        {/* أقسام الفهم */}

        <section className="mt-6">
          <div className="mb-4">
            <span className="inline-flex rounded-full bg-sky-100 px-4 py-2 text-sm font-black text-sky-700">
              🧭 استكشف الركن
            </span>

            <h2 className="mt-2 text-2xl font-black text-slate-800 sm:text-3xl">
              مسارات الفهم القرائي
            </h2>

            <p className="mt-1 text-slate-500">
              نبدأ بالقصة المصورة،
              ثم نضيف نصوصًا وتحديات
              جديدة بالتدريج.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ReadingCard
              icon="📖"
              title="القصص المصوّرة"
              description="قصص قصيرة تجمع القراءة الممتعة مع المفردات وأسئلة الفهم."
              href="/reading/stories/relatives"
              badge="متاح الآن"
              color="#168a63"
              lightColor="#eaf9f2"
              active
            />

            {others.map((item) => (
              <ReadingCard
                key={item.id}
                icon={item.icon}
                title={item.title}
                description={item.description}
                href={item.href}
                badge={item.badge}
                color={item.color}
                lightColor={item.lightColor}
              />
            ))}
          </div>
        </section>

        {/* للزائر */}

        <section className="mt-6 rounded-[30px] border border-amber-200 bg-gradient-to-l from-amber-50 via-white to-emerald-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-amber-100 text-4xl">
              👨‍👩‍👧
            </div>

            <div>
              <p className="text-sm font-black text-amber-700">
                متاح للطالب والزائر
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-800">
                تعلّم واستفد بدون تسجيل دخول
              </h2>

              <p className="mt-1 leading-7 text-slate-600">
                يستطيع الزائر قراءة
                القصة وحل أسئلة الفهم
                وفتح النسخة الورقية
                للطباعة مباشرة.
              </p>
            </div>
          </div>
        </section>

        <footer className="py-7 text-center text-sm leading-7 text-slate-500">
          <strong className="text-emerald-700">
            أكاديمية لغتي الرقمية
          </strong>

          <br />

          نقرأ لنفهم… ونفهم لنتعلم 📚✨
        </footer>
      </div>
    </main>
  );
}

function ReadingChip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
      {children}
    </span>
  );
}

function ReadingCard({
  icon,
  title,
  description,
  href,
  badge,
  color,
  lightColor,
  active = false,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  badge: string;
  color: string;
  lightColor: string;
  active?: boolean;
}) {
  const content = (
    <article
      className={`h-full rounded-[28px] border bg-white p-5 shadow-sm transition ${
        active
          ? "hover:-translate-y-1 hover:shadow-lg"
          : "opacity-80"
      }`}
      style={{
        borderColor: `${color}33`,
      }}
    >
      <div
        className="grid h-14 w-14 place-items-center rounded-2xl text-3xl"
        style={{
          background: lightColor,
        }}
      >
        {icon}
      </div>

      <span
        className="mt-4 block text-xs font-black"
        style={{
          color,
        }}
      >
        {active ? "✨ " : "🔒 "}
        {badge}
      </span>

      <h3 className="mt-2 text-xl font-black text-slate-800">
        {title}
      </h3>

      <p className="mt-2 min-h-[72px] text-sm leading-7 text-slate-600">
        {description}
      </p>

      <div
        className="mt-4 rounded-2xl px-4 py-3 text-center text-sm font-black"
        style={{
          background: lightColor,
          color,
        }}
      >
        {active
          ? "افتح الآن ←"
          : "قريبًا"}
      </div>
    </article>
  );

  if (!active || href === "#") {
    return content;
  }

  return (
    <Link
      href={href}
      className="no-underline"
    >
      {content}
    </Link>
  );
}