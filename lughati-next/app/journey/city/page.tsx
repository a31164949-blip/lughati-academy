"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

export default function AchievementCityPage() { 
  const cityStages = [
  { points: 50, name: "الشجرة الثانية", icon: "🌳" },
  { points: 100, name: "الطريق", icon: "🛣️" },
  { points: 150, name: "الحديقة الصغيرة", icon: "🌷" },
  { points: 250, name: "أعمدة الإنارة", icon: "💡" },
  { points: 350, name: "حديقة الألعاب", icon: "🛝" },
  { points: 500, name: "مكتبة لغتي", icon: "📚" },
  { points: 700, name: "المدرسة", icon: "🏫" },
  { points: 900, name: "نافورة المدينة", icon: "⛲" },
  { points: 1200, name: "الملعب", icon: "🏟️" },
  { points: 1500, name: "متجر المدينة", icon: "🏪" },
  { points: 1800, name: "سيارتي", icon: "🚗" },
  { points: 2200, name: "قصر الإنجاز", icon: "🏰" },
  { points: 2700, name: "تطوير المدينة", icon: "🌆" },
  { points: 3500, name: "مدينة البطل الكبرى", icon: "👑" },
];
  const [points, setPoints] = useState(0);
  const nextStage = cityStages.find((stage) => points < stage.points);
const remainingPoints = nextStage ? nextStage.points - points : 0;
const cityMessage =
  points < 50
    ? {
        title: "🌱 بداية الحلم",
        text: "كل إنجاز صغير يبني شيئًا جديدًا في مدينتك ✨",
      }
    : points < 100
    ? {
        title: "🌳 مدينتي بدأت تنمو",
        text: "أحسنت! إنجازاتك بدأت تظهر في مدينتك.",
      }
    : points < 150
    ? {
        title: "🛣️ الطريق إلى النجاح",
        text: "طريق مدينتك بدأ يمتد... واصل الإنجاز!",
      }
    : points < 250
    ? {
        title: "🌷 حديقتي تزدهر",
        text: "مدينتك أصبحت أجمل بفضل اجتهادك.",
      }
    : points < 500
    ? {
        title: "💡 مدينتي تنبض بالحياة",
        text: "كل نقطة تجعل مدينتك أكثر إشراقًا.",
      }
    : points < 1000
    ? {
        title: "🏙️ مدينتي تكبر",
        text: "إنجازات كبيرة تبني مدينة أكبر وأجمل.",
      }
    : points < 2200
    ? {
        title: "✨ مدينة الإنجاز",
        text: "لقد قطعت رحلة رائعة... وما زال هناك المزيد!",
      }
    : {
        title: "👑 مدينة البطل",
        text: "مدينة عظيمة صنعها الاجتهاد والاستمرار.",
      };
useEffect(() => {
  async function loadStudentPoints() {
    try {
      const studentId = localStorage.getItem("student-id");

      if (!studentId || studentId === "student-demo") {
        setPoints(0);
        return;
      }

      const studentSnapshot = await getDoc(
        doc(db, "students", studentId)
      );

      if (!studentSnapshot.exists()) {
        setPoints(0);
        return;
      }

      const studentData = studentSnapshot.data();

      setPoints(
        typeof studentData.points === "number"
          ? studentData.points
          : 0
      );
    } catch (error) {
      console.error("تعذر تحميل نقاط الطالب:", error);
      setPoints(0);
    }
  }

  void loadStudentPoints();
}, []);
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-100 to-amber-100 px-4 py-8"
    >
      <section className="mx-auto max-w-5xl">
        <header className="mb-6 rounded-3xl bg-white/80 p-6 text-center shadow-lg backdrop-blur">
        <a
  href="/journey"
  className="inline-block mb-4 rounded-xl border border-emerald-200 bg-white px-4 py-3 font-bold no-underline"
  style={{
    color: "#065f46",
    fontSize: "16px",
  }}
>
  ← العودة إلى رحلتي
</a>
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
          {points >= 100 && (
  <div
    className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-slate-500/80 rounded-t-3xl"
    style={{
      width: "110px",
      height: "180px",
    }}
  />
)}
{points >= 150 && (
  <>
    <div className="absolute bottom-24 left-[24%] text-6xl drop-shadow-lg">
      🌳
    </div>

    <div className="absolute bottom-20 left-[34%] text-4xl">
      🌷
    </div>

    <div className="absolute bottom-20 right-[34%] text-4xl">
      🌼
    </div>

    <div className="absolute bottom-24 right-[24%] text-6xl drop-shadow-lg">
      🌳
    </div>
  </>
)}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center">
            <div className="text-8xl drop-shadow-lg">🏠</div>

            <div className="mt-2 rounded-full bg-white px-5 py-2 font-black text-slate-700 shadow">
              منزل الطالب
            </div>
          </div>

          <div className="absolute bottom-24 right-10 text-7xl">🌳</div>
          {points >= 50 && (
  <div className="absolute bottom-24 left-10 text-7xl">🌳</div>
)}
          
        </section>
<div className="mt-4 rounded-3xl bg-amber-100 px-6 py-4 text-center shadow">
  <p className="text-xl font-black text-amber-900">
    {cityMessage.title}
  </p>

  <p className="mt-1 text-sm font-bold text-amber-800">
    {cityMessage.text}
  </p>
</div>
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl bg-white p-5 text-center shadow">
            <div className="text-4xl">⭐</div>
            <p className="mt-2 font-black text-slate-800">نقاطي</p>
<p className="mt-1 text-2xl font-black text-amber-500">{points}</p>
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

          <p className="font-black text-emerald-900">
  {nextStage
    ? `${nextStage.icon} ${nextStage.name}`
    : "👑 اكتملت مدينة البطل الكبرى"}
</p>

<p className="mt-1 text-sm text-emerald-800">
  {nextStage
    ? `بقي ${remainingPoints} نقطة حتى يتم البناء`
    : "🎉 أحسنت! لقد أكملت جميع مراحل المدينة"}
</p>


            </div>
            </section>
        </section>
    </main>
  );
}