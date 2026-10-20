export type SavedSmartDay = { id: string; data: Record<string, unknown> };
export type Assessment = { errors: number | null; label: string; evaluated: boolean };
export type StudentDay = { date: string; attendance: string; homework: string; reading: Assessment; spelling: Assessment; readingTitle: string; spellingTitle: string; spellingWords: number | null; participated: boolean | null; note: string };
export const isTrialStudent = (name: string) => /تجريب|\btest\b|\bdemo\b/i.test(name);
export function rangeDates(start: string, end: string) {
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T12:00:00Z')) && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
  if (!valid(start) || !valid(end) || start > end) throw Error('اختر تاريخ بداية ونهاية صحيحين.');
  const dates: string[] = [];
  for (let time = Date.parse(start + 'T12:00:00Z'); time <= Date.parse(end + 'T12:00:00Z'); time += 86400000) {
    if (dates.length >= 200) throw Error('اختر فترة لا تتجاوز ٢٠٠ يوم، ثم قسّم الفترات الأطول إلى تقارير مستقلة.');
    dates.push(new Date(time).toISOString().slice(0, 10));
  }
  return dates;
}
function assessment(value: Record<string, unknown>, subject: 'reading' | 'spelling'): Assessment {
  const errors = value[subject + 'Errors'];
  const count = typeof errors === 'number' && Number.isFinite(errors) && errors >= 0 ? errors : null;
  const old = value[subject + 'Level'];
  const oldLabels: Record<string, string> = { mastered: 'متقن', 'very-good': 'جيد جدًا', good: 'جيد', 'needs-practice': 'يحتاج تدريبًا', 'intensive-support': 'يحتاج دعمًا مكثفًا', prince: 'أمير', hero: 'بطل', star: 'نجم', diligent: 'مجتهد' };
  const label = count !== null ? `${count} أخطاء` : typeof old === 'string' ? oldLabels[old] || 'لم يُقيّم' : 'لم يُقيّم';
  return { errors: count, label, evaluated: count !== null || label !== 'لم يُقيّم' };
}
export function buildStudentReport(source: SavedSmartDay[], studentId: string, start: string, end: string) {
  const days = new Map<string, StudentDay>();
  const classDays = new Set<string>();
  let duplicates = 0;
  for (const saved of source) {
    const date = saved.id.slice(0, 10);
    if (date < start || date > end) continue;
    classDays.add(date);
    const records = Array.isArray(saved.data.records) ? saved.data.records : [];
    const matching = records.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && item.studentId === studentId);
    if (!matching.length) continue;
    const value = matching.at(-1)!;
    duplicates += matching.length - 1 + (days.has(date) ? 1 : 0);
    const homework = value.homeworkLevel;
    const hw = ['complete', 'mastered', 'complete-minor-errors', 'most-completed'].includes(String(homework)) ? 'كامل' : ['partial', 'needs-redo'].includes(String(homework)) ? 'جزئي' : homework === 'not-done' ? 'لم يحل' : value.homeworkCompleted === true ? 'كامل' : value.homeworkCompleted === false ? 'لم يحل' : 'غير مرصود';
    days.set(date, {
      date,
      attendance: value.attendance === 'present' ? 'حاضر' : value.attendance === 'absent' ? 'غائب' : value.attendance === 'late' ? 'متأخر' : 'غير مرصود',
      homework: hw,
      reading: assessment(value, 'reading'), spelling: assessment(value, 'spelling'),
      readingTitle: typeof saved.data.readingTitle === 'string' ? saved.data.readingTitle : '',
      spellingTitle: typeof saved.data.spellingTitle === 'string' ? saved.data.spellingTitle : typeof saved.data.spellingTextName === 'string' ? saved.data.spellingTextName : '',
      spellingWords: typeof saved.data.spellingWordCount === 'number' && saved.data.spellingWordCount > 0 ? saved.data.spellingWordCount : null,
      participated: typeof value.participated === 'boolean' ? value.participated : null,
      note: typeof value.note === 'string' ? value.note : '',
    });
  }
  const rows = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  const count = (field: 'attendance' | 'homework', label: string) => rows.filter(day => day[field] === label).length;
  const stats = { recorded: rows.length, classDays: classDays.size, missing: classDays.size - rows.length, present: count('attendance', 'حاضر'), absent: count('attendance', 'غائب'), late: count('attendance', 'متأخر'), attendanceMissing: count('attendance', 'غير مرصود'), complete: count('homework', 'كامل'), partial: count('homework', 'جزئي'), notDone: count('homework', 'لم يحل'), homeworkMissing: count('homework', 'غير مرصود'), participation: rows.filter(day => day.participated === true).length };
  function subjectSummary(subject: 'reading' | 'spelling') {
    const evaluated = rows.filter(day => day[subject].evaluated);
    const numeric = rows.filter(day => day[subject].errors !== null);
    const sum = numeric.reduce((total, day) => total + day[subject].errors!, 0);
    const average = numeric.length ? sum / numeric.length : null;
    let trend = 'لا تكفي البيانات الرقمية لمقارنة بدايات الفترة ونهايتها.';
    if (numeric.length >= 4) {
      const n = Math.min(3, Math.floor(numeric.length / 2));
      const mean = (group: StudentDay[]) => group.reduce((total, day) => total + day[subject].errors!, 0) / group.length;
      const first = mean(numeric.slice(0, n)), last = mean(numeric.slice(-n));
      trend = `متوسط أول ${n} تقييمات: ${first.toFixed(1)} خطأ؛ وآخر ${n}: ${last.toFixed(1)} خطأ. ${last < first ? 'انخفضت الأخطاء المرصودة.' : last > first ? 'ارتفعت الأخطاء المرصودة.' : 'استقر متوسط الأخطاء.'} تختلف صعوبة النصوص وعدد الكلمات؛ لذا فالمقارنة وصفية.`;
    }
    return { evaluated: evaluated.length, numeric: numeric.length, sum, average, noErrors: numeric.filter(day => day[subject].errors === 0).length, latest: evaluated.at(-1), trend };
  }
  return { rows, stats, duplicates, reading: subjectSummary('reading'), spelling: subjectSummary('spelling') };
}
export type StudentReport = ReturnType<typeof buildStudentReport>;
export function reportObservations(report: StudentReport) {
  const strengths: string[] = [], support: string[] = [];
  if (report.stats.complete) strengths.push(`أكمل الواجب في ${report.stats.complete} يومًا من أيام الرصد.`);
  if (report.reading.noErrors) strengths.push(`قرأ دون أخطاء مرصودة في ${report.reading.noErrors} تقييمات.`);
  if (report.spelling.noErrors) strengths.push(`كتب دون أخطاء مرصودة في ${report.spelling.noErrors} تقييمات إملائية.`);
  if (report.stats.participation) strengths.push(`سُجلت له مشاركة صفية في ${report.stats.participation} يومًا.`);
  if (report.stats.absent || report.stats.late) support.push('متابعة أسباب الغياب والتأخر بالتعاون مع الأسرة وتعويض ما فاته.');
  if (report.stats.partial || report.stats.notDone) support.push('تجزئة الواجب ومتابعة إنجازه بانتظام مع الأسرة.');
  if (report.reading.sum) support.push('تدريب قرائي قصير ومتدرج على مواضع الخطأ التي يحددها المعلم.');
  if (report.spelling.sum) support.push('تدريب على الكلمات والمهارات الإملائية التي ظهرت فيها أخطاء، ثم إعادة التقويم.');
  return { strengths, support };
}
