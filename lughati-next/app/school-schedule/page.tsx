"use client";

import Link from "next/link";
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

function getSubject(
  day: DaySchedule | undefined,
  periodId: number
) {
  return (
    day?.periods?.[periodId] ??
    day?.periods?.[
      String(periodId) as unknown as number
    ] ??
    ""
  );
}

export default function StudentSchoolSchedulePage() {
  const [schedule, setSchedule] =
    useState<SchoolSchedule | null>(null);

  const [studentName, setStudentName] =
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
              typeof parsed.studentName === "string"
                ? parsed.studentName
                : typeof parsed.name === "string"
                  ? parsed.name
                  : "";

            loadedClassroom =
              typeof parsed.classroom === "string"
                ? parsed.classroom
                : typeof parsed.className === "string"
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
            typeof data.classroomKey === "string"
              ? data.classroomKey
              : classroomKey,

          classroom:
            typeof data.classroom === "string"
              ? data.classroom
              : loadedClassroom ||
                "الثاني أ",

          scheduleTitle:
            typeof data.scheduleTitle === "string"
              ? data.scheduleTitle
              : "الجدول المدرسي",

          periods:
            Array.isArray(data.periods)
              ? data.periods
              : [],

          days:
            Array.isArray(data.days)
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

  const todaySchedule = useMemo(() => {
    if (!schedule) {
      return undefined;
    }

    return schedule.days.find(
      (item) =>
        item.day === todayName
    );
  }, [schedule, todayName]);

  const isWeekend =
    todayName === "الجمعة" ||
    todayName === "السبت";

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
<Link
  href="/journey"
  className="schoolScheduleBackButton"
>
  <span>↩️</span>
  <span>العودة إلى رحلتي</span>
</Link>
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

        {/* رأس الصفحة */}
     <div className="mb-4 flex justify-start">
  <Link
    href="/journey"
    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 font-black no-underline shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
  >
    <span>↩️</span>
    <span>العودة إلى رحلتي</span>
  </Link>
</div>

<header className="mb-6 rounded-3xl bg-gradient-to-l from-emerald-700 to-emerald-500 p-7 text-white shadow-lg">
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
</header>

        {/* معلومات سريعة */}
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

        {/* حصصي اليوم */}
        <section className="mb-6 overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
          <div className="bg-gradient-to-l from-emerald-50 to-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-emerald-800 sm:text-3xl">
                  ☀️ حصصي اليوم
                </h2>

                <p className="mt-2 text-slate-600">
                  جدول يوم {todayName} أمامك
                  بشكل سريع وواضح.
                </p>
              </div>

              {!isWeekend && (
                <span className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white">
                  📚 يوم دراسي
                </span>
              )}
            </div>
          </div>

          {isWeekend ? (
            <div className="p-7 text-center">
              <div className="text-6xl">
                🌤️
              </div>

              <h3 className="mt-4 text-2xl font-black text-slate-800">
                عطلة سعيدة يا بطل
              </h3>

              <p className="mt-2 text-lg leading-8 text-slate-600">
                استمتع بوقتك، واستعد لأسبوع
                جديد مليء بالتعلّم والإنجاز 🌟
              </p>
            </div>
          ) : todaySchedule ? (
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {schedule.periods.map(
                (period) => {
                  const subject =
                    getSubject(
                      todaySchedule,
                      period.id
                    );

                  if (!subject) {
                    return null;
                  }

                  const isLughati =
                    subject.trim() ===
                    "لغتي";

                  return (
                    <article
                      key={period.id}
                      className={`relative overflow-hidden rounded-3xl border p-5 transition hover:-translate-y-1 hover:shadow-md ${
                        isLughati
                          ? "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-100"
                          : "border-emerald-100 bg-emerald-50"
                      }`}
                    >
                      {isLughati && (
                        <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-white">
                          ⭐ لغتي
                        </span>
                      )}

                      <p
                        className={`text-sm font-black ${
                          isLughati
                            ? "text-amber-700"
                            : "text-emerald-700"
                        }`}
                      >
                        {period.title}
                      </p>

                      <h3
                        className={`mt-3 text-2xl font-black ${
                          isLughati
                            ? "text-amber-900"
                            : "text-slate-800"
                        }`}
                      >
                        {isLughati
                          ? "📖 لغتي"
                          : subject}
                      </h3>

                      <p
                        dir="ltr"
                        className="mt-3 inline-flex rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-500 shadow-sm"
                      >
                        {period.startTime}
                        {" - "}
                        {period.endTime}
                      </p>
                    </article>
                  );
                }
              )}
            </div>
          ) : (
            <div className="p-7 text-center">
              <p className="text-lg font-black text-slate-600">
                لا توجد حصص مسجلة لهذا اليوم.
              </p>
            </div>
          )}
        </section>

        {/* الجدول الأسبوعي */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-2xl font-black text-slate-800">
              📚 حصص الأسبوع
            </h2>

            <p className="mt-2 text-slate-500">
              شاهد جميع حصصك من الأحد إلى الخميس.
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
                          day === todayName
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
                    <tr key={period.id}>
                      <td className="border border-slate-200 bg-slate-50 p-3">
                        <p className="font-black text-slate-800">
                          {period.title}
                        </p>

                        <p
                          dir="ltr"
                          className="mt-1 whitespace-nowrap text-xs font-bold text-slate-500"
                        >
                          {period.startTime}
                          {" - "}
                          {period.endTime}
                        </p>
                      </td>

                      {schoolDays.map(
                        (dayName) => {
                          const day =
                            schedule.days.find(
                              (item) =>
                                item.day ===
                                dayName
                            );

                          const subject =
                            getSubject(
                              day,
                              period.id
                            );

                          const isToday =
                            dayName ===
                            todayName;

                          const isLughati =
                            subject.trim() ===
                            "لغتي";

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
                                  !subject
                                    ? "bg-slate-50 text-slate-400"
                                    : isLughati
                                      ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300"
                                      : isToday
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-slate-50 text-slate-800"
                                }`}
                              >
                                {isLughati
                                  ? `📖 ${subject}`
                                  : subject ||
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

        {/* روابط سريعة */}
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <Link
            href="/school-day"
            className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 no-underline transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-xl font-black text-emerald-800">
              ⏰ انتقل إلى يومي الدراسي
            </p>

            <p className="mt-2 leading-8 text-emerald-700">
              شاهد الحصة الحالية والقادمة
              وبقية حصص اليوم.
            </p>
          </Link>

          <Link
            href="/weekly-plan"
            className="rounded-3xl border border-sky-200 bg-sky-50 p-5 no-underline transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-xl font-black text-sky-800">
              🗓️ الخطة الأسبوعية
            </p>

            <p className="mt-2 leading-8 text-sky-700">
              تعرف على أهداف الأسبوع
              وواجباته ومهامه.
            </p>
          </Link>
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