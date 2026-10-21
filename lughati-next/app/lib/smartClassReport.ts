import { buildStudentReport, isTrialStudent, rangeDates, type SavedSmartDay } from './smartStudentReport';

export type ClassReportStudent = { studentId: string; studentName: string; isTrial?: boolean };

export function monthRange(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) throw Error('اختر شهرًا صحيحًا.');
  const start = `${month}-01`;
  const date = new Date(`${start}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 7) !== month) throw Error('اختر شهرًا صحيحًا.');
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  const end = date.toISOString().slice(0, 10);
  return { start, end, dates: rangeDates(start, end) };
}

export function buildMonthlyClassReport(source: SavedSmartDay[], roster: ClassReportStudent[], classroom: string, month: string) {
  const { start, end, dates } = monthRange(month);
  const expectedIds = new Set(dates.map(date => `${date}_${classroom}`));
  // Canonical IDs prevent another classroom or a duplicated day from entering the report.
  const days = [...new Map(source.filter(day => expectedIds.has(day.id)).map(day => [day.id, day])).values()];
  const students = new Map(roster.map(student => [student.studentId, student]));
  const excludedIds = new Set(roster.filter(student => student.isTrial || isTrialStudent(student.studentName)).map(student => student.studentId));
  for (const day of days) {
    for (const record of Array.isArray(day.data.records) ? day.data.records : []) {
      if (!record || typeof record !== 'object' || typeof record.studentId !== 'string') continue;
      const name = typeof record.studentName === 'string' ? record.studentName : record.studentId;
      if (record.isTrial || record.isTestAccount || record.isTest || record.isDemo || isTrialStudent(name)) excludedIds.add(record.studentId);
      if (!students.has(record.studentId)) students.set(record.studentId, { studentId: record.studentId, studentName: name });
    }
  }
  const rows = [...students.values()]
    .filter(student => !excludedIds.has(student.studentId))
    .sort((a, b) => a.studentName.localeCompare(b.studentName, 'ar'))
    .map(student => ({ ...student, report: buildStudentReport(days, student.studentId, start, end) }));
  const total = (field: keyof (typeof rows)[number]['report']['stats']) => rows.reduce((sum, row) => sum + row.report.stats[field], 0);
  const homeworkRecorded = total('complete') + total('partial') + total('notDone');
  const subject = (key: 'reading' | 'spelling') => {
    const numeric = rows.reduce((sum, row) => sum + row.report[key].numeric, 0);
    const errors = rows.reduce((sum, row) => sum + row.report[key].sum, 0);
    return { evaluated: rows.reduce((sum, row) => sum + row.report[key].evaluated, 0), numeric, errors, average: numeric ? errors / numeric : null };
  };
  return {
    month, start, end, rows,
    summary: {
      students: rows.length, classDays: days.length, recorded: total('recorded'), missing: total('missing'),
      present: total('present'), absent: total('absent'), late: total('late'), attendanceMissing: total('attendanceMissing'),
      complete: total('complete'), partial: total('partial'), notDone: total('notDone'), homeworkMissing: total('homeworkMissing'),
      homeworkPercent: homeworkRecorded ? Math.round(total('complete') / homeworkRecorded * 100) : null,
      participation: total('participation'), reading: subject('reading'), spelling: subject('spelling'),
    },
  };
}

export type MonthlyClassReport = ReturnType<typeof buildMonthlyClassReport>;
