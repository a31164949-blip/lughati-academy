import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getFirestore,
} from "firebase-admin/firestore";

import {
  mkdir,
  writeFile,
} from "node:fs/promises";

const CONFIRM_DELETE =
  process.env.CONFIRM_DELETE === "YES";

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
    process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";

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

function serializeValue(value) {
  if (
    value &&
    typeof value.toDate === "function"
  ) {
    return {
      __type: "Timestamp",
      value:
        value
          .toDate()
          .toISOString(),
    };
  }

  if (Array.isArray(value)) {
    return value.map(
      serializeValue
    );
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const result = {};

    for (
      const [key, item]
      of Object.entries(value)
    ) {
      result[key] =
        serializeValue(item);
    }

    return result;
  }

  return value;
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
        const number =
          getStudentNumber(
            document.id
          );

        return {
          id: document.id,
          number,
          data:
            document.data(),
        };
      })
      .filter(
        (student) =>
          student.number !== null &&
          student.number >= 40 &&
          student.data.temporary === true
      )
      .sort(
        (a, b) =>
          a.number - b.number
      );

  console.log(
    "\n=== الحسابات المؤقتة المرشحة للتنظيف ==="
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
          student.data.studentName ?? "",
        classroom:
          student.data.classroom ?? "",
        loginCode:
          student.data.loginCode ?? "",
        temporary:
          student.data.temporary === true,
      })
    )
  );

  // حماية إضافية:
  // نتوقع فقط student-040 إلى student-060 = 21 حسابًا
  const expectedIds =
    Array.from(
      { length: 21 },
      (_, index) =>
        `student-${String(
          index + 40
        ).padStart(3, "0")}`
    );

  const actualIds =
    candidates.map(
      (student) => student.id
    );

  const exactMatch =
    expectedIds.length ===
      actualIds.length &&
    expectedIds.every(
      (id, index) =>
        id === actualIds[index]
    );

  if (!exactMatch) {
    console.error(
      "\n❌ توقف للحماية."
    );

    console.error(
      "القائمة الحالية لا تطابق student-040 إلى student-060 تمامًا."
    );

    console.error(
      "لن يتم حذف أي شيء."
    );

    process.exit(1);
  }

  if (!CONFIRM_DELETE) {
    console.log(
      "\n🛡️ وضع المعاينة فقط."
    );

    console.log(
      "لم يتم حذف أو تعديل أي طالب."
    );

    console.log(
      "\nللتنظيف الفعلي بعد المراجعة استخدم:"
    );

    console.log(
      "CONFIRM_DELETE=YES node scripts/cleanup-temporary-students.mjs"
    );

    return;
  }

  // إنشاء نسخة احتياطية أولًا
  await mkdir(
    "scripts/backups",
    {
      recursive: true,
    }
  );

  const timestamp =
    new Date()
      .toISOString()
      .replace(
        /[:.]/g,
        "-"
      );

  const backupPath =
    `scripts/backups/temporary-students-${timestamp}.json`;

  const backupData =
    candidates.map(
      (student) => ({
        id: student.id,
        data:
          serializeValue(
            student.data
          ),
      })
    );

  await writeFile(
    backupPath,
    JSON.stringify(
      backupData,
      null,
      2
    ),
    "utf8"
  );

  console.log(
    "\n✅ تم إنشاء النسخة الاحتياطية:"
  );

  console.log(
    backupPath
  );

  // الحذف بعد نجاح النسخة الاحتياطية فقط
  const batch =
    db.batch();

  for (
    const student
    of candidates
  ) {
    batch.delete(
      db
        .collection("students")
        .doc(student.id)
    );
  }

  console.log(
    "\n⏳ جاري حذف 21 حسابًا مؤقتًا..."
  );

  await batch.commit();

  console.log(
    "✅ تم حذف الحسابات المؤقتة student-040 إلى student-060."
  );

  console.log(
    "🛡️ الطلاب الحقيقيون student-001 إلى student-039 لم يتم لمسهم."
  );

  console.log(
    "💾 النسخة الاحتياطية محفوظة في:"
  );

  console.log(
    backupPath
  );
}

main().catch(
  (error) => {
    console.error(
      "\n❌ فشلت العملية:"
    );

    console.error(error);

    process.exit(1);
  }
);