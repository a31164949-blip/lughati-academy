import { NextResponse } from "next/server";
import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  getFirebaseAdmin,
} from "../../../../firebase-admin";

const TEACHER_EMAIL =
  "a31164949@gmail.com";

const FLUENCY_LEVEL_TITLES: Record<
  number,
  string
> = {
  1: "القارئ المنطلق",
  2: "القارئ المتقدم",
  3: "القارئ الواثق",
  4: "القارئ المتمكن",
  5: "القارئ المتميز",
  6: "بطل القراءة",
  7: "فارس الطلاقة",
  8: "سفير القراءة",
};

type ReviewAction =
  | "approve"
  | "reject";

type ReviewPayload = {
  requestId?: string;
  action?: ReviewAction;
  teacherNote?: string;
};

/*
 * التحقق من أن الطلب صادر
 * من حساب المعلم.
 */
async function getTeacherFromRequest(
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

  const email =
    typeof decodedToken.email ===
    "string"
      ? decodedToken.email
          .trim()
          .toLowerCase()
      : "";

  const role =
    typeof decodedToken.role ===
    "string"
      ? decodedToken.role
      : "";

  /*
   * ندعم الحالتين:
   * - custom claim = teacher
   * - بريد المعلم الرسمي
   */
  const isTeacher =
    role === "teacher" ||
    email ===
      TEACHER_EMAIL.toLowerCase();

  if (!isTeacher) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return {
    uid:
      decodedToken.uid,

    email,
  };
}

/*
 * =====================================================
 * GET
 * =====================================================
 *
 * تحميل طلبات اختبارات الترقية
 * لعرضها في لوحة المعلم.
 */
export async function GET(
  request: Request
) {
  try {
    await getTeacherFromRequest(
      request
    );

    const {
      adminDb,
    } =
      getFirebaseAdmin();

    /*
     * عدد الطلبات سيكون صغيرًا،
     * ونقرأها عند فتح صفحة المراجعة فقط.
     */
    const snapshot =
      await adminDb
        .collection(
          "fluencyPromotionRequests"
        )
        .orderBy(
          "submittedAt",
          "desc"
        )
        .limit(100)
        .get();

    const requests =
      snapshot.docs.map(
        (
          document
        ) => {
          const data =
            document.data();

          const submittedAt =
            data.submittedAt &&
            typeof data
              .submittedAt
              .toDate ===
              "function"
              ? data.submittedAt
                  .toDate()
                  .toISOString()
              : "";

          const reviewedAt =
            data.reviewedAt &&
            typeof data
              .reviewedAt
              .toDate ===
              "function"
              ? data.reviewedAt
                  .toDate()
                  .toISOString()
              : "";

          return {
            id:
              document.id,

            studentId:
              typeof data.studentId ===
              "string"
                ? data.studentId
                : "",

            studentName:
              typeof data.studentName ===
              "string"
                ? data.studentName
                : "طالب لغتي",

            classroom:
              typeof data.classroom ===
              "string"
                ? data.classroom
                : "",

            fromLevel:
              typeof data.fromLevel ===
              "number"
                ? data.fromLevel
                : 1,

            targetLevel:
              typeof data.targetLevel ===
              "number"
                ? data.targetLevel
                : 2,

            levelTitle:
              typeof data.levelTitle ===
              "string"
                ? data.levelTitle
                : "",

            textId:
              typeof data.textId ===
              "string"
                ? data.textId
                : "",

            audioUrl:
              typeof data.audioUrl ===
              "string"
                ? data.audioUrl
                : "",

            durationSeconds:
              typeof data
                .durationSeconds ===
              "number"
                ? data
                    .durationSeconds
                : 0,

            approvedReadings:
              typeof data
                .approvedReadings ===
              "number"
                ? data
                    .approvedReadings
                : 0,

            attemptNumber:
              typeof data
                .attemptNumber ===
              "number"
                ? data
                    .attemptNumber
                : 1,

            status:
              typeof data.status ===
              "string"
                ? data.status
                : "pending",

            teacherNote:
              typeof data
                .teacherNote ===
              "string"
                ? data
                    .teacherNote
                : "",

            submittedAt,

            reviewedAt,
          };
        }
      );

    return NextResponse.json({
      success: true,

      count:
        requests.length,

      pendingCount:
        requests.filter(
          (
            item
          ) =>
            item.status ===
            "pending"
        ).length,

      approvedCount:
        requests.filter(
          (
            item
          ) =>
            item.status ===
            "approved"
        ).length,

      rejectedCount:
        requests.filter(
          (
            item
          ) =>
            item.status ===
            "rejected"
        ).length,

      requests,
    });
  } catch (error) {
    console.error(
      "Fluency review GET error:",
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
            "يجب تسجيل الدخول أولًا.",
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
            "هذا القسم مخصص للمعلم.",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر تحميل اختبارات الترقية.",
        requests: [],
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
 * اعتماد أو رفض اختبار الترقية.
 */
export async function POST(
  request: Request
) {
  try {
    const teacher =
      await getTeacherFromRequest(
        request
      );

    const body =
      (await request.json()) as
        ReviewPayload;

    const requestId =
      typeof body.requestId ===
        "string"
        ? body.requestId.trim()
        : "";

    const action =
      body.action;

    const teacherNote =
      typeof body.teacherNote ===
      "string"
        ? body.teacherNote
            .trim()
        : "";

    if (!requestId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "معرف طلب الترقية غير متوفر.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      action !== "approve" &&
      action !== "reject"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "إجراء المراجعة غير صحيح.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      adminDb,
    } =
      getFirebaseAdmin();

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
     * الرفض
     * =================================================
     *
     * لا يغير مستوى الطالب.
     */
    if (
      action ===
      "reject"
    ) {
      await adminDb.runTransaction(
        async (
          transaction
        ) => {
          const promotionSnapshot =
            await transaction.get(
              promotionRef
            );

          if (
            !promotionSnapshot.exists
          ) {
            throw new Error(
              "REQUEST_NOT_FOUND"
            );
          }

          const promotionData =
            promotionSnapshot.data() ??
            {};

          const status =
            typeof promotionData
              .status ===
            "string"
              ? promotionData.status
              : "";

          if (
            status !==
            "pending"
          ) {
            throw new Error(
              "REQUEST_ALREADY_REVIEWED"
            );
          }

          transaction.update(
            promotionRef,
            {
              status:
                "rejected",

              teacherNote,

              reviewedAt:
                FieldValue
                  .serverTimestamp(),

              reviewedBy:
                teacher.uid,

              reviewedByEmail:
                teacher.email,

              updatedAt:
                FieldValue
                  .serverTimestamp(),
            }
          );
        }
      );

      return NextResponse.json({
        success: true,

        status:
          "rejected",

        message:
          "تم رفض اختبار الترقية، ويمكن للطالب إعادة المحاولة بنص جديد.",
      });
    }

    /*
     * =================================================
     * الاعتماد
     * =================================================
     *
     * يتم داخل Transaction واحدة:
     *
     * 1) قراءة طلب الترقية.
     * 2) قراءة المستوى الرسمي للطالب.
     * 3) التحقق من أن الترقية للمستوى التالي فقط.
     * 4) تحديث fluencyLevel.
     * 5) اعتماد الطلب.
     */
    await adminDb.runTransaction(
      async (
        transaction
      ) => {
        const promotionSnapshot =
          await transaction.get(
            promotionRef
          );

        if (
          !promotionSnapshot.exists
        ) {
          throw new Error(
            "REQUEST_NOT_FOUND"
          );
        }

        const promotionData =
          promotionSnapshot.data() ??
          {};

        const status =
          typeof promotionData
            .status ===
          "string"
            ? promotionData.status
            : "";

        if (
          status !==
          "pending"
        ) {
          throw new Error(
            "REQUEST_ALREADY_REVIEWED"
          );
        }

        const studentId =
          typeof promotionData
            .studentId ===
          "string"
            ? promotionData
                .studentId
                .trim()
            : "";

        const targetLevel =
          typeof promotionData
            .targetLevel ===
          "number"
            ? promotionData
                .targetLevel
            : 0;

        const fromLevel =
          typeof promotionData
            .fromLevel ===
          "number"
            ? promotionData
                .fromLevel
            : targetLevel - 1;

        const studentName =
          typeof promotionData
            .studentName ===
          "string" &&
          promotionData.studentName.trim()
            ? promotionData.studentName.trim()
            : "بطل لغتي";

        const levelTitle =
          typeof promotionData
            .levelTitle ===
          "string" &&
          promotionData.levelTitle.trim()
            ? promotionData.levelTitle.trim()
            : FLUENCY_LEVEL_TITLES[
                targetLevel
              ] ||
              `المستوى ${targetLevel}`;

        if (
          !studentId ||
          targetLevel < 2 ||
          targetLevel > 8
        ) {
          throw new Error(
            "INVALID_PROMOTION_REQUEST"
          );
        }

        const progressRef =
          adminDb
            .collection(
              "reading-progress"
            )
            .doc(
              studentId
            );

        /*
         * إشعار الترقية له معرف ثابت مرتبط بطلب الترقية،
         * لذلك لا يمكن أن يتكرر لنفس الطلب.
         */
        const promotionNotificationRef =
          adminDb
            .collection(
              "studentNotifications"
            )
            .doc(
              `fluency-promotion-${requestId}`
            );

        const progressSnapshot =
          await transaction.get(
            progressRef
          );

        const progressData =
          progressSnapshot.exists
            ? progressSnapshot.data() ??
              {}
            : {};

        /*
         * إذا لم يوجد fluencyLevel
         * نعتبر المستوى الرسمي = 1.
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
         * منع اعتماد نفس المستوى
         * مرة أخرى.
         */
        if (
          currentFluencyLevel >=
          targetLevel
        ) {
          throw new Error(
            "LEVEL_ALREADY_REACHED"
          );
        }

        /*
         * أهم حماية:
         *
         * يجب أن تكون الترقية
         * للمستوى التالي فقط.
         *
         * 1 → 2
         * 2 → 3
         * ...
         * 7 → 8
         */
        if (
          targetLevel !==
          currentFluencyLevel + 1
        ) {
          throw new Error(
            "LEVEL_SKIP_NOT_ALLOWED"
          );
        }

        /*
         * نتأكد كذلك أن fromLevel
         * الخاص بالطلب متوافق
         * مع المستوى الحالي.
         */
        if (
          fromLevel !==
          currentFluencyLevel
        ) {
          throw new Error(
            "FROM_LEVEL_MISMATCH"
          );
        }

        /*
         * تحديث المستوى الرسمي.
         *
         * عدد القراءات لا يتغير هنا.
         */
        transaction.set(
          progressRef,
          {
            fluencyLevel:
              targetLevel,

            fluencyLevelUpdatedAt:
              FieldValue
                .serverTimestamp(),

            lastPromotionRequestId:
              requestId,

            lastPromotedFromLevel:
              currentFluencyLevel,

            lastPromotedToLevel:
              targetLevel,

            updatedAt:
              FieldValue
                .serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        /*
         * اعتماد الطلب نفسه.
         */
        transaction.update(
          promotionRef,
          {
            status:
              "approved",

            teacherNote,

            approvedLevel:
              targetLevel,

            reviewedAt:
              FieldValue
                .serverTimestamp(),

            approvedAt:
              FieldValue
                .serverTimestamp(),

            reviewedBy:
              teacher.uid,

            reviewedByEmail:
              teacher.email,

            updatedAt:
              FieldValue
                .serverTimestamp(),
          }
        );

        /*
         * =================================================
         * إشعار + احتفالية الترقية
         * =================================================
         *
         * JourneyPage يعرض إشعارات academy-milestone
         * كنافذة احتفالية عند دخول الطالب.
         *
         * المعرف ثابت، لذلك لا يتكرر الإشعار
         * لنفس طلب الترقية.
         */
        transaction.set(
          promotionNotificationRef,
          {
            studentId,

            title:
              "🏔️ ترقية جديدة في قمة الطلاقة",

            message:
              `🎉 أحسنت يا ${studentName}! اجتزت اختبار قمة الطلاقة بنجاح، وتمت ترقيتك إلى المستوى ${targetLevel} — ${levelTitle}. واصل الصعود نحو القمة!`,

            type:
              "academy-milestone",

            href:
              "/reading-journey/fluency-levels",

            read:
              false,

            milestoneId:
              `fluency-level-${targetLevel}`,

            badgeTitle:
              `المستوى ${targetLevel} — ${levelTitle}`,

            source:
              "fluency-promotion",

            promotionRequestId:
              requestId,

            fromLevel:
              currentFluencyLevel,

            targetLevel,

            createdAt:
              FieldValue
                .serverTimestamp(),

            updatedAt:
              FieldValue
                .serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      }
    );

    return NextResponse.json({
      success: true,

      status:
        "approved",

      message:
        "🎉 تم اعتماد الترقية وتحديث مستوى الطالب بنجاح.",
    });
  } catch (error) {
    console.error(
      "Fluency review POST error:",
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
            "يجب تسجيل الدخول أولًا.",
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
            "هذا الإجراء مخصص للمعلم.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      message ===
      "REQUEST_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "طلب الترقية غير موجود.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      message ===
      "REQUEST_ALREADY_REVIEWED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تمت مراجعة هذا الاختبار سابقًا.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      message ===
      "LEVEL_ALREADY_REACHED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "الطالب وصل إلى هذا المستوى بالفعل.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      message ===
        "LEVEL_SKIP_NOT_ALLOWED" ||
      message ===
        "FROM_LEVEL_MISMATCH"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لا يمكن تخطي مستويات قمة الطلاقة. يجب اجتياز المستويات بالترتيب.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      message ===
      "INVALID_PROMOTION_REQUEST"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "بيانات طلب الترقية غير صحيحة.",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,

        message:
          "تعذر مراجعة اختبار الترقية حاليًا.",
      },
      {
        status: 500,
      }
    );
  }
}