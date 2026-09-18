import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

type ArtRequest = {
  studentId?: string;
  studentName?: string;
  studentClassroom?: string;
  title?: string;
  imageUrl?: string;
  imagePublicId?: string;
};

type ReviewRequest = {
  id?: string;
  status?: "approved" | "revision_requested";
  teacherNote?: string;
};

function getSubmissionId(studentId: string) {
  return encodeURIComponent(studentId);
}

function serializeSubmission(
  id: string,
  data: FirebaseFirestore.DocumentData
) {
  return {
    id,

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

    title:
      typeof data.title === "string"
        ? data.title
        : "",

    imageUrl:
      typeof data.imageUrl === "string"
        ? data.imageUrl
        : "",

    imagePublicId:
      typeof data.imagePublicId === "string"
        ? data.imagePublicId
        : "",

    status:
      data.status === "approved" ||
      data.status === "revision_requested"
        ? data.status
        : "pending",

    teacherNote:
      typeof data.teacherNote === "string"
        ? data.teacherNote
        : "",

    activity: "my-country-with-my-brush",

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
}

/* =========================================================
   GET
   بدون studentId = جميع المشاركات للمعلم
   مع studentId = حالة مشاركة طالب واحد
========================================================= */

export async function GET(request: Request) {
  try {
    const { adminDb } = getFirebaseAdmin();

    const { searchParams } =
      new URL(request.url);

    const studentId =
      searchParams.get("studentId")?.trim() || "";

    if (studentId) {
      if (studentId === "student-demo") {
        return NextResponse.json(
          {
            success: false,
            submission: null,
            message: "بيانات الطالب غير صالحة.",
          },
          { status: 400 }
        );
      }

      const ref = adminDb
        .collection("national-day-art-submissions")
        .doc(getSubmissionId(studentId));

      const snapshot = await ref.get();

      if (!snapshot.exists) {
        return NextResponse.json({
          success: true,
          submission: null,
        });
      }

      return NextResponse.json({
        success: true,
        submission: serializeSubmission(
          snapshot.id,
          snapshot.data() || {}
        ),
      });
    }

    const snapshot = await adminDb
      .collection("national-day-art-submissions")
      .get();

    const submissions = snapshot.docs.map(
      (document) =>
        serializeSubmission(
          document.id,
          document.data()
        )
    );

    submissions.sort(
      (a, b) => b.createdAt - a.createdAt
    );

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error(
      "NATIONAL DAY ART GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        submissions: [],
        submission: null,
        message:
          "تعذر تحميل مشاركات وطني بريشتي.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   إرسال العمل أو إعادة إرساله
========================================================= */

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as ArtRequest;

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

    const title =
      typeof body.title === "string"
        ? body.title.trim().slice(0, 50)
        : "";

    const imageUrl =
      typeof body.imageUrl === "string"
        ? body.imageUrl.trim()
        : "";

    const imagePublicId =
      typeof body.imagePublicId === "string"
        ? body.imagePublicId.trim()
        : "";

    if (
      !studentId ||
      studentId === "student-demo" ||
      !studentName ||
      !title ||
      !imageUrl
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

    const ref = adminDb
      .collection("national-day-art-submissions")
      .doc(getSubmissionId(studentId));

    let result = "" as
      | "created"
      | "resubmitted"
      | "pending"
      | "approved";

    await adminDb.runTransaction(
      async (transaction) => {
        const existing =
          await transaction.get(ref);

        if (!existing.exists) {
          transaction.create(ref, {
            studentId,
            studentName,
            studentClassroom,
            title,
            imageUrl,
            imagePublicId,

            activity:
              "my-country-with-my-brush",

            source:
              "national-day-art",

            status: "pending",
            teacherNote: "",

            createdAt:
              FieldValue.serverTimestamp(),

            updatedAt:
              FieldValue.serverTimestamp(),
          });

          result = "created";
          return;
        }

        const data = existing.data() || {};

        const currentStatus =
          data.status === "approved"
            ? "approved"
            : data.status ===
                "revision_requested"
              ? "revision_requested"
              : "pending";

        if (currentStatus === "approved") {
          result = "approved";
          return;
        }

        if (currentStatus === "pending") {
          result = "pending";
          return;
        }

        transaction.update(ref, {
          studentName,
          studentClassroom,
          title,
          imageUrl,
          imagePublicId,

          status: "pending",
          teacherNote: "",

          reviewedAt:
            FieldValue.delete(),

          updatedAt:
            FieldValue.serverTimestamp(),

          resubmittedAt:
            FieldValue.serverTimestamp(),
        });

        result = "resubmitted";
      }
    );

    if (result === "approved") {
      return NextResponse.json(
        {
          success: false,
          code: "ALREADY_APPROVED",
          status: "approved",
          message:
            "🎨 تم اعتماد عملك في وطني بريشتي. مبارك يا فنان الوطن 🌟",
        },
        { status: 409 }
      );
    }

    if (result === "pending") {
      return NextResponse.json(
        {
          success: false,
          code: "ALREADY_SUBMITTED",
          status: "pending",
          message:
            "🎨 عملك وصل إلى المعلم وهو الآن بانتظار المراجعة.",
        },
        { status: 409 }
      );
    }

    if (result === "resubmitted") {
      return NextResponse.json({
        success: true,
        code: "RESUBMITTED",
        status: "pending",
        id: ref.id,
        message:
          "🎉 وصل إبداعك الجديد بنجاح، وهو الآن بانتظار مراجعة المعلم.",
      });
    }

    return NextResponse.json({
      success: true,
      code: "SUBMITTED",
      status: "pending",
      id: ref.id,
      message:
        "🎉 وصل إبداعك بنجاح. أحسنت يا فنان الوطن، ومشاركتك الآن بانتظار مراجعة المعلم 🎨",
    });
  } catch (error) {
    console.error(
      "NATIONAL DAY ART POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "تعذر إرسال العمل الفني.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH
   اعتماد العمل أو طلب إعادة
========================================================= */

export async function PATCH(request: Request) {
  try {
    const body =
      (await request.json()) as ReviewRequest;

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    const status =
      body.status === "approved" ||
      body.status === "revision_requested"
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
      status === "revision_requested" &&
      !teacherNote
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "اكتب ملاحظة للطالب قبل طلب إعادة المشاركة.",
        },
        { status: 400 }
      );
    }

    const { adminDb } = getFirebaseAdmin();

    const ref = adminDb
      .collection("national-day-art-submissions")
      .doc(id);

    const snapshot = await ref.get();

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

    await ref.update({
      status,
      teacherNote,

      reviewedAt:
        FieldValue.serverTimestamp(),

      updatedAt:
        FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message:
        status === "approved"
          ? "🎨 تم اعتماد العمل الفني بنجاح."
          : "🔄 تم إرسال ملاحظة إعادة المشاركة للطالب.",
    });
  } catch (error) {
    console.error(
      "NATIONAL DAY ART PATCH ERROR:",
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
========================================================= */

export async function DELETE(request: Request) {
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

    const { adminDb } = getFirebaseAdmin();

    const ref = adminDb
      .collection("national-day-art-submissions")
      .doc(id);

    const snapshot = await ref.get();

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

    await ref.delete();

    return NextResponse.json({
      success: true,
      message:
        "تم حذف المشاركة بنجاح.",
    });
  } catch (error) {
    console.error(
      "NATIONAL DAY ART DELETE ERROR:",
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