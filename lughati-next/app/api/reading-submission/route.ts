import { NextResponse } from "next/server";
import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  getFirebaseAdmin,
} from "../../../firebase-admin";

import {
  getStudentSubmissionWindow,
} from "../../lib/studentSubmissionWindow";

type ReadingSubmissionRequest = {
  studentId?: string;
  studentName?: string;
  studentClassroom?: string;
  audioUrl?: string;
  audioPublicId?: string;
  durationSeconds?: number;
  readingDate?: string;
};

/*
 * =====================================================
 * تاريخ اليوم حسب توقيت الرياض
 * =====================================================
 *
 * مثال:
 * 2026-09-05
 *
 * نستخدم تاريخ الرياض حتى لا يتأثر
 * بتاريخ جهاز الطالب أو مكان الخادم.
 */
function getRiyadhDate() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Riyadh",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
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

/*
 * =====================================================
 * معرف القراءة اليومية
 * =====================================================
 *
 * لكل طالب مستند واحد فقط في اليوم.
 *
 * مثال:
 * student-001_2026-09-05
 */
function getDailySubmissionId(
  studentId: string,
  readingDate: string
) {
  const safeStudentId =
    encodeURIComponent(
      studentId
    );

  return `${safeStudentId}_${readingDate}`;
}

/*
 * =====================================================
 * GET
 * =====================================================
 *
 * تستخدمه صفحة رحلة القراءة لمعرفة:
 * هل أرسل الطالب قراءة اليوم؟
 */
export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const studentId =
      (
        url.searchParams.get(
          "studentId"
        ) || ""
      ).trim();

    if (
      !studentId ||
      studentId ===
        "student-demo"
    ) {
      return NextResponse.json(
        {
          success:
            false,

          hasSubmittedToday:
            false,

          message:
            "معرف الطالب غير متوفر",
        },
        {
          status:
            400,
        }
      );
    }

    /*
      لا نعتمد التاريخ القادم
      من المتصفح.

      الخادم يحدد تاريخ اليوم
      حسب توقيت الرياض.
    */
    const readingDate =
      getRiyadhDate();

    const {
      adminDb,
    } =
      getFirebaseAdmin();

    /*
      أولًا:
      نبحث عن المستند الجديد
      ذي المعرف الثابت.
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
      return NextResponse.json(
        {
          success:
            true,

          hasSubmittedToday:
            true,

          readingDate,
        }
      );
    }

    /*
      دعم التسجيلات القديمة:

      في النظام القديم كانت القراءات
      تحفظ بمعرفات عشوائية.

      لذلك نتحقق أيضًا من وجود
      قراءة قديمة لنفس الطالب
      في تاريخ اليوم.
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

    return NextResponse.json(
      {
        success:
          true,

        hasSubmittedToday:
          !oldSubmissionSnapshot.empty,

        readingDate,
      }
    );
  } catch (error) {
    console.error(
      "CHECK READING SUBMISSION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        hasSubmittedToday:
          false,

        message:
          "تعذر التحقق من قراءة اليوم",
      },
      {
        status:
          500,
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
 * القواعد:
 *
 * 1) استقبال أعمال الطلاب:
 *    من 1:00 ظهرًا إلى 10:00 مساءً.
 *
 * 2) قراءة واحدة فقط
 *    لكل طالب يوميًا.
 *
 * هذا المسار خاص بالطالب فقط.
 * المعلم لا يستخدمه عند المراجعة.
 */
export async function POST(
  request: Request
) {
  try {
    /*
     * =================================================
     * فحص وقت استقبال أعمال الطلاب
     * =================================================
     *
     * المصدر الآن مركزي:
     *
     * app/lib/studentSubmissionWindow.ts
     */
    const submissionWindow =
      getStudentSubmissionWindow();

    if (
      !submissionWindow.isOpen
    ) {
      return NextResponse.json(
        {
          success:
            false,

          code:
            "READING_SUBMISSIONS_CLOSED",

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
          status:
            403,
        }
      );
    }

    const body =
      (await request.json()) as
        ReadingSubmissionRequest;

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

    const audioPublicId =
      typeof body.audioPublicId ===
      "string"
        ? body.audioPublicId.trim()
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
          success:
            false,

          code:
            "INVALID_READING_DATA",

          message:
            "بيانات القراءة غير مكتملة",
        },
        {
          status:
            400,
        }
      );
    }

    const {
      adminDb,
    } =
      getFirebaseAdmin();

    /*
     * لا نعتمد readingDate
     * القادم من المتصفح.
     *
     * الخادم يحدد اليوم
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
     * لذلك نتحقق من عدم وجود
     * قراءة قديمة للطالب
     * في اليوم نفسه.
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
          success:
            false,

          code:
            "DAILY_READING_EXISTS",

          message:
            "📖 لقد أرسلت قراءة اليوم بالفعل. يُسمح لك بإرسال قراءة واحدة فقط يوميًا 🌟",
        },
        {
          status:
            409,
        }
      );
    }

    /*
     * =================================================
     * المستند اليومي الثابت
     * =================================================
     *
     * الطالب + التاريخ.
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
     * حتى لو:
     *
     * - ضغط الطالب مرتين بسرعة.
     * - استخدم جهازين.
     * - حدث تحديث للصفحة.
     * - وصل طلبان في اللحظة نفسها.
     *
     * فلن يتم إنشاء أكثر
     * من قراءة واحدة.
     */
    let alreadyExists =
      false;

    await adminDb.runTransaction(
      async (
        transaction
      ) => {
        const submissionSnap =
          await transaction.get(
            submissionRef
          );

        if (
          submissionSnap.exists
        ) {
          alreadyExists =
            true;

          return;
        }

        transaction.create(
          submissionRef,
          {
            studentId,

            studentName,

            studentClassroom,

            audioUrl,

            audioPublicId,

            durationSeconds,

            status:
              "pending",

            readingDate,

            source:
              "reading-journey",

            createdAt:
              FieldValue
                .serverTimestamp(),

            updatedAt:
              FieldValue
                .serverTimestamp(),
          }
        );
      }
    );

    /*
      إذا كان طلب ثانٍ وصل
      بعد إنشاء الطلب الأول.
    */
    if (
      alreadyExists
    ) {
      return NextResponse.json(
        {
          success:
            false,

          code:
            "DAILY_READING_EXISTS",

          message:
            "📖 لقد أرسلت قراءة اليوم بالفعل. يُسمح لك بإرسال قراءة واحدة فقط يوميًا 🌟",
        },
        {
          status:
            409,
        }
      );
    }

    return NextResponse.json(
      {
        success:
          true,

        id:
          submissionRef.id,

        readingDate,

        message:
          "⏳ تم إرسال قراءتك للمعلم، وهي الآن بانتظار المراجعة.",
      },
      {
        status:
          200,
      }
    );
  } catch (error) {
    /*
     * transaction.create
     * يمكن أن يفشل إذا سبق
     * طلب آخر وأنشأ المستند
     * في نفس اللحظة.
     */
    const errorCode =
      typeof error ===
        "object" &&
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
      errorCode ===
        "6" ||
      errorCode ===
        "already-exists"
    ) {
      return NextResponse.json(
        {
          success:
            false,

          code:
            "DAILY_READING_EXISTS",

          message:
            "📖 لقد أرسلت قراءة اليوم بالفعل. يُسمح لك بإرسال قراءة واحدة فقط يوميًا 🌟",
        },
        {
          status:
            409,
        }
      );
    }

    console.error(
      "READING SUBMISSION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "تعذر إرسال تسجيل القراءة",
      },
      {
        status:
          500,
      }
    );
  }
}