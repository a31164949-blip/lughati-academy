"use client";

import { useEffect, useMemo, useState } from "react";
import {
  doc,
  getDoc,
} from "firebase/firestore";
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
  periods: SchoolPeriod[];
  days: DaySchedule[];
  published: boolean;
};

type ActivePeriodState = {
  current: SchoolPeriod | null;
  next: SchoolPeriod | null;
  status:
    | "before-school"
    | "during-period"
    | "between-periods"
    | "after-school"
    | "no-school-day";
};

const dayNames = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

function timeToMinutes(time: string) {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function getClassroomKey(classroom: string) {
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

export default function SchoolDayPage() {
  const [schedule, setSchedule] =
    useState<SchoolSchedule | null>(null);

  const [studentName, setStudentName] =
    useState("");

  const [
    studentClassroom,
    setStudentClassroom,
  ] = useState("");

  const [currentTime, setCurrentTime] =
    useState(new Date());

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    const savedStudent =
      localStorage.getItem(
        "lughatiStudent"
      );

    let loadedStudentName = "";
    let loadedClassroom = "";

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

   

    async function loadSchedule() {
      try {
        const classroomKey =
          getClassroomKey(
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
        setStudentName(
  loadedStudentName
);

setStudentClassroom(
  loadedClassroom
);
        if (
          !snapshot.exists()
        ) {
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
            "الجدول الدراسي غير متاح حاليًا."
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
          "تعذر تحميل اليوم الدراسي:",
          error
        );

        setErrorMessage(
          "تعذر تحميل اليوم الدراسي. حاول مرة أخرى."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadSchedule();
  }, []);

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        setCurrentTime(
          new Date()
        );
      }, 30000);

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, []);

  const todayName =
    dayNames[
      currentTime.getDay()
    ];

  const todaySchedule =
    useMemo(() => {
      if (!schedule) {
        return null;
      }

      return (
        schedule.days.find(
          (day) =>
            day.day ===
            todayName
        ) ?? null
      );
    }, [
      schedule,
      todayName,
    ]);

const activePeriod: ActivePeriodState = (() => {
  if (!schedule) {
    return {
      current: null,
      next: null,
      status: "no-school-day",
    };
  }

  if (
    todayName === "الجمعة" ||
    todayName === "السبت"
  ) {
    return {
      current: null,
      next: null,
      status: "no-school-day",
    };
  }

  const periods = schedule.periods;

  if (periods.length === 0) {
    return {
      current: null,
      next: null,
      status: "no-school-day",
    };
  }

  const nowMinutes =
    currentTime.getHours() * 60 +
    currentTime.getMinutes();

  const firstPeriod = periods[0];

  const lastPeriod =
    periods[periods.length - 1];

  if (
    nowMinutes <
    timeToMinutes(firstPeriod.startTime)
  ) {
    return {
      current: null,
      next: firstPeriod,
      status: "before-school",
    };
  }

  for (
    let index = 0;
    index < periods.length;
    index++
  ) {
    const period = periods[index];

    const start =
      timeToMinutes(period.startTime);

    const end =
      timeToMinutes(period.endTime);

    if (
      nowMinutes >= start &&
      nowMinutes < end
    ) {
      return {
        current: period,
        next:
          index + 1 < periods.length
            ? periods[index + 1]
            : null,
        status: "during-period",
      };
    }

    if (
      index + 1 < periods.length
    ) {
      const nextPeriod =
        periods[index + 1];

      const nextStart =
        timeToMinutes(
          nextPeriod.startTime
        );

      if (
        nowMinutes >= end &&
        nowMinutes < nextStart
      ) {
        return {
          current: null,
          next: nextPeriod,
          status: "between-periods",
        };
      }
    }
  }

  if (
    nowMinutes >=
    timeToMinutes(lastPeriod.endTime)
  ) {
    return {
      current: null,
      next: null,
      status: "after-school",
    };
  }

  return {
    current: null,
    next: null,
    status: "no-school-day",
  };
})();

  function getSubject(
    periodId: number
  ) {
    if (!todaySchedule) {
      return "";
    }

    return (
      todaySchedule.periods?.[
        periodId
      ] ??
      todaySchedule.periods?.[
        String(
          periodId
        ) as unknown as number
      ] ??
      ""
    );
  }

  function getMinutesRemaining(
    period: SchoolPeriod
  ) {
    const endMinutes =
      timeToMinutes(
        period.endTime
      );

    const nowMinutes =
      currentTime.getHours() *
        60 +
      currentTime.getMinutes();

    return Math.max(
      0,
      endMinutes -
        nowMinutes
    );
  }

  if (isLoading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-6"
      >
        <div className="rounded-3xl bg-white px-8 py-6 text-xl font-black text-emerald-700 shadow-sm">
          جارٍ تجهيز يومك
          الدراسي...
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
            🗓️
          </div>

          <h1 className="text-2xl font-black text-slate-800">
            اليوم الدراسي
          </h1>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            {errorMessage}
          </p>

          <a
            href="/journey"
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              gap: "8px",
              marginTop:
                "22px",
              padding:
                "11px 17px",
              borderRadius:
                "14px",
              background:
                "#ffffff",
              color:
                "#047857",
              border:
                "1px solid #a7f3d0",
              fontWeight:
                900,
              fontSize:
                "15px",
              textDecoration:
                "none",
              boxShadow:
                "0 5px 14px rgba(4,120,87,0.10)",
            }}
          >
            ← العودة إلى رحلتي
          </a>
        </div>
      </main>
    );
  }

  const currentSubject =
    activePeriod.current
      ? getSubject(
          activePeriod.current.id
        )
      : "";

  const nextSubject =
    activePeriod.next
      ? getSubject(
          activePeriod.next.id
        )
      : "";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 p-4 sm:p-6"
    >
      {/* زر العودة */}

      <div
        style={{
          maxWidth: "1180px",
          margin:
            "0 auto 14px",
          display: "flex",
          justifyContent:
            "flex-start",
        }}
      >
        <a
          href="/journey"
          style={{
            display:
              "inline-flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            gap: "8px",
            padding:
              "11px 17px",
            borderRadius:
              "14px",
            background:
              "#ffffff",
            color:
              "#047857",
            border:
              "1px solid #a7f3d0",
            fontWeight:
              900,
            fontSize:
              "15px",
            textDecoration:
              "none",
            boxShadow:
              "0 5px 14px rgba(4,120,87,0.10)",
          }}
        >
          ← العودة إلى رحلتي
        </a>
      </div>

      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-3xl bg-gradient-to-l from-emerald-700 to-emerald-500 p-7 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-bold text-emerald-50">
                أكاديمية لغتي
                الرقمية
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                ⏰ يومي الدراسي
              </h1>

              <p className="mt-3 text-lg font-bold text-emerald-50">
                {studentName
                  ? `أهلًا ${studentName} 🌟`
                  : "أهلًا يا بطل 🌟"}
              </p>

              <p className="mt-2 text-emerald-50">
                {
                  schedule.classroom
                }{" "}
                — {todayName}
              </p>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="font-black text-slate-500">
              الوقت الآن
            </p>

            <p
              dir="ltr"
              className="mt-2 text-3xl font-black text-slate-800"
            >
              {currentTime.toLocaleTimeString(
                "ar-SA",
                {
                  hour:
                    "2-digit",
                  minute:
                    "2-digit",
                }
              )}
            </p>
          </article>

          <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-black text-emerald-800">
              الحصة الحالية
            </p>

            {activePeriod.current ? (
              <>
                <p className="mt-2 text-2xl font-black text-emerald-700">
                  {
                    activePeriod
                      .current
                      .title
                  }
                </p>

                <p className="mt-2 text-lg font-bold text-slate-800">
                  {currentSubject ||
                    "لم تُحدد المادة"}
                </p>

                <p className="mt-2 text-sm font-bold text-emerald-700">
                  تبقى{" "}
                  {getMinutesRemaining(
                    activePeriod.current
                  )}{" "}
                  دقيقة
                </p>
              </>
            ) : (
              <p className="mt-3 font-bold text-slate-600">
                لا توجد حصة
                جارية الآن
              </p>
            )}
          </article>

          <article className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
            <p className="font-black text-sky-800">
              الحصة القادمة
            </p>

            {activePeriod.next ? (
              <>
                <p className="mt-2 text-2xl font-black text-sky-700">
                  {
                    activePeriod
                      .next.title
                  }
                </p>

                <p className="mt-2 text-lg font-bold text-slate-800">
                  {nextSubject ||
                    "لم تُحدد المادة"}
                </p>

                <p
                  dir="ltr"
                  className="mt-2 text-sm font-bold text-sky-700"
                >
                  {
                    activePeriod
                      .next
                      .startTime
                  }
                </p>
              </>
            ) : (
              <p className="mt-3 font-bold text-slate-600">
                لا توجد حصة
                قادمة
              </p>
            )}
          </article>
        </section>

        <section className="mb-6 rounded-3xl border border-violet-200 bg-violet-50 p-5">
          <h2 className="text-xl font-black text-violet-800">
            💡 حالة اليوم
          </h2>

          <p className="mt-3 text-lg font-bold leading-8 text-violet-900">
            {activePeriod.status ===
              "before-school" &&
              "🌅 لم يبدأ اليوم الدراسي بعد. استعد ليوم جميل!"}

            {activePeriod.status ===
              "during-period" &&
              "📚 أنت الآن في وقت الحصة. ركّز واستمتع بالتعلّم."}

            {activePeriod.status ===
              "between-periods" &&
              "⏳ أنت بين حصتين. استعد للحصة القادمة."}

            {activePeriod.status ===
              "after-school" &&
              "🎉 انتهى يومك الدراسي. أحسنت يا بطل!"}

            {activePeriod.status ===
              "no-school-day" &&
              "🌿 لا توجد حصص دراسية اليوم."}
          </p>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-2xl font-black text-slate-800">
              📚 حصص اليوم
            </h2>

            <p className="mt-2 text-slate-500">
              جدولك لليوم مرتّب
              من أول حصة حتى
              نهاية اليوم.
            </p>
          </div>

          <div className="grid gap-3 p-5">
            {schedule.periods.map(
              (period) => {
                const subject =
                  getSubject(
                    period.id
                  );

                const isCurrent =
                  activePeriod.current
                    ?.id ===
                  period.id;

                const isNext =
                  activePeriod.next
                    ?.id ===
                  period.id;

                return (
                  <article
                    key={
                      period.id
                    }
                    className={`rounded-2xl border p-4 ${
                      isCurrent
                        ? "border-emerald-400 bg-emerald-50"
                        : isNext
                          ? "border-sky-300 bg-sky-50"
                          : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-black text-slate-800">
                            {
                              period.title
                            }
                          </p>

                          {isCurrent && (
                            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">
                              الآن
                            </span>
                          )}

                          {isNext && (
                            <span className="rounded-full bg-sky-600 px-3 py-1 text-xs font-black text-white">
                              التالية
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-lg font-bold text-slate-700">
                          {subject ||
                            "لم تُحدد المادة"}
                        </p>
                      </div>

                      <p
                        dir="ltr"
                        className="whitespace-nowrap font-black text-slate-500"
                      >
                        {
                          period.startTime
                        }{" "}
                        -{" "}
                        {
                          period.endTime
                        }
                      </p>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </section>

        <footer className="mt-6 rounded-3xl bg-white p-5 text-center shadow-sm">
          <p className="font-black text-emerald-700">
            نتعلّم… نقرأ… نبدع
          </p>

          <p className="mt-2 text-sm text-slate-500">
            يوم دراسي منظم يصنع
            إنجازًا أجمل 🌟
          </p>
        </footer>
      </div>
    </main>
  );
}