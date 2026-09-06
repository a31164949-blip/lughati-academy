import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

async function getStudentFromRequest(request: Request) {
  const authorization =
    request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = authorization.slice(7);
  const { adminAuth } = getFirebaseAdmin();
  const decodedToken =
    await adminAuth.verifyIdToken(token);

  if (decodedToken.role !== "student") {
    throw new Error("FORBIDDEN");
  }

  const studentDocId =
    typeof decodedToken.studentDocId === "string"
      ? decodedToken.studentDocId
      : "";

  if (!studentDocId) {
    throw new Error("STUDENT_NOT_FOUND");
  }

  return studentDocId;
}

export async function GET(request: Request) {
  try {
    const studentDocId =
      await getStudentFromRequest(request);

    const { adminDb } = getFirebaseAdmin();

    const snapshot =
      await adminDb
        .collection("studentNotifications")
        .where("studentId", "==", studentDocId)
        .orderBy("createdAt", "desc")
        .limit(12)
        .get();

    const notifications =
      snapshot.docs.map((document) => {
        const data = document.data() ?? {};
        return {
          id: document.id,
          studentId:
            typeof data.studentId === "string"
              ? data.studentId
              : "",
          title:
            typeof data.title === "string"
              ? data.title
              : "إشعار جديد",
          message:
            typeof data.message === "string"
              ? data.message
              : "",
          type:
            typeof data.type === "string"
              ? data.type
              : "",
          homeworkId:
            typeof data.homeworkId === "string"
              ? data.homeworkId
              : "",
          href:
            typeof data.href === "string" && data.href
              ? data.href
              : "/homeworks",
          read: data.read === true,
          milestoneId:
            typeof data.milestoneId === "string"
              ? data.milestoneId
              : "",
          badgeTitle:
            typeof data.badgeTitle === "string"
              ? data.badgeTitle
              : "",
          pointsReached:
            typeof data.pointsReached === "number"
              ? data.pointsReached
              : undefined,
          createdAt:
            data.createdAt?.toDate
              ? data.createdAt.toDate().toISOString()
              : null,
        };
      });

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error(
      "Student notifications GET error:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        message: "تعذر تحميل الإشعارات.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const studentDocId =
      await getStudentFromRequest(request);

    const body = await request.json();
    const notificationId =
      typeof body?.notificationId === "string"
        ? body.notificationId
        : "";

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          message: "معرف الإشعار غير صحيح.",
        },
        { status: 400 }
      );
    }

    const { adminDb } = getFirebaseAdmin();
    const notificationRef =
      adminDb
        .collection("studentNotifications")
        .doc(notificationId);

    await adminDb.runTransaction(
      async (transaction) => {
        const snapshot =
          await transaction.get(notificationRef);

        if (!snapshot.exists) {
          throw new Error("NOT_FOUND");
        }

        const data = snapshot.data() ?? {};

        if (data.studentId !== studentDocId) {
          throw new Error("FORBIDDEN");
        }

        if (data.read === true) return;

        transaction.update(notificationRef, {
          read: true,
          readAt: FieldValue.serverTimestamp(),
        });
      }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Student notifications POST error:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        message: "تعذر تحديث الإشعار.",
      },
      { status: 500 }
    );
  }
}
