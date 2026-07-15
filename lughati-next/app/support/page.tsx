import Link from "next/link";

const supportLevels = [
  {
    number: "1",
    icon: "🔤",
    title: "الحروف والأصوات",
    description: "أتعرّف الحرف، وأستمع إلى صوته، وأميّزه في الكلمات.",
    href: "/support/letters",
  },
  {
    number: "2",
    icon: "🧩",
    title: "المقاطع",
    description: "أجمع الحروف وأقرأ المقاطع القصيرة بسهولة.",
    href: "/support/syllables",
  },
  {
    number: "3",
    icon: "📝",
    title: "الكلمات",
    description: "أقرأ الكلمات المصوّرة وأتدرّب على كتابتها.",
    href: "/support/words",
  },
  {
    number: "4",
    icon: "💬",
    title: "الجمل",
    description: "أقرأ جملًا قصيرة وأفهم معناها.",
    href: "/support/sentences",
  },
  {
    number: "5",
    icon: "📖",
    title: "النصوص القصيرة",
    description: "أقرأ نصوصًا بسيطة وأجيب عن أسئلتها.",
    href: "/support/short-texts",
  },
];

export default function SupportPage() {
  return (
    <main className="support-page" dir="rtl">
      <header className="support-header">
        <Link href="/" className="back-home">
          → العودة للرئيسية
        </Link>

        <div className="support-title">
          <span>🌱</span>
          <div>
            <p>مسار تأسيسي متدرّج</p>
            <h1>رحلة الدعم</h1>
            <p>نتعلّم خطوة خطوة حتى تصبح القراءة سهلة وممتعة.</p>
          </div>
        </div>
      </header>

      <section className="support-intro">
        <div>
          <span className="support-badge">أنا فارس وسأساعدك ⭐</span>
          <h2>ابدأ من مستواك وتقدّم بثقة</h2>
          <p>
            لا تتعجل، أكمل كل مرحلة، واستمع واقرأ وكرّر حتى تتقن المهارة.
          </p>
        </div>

        <div className="support-mascot">🧒🏻</div>
      </section>

      <section className="support-levels">
        <div className="support-section-heading">
          <span>مراحل الرحلة</span>
          <h2>اختر المرحلة التي ستبدأ منها</h2>
        </div>

        <div className="support-levels-grid">
          {supportLevels.map((level) => (
            <Link href={level.href} className="support-level-card" key={level.title}>
              <div className="level-number">{level.number}</div>
              <div className="level-icon">{level.icon}</div>

              <div className="level-content">
                <h3>{level.title}</h3>
                <p>{level.description}</p>
              </div>

              <span className="level-arrow">←</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="support-tip">
        <span>💡</span>
        <div>
          <h2>نصيحة فارس</h2>
          <p>عشر دقائق يوميًا تصنع تقدمًا كبيرًا في القراءة.</p>
        </div>
      </section>
    </main>
  );
}