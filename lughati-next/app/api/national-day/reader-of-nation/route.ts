import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

type ReaderOfNationRequest = {
  studentId?: string;
  studentName?: string;
  studentClassroom?: string;
  audioUrl?: string;
  audioPublicId?: string;
  durationSeconds?: number;
};

type ReviewRequest = {
  id?: string;
  status?: "approved" | "revision_requested";
  teacherNote?: string;
};

function getSubmissionId(studentId: string) {
  return encodeURIComponent(studentId);
}

/* =========================================================
   GET
   جلب جميع مشاركات قارئ الوطن للمعلم
========================================================= */

export async function GET() {
  try {
    const { adminDb } = getFirebaseAdmin();

    const snapshot = await adminDb
      .collection("national-day-reader-submissions")
      .get();

    const submissions = snapshot.docs.map((document) => {
      const data = document.data();

      return {
        id: document.id,

        studentId:
          typeof data.studentId === "string"
            ? data.studentId
            : "",

        studentName:
          typeof data.studentName === "string"
            ? data.studentName
            : "طالب",

        studentClassroom:
          typeof data.studentClassroom === "string"
            ? data.studentClassroom
            : "",

        audioUrl:
          typeof data.audioUrl === "string"
            ? data.audioUrl
            : "",

        audioPublicId:
          typeof data.audioPublicId === "string"
            ? data.audioPublicId
            : "",

        durationSeconds:
          typeof data.durationSeconds === "number"
            ? data.durationSeconds
            : 0,

        status:
          data.status === "approved" ||
          data.status === "revision_requested"
            ? data.status
            : "pending",

        teacherNote:
          typeof data.teacherNote === "string"
            ? data.teacherNote
            : "",

        activity:
          typeof data.activity === "string"
            ? data.activity
            : "reader-of-nation",

        createdAt:
          data.createdAt &&
          typeof data.createdAt.toMillis === "function"
            ? data.createdAt.toMillis()
            : 0,

        updatedAt:
          data.updatedAt &&
          typeof data.updatedAt.toMillis === "function"
            ? data.updatedAt.toMillis()
            : 0,

        reviewedAt:
          data.reviewedAt &&
          typeof data.reviewedAt.toMillis === "function"
            ? data.reviewedAt.toMillis()
            : 0,
      };
    });

    submissions.sort(
      (a, b) => b.createdAt - a.createdAt
    );

    return NextResponse.json(
      {
        success: true,
        submissions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "READER OF NATION GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        submissions: [],
        message:
          "تعذر تحميل مشاركات قارئ الوطن.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   استقبال مشاركة الطالب
========================================================= */

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as ReaderOfNationRequest;

    const studentId =
      typeof body.studentId === "string"
        ? body.studentId.trim()
        : "";

    const studentName =
      typeof body.studentName === "string"
        ? body.studentName.trim()
        : "";

    const studentClassroom =
      typeof body.studentClassroom === "string"
        ? body.studentClassroom.trim()
        : "";

    const audioUrl =
      typeof body.audioUrl === "string"
        ? body.audioUrl.trim()
        : "";

    const audioPublicId =
      typeof body.audioPublicId === "string"
        ? body.audioPublicId.trim()
        : "";

    const durationSeconds =
      typeof body.durationSeconds === "number" &&
      Number.isFinite(body.durationSeconds)
        ? Math.max(
            0,
            Math.min(
              180,
              Math.round(body.durationSeconds)
            )
          )
        : 0;

    if (
      !studentId ||
      studentId === "student-demo" ||
      !studentName ||
      !audioUrl
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_DATA",
          message:
            "بيانات المشاركة غير مكتملة.",
        },
        { status: 400 }
      );
    }

    const { adminDb } = getFirebaseAdmin();

    const submissionRef = adminDb
      .collection(
        "national-day-reader-submissions"
      )
      .doc(
        getSubmissionId(studentId)
      );

    let alreadyExists = false;

    await adminDb.runTransaction(
      async (transaction) => {
        const existing =
          await transaction.get(
            submissionRef
          );

        if (existing.exists) {
          alreadyExists = true;
          return;
        }

        transaction.create(
          submissionRef,
          {
            studentId,
            studentName,
            studentClassroom,
            audioUrl,
            audioPublicId,
            durationSeconds,

            activity:
              "reader-of-nation",

            source:
              "national-day-reader",

            status: "pending",

            teacherNote: "",

            createdAt:
              FieldValue.serverTimestamp(),

            updatedAt:
              FieldValue.serverTimestamp(),
          }
        );
      }
    );

    if (alreadyExists) {
      return NextResponse.json(
        {
          success: false,
          code:
            "ALREADY_SUBMITTED",

          message:
            "📖 سبق أن شاركت في قارئ الوطن. وصلت مشاركتك للمعلم بالفعل 🌟",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,

        id: submissionRef.id,

        message:
          "🎉 وصلت قراءتك بنجاح. أحسنت يا قارئ الوطن، ومشاركتك الآن بانتظار مراجعة المعلم ⭐",
      },
      { status: 200 }
    );
  } catch (error) {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error
        ? String(
            (
              error as {
                code?: unknown;
              }
            ).code ?? ""
          )
        : "";

    if (
      errorCode === "6" ||
      errorCode ===
        "already-exists"
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "ALREADY_SUBMITTED",

          message:
            "📖 سبق أن شاركت في قارئ الوطن. وصلت مشاركتك للمعلم بالفعل 🌟",
        },
        { status: 409 }
      );
    }

    console.error(
      "READER OF NATION SUBMISSION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "تعذر إرسال مشاركة قارئ الوطن.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH
   اعتماد القراءة أو إعادتها للطالب
========================================================= */

export async function PATCH(
  request: Request
) {
  try {
    const body =
      (await request.json()) as ReviewRequest;

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    const status =
      body.status === "approved" ||
      body.status ===
        "revision_requested"
        ? body.status
        : null;

    const teacherNote =
      typeof body.teacherNote === "string"
        ? body.teacherNote.trim()
        : "";

    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          message:
            "بيانات المراجعة غير مكتملة.",
        },
        { status: 400 }
      );
    }

    if (
      status ===
        "revision_requested" &&
      !teacherNote
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "اكتب ملاحظة للطالب قبل طلب إعادة القراءة.",
        },
        { status: 400 }
      );
    }

    const { adminDb } =
      getFirebaseAdmin();

    const submissionRef = adminDb
      .collection(
        "national-day-reader-submissions"
      )
      .doc(id);

    const snapshot =
      await submissionRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم العثور على المشاركة.",
        },
        { status: 404 }
      );
    }

    await submissionRef.update({
      status,

      teacherNote,

      reviewedAt:
        FieldValue.serverTimestamp(),

      updatedAt:
        FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,

        message:
          status === "approved"
            ? "⭐ تم اعتماد قراءة الطالب بنجاح."
            : "↩️ تم تحويل القراءة إلى حالة تحتاج إعادة المحاولة.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "READER OF NATION REVIEW ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر تحديث حالة المشاركة.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE
   حذف مشاركة قارئ الوطن
========================================================= */

export async function DELETE(
  request: Request
) {
  try {
    const body =
      (await request.json()) as {
        id?: string;
      };

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "رقم المشاركة غير موجود.",
        },
        { status: 400 }
      );
    }

    const { adminDb } =
      getFirebaseAdmin();

    const submissionRef = adminDb
      .collection(
        "national-day-reader-submissions"
      )
      .doc(id);

    const snapshot =
      await submissionRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          message:
            "المشاركة غير موجودة.",
        },
        { status: 404 }
      );
    }

    await submissionRef.delete();

    return NextResponse.json(
      {
        success: true,
        message:
          "تم حذف المشاركة بنجاح.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "READER OF NATION DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر حذف المشاركة.",
      },
      { status: 500 }
    );
  }
}