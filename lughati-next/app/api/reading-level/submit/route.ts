import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";

const SKILLS = [
  "الحروف وأصواتها",
  "الحركات القصيرة",
  "المدود",
  "السكون والشدة والتنوين",
  "تحليل المقاطع",
  "قراءة الكلمات",
  "قراءة الجمل",
  "الفهم القرائي",
] as const;

const QUESTIONS = [
  { skill: 0, answer: "موز" },
  { skill: 0, answer: "ش" },
  { skill: 1, answer: "بُ" },
  { skill: 1, answer: "مِ" },
  { skill: 2, answer: "باب" },
  { skill: 2, answer: "نُو" },
  { skill: 3, answer: "شَمْس" },
  { skill: 3, answer: "كتابٌ" },
  { skill: 4, answer: "كَ / تَ / بَ" },
  { skill: 4, answer: "مَدْ / رَ / سَة" },
  { skill: 5, answer: "كتاب" },
  { skill: 5, answer: "مدرسة" },
  { skill: 6, answer: "ذهب سامي إلى المدرسة." },
  { skill: 6, answer: "ليلى تقرأ قصة." },
  { skill: 7, answer: "سقت النبتة" },
  { skill: 7, answer: "على الرف" },
] as const;

type SubmitPayload = {
  answers?: unknown[];
  submissionId?: unknown;
};

function getResultTitle(masteredSkills: number, coreMastered: boolean) {
  if (masteredSkills <= 2) return "بداية قوية";
  if (masteredSkills <= 5) return "أتقدم بثقة";
  if (!coreMastered || masteredSkills < 8) return "متقن لمهارات المستوى";
  return "قارئ متميز";
}

async function getStudentDocId(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const { adminAuth } = getFirebaseAdmin();
  const decodedToken = await adminAuth.verifyIdToken(authorization.slice(7));

  if (decodedToken.role !== "student") {
    throw new Error("FORBIDDEN");
  }

  const studentDocId =
    typeof decodedToken.studentDocId === "string"
      ? decodedToken.studentDocId.trim()
      : "";

  if (!studentDocId) {
    throw new Error("STUDENT_NOT_FOUND");
  }

  return studentDocId;
}

export async function POST(request: Request) {
  try {
    const studentDocId = await getStudentDocId(request);
    const payload = (await request.json()) as SubmitPayload;
    const answers = Array.isArray(payload.answers) ? payload.answers : [];
    const submissionId =
      typeof payload.submissionId === "string"
        ? payload.submissionId.trim()
        : "";

    if (answers.length !== QUESTIONS.length || !submissionId) {
      return NextResponse.json(
        { success: false, message: "بيانات نتيجة الاختبار غير مكتملة." },
        { status: 400 }
      );
    }

    const normalizedAnswers = answers.map((answer) =>
      typeof answer === "string" ? answer.trim() : ""
    );
    const skillCorrect = SKILLS.map(() => 0);

    QUESTIONS.forEach((question, index) => {
      if (normalizedAnswers[index] === question.answer) {
        skillCorrect[question.skill] += 1;
      }
    });

    const skillSummaries = SKILLS.map((skill, index) => ({
      skill,
      correct: skillCorrect[index],
      total: 2,
      status: skillCorrect[index] === 2 ? "متقن" : "يحتاج تدريبًا",
    }));
    const score = skillCorrect.reduce((total, value) => total + value, 0);
    const masteredSkills = skillSummaries.filter((item) => item.status === "متقن").length;
    const coreMastered = skillSummaries.slice(0, 6).every((item) => item.status === "متقن");
    const level = getResultTitle(masteredSkills, coreMastered);
    const { adminDb } = getFirebaseAdmin();
    const studentReference = adminDb.collection("students").doc(studentDocId);
    const assessment = {
      submissionId,
      score,
      total: QUESTIONS.length,
      level,
      skillSummaries,
      completedAt: FieldValue.serverTimestamp(),
    };

    let duplicate = false;
    await adminDb.runTransaction(async (transaction) => {
      const studentSnapshot = await transaction.get(studentReference);
      if (!studentSnapshot.exists) {
        throw new Error("STUDENT_NOT_FOUND");
      }

      const existingAssessment = studentSnapshot.data()?.readingLevelAssessment;
      if (existingAssessment?.submissionId === submissionId) {
        duplicate = true;
        return;
      }

      transaction.set(
        studentReference,
        { readingLevelAssessment: assessment },
        { merge: true }
      );
    });

    return NextResponse.json({
      success: true,
      duplicate,
      score,
      total: QUESTIONS.length,
      level,
      skillSummaries,
    });
  } catch (error) {
    console.error("Reading level assessment submit error:", error);
    const message = error instanceof Error ? error.message : "";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "يجب تسجيل الدخول أولًا." }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "هذا المسار مخصص للطلاب فقط." }, { status: 403 });
    }
    if (message === "STUDENT_NOT_FOUND") {
      return NextResponse.json({ success: false, message: "تعذر تحديد حساب الطالب." }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: "تعذر حفظ نتيجة الاختبار." }, { status: 500 });
  }
}
