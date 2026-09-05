import { NextResponse } from "next/server";
import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  getFirebaseAdmin,
} from "../../../../firebase-admin";

import {
  getStudentSubmissionWindow,
} from "../../../lib/studentSubmissionWindow";

type CreateStudentWorkRequest = {
  studentId?: string;
  studentName?: string;
  classroom?: string;

  title?: string;
  note?: string;

  workType?: string;

  fileUrl?: string;

  cloudinaryPublicId?: string;

  duration?: number | null;
};

export async function POST(
  request: Request
) {
  try {
    /*
      أولًا:
      فحص وقت استقبال أعمال الطالب.

      هذا API خاص بإرسال الطالب،
      لذلك يخضع لفترة:
      1 ظهرًا - 10 مساءً.
    */
    const submissionWindow =
      getStudentSubmissionWindow();

    if (!submissionWindow.isOpen) {
      return NextResponse.json(
        {
          success: false,

          code:
            "STUDENT_SUBMISSION_CLOSED",

          message:
            submissionWindow.message,

          opensAt:
            submissionWindow.opensAt,

          closesAt:
            submissionWindow.closesAt,

          timeZone:
            submissionWindow.timeZone,
        },
        {
          status: 403,
        }
      );
    }

    const body =
      (await request.json()) as
        CreateStudentWorkRequest;

    const studentId =
      typeof body.studentId ===
      "string"
        ? body.studentId.trim()
        : "";

    const studentName =
      typeof body.studentName ===
        "string" &&
      body.studentName.trim()
        ? body.studentName.trim()
        : "طالب الأكاديمية";

    const classroom =
      typeof body.classroom ===
      "string"
        ? body.classroom.trim()
        : "";

    const title =
      typeof body.title ===
      "string"
        ? body.title.trim()
        : "";

    const note =
      typeof body.note ===
      "string"
        ? body.note.trim()
        : "";

    const workType =
      typeof body.workType ===
        "string" &&
      body.workType.trim()
        ? body.workType.trim()
        : "image";

    const fileUrl =
      typeof body.fileUrl ===
      "string"
        ? body.fileUrl.trim()
        : "";

    const cloudinaryPublicId =
      typeof body.cloudinaryPublicId ===
      "string"
        ? body.cloudinaryPublicId.trim()
        : "";

    const duration =
      typeof body.duration ===
      "number"
        ? body.duration
        : null;

    /*
      التحقق من البيانات الأساسية.
    */
    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تعذر تحديد حساب الطالب. سجّل الدخول من جديد.",
        },
        {
          status: 400,
        }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            "اكتب عنوان العمل أولًا.",
        },
        {
          status: 400,
        }
      );
    }

    if (!fileUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم العثور على الملف المرفوع.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      workType !== "image" &&
      workType !== "audio" &&
      workType !== "video"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "نوع العمل غير مدعوم.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      adminDb,
    } = getFirebaseAdmin();

    /*
      إنشاء سجل العمل من الخادم.

      الطالب لا ينشر مباشرة في المعرض،
      بل ينتظر مراجعة المعلم.
    */
    const workReference =
      await adminDb
        .collection(
          "studentWorks"
        )
        .add({
          studentId,

          studentName,

          classroom,

          title,

          note,

          workType,

          type:
            workType,

          fileUrl,

          cloudinaryPublicId,

          duration,

          status:
            "pending",

          approved:
            false,

          teacherApproved:
            false,

          publishedToGallery:
            false,

          published:
            false,

          source:
            "student-upload",

          createdAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp(),
        });

    return NextResponse.json(
      {
        success: true,

        id:
          workReference.id,

        message:
          "تم إرسال عملك للمعلم، وهو الآن بانتظار المراجعة ✅",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "CREATE STUDENT WORK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "تعذر إرسال العمل حاليًا.",
      },
      {
        status: 500,
      }
    );
  }
}