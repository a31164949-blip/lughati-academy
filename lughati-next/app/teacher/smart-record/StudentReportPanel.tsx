"use client";
import { useRef, useState } from 'react';
import { collection, documentId, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { buildStudentReport, isTrialStudent, rangeDates, reportObservations, type SavedSmartDay, type StudentReport } from '../../lib/smartStudentReport';

type Student = { studentId: string; studentName: string; isTrial?: boolean };
const field = 'rounded-xl border border-slate-300 bg-white p-3';
const button = 'rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white disabled:opacity-50';
export default function StudentReportPanel({ students, classroom, classroomLabel, selectedDate, requestedStudent, onStudentChange }: { students: Student[]; classroom: string; classroomLabel: string; selectedDate: string; requestedStudent: string; onStudentChange: (id: string) => void }) {
  const [start, setStart] = useState('2026-09-04');
  const [end, setEnd] = useState(selectedDate);
  const [storedResult, setResult] = useState<{ report: StudentReport; student: Student; start: string; end: string } | null>(null);
  const [busy, setBusy] = useState(false), [exporting, setExporting] = useState(false), [error, setError] = useState('');
  const cache = useRef(new Map<string, SavedSmartDay[]>());
  const candidates = students.filter(student => !student.isTrial && !isTrialStudent(student.studentName));
  const selectedId = candidates.some(student => student.studentId === requestedStudent) ? requestedStudent : candidates[0]?.studentId || '';
  const result = storedResult?.student.studentId === selectedId ? storedResult : null;
  async function generate(refresh = false) {
    if (busy) return;
    setError(''); setBusy(true); setResult(null);
    try {
      const student = candidates.find(item => item.studentId === selectedId);
      if (!student) throw Error('اختر طالبًا من الفصل، مع استبعاد الحساب التجريبي.');
      const dates = rangeDates(start, end);
      const key = `${classroom}:${start}:${end}`;
      let source = refresh ? undefined : cache.current.get(key);
      if (!source) {
        source = [];
        // Read only known date/class document IDs, in bounded batches, on demand.
        for (let i = 0; i < dates.length; i += 30) {
          const ids = dates.slice(i, i + 30).map(date => `${date}_${classroom}`);
          const snapshot = await getDocs(query(collection(db, 'smartRecords'), where(documentId(), 'in', ids)));
          source.push(...snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
        }
        cache.current.set(key, source);
      }
      setResult({ student, start, end, report: buildStudentReport(source, student.studentId, start, end) });
    } catch (error) { setError(error instanceof Error ? error.message : 'تعذر إعداد التقرير. تحقق من دخول المعلم والصلاحيات.'); }
    finally { setBusy(false); }
  }
  async function download() {
    if (!result || exporting) return;
    setExporting(true); setError('');
    try {
      const { downloadStudentReport } = await import('./studentReportPdf');
      await downloadStudentReport({ ...result, classroomLabel });
    } catch { setError('تعذر إنشاء PDF. حاول مرة أخرى بعد التأكد من الاتصال.'); }
    finally { setExporting(false); }
  }
  function preset(days: number) {
    const date = new Date(end + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() - days + 1);
    setStart(date.toISOString().slice(0, 10));
  }
  const report = result?.report;
  const observations = report ? reportObservations(report) : null;
  return <section id="student-smart-report" className="mb-6 rounded-3xl border-2 border-emerald-200 bg-white p-5 shadow-sm" aria-busy={busy}>
    <h2 className="text-2xl font-black text-emerald-900">تقرير الطالب المفصّل</h2>
    <p className="my-3 text-slate-600">يعتمد على السجلات المحفوظة فقط. احفظ تعديلات اليوم أولًا. اختيار طالب آخر للفترة نفسها يعيد استخدام البيانات المحمّلة.</p>
    <div className="grid gap-3 sm:grid-cols-3"><label>الطالب<select className={`${field} mt-1 w-full`} value={selectedId} disabled={busy || exporting} onChange={event => { onStudentChange(event.target.value); setResult(null); }}>{candidates.map(student => <option key={student.studentId} value={student.studentId}>{student.studentName}</option>)}</select></label>
      <label>من تاريخ<input aria-label="بداية فترة التقرير" type="date" value={start} disabled={busy || exporting} onChange={event => { setStart(event.target.value); setResult(null); }} className={`${field} mt-1 w-full`} /></label>
      <label>إلى تاريخ<input aria-label="نهاية فترة التقرير" type="date" value={end} disabled={busy || exporting} onChange={event => { setEnd(event.target.value); setResult(null); }} className={`${field} mt-1 w-full`} /></label></div>
    <div className="my-4 flex flex-wrap gap-3"><button type="button" disabled={busy || exporting} className={field} onClick={() => { preset(7); setResult(null); }}>آخر أسبوع</button><button type="button" disabled={busy || exporting} className={field} onClick={() => { preset(49); setResult(null); }}>آخر ٧ أسابيع</button><button type="button" disabled={busy || exporting} className={field} onClick={() => { setStart('2026-09-04'); setResult(null); }}>الفترة الأولى من ٤ سبتمبر</button><button type="button" disabled={busy || exporting || !candidates.length} className={button} onClick={() => void generate()}>{busy ? 'جارٍ إعداد التقرير…' : 'إعداد التقرير'}</button><button type="button" disabled={busy || exporting} className={field} onClick={() => void generate(true)}>تحديث البيانات وإعداد التقرير</button></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    {result && report && observations && <article className="mt-5 border-t pt-5" aria-live="polite">
      <h3 className="text-xl font-black">تقرير متابعة أداء الطالب: {result.student.studentName}</h3><p className="my-2">مادة لغتي — الصف {classroomLabel} — من {result.start} إلى {result.end}</p>
      <p className="rounded-xl bg-amber-50 p-3">أيام الرصد للطالب: {report.stats.recorded}؛ سجلات الفصل المحفوظة: {report.stats.classDays}؛ أيام لم يرد فيها سجل للطالب: {report.stats.missing}. الأيام غير المرصودة لا تُحسب غيابًا. {report.duplicates > 0 && `استُبعد ${report.duplicates} تكرارًا، واعتمد آخر إدخال لليوم.`}</p>
      <div className="my-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        ['الحضور / الغياب / التأخر', `${report.stats.present} / ${report.stats.absent} / ${report.stats.late}`],
        ['الواجب كامل / جزئي / لم يحل', `${report.stats.complete} / ${report.stats.partial} / ${report.stats.notDone}`],
        ['تقييمات القراءة / بلا أخطاء', `${report.reading.evaluated} / ${report.reading.noErrors}`],
        ['تقييمات الإملاء / بلا أخطاء', `${report.spelling.evaluated} / ${report.spelling.noErrors}`],
      ].map(([label, value]) => <div key={label} className="rounded-xl bg-emerald-50 p-4"><p>{label}</p><strong className="text-2xl">{value}</strong></div>)}</div>
      <p>حضور غير مرصود: {report.stats.attendanceMissing}؛ واجب غير مرصود: {report.stats.homeworkMissing}؛ مشاركة صفية مثبتة: {report.stats.participation}.</p>
      {(['reading', 'spelling'] as const).map(subject => <div key={subject} className="my-3 rounded-xl border p-4"><h4 className="font-black">{subject === 'reading' ? 'القراءة' : 'الإملاء'} — وصف الأداء المرصود</h4><p>آخر تقييم: {report[subject].latest ? `${report[subject].latest!.date} — ${report[subject].latest![subject].label}` : 'لا توجد تقييمات.'}</p><p>متوسط الأخطاء: {report[subject].average === null ? 'غير متاح' : report[subject].average!.toFixed(1)}؛ محسوب من {report[subject].numeric} تقييمات رقمية فقط.</p><p>{report[subject].trend}</p></div>)}
      <h4 className="mt-4 font-black">نقاط القوة المثبتة</h4><ul className="list-inside list-disc">{(observations.strengths.length ? observations.strengths : ['لا تكفي البيانات لإبراز نقاط قوة محددة.']).map(item => <li key={item}>{item}</li>)}</ul>
      <h4 className="mt-4 font-black">متابعة تربوية مقترحة للمعلم</h4><ul className="list-inside list-disc">{(observations.support.length ? observations.support : ['متابعة الرصد والتشجيع وفق حاجة الطالب.']).map(item => <li key={item}>{item}</li>)}</ul>
      <p className="my-3 text-sm text-slate-600">المؤشرات وصف للسجل وليست درجة رسمية أو تشخيصًا. لم تُحوّل المستويات القديمة إلى أعداد أخطاء تقديرية، ولا يُستدل من غياب تقييم على ضعف الطالب.</p>
      <button type="button" className={button} disabled={exporting || !report.rows.length} onClick={() => void download()}>{exporting ? 'جارٍ إنشاء PDF…' : 'تحميل تقرير PDF'}</button>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[900px] text-right text-sm"><caption className="mb-3 text-right font-black">التفصيل اليومي — {report.rows.length} أيام رصد</caption><thead><tr>{['التاريخ', 'الحضور', 'الواجب', 'القراءة وعنوانها', 'الإملاء وعنوانه', 'المشاركة', 'ملاحظة المعلم'].map(label => <th key={label} className="border bg-emerald-50 p-3">{label}</th>)}</tr></thead><tbody>{report.rows.map(row => <tr key={row.date}><td className="border p-3">{row.date}</td><td className="border p-3">{row.attendance}</td><td className="border p-3">{row.homework}</td><td className="border p-3">{row.reading.label}<br />{row.readingTitle}</td><td className="border p-3">{row.spelling.label}<br />{row.spellingTitle}{row.spellingWords && ` — ${row.spellingWords} كلمات`}</td><td className="border p-3">{row.participated === true ? 'شارك' : row.participated === false ? 'لم تسجل مشاركة' : 'غير مرصود'}</td><td className="whitespace-pre-wrap border p-3">{row.note || '—'}</td></tr>)}</tbody></table></div>
      {!report.rows.length && <p className="my-3">لا توجد سجلات محفوظة لهذا الطالب خلال الفترة المختارة.</p>}
    </article>}
  </section>;
}
