import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

const COLLECTION = "national-day-celebration-submissions";

type MediaType = "image" | "video";
type ReviewStatus =
  | "pending"
  | "approved"
  | "revision_requested";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isMediaType(value: unknown): value is MediaType {
  return value === "image" || value === "video";
}

function isReviewStatus(
  value: unknown
): value is ReviewStatus {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "revision_requested"
  );
}

function serializeDoc(
  id: string,
  data: Record<string, any>
) {
  const toIso = (value: any) => {
    if (!value) return null;

    if (typeof value.toDate === "function") {
      return value.toDate().toISOString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return value;
  };

  return {
    id,
    ...data,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    reviewedAt: toIso(data.reviewedAt),
    publishingConsentAt: toIso(
      data.publishingConsentAt
    ),
  };
}

/*
 * GET
 *
 * بدون studentId:
 * يعيد جميع المشاركات للمعلم.
 *
 * مع studentId:
 * يعيد مشاركة الطالب الحالية.
 */
export async function GET(request: Request) {
  try {
    const { adminDb: db } = getFirebaseAdmin();

    const url = new URL(request.url);
    const studentId = cleanText(
      url.searchParams.get("studentId")
    );

    if (studentId) {
      const docId = encodeURIComponent(studentId);

      const snapshot = await db
        .collection(COLLECTION)
        .doc(docId)
        .get();

      if (!snapshot.exists) {
        return NextResponse.json({
          success: true,
          submission: null,
        });
      }

      return NextResponse.json({
        success: true,
        submission: serializeDoc(
          snapshot.id,
          snapshot.data() || {}
        ),
      });
    }

    const snapshot = await db
      .collection(COLLECTION)
      .get();

    const submissions = snapshot.docs
      .map((doc) =>
        serializeDoc(
          doc.id,
          doc.data() as Record<string, any>
        )
      )
      .sort((a, b) => {
        const first = String(
          b.createdAt || b.updatedAt || ""
        );

        const second = String(
          a.createdAt || a.updatedAt || ""
        );

        return first.localeCompare(second);
      });

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error(
      "WE CELEBRATE GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر تحميل مشاركات نحن نحتفل.",
      },
      { status: 500 }
    );
  }
}

/*
 * POST
 *
 * إنشاء مشاركة جديدة أو إعادة إرسالها
 * إذا طلب المعلم التعديل.
 */
export async function POST(request: Request) {
  try {
   const { adminDb: db } = getFirebaseAdmin();

    const body = await request.json();

    const studentId = cleanText(body.studentId);
    const studentName = cleanText(
      body.studentName
    );
    const studentClassroom = cleanText(
      body.studentClassroom
    );

    const title = cleanText(body.title);

    const mediaUrl = cleanText(body.mediaUrl);
    const mediaPublicId = cleanText(
      body.mediaPublicId
    );

    const mediaType = body.mediaType;

    const parentPublishingConsent =
      body.parentPublishingConsent === true;

    if (!studentId || !studentName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تعذر التعرف على بيانات الطالب.",
        },
        { status: 400 }
      );
    }

    if (studentId === "student-demo") {
      return NextResponse.json(
        {
          success: false,
          message:
            "الحساب التجريبي لا يمكنه إرسال مشاركة فعلية.",
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            "اكتب عنوانًا لمشاركتك أولًا.",
        },
        { status: 400 }
      );
    }

    if (!isMediaType(mediaType)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "نوع المشاركة غير صحيح.",
        },
        { status: 400 }
      );
    }

    if (!mediaUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم العثور على ملف المشاركة.",
        },
        { status: 400 }
      );
    }

    const docId = encodeURIComponent(studentId);

    const ref = db
      .collection(COLLECTION)
      .doc(docId);

    const existing = await ref.get();

    /*
     * الطالب يستطيع إعادة الإرسال فقط
     * عندما يطلب المعلم التعديل.
     */
    if (existing.exists) {
      const oldData = existing.data() || {};
      const oldStatus = oldData.status;

      if (oldStatus === "approved") {
        return NextResponse.json(
          {
            success: false,
            code: "ALREADY_APPROVED",
            status: "approved",
            message:
              "🎖️ تم اعتماد مشاركتك مسبقًا.",
          },
          { status: 409 }
        );
      }

      if (oldStatus === "pending") {
        return NextResponse.json(
          {
            success: false,
            code: "ALREADY_SUBMITTED",
            status: "pending",
            message:
              "⏳ مشاركتك موجودة بالفعل وبانتظار مراجعة المعلم.",
          },
          { status: 409 }
        );
      }

      if (
        oldStatus !== "revision_requested"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "تعذر تحديث المشاركة الحالية.",
          },
          { status: 409 }
        );
      }
    }

    const now = FieldValue.serverTimestamp();

    const submissionData = {
      studentId,
      studentName,
      studentClassroom,
      title,

      mediaType,
      mediaUrl,
      mediaPublicId,

      parentPublishingConsent,

      /*
       * وقت تسجيل قرار ولي الأمر.
       * وجود false لا يمنع المشاركة نفسها.
       */
      publishingConsentAt: now,

      activity: "we-celebrate",
      source: "national-day-celebration",

      status: "pending",

      teacherNote: "",

      /*
       * الترشيح للنشر منفصل عن اعتماد المشاركة.
       * ولا يمكن استخدامه لاحقًا إلا مع وجود الموافقة.
       */
      featuredForGallery: false,
      featuredForTikTok: false,

      updatedAt: now,

      ...(existing.exists
        ? {
            reviewedAt: null,
          }
        : {
            createdAt: now,
            reviewedAt: null,
          }),
    };

    await ref.set(
      submissionData,
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      status: "pending",
      message:
        "🇸🇦 وصلت مشاركتك بنجاح، وهي الآن بانتظار مراجعة المعلم.",
    });
  } catch (error) {
    console.error(
      "WE CELEBRATE POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر حفظ المشاركة. حاول مرة أخرى.",
      },
      { status: 500 }
    );
  }
}

/*
 * PATCH
 *
 * يستخدمه المعلم لـ:
 * - اعتماد المشاركة.
 * - طلب إعادة.
 * - ترشيحها للمعرض.
 * - ترشيحها لـ TikTok.
 */
export async function PATCH(request: Request) {
  try {
   const { adminDb: db } = getFirebaseAdmin();

    const body = await request.json();

    const id = cleanText(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "معرّف المشاركة غير موجود.",
        },
        { status: 400 }
      );
    }

    const ref = db
      .collection(COLLECTION)
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

    const current =
      snapshot.data() || {};

    const updateData: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    /*
     * مراجعة المعلم
     */
    if (body.status !== undefined) {
      if (!isReviewStatus(body.status)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "حالة المراجعة غير صحيحة.",
          },
          { status: 400 }
        );
      }

      const teacherNote = cleanText(
        body.teacherNote
      );

      if (
        body.status ===
          "revision_requested" &&
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

      updateData.status = body.status;
      updateData.teacherNote =
        body.status ===
        "revision_requested"
          ? teacherNote
          : teacherNote || "";

      updateData.reviewedAt =
        FieldValue.serverTimestamp();
    }

    /*
     * الترشيح للمعرض
     */
    if (
      typeof body.featuredForGallery ===
      "boolean"
    ) {
      if (
        body.featuredForGallery &&
        current.parentPublishingConsent !==
          true
      ) {
        return NextResponse.json(
          {
            success: false,
            code: "NO_PARENT_CONSENT",
            message:
              "لا يمكن ترشيح المشاركة للمعرض لعدم وجود موافقة ولي الأمر على النشر.",
          },
          { status: 403 }
        );
      }

      updateData.featuredForGallery =
        body.featuredForGallery;
    }

    /*
     * الترشيح لـ TikTok
     */
    if (
      typeof body.featuredForTikTok ===
      "boolean"
    ) {
      if (
        body.featuredForTikTok &&
        current.parentPublishingConsent !==
          true
      ) {
        return NextResponse.json(
          {
            success: false,
            code: "NO_PARENT_CONSENT",
            message:
              "لا يمكن ترشيح المشاركة لـ TikTok لعدم وجود موافقة ولي الأمر على النشر.",
          },
          { status: 403 }
        );
      }

      updateData.featuredForTikTok =
        body.featuredForTikTok;
    }

    await ref.update(updateData);

    return NextResponse.json({
      success: true,
      message:
        "تم تحديث المشاركة بنجاح.",
    });
  } catch (error) {
    console.error(
      "WE CELEBRATE PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر تحديث المشاركة.",
      },
      { status: 500 }
    );
  }
}

/*
 * DELETE
 *
 * حذف سجل المشاركة من Firestore.
 * حذف الملف نفسه من Cloudinary سنفصله لاحقًا
 * إذا أردنا حذف الأصل من التخزين أيضًا.
 */
export async function DELETE(
  request: Request
) {
  try {
   const { adminDb: db } = getFirebaseAdmin();

    const body = await request.json();

    const id = cleanText(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "معرّف المشاركة غير موجود.",
        },
        { status: 400 }
      );
    }

    await db
      .collection(COLLECTION)
      .doc(id)
      .delete();

    return NextResponse.json({
      success: true,
      message: "تم حذف المشاركة.",
    });
  } catch (error) {
    console.error(
      "WE CELEBRATE DELETE ERROR:",
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