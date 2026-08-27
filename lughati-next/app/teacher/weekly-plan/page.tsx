"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../../firebase";

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

const initialDays: DayPlan[] = [
  {
    day: "الأحد",
    lesson: "",
    objective: "",
    homework: "",
    readingTask: "",
    spellingWords: "",
    bringTomorrow: "",
    teacherNote: "",
  },
  {
    day: "الاثنين",
    lesson: "",
    objective: "",
    homework: "",
    readingTask: "",
    spellingWords: "",
    bringTomorrow: "",
    teacherNote: "",
  },
  {
    day: "الثلاثاء",
    lesson: "",
    objective: "",
    homework: "",
    readingTask: "",
    spellingWords: "",
    bringTomorrow: "",
    teacherNote: "",
  },
  {
    day: "الأربعاء",
    lesson: "",
    objective: "",
    homework: "",
    readingTask: "",
    spellingWords: "",
    bringTomorrow: "",
    teacherNote: "",
  },
  {
    day: "الخميس",
    lesson: "",
    objective: "",
    homework: "",
    readingTask: "",
    spellingWords: "",
    bringTomorrow: "",
    teacherNote: "",
  },
];

const WEEKLY_PLAN_ANNOUNCEMENT_ID =
  "weekly-plan-current";

const WEEKLY_PLAN_ANNOUNCEMENT_TITLE =
  "📢 الخطة الأسبوعية جاهزة";

const WEEKLY_PLAN_ANNOUNCEMENT_MESSAGE =
  `أبطال لغتي الأعزاء 🌟 تم نشر الخطة الأسبوعية الجديدة، ويمكنكم الآن الاطلاع على دروس الأسبوع ومهامه والاستعداد لكل يوم بكل ثقة وحماس. 📚✨

👨‍👩‍👦 أسرتي شريكة نجاحي
نأمل الاطلاع على الخطة ومساعدة بطلنا على الاستعداد لأيام الأسبوع.

معًا نتعلّم… نقرأ… نبدع 💚`;

export default function WeeklyPlanPage() {
  const [weekTitle, setWeekTitle] =
    useState("");

  const [
    weeklyChallenge,
    setWeeklyChallenge,
  ] = useState("");

  const [farisMessage, setFarisMessage] =
    useState("");

  const [days, setDays] =
    useState<DayPlan[]>(initialDays);

  const [published, setPublished] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    statusMessage,
    setStatusMessage,
  ] = useState("");

  useEffect(() => {
    async function loadCurrentPlan() {
      try {
        const planReference = doc(
          db,
          "weeklyPlans",
          "current"
        );

        const planSnapshot =
          await getDoc(planReference);

        if (planSnapshot.exists()) {
          const data =
            planSnapshot.data();

          setWeekTitle(
            typeof data.weekTitle === "string"
              ? data.weekTitle
              : ""
          );

          setWeeklyChallenge(
            typeof data.weeklyChallenge ===
              "string"
              ? data.weeklyChallenge
              : ""
          );

          setFarisMessage(
            typeof data.farisMessage ===
              "string"
              ? data.farisMessage
              : ""
          );

          setPublished(
            typeof data.published ===
              "boolean"
              ? data.published
              : true
          );

          if (Array.isArray(data.days)) {
            const savedDays =
              initialDays.map(
                (defaultDay) => {
                  const matchingDay =
                    data.days.find(
                      (
                        savedDay: DayPlan
                      ) =>
                        savedDay.day ===
                        defaultDay.day
                    );

                  return matchingDay
                    ? {
                        day:
                          defaultDay.day,

                        lesson:
                          typeof matchingDay.lesson ===
                          "string"
                            ? matchingDay.lesson
                            : "",

                        objective:
                          typeof matchingDay.objective ===
                          "string"
                            ? matchingDay.objective
                            : "",

                        homework:
                          typeof matchingDay.homework ===
                          "string"
                            ? matchingDay.homework
                            : "",

                        readingTask:
                          typeof matchingDay.readingTask ===
                          "string"
                            ? matchingDay.readingTask
                            : "",

                        spellingWords:
                          typeof matchingDay.spellingWords ===
                          "string"
                            ? matchingDay.spellingWords
                            : "",

                        bringTomorrow:
                          typeof matchingDay.bringTomorrow ===
                          "string"
                            ? matchingDay.bringTomorrow
                            : "",

                        teacherNote:
                          typeof matchingDay.teacherNote ===
                          "string"
                            ? matchingDay.teacherNote
                            : "",
                      }
                    : defaultDay;
                }
              );

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

    void loadCurrentPlan();
  }, []);

  function updateDay(
    index: number,
    field:
      | "lesson"
      | "objective"
      | "homework"
      | "readingTask"
      | "spellingWords"
      | "bringTomorrow"
      | "teacherNote",
    value: string
  ) {
    setDays((currentDays) =>
      currentDays.map(
        (day, dayIndex) =>
          dayIndex === index
            ? {
                ...day,
                [field]: value,
              }
            : day
      )
    );

    setStatusMessage("");
  }

  async function syncWeeklyPlanAnnouncement(
    shouldPublish: boolean
  ) {
    const announcementReference = doc(
      db,
      "announcements",
      WEEKLY_PLAN_ANNOUNCEMENT_ID
    );

    const announcementSnapshot =
      await getDoc(
        announcementReference
      );

    if (shouldPublish) {
      const announcementData: Record<
        string,
        unknown
      > = {
        title:
          WEEKLY_PLAN_ANNOUNCEMENT_TITLE,

        message:
          WEEKLY_PLAN_ANNOUNCEMENT_MESSAGE,

        priority: "high",

        pinned: true,

        published: true,

        source: "weekly-plan",

        weekTitle:
          weekTitle.trim(),

        updatedAt:
          serverTimestamp(),
      };

      if (
        !announcementSnapshot.exists()
      ) {
        announcementData.createdAt =
          serverTimestamp();
      }

      await setDoc(
        announcementReference,
        announcementData,
        {
          merge: true,
        }
      );

      return;
    }

    if (
      announcementSnapshot.exists()
    ) {
      await setDoc(
        announcementReference,
        {
          published: false,
          pinned: false,
          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );
    }
  }

  async function notifyStudentsAboutWeeklyPlan() {
    const studentsSnapshot =
      await getDocs(
        collection(db, "students")
      );

    const batch =
      writeBatch(db);

    let notificationCount = 0;

    studentsSnapshot.docs.forEach(
      (studentDocument) => {
        const studentData =
          studentDocument.data();

        if (studentData.active === false) {
          return;
        }

        const studentId =
          typeof studentData.studentId ===
          "string" &&
          studentData.studentId.trim()
            ? studentData.studentId.trim()
            : studentDocument.id;

        const notificationReference =
          doc(
            db,
            "studentNotifications",
            `weekly-plan-${studentId}`
          );

        batch.set(
          notificationReference,
          {
            studentId,

            title:
              "🗓️ تم نشر خطتك الأسبوعية",

            message:
              weekTitle.trim()
                ? `تم اعتماد ونشر «${weekTitle.trim()}». اطّلع على دروس الأسبوع ومهامه وما تحتاج إلى إحضاره.`
                : "تم اعتماد ونشر الخطة الأسبوعية. اطّلع على دروس الأسبوع ومهامه وما تحتاج إلى إحضاره.",

            type:
              "weekly-plan-published",

            homeworkId: "",

            href:
              "/weekly-plan",

            read: false,

            weekTitle:
              weekTitle.trim(),

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        notificationCount += 1;
      }
    );

    if (notificationCount > 0) {
      await batch.commit();
    }
  }

  async function handleSavePlan() {
    if (!weekTitle.trim()) {
      setStatusMessage(
        "يرجى كتابة عنوان الأسبوع أولًا."
      );
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage("");

      const planReference = doc(
        db,
        "weeklyPlans",
        "current"
      );

      await setDoc(
        planReference,
        {
          weekTitle:
            weekTitle.trim(),

          weeklyChallenge:
            weeklyChallenge.trim(),

          farisMessage:
            farisMessage.trim(),

          days,

          published,

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      /*
       * مزامنة إعلان الخطة الأسبوعية.
       *
       * عند النشر:
       * يظهر إعلان واحد فقط ويُحدَّث
       * بدل إنشاء إعلان مكرر.
       *
       * عند إلغاء النشر:
       * يُخفى إعلان الخطة تلقائيًا.
       */
      await syncWeeklyPlanAnnouncement(
        published
      );

      if (published) {
        await notifyStudentsAboutWeeklyPlan();
      }

      setStatusMessage(
        published
          ? "تم حفظ الخطة ونشرها للطلاب، وتم تحديث الإعلان وإرسال إشعار الخطة للجميع ✅"
          : "تم حفظ الخطة كمسودة وإخفاء إعلان الخطة الأسبوعية ✅"
      );
    } catch (error) {
      console.error(error);

      setStatusMessage(
        "تعذر حفظ الخطة أو تحديث الإعلان. تحقق من الاتصال والصلاحيات."
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
          جارٍ تحميل الخطة
          الأسبوعية...
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="mb-2 font-bold text-emerald-600">
            لوحة المعلم
          </p>

          <h1 className="text-3xl font-black text-emerald-700 sm:text-4xl">
            📅 إدارة الخطة الأسبوعية
          </h1>

          <p className="mt-3 text-slate-600">
            اكتب خطة كل يوم، ثم احفظها
            وانشرها للطلاب.
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
              setWeekTitle(
                event.target.value
              );

              setStatusMessage("");
            }}
            placeholder="مثال: الأسبوع الأول"
            className="w-full rounded-2xl border border-slate-300 bg-white p-4 text-lg font-bold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <label
              htmlFor="weekly-challenge"
              className="mb-3 block font-bold text-amber-900"
            >
              🏆 تحدي الأسبوع
            </label>

            <textarea
              id="weekly-challenge"
              value={
                weeklyChallenge
              }
              onChange={(event) => {
                setWeeklyChallenge(
                  event.target.value
                );

                setStatusMessage("");
              }}
              placeholder="مثال: اقرأ قصة قصيرة لأحد أفراد أسرتك، ثم أخبرنا بأجمل فكرة فيها."
              className="min-h-28 w-full rounded-2xl border border-amber-200 bg-white p-4"
            />
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <label
              htmlFor="faris-message"
              className="mb-3 block font-bold text-emerald-900"
            >
              ✨ رسالة فارس للطلاب
            </label>

            <textarea
              id="faris-message"
              value={farisMessage}
              onChange={(event) => {
                setFarisMessage(
                  event.target.value
                );

                setStatusMessage("");
              }}
              placeholder="مثال: يا أبطال لغتي، أمامنا أسبوع جديد… خطوة صغيرة كل يوم تصنع إنجازًا كبيرًا 🌟"
              className="min-h-28 w-full rounded-2xl border border-emerald-200 bg-white p-4"
            />
          </section>
        </div>

        <div className="space-y-5">
          {days.map(
            (item, index) => (
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
                      value={
                        item.lesson
                      }
                      onChange={(
                        event
                      ) =>
                        updateDay(
                          index,
                          "lesson",
                          event.target
                            .value
                        )
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
                      value={
                        item.objective
                      }
                      onChange={(
                        event
                      ) =>
                        updateDay(
                          index,
                          "objective",
                          event.target
                            .value
                        )
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
                      value={
                        item.homework
                      }
                      onChange={(
                        event
                      ) =>
                        updateDay(
                          index,
                          "homework",
                          event.target
                            .value
                        )
                      }
                      placeholder="اكتب واجب اليوم"
                      className="w-full rounded-2xl border border-slate-300 bg-white p-4 font-bold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor={`readingTask-${index}`}
                    className="mb-2 block font-bold text-slate-700"
                  >
                    مهمة القراءة
                  </label>

                  <input
                    id={`readingTask-${index}`}
                    value={
                      item.readingTask
                    }
                    onChange={(
                      event
                    ) =>
                      updateDay(
                        index,
                        "readingTask",
                        event.target
                          .value
                      )
                    }
                    placeholder="اكتب مهمة القراءة"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="mt-4">
                  <label
                    htmlFor={`spellingWords-${index}`}
                    className="mb-2 block font-bold text-slate-700"
                  >
                    كلمات الإملاء
                  </label>

                  <textarea
                    id={`spellingWords-${index}`}
                    value={
                      item.spellingWords
                    }
                    onChange={(
                      event
                    ) =>
                      updateDay(
                        index,
                        "spellingWords",
                        event.target
                          .value
                      )
                    }
                    placeholder="اكتب كلمات الإملاء وافصل بينها بفاصلة"
                    rows={3}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="mt-4">
                  <label
                    htmlFor={`bringTomorrow-${index}`}
                    className="mb-2 block font-bold text-sky-800"
                  >
                    🎒 ماذا أحضر غدًا؟
                  </label>

                  <input
                    id={`bringTomorrow-${index}`}
                    type="text"
                    value={
                      item.bringTomorrow ||
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateDay(
                        index,
                        "bringTomorrow",
                        event.target
                          .value
                      )
                    }
                    placeholder="مثال: كتاب لغتي + الدفتر + ملف الإنجاز"
                    className="w-full rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3"
                  />
                </div>

                <div className="mt-4">
                  <label
                    htmlFor={`teacherNote-${index}`}
                    className="mb-2 block font-bold text-slate-700"
                  >
                    ملاحظة المعلم
                  </label>

                  <textarea
                    id={`teacherNote-${index}`}
                    value={
                      item.teacherNote
                    }
                    onChange={(
                      event
                    ) =>
                      updateDay(
                        index,
                        "teacherNote",
                        event.target
                          .value
                      )
                    }
                    placeholder="اكتب رسالة أو توجيهًا للطلاب"
                    rows={3}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </div>
              </section>
            )
          )}
        </div>

        <label className="mt-6 flex cursor-pointer items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <span className="text-lg font-black text-slate-800">
            نشر الخطة للطلاب مباشرة
          </span>

          <input
            type="checkbox"
            checked={published}
            onChange={(event) => {
              setPublished(
                event.target.checked
              );

              setStatusMessage("");
            }}
            className="h-7 w-7 accent-emerald-600"
          />
        </label>

        <button
          type="button"
          onClick={
            handleSavePlan
          }
          disabled={isSaving}
          className="mt-6 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-xl font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? "⏳ جارٍ حفظ الخطة..."
            : "💾 حفظ الخطة"}
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