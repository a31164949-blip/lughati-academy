import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "../../../../firebase-admin";
import { getStudentSubmissionWindow } from "../../../lib/studentSubmissionWindow";

type HomeworkSubmissionRequest = {
  mode?: "completion" | "reading-only";
  homeworkId?: string;
  homeworkTitle?: string;
  homeworkType?: "standard" | "creative" | "madrasati";
  studentId?: string;
  studentName?: string;
  classroom?: string;
  completionMethod?: string;
  solutionUrl?: string;
  readingAudioUrl?: string;
  readingDurationSeconds?: number;
};

export async function POST(request: Request) {
  try {
    const submissionWindow = getStudentSubmissionWindow();

    if (!submissionWindow.isOpen) {
      return NextResponse.json(
        {
          success: false,
          code: "STUDENT_SUBMISSION_CLOSED",
          message: submissionWindow.message,
          opensAt: submissionWindow.opensAt,
          closesAt: submissionWindow.closesAt,
          timeZone: submissionWindow.timeZone,
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as HomeworkSubmissionRequest;

    const mode = body.mode === "reading-only" ? "reading-only" : "completion";
    const homeworkId = typeof body.homeworkId === "string" ? body.homeworkId.trim() : "";
    const homeworkTitle =
      typeof body.homeworkTitle === "string" && body.homeworkTitle.trim()
        ? body.homeworkTitle.trim()
        : "واجب لغتي";
    const homeworkType =
      body.homeworkType === "creative" || body.homeworkType === "madrasati"
        ? body.homeworkType
        : "standard";
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const studentName =
      typeof body.studentName === "string" && body.studentName.trim()
        ? body.studentName.trim()
        : "طالب";
    const classroom =
      typeof body.classroom === "string" && body.classroom.trim()
        ? body.classroom.trim()
        : "غير محدد";
    const completionMethod =
      typeof body.completionMethod === "string" ? body.completionMethod.trim() : "";
    const solutionUrl = typeof body.solutionUrl === "string" ? body.solutionUrl.trim() : "";
    const readingAudioUrl =
      typeof body.readingAudioUrl === "string" ? body.readingAudioUrl.trim() : "";
    const readingDurationSeconds =
      typeof body.readingDurationSeconds === "number" &&
      Number.isFinite(body.readingDurationSeconds)
        ? Math.max(0, Math.min(60, Math.round(body.readingDurationSeconds)))
        : 0;

    if (!homeworkId || !studentId) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات الطالب أو الواجب غير مكتملة.",
        },
        { status: 400 }
      );
    }

    if (mode === "reading-only" && !readingAudioUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "أرسل التسجيل الصوتي أولًا.",
        },
        { status: 400 }
      );
    }

    if (mode === "completion" && homeworkType === "madrasati" && !solutionUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "📸 ارفع صورة إثبات الحل من منصة مدرستي أولًا.",
        },
        { status: 400 }
      );
    }

    const { adminDb } = getFirebaseAdmin();
    const completionId = `${studentId}_${homeworkId}`;
    const completionRef = adminDb.collection("homeworkCompletions").doc(completionId);

    if (mode === "reading-only") {
      await completionRef.set(
        {
          homeworkId,
          homeworkTitle,
          studentId,
          studentName,
          classroom,
          readingAudioUrl,
          readingDurationSeconds,
          readingReviewed: false,
          readingStatus: "pending",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return NextResponse.json({
        success: true,
        id: completionId,
        message: "تم إرسال قراءتك للمعلم وهي بانتظار المراجعة ✅",
      });
    }

    const completionData: Record<string, unknown> = {
      homeworkId,
      homeworkTitle,
      studentId,
      studentName,
      classroom,
      completionMethod,
      solutionUrl,
      solutionReviewedAt: null,
      solutionRejectedAt: null,
      teacherReviewed: false,
      needsRevision: false,
      teacherNote: "",
      returnedAt: null,
      readingAudioUrl,
      readingDurationSeconds: readingAudioUrl ? readingDurationSeconds : 0,
      readingReviewed: false,
      status: "completed",
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (solutionUrl) {
      completionData.solutionStatus = "pending";
    }

    if (readingAudioUrl) {
      completionData.readingStatus = "pending";
    }

    await completionRef.set(completionData, { merge: true });

    return NextResponse.json({
      success: true,
      id: completionId,
      message: `أحسنت يا ${studentName} 🌟 سجّل فارس إنجازك بنجاح.`,
    });
  } catch (error) {
    console.error("HOMEWORK SUBMISSION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "تعذر إرسال الواجب حاليًا. حاول مرة أخرى.",
      },
      { status: 500 }
    );
  }
}
