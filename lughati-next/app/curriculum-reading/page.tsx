import Link from "next/link";

const lessons = [
  { title: "صلة الرحم", unit: "الوحدة الأولى: أقاربي", skill: "القراءة الصحيحة والطلاقة وفهم المعنى", href: "/lessons/unit1/lesson1/read" },
  { title: "عذرًا يا جدي", unit: "الوحدة الأولى: أقاربي", skill: "قراءة الجمل مع مراعاة الضبط والوقف", href: "/lessons/unit1/lesson2/read" },
];

export default function CurriculumReadingPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-sky-50 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-5xl">
        <Link href="/reading-tracks" className="font-bold text-sky-800">← العودة إلى عالم القراءة</Link>
        <header className="mb-6 mt-6 rounded-3xl bg-white p-7 shadow-sm">
          <p className="font-bold text-sky-800">أكاديمية لغتي الرقمية</p>
          <h1 className="mt-2 text-3xl font-extrabold">📖 قراءة المنهج مع أسرتي</h1>
          <p className="mt-3 leading-8 text-slate-600">اختر درسًا متاحًا، وافتح نصه واقرأه في المنزل. يمكنك العودة للدرس وتكرار التدريب.</p>
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">هذا القسم للتدريب المنزلي فقط؛ لا يمنح نقاطًا أو يرسل قراءة الطالب إلى المعلم.</p>
        </header>
        <section aria-labelledby="family-guide" className="mb-6 rounded-3xl border border-sky-100 bg-white p-6">
          <h2 id="family-guide" className="text-xl font-extrabold text-sky-900">🏡 كيف تساند أسرتي قراءتي؟</h2>
          <ol className="mt-4 list-inside list-decimal space-y-3 leading-8 text-slate-700">
            <li>أقرأ النص مرة بنفسي، وتستمع إليّ أسرتي بهدوء.</li>
            <li>نراجع الكلمات الصعبة ونصحح النطق برفق.</li>
            <li>أعيد قراءة النص بطلاقة، ثم أشرح معناه بأسلوبي.</li>
            <li>يمكنني تكرار التدريب في يوم آخر دون رفع ملفات أو تسجيلات.</li>
          </ol>
        </section>
        <h2 className="mb-4 text-xl font-extrabold">الدروس المتاحة للقراءة</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {lessons.map(lesson => (
            <article key={lesson.href} className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-sky-800">{lesson.unit}</p>
              <h3 className="mt-2 text-2xl font-extrabold">{lesson.title}</h3>
              <p className="my-4 leading-8 text-slate-600">المهارة: {lesson.skill}</p>
              <Link href={lesson.href} className="block rounded-2xl bg-sky-800 px-4 py-4 text-center font-bold text-white">افتح النص وابدأ القراءة</Link>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm leading-7 text-slate-600">ستُضاف بقية الدروس عند توفر صفحات قراءتها، حتى لا تظهر روابط غير جاهزة.</p>
      </div>
    </main>
  );
}
