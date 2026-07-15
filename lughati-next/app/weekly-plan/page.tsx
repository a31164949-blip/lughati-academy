"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

type DayPlan = {
  day: string;
  lesson: string;
  objective: string;
  homework: string;
};

type WeeklyPlan = {
  weekTitle: string;
  days: DayPlan[];
  published: boolean;
};

export default function StudentWeeklyPlanPage() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
            }))
          : [];

        setPlan({
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

        <div className="space-y-5">
          {plan.days.map((item) => (
            <section
              key={item.day}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="mb-5 text-2xl font-black text-emerald-700">
                {item.day}
              </h2>

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
              </div>
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