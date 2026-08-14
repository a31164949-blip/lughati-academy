import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { adminAuth, adminDb } = getFirebaseAdmin();

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "يجب تسجيل الدخول أولًا.",
        },
        { status: 401 }
      );
    }

    const idToken = authorization.slice("Bearer ".length);
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (decodedToken.role !== "student") {
      return NextResponse.json(
        {
          success: false,
          message: "هذا المسار مخصص للطلاب فقط.",
        },
        { status: 403 }
      );
    }
const studentDocId =
  typeof decodedToken.studentDocId === "string"
    ? decodedToken.studentDocId
    : "";

if (!studentDocId) {
  return NextResponse.json(
    {
      success: false,
      message: "تعذر تحديد حساب الطالب.",
    },
    { status: 400 }
  );
}

const studentSnapshot = await adminDb
  .collection("students")
  .doc(studentDocId)
  .get();

if (!studentSnapshot.exists) {
  return NextResponse.json(
    {
      success: false,
      message: "لم يتم العثور على بيانات الطالب.",
    },
    { status: 404 }
  );
}

const studentData = studentSnapshot.data();
const normalizeClassroom = (value: string) => {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized === "all" || normalized.includes("جميع")) {
    return "all";
  }

  if (normalized.endsWith("ب")) {
    return "ب";
  }

  if (normalized.endsWith("أ")) {
    return "أ";
  }

  return normalized;
};
const studentClassroom =
  typeof studentData?.classroom === "string"
    ? normalizeClassroom(studentData.classroom)
    : "";
   

    const snapshot = await adminDb
      .collection("quizzes")
      .where("published", "==", true)
      .get();

    const quizzes = snapshot.docs
  .filter((docSnapshot) => {
    const data = docSnapshot.data();

    const quizClassroom =
  typeof data.classroom === "string"
    ? normalizeClassroom(data.classroom)
    : "";


    return (
      quizClassroom === "" ||
      quizClassroom === "all" ||
      quizClassroom === studentClassroom
    );
  })
  .map((docSnapshot) => {
      const data = docSnapshot.data();

      const questions = Array.isArray(data.questions)
        ? data.questions.map((question: Record<string, unknown>) => {
            const {
              correctAnswer,
              ...safeQuestion
            } = question;

            return safeQuestion;
          })
        : [];

      return {
        id: docSnapshot.id,
        title:
          typeof data.title === "string"
            ? data.title
            : "اختبار",
        description:
          typeof data.description === "string"
            ? data.description
            : "",
        classroom:
          typeof data.classroom === "string"
            ? data.classroom
            : "",
        totalQuestions:
          typeof data.totalQuestions === "number"
            ? data.totalQuestions
            : questions.length,
        totalPoints:
          typeof data.totalPoints === "number"
            ? data.totalPoints
            : 0,
        questions,
      };
    });

    return NextResponse.json({
      success: true,
      quizzes,
    });
  } catch (error) {
    console.error("Student quizzes error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر تحميل الاختبارات.",
      },
      { status: 500 }
    );
  }
}