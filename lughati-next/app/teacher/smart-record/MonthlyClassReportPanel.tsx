'use client';

import { useRef, useState } from 'react';
import { collection, documentId, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { buildMonthlyClassReport, monthRange, type ClassReportStudent, type MonthlyClassReport } from '../../lib/smartClassReport';
import type { SavedSmartDay } from '../../lib/smartStudentReport';

const button = 'rounded-xl bg-sky-800 px-5 py-3 font-bold text-white disabled:opacity-50';
const average = (value: number | null) => value === null ? 'غير متاح' : value.toFixed(1);

export default function MonthlyClassReportPanel({ students, classroom, classroomLabel, selectedDate, revision }: {
  students: ClassReportStudent[]; classroom: string; classroomLabel: string; selectedDate: string; revision: number;
}) {
  const [month, setMonth] = useState(selectedDate.slice(0, 7));
  const [stored, setStored] = useState<{ report: MonthlyClassReport; revision: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const cache = useRef(new Map<string, SavedSmartDay[]>());
  const inFlight = useRef(false);
  const result = stored?.revision === revision && stored.report.month === month ? stored.report : null;

  async function generate(refresh = false) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true); setError(''); setStored(null);
    try {
      const { dates } = monthRange(month);
      const key = `${classroom}:${month}:${revision}`;
      let source = refresh ? undefined : cache.current.get(key);
      if (!source) {
        // At most 31 exact document IDs, rather than reading the whole collection.
        const batches = [];
        for (let index = 0; index < dates.length; index += 30) {
          const ids = dates.slice(index, index + 30).map(date => `${date}_${classroom}`);
          batches.push(getDocs(query(collection(db, 'smartRecords'), where(documentId(), 'in', ids))));
        }
        const snapshots = await Promise.all(batches);
        source = snapshots.flatMap(snapshot => snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
        if (cache.current.size >= 12) cache.current.clear();
        cache.current.set(key, source);
      }
      setStored({ report: buildMonthlyClassReport(source, students, classroom, month), revision });
    } catch {
      setError('تعذر إعداد التقرير. اختر شهرًا صحيحًا وتحقق من الاتصال وصلاحية حساب المعلم.');
    } finally { inFlight.current = false; setBusy(false); }
  }

  async function download() {
    if (!result || exporting) return;
    setExporting(true); setError('');
    try {
      const { downloadMonthlyClassReport } = await import('./monthlyClassReportPdf');
      await downloadMonthlyClassReport({ report: result, classroomLabel });
    } catch { setError('تعذر إنشاء PDF. حاول مرة أخرى بعد التأكد من الاتصال.'); }
    finally { setExporting(false); }
  }

  return <section id="monthly-class-report" className="mb-6 rounded-3xl border-2 border-sky-200 bg-white p-5 shadow-sm" aria-busy={busy}>
    <h2 className="text-2xl font-black text-sky-900">التقرير الشهري لأداء الفصل — {classroomLabel}</h2>
    <p className="my-3 text-slate-600">ملخص الفصل ونتائج كل طالب من السجل المحفوظ. احفظ تعديلات اليوم أولًا. يشمل الشهر الميلادي المحدد ويستبعد الحسابات التجريبية.</p>
    <div className="flex flex-wrap items-end gap-3">
      <label className="font-bold">شهر التقرير<input type="month" value={month} disabled={busy || exporting} onChange={event => { setMonth(event.target.value); setError(''); }} className="mt-1 block rounded-xl border border-slate-300 p-3" /></label>
      <button type="button" onClick={() => void generate()} disabled={busy || exporting || !month} className={button}>{busy ? 'جارٍ إعداد التقرير…' : 'إعداد التقرير الشهري'}</button>
      <button type="button" onClick={() => void generate(true)} disabled={busy || exporting || !month} className="rounded-xl border border-sky-200 px-4 py-3 font-bold text-sky-900 disabled:opacity-50">تحديث بيانات الشهر</button>
    </div>
    {stored && stored.revision !== revision && <p className="mt-3 text-amber-800" role="status">تم حفظ تغييرات في السجل؛ أعد إعداد التقرير لإظهار البيانات المحدثة.</p>}
    {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
    {result && <article className="mt-5 border-t pt-5" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-black text-sky-900">التقرير الشهري — {classroomLabel}</h3><p className="mt-2">من {result.start} إلى {result.end} · أيام السجل المحفوظة: {result.summary.classDays} · الطلاب: {result.summary.students}</p></div><button type="button" onClick={() => void download()} disabled={exporting || !result.summary.classDays || !result.rows.length} className={button}>{exporting ? 'جارٍ إنشاء PDF…' : 'تحميل تقرير الفصل PDF'}</button></div>
      <div className="my-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[
        ['إنجاز الواجب كاملًا', result.summary.homeworkPercent === null ? 'غير متاح' : `${result.summary.homeworkPercent}%`],
        ['تقييمات القراءة', result.summary.reading.evaluated], ['تقييمات الإملاء', result.summary.spelling.evaluated],
        ['الحضور', result.summary.present], ['الغياب / التأخر', `${result.summary.absent} / ${result.summary.late}`],
      ].map(([label, value]) => <div key={label} className="rounded-xl bg-sky-50 p-4"><p className="text-sm text-sky-900">{label}</p><strong className="mt-2 block text-2xl text-sky-950">{value}</strong></div>)}</div>
      <p className="rounded-xl bg-amber-50 p-3 text-sm leading-7">النسب محسوبة من حالات الواجب المرصودة فقط. الحضور والغياب مجموع حالات الطلاب عبر الأيام. الأيام والسجلات الناقصة لا تُحسب غيابًا أو عدم حل. متوسط الأخطاء من التقييمات الرقمية فقط، والمستويات القديمة تبقى وصفية. تشمل القائمة طلاب الفصل الحاليين ومن وردوا في سجلات الشهر.</p>
      <p className="my-3 text-sm text-slate-600">حضور غير مرصود: {result.summary.attendanceMissing} · واجب غير مرصود: {result.summary.homeworkMissing} · سجلات طلاب ناقصة ضمن أيام الفصل: {result.summary.missing} · مشاركات صفية مثبتة: {result.summary.participation}</p>
      {!result.summary.classDays ? <p className="rounded-xl bg-slate-50 p-6 text-center font-bold">لا توجد سجلات محفوظة لهذا الفصل خلال الشهر المحدد.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-right text-sm"><caption className="mb-3 text-right font-bold">متابعة أداء طلاب {classroomLabel} خلال الشهر — المؤشرات وصفية وليست درجات رسمية</caption><thead className="bg-sky-50"><tr>{['الطالب وأيام الرصد', 'الواجب', 'القراءة', 'الإملاء', 'الحضور والغياب', 'المشاركة'].map(label => <th key={label} scope="col" className="p-3">{label}</th>)}</tr></thead><tbody>{result.rows.map(({ studentId, studentName, report }) => <tr key={studentId} className="border-t align-top">
        <th scope="row" className="p-3 font-normal"><strong>{studentName}</strong><p className="mt-2 text-xs text-slate-600">{report.stats.recorded} أيام رصد · {report.stats.missing} سجل ناقص</p></th>
        <td className="p-3"><p>كامل: {report.stats.complete} · جزئي: {report.stats.partial}</p><p>لم يحل: {report.stats.notDone}</p><p className="text-xs text-slate-500">غير مرصود: {report.stats.homeworkMissing}</p></td>
        {(['reading', 'spelling'] as const).map(subject => <td key={subject} className="p-3"><p>التقييمات: {report[subject].evaluated}</p><p>متوسط الأخطاء: {average(report[subject].average)}</p><p className="text-xs text-slate-500">من {report[subject].numeric} تقييمات رقمية</p><p className="mt-1 text-xs">آخر تقييم: {report[subject].latest ? report[subject].latest![subject].label : 'لم يُقيّم'}</p></td>)}
        <td className="p-3"><p>حاضر: {report.stats.present} · غائب: {report.stats.absent}</p><p>متأخر: {report.stats.late}</p><p className="text-xs text-slate-500">غير مرصود: {report.stats.attendanceMissing}</p></td><td className="p-3">{report.stats.participation} أيام</td>
      </tr>)}</tbody></table></div>}
    </article>}
  </section>;
}
