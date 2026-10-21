import { Document, Font, Page, Text, View, pdf, StyleSheet } from '@react-pdf/renderer';
import type { MonthlyClassReport } from '../../lib/smartClassReport';

export type MonthlyPdfInput = { report: MonthlyClassReport; classroomLabel: string };
let registered = false;
const styles = StyleSheet.create({
  page: { padding: 28, paddingBottom: 44, fontFamily: 'ClassReportArabic', fontSize: 10, lineHeight: 1.5, textAlign: 'right', color: '#173d2d' },
  title: { fontSize: 19, lineHeight: 1.8, color: '#17674d', marginBottom: 10 },
  box: { backgroundColor: '#edf6f1', padding: 10, marginVertical: 9 },
  row: { flexDirection: 'row-reverse', borderBottomWidth: 0.5, borderColor: '#d1e3d8', paddingVertical: 4 },
  cell: { paddingHorizontal: 5, textAlign: 'right', fontSize: 9, lineHeight: 1.5 },
  footer: { marginTop: 10, fontSize: 8, textAlign: 'center', color: '#607567' },
});
const widths = ['22%', '9%', '16%', '17%', '17%', '12%', '7%'];
const mean = (value: number | null) => value === null ? 'غير متاح' : value.toFixed(1);

export function MonthlyClassReportDocument({ report, classroomLabel }: MonthlyPdfInput) {
  const summary = report.summary;
  const pages = Array.from({ length: Math.max(1, Math.ceil(report.rows.length / 6)) }, (_, index) => report.rows.slice(index * 6, (index + 1) * 6));
  return <Document title={`التقرير الشهري لأداء ${classroomLabel} - ${report.month}`} author="أكاديمية لغتي الرقمية" language="ar">
    <Page size="A4" style={styles.page}>
      <Text>أكاديمية لغتي الرقمية - مادة لغتي</Text>
      <Text style={styles.title}>التقرير الشهري لأداء الفصل</Text>
      <Text>الصف: {classroomLabel}</Text><Text>الفترة: {report.start} إلى {report.end}</Text>
      <View style={styles.box}><Text>عدد الطلاب: {summary.students} | أيام سجل الفصل المحفوظة: {summary.classDays}</Text><Text>سجلات الطلاب المرصودة: {summary.recorded} | سجلات ناقصة ضمن أيام الفصل: {summary.missing}</Text></View>
      <Text style={{ fontSize: 13, marginTop: 10, marginBottom: 8 }}>ملخص أداء الفصل خلال الشهر</Text>
      <Text>الحضور: {summary.present} | الغياب: {summary.absent} | التأخر: {summary.late}</Text><Text>حضور غير مرصود: {summary.attendanceMissing}</Text>
      <Text>الواجب كامل: {summary.complete} | جزئي: {summary.partial} | لم يحل: {summary.notDone}</Text><Text>واجب غير مرصود: {summary.homeworkMissing}</Text>
      <Text>نسبة إنجاز الواجب كاملًا: {summary.homeworkPercent === null ? 'غير متاحة' : `${summary.homeworkPercent}%`}</Text>
      <Text>تقييمات القراءة: {summary.reading.evaluated} | متوسط الأخطاء: {mean(summary.reading.average)}</Text><Text>محسوب من {summary.reading.numeric} تقييمات رقمية.</Text>
      <Text>تقييمات الإملاء: {summary.spelling.evaluated} | متوسط الأخطاء: {mean(summary.spelling.average)}</Text><Text>محسوب من {summary.spelling.numeric} تقييمات رقمية.</Text>
      <Text>المشاركات الصفية المثبتة: {summary.participation}</Text>
      <View style={[styles.box, { marginTop: 16 }]}><Text>طريقة قراءة التقرير</Text>
        <Text>تعتمد النتائج على السجلات التي حفظها المعلم فقط، مع استبعاد الحسابات التجريبية واعتماد آخر إدخال للطالب في اليوم دون تكرار.</Text>
        <Text>النسبة من حالات الواجب المرصودة. الحضور والغياب مجموع حالات الطلاب عبر الأيام؛ والأيام والسجلات الناقصة لا تُحسب غيابًا أو عدم حل.</Text>
        <Text>متوسط الأخطاء من التقييمات الرقمية فقط، ولا تُحوّل المستويات القديمة إلى أعداد أخطاء تقديرية. تختلف صعوبة المهام؛ والمؤشرات وصفية وليست درجات رسمية.</Text>
        <Text>تشمل القائمة طلاب الفصل الحاليين ومن وردوا في سجلات الشهر؛ ولا يعني السجل الناقص ضعف الطالب.</Text>
      </View>
      <Text style={{ marginTop: 12 }}>إعداد المعلم: الأستاذ إبراهيم أحمد</Text>
      <Text style={styles.footer}>أكاديمية لغتي الرقمية - ملخص الفصل</Text>
    </Page>
    {pages.map((rows, pageIndex) => <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
      <Text style={styles.title}>متابعة أداء الطلاب - {classroomLabel}</Text><Text>الفترة: {report.start} إلى {report.end} | أيام سجل الفصل: {summary.classDays}</Text>
      <View style={[styles.row, { backgroundColor: '#edf6f1', marginTop: 10 }]}>{['الطالب', 'أيام الرصد', 'الواجب', 'القراءة', 'الإملاء', 'الحضور', 'المشاركة'].map((label, index) => <Text key={label} style={[styles.cell, { width: widths[index] }]}>{label}</Text>)}</View>
      {rows.map(({ studentId, studentName, report: student }) => {
        const subject = (key: 'reading' | 'spelling') => `التقييمات: ${student[key].evaluated}\nمتوسط الأخطاء: ${mean(student[key].average)}\nمن ${student[key].numeric} تقييمات رقمية`;
        const cells = [studentName, `${student.stats.recorded} أيام\nناقص: ${student.stats.missing}`, `كامل: ${student.stats.complete}\nجزئي: ${student.stats.partial}\nلم يحل: ${student.stats.notDone}\nغير مرصود: ${student.stats.homeworkMissing}`, subject('reading'), subject('spelling'), `حاضر: ${student.stats.present}\nغائب: ${student.stats.absent}\nمتأخر: ${student.stats.late}\nغير مرصود: ${student.stats.attendanceMissing}`, `${student.stats.participation} أيام`];
        return <View key={studentId} wrap={false} style={styles.row}>{cells.map((text, index) => <Text key={index} style={[styles.cell, { width: widths[index] }]}>{text}</Text>)}</View>;
      })}
      <Text style={{ marginTop: 10, fontSize: 8 }}>«غير متاح» يعني عدم وجود تقييم رقمي. البيانات الناقصة لا تُحسب غيابًا أو عدم حل. التفاصيل من السجل المحفوظ فقط.</Text>
      <Text style={styles.footer}>أكاديمية لغتي الرقمية - {classroomLabel} - صفحة التفاصيل {pageIndex + 1} من {pages.length}</Text>
    </Page>)}
  </Document>;
}

export async function downloadMonthlyClassReport(input: MonthlyPdfInput) {
  if (!registered) {
    Font.register({ family: 'ClassReportArabic', src: '/fonts/StudentReportArabic-Regular.ttf' });
    Font.registerHyphenationCallback(word => [word]);
    registered = true;
  }
  const blob = await pdf(<MonthlyClassReportDocument {...input} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `التقرير_الشهري_${input.classroomLabel.replace(/\s+/g, '_')}_${input.report.month}.pdf`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
