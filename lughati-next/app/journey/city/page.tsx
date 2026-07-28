export default function AchievementCityPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-100 to-amber-100 px-4 py-8"
    >
      <section className="mx-auto max-w-5xl">
        <header className="mb-6 rounded-3xl bg-white/80 p-6 text-center shadow-lg backdrop-blur">
          <p className="mb-2 text-sm font-bold text-emerald-700">
            أكاديمية لغتي الرقمية
          </p>

          <h1 className="text-3xl font-black text-slate-800">
            🏡 مدينة الإنجاز
          </h1>

          <p className="mt-3 text-slate-600">
            ابنِ مدينتك... وابنِ نفسك
          </p>
        </header>

        <section className="relative min-h-[520px] overflow-hidden rounded-[2rem] border-4 border-white/70 bg-gradient-to-b from-sky-300 via-sky-100 to-emerald-300 shadow-2xl">
          <div className="absolute right-8 top-8 text-6xl">☀️</div>
          <div className="absolute left-10 top-16 text-5xl">☁️</div>
          <div className="absolute left-24 top-28 text-3xl">🐦</div>

          <div className="absolute inset-x-0 bottom-0 h-44 bg-emerald-500/70" />

          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center">
            <div className="text-8xl drop-shadow-lg">🏠</div>

            <div className="mt-2 rounded-full bg-white px-5 py-2 font-black text-slate-700 shadow">
              منزل الطالب
            </div>
          </div>

          <div className="absolute bottom-24 right-10 text-7xl">🌳</div>
          <div className="absolute bottom-24 left-10 text-7xl">🌳</div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-2xl bg-amber-100 px-5 py-3 text-center shadow-lg">
            <p className="font-black text-amber-900">🌱 بداية الحلم</p>
            <p className="mt-1 text-sm text-amber-800">
              كل إنجاز صغير يبني شيئًا جديدًا
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl bg-white p-5 text-center shadow">
            <div className="text-4xl">⭐</div>
            <p className="mt-2 font-black text-slate-800">النجوم</p>
            <p className="mt-1 text-2xl font-black text-amber-500">0</p>
          </article>

          <article className="rounded-3xl bg-white p-5 text-center shadow">
            <div className="text-4xl">🏆</div>
            <p className="mt-2 font-black text-slate-800">الأوسمة</p>
            <p className="mt-1 text-2xl font-black text-amber-500">0</p>
          </article>

          <article className="rounded-3xl bg-white p-5 text-center shadow">
            <div className="text-4xl">📚</div>
            <p className="mt-2 font-black text-slate-800">القراءة</p>
            <p className="mt-1 text-2xl font-black text-emerald-600">0</p>
          </article>

          <article className="rounded-3xl bg-white p-5 text-center shadow">
            <div className="text-4xl">✍️</div>
            <p className="mt-2 font-black text-slate-800">الإملاء</p>
            <p className="mt-1 text-2xl font-black text-sky-600">0</p>
          </article>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-lg">
          <h2 className="text-xl font-black text-slate-800">
            🏗️ البناء القادم
          </h2>

          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-emerald-50 p-4">
            <div className="text-5xl">🌳</div>

            <div>
              <p className="font-black text-emerald-900">
                الشجرة الثانية
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                تبقى 3 قراءات حتى تنمو
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}