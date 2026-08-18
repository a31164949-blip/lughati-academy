import { NextResponse } from "next/server";
import {
  FieldValue,
} from "firebase-admin/firestore";

import { getFirebaseAdmin } from "../../../../firebase-admin";

type CreateSubmissionRequest = {
  studentName?: string;
  studentId?: string;
  title?: string;
  type?: string;
  fileUrl?: string;
  consent?: string;
  classroom?: string;
  note?: string;
};

const PENDING_STATUS = "بانتظار المراجعة";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateSubmissionRequest;

    const studentName =
      typeof body.studentName === "string"
        ? body.studentName.trim()
        : "";

    const studentId =
      typeof body.studentId === "string"
        ? body.studentId.trim()
        : "";

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "إبداع طالب";

    const type =
      typeof body.type === "string" && body.type.trim()
        ? body.type.trim()
        : "واجب إبداعي";

    const fileUrl =
      typeof body.fileUrl === "string"
        ? body.fileUrl.trim()
        : "";

    const consent =
      typeof body.consent === "string" && body.consent.trim()
        ? body.consent.trim()
        : "نعم";

    const classroom =
      typeof body.classroom === "string"
        ? body.classroom.trim()
        : "";

    const note =
      typeof body.note === "string"
        ? body.note.trim()
        : "";

    if (!studentId || !fileUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات العمل غير مكتملة",
        },
        { status: 400 }
      );
    }

    const { adminDb } = getFirebaseAdmin();

   const submissionRef = await adminDb
  .collection("studentWorks")
  .add({
        studentName,
        studentId,
        title,
        type,
        fileUrl,
        consent,
        classroom,

        status: PENDING_STATUS,
        note,

        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({
      success: true,
      id: submissionRef.id,
      message: "تم إرسال العمل للمعلم للمراجعة",
    });
  } catch (error) {
    console.error("CREATE SUBMISSION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء إرسال العمل",
      },
      { status: 500 }
    );
  }
}