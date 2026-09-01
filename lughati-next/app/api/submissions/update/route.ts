import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "../../../../firebase-admin";

const allowedStatuses = [
  "بانتظار المراجعة",
  "معتمد",
  "مرفوض",
] as const;

type AllowedStatus =
  (typeof allowedStatuses)[number];

type UpdateRequest = {
  id?: string;
  status?: AllowedStatus;
  note?: string;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as UpdateRequest;

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    const status = body.status;

    const note =
      typeof body.note === "string"
        ? body.note.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "معرّف العمل غير موجود",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !status ||
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "حالة العمل غير صحيحة",
        },
        {
          status: 400,
        }
      );
    }

    const { adminDb } =
      getFirebaseAdmin();

    const submissionRef =
      adminDb
        .collection("studentWorks")
        .doc(id);

    await submissionRef.update({
      status,
      note,
      updatedAt:
        FieldValue.serverTimestamp(),
      reviewedAt:
        FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message:
        "تم تحديث حالة العمل بنجاح",
      status,
      id,
    });
  } catch (error) {
    console.error(
      "UPDATE SUBMISSION ERROR:",
      error
    );

    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error
        ? String(
            (
              error as {
                code?: unknown;
              }
            ).code
          )
        : "";

    if (
      errorCode === "5" ||
      errorCode === "not-found"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم العثور على العمل",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء تحديث العمل",
      },
      {
        status: 500,
      }
    );
  }
}