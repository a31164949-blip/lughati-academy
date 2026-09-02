import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
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

/*
  هذا الكاش أهم من الكاش السابق:
  Next.js يحتفظ بنتيجة الاستعلام لمدة 10 دقائق،
  بدل الاعتماد فقط على ذاكرة عملية الخادم.
*/
const getCachedStudents = unstable_cache(
  async (): Promise<StudentItem[]> => {
    const { adminDb } = getFirebaseAdmin();

    const snapshot = await adminDb
      .collection("students")
      .where("active", "==", true)
      .get();

    return snapshot.docs
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
      .sort((firstStudent, secondStudent) =>
        firstStudent.studentName.localeCompare(
          secondStudent.studentName,
          "ar"
        )
      );
  },
  ["login-active-students"],
  {
    revalidate: 600,
    tags: ["login-active-students"],
  }
);

export async function GET() {
  try {
    const students = await getCachedStudents();

    return NextResponse.json(
      {
        success: true,
        students,
      },
      {
        status: 200,
        headers: {
          /*
            كاش إضافي للمتصفح وCDN.
            القائمة لا تحتوي على رمز دخول الطالب.
          */
          "Cache-Control":
            "public, s-maxage=600, stale-while-revalidate=300",

          "X-Students-Cache":
            "NEXT-DATA-CACHE",
        },
      }
    );
  } catch (error) {
    console.error(
      "Students API error:",
      error
    );

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