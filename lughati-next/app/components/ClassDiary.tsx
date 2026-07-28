"use client";

import Link from "next/link";

const diaryHighlights = [
  {
    icon: "📚",
    label: "تعلمنا اليوم",
    text: "القراءة الجهرية واستخراج الفكرة الرئيسة.",
  },
  {
    icon: "🌟",
    label: "نجم اليوم",
    text: "تكريم الطالب الأكثر اجتهادًا وتعاونًا.",
  },
  {
    icon: "💬",
    label: "رسالة المعلم",
    text: "استمراركم اليوم يصنع إنجازًا أجمل غدًا.",
  },
];

export default function ClassDiary() {
  return (
    <section className="classDiary">
      <div className="classDiary__header">
        <span className="classDiary__label">
          📖 من دفتر أكاديمية لغتي
        </span>

        <h2>يوميات الفصل</h2>

        <p>
          لمحة سريعة تنقل للأسرة أجمل لحظات التعلم والإنجاز.
        </p>
      </div>

      <div className="classDiary__featured">
        <div className="classDiary__featuredIcon">📸</div>

        <div className="classDiary__featuredContent">
          <span>لقطة اليوم</span>
          <h3>نشاط جماعي مليء بالتعاون والحماس</h3>
          <p>
            شارك الطلاب في نشاط قرائي ممتع، وتبادلوا الأفكار
            بروح جميلة.
          </p>
        </div>
      </div>

      <div className="classDiary__highlights">
        {diaryHighlights.map((item) => (
          <article
            className="classDiary__highlight"
            key={item.label}
          >
            <span className="classDiary__highlightIcon">
              {item.icon}
            </span>

            <div>
              <strong>{item.label}</strong>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="classDiary__footer">
        <span>
          تُراجع الصور والمقاطع من المعلم قبل النشر.
        </span>

        <Link href="/gallery" className="classDiary__button">
          عرض جميع اليوميات
          <span>←</span>
        </Link>
      </div>
    </section>
  );
}