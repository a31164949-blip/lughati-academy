import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

type SubmitQuizRequest = {
  quizId?: string;
  answers?: unknown[];
};

export async function POST(request: Request) {
  try {
    const { adminAuth, adminDb } = getFirebaseAdmin();

    // 1) التحقق من هوية الطالب
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "يجب تسجيل الدخول أولًا." },
        { status: 401 }
      );
    }

    const idToken = authorization.slice("Bearer ".length);
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (decodedToken.role !== "student") {
      return NextResponse.json(
        { success: false, message: "هذا المسار مخصص للطلاب فقط." },
        { status: 403 }
      );
    }

    const studentDocId =
      typeof decodedToken.studentDocId === "string"
        ? decodedToken.studentDocId
        : "";

    if (!studentDocId) {
      return NextResponse.json(
        { success: false, message: "تعذر تحديد حساب الطالب." },
        { status: 403 }
      );
    }

    // 2) قراءة الطلب
    const body = (await request.json()) as SubmitQuizRequest;

    const quizId =
      typeof body.quizId === "string"
        ? body.quizId.trim()
        : "";

    const answers = Array.isArray(body.answers)
      ? body.answers
      : [];

    if (!quizId) {
      return NextResponse.json(
        { success: false, message: "لم يتم تحديد الاختبار." },
        { status: 400 }
      );
    }

    // 3) قراءة الاختبار الحقيقي من Firestore على الخادم
    const quizSnapshot = await adminDb
      .collection("quizzes")
      .doc(quizId)
      .get();

    if (!quizSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "الاختبار غير موجود." },
        { status: 404 }
      );
    }

    const quizData = quizSnapshot.data();

    if (!quizData || quizData.published !== true) {
      return NextResponse.json(
        { success: false, message: "هذا الاختبار غير متاح حاليًا." },
        { status: 403 }
      );
    }

    const questions = Array.isArray(quizData.questions)
      ? quizData.questions
      : [];

    // 4) حساب الدرجة على الخادم
    let autoScore = 0;
    let autoTotal = 0;
    let needsTeacherReview = false;

    questions.forEach((question, questionIndex) => {
      const questionType =
        typeof question?.questionType === "string"
          ? question.questionType
          : "multiple-choice";

      const points =
        typeof question?.points === "number"
          ? question.points
          : 1;

      if (
        questionType === "multiple-choice" ||
        questionType === "yes-no"
      ) {
        autoTotal += points;

        if (answers[questionIndex] === question.correctAnswer) {
          autoScore += points;
        }
      } else {
        needsTeacherReview = true;
      }
    });

    // 5) قراءة اسم الطالب وفصله من قاعدة البيانات
    const studentSnapshot = await adminDb
      .collection("students")
      .doc(studentDocId)
      .get();

    const studentData = studentSnapshot.exists
      ? studentSnapshot.data()
      : undefined;

    const studentId = studentDocId;

    const studentName =
      typeof studentData?.studentName === "string"
        ? studentData.studentName
        : "طالب";

    // 6) إنشاء النتيجة من الخادم
    const previousResultSnapshot = await adminDb
  .collection("quizResults")
  .where("studentId", "==", studentId)
  .where("quizId", "==", quizId)
  .limit(1)
  .get();

if (!previousResultSnapshot.empty) {
  return NextResponse.json(
    {
      success: false,
      message: "سبق أن أرسلت هذا الاختبار، ولا يمكن إرساله مرة أخرى.",
    },
    { status: 409 }
  );
}
    const resultReference = await adminDb
      .collection("quizResults")
      .add({
        quizId,
        quizTitle:
          typeof quizData.title === "string"
            ? quizData.title
            : "اختبار",

        studentId,
        studentName,

        answers,

        autoScore,
        autoTotal,

        totalScore:
          typeof quizData.totalPoints === "number"
            ? quizData.totalPoints
            : autoTotal,

        needsTeacherReview,
        reviewStatus: needsTeacherReview
          ? "pending"
          : "completed",

        submittedAt: FieldValue.serverTimestamp(),

        parentViewed: false,
      });

    return NextResponse.json({
      success: true,
      resultId: resultReference.id,
      autoScore,
      autoTotal,
      needsTeacherReview,
      message: needsTeacherReview
        ? "تم إرسال الاختبار وينتظر مراجعة المعلم."
        : "تم إرسال الاختبار بنجاح.",
    });
  } catch (error) {
    console.error("Quiz submit error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر إرسال الاختبار. حاول مرة أخرى.",
      },
      { status: 500 }
    );
  }
}