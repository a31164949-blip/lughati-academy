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

const PENDING_STATUS =
  "بانتظار المراجعة";

const SUBMISSIONS_OPEN_HOUR = 13;
const SUBMISSIONS_CLOSE_HOUR = 22;

function getRiyadhTimeParts() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "Asia/Riyadh",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }
    );

  const parts =
    formatter.formatToParts(
      new Date()
    );

  const hour =
    Number(
      parts.find(
        (part) =>
          part.type === "hour"
      )?.value ?? "0"
    );

  const minute =
    Number(
      parts.find(
        (part) =>
          part.type === "minute"
      )?.value ?? "0"
    );

  return {
    hour,
    minute,
  };
}

function isSubmissionWindowOpen() {
  const { hour } =
    getRiyadhTimeParts();

  return (
    hour >= SUBMISSIONS_OPEN_HOUR &&
    hour <
      SUBMISSIONS_CLOSE_HOUR
  );
}

export async function POST(
  request: Request
) {
  try {
    /*
      سياسة الأكاديمية:
      استقبال الأعمال من
      13:00 صباحًا إلى 22:00 مساءً
      بتوقيت الرياض.
    */
    if (!isSubmissionWindowOpen()) {
      return NextResponse.json(
        {
          success: false,
          code:
            "SUBMISSIONS_CLOSED",
       message:
  "🌙 استقبال الأعمال متاح يوميًا من الساعة 1:00 ظهرًا حتى 10:00 مساءً بتوقيت الرياض. ننتظرك في الوقت المحدد يا بطل ⭐",
          opensAt:
            "13:00",
          closesAt:
            "22:00",
          timeZone:
            "Asia/Riyadh",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      (await request.json()) as CreateSubmissionRequest;

    const studentName =
      typeof body.studentName ===
      "string"
        ? body.studentName.trim()
        : "";

    const studentId =
      typeof body.studentId ===
      "string"
        ? body.studentId.trim()
        : "";

    const title =
      typeof body.title ===
        "string" &&
      body.title.trim()
        ? body.title.trim()
        : "إبداع طالب";

    const type =
      typeof body.type ===
        "string" &&
      body.type.trim()
        ? body.type.trim()
        : "واجب إبداعي";

    const fileUrl =
      typeof body.fileUrl ===
      "string"
        ? body.fileUrl.trim()
        : "";

    const consent =
      typeof body.consent ===
        "string" &&
      body.consent.trim()
        ? body.consent.trim()
        : "نعم";

    const classroom =
      typeof body.classroom ===
      "string"
        ? body.classroom.trim()
        : "";

    const note =
      typeof body.note ===
      "string"
        ? body.note.trim()
        : "";

    if (
      !studentId ||
      !fileUrl
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "بيانات العمل غير مكتملة",
        },
        {
          status: 400,
        }
      );
    }

    const { adminDb } =
      getFirebaseAdmin();

    const submissionRef =
      await adminDb
        .collection(
          "studentWorks"
        )
        .add({
          studentName,
          studentId,
          title,
          type,
          fileUrl,
          consent,
          classroom,

          status:
            PENDING_STATUS,

          note,

          createdAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp(),
        });

    return NextResponse.json(
      {
        success: true,
        id: submissionRef.id,
        message:
          "تم إرسال العمل للمعلم للمراجعة",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "CREATE SUBMISSION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء إرسال العمل",
      },
      {
        status: 500,
      }
    );
  }
}