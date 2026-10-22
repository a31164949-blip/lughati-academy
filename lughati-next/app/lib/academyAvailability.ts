// Temporary student closure. Teacher access and stored student records stay available.
export const STUDENT_ACADEMY_PAUSED = true;
// One existing test account is permitted to preview the student interface.
// Match its authenticated Firestore document ID, never a name or URL parameter.
export const STUDENT_PREVIEW_ENABLED = true;
export const STUDENT_PREVIEW_DOC_ID = "student-040";
export function isStudentPreviewAccount(studentDocId: unknown) {
  return STUDENT_PREVIEW_ENABLED && studentDocId === STUDENT_PREVIEW_DOC_ID;
}
export const STUDENT_PAUSE_MESSAGE = {
  title: "إغلاق مؤقت لخدمات الأكاديمية للطلاب",
  paragraphs: [
    "أولياء الأمور الكرام، السلام عليكم ورحمة الله وبركاته.",
    "نظرًا إلى انخفاض مستوى التفاعل مع برامج الأكاديمية، تقرر إغلاق خدماتها للطلاب مؤقتًا، على أن تستمر متابعة المستوى الدراسي والواجبات والخطط الأسبوعية عبر منصة مدرستي.",
    "سيكون تقويم الإملاء من خلال الإملاء الاختباري للكلمات والمهارات التي تعلمها الطالب وتدرّب عليها، ويُرجى متابعة ما يُنشر في منصة مدرستي.",
    "وسيُقوَّم الطالب في مهارات القراءة وفق معايير مادة لغتي المعتمدة للصف الثاني، من خلال مهام قرائية مناسبة لما تعلمه وتدرّب عليه، مع مراعاة الفروق الفردية، وتوثيق أدائه الفعلي، وتقديم الدعم العلاجي عند الحاجة.",
    "نشكر الأسر والطلاب الذين واصلوا المشاركة، ونؤكد أن تعاون الأسرة والمدرسة أساس تقدّم أبنائنا. وفق الله الجميع.",
  ],
};
