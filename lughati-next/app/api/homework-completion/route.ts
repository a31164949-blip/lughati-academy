import { NextResponse } from "next/server";
import {
  FieldValue,
} from "firebase-admin/firestore";

import { getFirebaseAdmin } from "../../../firebase-admin";

type HomeworkCompletionRequest = {
  studentId?: string;
  studentName?: string;
  classroom?: string;

  homeworkId?: string;
  homeworkTitle?: string;
  homeworkInstructions?: string;
  homeworkDueDate?: string;
  targetClass?: string;

  method?: string;
  completedAtText?: string;
};

const SUBMISSIONS_OPEN_HOUR = 13;
const SUBMISSIONS_CLOSE_HOUR = 22;

function getRiyadhHour() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "Asia/Riyadh",
        hour: "2-digit",
        hourCycle: "h23",
      }
    );

  const parts =
    formatter.formatToParts(
      new Date()
    );

  return Number(
    parts.find(
      (part) =>
        part.type === "hour"
    )?.value ?? "0"
  );
}

function getSaudiDateKey(
  date = new Date()
) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(date);
}

function isHomeworkWindowOpen() {
  const hour =
    getRiyadhHour();

  return (
    hour >= SUBMISSIONS_OPEN_HOUR &&
    hour < SUBMISSIONS_CLOSE_HOUR
  );
}

export async function POST(
  request: Request
) {
  try {
    if (
      !isHomeworkWindowOpen()
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "HOMEWORK_SUBMISSIONS_CLOSED",

          message:
            "🌙 استقبال الواجبات متاح يوميًا من الساعة 1:00 ظهرًا حتى 10:00 مساءً بتوقيت الرياض.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      (await request.json()) as HomeworkCompletionRequest;

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

    const homeworkId =
      typeof body.homeworkId ===
      "string"
        ? body.homeworkId.trim()
        : "";

    const homeworkTitle =
      typeof body.homeworkTitle ===
      "string"
        ? body.homeworkTitle.trim()
        : "";

    const homeworkInstructions =
      typeof body.homeworkInstructions ===
      "string"
        ? body.homeworkInstructions.trim()
        : "";

    const homeworkDueDate =
      typeof body.homeworkDueDate ===
      "string"
        ? body.homeworkDueDate.trim()
        : "";

    const targetClass =
      typeof body.targetClass ===
      "string"
        ? body.targetClass.trim()
        : "";

    const method =
      typeof body.method ===
      "string"
        ? body.method.trim()
        : "";

    const completedAtText =
      typeof body.completedAtText ===
      "string"
        ? body.completedAtText.trim()
        : "";

    if (
      !studentId ||
      !homeworkId ||
      !method
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "بيانات الواجب غير مكتملة",
        },
        {
          status: 400,
        }
      );
    }

    const { adminDb } =
      getFirebaseAdmin();

    /*
     * تاريخ اليوم بتوقيت الرياض.
     *
     * نحفظه داخل وثيقة الإنجاز حتى
     * نستطيع لاحقًا الاستعلام عن
     * واجبات اليوم فقط بدل قراءة
     * جميع واجبات الطالب.
     */
    const dateKey =
      getSaudiDateKey();

    const completionId =
      `${studentId}-${homeworkId}`;

    const completionReference =
      adminDb
        .collection(
          "homeworkCompletions"
        )
        .doc(completionId);

    const studentReference =
      adminDb
        .collection("students")
        .doc(studentId);

    await adminDb.runTransaction(
      async (transaction) => {
        const completionSnapshot =
          await transaction.get(
            completionReference
          );

        const alreadyCompleted =
          completionSnapshot.exists &&
          completionSnapshot.data()
            ?.completed === true;

        /*
         * منع تكرار تسجيل
         * نفس الواجب.
         */
        if (alreadyCompleted) {
          return;
        }

        /*
         * تحديث بيانات الطالب
         * الأساسية عند الحاجة.
         */
        transaction.set(
          studentReference,
          {
            studentId,
            studentName,
            classroom,

            updatedAt:
              FieldValue.serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        /*
         * تسجيل إنجاز الواجب.
         */
        transaction.set(
          completionReference,
          {
            completionId,

            homeworkId,
            homeworkTitle,
            homeworkInstructions,
            homeworkDueDate,
            targetClass,

            studentId,
            studentName,
            classroom,

            /*
             * مثال:
             * 2026-09-01
             *
             * مهم لتقليل قراءات
             * Firestore لاحقًا.
             */
            date: dateKey,

            method,

            completed: true,

            completedAtText,

            completedAt:
              FieldValue.serverTimestamp(),

            teacherReviewed:
              false,

            rewardGranted:
              false,

            awardedPoints:
              0,

            awardedStars:
              0,

            updatedAt:
              FieldValue.serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      }
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "تم إرسال إنجاز الواجب إلى المعلم ✅",
      }
    );
  } catch (error) {
    console.error(
      "HOMEWORK COMPLETION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "تعذر إرسال إنجاز الواجب",
      },
      {
        status: 500,
      }
    );
  }
}