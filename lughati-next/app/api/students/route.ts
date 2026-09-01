import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudentData = {
  studentId?: string;
  studentName?: string;
  classroom?: string;
  active?: boolean;
};

type StudentItem = {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  active: boolean;
};

type StudentsPayload = {
  success: true;
  students: StudentItem[];
  source: "cache" | "firestore" | "stale-cache";
};

const CACHE_TTL_MS = 10 * 60 * 1000;

let cachedStudents: StudentItem[] | null = null;
let cachedAt = 0;

function jsonWithCache(
  payload: StudentsPayload,
  cacheState: "HIT" | "MISS" | "STALE"
) {
  return NextResponse.json(payload, {
    status: 200,
    headers: {
      /*
        القائمة عامة لصفحة الدخول ولا تحتوي على رمز الدخول.
        يسمح هذا لـ CDN بإعادة نفس القائمة للطلاب بدل إعادة
        قراءة Firestore لكل زيارة.
      */
      "Cache-Control":
        "public, s-maxage=600, stale-while-revalidate=300",
      "X-Students-Cache": cacheState,
    },
  });
}

export async function GET() {
  const now = Date.now();

  // كاش داخل عملية الخادم.
  if (
    cachedStudents &&
    now - cachedAt < CACHE_TTL_MS
  ) {
    return jsonWithCache(
      {
        success: true,
        students: cachedStudents,
        source: "cache",
      },
      "HIT"
    );
  }

  try {
    const { adminDb } = getFirebaseAdmin();

    /*
      صفحة الدخول تحتاج الطلاب النشطين فقط.
      هذا يمنع قراءة الطلاب المؤرشفين أو غير النشطين.
    */
    const snapshot =
      await adminDb
        .collection("students")
        .where("active", "==", true)
        .get();

    const students: StudentItem[] =
      snapshot.docs
        .map((studentDocument) => {
          const data =
            studentDocument.data() as StudentData;

          return {
            id: studentDocument.id,

            studentId:
              typeof data.studentId === "string" &&
              data.studentId.trim()
                ? data.studentId
                : studentDocument.id,

            studentName:
              typeof data.studentName === "string" &&
              data.studentName.trim()
                ? data.studentName
                : "طالب",

            classroom:
              typeof data.classroom === "string"
                ? data.classroom
                : "",

            active: true,
          };
        })
        .sort(
          (
            firstStudent,
            secondStudent
          ) =>
            firstStudent.studentName.localeCompare(
              secondStudent.studentName,
              "ar"
            )
        );

    cachedStudents = students;
    cachedAt = now;

    return jsonWithCache(
      {
        success: true,
        students,
        source: "firestore",
      },
      "MISS"
    );
  } catch (error) {
    console.error(
      "Students API error:",
      error
    );

    /*
      إذا تعذر Firestore مؤقتًا ولدينا نسخة سابقة،
      نستمر في تشغيل صفحة الدخول بها.
    */
    if (cachedStudents) {
      return jsonWithCache(
        {
          success: true,
          students: cachedStudents,
          source: "stale-cache",
        },
        "STALE"
      );
    }

    return NextResponse.json(
      {
        success: false,
        students: [],
        message:
          "تعذر تحميل قائمة الطلاب في الوقت الحالي.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Students-Cache": "ERROR",
        },
      }
    );
  }
}
