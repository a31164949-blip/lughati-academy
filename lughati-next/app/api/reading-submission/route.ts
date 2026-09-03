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
  readingDate?: string;
};

const SUBMISSIONS_OPEN_HOUR = 13;
const SUBMISSIONS_CLOSE_HOUR = 22;

/*
 * الوقت المعتمد في الأكاديمية:
 * توقيت الرياض
 */
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

/*
 * هل استقبال القراءة مفتوح؟
 *
 * من 1 ظهرًا
 * حتى قبل 10 مساءً
 */
function isReadingWindowOpen() {
  const { hour } =
    getRiyadhTimeParts();

  return (
    hour >= SUBMISSIONS_OPEN_HOUR &&
    hour < SUBMISSIONS_CLOSE_HOUR
  );
}

/*
 * تاريخ اليوم حسب توقيت الرياض
 *
 * مثال:
 * 2026-09-03
 */
function getRiyadhDate() {
  const {
    year,
    month,
    day,
  } = getRiyadhTimeParts();

  return `${year}-${month}-${day}`;
}

/*
 * إنشاء معرف ثابت لقراءة الطالب اليومية.
 *
 * بهذا يصبح لكل طالب مستند واحد فقط
 * في اليوم الواحد.
 */
function getDailySubmissionId(
  studentId: string,
  readingDate: string
) {
  const safeStudentId =
    encodeURIComponent(studentId);

  return `${safeStudentId}_${readingDate}`;
}

/*
 * =====================================================
 * GET
 * =====================================================
 *
 * تستخدمه صفحة رحلة القراءة عند فتحها
 * لمعرفة:
 *
 * هل أرسل الطالب قراءة اليوم؟
 *
 * مثال:
 *
 * /api/reading-submission?studentId=123
 */
export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(request.url);

    const studentId =
      (
        url.searchParams.get(
          "studentId"
        ) || ""
      ).trim();

    if (
      !studentId ||
      studentId === "student-demo"
    ) {
      return NextResponse.json(
        {
          success: false,
          hasSubmittedToday: false,
          message:
            "معرف الطالب غير متوفر",
        },
        {
          status: 400,
        }
      );
    }

    const readingDate =
      getRiyadhDate();

    const { adminDb } =
      getFirebaseAdmin();

    /*
     * أولًا:
     * نبحث عن المستند الجديد ذي المعرف الثابت.
     *
     * هذا لا يحتاج إلى قراءة المجموعة كاملة.
     */
    const dailySubmissionId =
      getDailySubmissionId(
        studentId,
        readingDate
      );

    const dailySubmissionRef =
      adminDb
        .collection(
          "reading-submissions"
        )
        .doc(
          dailySubmissionId
        );

    const dailySubmissionSnap =
      await dailySubmissionRef.get();

    if (
      dailySubmissionSnap.exists
    ) {
      return NextResponse.json({
        success: true,
        hasSubmittedToday: true,
        readingDate,
      });
    }

    /*
     * دعم التسجيلات القديمة:
     *
     * لأن القراءات السابقة كانت تحفظ
     * بمعرفات عشوائية بواسطة add().
     *
     * لذلك نتحقق أيضًا من وجود قراءة
     * للطالب في تاريخ اليوم.
     *
     * limit(1) لتقليل قراءات Firestore.
     */
    const oldSubmissionSnapshot =
      await adminDb
        .collection(
          "reading-submissions"
        )
        .where(
          "studentId",
          "==",
          studentId
        )
        .where(
          "readingDate",
          "==",
          readingDate
        )
        .limit(1)
        .get();

    return NextResponse.json({
      success: true,

      hasSubmittedToday:
        !oldSubmissionSnapshot.empty,

      readingDate,
    });
  } catch (error) {
    console.error(
      "CHECK READING SUBMISSION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        hasSubmittedToday: false,
        message:
          "تعذر التحقق من قراءة اليوم",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =====================================================
 * POST
 * =====================================================
 *
 * إرسال قراءة الطالب.
 *
 * القاعدة:
 *
 * قراءة واحدة فقط لكل طالب يوميًا.
 */
export async function POST(
  request: Request
) {
  try {
    /*
     * منع الإرسال خارج الوقت المحدد.
     */
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

    /*
     * التأكد من وجود بيانات الطالب
     * والرابط الصوتي.
     */
    if (
      !studentId ||
      studentId ===
        "student-demo" ||
      !audioUrl
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "INVALID_READING_DATA",

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

    /*
     * لا نعتمد التاريخ القادم من المتصفح.
     *
     * الخادم هو الذي يحدد اليوم
     * حسب توقيت الرياض.
     */
    const readingDate =
      getRiyadhDate();

    /*
     * =================================================
     * دعم القراءات القديمة
     * =================================================
     *
     * قبل النظام الجديد كانت add()
     * تنشئ معرفًا عشوائيًا.
     *
     * لذلك نتحقق من عدم وجود قراءة قديمة
     * للطالب في اليوم نفسه.
     */
    const existingOldSubmission =
      await adminDb
        .collection(
          "reading-submissions"
        )
        .where(
          "studentId",
          "==",
          studentId
        )
        .where(
          "readingDate",
          "==",
          readingDate
        )
        .limit(1)
        .get();

    if (
      !existingOldSubmission.empty
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "DAILY_READING_EXISTS",

          message:
            "📖 لقد أرسلت قراءة اليوم بالفعل. يُسمح لك بإرسال قراءة واحدة فقط يوميًا 🌟",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * =================================================
     * المستند اليومي الثابت
     * =================================================
     *
     * الطالب + التاريخ
     *
     * مثال:
     *
     * 12345_2026-09-03
     */
    const dailySubmissionId =
      getDailySubmissionId(
        studentId,
        readingDate
      );

    const submissionRef =
      adminDb
        .collection(
          "reading-submissions"
        )
        .doc(
          dailySubmissionId
        );

    /*
     * =================================================
     * Transaction
     * =================================================
     *
     * هذه أهم طبقة حماية.
     *
     * حتى لو:
     *
     * - ضغط الطالب مرتين بسرعة
     * - فتح جهازين
     * - حدث تحديث للصفحة
     * - وصل طلبان في اللحظة نفسها
     *
     * لن يتم إنشاء أكثر من قراءة واحدة.
     */
    let alreadyExists = false;

    await adminDb.runTransaction(
      async (transaction) => {
        const submissionSnap =
          await transaction.get(
            submissionRef
          );

        if (
          submissionSnap.exists
        ) {
          alreadyExists = true;
          return;
        }

        transaction.create(
          submissionRef,
          {
            studentId,
            studentName,
            studentClassroom,

            audioUrl,

            durationSeconds,

            status:
              "pending",

            readingDate,

            createdAt:
              FieldValue.serverTimestamp(),

            updatedAt:
              FieldValue.serverTimestamp(),
          }
        );
      }
    );

    /*
     * إذا كان الطلب الثاني وصل
     * بعد إنشاء الطلب الأول.
     */
    if (alreadyExists) {
      return NextResponse.json(
        {
          success: false,

          code:
            "DAILY_READING_EXISTS",

          message:
            "📖 لقد أرسلت قراءة اليوم بالفعل. يُسمح لك بإرسال قراءة واحدة فقط يوميًا 🌟",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json({
      success: true,

      id:
        submissionRef.id,

      readingDate,

      message:
        "⏳ تم إرسال قراءتك للمعلم، وهي الآن بانتظار المراجعة.",
    });
  } catch (error) {
    /*
     * transaction.create يمكن أن يفشل
     * إذا سبق طلب آخر وأنشأ المستند
     * في نفس اللحظة.
     *
     * لذلك نفحص الخطأ أيضًا.
     */
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error
        ? String(
            (
              error as {
                code?: unknown;
              }
            ).code ?? ""
          )
        : "";

    /*
     * Firestore:
     * ALREADY_EXISTS = 6
     */
    if (
      errorCode === "6" ||
      errorCode ===
        "already-exists"
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "DAILY_READING_EXISTS",

          message:
            "📖 لقد أرسلت قراءة اليوم بالفعل. يُسمح لك بإرسال قراءة واحدة فقط يوميًا 🌟",
        },
        {
          status: 409,
        }
      );
    }

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