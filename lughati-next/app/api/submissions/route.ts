import { NextResponse } from "next/server";

import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubmissionItem = {
  id: string;
  row: number;
  timestamp: string;
  studentName: string;
  studentId: string;
  classroom: string;
  title: string;
  type: string;
  fileUrl: string;
  consent: string;
  status: string;
  note: string;
};

type SubmissionsPayload = {
  success: true;
  submissions: SubmissionItem[];
};

const CACHE_TTL_MS = 60 * 1000;

let cachedPayload: SubmissionsPayload | null = null;
let cachedAt = 0;

export async function GET() {
  const now = Date.now();

  // استخدام النسخة المؤقتة إذا كانت حديثة
  if (
    cachedPayload &&
    now - cachedAt < CACHE_TTL_MS
  ) {
    return NextResponse.json(
      {
        ...cachedPayload,
        source: "cache",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Submissions-Cache": "HIT",
        },
      }
    );
  }

  try {
    const { adminDb } = getFirebaseAdmin();

    const snapshot = await adminDb
      .collection("studentWorks")
      .orderBy("createdAt", "desc")
      .get();

    const submissions: SubmissionItem[] =
      snapshot.docs.map((doc, index) => {
        const data = doc.data();

        let timestamp = "";

        if (
          data.createdAt &&
          typeof data.createdAt.toDate ===
            "function"
        ) {
          timestamp = data.createdAt
            .toDate()
            .toLocaleString("ar-SA");
        }

        return {
          id: doc.id,

          // نبقيه كما هو حاليًا حتى لا تتأثر لوحة المعلم
          row: index + 2,

          timestamp,

          studentName:
            typeof data.studentName === "string"
              ? data.studentName
              : "",

          studentId:
            typeof data.studentId === "string"
              ? data.studentId
              : "",

          classroom:
            typeof data.classroom === "string"
              ? data.classroom
              : "",

          title:
            typeof data.title === "string"
              ? data.title
              : "",

          type:
            typeof data.type === "string"
              ? data.type
              : "",

          fileUrl:
            typeof data.fileUrl === "string"
              ? data.fileUrl
              : "",

          consent:
            typeof data.consent === "string"
              ? data.consent
              : "",

          status:
            typeof data.status === "string"
              ? data.status
              : "بانتظار المراجعة",

          note:
            typeof data.note === "string"
              ? data.note
              : "",
        };
      });

    const payload: SubmissionsPayload = {
      success: true,
      submissions,
    };

    // حفظ آخر نتيجة ناجحة
    cachedPayload = payload;
    cachedAt = now;

    return NextResponse.json(
      {
        ...payload,
        source: "firestore",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Submissions-Cache": "MISS",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET SUBMISSIONS ERROR:",
      error
    );

    // في حال تعطل Firestore نستخدم آخر نسخة ناجحة
    if (cachedPayload) {
      return NextResponse.json(
        {
          ...cachedPayload,
          source: "stale-cache",
          warning:
            "تم عرض آخر نسخة محفوظة من أعمال الطلاب.",
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
            "X-Submissions-Cache": "STALE",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء جلب أعمال الطلاب",
        submissions: [],
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Submissions-Cache": "ERROR",
        },
      }
    );
  }
}