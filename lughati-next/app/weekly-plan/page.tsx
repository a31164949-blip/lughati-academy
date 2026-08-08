"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

type DayPlan = {
  day: string;
  lesson: string;
  objective: string;
  homework: string;
  readingTask: string;
  spellingWords: string;
  bringTomorrow: string;
  teacherNote: string;
};

type WeeklyPlan = {
  weekTitle: string;
  weeklyChallenge: string;
farisMessage: string;
  days: DayPlan[];
  published: boolean;
};

export default function StudentWeeklyPlanPage() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const dayNames = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const todayName = dayNames[new Date().getDay()];

const [openDay, setOpenDay] = useState<string | null>(todayName);
const [completedDays, setCompletedDays] = useState<string[]>([]);
const [studentId, setStudentId] = useState("");
const [isSavingCompletion, setIsSavingCompletion] = useState(false);
const [completionMessage, setCompletionMessage] = useState("");
useEffect(() => {
  const savedStudentId = window.localStorage.getItem("student-id");

  if (savedStudentId) {
    setStudentId(savedStudentId);
  }
}, []);
useEffect(() => {
  async function loadTodayCompletion() {
    if (!studentId) {
      return;
    }

    const today = new Date();
    const dateKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    try {
      const completionReference = doc(
        db,
        "dailyCompletions",
        `${studentId}_${dateKey}_${todayName}`
      );

      const completionSnapshot = await getDoc(completionReference);

      if (
        completionSnapshot.exists() &&
        completionSnapshot.data().completed === true
      ) {
        setCompletedDays([todayName]);
      } else {
        setCompletedDays([]);
      }
    } catch (error) {
      console.error("تعذر تحميل إنجاز اليوم:", error);
    }
  }

  loadTodayCompletion();
}, [studentId, todayName]);
  useEffect(() => {
    async function loadPlan() {
      try {
        const planReference = doc(db, "weeklyPlans", "current");
        const planSnapshot = await getDoc(planReference);

        if (!planSnapshot.exists()) {
          setErrorMessage("لم تُنشر خطة أسبوعية حتى الآن.");
          return;
        }

        const data = planSnapshot.data();

        if (data.published !== true) {
          setErrorMessage("الخطة الأسبوعية غير متاحة حاليًا.");
          return;
        }
const savedDays: DayPlan[] = Array.isArray(data.days)
  ? data.days.map((item: Partial<DayPlan>) => ({
      day: typeof item.day === "string" ? item.day : "",
      lesson: typeof item.lesson === "string" ? item.lesson : "",
      objective:
        typeof item.objective === "string" ? item.objective : "",
      homework:
        typeof item.homework === "string" ? item.homework : "",
      readingTask:
        typeof item.readingTask === "string" ? item.readingTask : "",
    

spellingWords:
  typeof item.spellingWords === "string"
    ? item.spellingWords
    : "",

bringTomorrow:
  typeof item.bringTomorrow === "string"
    ? item.bringTomorrow
    : "",

teacherNote:
  typeof item.teacherNote === "string"
    ? item.teacherNote
    : "",
   
    }))
  : [];
        

        setPlan({
          weeklyChallenge:
  typeof data.weeklyChallenge === "string"
    ? data.weeklyChallenge
    : "",

farisMessage:
  typeof data.farisMessage === "string"
    ? data.farisMessage
    : "",
          weekTitle:
            typeof data.weekTitle === "string"
              ? data.weekTitle
              : "الخطة الأسبوعية",
          days: savedDays,
          published: true,
        });
      } catch (error) {
        console.error(error);
        setErrorMessage(
          "تعذر تحميل الخطة الأسبوعية. حاول مرة أخرى لاحقًا."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadPlan();
  }, []);
  async function handleToggleDayCompletion(day: string) {
  if (!studentId) {
    setCompletionMessage("يرجى تسجيل الدخول أولًا لحفظ الإنجاز.");
    return;
  }

  const isAlreadyCompleted = completedDays.includes(day);
  const newCompletedStatus = !isAlreadyCompleted;

  const today = new Date();
  const dateKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  try {
    setIsSavingCompletion(true);
    setCompletionMessage("");

    const completionReference = doc(
      db,
      "dailyCompletions",
      `${studentId}_${dateKey}_${day}`
    );

    await setDoc(
      completionReference,
      {
        studentId,
        day,
        date: dateKey,
        weekTitle: plan?.weekTitle ?? "",
        completed: newCompletedStatus,
        completedAt: newCompletedStatus ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setCompletedDays((currentDays) =>
      newCompletedStatus
        ? [...currentDays.filter((savedDay) => savedDay !== day), day]
        : currentDays.filter((savedDay) => savedDay !== day)
    );

    setCompletionMessage(
      newCompletedStatus
        ? "🎉 أحسنت! تم حفظ إنجاز مهام اليوم."
        : "تم إلغاء تسجيل إنجاز هذا اليوم."
    );
  } catch (error) {
    console.error("تعذر حفظ إنجاز اليوم:", error);
    setCompletionMessage(
      "تعذر حفظ الإنجاز الآن. تحقق من الاتصال وحاول مرة أخرى."
    );
  } finally {
    setIsSavingCompletion(false);
  }
}

  if (isLoading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-6"
      >
        <div className="rounded-3xl bg-white px-8 py-6 text-xl font-bold text-emerald-700 shadow-sm">
          جارٍ تحميل الخطة الأسبوعية...
        </div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-6"
      >
        <div className="max-w-xl rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl">📅</div>

          <h1 className="text-2xl font-black text-slate-800">
            الخطة الأسبوعية
          </h1>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            {errorMessage}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl bg-gradient-to-l from-emerald-600 to-emerald-500 p-7 text-white shadow-lg">
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
          <p className="font-bold text-emerald-50">
            أكاديمية لغتي الرقمية
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            📅 الخطة الأسبوعية
          </h1>

          <p className="mt-3 text-xl font-bold text-emerald-50">
            {plan.weekTitle}
          </p>

          <p className="mt-3 leading-8 text-emerald-50">
            اطّلع على دروس هذا الأسبوع وأهدافها وواجباتها اليومية.
          </p>
        </header>
        {plan.farisMessage && (
  <section className="mb-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
    <h2 className="mb-2 text-xl font-black text-emerald-800">
      ✨ رسالة فارس
    </h2>

    <p className="leading-8 text-emerald-900">
      {plan.farisMessage}
    </p>
  </section>
)}

{plan.weeklyChallenge && (
  <section className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
    <h2 className="mb-2 text-xl font-black text-amber-800">
      🏆 تحدي الأسبوع
    </h2>

    <p className="leading-8 text-amber-900">
      {plan.weeklyChallenge}
    </p>
  </section>
)}

        <div className="space-y-5">
          {plan.days.map((item) => (
            <section
              key={item.day}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <button
  type="button"
  onClick={() =>
    setOpenDay((currentDay) =>
      currentDay === item.day ? null : item.day
    )
  }
  className="mb-5 flex w-full items-center justify-between rounded-2xl bg-emerald-50 px-5 py-4 text-right"
  aria-expanded={openDay === item.day}
>
  <span className="flex items-center gap-3 text-2xl font-black text-emerald-700">
  {item.day}

  {item.day === todayName && (
    <span className="rounded-full bg-emerald-600 px-3 py-1 text-sm font-bold text-white">
      اليوم 🌟
    </span>
  )}
</span>

  <span className="text-xl font-black text-emerald-700">
    {openDay === item.day ? "▲" : "▼"}
  </span>
</button>

              {openDay === item.day && (
  <div className="grid gap-4 md:grid-cols-3">
                <article className="rounded-2xl bg-sky-50 p-5">
                  <p className="font-black text-sky-800">📘 الدرس</p>

                  <p className="mt-3 text-lg font-bold leading-8 text-slate-800">
                    {item.lesson.trim() || "لم يُحدد بعد"}
                  </p>
                </article>

                <article className="rounded-2xl bg-emerald-50 p-5">
                  <p className="font-black text-emerald-800">🎯 الهدف</p>

                  <p className="mt-3 text-lg font-bold leading-8 text-slate-800">
                    {item.objective.trim() || "لم يُحدد بعد"}
                  </p>
                </article>

                <article className="rounded-2xl bg-amber-50 p-5">
                  <p className="font-black text-amber-800">📝 الواجب</p>

                  <p className="mt-3 text-lg font-bold leading-8 text-slate-800">
                    {item.homework.trim() || "لا يوجد واجب"}
                  </p>
                </article>
                <article className="rounded-2xl bg-violet-50 p-5">
  <p className="font-black text-violet-800">📖 مهمة القراءة</p>

  <p className="mt-3 text-lg font-bold leading-8 text-slate-800">
    {item.readingTask.trim() || "لا توجد مهمة قراءة"}
  </p>
  <a
  href="/reading-journey"
  className="mt-4 block rounded-2xl bg-violet-600 px-4 py-3 text-center font-black text-white"
>
  🔥 ابدأ رحلة القراءة
</a>
</article>

<article className="rounded-2xl bg-rose-50 p-5">
  <p className="font-black text-rose-800">✍️ كلمات الإملاء</p>

  <p className="mt-3 whitespace-pre-line text-lg font-bold leading-8 text-slate-800">
    {item.spellingWords.trim() || "لا توجد كلمات إملاء"}
  </p>
</article>
{item.bringTomorrow.trim() && (
  <article className="rounded-2xl bg-sky-50 p-5 md:col-span-3">
    <p className="font-black text-sky-800">
      🎒 ماذا أحضر غدًا؟
    </p>

    <p className="mt-3 whitespace-pre-line text-lg font-bold leading-8 text-slate-800">
      {item.bringTomorrow}
    </p>
  </article>
)}
<article className="rounded-2xl bg-teal-50 p-5 md:col-span-3">
  <p className="font-black text-teal-800">💬 ملاحظة المعلم</p>

  <p className="mt-3 whitespace-pre-line text-lg font-bold leading-8 text-slate-800">
    {item.teacherNote.trim() || "لا توجد ملاحظة من المعلم"}
  </p>
</article>
<button
  type="button"
  onClick={() => handleToggleDayCompletion(item.day)}
disabled={isSavingCompletion}
  className={`rounded-2xl px-5 py-4 text-lg font-black md:col-span-3 ${
    completedDays.includes(item.day)
      ? "bg-emerald-600 text-white"
      : "border-2 border-emerald-600 bg-white text-emerald-700"
  }`}
>
  {isSavingCompletion
  ? "جارٍ حفظ الإنجاز... ⏳"
  : completedDays.includes(item.day)
    ? "✅ تم إنجاز مهام اليوم"
    : "أتممت مهام اليوم"}
</button>
{completionMessage && (
  <p className="text-center font-bold text-emerald-700 md:col-span-3">
    {completionMessage}
  </p>
)}
              </div>
              )}
            </section>
          ))}
        </div>

        <footer className="mt-8 rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="font-black text-emerald-700">
            نتعلّم… نقرأ… نبدع
          </p>

          <p className="mt-2 text-sm text-slate-500">
            بإشراف الأستاذ / إبراهيم أحمد
          </p>
        </footer>
      </div>
    </main>
  );
}