"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";

type DayPlan = {
  day: string;
  lesson: string;
  objective: string;
  homework: string;
};

const initialDays: DayPlan[] = [
  { day: "الأحد", lesson: "", objective: "", homework: "" },
  { day: "الاثنين", lesson: "", objective: "", homework: "" },
  { day: "الثلاثاء", lesson: "", objective: "", homework: "" },
  { day: "الأربعاء", lesson: "", objective: "", homework: "" },
  { day: "الخميس", lesson: "", objective: "", homework: "" },
];

export default function WeeklyPlanPage() {
  const [weekTitle, setWeekTitle] = useState("");
  const [days, setDays] = useState<DayPlan[]>(initialDays);
  const [published, setPublished] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    async function loadCurrentPlan() {
      try {
        const planReference = doc(db, "weeklyPlans", "current");
        const planSnapshot = await getDoc(planReference);

        if (planSnapshot.exists()) {
          const data = planSnapshot.data();

          setWeekTitle(
            typeof data.weekTitle === "string" ? data.weekTitle : ""
          );

          setPublished(
            typeof data.published === "boolean" ? data.published : true
          );

          if (Array.isArray(data.days)) {
            const savedDays = initialDays.map((defaultDay) => {
              const matchingDay = data.days.find(
                (savedDay: DayPlan) => savedDay.day === defaultDay.day
              );

              return matchingDay
                ? {
                    day: defaultDay.day,
                    lesson:
                      typeof matchingDay.lesson === "string"
                        ? matchingDay.lesson
                        : "",
                    objective:
                      typeof matchingDay.objective === "string"
                        ? matchingDay.objective
                        : "",
                    homework:
                      typeof matchingDay.homework === "string"
                        ? matchingDay.homework
                        : "",
                  }
                : defaultDay;
            });

            setDays(savedDays);
          }
        }
      } catch (error) {
        console.error(error);
        setStatusMessage(
          "تعذر تحميل الخطة السابقة. تحقق من الاتصال أو صلاحيات Firebase."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadCurrentPlan();
  }, []);

  function updateDay(
    index: number,
    field: "lesson" | "objective" | "homework",
    value: string
  ) {
    setDays((currentDays) =>
      currentDays.map((day, dayIndex) =>
        dayIndex === index ? { ...day, [field]: value } : day
      )
    );

    setStatusMessage("");
  }

  async function handleSavePlan() {
    if (!weekTitle.trim()) {
      setStatusMessage("يرجى كتابة عنوان الأسبوع أولًا.");
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage("");

      const planReference = doc(db, "weeklyPlans", "current");

      await setDoc(
        planReference,
        {
          weekTitle: weekTitle.trim(),
          days,
          published,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setStatusMessage(
        published
          ? "تم حفظ الخطة ونشرها للطلاب بنجاح ✅"
          : "تم حفظ الخطة كمسودة غير منشورة ✅"
      );
    } catch (error) {
      console.error(error);
      setStatusMessage(
        "تعذر حفظ الخطة في Firebase. تحقق من الاتصال والصلاحيات."
      );
    } finally {
      setIsSaving(false);
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

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="mb-2 font-bold text-emerald-600">لوحة المعلم</p>

          <h1 className="text-3xl font-black text-emerald-700 sm:text-4xl">
            📅 إدارة الخطة الأسبوعية
          </h1>

          <p className="mt-3 text-slate-600">
            اكتب خطة كل يوم، ثم احفظها وانشرها للطلاب.
          </p>
        </header>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <label
            htmlFor="week-title"
            className="mb-3 block text-lg font-black text-slate-800"
          >
            عنوان الأسبوع
          </label>

          <input
            id="week-title"
            value={weekTitle}
            onChange={(event) => {
              setWeekTitle(event.target.value);
              setStatusMessage("");
            }}
            placeholder="مثال: الأسبوع الأول"
            className="w-full rounded-2xl border border-slate-300 bg-white p-4 text-lg font-bold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </section>

        <div className="space-y-5">
          {days.map((item, index) => (
            <section
              key={item.day}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="mb-5 text-2xl font-black text-slate-800">
                {item.day}
              </h2>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor={`lesson-${index}`}
                    className="mb-2 block font-bold text-slate-700"
                  >
                    الدرس
                  </label>

                  <input
                    id={`lesson-${index}`}
                    value={item.lesson}
                    onChange={(event) =>
                      updateDay(index, "lesson", event.target.value)
                    }
                    placeholder="اكتب اسم الدرس"
                    className="w-full rounded-2xl border border-slate-300 bg-white p-4 font-bold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`objective-${index}`}
                    className="mb-2 block font-bold text-slate-700"
                  >
                    الهدف
                  </label>

                  <input
                    id={`objective-${index}`}
                    value={item.objective}
                    onChange={(event) =>
                      updateDay(index, "objective", event.target.value)
                    }
                    placeholder="اكتب هدف الدرس"
                    className="w-full rounded-2xl border border-slate-300 bg-white p-4 font-bold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`homework-${index}`}
                    className="mb-2 block font-bold text-slate-700"
                  >
                    الواجب
                  </label>

                  <input
                    id={`homework-${index}`}
                    value={item.homework}
                    onChange={(event) =>
                      updateDay(index, "homework", event.target.value)
                    }
                    placeholder="اكتب واجب اليوم"
                    className="w-full rounded-2xl border border-slate-300 bg-white p-4 font-bold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            </section>
          ))}
        </div>

        <label className="mt-6 flex cursor-pointer items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <span className="text-lg font-black text-slate-800">
            نشر الخطة للطلاب مباشرة
          </span>

          <input
            type="checkbox"
            checked={published}
            onChange={(event) => {
              setPublished(event.target.checked);
              setStatusMessage("");
            }}
            className="h-7 w-7 accent-emerald-600"
          />
        </label>

        <button
          type="button"
          onClick={handleSavePlan}
          disabled={isSaving}
          className="mt-6 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-xl font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "⏳ جارٍ حفظ الخطة..." : "💾 حفظ الخطة"}
        </button>

        {statusMessage && (
          <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-center font-bold text-amber-800">
            {statusMessage}
          </p>
        )}
      </div>
    </main>
  );
}