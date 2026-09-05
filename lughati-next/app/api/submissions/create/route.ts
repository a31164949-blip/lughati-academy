import { NextResponse } from "next/server";
import {
  FieldValue,
} from "firebase-admin/firestore";

import { getFirebaseAdmin } from "../../../../firebase-admin";

type CreateSubmissionRequest = {
  studentName?: string;
  studentId?: string;
  title?: string;
  type?: string;
  fileUrl?: string;
  consent?: string;
  classroom?: string;
  note?: string;

  /*
    إذا كان العمل قادمًا من اعتماد المعلم
    فلا يخضع لساعات استقبال الطلاب.
  */
  source?: string;

  /*
    رقم إنجاز الواجب الأصلي.
    نستخدمه لمنع تكرار نشر نفس العمل.
  */
  sourceCompletionId?: string;

  /*
    نشر مباشر بعد اعتماد المعلم.
  */
  autoApprove?: boolean;
};

const PENDING_STATUS =
  "بانتظار المراجعة";

const APPROVED_STATUS =
  "approved";

const SUBMISSIONS_OPEN_HOUR = 13;
const SUBMISSIONS_CLOSE_HOUR = 22;

function getRiyadhTimeParts() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "Asia/Riyadh",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }
    );

  const parts =
    formatter.formatToParts(
      new Date()
    );

  const hour =
    Number(
      parts.find(
        (part) =>
          part.type === "hour"
      )?.value ?? "0"
    );

  const minute =
    Number(
      parts.find(
        (part) =>
          part.type === "minute"
      )?.value ?? "0"
    );

  return {
    hour,
    minute,
  };
}

function isSubmissionWindowOpen() {
  const { hour } =
    getRiyadhTimeParts();

  return (
    hour >= SUBMISSIONS_OPEN_HOUR &&
    hour < SUBMISSIONS_CLOSE_HOUR
  );
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as CreateSubmissionRequest;

    const studentName =
      typeof body.studentName ===
      "string"
        ? body.studentName.trim()
        : "";

    const studentId =
      typeof body.studentId ===
      "string"
        ? body.studentId.trim()
        : "";

    const title =
      typeof body.title ===
        "string" &&
      body.title.trim()
        ? body.title.trim()
        : "إبداع طالب";

    const type =
      typeof body.type ===
        "string" &&
      body.type.trim()
        ? body.type.trim()
        : "واجب إبداعي";

    const fileUrl =
      typeof body.fileUrl ===
      "string"
        ? body.fileUrl.trim()
        : "";

    const consent =
      typeof body.consent ===
        "string" &&
      body.consent.trim()
        ? body.consent.trim()
        : "نعم";

    const classroom =
      typeof body.classroom ===
      "string"
        ? body.classroom.trim()
        : "";

    const note =
      typeof body.note ===
      "string"
        ? body.note.trim()
        : "";

    const source =
      typeof body.source ===
      "string"
        ? body.source.trim()
        : "";

    const sourceCompletionId =
      typeof body.sourceCompletionId ===
      "string"
        ? body.sourceCompletionId.trim()
        : "";

    const autoApprove =
      body.autoApprove === true;

    /*
      هل الطلب صادر عن اعتماد المعلم؟
    */
    const isTeacherApprovedSubmission =
      source ===
        "teacher-approved-creative-homework" &&
      autoApprove;

    /*
      ساعات الاستقبال تطبق فقط
      على إرسال الطالب.

      أما اعتماد المعلم فيعمل
      في أي وقت.
    */
    if (
      !isTeacherApprovedSubmission &&
      !isSubmissionWindowOpen()
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "SUBMISSIONS_CLOSED",
          message:
            "🌙 استقبال الأعمال متاح يوميًا من الساعة 1:00 ظهرًا حتى 10:00 مساءً بتوقيت الرياض. ننتظرك في الوقت المحدد يا بطل ⭐",
          opensAt:
            "13:00",
          closesAt:
            "22:00",
          timeZone:
            "Asia/Riyadh",
        },
        {
          status: 403,
        }
      );
    }

    if (
      !studentId ||
      !fileUrl
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "بيانات العمل غير مكتملة",
        },
        {
          status: 400,
        }
      );
    }

    const { adminDb } =
      getFirebaseAdmin();

    /*
      منع تكرار نشر نفس الواجب
      في المعرض.

      إذا كان sourceCompletionId
      موجودًا نبحث عنه أولًا.
    */
    if (sourceCompletionId) {
      const existingSnapshot =
        await adminDb
          .collection(
            "studentWorks"
          )
          .where(
            "sourceCompletionId",
            "==",
            sourceCompletionId
          )
          .limit(1)
          .get();

      if (
        !existingSnapshot.empty
      ) {
        const existingDocument =
          existingSnapshot.docs[0];

        return NextResponse.json(
          {
            success: true,
            alreadyExists: true,
            id:
              existingDocument.id,
            message:
              "العمل منشور مسبقًا في المعرض",
          },
          {
            status: 200,
          }
        );
      }
    }

    const submissionData: Record<
      string,
      unknown
    > = {
      studentName,
      studentId,
      title,
      type,
      fileUrl,
      consent,
      classroom,

      status:
        isTeacherApprovedSubmission
          ? APPROVED_STATUS
          : PENDING_STATUS,

      note,

      source:
        source ||
        "student-submission",

      autoApproved:
        isTeacherApprovedSubmission,

      createdAt:
        FieldValue.serverTimestamp(),

      updatedAt:
        FieldValue.serverTimestamp(),
    };

    if (sourceCompletionId) {
      submissionData.sourceCompletionId =
        sourceCompletionId;
    }

    /*
      العمل المعتمد من المعلم
      يعتبر معتمدًا من لحظة إنشائه.
    */
    if (
      isTeacherApprovedSubmission
    ) {
      submissionData.approvedAt =
        FieldValue.serverTimestamp();

      submissionData.teacherApproved =
        true;

         submissionData.publishedToGallery =
    true

      submissionData.published =
        true;

      submissionData.publishedAt =
        FieldValue.serverTimestamp();
    }

    const submissionRef =
      await adminDb
        .collection(
          "studentWorks"
        )
        .add(
          submissionData
        );

    return NextResponse.json(
      {
        success: true,
        id:
          submissionRef.id,
        message:
          isTeacherApprovedSubmission
            ? "تم نشر الواجب الإبداعي في المعرض ✅"
            : "تم إرسال العمل للمعلم للمراجعة",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "CREATE SUBMISSION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء إرسال العمل",
      },
      {
        status: 500,
      }
    );
  }
}