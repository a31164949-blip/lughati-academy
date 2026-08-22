const students = [
  { studentId: "student-001", studentName: "أمير عبدالرحمن ناصر ابو عيون", classroom: "الثاني أ", loginCode: "7327" },
  { studentId: "student-002", studentName: "الوليد ابراهيم باشه المحمدي", classroom: "الثاني أ", loginCode: "5514" },
  { studentId: "student-003", studentName: "حسن حسين احمد الهندي", classroom: "الثاني أ", loginCode: "7515" },
  { studentId: "student-004", studentName: "سلمان عيسي زين راجحي", classroom: "الثاني أ", loginCode: "6073" },
  { studentId: "student-005", studentName: "عبدالعزيز علي جودالله العويفي", classroom: "الثاني أ", loginCode: "4599" },
  { studentId: "student-006", studentName: "عبدالله فيصل علي عسيري", classroom: "الثاني أ", loginCode: "5536" },
  { studentId: "student-007", studentName: "عبدالوهاب حمد محمد عسيري", classroom: "الثاني أ", loginCode: "0373" },
  { studentId: "student-008", studentName: "عزام محمد جابر عسيري", classroom: "الثاني أ", loginCode: "3839" },
  { studentId: "student-009", studentName: "علي حسن علي البرشاني", classroom: "الثاني أ", loginCode: "1904" },
  { studentId: "student-010", studentName: "علي زاهر علي عسيري", classroom: "الثاني أ", loginCode: "7434" },
  { studentId: "student-011", studentName: "علي محمد علي عسيري", classroom: "الثاني أ", loginCode: "2283" },
  { studentId: "student-012", studentName: "فواز موسى علي العسيري", classroom: "الثاني أ", loginCode: "6582" },
  { studentId: "student-013", studentName: "محمد بن ابراهيم بن محمد بن عبده ال الساده عسيري", classroom: "الثاني أ", loginCode: "5777" },
  { studentId: "student-014", studentName: "محمد علي بن احمد عسيري", classroom: "الثاني أ", loginCode: "6549" },
  { studentId: "student-015", studentName: "محمد علي جابر عسيري", classroom: "الثاني أ", loginCode: "6376" },
  { studentId: "student-016", studentName: "محمد علي زائد عسيري", classroom: "الثاني أ", loginCode: "2632" },
  { studentId: "student-017", studentName: "مراد مرعي علي عسيري", classroom: "الثاني أ", loginCode: "2977" },
  { studentId: "student-018", studentName: "مسفر محمد مسفر الهلالي", classroom: "الثاني أ", loginCode: "6464" },
  { studentId: "student-019", studentName: "وسام احمد محمد عسيري", classroom: "الثاني أ", loginCode: "9865" },

  { studentId: "student-020", studentName: "أمير جودالله مرعي عسيري", classroom: "الثاني ب", loginCode: "7770" },
  { studentId: "student-021", studentName: "ابراهيم جاويد جمال الدين -", classroom: "الثاني ب", loginCode: "9676" },
  { studentId: "student-022", studentName: "اسحاق ابوبكر عبدالله محمد احمد", classroom: "الثاني ب", loginCode: "5600" },
  { studentId: "student-023", studentName: "الياس حسن زائد عسيري", classroom: "الثاني ب", loginCode: "1654" },
  { studentId: "student-024", studentName: "اياد حسن جابر محمد", classroom: "الثاني ب", loginCode: "9497" },
  { studentId: "student-025", studentName: "حسان راجح علي عسيري", classroom: "الثاني ب", loginCode: "5617" },
  { studentId: "student-026", studentName: "حسن احمد مفرح آل قريعي", classroom: "الثاني ب", loginCode: "8603" },
  { studentId: "student-027", studentName: "حمزة معيض عبدالكريم القرني", classroom: "الثاني ب", loginCode: "7464" },
  { studentId: "student-028", studentName: "عبدالرحمن جمال الدين محمد -", classroom: "الثاني ب", loginCode: "9646" },
  { studentId: "student-029", studentName: "عبدالله جمال الدين محمد -", classroom: "الثاني ب", loginCode: "9616" },
  { studentId: "student-030", studentName: "عبدالله عبدالرحمن جابر عسيري", classroom: "الثاني ب", loginCode: "6457" },
  { studentId: "student-031", studentName: "علي الحسين مفرح آل قريعي", classroom: "الثاني ب", loginCode: "8152" },
  { studentId: "student-032", studentName: "علي بن عبده بن عامر بن ابراهيم آل مكاتله", classroom: "الثاني ب", loginCode: "4125" },
  { studentId: "student-033", studentName: "علي محمد زائد عسيري", classroom: "الثاني ب", loginCode: "3922" },
  { studentId: "student-034", studentName: "فهد ماجد علي جبلي", classroom: "الثاني ب", loginCode: "3116" },
  { studentId: "student-035", studentName: "محمد حمزه بن محمد السيد", classroom: "الثاني ب", loginCode: "2965" },
  { studentId: "student-036", studentName: "محمد سعيد محمد عسيري", classroom: "الثاني ب", loginCode: "0069" },
  { studentId: "student-037", studentName: "محمد عامر محمد عسيري", classroom: "الثاني ب", loginCode: "6803" },
  { studentId: "student-038", studentName: "محمد علي ماضي عسيري", classroom: "الثاني ب", loginCode: "7316" },
  { studentId: "student-039", studentName: "يزن عقيل محمد العسيري", classroom: "الثاني ب", loginCode: "8530" },
];

const secondA = students.filter((student) => student.classroom === "الثاني أ");
const secondB = students.filter((student) => student.classroom === "الثاني ب");

const loginCodes = students.map((student) => student.loginCode);

const duplicateLoginCodes = loginCodes.filter(
  (code, index) => loginCodes.indexOf(code) !== index
);

const invalidLoginCodes = students.filter(
  (student) => !/^\d{4}$/.test(student.loginCode)
);

console.log("إجمالي الطلاب:", students.length);
console.log("الثاني أ:", secondA.length);
console.log("الثاني ب:", secondB.length);
console.log("أرقام دخول مكررة:", [...new Set(duplicateLoginCodes)]);
console.log("أرقام دخول غير صحيحة:", invalidLoginCodes.length);

console.table(students);

if (
  students.length !== 39 ||
  secondA.length !== 19 ||
  secondB.length !== 20 ||
  duplicateLoginCodes.length > 0 ||
  invalidLoginCodes.length > 0
) {
  console.error("❌ المعاينة لم تجتز الفحص.");
  process.exit(1);
}

console.log("✅ المعاينة سليمة: 39 طالبًا، والتوزيع وأرقام الدخول صحيحة.");
console.log("ℹ️ لم تتم كتابة أي بيانات إلى Firebase.");
export { students };