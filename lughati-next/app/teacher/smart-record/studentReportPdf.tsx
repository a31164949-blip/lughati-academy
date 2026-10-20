import { Document, Font, Page, Text, View, pdf, StyleSheet } from '@react-pdf/renderer';
import { reportObservations, type StudentReport } from '../../lib/smartStudentReport';
export type ReportPdfInput = { student: { studentId: string; studentName: string }; classroomLabel: string; start: string; end: string; report: StudentReport };
let registered = false;
const styles = StyleSheet.create({ page: { padding: 30, paddingBottom: 48, fontFamily: 'ReportArabic', fontSize: 10, lineHeight: 1.45, color: '#173d2d', textAlign: 'right' }, title: { fontSize: 18, lineHeight: 1.8, marginBottom: 12, color: '#17674d' }, heading: { fontSize: 12, lineHeight: 1.6, marginTop: 7, marginBottom: 3, color: '#17674d' }, box: { backgroundColor: '#f0f7f2', padding: 8, marginVertical: 6 }, row: { flexDirection: 'row-reverse', borderBottomWidth: 0.5, borderColor: '#cbded0', paddingVertical: 4 }, cell: { width: '20%', paddingHorizontal: 5, fontSize: 10, lineHeight: 1.6, textAlign: 'right' }, footer: { position: 'absolute', bottom: 18, left: 30, width: 535, fontSize: 8, textAlign: 'center', color: '#607567' } });
export function StudentReportDocument({ student, classroomLabel, start, end, report }: ReportPdfInput) {
  const observations = reportObservations(report);
  return <Document title={`تقرير متابعة ${student.studentName}`} author="أكاديمية لغتي الرقمية" language="ar">
    <Page size="A4" style={styles.page}>
      <Text>أكاديمية لغتي الرقمية — مادة لغتي</Text><Text style={styles.title}>تقرير متابعة أداء الطالب</Text>
      <Text>{student.studentName}</Text><Text>الصف: {classroomLabel}</Text><Text>الفترة: {start} — {end}</Text>
      <View style={styles.box}><Text>أيام رصد الطالب: {report.stats.recorded} | سجلات الفصل: {report.stats.classDays}</Text><Text>أيام لم يرد فيها سجل للطالب: {report.stats.missing}</Text><Text>الأيام غير المرصودة لا تُحسب غيابًا.</Text></View>
      <Text style={styles.heading}>الحضور والواجبات والمشاركة</Text>
      <Text>حاضر: {report.stats.present} | غائب: {report.stats.absent} | متأخر: {report.stats.late}</Text><Text>حضور غير مرصود: {report.stats.attendanceMissing}</Text>
      <Text>واجب كامل: {report.stats.complete} | جزئي: {report.stats.partial} | لم يحل: {report.stats.notDone}</Text><Text>واجب غير مرصود: {report.stats.homeworkMissing} | مشاركة مثبتة: {report.stats.participation}</Text>
      {(['reading', 'spelling'] as const).map(subject => <View key={subject}><Text style={styles.heading}>{subject === 'reading' ? 'القراءة' : 'الإملاء'}</Text><Text>التقييمات: {report[subject].evaluated} | دون أخطاء مرصودة: {report[subject].noErrors}</Text><Text>متوسط الأخطاء: {report[subject].average === null ? 'غير متاح' : report[subject].average!.toFixed(1)}؛ من {report[subject].numeric} تقييمات رقمية.</Text><Text>آخر تقييم: {report[subject].latest ? `${report[subject].latest!.date} — ${report[subject].latest![subject].label}` : 'غير متاح'}</Text><Text>{report[subject].trend}</Text></View>)}
      <Text style={styles.heading}>نقاط القوة المثبتة</Text>{(observations.strengths.length ? observations.strengths : ['لا تكفي البيانات لإبراز نقاط قوة محددة.']).map(item => <Text key={item}>• {item}</Text>)}
      <Text style={styles.heading}>متابعة تربوية مقترحة</Text>{(observations.support.length ? observations.support : ['متابعة الرصد والتشجيع وفق حاجة الطالب.']).map(item => <Text key={item}>• {item}</Text>)}
      <Text style={{ marginTop: 14, fontSize: 10 }}>المؤشرات وصف للسجل وليست درجة رسمية أو تشخيصًا. لم تُحوّل المستويات القديمة إلى أعداد أخطاء تقديرية. تعتمد النتائج على ما حفظه المعلم في السجل، وقد تختلف صعوبة المهام.</Text>
      {report.duplicates > 0 && <Text>استُبعد {report.duplicates} تكرارًا؛ واعتمد آخر إدخال لليوم.</Text>}
      <Text fixed style={styles.footer}>أكاديمية لغتي الرقمية — تقرير متابعة الطالب</Text>
    </Page>
    {Array.from({ length: Math.ceil(report.rows.length / 20) }, (_, pageIndex) => <Page key={pageIndex} size="A4" style={styles.page}>
      <Text style={styles.title}>التفصيل اليومي — {student.studentName}</Text>
      <View style={[styles.row, { backgroundColor: '#eaf4ed' }]}>
{['التاريخ', 'الحضور', 'الواجب', 'القراءة', 'الإملاء'].map(label => <Text key={label} style={styles.cell}>{label}</Text>)}</View>
      {report.rows.slice(pageIndex * 20, (pageIndex + 1) * 20).map(row => <View style={styles.row} key={row.date} wrap={false}>{[row.date, row.attendance, row.homework, row.reading.label, row.spelling.label].map((label, index) => <Text key={index} style={styles.cell}>{label}</Text>)}</View>)}
      <Text fixed style={styles.footer}>أكاديمية لغتي الرقمية — تقرير متابعة الطالب</Text>
    </Page>)}
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>عناوين المهام وملاحظات المعلم</Text><Text>{student.studentName}</Text>
      {report.rows.map(row => <View key={row.date} wrap={false} style={{ marginBottom: 9 }}><Text>{row.date}</Text><Text>القراءة: {row.readingTitle || 'لم يسجل عنوان'}؛ الإملاء: {row.spellingTitle || 'لم يسجل عنوان'}{row.spellingWords ? ` — ${row.spellingWords} كلمات` : ''}</Text><Text>المشاركة: {row.participated === true ? 'شارك' : row.participated === false ? 'لم تسجل مشاركة' : 'غير مرصود'}</Text>{row.note && <Text>ملاحظة المعلم: {row.note}</Text>}</View>)}
      <Text fixed style={styles.footer}>أكاديمية لغتي الرقمية — تقرير متابعة الطالب</Text>
    </Page>
  </Document>;
}
export async function downloadStudentReport(input: ReportPdfInput) {
  if (!registered) {
    Font.register({ family: 'ReportArabic', src: '/fonts/StudentReportArabic-Regular.ttf' });
    Font.registerHyphenationCallback(word => [word]);
    registered = true;
  }
  const blob = await pdf(<StudentReportDocument {...input} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = `تقرير_${input.student.studentName.replace(/[^\p{L}\p{N}_-]/gu, '_')}_${input.start}_${input.end}.pdf`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
