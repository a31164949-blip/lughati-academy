import Link from "next/link";

const tracks = [
  {
    icon: "🏆", title: "رحلة القراءة", label: "النقاط والمسابقات",
    description: "سجّل قراءتك حسب تعليمات الأكاديمية، ويتولى المعلم اعتماد الإنجاز. تبقى شروط احتساب النقاط الحالية كما هي.",
    href: "/reading-journey", action: "ابدأ رحلة القراءة",
    color: "#087c58", bg: "#e9faf1",
  },
  {
    icon: "📖", title: "قراءة المنهج", label: "القراءة المنزلية مع الأسرة",
    description: "اقرأ نصوص منهج لغتي في المنزل بمساعدة أسرتك، وكرر التدريب حتى تتحسن الطلاقة. هذا المسار لا يحتسب نقاطًا تنافسية.",
    href: "/curriculum-reading", action: "ابدأ قراءة المنهج",
    color: "#225a9f", bg: "#eef5ff",
  },
];

export default function ReadingTracksPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-emerald-50 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-5xl">
        <Link href="/journey" className="font-bold text-emerald-800">← العودة إلى محطاتي</Link>
        <header className="mb-8 mt-6 rounded-3xl bg-white p-7 text-center shadow-sm">
          <p className="font-bold text-emerald-700">أكاديمية لغتي الرقمية</p>
          <h1 className="mt-2 text-3xl font-extrabold">📚 عالم القراءة</h1>
          <p className="mt-3 leading-8 text-slate-600">اختر مسارك: القراءة التنافسية بالنقاط، أو القراءة المنزلية بمساندة الأسرة.</p>
        </header>
        <div className="grid gap-5 md:grid-cols-2">
          {tracks.map(track => (
            <section key={track.href} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-4xl" style={{ background: track.bg }} aria-hidden="true">{track.icon}</div>
              <h2 className="text-2xl font-extrabold">{track.title}</h2>
              <p className="mt-1 font-bold" style={{ color: track.color }}>{track.label}</p>
              <p className="my-5 min-h-28 leading-8 text-slate-600">{track.description}</p>
              <Link className="block rounded-2xl px-4 py-4 text-center font-extrabold text-white" style={{ background: track.color }} href={track.href}>{track.action}</Link>
            </section>
          ))}
        </div>
        <p className="mt-6 text-center text-sm leading-7 text-slate-600">قراءة المنهج للتدريب وليست بديلًا عن اعتماد المعلم في رحلة القراءة.</p>
      </div>
    </main>
  );
}
