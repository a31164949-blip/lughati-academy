import { NextResponse } from "next/server";
import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  getFirebaseAdmin,
} from "../../../firebase-admin";

/*
 * =====================================================
 * إعداد المستويات
 * =====================================================
 */

const LEVEL_REQUIREMENTS: Record<
  number,
  number
> = {
  2: 3,
  3: 7,
  4: 12,
  5: 17,
  6: 23,
  7: 30,
  8: 37,
};

const LEVEL_TITLES: Record<
  number,
  string
> = {
  2: "القارئ المتقدم",
  3: "القارئ الواثق",
  4: "القارئ المتمكن",
  5: "القارئ المتميز",
  6: "بطل القراءة",
  7: "فارس الطلاقة",
  8: "سفير القراءة",
};

const LEVEL_TEXT_IDS: Record<
  number,
  Set<string>
> = {
  2: new Set([
    "l2-01",
    "l2-02",
    "l2-03",
    "l2-04",
    "l2-05",
    "l2-06",
  ]),

  3: new Set([
    "l3-01",
    "l3-02",
    "l3-03",
    "l3-04",
    "l3-05",
    "l3-06",
  ]),

  4: new Set([
    "l4-01",
    "l4-02",
    "l4-03",
    "l4-04",
    "l4-05",
    "l4-06",
  ]),

  5: new Set([
    "l5-01",
    "l5-02",
    "l5-03",
    "l5-04",
    "l5-05",
    "l5-06",
  ]),

  6: new Set([
    "l6-01",
    "l6-02",
    "l6-03",
    "l6-04",
    "l6-05",
    "l6-06",
  ]),

  7: new Set([
    "l7-01",
    "l7-02",
    "l7-03",
    "l7-04",
    "l7-05",
    "l7-06",
  ]),

  8: new Set([
    "l8-01",
    "l8-02",
    "l8-03",
    "l8-04",
    "l8-05",
    "l8-06",
  ]),
};

/*
 * =====================================================
 * التحقق من الطالب
 * =====================================================
 */

async function getStudentFromRequest(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization?.startsWith(
      "Bearer "
    )
  ) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  const token =
    authorization.slice(7);

  const {
    adminAuth,
  } =
    getFirebaseAdmin();

  const decodedToken =
    await adminAuth.verifyIdToken(
      token
    );

  if (
    decodedToken.role !==
    "student"
  ) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  const studentDocId =
    typeof decodedToken.studentDocId ===
      "string"
      ? decodedToken.studentDocId.trim()
      : "";

  if (!studentDocId) {
    throw new Error(
      "STUDENT_NOT_FOUND"
    );
  }

  return studentDocId;
}

type PromotionPayload = {
  targetLevel?: number;
  textId?: string;
  audioUrl?: string;
  durationSeconds?: number;
  preview?: boolean;
  testMode?: boolean;
};

/*
 * =====================================================
 * POST
 * =====================================================
 */

export async function POST(
  request: Request
) {
  try {
    const studentDocId =
      await getStudentFromRequest(
        request
      );

    const body =
      (await request.json()) as
        PromotionPayload;

    const targetLevel =
      typeof body.targetLevel ===
      "number"
        ? Math.round(
            body.targetLevel
          )
        : 0;

    const textId =
      typeof body.textId ===
      "string"
        ? body.textId.trim()
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
            1,
            Math.min(
              40,
              Math.round(
                body.durationSeconds
              )
            )
          )
        : 0;

    /*
     * =================================================
     * التحقق من المستوى
     * =================================================
     */

    if (
      targetLevel < 2 ||
      targetLevel > 8
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "مستوى الترقية غير صحيح.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =================================================
     * التحقق من النص
     * =================================================
     */

    const allowedTextIds =
      LEVEL_TEXT_IDS[
        targetLevel
      ];

    if (
      !allowedTextIds ||
      !allowedTextIds.has(
        textId
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "نص الاختبار غير صحيح لهذا المستوى.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =================================================
     * التحقق من التسجيل
     * =================================================
     */

    if (
      !audioUrl ||
      !audioUrl.startsWith(
        "https://"
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "رابط التسجيل غير صحيح.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      durationSeconds < 1
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "مدة التسجيل غير صحيحة.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =================================================
     * وضع التطوير الآمن
     * =================================================
     *
     * لا يكتب أي شيء في Firestore
     * في بيئة التطوير.
     */

    const preview =
      body.preview === true &&
      process.env.NODE_ENV !==
        "production";

    /*
     * وضع اختبار تكاملي للتطوير فقط:
     * يسمح بإنشاء طلب حقيقي في Firestore
     * مع تجاوز شرط عدد القراءات فقط.
     *
     * لا يعمل إطلاقًا في production.
     */
    const testMode =
      body.testMode === true &&
      process.env.NODE_ENV !==
        "production";

    if (preview) {
      return NextResponse.json({
        success: true,

        preview: true,

        status:
          "preview",

        targetLevel,

        message:
          `نجح اختبار إرسال المستوى ${targetLevel} دون الكتابة في Firestore.`,
      });
    }

    const {
      adminDb,
    } =
      getFirebaseAdmin();

    /*
     * =================================================
     * المراجع
     * =================================================
     */

    const progressRef =
      adminDb
        .collection(
          "reading-progress"
        )
        .doc(
          studentDocId
        );

    const studentRef =
      adminDb
        .collection(
          "students"
        )
        .doc(
          studentDocId
        );

    const requestId =
      `${studentDocId}__level-${targetLevel}`;

    const promotionRef =
      adminDb
        .collection(
          "fluencyPromotionRequests"
        )
        .doc(
          requestId
        );

    /*
     * =================================================
     * قراءة البيانات المطلوبة فقط
     * =================================================
     */

    const [
      progressSnapshot,
      studentSnapshot,
      promotionSnapshot,
    ] =
      await Promise.all([
        progressRef.get(),
        studentRef.get(),
        promotionRef.get(),
      ]);

    const progressData =
      progressSnapshot.exists
        ? progressSnapshot.data() ??
          {}
        : {};

    const approvedReadings =
      typeof progressData
        .totalApprovedDays ===
      "number"
        ? Math.max(
            0,
            Math.round(
              progressData
                .totalApprovedDays
            )
          )
        : 0;

    /*
     * المستوى الرسمي الحقيقي.
     *
     * إذا لم يوجد الحقل:
     * الطالب في المستوى 1.
     */

    const currentFluencyLevel =
      typeof progressData
        .fluencyLevel ===
      "number"
        ? Math.max(
            1,
            Math.min(
              8,
              Math.round(
                progressData
                  .fluencyLevel
              )
            )
          )
        : 1;

    /*
     * =================================================
     * منع القفز بين المستويات
     * =================================================
     */

    const expectedTargetLevel =
      currentFluencyLevel + 1;

    if (
      targetLevel !==
      expectedTargetLevel
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            `المستوى التالي المتاح لك هو المستوى ${expectedTargetLevel}. لا يمكن تخطي مستويات قمة الطلاقة.`,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * =================================================
     * التحقق من شرط القراءات
     * =================================================
     */

    const requiredReadings =
      LEVEL_REQUIREMENTS[
        targetLevel
      ];

    if (
      !testMode &&
      (
        typeof requiredReadings !==
          "number" ||
        approvedReadings <
          requiredReadings
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            `لم يكتمل شرط القراءات المعتمدة لفتح اختبار المستوى ${targetLevel}. تحتاج إلى ${requiredReadings} قراءة معتمدة إجمالًا.`,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * =================================================
     * التحقق من الطلب السابق
     * =================================================
     */

    const existingData =
      promotionSnapshot.exists
        ? promotionSnapshot.data() ??
          {}
        : {};

    const existingStatus =
      typeof existingData.status ===
      "string"
        ? existingData.status
        : "";

    if (
      existingStatus ===
      "pending"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            `لديك اختبار ترقية للمستوى ${targetLevel} مرسل بالفعل وهو بانتظار مراجعة المعلم.`,
        },
        {
          status: 409,
        }
      );
    }

    if (
      existingStatus ===
      "approved"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            `تم اعتماد المستوى ${targetLevel} سابقًا.`,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * =================================================
     * بيانات الطالب
     * =================================================
     */

    const studentData =
      studentSnapshot.exists
        ? studentSnapshot.data() ??
          {}
        : {};

    const studentName =
      typeof studentData.studentName ===
      "string"
        ? studentData.studentName
        : typeof studentData.name ===
            "string"
          ? studentData.name
          : "طالب لغتي";

    const classroom =
      typeof studentData.classroom ===
      "string"
        ? studentData.classroom
        : "";

    /*
     * =================================================
     * إنشاء / تحديث طلب الترقية
     * =================================================
     */

    await promotionRef.set(
      {
        studentId:
          studentDocId,

        studentName,

        classroom,

        fromLevel:
          currentFluencyLevel,

        targetLevel,

        levelTitle:
          LEVEL_TITLES[
            targetLevel
          ] ||
          `المستوى ${targetLevel}`,

        textId,

        audioUrl,

        durationSeconds,

        status:
          "pending",

        approvedReadings,

        requiredReadings,

        testMode:
          testMode === true,

        submittedAt:
          FieldValue.serverTimestamp(),

        updatedAt:
          FieldValue.serverTimestamp(),

        attemptNumber:
          typeof existingData
            .attemptNumber ===
          "number"
            ? existingData
                .attemptNumber + 1
            : 1,

        previousStatus:
          existingStatus ||
          "",

        teacherNote:
          "",
      },
      {
        merge: true,
      }
    );

    return NextResponse.json({
      success: true,

      requestId,

      status:
        "pending",

      fromLevel:
        currentFluencyLevel,

      targetLevel,

      testMode,

      message:
        testMode
          ? `🧪 تم إنشاء طلب اختبار حقيقي للمستوى ${targetLevel} في بيئة التطوير، وهو الآن بانتظار مراجعة المعلم.`
          : `✅ تم إرسال اختبار المستوى ${targetLevel} إلى المعلم بنجاح، وهو الآن بانتظار المراجعة.`,
    });
  } catch (error) {
    console.error(
      "Fluency promotion POST error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message ===
      "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "غير مصرح بالدخول.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      message ===
      "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "هذا المسار مخصص للطلاب.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      message ===
      "STUDENT_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "تعذر العثور على حساب الطالب.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,

        message:
          "تعذر إرسال اختبار الترقية حاليًا.",
      },
      {
        status: 500,
      }
    );
  }
}