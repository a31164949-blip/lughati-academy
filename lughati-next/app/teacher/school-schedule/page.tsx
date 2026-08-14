"use client";

import { useEffect, useMemo, useState } from "react";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";

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

type ClassroomKey = "second-a" | "second-b";

const classroomOptions: {
  key: ClassroomKey;
  label: string;
}[] = [
  {
    key: "second-a",
    label: "الثاني أ",
  },
  {
    key: "second-b",
    label: "الثاني ب",
  },
];

const defaultPeriods: SchoolPeriod[] = [
  {
    id: 1,
    title: "الحصة الأولى",
    startTime: "07:00",
    endTime: "07:45",
  },
  {
    id: 2,
    title: "الحصة الثانية",
    startTime: "07:45",
    endTime: "08:30",
  },
  {
    id: 3,
    title: "الحصة الثالثة",
    startTime: "08:30",
    endTime: "09:15",
  },
  {
    id: 4,
    title: "الحصة الرابعة",
    startTime: "09:35",
    endTime: "10:20",
  },
  {
    id: 5,
    title: "الحصة الخامسة",
    startTime: "10:20",
    endTime: "11:05",
  },
  {
    id: 6,
    title: "الحصة السادسة",
    startTime: "11:05",
    endTime: "11:50",
  },
  {
    id: 7,
    title: "الحصة السابعة",
    startTime: "11:50",
    endTime: "12:35",
  },
];

const schoolDays = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
];

function createEmptySchedule(
  periods: SchoolPeriod[] = defaultPeriods
): DaySchedule[] {
  return schoolDays.map((day) => ({
    day,
    periods: periods.reduce<Record<number, string>>(
      (result, period) => {
        result[period.id] = "";
        return result;
      },
      {}
    ),
  }));
}

function normalizeSavedDays(
  savedDays: unknown,
  periods: SchoolPeriod[]
): DaySchedule[] {
  if (!Array.isArray(savedDays)) {
    return createEmptySchedule(periods);
  }

  return schoolDays.map((dayName) => {
    const savedDay = savedDays.find(
      (item) =>
        item &&
        typeof item === "object" &&
        "day" in item &&
        item.day === dayName
    ) as
      | {
          day?: unknown;
          periods?: unknown;
        }
      | undefined;

    const savedPeriods =
      savedDay &&
      savedDay.periods &&
      typeof savedDay.periods === "object"
        ? (savedDay.periods as Record<
            string | number,
            unknown
          >)
        : {};

    const normalizedPeriods =
      periods.reduce<Record<number, string>>(
        (result, period) => {
          const rawValue =
            savedPeriods[period.id] ??
            savedPeriods[String(period.id)];

          result[period.id] =
            typeof rawValue === "string"
              ? rawValue
              : "";

          return result;
        },
        {}
      );

    return {
      day: dayName,
      periods: normalizedPeriods,
    };
  });
}

export default function TeacherSchoolSchedulePage() {
  const [selectedClassroom, setSelectedClassroom] =
    useState<ClassroomKey>("second-a");

  const [scheduleTitle, setScheduleTitle] =
    useState("الجدول المدرسي");

  const [periods, setPeriods] =
    useState<SchoolPeriod[]>(defaultPeriods);

  const [days, setDays] =
    useState<DaySchedule[]>(
      createEmptySchedule(defaultPeriods)
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [statusMessage, setStatusMessage] =
    useState("");

  const currentClassroom =
    classroomOptions.find(
      (item) => item.key === selectedClassroom
    ) ?? classroomOptions[0];

  useEffect(() => {
    async function loadSchedule() {
      try {
        setIsLoading(true);
        setStatusMessage("");

        const scheduleReference = doc(
          db,
          "schoolSchedules",
          selectedClassroom
        );

        const snapshot =
          await getDoc(scheduleReference);

        if (!snapshot.exists()) {
          setScheduleTitle(
            `الجدول المدرسي - ${currentClassroom.label}`
          );

          setPeriods(defaultPeriods);

          setDays(
            createEmptySchedule(defaultPeriods)
          );

          return;
        }

        const data = snapshot.data();

        const loadedPeriods: SchoolPeriod[] =
          Array.isArray(data.periods)
            ? data.periods.map(
                (
                  item: Partial<SchoolPeriod>,
                  index: number
                ) => ({
                  id:
                    typeof item.id === "number"
                      ? item.id
                      : index + 1,

                  title:
                    typeof item.title === "string"
                      ? item.title
                      : `الحصة ${index + 1}`,

                  startTime:
                    typeof item.startTime ===
                    "string"
                      ? item.startTime
                      : "",

                  endTime:
                    typeof item.endTime === "string"
                      ? item.endTime
                      : "",
                })
              )
            : defaultPeriods;

        setScheduleTitle(
          typeof data.scheduleTitle === "string"
            ? data.scheduleTitle
            : `الجدول المدرسي - ${currentClassroom.label}`
        );

        setPeriods(loadedPeriods);

        setDays(
          normalizeSavedDays(
            data.days,
            loadedPeriods
          )
        );
      } catch (error) {
        console.error(
          "تعذر تحميل الجدول المدرسي:",
          error
        );

        setPeriods(defaultPeriods);

        setDays(
          createEmptySchedule(defaultPeriods)
        );

        setStatusMessage(
          "تعذر تحميل جدول هذا الفصل. تحقق من الاتصال أو الصلاحيات."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadSchedule();
  }, [selectedClassroom, currentClassroom.label]);

  const filledCells = useMemo(() => {
    return days.reduce((total, day) => {
      return (
        total +
        periods.filter((period) => {
          const value =
            day.periods[period.id];

          return (
            typeof value === "string" &&
            value.trim().length > 0
          );
        }).length
      );
    }, 0);
  }, [days, periods]);

  const totalCells =
    periods.length * schoolDays.length;

  const completionPercentage =
    totalCells > 0
      ? Math.round(
          (filledCells / totalCells) * 100
        )
      : 0;

  function updatePeriodTime(
    periodId: number,
    field: "startTime" | "endTime",
    value: string
  ) {
    setPeriods((currentPeriods) =>
      currentPeriods.map((period) =>
        period.id === periodId
          ? {
              ...period,
              [field]: value,
            }
          : period
      )
    );

    setStatusMessage("");
  }

  function updatePeriodTitle(
    periodId: number,
    value: string
  ) {
    setPeriods((currentPeriods) =>
      currentPeriods.map((period) =>
        period.id === periodId
          ? {
              ...period,
              title: value,
            }
          : period
      )
    );

    setStatusMessage("");
  }

  function updateSubject(
    dayName: string,
    periodId: number,
    value: string
  ) {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.day === dayName
          ? {
              ...day,
              periods: {
                ...day.periods,
                [periodId]: value,
              },
            }
          : day
      )
    );

    setStatusMessage("");
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      setStatusMessage("");

      const scheduleReference = doc(
        db,
        "schoolSchedules",
        selectedClassroom
      );

      await setDoc(
        scheduleReference,
        {
          scheduleTitle:
            scheduleTitle.trim() ||
            `الجدول المدرسي - ${currentClassroom.label}`,

          classroomKey:
            selectedClassroom,

          classroom:
            currentClassroom.label,

          periods,

          days,

          published: true,

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      setStatusMessage(
        `تم حفظ جدول ${currentClassroom.label} بنجاح ✅`
      );
    } catch (error) {
      console.error(
        "تعذر حفظ الجدول المدرسي:",
        error
      );

      setStatusMessage(
        "تعذر حفظ الجدول. تحقق من الاتصال وصلاحيات Firebase."
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
        <div className="rounded-3xl bg-white px-8 py-6 text-xl font-black text-emerald-700 shadow-sm">
          جارٍ تحميل جدول{" "}
          {currentClassroom.label}...
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
          <p className="mb-2 font-bold text-emerald-50">
            لوحة المعلم
          </p>

          <h1 className="text-3xl font-black sm:text-4xl">
            🗓️ إدارة الجدول المدرسي الذكي
          </h1>

          <p className="mt-3 max-w-3xl leading-8 text-emerald-50">
            أدخل جدول كل فصل مرة واحدة،
            وسيكون أساسًا لواجهة الطالب
            واليوم الدراسي والسجل الذكي.
          </p>
        </header>

        <section className="mb-6 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="font-black text-slate-800">
              اختر الفصل
            </p>

            <p className="mt-1 text-sm text-slate-500">
              لكل فصل جدول مستقل ولن يؤثر
              حفظ أحدهما على الآخر.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {classroomOptions.map(
              (classroomOption) => {
                const active =
                  classroomOption.key ===
                  selectedClassroom;

                return (
                  <button
                    key={classroomOption.key}
                    type="button"
                    onClick={() => {
                      setSelectedClassroom(
                        classroomOption.key
                      );

                      setStatusMessage("");
                    }}
                    className={`rounded-2xl border-2 px-5 py-4 text-lg font-black transition ${
                      active
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300"
                    }`}
                  >
                    {active
                      ? "✅ "
                      : ""}
                    {classroomOption.label}
                  </button>
                );
              }
            )}
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-2 block font-black text-slate-700">
              عنوان الجدول
            </label>

            <input
              value={scheduleTitle}
              onChange={(event) => {
                setScheduleTitle(
                  event.target.value
                );

                setStatusMessage("");
              }}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold"
              placeholder="مثال: جدول الصف الثاني"
            />
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-black text-emerald-800">
              الفصل الحالي
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-700">
              {currentClassroom.label}
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              يُحفظ في سجل مستقل
            </p>
          </div>

          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
            <p className="font-black text-sky-800">
              اكتمال الجدول
            </p>

            <div className="mt-3 flex items-end gap-2">
              <p className="text-3xl font-black text-sky-700">
                {completionPercentage}%
              </p>

              <p className="pb-1 text-sm font-bold text-sky-700">
                {filledCells} من{" "}
                {totalCells} حصة
              </p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{
                  width: `${completionPercentage}%`,
                }}
              />
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-black text-slate-800">
              ⏰ أوقات الحصص
            </h2>

            <p className="mt-2 text-slate-500">
              ستُستخدم هذه الأوقات لاحقًا
              لتحديد الحصة الحالية والحصة
              القادمة تلقائيًا.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {periods.map((period) => (
              <article
                key={period.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <input
                  value={period.title}
                  onChange={(event) =>
                    updatePeriodTitle(
                      period.id,
                      event.target.value
                    )
                  }
                  className="mb-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-black text-slate-800"
                />

                <div
                  dir="ltr"
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <label className="mb-1 block text-left text-sm font-bold text-slate-600">
                      من
                    </label>

                    <input
                      type="time"
                      value={period.startTime}
                      onChange={(event) =>
                        updatePeriodTime(
                          period.id,
                          "startTime",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-left text-sm font-bold text-slate-600">
                      إلى
                    </label>

                    <input
                      type="time"
                      value={period.endTime}
                      onChange={(event) =>
                        updatePeriodTime(
                          period.id,
                          "endTime",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-2xl font-black text-slate-800">
              📚 حصص الأسبوع —{" "}
              {currentClassroom.label}
            </h2>

            <p className="mt-2 text-slate-500">
              اكتب اسم المادة أو النشاط في
              كل حصة.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-center">
              <thead>
                <tr className="bg-emerald-50">
                  <th className="border border-slate-200 p-3 font-black text-emerald-800">
                    الحصة
                  </th>

                  {schoolDays.map((day) => (
                    <th
                      key={day}
                      className="border border-slate-200 p-3 font-black text-emerald-800"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {periods.map((period) => (
                  <tr key={period.id}>
                    <td className="border border-slate-200 bg-slate-50 p-3">
                      <p className="font-black text-slate-800">
                        {period.title}
                      </p>

                      <p
                        dir="ltr"
                        className="mt-1 whitespace-nowrap text-xs text-slate-500"
                      >
                        {period.startTime ||
                          "--:--"}{" "}
                        -{" "}
                        {period.endTime ||
                          "--:--"}
                      </p>
                    </td>

                    {schoolDays.map(
                      (dayName) => {
                        const day =
                          days.find(
                            (item) =>
                              item.day ===
                              dayName
                          );

                        const value =
                          day?.periods?.[
                            period.id
                          ] ?? "";

                        return (
                          <td
                            key={`${dayName}-${period.id}`}
                            className="border border-slate-200 p-2"
                          >
                            <input
                              value={value}
                              onChange={(
                                event
                              ) =>
                                updateSubject(
                                  dayName,
                                  period.id,
                                  event.target
                                    .value
                                )
                              }
                              placeholder="المادة"
                              className="w-full min-w-32 rounded-xl border border-slate-200 px-3 py-3 text-center font-bold outline-none focus:border-emerald-500"
                            />
                          </td>
                        );
                      }
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="mt-6 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-xl font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? `⏳ جارٍ حفظ جدول ${currentClassroom.label}...`
            : `💾 حفظ جدول ${currentClassroom.label}`}
        </button>

        {statusMessage && (
          <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-center font-black text-amber-800">
            {statusMessage}
          </p>
        )}

        <section className="mt-6 rounded-3xl border border-violet-200 bg-violet-50 p-5">
          <h2 className="text-xl font-black text-violet-800">
            💡 الخطوة القادمة
          </h2>

          <p className="mt-2 leading-8 text-violet-800">
            بعد حفظ جدولي الفصلين سننشئ
            صفحة «اليوم الدراسي» التي تعرف
            تلقائيًا فصل الطالب، وتعرض له
            الحصة الحالية والقادمة وكم تبقى
            من الوقت.
          </p>
        </section>
      </div>
    </main>
  );
}