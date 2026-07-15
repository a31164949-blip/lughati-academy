import Link from "next/link";

const letters = [
  { letter: "أ", word: "أسد", icon: "🦁" },
  { letter: "ب", word: "بطة", icon: "🦆" },
  { letter: "ت", word: "تفاحة", icon: "🍎" },
  { letter: "ث", word: "ثعلب", icon: "🦊" },
  { letter: "ج", word: "جمل", icon: "🐪" },
  { letter: "ح", word: "حصان", icon: "🐎" },
  { letter: "خ", word: "خروف", icon: "🐑" },
  { letter: "د", word: "دجاجة", icon: "🐔" },
  { letter: "ذ", word: "ذرة", icon: "🌽" },
  { letter: "ر", word: "رمان", icon: "🍎" },
  { letter: "ز", word: "زهرة", icon: "🌸" },
  { letter: "س", word: "سمكة", icon: "🐟" },
  { letter: "ش", word: "شمس", icon: "☀️" },
  { letter: "ص", word: "صقر", icon: "🦅" },
  { letter: "ض", word: "ضفدع", icon: "🐸" },
  { letter: "ط", word: "طائرة", icon: "✈️" },
  { letter: "ظ", word: "ظرف", icon: "✉️" },
  { letter: "ع", word: "عنب", icon: "🍇" },
  { letter: "غ", word: "غيمة", icon: "☁️" },
  { letter: "ف", word: "فراشة", icon: "🦋" },
  { letter: "ق", word: "قمر", icon: "🌙" },
  { letter: "ك", word: "كتاب", icon: "📘" },
  { letter: "ل", word: "ليمون", icon: "🍋" },
  { letter: "م", word: "موز", icon: "🍌" },
  { letter: "ن", word: "نحلة", icon: "🐝" },
  { letter: "هـ", word: "هدية", icon: "🎁" },
  { letter: "و", word: "وردة", icon: "🌹" },
  { letter: "ي", word: "يد", icon: "✋" },
];

export default function LettersPage() {
  return (
    <main className="letters-page" dir="rtl">
      <header className="letters-header">
        <Link href="/support" className="back-support">
          → العودة إلى رحلة الدعم
        </Link>

        <div className="letters-heading">
          <div className="letters-heading-icon">🔤</div>

          <div>
            <span>المستوى الأول</span>
            <h1>الحروف والأصوات</h1>
            <p>اختر حرفًا، وانطق صوته، ثم اقرأ الكلمة المرتبطة به.</p>
          </div>
        </div>
      </header>

      <section className="letters-guide">
        <div>
          <span className="letters-badge">تدريب بسيط وممتع ⭐</span>
          <h2>استمع، كرّر، ثم اقرأ</h2>
          <p>
            اضغط على بطاقة الحرف، وردّد صوته ثلاث مرات، ثم اقرأ الكلمة بصوت
            واضح.
          </p>
        </div>

        <div className="letters-mascot">🧒🏻</div>
      </section>

      <section className="letters-section">
        <div className="letters-section-heading">
          <span>حروف الهجاء</span>
          <h2>اختر الحرف الذي ستتدرّب عليه</h2>
        </div>

        <div className="letters-grid">
          {letters.map((item) => (
            <Link
              href={
  item.letter === "أ"
    ? "/support/letters/alef"
    : "/support/letters"
}
              className="letter-card"
              key={item.letter}
            >
              <div className="letter-symbol">{item.letter}</div>
              <div className="letter-picture">{item.icon}</div>
              <strong>{item.word}</strong>
              <span>ابدأ التدريب ←</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="letters-tip">
        <span>💡</span>
        <div>
          <h2>نصيحة فارس</h2>
          <p>تدرّب على ثلاثة حروف فقط كل يوم حتى تتقنها جيدًا.</p>
        </div>
      </section>
    </main>
  );
}