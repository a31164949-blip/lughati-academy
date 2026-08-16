"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

type SchoolPeriod = {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
};

type DaySchedule = {
  day: string;
  periods: Record<number, string>;
};

type SchoolSchedule = {
  classroomKey: string;
  classroom: string;
  scheduleTitle: string;
  periods: SchoolPeriod[];
  days: DaySchedule[];
  published: boolean;
};

const schoolDays = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
];

function normalizeClassroomToKey(
  classroom: string
): "second-a" | "second-b" {
  const normalized = classroom
    .replace(/\s+/g, " ")
    .trim();

  if (
    normalized.includes("الثاني ب") ||
    normalized.includes("الثاني/ب") ||
    normalized.includes("2 ب")
  ) {
    return "second-b";
  }

  return "second-a";
}

export default function StudentSchoolSchedulePage() {
  const [schedule, setSchedule] =
    useState<SchoolSchedule | null>(null);

  const [studentName, setStudentName] =
    useState("");

  const [studentClassroom, setStudentClassroom] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    async function loadSchedule() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        let loadedStudentName = "";
        let loadedClassroom = "";

        const savedStudent =
          localStorage.getItem("lughatiStudent");

        if (savedStudent) {
          try {
            const parsed =
              JSON.parse(savedStudent);

            loadedStudentName =
              typeof parsed.studentName ===
              "string"
                ? parsed.studentName
                : typeof parsed.name ===
                    "string"
                  ? parsed.name
                  : "";

            loadedClassroom =
              typeof parsed.classroom ===
              "string"
                ? parsed.classroom
                : typeof parsed.className ===
                    "string"
                  ? parsed.className
                  : "";
          } catch (error) {
            console.error(
              "تعذر قراءة بيانات الطالب:",
              error
            );
          }
        }

        setStudentName(
          loadedStudentName
        );

        setStudentClassroom(
          loadedClassroom
        );

        const classroomKey =
          normalizeClassroomToKey(
            loadedClassroom
          );

        const scheduleReference =
          doc(
            db,
            "schoolSchedules",
            classroomKey
          );

        const snapshot =
          await getDoc(
            scheduleReference
          );

        if (!snapshot.exists()) {
          setErrorMessage(
            "لم يتم نشر جدول هذا الفصل حتى الآن."
          );
          return;
        }

        const data =
          snapshot.data();

        if (
          data.published !== true
        ) {
          setErrorMessage(
            "الجدول المدرسي غير متاح حاليًا."
          );
          return;
        }

        setSchedule({
          classroomKey:
            typeof data.classroomKey ===
            "string"
              ? data.classroomKey
              : classroomKey,

          classroom:
            typeof data.classroom ===
            "string"
              ? data.classroom
              : loadedClassroom ||
                "الثاني أ",

          scheduleTitle:
            typeof data.scheduleTitle ===
            "string"
              ? data.scheduleTitle
              : "الجدول المدرسي",

          periods:
            Array.isArray(
              data.periods
            )
              ? data.periods
              : [],

          days:
            Array.isArray(
              data.days
            )
              ? data.days
              : [],

          published: true,
        });
      } catch (error) {
        console.error(
          "تعذر تحميل الجدول المدرسي:",
          error
        );

        setErrorMessage(
          "تعذر تحميل الجدول المدرسي. حاول مرة أخرى."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadSchedule();
  }, []);

  const todayName = useMemo(() => {
    const dayNames = [
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];

    return dayNames[
      new Date().getDay()
    ];
  }, []);

  if (isLoading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-6"
      >
        <div className="rounded-3xl bg-white px-8 py-6 text-xl font-black text-emerald-700 shadow-sm">
          جارٍ تحميل جدولك المدرسي...
        </div>
      </main>
    );
  }

  if (!schedule) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-6"
      >
        <div className="max-w-xl rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl">
            📅
          </div>

          <h1 className="text-2xl font-black text-slate-800">
            جدولي المدرسي
          </h1>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            {errorMessage}
          </p>
<a
  href="/"
  className="mt-6 inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white no-underline shadow-lg transition hover:bg-emerald-800 active:scale-95"
>
  ← العودة إلى الصفحة الرئيسية
</a>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-7xl">

        <header className="mb-6 rounded-3xl bg-gradient-to-l from-emerald-700 to-emerald-500 p-7 text-white shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-bold text-emerald-50">
                أكاديمية لغتي الرقمية
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                📅 جدولي المدرسي
              </h1>

              <p className="mt-3 text-xl font-black text-emerald-50">
                {schedule.classroom}
              </p>

              <p className="mt-2 text-emerald-50">
                {studentName
                  ? `أهلًا ${studentName} 🌟`
                  : "أهلًا يا بطل 🌟"}
              </p>
            </div>

            <a
              href="/journey"
              className="rounded-2xl bg-white px-5 py-3 font-black text-emerald-700 no-underline"
            >
              ← العودة إلى رحلتي
            </a>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-black text-emerald-800">
              الفصل
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-700">
              {schedule.classroom}
            </p>
          </article>

          <article className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
            <p className="font-black text-sky-800">
              اليوم
            </p>

            <p className="mt-2 text-3xl font-black text-sky-700">
              {todayName}
            </p>
          </article>

          <article className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
            <p className="font-black text-violet-800">
              عنوان الجدول
            </p>

            <p className="mt-2 text-xl font-black text-violet-700">
              {schedule.scheduleTitle}
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-2xl font-black text-slate-800">
              📚 حصص الأسبوع
            </h2>

            <p className="mt-2 text-slate-500">
              شاهد جميع حصصك من الأحد
              إلى الخميس.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-center">
              <thead>
                <tr className="bg-emerald-50">
                  <th className="border border-slate-200 p-3 font-black text-emerald-800">
                    الحصة
                  </th>

                  {schoolDays.map(
                    (day) => (
                      <th
                        key={day}
                        className={`border border-slate-200 p-3 font-black ${
                          day ===
                          todayName
                            ? "bg-emerald-200 text-emerald-900"
                            : "text-emerald-800"
                        }`}
                      >
                        {day}

                        {day ===
                          todayName && (
                          <span className="mr-2 rounded-full bg-emerald-600 px-2 py-1 text-xs text-white">
                            اليوم
                          </span>
                        )}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {schedule.periods.map(
                  (period) => (
                    <tr
                      key={
                        period.id
                      }
                    >
                      <td className="border border-slate-200 bg-slate-50 p-3">
                        <p className="font-black text-slate-800">
                          {
                            period.title
                          }
                        </p>

                        <p
                          dir="ltr"
                          className="mt-1 whitespace-nowrap text-xs font-bold text-slate-500"
                        >
                          {
                            period.startTime
                          }{" "}
                          -{" "}
                          {
                            period.endTime
                          }
                        </p>
                      </td>

                      {schoolDays.map(
                        (dayName) => {
                          const day =
                            schedule.days.find(
                              (
                                item
                              ) =>
                                item.day ===
                                dayName
                            );

                          const subject =
                            day?.periods?.[
                              period.id
                            ] ??
                            day?.periods?.[
                              String(
                                period.id
                              ) as unknown as number
                            ] ??
                            "";

                          const isToday =
                            dayName ===
                            todayName;

                          return (
                            <td
                              key={`${dayName}-${period.id}`}
                              className={`border border-slate-200 p-3 ${
                                isToday
                                  ? "bg-emerald-50"
                                  : "bg-white"
                              }`}
                            >
                              <div
                                className={`rounded-2xl px-3 py-4 font-black ${
                                  subject
                                    ? isToday
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-slate-50 text-slate-800"
                                    : "bg-slate-50 text-slate-400"
                                }`}
                              >
                                {subject ||
                                  "—"}
                              </div>
                            </td>
                          );
                        }
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <a
            href="/school-day"
            className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 no-underline"
          >
            <p className="text-xl font-black text-emerald-800">
              ⏰ انتقل إلى يومي الدراسي
            </p>

            <p className="mt-2 leading-8 text-emerald-700">
              شاهد الحصة الحالية
              والقادمة وبقية حصص اليوم.
            </p>
          </a>

          <a
            href="/weekly-plan"
            className="rounded-3xl border border-sky-200 bg-sky-50 p-5 no-underline"
          >
            <p className="text-xl font-black text-sky-800">
              🗓️ الخطة الأسبوعية
            </p>

            <p className="mt-2 leading-8 text-sky-700">
              تعرف على أهداف الأسبوع
              وواجباته ومهامه.
            </p>
          </a>
        </section>

        <footer className="mt-6 rounded-3xl bg-white p-5 text-center shadow-sm">
          <p className="font-black text-emerald-700">
            نتعلّم… نقرأ… نبدع
          </p>

          <p className="mt-2 text-sm text-slate-500">
            جدول واضح يساعدك على
            الاستعداد لكل يوم 🌟
          </p>
        </footer>
      </div>
    </main>
  );
}