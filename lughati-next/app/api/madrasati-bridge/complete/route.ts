import { NextResponse } from "next/server";
import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  getFirebaseAdmin,
} from "../../../../firebase-admin";

import {
  getStudentSubmissionWindow,
} from "../../../lib/studentSubmissionWindow";

type MadrasatiCompleteRequest = {
  studentId?: string;
  studentName?: string;
  classroom?: string;
};

function getRiyadhDateKey() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Riyadh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );

  const parts =
    formatter.formatToParts(
      new Date()
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year"
    )?.value ?? "";

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value ?? "";

  const day =
    parts.find(
      (part) =>
        part.type === "day"
    )?.value ?? "";

  return `${year}-${month}-${day}`;
}

export async function POST(
  request: Request
) {
  try {
    const submissionWindow =
      getStudentSubmissionWindow();

    if (!submissionWindow.isOpen) {
      return NextResponse.json(
        {
          success: false,
          code:
            "STUDENT_SUBMISSION_CLOSED",
          message:
            submissionWindow.message,
          opensAt:
            submissionWindow.opensAt,
          closesAt:
            submissionWindow.closesAt,
          timeZone:
            submissionWindow.timeZone,
        },
        {
          status: 403,
        }
      );
    }

    const body =
      (await request.json()) as
        MadrasatiCompleteRequest;

    const studentId =
      typeof body.studentId ===
      "string"
        ? body.studentId.trim()
        : "";

    const studentName =
      typeof body.studentName ===
        "string"
        ? body.studentName.trim()
        : "";

    const classroom =
      typeof body.classroom ===
      "string"
        ? body.classroom.trim()
        : "";

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تعذر تحديد حساب الطالب.",
        },
        {
          status: 400,
        }
      );
    }

    const today =
      getRiyadhDateKey();

    const completionId =
      `${studentId}_madrasati_${today}`;

    const {
      adminDb,
    } =
      getFirebaseAdmin();

    const completionRef =
      adminDb
        .collection(
          "homeworkCompletions"
        )
        .doc(
          completionId
        );

    await completionRef.set(
      {
        studentId,

        studentName,

        classroom,

        homeworkId:
          `madrasati_${today}`,

        homeworkTitle:
          "واجب منصة مدرستي",

        completionMethod:
          "🏫 عبر مدرستي",

        completed:
          true,

        teacherReviewed:
          false,

        status:
          "pending",

        source:
          "madrasati-bridge",

        completedAt:
          FieldValue.serverTimestamp(),

        updatedAt:
          FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    return NextResponse.json(
      {
        success: true,
        id:
          completionRef.id,
        message:
          "✅ تم تسجيل إنجاز واجب مدرستي بنجاح.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "MADRASATI COMPLETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "تعذر تسجيل إنجاز مدرستي.",
      },
      {
        status: 500,
      }
    );
  }
}