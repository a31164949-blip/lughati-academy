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

  const token = authorization.slice(7);

  const { adminAuth } =
    getFirebaseAdmin();

  const decodedToken =
    await adminAuth.verifyIdToken(token);

  if (decodedToken.role !== "student") {
    throw new Error("FORBIDDEN");
  }

  const studentDocId =
    typeof decodedToken.studentDocId ===
    "string"
      ? decodedToken.studentDocId
      : "";

  if (!studentDocId) {
    throw new Error("STUDENT_NOT_FOUND");
  }

  return studentDocId;
}

export async function POST(
  request: Request
) {
  try {
    const studentDocId =
      await getStudentFromRequest(request);

    const { adminDb } =
      getFirebaseAdmin();

    const diagnosticSnapshot =
      await adminDb
        .collection("diagnosticResponses")
        .where(
          "studentId",
          "==",
          studentDocId
        )
        .limit(1)
        .get();

    // الطالب أكمل الاستمارة بالفعل.
    if (!diagnosticSnapshot.empty) {
      return NextResponse.json({
        ok: true,
        completed: true,
        reminderCreated: false,
      });
    }

    const notificationRef =
      adminDb
        .collection(
          "studentNotifications"
        )
        .doc(
          `diagnostic-reminder-${studentDocId}`
        );

    const notificationSnapshot =
      await notificationRef.get();

    // لا نكرر التنبيه إذا كان موجودًا.
    if (notificationSnapshot.exists) {
      return NextResponse.json({
        ok: true,
        completed: false,
        reminderCreated: false,
      });
    }

    await notificationRef.set({
      studentId: studentDocId,
      title: "📋 أكمل دراسة الحالة",
      message:
        "نرجو إكمال استمارة التشخيص الأولي بمساعدة الأسرة؛ لتساعد معلمك على تقديم الدعم المناسب لك.",
      type: "diagnostic-reminder",
      homeworkId: "",
      href: "/forms/diagnostic",
      read: false,
      createdAt:
        FieldValue.serverTimestamp(),
      updatedAt:
        FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      completed: false,
      reminderCreated: true,
    });
  } catch (error) {
    console.error(
      "Diagnostic reminder API error:",
      error
    );

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to sync diagnostic reminder",
      },
      { status: 500 }
    );
  }
}