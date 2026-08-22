import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getFirestore,
} from "firebase-admin/firestore";

function getAdminDatabase() {
  const projectId =
    (
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      ""
    ).trim();

  const clientEmail =
    (
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
      ""
    ).trim();

  const rawPrivateKey =
    process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    "";

  if (
    !projectId ||
    !clientEmail ||
    !rawPrivateKey
  ) {
    throw new Error(
      "متغيرات Firebase Admin غير متاحة."
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

function getStudentNumber(id) {
  const match =
    id.match(
      /^student-(\d+)$/
    );

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

async function main() {
  const db =
    getAdminDatabase();

  const snapshot =
    await db
      .collection("students")
      .get();

  const candidates =
    snapshot.docs
      .map((document) => {
        const data =
          document.data();

        return {
          id: document.id,
          number:
            getStudentNumber(
              document.id
            ),
          studentName:
            typeof data.studentName ===
            "string"
              ? data.studentName
              : "",
          classroom:
            typeof data.classroom ===
            "string"
              ? data.classroom
              : "",
          loginCode:
            typeof data.loginCode ===
            "string"
              ? data.loginCode
              : "",
          temporary:
            data.temporary === true,
          active:
            data.active === true,
        };
      })
      .filter(
        (student) =>
          student.number !== null &&
          student.number >= 40
      )
      .sort(
        (a, b) =>
          a.number - b.number
      );

  console.log(
    "\n=== معاينة الحسابات بعد student-039 ==="
  );

  console.log(
    "العدد:",
    candidates.length
  );

  console.table(
    candidates.map(
      (student) => ({
        id: student.id,
        studentName:
          student.studentName,
        classroom:
          student.classroom,
        loginCode:
          student.loginCode,
        temporary:
          student.temporary,
        active:
          student.active,
      })
    )
  );

  const temporaryOnly =
    candidates.filter(
      (student) =>
        student.temporary === true
    );

  console.log(
    "\nالحسابات المؤقتة:",
    temporaryOnly.length
  );

  console.log(
    "🛡️ هذه معاينة فقط، ولم يتم حذف أو تعديل أي طالب."
  );
}

main().catch(
  (error) => {
    console.error(
      "\n❌ فشلت المعاينة:"
    );

    console.error(error);

    process.exit(1);
  }
);