const sections = [
  {
    icon: "📚",
    title: "دروسي",
    description: "الدروس والأنشطة التعليمية الممتعة",
  },
  {
    icon: "📖",
    title: "رحلة القارئ",
    description: "الحروف والمقاطع والكلمات والقراءة",
  },
  {
    icon: "🎮",
    title: "الألعاب التعليمية",
    description: "العب وتعلّم مع فارس",
  },
  {
    icon: "📝",
    title: "الاختبارات",
    description: "اختبر مهاراتك وتابع تقدمك",
  },
  {
    icon: "📅",
    title: "الخطة الأسبوعية",
    description: "اطّلع على خطة هذا الأسبوع",
  },
  {
    icon: "✏️",
    title: "الواجبات",
    description: "شاهد واجبات اليوم ومواعيدها",
  },
  {
    icon: "🏆",
    title: "لوحة الشرف",
    description: "نحتفي بإنجازات أبطال الأكاديمية",
  },
  {
    icon: "🌱",
    title: "رحلة الدعم",
    description: "تدريبات مخصصة لتطوير القراءة",
  },
];

export default function Home() {
  const today = new Intl.DateTimeFormat("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-emerald-50 via-sky-50 to-amber-50 text-slate-800"
    >
      <header className="border-b border-white bg-white/90 px-5 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-emerald-700">
              أكاديمية لغتي
            </h1>
            <p className="text-sm font-semibold text-slate-500">
              نتعلّم… نقرأ… نبدع
            </p>
          </div>

          <div className="rounded-full bg-amber-100 px-4 py-2 font-bold text-amber-800">
            ⭐ نقاطي: 0
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-3 font-bold text-emerald-700">📅 {today}</p>

          <h2 className="mb-4 text-4xl font-black leading-tight text-slate-900 md:text-6xl">
            السلام عليكم يا بطل 🌟
          </h2>

          <p className="mb-3 text-xl font-bold text-emerald-700">
            أنا فارس، وسأرافقك في رحلتك التعليمية.
          </p>

          <p className="mb-7 text-lg leading-8 text-slate-600">
            استعد ليوم ممتع من القراءة والتعلّم والألعاب والتحديات.
          </p>

          <button className="rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-black text-white shadow-lg transition hover:bg-emerald-700">
            🚀 ابدأ رحلتي التعليمية
          </button>
        </div>

        <div className="flex justify-center">
          <div className="relative flex h-80 w-72 items-center justify-center rounded-[3rem] border-4 border-white bg-white shadow-xl">
            <div className="text-center">
              <div className="text-8xl">👦🏻</div>

              <div className="mx-auto -mt-2 w-32 rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">
                فارس
              </div>

              <p className="mt-4 px-5 text-sm font-bold text-slate-500">
                مرشد أكاديمية لغتي بالسترة الخضراء
              </p>
            </div>

            <div className="absolute -left-4 top-5 rounded-2xl bg-amber-300 px-4 py-2 font-black shadow">
              أحسنت! ⭐
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-12">
        <h2 className="mb-6 text-3xl font-black text-slate-900">
          أقسام الأكاديمية
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => (
            <button
              key={section.title}
              className="rounded-3xl border border-white bg-white p-6 text-right shadow-md transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 text-5xl">{section.icon}</div>

              <h3 className="mb-2 text-xl font-black text-emerald-700">
                {section.title}
              </h3>

              <p className="leading-7 text-slate-500">
                {section.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-12 md:grid-cols-2">
        <article className="rounded-3xl bg-white p-7 shadow-md">
          <h2 className="mb-4 text-2xl font-black text-sky-700">
            📅 خطة اليوم
          </h2>

          <ul className="space-y-3 text-lg">
            <li>✅ قراءة الدرس الحالي</li>
            <li>✏️ إكمال النشاط الكتابي</li>
            <li>📖 القراءة لمدة عشر دقائق</li>
          </ul>
        </article>

        <article className="rounded-3xl bg-white p-7 shadow-md">
          <h2 className="mb-4 text-2xl font-black text-amber-700">
            📝 واجب اليوم
          </h2>

          <p className="text-lg leading-8 text-slate-600">
            لا توجد واجبات مضافة حاليًا. سيظهر الواجب هنا بعد نشره من
            المعلم.
          </p>
        </article>
      </section>

      <footer className="bg-emerald-700 px-5 py-7 text-center font-bold text-white">
        أكاديمية لغتي © 2026 — معًا نتعلّم… ونقرأ… ونبدع
      </footer>
    </main>
  );
}