import { NextResponse } from "next/server";
import {
  FieldValue,
} from "firebase-admin/firestore";

import { getFirebaseAdmin } from "../../../firebase-admin";

type ReadingSubmissionRequest = {
  studentId?: string;
  studentName?: string;
  studentClassroom?: string;
  audioUrl?: string;
  durationSeconds?: number;
};

const SUBMISSIONS_OPEN_HOUR = 13;
const SUBMISSIONS_CLOSE_HOUR = 22;

function getRiyadhTimeParts() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "Asia/Riyadh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }
    );

  const parts =
    formatter.formatToParts(
      new Date()
    );

  const getPart = (
    type: Intl.DateTimeFormatPartTypes
  ) =>
    parts.find(
      (part) => part.type === type
    )?.value ?? "";

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: Number(
      getPart("hour") || "0"
    ),
    minute: Number(
      getPart("minute") || "0"
    ),
  };
}

function isReadingWindowOpen() {
  const { hour } =
    getRiyadhTimeParts();

  return (
    hour >= SUBMISSIONS_OPEN_HOUR &&
    hour < SUBMISSIONS_CLOSE_HOUR
  );
}

function getRiyadhDate() {
  const {
    year,
    month,
    day,
  } = getRiyadhTimeParts();

  return `${year}-${month}-${day}`;
}

export async function POST(
  request: Request
) {
  try {
    if (!isReadingWindowOpen()) {
      return NextResponse.json(
        {
          success: false,
          code:
            "READING_SUBMISSIONS_CLOSED",
          message:
            "🌙 استقبال تسجيلات القراءة متاح يوميًا من الساعة 1:00 ظهرًا حتى 10:00 مساءً بتوقيت الرياض.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      (await request.json()) as ReadingSubmissionRequest;

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

    const studentClassroom =
      typeof body.studentClassroom ===
      "string"
        ? body.studentClassroom.trim()
        : "";

    const audioUrl =
      typeof body.audioUrl ===
      "string"
        ? body.audioUrl.trim()
        : "";

    const durationSeconds =
      typeof body.durationSeconds ===
        "number" &&
      Number.isFinite(
        body.durationSeconds
      )
        ? Math.max(
            0,
            Math.min(
              60,
              Math.round(
                body.durationSeconds
              )
            )
          )
        : 0;

    if (
      !studentId ||
      studentId === "student-demo" ||
      !audioUrl
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "بيانات القراءة غير مكتملة",
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
          "reading-submissions"
        )
        .add({
          studentId,
          studentName,
          studentClassroom,

          audioUrl,
          durationSeconds,

          status: "pending",

          readingDate:
            getRiyadhDate(),

          createdAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp(),
        });

    return NextResponse.json({
      success: true,
      id: submissionRef.id,
      message:
        "⏳ تم إرسال قراءتك للمعلم، وهي الآن بانتظار المراجعة.",
    });
  } catch (error) {
    console.error(
      "READING SUBMISSION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "تعذر إرسال تسجيل القراءة",
      },
      {
        status: 500,
      }
    );
  }
}