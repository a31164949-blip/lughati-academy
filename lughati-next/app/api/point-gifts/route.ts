import {
  NextResponse,
} from "next/server";

import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  getFirebaseAdmin,
} from "../../../firebase-admin";

export const runtime = "nodejs";

const TEACHER_EMAIL =
  "a31164949@gmail.com";

type GiftPayload = {
  studentDocId?: string;
  points?: number;
  reason?: string;
};

async function requireTeacher(
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
    uid: decodedToken.uid,
    email,
  };
}

export async function POST(
  request: Request
) {
  try {
    const teacher =
      await requireTeacher(
        request
      );

    const payload =
      (await request.json()) as
        GiftPayload;

    const studentDocId =
      typeof payload.studentDocId ===
        "string"
        ? payload.studentDocId.trim()
        : "";

    const points =
      typeof payload.points ===
        "number"
        ? payload.points
        : Number.NaN;

    const reason =
      typeof payload.reason ===
        "string"
        ? payload.reason.trim()
        : "";

    if (!studentDocId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم تحديد الطالب.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(points) ||
      points <= 0 ||
      points > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "عدد النقاط يجب أن يكون رقمًا صحيحًا من 1 إلى 100.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      reason.length < 2 ||
      reason.length > 250
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "اكتب سببًا واضحًا للهدية لا يتجاوز 250 حرفًا.",
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

    const studentRef =
      adminDb
        .collection(
          "students"
        )
        .doc(
          studentDocId
        );

    const result =
      await adminDb.runTransaction(
        async (
          transaction
        ) => {
          const studentSnapshot =
            await transaction.get(
              studentRef
            );

          if (
            !studentSnapshot.exists
          ) {
            throw new Error(
              "STUDENT_NOT_FOUND"
            );
          }

          const studentData =
            studentSnapshot.data() ??
            {};

          const studentName =
            typeof studentData.studentName ===
              "string" &&
            studentData.studentName.trim()
              ? studentData.studentName.trim()
              : "طالب";

          const classroom =
            typeof studentData.classroom ===
            "string"
              ? studentData.classroom
              : "";

          const studentId =
            typeof studentData.studentId ===
              "string" &&
            studentData.studentId.trim()
              ? studentData.studentId.trim()
              : studentDocId;

          const currentPoints =
            typeof studentData.points ===
            "number"
              ? studentData.points
              : 0;

          const giftHistoryEntry = {
            reason:
              `🎁 هدية من المعلم: ${reason}`,
            points,
            stars: 0,
            category:
              "هدية من المعلم",
            type:
              "teacherGift",
            createdAt:
              new Date(),
          };

          transaction.update(
            studentRef,
            {
              points:
                FieldValue.increment(
                  points
                ),

              "journey.xp":
                FieldValue.increment(
                  points
                ),

              pointsHistory:
                FieldValue.arrayUnion(
                  giftHistoryEntry
                ),

              updatedAt:
                FieldValue.serverTimestamp(),
            }
          );

          const transactionRef =
            adminDb
              .collection(
                "pointTransactions"
              )
              .doc();

          transaction.set(
            transactionRef,
            {
              studentId:
                studentDocId,
              academyStudentId:
                studentId,
              studentName,
              classroom,
              points,
              amount: points,
              type:
                "teacherGift",
              source:
                "teacherGift",
              reason,
              teacherUid:
                teacher.uid,
              teacherEmail:
                teacher.email,
              createdAt:
                FieldValue.serverTimestamp(),
            }
          );

          const notificationRef =
            adminDb
              .collection(
                "studentNotifications"
              )
              .doc();

          transaction.set(
            notificationRef,
            {
              /*
                studentId يجب أن يساوي
                document id لأن قواعد الطالب
                تعتمد studentDocId.
              */
              studentId:
                studentDocId,
              academyStudentId:
                studentId,
              studentName,
              classroom,
              type:
                "teacherGift",
              title:
                "🎁 لديك هدية من معلمك!",
              message:
                `حصلت على ${points} نقطة ⭐ بسبب: ${reason}`,
              points,
              reason,
              read: false,
              opened: false,
              createdAt:
                FieldValue.serverTimestamp(),
              updatedAt:
                FieldValue.serverTimestamp(),
            }
          );

          return {
            studentName,
            newPoints:
              currentPoints +
              points,
          };
        }
      );

    return NextResponse.json(
      {
        success: true,
        message:
          `تم إهداء ${points} نقطة إلى ${result.studentName}.`,
        newPoints:
          result.newPoints,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Point gift API error:",
      error
    );

    if (
      error instanceof Error &&
      error.message ===
        "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "يجب تسجيل الدخول بحساب المعلم.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "هذا الحساب غير مخول بإهداء النقاط.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "STUDENT_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم العثور على الطالب.",
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
          "تعذر إرسال هدية النقاط في الوقت الحالي.",
      },
      {
        status: 500,
      }
    );
  }
}
