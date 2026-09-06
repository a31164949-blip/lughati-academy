import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

async function getStudentFromRequest(
  request: Request
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization?.startsWith("Bearer ")
  ) {
    throw new Error("UNAUTHORIZED");
  }

  const token =
    authorization.slice(7);

  const { adminAuth } =
    getFirebaseAdmin();

  const decodedToken =
    await adminAuth.verifyIdToken(token);

  if (
    decodedToken.role !== "student"
  ) {
    throw new Error("FORBIDDEN");
  }

  const studentDocId =
    typeof decodedToken.studentDocId ===
    "string"
      ? decodedToken.studentDocId
      : "";

  if (!studentDocId) {
    throw new Error(
      "STUDENT_NOT_FOUND"
    );
  }

  return studentDocId;
}

export async function GET(
  request: Request
) {
  try {
    const studentDocId =
      await getStudentFromRequest(
        request
      );

    const { adminDb } =
      getFirebaseAdmin();

    const snapshot =
      await adminDb
        .collection("studentWorks")
        .where(
          "studentId",
          "==",
          studentDocId
        )
        .where(
          "workType",
          "==",
          "video"
        )
        .where(
          "tiktokConsentStatus",
          "==",
          "pending"
        )
        .limit(1)
        .get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        request: null,
      });
    }

    const document =
      snapshot.docs[0];

    const data =
      document.data() ?? {};

    return NextResponse.json({
      success: true,

      request: {
        id: document.id,

        title:
          typeof data.title ===
          "string"
            ? data.title
            : "مشاركة الطالب",

        fileUrl:
          typeof data.fileUrl ===
          "string"
            ? data.fileUrl
            : "",
      },
    });
  } catch (error) {
    console.error(
      "TikTok consent GET error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "غير مصرح بالدخول.",
        },
        { status: 401 }
      );
    }

    if (
      message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "هذا المسار مخصص للطلاب.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر تحميل طلب الموافقة.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const studentDocId =
      await getStudentFromRequest(
        request
      );

    const body =
      await request.json();

    const workId =
      typeof body?.workId === "string"
        ? body.workId
        : "";

    const decision =
      body?.decision === "approved"
        ? "approved"
        : body?.decision === "rejected"
          ? "rejected"
          : "";

    if (!workId || !decision) {
      return NextResponse.json(
        {
          success: false,
          message:
            "بيانات الرد غير صحيحة.",
        },
        { status: 400 }
      );
    }

    const { adminDb } =
      getFirebaseAdmin();

    const workRef =
      adminDb
        .collection("studentWorks")
        .doc(workId);

    const result =
      await adminDb.runTransaction(
        async (transaction) => {
          const snapshot =
            await transaction.get(
              workRef
            );

          if (!snapshot.exists) {
            throw new Error(
              "WORK_NOT_FOUND"
            );
          }

          const data =
            snapshot.data() ?? {};

          if (
            data.studentId !==
            studentDocId
          ) {
            throw new Error(
              "FORBIDDEN"
            );
          }

          if (
            data.workType !==
            "video"
          ) {
            throw new Error(
              "INVALID_WORK"
            );
          }

          if (
            data.tiktokConsentStatus !==
            "pending"
          ) {
            return {
              alreadyAnswered: true,
            };
          }

          transaction.update(
            workRef,
            {
              tiktokConsentStatus:
                decision,

              tiktokConsentRespondedAt:
                FieldValue
                  .serverTimestamp(),

              updatedAt:
                FieldValue
                  .serverTimestamp(),
            }
          );

          return {
            alreadyAnswered: false,
          };
        }
      );

    return NextResponse.json({
      success: true,

      alreadyAnswered:
        result.alreadyAnswered,

      message:
        decision === "approved"
          ? "تم تسجيل موافقة ولي الأمر على هذا المقطع فقط ✅"
          : "تم تسجيل عدم الموافقة، ولن يُنشر المقطع على TikTok.",
    });
  } catch (error) {
    console.error(
      "TikTok consent POST error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "غير مصرح بالدخول.",
        },
        { status: 401 }
      );
    }

    if (
      message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "غير مصرح بهذا الطلب.",
        },
        { status: 403 }
      );
    }

    if (
      message ===
      "WORK_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم العثور على المقطع.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر حفظ الموافقة.",
      },
      { status: 500 }
    );
  }
}