"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";

type ClassroomKey = "second-a" | "second-b";

type AttendanceStatus =
  | "present"
  | "absent"
  | "late";

type StudentRecord = {
  studentId: string;
  studentName: string;
  classroom: ClassroomKey;

  attendance: AttendanceStatus;

  homeworkCompleted: boolean;
  readingCompleted: boolean;
  participated: boolean;

  note: string;
};

type AttendanceHistoryItem = {
  date: string;
  status: string;
  source?: string;
};

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

function getTodayKey() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeClassroom(
  classroom: unknown
): ClassroomKey | null {
  if (typeof classroom !== "string") {
    return null;
  }

  const normalized = classroom
    .replace(/\s+/g, " ")
    .trim();

  if (
    normalized.includes("الثاني أ") ||
    normalized.includes("الثاني ا")
  ) {
    return "second-a";
  }

  if (normalized.includes("الثاني ب")) {
    return "second-b";
  }

  return null;
}

function mapAttendanceToArabic(
  status: AttendanceStatus
) {
  if (status === "absent") {
    return "غائب";
  }

  if (status === "late") {
    return "متأخر";
  }

  return "حاضر";
}

export default function SmartRecordPage() {
  const [selectedClassroom, setSelectedClassroom] =
    useState<ClassroomKey>("second-a");

  const [selectedDate, setSelectedDate] =
    useState(getTodayKey());

  const [records, setRecords] =
    useState<StudentRecord[]>([]);

  const [searchText, setSearchText] =
    useState("");

  const [statusMessage, setStatusMessage] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const currentClassroom =
    classroomOptions.find(
      (item) =>
        item.key === selectedClassroom
    ) ?? classroomOptions[0];

  /*
   * تحميل طلاب الفصل الحقيقيين
   * ثم تحميل سجل اليوم إن كان موجودًا.
   */
  useEffect(() => {
    async function loadSmartRecord() {
      try {
        setIsLoading(true);
        setStatusMessage("");

        const studentsSnapshot =
          await getDocs(
            collection(db, "students")
          );

        const classroomStudents:
          StudentRecord[] = [];

        studentsSnapshot.docs.forEach(
          (studentDoc) => {
            const data =
              studentDoc.data();

            const classroomKey =
              normalizeClassroom(
                data.classroom
              );

            if (
              classroomKey !==
              selectedClassroom
            ) {
              return;
            }

            const name =
              typeof data.studentName ===
              "string"
                ? data.studentName
                : typeof data.name ===
                    "string"
                  ? data.name
                  : `طالب ${studentDoc.id}`;

            classroomStudents.push({
              studentId:
                studentDoc.id,

              studentName:
                name,

              classroom:
                selectedClassroom,

              attendance:
                "present",

              homeworkCompleted:
                false,

              readingCompleted:
                false,

              participated:
                false,

              note: "",
            });
          }
        );

        classroomStudents.sort(
          (a, b) =>
            a.studentId.localeCompare(
              b.studentId
            )
        );

        const smartRecordId =
          `${selectedDate}_${selectedClassroom}`;

        const smartRecordReference =
          doc(
            db,
            "smartRecords",
            smartRecordId
          );

        const recordSnapshot =
          await getDoc(
            smartRecordReference
          );

        if (
          recordSnapshot.exists()
        ) {
          const savedData =
            recordSnapshot.data();

          const savedRecords =
            Array.isArray(
              savedData.records
            )
              ? savedData.records
              : [];

          const mergedRecords =
            classroomStudents.map(
              (student) => {
                const savedStudent =
                  savedRecords.find(
                    (
                      saved: Partial<StudentRecord>
                    ) =>
                      saved.studentId ===
                      student.studentId
                  );

                if (!savedStudent) {
                  return student;
                }

                return {
                  ...student,

                  attendance:
                    savedStudent.attendance ===
                      "absent" ||
                    savedStudent.attendance ===
                      "late"
                      ? savedStudent.attendance
                      : "present",

                  homeworkCompleted:
                    savedStudent.homeworkCompleted ===
                    true,

                  readingCompleted:
                    savedStudent.readingCompleted ===
                    true,

                  participated:
                    savedStudent.participated ===
                    true,

                  note:
                    typeof savedStudent.note ===
                    "string"
                      ? savedStudent.note
                      : "",
                };
              }
            );

          setRecords(
            mergedRecords
          );

          setStatusMessage(
            "📂 تم تحميل السجل المحفوظ لهذا اليوم."
          );

          return;
        }

        setRecords(
          classroomStudents
        );
      } catch (error) {
        console.error(
          "تعذر تحميل السجل الذكي:",
          error
        );

        setRecords([]);

        setStatusMessage(
          "تعذر تحميل بيانات السجل. تحقق من الاتصال أو الصلاحيات."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadSmartRecord();
  }, [
    selectedClassroom,
    selectedDate,
  ]);

  const filteredRecords =
    useMemo(() => {
      const normalizedSearch =
        searchText.trim();

      if (!normalizedSearch) {
        return records;
      }

      return records.filter(
        (student) =>
          student.studentName.includes(
            normalizedSearch
          ) ||
          student.studentId.includes(
            normalizedSearch
          )
      );
    }, [records, searchText]);

  const summary =
    useMemo(() => {
      return {
        total:
          records.length,

        present:
          records.filter(
            (student) =>
              student.attendance ===
              "present"
          ).length,

        absent:
          records.filter(
            (student) =>
              student.attendance ===
              "absent"
          ).length,

        late:
          records.filter(
            (student) =>
              student.attendance ===
              "late"
          ).length,

        homework:
          records.filter(
            (student) =>
              student.homeworkCompleted
          ).length,

        reading:
          records.filter(
            (student) =>
              student.readingCompleted
          ).length,

        participation:
          records.filter(
            (student) =>
              student.participated
          ).length,
      };
    }, [records]);

  function updateStudent(
    studentId: string,
    changes: Partial<StudentRecord>
  ) {
    setRecords(
      (currentRecords) =>
        currentRecords.map(
          (student) =>
            student.studentId ===
            studentId
              ? {
                  ...student,
                  ...changes,
                }
              : student
        )
    );

    setStatusMessage("");
  }

  function markAllPresent() {
    setRecords(
      (currentRecords) =>
        currentRecords.map(
          (student) => ({
            ...student,
            attendance:
              "present",
          })
        )
    );

    setStatusMessage(
      "✅ تم تسجيل جميع الطلاب حاضرين."
    );
  }

  function resetFollowUp() {
    const confirmed =
      window.confirm(
        "هل تريد تصفير متابعة الواجب والقراءة والمشاركة لهذا اليوم؟"
      );

    if (!confirmed) {
      return;
    }

    setRecords(
      (currentRecords) =>
        currentRecords.map(
          (student) => ({
            ...student,

            homeworkCompleted:
              false,

            readingCompleted:
              false,

            participated:
              false,

            note: "",
          })
        )
    );

    setStatusMessage(
      "تم تصفير المتابعة اليومية."
    );
  }

  /*
   * حفظ السجل الرئيسي
   * ثم تحديث attendanceHistory
   * لكل طالب دون تكرار نفس التاريخ.
   */
  async function handleSave() {
    if (
      records.length === 0
    ) {
      setStatusMessage(
        "لا توجد بيانات طلاب لحفظها."
      );
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage("");

      const smartRecordId =
        `${selectedDate}_${selectedClassroom}`;

      const smartRecordReference =
        doc(
          db,
          "smartRecords",
          smartRecordId
        );

      await setDoc(
        smartRecordReference,
        {
          date:
            selectedDate,

          classroomKey:
            selectedClassroom,

          classroom:
            currentClassroom.label,

          totalStudents:
            summary.total,

          presentCount:
            summary.present,

          absentCount:
            summary.absent,

          lateCount:
            summary.late,

          homeworkCompletedCount:
            summary.homework,

          readingCompletedCount:
            summary.reading,

          participationCount:
            summary.participation,

          records:
            records,

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      /*
       * تحديث كل ملف طالب.
       *
       * نزيل سجل نفس التاريخ
       * ثم نضع الحالة الجديدة.
       * لذلك إعادة الحفظ لا تكرر الغياب.
       */
      for (const student of records) {
        const studentReference =
          doc(
            db,
            "students",
            student.studentId
          );

        const snapshot =
          await getDoc(
            studentReference
          );

        if (
          !snapshot.exists()
        ) {
          continue;
        }

        const studentData =
          snapshot.data();

        const currentHistory:
          AttendanceHistoryItem[] =
          Array.isArray(
            studentData.attendanceHistory
          )
            ? studentData.attendanceHistory.filter(
                (
                  item: AttendanceHistoryItem
                ) =>
                  item &&
                  typeof item ===
                    "object"
              )
            : [];

        /*
         * إزالة أي سجل سابق
         * لنفس اليوم.
         */
        const historyWithoutToday =
          currentHistory.filter(
            (item) =>
              item.date !==
              selectedDate
          );

        const newAttendanceItem:
          AttendanceHistoryItem = {
          date:
            selectedDate,

          status:
            mapAttendanceToArabic(
              student.attendance
            ),

          source:
            "smart-record",
        };

        const updatedHistory = [
          ...historyWithoutToday,
          newAttendanceItem,
        ];

        await setDoc(
          studentReference,
          {
            attendanceHistory:
              updatedHistory,

            smartFollowUp: {
              date:
                selectedDate,

              homeworkCompleted:
                student.homeworkCompleted,

              readingCompleted:
                student.readingCompleted,

              participated:
                student.participated,

              note:
                student.note,

              updatedAt:
                serverTimestamp(),
            },

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      }

      setStatusMessage(
        `✅ تم حفظ سجل ${currentClassroom.label} وتحديث ملفات الطلاب بنجاح.`
      );
    } catch (error) {
      console.error(
        "تعذر حفظ السجل الذكي:",
        error
      );

      setStatusMessage(
        "تعذر حفظ السجل. تحقق من الاتصال وصلاحيات Firebase."
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
          جارٍ تحميل السجل الذكي...
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

        {/* الترويسة */}

        <header className="mb-6 rounded-3xl bg-gradient-to-l from-emerald-700 to-emerald-500 p-7 text-white shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-bold text-emerald-50">
                لوحة المعلم
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                📋 السجل الذكي
              </h1>

              <p className="mt-3 max-w-3xl leading-8 text-emerald-50">
                متابعة سريعة للحضور
                والواجب والقراءة
                والمشاركة دون أوراق
                إضافية.
              </p>
            </div>

            <a
              href="/teacher"
              className="rounded-2xl bg-white px-5 py-3 font-black text-emerald-700 no-underline"
            >
              ← العودة إلى لوحة المعلم
            </a>
          </div>
        </header>

        {/* الفصل + التاريخ */}

        <section className="mb-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-slate-800">
              🏫 اختر الفصل
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {classroomOptions.map(
                (classroom) => {
                  const active =
                    classroom.key ===
                    selectedClassroom;

                  return (
                    <button
                      key={
                        classroom.key
                      }
                      type="button"
                      onClick={() => {
                        setSelectedClassroom(
                          classroom.key
                        );

                        setSearchText("");
                        setStatusMessage("");
                      }}
                      className={`rounded-2xl border-2 px-5 py-4 text-lg font-black transition ${
                        active
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {active
                        ? "✅ "
                        : ""}

                      {
                        classroom.label
                      }
                    </button>
                  );
                }
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label
              htmlFor="record-date"
              className="mb-4 block text-xl font-black text-slate-800"
            >
              📅 تاريخ السجل
            </label>

            <input
              id="record-date"
              type="date"
              value={selectedDate}
              onChange={(
                event
              ) => {
                setSelectedDate(
                  event.target.value
                );

                setStatusMessage("");
              }}
              className="w-full rounded-2xl border border-slate-300 px-4 py-4 text-lg font-bold"
            />
          </article>
        </section>

        {/* الملخص */}

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <SummaryCard
            icon="👥"
            label="الطلاب"
            value={summary.total}
          />

          <SummaryCard
            icon="✅"
            label="حاضر"
            value={summary.present}
          />

          <SummaryCard
            icon="❌"
            label="غائب"
            value={summary.absent}
          />

          <SummaryCard
            icon="⏰"
            label="متأخر"
            value={summary.late}
          />

          <SummaryCard
            icon="📝"
            label="الواجب"
            value={summary.homework}
          />

          <SummaryCard
            icon="📖"
            label="القراءة"
            value={summary.reading}
          />

          <SummaryCard
            icon="🌟"
            label="شارك"
            value={
              summary.participation
            }
          />
        </section>

        {/* أدوات */}

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <h2 className="text-xl font-black text-slate-800">
                ⚡ أدوات سريعة
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                لتقليل وقت تسجيل
                المتابعة داخل الحصة.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={
                  markAllPresent
                }
                className="rounded-xl bg-emerald-100 px-4 py-3 font-black text-emerald-800"
              >
                ✅ الجميع حاضر
              </button>

              <button
                type="button"
                onClick={
                  resetFollowUp
                }
                className="rounded-xl bg-amber-100 px-4 py-3 font-black text-amber-800"
              >
                ↻ تصفير المتابعة
              </button>
            </div>
          </div>
        </section>

        {/* البحث */}

        <section className="mb-4">
          <input
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
            placeholder="🔎 ابحث باسم الطالب أو رقمه..."
            className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-bold shadow-sm outline-none focus:border-emerald-500"
          />
        </section>

        {/* الطلاب */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">
            <h2 className="text-2xl font-black text-slate-800">
              👨‍🎓 طلاب{" "}
              {
                currentClassroom.label
              }
            </h2>

            <p className="mt-2 text-slate-500">
              اضغط مرة واحدة فقط
              لتسجيل حالة الطالب.
            </p>
          </div>

          <div className="grid gap-4 p-4 sm:p-5">
            {filteredRecords.map(
              (student) => (
                <StudentRecordCard
                  key={
                    student.studentId
                  }
                  student={student}
                  onUpdate={(
                    changes
                  ) =>
                    updateStudent(
                      student.studentId,
                      changes
                    )
                  }
                />
              )
            )}

            {filteredRecords.length ===
              0 && (
              <div className="rounded-2xl bg-slate-50 p-8 text-center font-bold text-slate-500">
                لا توجد بيانات طلاب
                لهذا الفصل.
              </div>
            )}
          </div>
        </section>

        {/* الحفظ */}

        <button
          type="button"
          onClick={handleSave}
          disabled={
            isSaving ||
            records.length === 0
          }
          className="mt-6 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-xl font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? "⏳ جارٍ حفظ السجل..."
            : `💾 حفظ سجل ${currentClassroom.label}`}
        </button>

        {statusMessage && (
          <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-center font-black text-amber-800">
            {statusMessage}
          </p>
        )}

        <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-xl font-black text-emerald-800">
            🔗 سجل مترابط
          </h2>

          <p className="mt-2 leading-8 text-emerald-900">
            عند حفظ السجل يتم حفظ
            المتابعة اليومية وتحديث
            حضور الطالب داخل ملفه،
            لتستفيد منه صفحة ولي الأمر
            وبقية أدوات الأكاديمية.
          </p>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <div className="text-2xl">
        {icon}
      </div>

      <p className="mt-2 text-sm font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-slate-800">
        {value}
      </p>
    </article>
  );
}

function StudentRecordCard({
  student,
  onUpdate,
}: {
  student: StudentRecord;
  onUpdate: (
    changes: Partial<StudentRecord>
  ) => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-2xl">
            👦
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-800">
              {
                student.studentName
              }
            </h3>

            <p
              dir="ltr"
              className="text-xs font-bold text-slate-400"
            >
              {
                student.studentId
              }
            </p>
          </div>
        </div>

        <AttendanceSelector
          value={
            student.attendance
          }
          onChange={(
            attendance
          ) =>
            onUpdate({
              attendance,
            })
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">

        <FollowButton
          active={
            student.homeworkCompleted
          }
          activeText="الواجب مكتمل"
          inactiveText="الواجب"
          icon="📝"
          onClick={() =>
            onUpdate({
              homeworkCompleted:
                !student.homeworkCompleted,
            })
          }
        />

        <FollowButton
          active={
            student.readingCompleted
          }
          activeText="تمت القراءة"
          inactiveText="القراءة"
          icon="📖"
          onClick={() =>
            onUpdate({
              readingCompleted:
                !student.readingCompleted,
            })
          }
        />

        <FollowButton
          active={
            student.participated
          }
          activeText="شارك اليوم"
          inactiveText="المشاركة"
          icon="🌟"
          onClick={() =>
            onUpdate({
              participated:
                !student.participated,
            })
          }
        />
      </div>

      <textarea
        value={student.note}
        onChange={(event) =>
          onUpdate({
            note:
              event.target.value,
          })
        }
        placeholder="💬 ملاحظة سريعة عن الطالب..."
        rows={2}
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-emerald-400"
      />
    </article>
  );
}

function AttendanceSelector({
  value,
  onChange,
}: {
  value: AttendanceStatus;
  onChange: (
    status: AttendanceStatus
  ) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">

      <button
        type="button"
        onClick={() =>
          onChange("present")
        }
        className={`rounded-xl px-3 py-2 text-sm font-black ${
          value === "present"
            ? "bg-emerald-600 text-white"
            : "bg-white text-emerald-700"
        }`}
      >
        ✅ حاضر
      </button>

      <button
        type="button"
        onClick={() =>
          onChange("absent")
        }
        className={`rounded-xl px-3 py-2 text-sm font-black ${
          value === "absent"
            ? "bg-rose-600 text-white"
            : "bg-white text-rose-700"
        }`}
      >
        ❌ غائب
      </button>

      <button
        type="button"
        onClick={() =>
          onChange("late")
        }
        className={`rounded-xl px-3 py-2 text-sm font-black ${
          value === "late"
            ? "bg-amber-500 text-white"
            : "bg-white text-amber-700"
        }`}
      >
        ⏰ متأخر
      </button>
    </div>
  );
}

function FollowButton({
  active,
  activeText,
  inactiveText,
  icon,
  onClick,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 px-4 py-3 font-black transition ${
        active
          ? "border-emerald-500 bg-emerald-100 text-emerald-800"
          : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      {icon}{" "}
      {active
        ? activeText
        : inactiveText}
    </button>
  );
}