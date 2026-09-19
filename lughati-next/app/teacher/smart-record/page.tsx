"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";

type ClassroomKey = "second-a" | "second-b";
type AttendanceStatus = "present" | "absent" | "late";
type HomeworkLevel = "complete" | "partial" | "not-done";
type AwardLevel = "prince" | "hero" | "star" | "diligent" | "not-evaluated";

type StudentRecord = {
  studentId: string;
  studentName: string;
  classroom: ClassroomKey;
  attendance: AttendanceStatus;
  homeworkLevel: HomeworkLevel;
  readingErrors: number | null;
  readingLevel: AwardLevel;
  readingKing: boolean;
  spellingErrors: number | null;
  spellingLevel: AwardLevel;
  spellingKing: boolean;
  participated: boolean;
  note: string;
};

type AttendanceHistoryItem = { date: string; status: string; source?: string };

const classroomOptions = [
  { key: "second-a" as ClassroomKey, label: "الثاني أ" },
  { key: "second-b" as ClassroomKey, label: "الثاني ب" },
];

const homeworkOptions: { value: HomeworkLevel; label: string }[] = [
  { value: "complete", label: "✅ كامل" },
  { value: "partial", label: "🟡 جزء من الواجب" },
  { value: "not-done", label: "❌ لم يحل الواجب" },
];

function getTodayKey() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
}

function normalizeClassroom(classroom: unknown): ClassroomKey | null {
  if (typeof classroom !== "string") return null;
  const value = classroom.replace(/\s+/g, " ").trim();
  if (value.includes("الثاني أ") || value.includes("الثاني ا")) return "second-a";
  if (value.includes("الثاني ب")) return "second-b";
  return null;
}

function mapAttendanceToArabic(status: AttendanceStatus) {
  if (status === "absent") return "غائب";
  if (status === "late") return "متأخر";
  return "حاضر";
}

function getHomeworkLabel(value: HomeworkLevel) {
  return homeworkOptions.find((item) => item.value === value)?.label ?? "";
}

function isHomeworkLevel(value: unknown): value is HomeworkLevel {
  return homeworkOptions.some((item) => item.value === value);
}

function normalizeHomeworkLevel(value: unknown, completed?: unknown): HomeworkLevel {
  if (isHomeworkLevel(value)) return value;
  if (value === "mastered" || value === "complete-minor-errors" || value === "most-completed") return "complete";
  if (value === "partial" || value === "needs-redo") return "partial";
  return completed === true ? "complete" : "not-done";
}

function getWeekRange(dateKey: string) {
  const base = new Date(`${dateKey}T12:00:00`);
  const day = base.getDay();
  const sunday = new Date(base);
  sunday.setDate(base.getDate() - day);
  const wednesday = new Date(sunday);
  wednesday.setDate(sunday.getDate() + 3);
  const key = (d: Date) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
  return { start: key(sunday), end: key(wednesday) };
}

function levelFromErrors(errors: number | null): AwardLevel {
  if (errors === null) return "not-evaluated";
  if (errors === 0) return "prince";
  if (errors <= 2) return "hero";
  if (errors === 3) return "star";
  return "diligent";
}

function awardLabel(level: AwardLevel, kind: "reading" | "spelling") {
  const subject = kind === "reading" ? "القراءة" : "الإملاء";
  if (level === "prince") return `🌟 أمير ${subject}`;
  if (level === "hero") return `🏅 بطل ${subject}`;
  if (level === "star") return `⭐ نجم ${subject}`;
  if (level === "diligent") return `🌱 مجتهد ${subject}`;
  return "— لم يُقيّم";
}

function oldReadingToErrors(level: unknown): number | null {
  if (level === "mastered") return 0;
  if (level === "very-good") return 1;
  if (level === "good") return 3;
  if (level === "needs-practice" || level === "intensive-support") return 4;
  return null;
}

function oldSpellingToErrors(saved: Record<string, unknown>): number | null {
  if (typeof saved.spellingErrors === "number") return Math.max(0, Math.round(saved.spellingErrors));
  return oldReadingToErrors(saved.spellingLevel);
}

export default function SmartRecordPage() {
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomKey>("second-a");
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [readingTitle, setReadingTitle] = useState("");
  const [spellingTitle, setSpellingTitle] = useState("");
  const [spellingWordCount, setSpellingWordCount] = useState<number>(0);
  const [searchText, setSearchText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<Array<{ studentId: string; studentName: string; complete: number; partial: number; notDone: number; readingDays: number; readingErrors: number; spellingDays: number; spellingErrors: number; present: number; absent: number; late: number }>>([]);
  const [weeklyRange, setWeeklyRange] = useState<{ start: string; end: string } | null>(null);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);

  const currentClassroom = classroomOptions.find((item) => item.key === selectedClassroom) ?? classroomOptions[0];

  useEffect(() => {
    async function loadSmartRecord() {
      try {
        setIsLoading(true);
        setStatusMessage("");
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const classroomStudents: StudentRecord[] = [];

        studentsSnapshot.docs.forEach((studentDoc) => {
          const data = studentDoc.data();
          if (normalizeClassroom(data.classroom) !== selectedClassroom) return;
          const name = typeof data.studentName === "string" ? data.studentName : typeof data.name === "string" ? data.name : `طالب ${studentDoc.id}`;
          classroomStudents.push({
            studentId: studentDoc.id,
            studentName: name,
            classroom: selectedClassroom,
            attendance: "present",
            homeworkLevel: "not-done",
            readingErrors: null,
            readingLevel: "not-evaluated",
            readingKing: false,
            spellingErrors: null,
            spellingLevel: "not-evaluated",
            spellingKing: false,
            participated: false,
            note: "",
          });
        });

        classroomStudents.sort((a, b) => a.studentId.localeCompare(b.studentId));
        const ref = doc(db, "smartRecords", `${selectedDate}_${selectedClassroom}`);
        const snapshot = await getDoc(ref);

        if (snapshot.exists()) {
          const savedData = snapshot.data();
          setReadingTitle(typeof savedData.readingTitle === "string" ? savedData.readingTitle : "");
          setSpellingTitle(typeof savedData.spellingTitle === "string" ? savedData.spellingTitle : typeof savedData.spellingTextName === "string" ? savedData.spellingTextName : "");
          setSpellingWordCount(typeof savedData.spellingWordCount === "number" ? savedData.spellingWordCount : 0);
          const savedRecords = Array.isArray(savedData.records) ? savedData.records : [];
          const merged = classroomStudents.map((student) => {
            const saved = savedRecords.find((item: { studentId?: string }) => item.studentId === student.studentId) as Record<string, unknown> | undefined;
            if (!saved) return student;
            const readingErrors = typeof saved.readingErrors === "number" ? Math.max(0, Math.round(saved.readingErrors)) : oldReadingToErrors(saved.readingLevel);
            const spellingErrors = oldSpellingToErrors(saved);
            return {
              ...student,
              attendance: saved.attendance === "absent" || saved.attendance === "late" ? saved.attendance : "present",
              homeworkLevel: normalizeHomeworkLevel(saved.homeworkLevel, saved.homeworkCompleted),
              readingErrors,
              readingLevel: levelFromErrors(readingErrors),
              readingKing: saved.readingKing === true,
              spellingErrors,
              spellingLevel: levelFromErrors(spellingErrors),
              spellingKing: saved.spellingKing === true,
              participated: saved.participated === true,
              note: typeof saved.note === "string" ? saved.note : "",
            } as StudentRecord;
          });
          setRecords(merged);
          setStatusMessage("📂 تم تحميل السجل المحفوظ لهذا اليوم.");
        } else {
          setReadingTitle("");
          setSpellingTitle("");
          setSpellingWordCount(0);
          setRecords(classroomStudents);
        }
      } catch (error) {
        console.error("تعذر تحميل السجل الذكي:", error);
        setRecords([]);
        setStatusMessage("تعذر تحميل بيانات السجل. تحقق من الاتصال أو الصلاحيات.");
      } finally {
        setIsLoading(false);
      }
    }
    void loadSmartRecord();
  }, [selectedClassroom, selectedDate]);

  const filteredRecords = useMemo(() => {
    const q = searchText.trim();
    return q ? records.filter((student) => student.studentName.includes(q) || student.studentId.includes(q)) : records;
  }, [records, searchText]);

  const summary = useMemo(() => ({
    total: records.length,
    present: records.filter((s) => s.attendance === "present").length,
    absent: records.filter((s) => s.attendance === "absent").length,
    late: records.filter((s) => s.attendance === "late").length,
    homework: records.filter((s) => s.homeworkLevel !== "not-done").length,
    reading: records.filter((s) => s.readingErrors !== null).length,
    spelling: records.filter((s) => s.spellingErrors !== null).length,
  }), [records]);

  const weeklySummary = useMemo(() => {
    const totalDays = weeklyReport.length
      ? Math.max(...weeklyReport.map((item) => item.present + item.absent + item.late), 0)
      : 0;
    const totalStudentDays = weeklyReport.reduce(
      (sum, item) => sum + item.present + item.absent + item.late,
      0
    );
    const completeHomework = weeklyReport.reduce((sum, item) => sum + item.complete, 0);
    const attendance = weeklyReport.reduce((sum, item) => sum + item.present, 0);
    const absent = weeklyReport.reduce((sum, item) => sum + item.absent, 0);
    const late = weeklyReport.reduce((sum, item) => sum + item.late, 0);
    const readingDays = weeklyReport.reduce((sum, item) => sum + item.readingDays, 0);
    const spellingDays = weeklyReport.reduce((sum, item) => sum + item.spellingDays, 0);
    return {
      totalDays,
      homeworkPercent: totalStudentDays ? Math.round((completeHomework / totalStudentDays) * 100) : 0,
      attendance,
      absent,
      late,
      readingDays,
      spellingDays,
    };
  }, [weeklyReport]);

  function updateStudent(studentId: string, changes: Partial<StudentRecord>) {
    setRecords((current) => current.map((student) => student.studentId === studentId ? { ...student, ...changes } : student));
    setStatusMessage("");
  }

  function markAllPresent() {
    setRecords((current) => current.map((student) => ({ ...student, attendance: "present" })));
    setStatusMessage("✅ تم تسجيل جميع الطلاب حاضرين.");
  }

  function resetFollowUp() {
    if (!window.confirm("هل تريد تصفير متابعة الواجب والقراءة والإملاء لهذا اليوم؟")) return;
    setReadingTitle("");
    setSpellingTitle("");
    setSpellingWordCount(0);
    setRecords((current) => current.map((student) => ({
      ...student,
      homeworkLevel: "not-done",
      readingErrors: null,
      readingLevel: "not-evaluated",
      readingKing: false,
      spellingErrors: null,
      spellingLevel: "not-evaluated",
      spellingKing: false,
      participated: false,
      note: "",
    })));
    setStatusMessage("تم تصفير المتابعة اليومية.");
  }

  async function loadWeeklyReport() {
    try {
      setIsWeeklyLoading(true);
      const range = getWeekRange(selectedDate);
      const snapshot = await getDocs(collection(db, "smartRecords"));
      const days = snapshot.docs
        .map((d) => d.data())
        .filter((data) => data.classroomKey === selectedClassroom && typeof data.date === "string" && data.date >= range.start && data.date <= range.end);

      const map = new Map<string, { studentId: string; studentName: string; complete: number; partial: number; notDone: number; readingDays: number; readingErrors: number; spellingDays: number; spellingErrors: number; present: number; absent: number; late: number }>();
      for (const day of days) {
        const dayRecords = Array.isArray(day.records) ? day.records : [];
        for (const item of dayRecords) {
          if (!item || typeof item !== "object" || typeof item.studentId !== "string") continue;
          const current = map.get(item.studentId) ?? { studentId: item.studentId, studentName: typeof item.studentName === "string" ? item.studentName : item.studentId, complete: 0, partial: 0, notDone: 0, readingDays: 0, readingErrors: 0, spellingDays: 0, spellingErrors: 0, present: 0, absent: 0, late: 0 };
          const hw = normalizeHomeworkLevel(item.homeworkLevel, item.homeworkCompleted);
          if (hw === "complete") current.complete += 1;
          else if (hw === "partial") current.partial += 1;
          else current.notDone += 1;
          const readingErrors =
            typeof item.readingErrors === "number"
              ? Math.max(0, Math.round(item.readingErrors))
              : oldReadingToErrors(item.readingLevel);
          const spellingErrors = oldSpellingToErrors(item as Record<string, unknown>);
          if (readingErrors !== null) {
            current.readingDays += 1;
            current.readingErrors += readingErrors;
          }
          if (spellingErrors !== null) {
            current.spellingDays += 1;
            current.spellingErrors += spellingErrors;
          }
          if (item.attendance === "absent") current.absent += 1;
          else if (item.attendance === "late") current.late += 1;
          else current.present += 1;
          map.set(item.studentId, current);
        }
      }
      setWeeklyReport(Array.from(map.values()).sort((a, b) => a.studentName.localeCompare(b.studentName, "ar")));
      setWeeklyRange(range);
      setStatusMessage(days.length ? `📊 تم إعداد تقرير الأسبوع من ${range.start} إلى ${range.end}.` : "لا توجد سجلات محفوظة لهذا الأسبوع بعد.");
    } catch (error) {
      console.error("تعذر إعداد التقرير الأسبوعي:", error);
      setStatusMessage("تعذر إعداد التقرير الأسبوعي.");
    } finally {
      setIsWeeklyLoading(false);
    }
  }

  async function handleSave() {
    if (!records.length) return setStatusMessage("لا توجد بيانات طلاب لحفظها.");
    try {
      setIsSaving(true);
      setStatusMessage("");
      const ref = doc(db, "smartRecords", `${selectedDate}_${selectedClassroom}`);
      await setDoc(ref, {
        date: selectedDate,
        classroomKey: selectedClassroom,
        classroom: currentClassroom.label,
        readingTitle: readingTitle.trim(),
        spellingTitle: spellingTitle.trim(),
        spellingWordCount: Math.max(0, Math.round(spellingWordCount)),
        totalStudents: summary.total,
        presentCount: summary.present,
        absentCount: summary.absent,
        lateCount: summary.late,
        homeworkFollowUpCount: summary.homework,
        readingEvaluationCount: summary.reading,
        spellingEvaluationCount: summary.spelling,
        records,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      for (const student of records) {
        const studentReference = doc(db, "students", student.studentId);
        const snapshot = await getDoc(studentReference);
        if (!snapshot.exists()) continue;
        const studentData = snapshot.data();
        const currentHistory: AttendanceHistoryItem[] = Array.isArray(studentData.attendanceHistory) ? studentData.attendanceHistory.filter((item: AttendanceHistoryItem) => item && typeof item === "object") : [];
        const attendanceHistory = [
          ...currentHistory.filter((item) => item.date !== selectedDate),
          { date: selectedDate, status: mapAttendanceToArabic(student.attendance), source: "smart-record" },
        ];

        const readingEvaluated = student.readingErrors !== null;
        const spellingEvaluated = student.spellingErrors !== null;
        const readingAssessment = readingEvaluated ? {
          date: selectedDate,
          title: readingTitle.trim(),
          errors: student.readingErrors,
          levelKey: student.readingLevel,
          level: student.readingKing ? "👑 ملك القراءة" : awardLabel(student.readingLevel, "reading"),
          king: student.readingKing,
          source: "smart-record",
        } : null;
        const spellingAssessment = spellingEvaluated ? {
          date: selectedDate,
          textName: spellingTitle.trim(),
          wordCount: Math.max(0, Math.round(spellingWordCount)),
          errors: student.spellingErrors,
          levelKey: student.spellingLevel,
          level: student.spellingKing ? "👑 ملك الإملاء" : awardLabel(student.spellingLevel, "spelling"),
          king: student.spellingKing,
          source: "smart-record",
        } : null;

        const readingHistory = Array.isArray(studentData.readingHistory) ? studentData.readingHistory.filter((item: { date?: unknown }) => item && typeof item === "object" && item.date !== selectedDate) : [];
        const spellingHistory = Array.isArray(studentData.spellingHistory) ? studentData.spellingHistory.filter((item: { date?: unknown }) => item && typeof item === "object" && item.date !== selectedDate) : [];

        await setDoc(studentReference, {
          attendanceHistory,
          smartFollowUp: {
            date: selectedDate,
            homeworkLevel: student.homeworkLevel,
            homeworkLabel: getHomeworkLabel(student.homeworkLevel),
            homeworkCompleted: student.homeworkLevel === "complete",
            readingTitle: readingTitle.trim(),
            readingErrors: student.readingErrors,
            readingLevel: student.readingLevel,
            readingLevelLabel: student.readingKing ? "👑 ملك القراءة" : awardLabel(student.readingLevel, "reading"),
            readingKing: student.readingKing,
            readingCompleted: readingEvaluated,
            spellingTitle: spellingTitle.trim(),
            spellingWordCount: Math.max(0, Math.round(spellingWordCount)),
            spellingErrors: student.spellingErrors,
            spellingLevel: student.spellingLevel,
            spellingLevelLabel: student.spellingKing ? "👑 ملك الإملاء" : awardLabel(student.spellingLevel, "spelling"),
            spellingKing: student.spellingKing,
            participated: student.participated,
            note: student.note,
            updatedAt: serverTimestamp(),
          },
          ...(readingAssessment ? { latestReading: readingAssessment, readingHistory: [...readingHistory, readingAssessment] } : {}),
          ...(spellingAssessment ? { latestSpelling: spellingAssessment, spellingHistory: [...spellingHistory, spellingAssessment] } : {}),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      setStatusMessage(`✅ تم حفظ سجل ${currentClassroom.label} وتحديث متابعة الطلاب بنجاح.`);
    } catch (error) {
      console.error("تعذر حفظ السجل الذكي:", error);
      setStatusMessage("تعذر حفظ السجل. تحقق من الاتصال وصلاحيات Firebase.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="rounded-3xl bg-white px-8 py-6 text-xl font-black text-emerald-700 shadow-sm">جارٍ تحميل السجل الذكي...</div></main>;

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-3xl bg-gradient-to-l from-emerald-700 to-emerald-500 p-7 text-white shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-bold text-emerald-50">لوحة المعلم</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">📋 السجل الذكي المختصر</h1><p className="mt-3 text-emerald-50">متابعة سريعة للحضور والواجب والقراءة والإملاء أثناء الحصة.</p></div><a href="/teacher" className="rounded-2xl bg-white px-5 py-3 font-black text-emerald-700 no-underline">← العودة إلى لوحة المعلم</a></div>
        </header>

        <section className="mb-5 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-black">🏫 اختر الفصل</h2><div className="grid gap-3 sm:grid-cols-2">{classroomOptions.map((c) => <button key={c.key} type="button" onClick={() => { setSelectedClassroom(c.key); setSearchText(""); }} className={`rounded-2xl border-2 px-5 py-4 text-lg font-black ${c.key === selectedClassroom ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>{c.key === selectedClassroom ? "✅ " : ""}{c.label}</button>)}</div></article>
          <article className="rounded-3xl border bg-white p-5 shadow-sm"><label className="mb-4 block text-xl font-black">📅 تاريخ السجل</label><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full rounded-2xl border px-4 py-4 text-lg font-bold" /></article>
        </section>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <SummaryCard icon="👥" label="الطلاب" value={summary.total} /><SummaryCard icon="✅" label="حاضر" value={summary.present} /><SummaryCard icon="❌" label="غائب" value={summary.absent} /><SummaryCard icon="⏰" label="متأخر" value={summary.late} /><SummaryCard icon="📝" label="الواجب" value={summary.homework} /><SummaryCard icon="📖" label="القراءة" value={summary.reading} /><SummaryCard icon="✍️" label="الإملاء" value={summary.spelling} />
        </section>

        <section className="mb-5 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-sky-200 bg-sky-50 p-5"><h2 className="mb-3 text-xl font-black text-sky-900">📖 قراءة اليوم</h2><label className="mb-2 block text-sm font-black text-slate-600">عنوان القراءة لجميع الطلاب</label><input value={readingTitle} onChange={(e) => setReadingTitle(e.target.value)} placeholder="مثال: عذرًا يا جدي – ص36" className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 font-bold" /></article>
          <article className="rounded-3xl border border-violet-200 bg-violet-50 p-5"><h2 className="mb-3 text-xl font-black text-violet-900">✍️ إملاء اليوم</h2><div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-black">عنوان الإملاء</span><input value={spellingTitle} onChange={(e) => setSpellingTitle(e.target.value)} placeholder="مثال: كلمات الدرس" className="w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 font-bold" /></label><label><span className="mb-2 block text-sm font-black">عدد الكلمات</span><input type="number" min={0} value={spellingWordCount} onChange={(e) => setSpellingWordCount(Math.max(0, Number(e.target.value) || 0))} className="w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 font-bold" /></label></div></article>
        </section>

        <section className="mb-5 rounded-3xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">⚡ أدوات سريعة</h2><p className="mt-1 text-sm text-slate-500">الجميع حاضر افتراضيًا، غيّر فقط الغائب أو المتأخر.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={markAllPresent} className="rounded-xl bg-emerald-100 px-4 py-3 font-black text-emerald-800">✅ الجميع حاضر</button><button type="button" onClick={loadWeeklyReport} disabled={isWeeklyLoading} className="rounded-xl bg-sky-100 px-4 py-3 font-black text-sky-800 disabled:opacity-60">{isWeeklyLoading ? "⏳ جارٍ إعداد التقرير" : "📊 تقرير الأسبوع"}</button><button type="button" onClick={resetFollowUp} className="rounded-xl bg-amber-100 px-4 py-3 font-black text-amber-800">↻ تصفير المتابعة</button></div></div></section>


        {weeklyRange && (
          <section className="mb-5 overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-sm">
            <div className="border-b border-sky-100 bg-sky-50 p-5">
              <h2 className="text-2xl font-black text-sky-900">📊 تقرير الأسبوع — {currentClassroom.label}</h2>
              <p className="mt-2 font-bold text-sky-700">من {weeklyRange.start} إلى {weeklyRange.end} (الأحد إلى الأربعاء)</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <WeeklySummaryCard label="إنجاز الواجب كاملًا" value={`${weeklySummary.homeworkPercent}%`} />
                <WeeklySummaryCard label="تقييمات القراءة" value={weeklySummary.readingDays} />
                <WeeklySummaryCard label="تقييمات الإملاء" value={weeklySummary.spellingDays} />
                <WeeklySummaryCard label="الحضور" value={weeklySummary.attendance} />
                <WeeklySummaryCard label="الغياب / التأخر" value={`${weeklySummary.absent} / ${weeklySummary.late}`} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-right text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">الطالب</th>
                    <th className="p-3">الواجب</th>
                    <th className="p-3">📖 القراءة</th>
                    <th className="p-3">✍️ الإملاء</th>
                    <th className="p-3">🏫 الحضور</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyReport.map((item) => {
                    const totalDays = item.present + item.absent + item.late;
                    const readingAverage = item.readingDays ? item.readingErrors / item.readingDays : null;
                    const spellingAverage = item.spellingDays ? item.spellingErrors / item.spellingDays : null;
                    const readingLevel = readingAverage === null ? "not-evaluated" : levelFromErrors(Math.round(readingAverage));
                    const spellingLevel = spellingAverage === null ? "not-evaluated" : levelFromErrors(Math.round(spellingAverage));

                    return (
                      <tr key={item.studentId} className="border-t align-top">
                        <td className="p-3 font-black text-slate-800">{item.studentName}</td>
                        <td className="p-3">
                          <div className="font-black text-emerald-700">✅ {item.complete}/{totalDays || 0} كامل</div>
                          <div className="mt-1 text-xs font-bold text-slate-600">
                            🟡 {item.partial} جزئي · ❌ {item.notDone} لم يحل
                          </div>
                        </td>
                        <td className="p-3">
                          {item.readingDays ? (
                            <>
                              <div className="font-black text-sky-800">{item.readingDays}/{totalDays || item.readingDays} أيام · {item.readingErrors} أخطاء</div>
                              <div className="mt-1 text-xs font-black text-sky-600">{awardLabel(readingLevel, "reading")}</div>
                            </>
                          ) : "—"}
                        </td>
                        <td className="p-3">
                          {item.spellingDays ? (
                            <>
                              <div className="font-black text-violet-800">{item.spellingDays}/{totalDays || item.spellingDays} أيام · {item.spellingErrors} أخطاء</div>
                              <div className="mt-1 text-xs font-black text-violet-600">{awardLabel(spellingLevel, "spelling")}</div>
                            </>
                          ) : "—"}
                        </td>
                        <td className="p-3 font-bold">
                          <div>✅ {item.present}/{totalDays || 0} حاضر</div>
                          <div className="mt-1 text-xs">❌ {item.absent} غائب · ⏰ {item.late} متأخر</div>
                        </td>
                      </tr>
                    );
                  })}
                  {!weeklyReport.length && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center font-bold text-slate-500">
                        لا توجد سجلات محفوظة لهذا الأسبوع.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="🔎 ابحث باسم الطالب أو رقمه..." className="mb-4 w-full rounded-2xl border bg-white px-5 py-4 text-lg font-bold shadow-sm" />

        <section className="overflow-hidden rounded-3xl border bg-white shadow-sm"><div className="border-b p-5"><h2 className="text-2xl font-black">👨‍🎓 طلاب {currentClassroom.label}</h2><p className="mt-2 text-slate-500">سجّل عدد الأخطاء فقط؛ اللقب يظهر تلقائيًا. التاج قرار المعلم.</p></div><div className="grid gap-3 p-4">{filteredRecords.map((student) => <StudentRow key={student.studentId} student={student} onUpdate={(changes) => updateStudent(student.studentId, changes)} />)}{!filteredRecords.length && <div className="p-8 text-center font-bold text-slate-500">لا توجد بيانات طلاب لهذا الفصل.</div>}</div></section>

        <button type="button" onClick={handleSave} disabled={isSaving || !records.length} className="mt-6 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-xl font-black text-white shadow-sm disabled:opacity-60">{isSaving ? "⏳ جارٍ حفظ السجل..." : `💾 حفظ سجل ${currentClassroom.label}`}</button>
        {statusMessage && <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-center font-black text-amber-800">{statusMessage}</p>}
      </div>
    </main>
  );
}

function WeeklySummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-white px-3 py-3 text-center shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-sky-900">{value}</p>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return <article className="rounded-2xl border bg-white p-4 text-center shadow-sm"><div className="text-2xl">{icon}</div><p className="mt-2 text-sm font-bold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></article>;
}

function StudentRow({ student, onUpdate }: { student: StudentRecord; onUpdate: (changes: Partial<StudentRecord>) => void }) {
  const [showNote, setShowNote] = useState(Boolean(student.note));

  function setReadingErrors(value: string) {
    const errors = value === "" ? null : Math.max(0, Math.round(Number(value) || 0));
    onUpdate({ readingErrors: errors, readingLevel: levelFromErrors(errors) });
  }

  function setSpellingErrors(value: string) {
    const errors = value === "" ? null : Math.max(0, Math.round(Number(value) || 0));
    onUpdate({ spellingErrors: errors, spellingLevel: levelFromErrors(errors) });
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
      <div className="grid items-center gap-2 lg:grid-cols-[minmax(170px,1.05fr)_minmax(205px,1.15fr)_minmax(250px,1.45fr)_minmax(250px,1.45fr)_minmax(300px,1.7fr)_42px]">
        <div className="min-w-0 px-1">
          <h3 className="truncate text-sm font-black text-slate-800" title={student.studentName}>
            👦 {student.studentName}
          </h3>
          <p dir="ltr" className="mt-0.5 truncate text-right text-[10px] font-bold text-slate-400">
            {student.studentId}
          </p>
        </div>

        <AttendanceSelector
          value={student.attendance}
          onChange={(attendance) => onUpdate({ attendance })}
        />

        <HomeworkSelector
          value={student.homeworkLevel}
          onChange={(homeworkLevel) => onUpdate({ homeworkLevel })}
        />

        <AssessmentBox
          kind="reading"
          errors={student.readingErrors}
          level={student.readingLevel}
          king={student.readingKing}
          onErrors={setReadingErrors}
          onKing={() => onUpdate({ readingKing: !student.readingKing })}
        />

        <AssessmentBox
          kind="spelling"
          errors={student.spellingErrors}
          level={student.spellingLevel}
          king={student.spellingKing}
          onErrors={setSpellingErrors}
          onKing={() => onUpdate({ spellingKing: !student.spellingKing })}
        />

        <button
          type="button"
          onClick={() => setShowNote((current) => !current)}
          title="ملاحظة الطالب"
          aria-label="ملاحظة الطالب"
          className={`grid h-9 w-9 place-items-center rounded-lg border text-base transition ${
            showNote || student.note
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          💬
        </button>
      </div>

      {showNote && (
        <div className="mt-2">
          <input
            autoFocus
            value={student.note}
            onChange={(event) => onUpdate({ note: event.target.value })}
            placeholder="💬 ملاحظة عامة اختيارية لهذا الطالب"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold outline-none focus:border-emerald-400"
          />
        </div>
      )}
    </article>
  );
}

function HomeworkSelector({
  value,
  onChange,
}: {
  value: HomeworkLevel;
  onChange: (value: HomeworkLevel) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg border border-amber-200 bg-amber-50 p-1">
      <button
        type="button"
        onClick={() => onChange("complete")}
        title="الواجب كامل"
        className={`rounded-md px-1 py-2 text-[10px] font-black ${
          value === "complete" ? "bg-emerald-600 text-white" : "bg-white text-emerald-700"
        }`}
      >
        ✅ كامل
      </button>
      <button
        type="button"
        onClick={() => onChange("partial")}
        title="حل جزءًا من الواجب"
        className={`rounded-md px-1 py-2 text-[10px] font-black ${
          value === "partial" ? "bg-amber-500 text-white" : "bg-white text-amber-800"
        }`}
      >
        🟡 جزء
      </button>
      <button
        type="button"
        onClick={() => onChange("not-done")}
        title="لم يحل الواجب"
        className={`rounded-md px-1 py-2 text-[10px] font-black ${
          value === "not-done" ? "bg-rose-600 text-white" : "bg-white text-rose-700"
        }`}
      >
        ❌ لم يحل
      </button>
    </div>
  );
}

function AssessmentBox({
  kind,
  errors,
  level,
  king,
  onErrors,
  onKing,
}: {
  kind: "reading" | "spelling";
  errors: number | null;
  level: AwardLevel;
  king: boolean;
  onErrors: (value: string) => void;
  onKing: () => void;
}) {
  const reading = kind === "reading";

  return (
    <div
      className={`flex min-w-0 items-center gap-1 rounded-lg border p-1 ${
        reading ? "border-sky-200 bg-sky-50" : "border-violet-200 bg-violet-50"
      }`}
    >
      <span className="shrink-0 px-1 text-[11px] font-black">
        {reading ? "📖" : "✍️"}
      </span>

      <input
        type="number"
        min={0}
        inputMode="numeric"
        aria-label={reading ? "عدد أخطاء القراءة" : "عدد أخطاء الإملاء"}
        value={errors ?? ""}
        onChange={(event) => onErrors(event.target.value)}
        placeholder="—"
        className="h-8 w-11 shrink-0 rounded-md border bg-white px-1 text-center text-sm font-black"
      />

      <span
        className={`min-w-0 flex-1 truncate rounded-md bg-white px-1.5 py-2 text-center text-[10px] font-black ${
          king ? "text-amber-700" : "text-slate-700"
        }`}
        title={king ? `ملك ${reading ? "القراءة" : "الإملاء"}` : awardLabel(level, kind)}
      >
        {king ? `👑 ملك ${reading ? "القراءة" : "الإملاء"}` : awardLabel(level, kind)}
      </span>

      <button
        type="button"
        onClick={onKing}
        title={reading ? "منح ملك القراءة" : "منح ملك الإملاء"}
        aria-label={reading ? "منح ملك القراءة" : "منح ملك الإملاء"}
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-sm transition ${
          king ? "bg-amber-400 shadow-sm" : "bg-white text-slate-500"
        }`}
      >
        👑
      </button>
    </div>
  );
}

function AttendanceSelector({
  value,
  onChange,
}: {
  value: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1">
      <button
        type="button"
        onClick={() => onChange("present")}
        title="حاضر"
        className={`rounded-md px-1 py-2 text-[10px] font-black ${
          value === "present" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"
        }`}
      >
        ✅ حاضر
      </button>
      <button
        type="button"
        onClick={() => onChange("absent")}
        title="غائب"
        className={`rounded-md px-1 py-2 text-[10px] font-black ${
          value === "absent" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700"
        }`}
      >
        ❌ غائب
      </button>
      <button
        type="button"
        onClick={() => onChange("late")}
        title="متأخر"
        className={`rounded-md px-1 py-2 text-[10px] font-black ${
          value === "late" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700"
        }`}
      >
        ⏰ متأخر
      </button>
    </div>
  );
}
