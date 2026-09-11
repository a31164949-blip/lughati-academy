import {
  NextResponse,
} from "next/server";

import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  getFirebaseAdmin,
} from "../../../../firebase-admin";

export const runtime =
  "nodejs";

const TEACHER_EMAIL =
  "a31164949@gmail.com";

type ApprovePayload = {
  nominationId?: string;
  action?: "approve" | "reject";
  category?: string;
  teacherNote?: string;
  rejectionReason?: string;
};

function mapNotebookCategory(value: unknown) {
  const normalized =
    typeof value === "string"
      ? value.trim().toLowerCase()
      : "";

  const categoryMap: Record<string, string> = {
    handwriting: "handwriting",
    design: "formatting",
    formatting: "formatting",
    "خط جميل": "handwriting",
    "تنسيق مميز": "formatting",
    care: "care",
    "عناية بالدفتر": "care",
    progress: "improvement",
    improvement: "improvement",
    "تطور ملحوظ": "improvement",
  };

  return categoryMap[normalized] || "";
}

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

export async function POST(
  request: Request
) {
  try {
    const teacher =
      await getTeacherFromRequest(
      request
      );

    const payload =
      (await request.json()) as
        ApprovePayload;

    const nominationId =
      typeof payload.nominationId ===
      "string"
        ? payload.nominationId.trim()
        : "";

    const action =
      payload.action === "reject"
        ? "reject"
        : "approve";

    const category = mapNotebookCategory(
      payload.category
    );

    const teacherNote =
      typeof payload.teacherNote ===
      "string"
        ? payload.teacherNote.trim()
        : "";

    const rejectionReason =
      typeof payload.rejectionReason ===
      "string"
        ? payload.rejectionReason.trim()
        : "";
    if (!nominationId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "رقم الترشيح غير موجود.",
        },
        {
          status: 400,
        }
      );
    }

    const allowedCategories =
      new Set([
        "handwriting",
        "formatting",
        "care",
        "improvement",
      ]);

    if (
      action === "approve" &&
      !allowedCategories.has(
        category
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "اختر تصنيف التميز أولًا.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      rejectionReason.length >
      240
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "سبب الرفض طويل جدًا.",
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

    const nominationRef =
      adminDb
        .collection(
          "notebookNominations"
        )
        .doc(
          nominationId
        );

    const nominationSnapshot =
      await nominationRef.get();

    if (
      !nominationSnapshot.exists
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "الترشيح غير موجود.",
        },
        {
          status: 404,
        }
      );
    }

    const nominationData =
      nominationSnapshot.data() ||
      {};

    const studentId =
      typeof nominationData.studentId ===
      "string"
        ? nominationData.studentId
        : "";

    const studentName =
      typeof nominationData.studentName ===
      "string"
        ? nominationData.studentName
        : "طالب";

    const classroom =
      typeof nominationData.classroom ===
      "string"
        ? nominationData.classroom
        : "";

    const imageUrl =
      typeof nominationData.imageUrl ===
      "string"
        ? nominationData.imageUrl
        : "";

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تعذر تحديد الطالب.",
        },
        {
          status: 400,
        }
      );
    }

    const studentRef =
      adminDb
        .collection(
          "students"
        )
        .doc(
          studentId
        );

    const galleryRef =
      adminDb
        .collection(
          "notebookGallery"
        )
        .doc(
          `notebook-nomination-${nominationId}`
        );

    const pointsLogRef =
      adminDb
        .collection(
          "pointsTransactions"
        )
        .doc(
          `notebook-excellence-${nominationId}`
        );

    await adminDb.runTransaction(
      async (
        transaction
      ) => {
        const freshNominationSnapshot =
          await transaction.get(
            nominationRef
          );

        if (
          !freshNominationSnapshot.exists
        ) {
          throw new Error(
            "NOMINATION_NOT_FOUND"
          );
        }

        const freshData =
          freshNominationSnapshot.data() ||
          {};

        if (
          freshData.status !==
          "pending"
        ) {
          throw new Error(
            "ALREADY_REVIEWED"
          );
        }

        if (action === "reject") {
          transaction.update(
            nominationRef,
            {
              status:
                "rejected",

              rejectedAt:
                FieldValue.serverTimestamp(),

              rejectionReason,

              reviewedBy:
                teacher.email ||
                teacher.uid,

              updatedAt:
                FieldValue.serverTimestamp(),
            }
          );

          return;
        }

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
          studentSnapshot.data() ||
          {};

        const currentPoints =
          typeof studentData.points ===
          "number"
            ? studentData.points
            : 0;

        const currentExcellenceCount =
          typeof studentData.notebookExcellenceCount ===
          "number"
            ? studentData.notebookExcellenceCount
            : 0;

        transaction.update(
          studentRef,
          {
            points:
              currentPoints + 5,

            notebookExcellenceCount:
              currentExcellenceCount + 1,

            notebookExcellencePoints:
              FieldValue.increment(
                5
              ),

            lastNotebookExcellenceAt:
              FieldValue.serverTimestamp(),
          }
        );

        transaction.set(
          pointsLogRef,
          {
            studentId,
            studentName,

            points:
              5,

            type:
              "notebook-excellence",

            reason:
              "اعتماد جماليات الدفاتر",

            nominationId,

            createdAt:
              FieldValue.serverTimestamp(),
          }
        );

        transaction.set(
          galleryRef,
          {
            studentId,
            studentName,
            classroom,

            category,

            note:
              teacherNote ||
              "دفتر متميز ✨",

            imageUrl,

            badge:
              "دفتر متميز ✨",

            isPublished:
              true,

            source:
              "notebook-nomination",

            nominationId,

            publishedAt:
              FieldValue.serverTimestamp(),
          }
        );

        transaction.update(
          nominationRef,
          {
            status:
              "approved",

            rewardGranted:
              true,

            excellenceGranted:
              true,

            approvedCategory:
              category,

            teacherNote,

            approvedAt:
              FieldValue.serverTimestamp(),

            updatedAt:
              FieldValue.serverTimestamp(),
          }
        );
      }
    );

    return NextResponse.json(
      {
        success: true,
        message:
          action === "reject"
            ? "تم رفض الترشيح، ويمكن للطالب إرسال محاولة جديدة لاحقًا."
            : "✅ تم اعتماد الدفتر ومنح الطالب 5 نقاط وتسجيل مرة تميز جديدة ونشر العمل في جماليات الدفاتر.",
      }
    );
  } catch (error) {
    console.error(
      "Notebook excellence approve API error:",
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
            "يرجى تسجيل دخول المعلم.",
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
            "هذا الإجراء مخصص للمعلم.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "ALREADY_REVIEWED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تمت مراجعة هذا الترشيح سابقًا، ولا يمكن اعتماده أو رفضه مرة أخرى.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "NOMINATION_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "الترشيح غير موجود.",
        },
        {
          status: 404,
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
          "تعذر اعتماد الدفتر حاليًا.",
      },
      {
        status: 500,
      }
    );
  }
}