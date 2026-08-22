import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

import {
  students,
} from "./preview-real-students.mjs";

const CONFIRM_IMPORT =
  process.env.CONFIRM_IMPORT === "YES";

function validateStudents() {
  const secondA = students.filter(
    (student) =>
      student.classroom === "الثاني أ"
  );

  const secondB = students.filter(
    (student) =>
      student.classroom === "الثاني ب"
  );

  const loginCodes =
    students.map(
      (student) => student.loginCode
    );

  const duplicateLoginCodes =
    loginCodes.filter(
      (code, index) =>
        loginCodes.indexOf(code) !==
        index
    );

  const invalidLoginCodes =
    students.filter(
      (student) =>
        !/^\d{4}$/.test(
          student.loginCode
        )
    );

  if (
    students.length !== 39 ||
    secondA.length !== 19 ||
    secondB.length !== 20 ||
    duplicateLoginCodes.length > 0 ||
    invalidLoginCodes.length > 0
  ) {
    throw new Error(
      "فشل التحقق من بيانات الطلاب. تم إيقاف الاستيراد."
    );
  }
}

function getAdminDatabase() {
  const projectId =
    process.env
      .FIREBASE_ADMIN_PROJECT_ID;

  const clientEmail =
    process.env
      .FIREBASE_ADMIN_CLIENT_EMAIL;

  const rawPrivateKey =
    process.env
      .FIREBASE_ADMIN_PRIVATE_KEY;

  if (
    !projectId ||
    !clientEmail ||
    !rawPrivateKey
  ) {
    throw new Error(
      [
        "متغيرات Firebase Admin غير متاحة.",
        "المطلوب:",
        "FIREBASE_ADMIN_PROJECT_ID",
        "FIREBASE_ADMIN_CLIENT_EMAIL",
        "FIREBASE_ADMIN_PRIVATE_KEY",
      ].join("\n")
    );
  }

  const privateKey =
    rawPrivateKey.replace(
      /\\n/g,
      "\n"
    );

  const adminApp =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

  return getFirestore(adminApp);
}

function createStudentData(
  student
) {
  return {
    studentId:
      student.studentId,

    studentName:
      student.studentName,

    classroom:
      student.classroom,

    loginCode:
      student.loginCode,

    active: true,
    temporary: false,

    points: 0,
    stars: 0,

    badges: [],

    attendanceHistory: [],
    dailyTaskRewardKeys: [],
    pointsHistory: [],
    readingHistory: [],
    spellingHistory: [],

    journey: {
      currentLevel: 1,
      currentPath: "",
      lastActivityAt: null,
      lastCompletedDate: "",
      streak: 0,
      xp: 0,
    },

    selectedAvatar:
      "boy-1",

    selectedAvatarIcon:
      "👦🏻",

    selectedAvatarName:
      "الفارس الصغير",

    teacherMessage: "",
    teacherMessageUpdatedAt:
      null,

    smartFollowUp: {
      date: "",
      homeworkCompleted: false,
      homeworkLabel:
        "⌛ لم يُنجز الواجب",
      homeworkLevel:
        "not-done",
      note: "",
      participated: false,
      readingAccuracy:
        "not-evaluated",
      readingAccuracyLabel:
        "⌛ لم يُقيّم",
      readingCompleted: false,
      readingDiacritics:
        "not-evaluated",
      readingDiacriticsLabel:
        "⌛ لم يُقيّم",
      readingFluency:
        "not-evaluated",
      readingFluencyLabel:
        "⌛ لم يُقيّم",
      readingLevel:
        "not-evaluated",
      readingLevelLabel:
        "⌛ لم يُقيّم بعد",
      readingNote: "",
    },

    createdAt:
      FieldValue.serverTimestamp(),

    updatedAt:
      FieldValue.serverTimestamp(),
  };
}

async function main() {
  validateStudents();

  console.log(
    "\n=== استيراد الطلاب الحقيقيين ==="
  );

  console.log(
    "إجمالي الطلاب:",
    students.length
  );

  console.log(
    "الثاني أ:",
    students.filter(
      (student) =>
        student.classroom ===
        "الثاني أ"
    ).length
  );

  console.log(
    "الثاني ب:",
    students.filter(
      (student) =>
        student.classroom ===
        "الثاني ب"
    ).length
  );

  console.table(
    students.map(
      (student) => ({
        studentId:
          student.studentId,
        studentName:
          student.studentName,
        classroom:
          student.classroom,
        loginCode:
          student.loginCode,
      })
    )
  );

  if (!CONFIRM_IMPORT) {
    console.log(
      "\n🛡️ وضع الحماية مفعل."
    );

    console.log(
      "لم تتم كتابة أي بيانات إلى Firebase."
    );

    console.log(
      "\nللاستيراد الفعلي استخدم:"
    );

    console.log(
      "CONFIRM_IMPORT=YES node scripts/import-real-students.mjs"
    );

    return;
  }

  const db =
    getAdminDatabase();

  const batch =
    db.batch();

  for (
    const student of students
  ) {
    const studentReference =
      db
        .collection("students")
        .doc(
          student.studentId
        );

    batch.set(
      studentReference,
      createStudentData(
        student
      )
    );
  }

  console.log(
    "\n⏳ جاري كتابة 39 طالبًا إلى Firestore..."
  );

  await batch.commit();

  console.log(
    "✅ تم استيراد 39 طالبًا بنجاح."
  );

  console.log(
    "✅ الثاني أ: 19 طالبًا."
  );

  console.log(
    "✅ الثاني ب: 20 طالبًا."
  );

  console.log(
    "✅ أرقام الدخول محفوظة كنص من 4 خانات."
  );

  console.log(
    "ℹ️ لم يتم حذف أي مستند خارج student-001 إلى student-039."
  );
}

main().catch(
  (error) => {
    console.error(
      "\n❌ فشل الاستيراد:"
    );

    console.error(error);

    process.exit(1);
  }
);