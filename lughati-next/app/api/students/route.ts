import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import {
  getFirebaseAdmin,
} from "../../../firebase-admin";

export const runtime = "nodejs";

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
  تحميل قائمة الفصول.

  نحتفظ بها في كاش Next.js
  لمدة 10 دقائق.
*/
const getCachedClassrooms =
  unstable_cache(
    async (): Promise<string[]> => {
      const {
        adminDb,
      } =
        getFirebaseAdmin();

      const snapshot =
        await adminDb
          .collection(
            "students"
          )
          .where(
            "active",
            "==",
            true
          )
          .get();

      const classrooms =
        Array.from(
          new Set(
            snapshot.docs
              .map(
                (
                  studentDocument
                ) => {
                  const data =
                    studentDocument.data() as
                      StudentData;

                  return typeof data.classroom ===
                    "string"
                    ? data.classroom.trim()
                    : "";
                }
              )
              .filter(
                Boolean
              )
          )
        ).sort(
          (
            first,
            second
          ) =>
            first.localeCompare(
              second,
              "ar"
            )
        );

      return classrooms;
    },
    [
      "login-classrooms",
    ],
    {
      revalidate:
        600,

      tags: [
        "login-classrooms",
      ],
    }
  );

/*
  تحميل طلاب فصل واحد فقط.

  الكاش مستقل لكل فصل.
*/
async function getStudentsByClassroom(
  classroom: string
) {
  const cachedLoader =
    unstable_cache(
      async (): Promise<
        StudentItem[]
      > => {
        const {
          adminDb,
        } =
          getFirebaseAdmin();

        const snapshot =
          await adminDb
            .collection(
              "students"
            )
            .where(
              "active",
              "==",
              true
            )
            .where(
              "classroom",
              "==",
              classroom
            )
            .get();

        return snapshot.docs
          .map(
            (
              studentDocument
            ) => {
              const data =
                studentDocument.data() as
                  StudentData;

              return {
                id:
                  studentDocument.id,

                studentId:
                  typeof data.studentId ===
                    "string" &&
                  data.studentId.trim()
                    ? data.studentId
                    : studentDocument.id,

                studentName:
                  typeof data.studentName ===
                    "string" &&
                  data.studentName.trim()
                    ? data.studentName
                    : "طالب",

                classroom:
                  typeof data.classroom ===
                  "string"
                    ? data.classroom
                    : classroom,

                active:
                  true,
              };
            }
          )
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
      },
      [
        "login-students",
        classroom,
      ],
      {
        revalidate:
          600,

        tags: [
          `login-students-${classroom}`,
        ],
      }
    );

  return cachedLoader();
}

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const classroom =
      (
        url.searchParams.get(
          "classroom"
        ) || ""
      ).trim();

    /*
      إذا لم يرسل الفصل:
      نرجع أسماء الفصول فقط.
    */
    if (!classroom) {
      const classrooms =
        await getCachedClassrooms();

      return NextResponse.json(
        {
          success:
            true,

          classrooms,
        },
        {
          status:
            200,

          headers: {
            "Cache-Control":
              "public, s-maxage=600, stale-while-revalidate=300",

            "X-Students-Mode":
              "CLASSROOMS",
          },
        }
      );
    }

    /*
      بعد اختيار الفصل:
      نحمل طلاب هذا الفصل فقط.
    */
    const students =
      await getStudentsByClassroom(
        classroom
      );

    return NextResponse.json(
      {
        success:
          true,

        classroom,

        students,
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "public, s-maxage=600, stale-while-revalidate=300",

          "X-Students-Mode":
            "CLASSROOM-STUDENTS",
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
        success:
          false,

        classrooms:
          [],

        students:
          [],

        message:
          "تعذر تحميل بيانات الدخول في الوقت الحالي.",
      },
      {
        status:
          500,

        headers: {
          "Cache-Control":
            "no-store",

          "X-Students-Cache":
            "ERROR",
        },
      }
    );
  }
}