import Link from "next/link";

const sections = [
  {
    icon: "🎯",
    label: "التهيئة",
    title: "مدخل الوحدة",
    description: "أنشطة تمهيدية ممتعة للاستعداد لدروس الوحدة.",
    href: "#",
    button: "ابدأ التهيئة",
  },
  {
    icon: "🤝",
    label: "الدرس الأول",
    title: "صلة الرحم",
    description: "نتعلم أهمية التواصل مع الأقارب والإحسان إليهم.",
    href: "/lessons/unit1/lesson1",
    button: "ابدأ الدرس",
  },
  {
    icon: "📝",
    label: "التقويم",
    title: "مراجعة الوحدة",
    description: "تدريبات وأسئلة قصيرة للتأكد من إتقان المهارات.",
    href: "#",
    button: "ابدأ المراجعة",
  },
];

export default function UnitOnePage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-emerald-50 to-sky-50 px-5 py-8 text-slate-900"
    >
      <section className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl bg-white p-6 shadow-sm md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="mb-2 font-bold text-emerald-700">
                أكاديمية لغتي
              </p>

              <h1 className="mb-3 text-4xl font-bold md:text-5xl">
                👨‍👩‍👦 الوحدة الأولى: أقاربي
              </h1>

              <p className="text-lg leading-8 text-slate-600">
                نتعلم في هذه الوحدة صلة الأقارب، وبر الوالدين، والتعاون،
                وتحمل المسؤولية.
              </p>
            </div>

            <Link
              href="/lessons"
              className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 font-bold text-emerald-700 shadow-sm"
            >
              العودة إلى الوحدات
            </Link>
          </div>

          <div className="mt-7">
            <div className="mb-2 flex justify-between text-sm font-bold text-slate-600">
              <span>تقدمك في الوحدة</span>
              <span>0%</span>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-0 rounded-full bg-emerald-500" />
            </div>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
                {section.icon}
              </div>

              <span className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                {section.label}
              </span>

              <h2 className="mb-3 text-2xl font-bold text-emerald-700">
                {section.title}
              </h2>

              <p className="mb-6 min-h-20 leading-8 text-slate-600">
                {section.description}
              </p>

              <Link
                href={section.href}
                className="block rounded-2xl bg-emerald-600 px-4 py-3 text-center font-bold text-white"
              >
                {section.button}
              </Link>
            </article>
          ))}
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">🌟 مكافأة الوحدة</h2>

          <p className="leading-8 text-slate-600">
            أكمل الدرس والتدريبات والتقويم لتحصل على نجمة الوحدة ووسام
            صلة الرحم.
          </p>
        </section>
      </section>
    </main>
  );
}