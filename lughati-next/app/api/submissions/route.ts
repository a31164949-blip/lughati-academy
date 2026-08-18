import { NextResponse } from "next/server";

import { getFirebaseAdmin } from "../../../firebase-admin";

export async function GET() {
  try {
    const { adminDb } = getFirebaseAdmin();

    const snapshot = await adminDb
      .collection("studentWorks")
      .orderBy("createdAt", "desc")
      .get();

    const submissions = snapshot.docs.map((doc, index) => {
      const data = doc.data();

      let timestamp = "";

      if (
        data.createdAt &&
        typeof data.createdAt.toDate === "function"
      ) {
        timestamp = data.createdAt
          .toDate()
          .toLocaleString("ar-SA");
      }

      return {
        id: doc.id,

        // مؤقتًا حتى نحدّث صفحة لوحة المعلم لاستخدام id بدل row
        row: index + 2,

        timestamp,

        studentName:
          typeof data.studentName === "string"
            ? data.studentName
            : "",

        studentId:
          typeof data.studentId === "string"
            ? data.studentId
            : "",

        classroom:
          typeof data.classroom === "string"
            ? data.classroom
            : "",

        title:
          typeof data.title === "string"
            ? data.title
            : "",

        type:
          typeof data.type === "string"
            ? data.type
            : "",

        fileUrl:
          typeof data.fileUrl === "string"
            ? data.fileUrl
            : "",

        consent:
          typeof data.consent === "string"
            ? data.consent
            : "",

        status:
          typeof data.status === "string"
            ? data.status
            : "بانتظار المراجعة",

        note:
          typeof data.note === "string"
            ? data.note
            : "",
      };
    });

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("GET SUBMISSIONS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء جلب أعمال الطلاب",
        submissions: [],
      },
      { status: 500 }
    );
  }
}