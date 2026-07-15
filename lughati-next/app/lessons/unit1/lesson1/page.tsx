import Link from "next/link";

export default function LessonOnePage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-emerald-50 to-sky-50 px-5 py-8 text-slate-900"
    >
      <section className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl bg-white p-6 shadow-sm md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="mb-2 font-bold text-emerald-700">
                أكاديمية لغتي
              </p>

              <h1 className="mb-3 text-3xl font-bold md:text-5xl">
                🤝 الدرس الأول: صلة الرحم
              </h1>

              <p className="max-w-3xl text-lg leading-9 text-slate-600">
                نتعلم في هذا الدرس أهمية التواصل مع الأقارب، والسؤال عنهم،
                وزيارتهم، والإحسان إليهم.
              </p>
            </div>

            <Link
              href="/lessons/unit1"
              className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 font-bold text-emerald-700 shadow-sm"
            >
              العودة إلى الوحدة
            </Link>
          </div>

          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-600">
              <span>تقدمك في الدرس</span>
              <span>0%</span>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-0 rounded-full bg-emerald-500" />
            </div>
          </div>
        </header>

        <section className="mb-8">
  <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
      📖
    </div>

    <h2 className="mb-3 text-2xl font-bold text-emerald-700">
      أقرأ وأفهم
    </h2>

    <p className="mb-6 leading-8 text-slate-600">
      اقرأ فكرة الدرس، وتعرّف معنى صلة الرحم، ثم انتقل إلى النشاط.
    </p>

    <Link
      href="/lessons/unit1/lesson1/read"
      className="block rounded-2xl bg-emerald-600 px-5 py-3 text-center font-bold text-white"
    >
      ابدأ القراءة
    </Link>
  </article>
</section>
      </section>
    </main>
  );
}