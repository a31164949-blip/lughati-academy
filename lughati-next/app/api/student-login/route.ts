import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

type LoginRequest = {
  studentId?: string;
  studentCode?: string;
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 10;
const ATTEMPT_WINDOW_MINUTES = 10;

export async function POST(request: Request) {
  try {
    const { adminAuth, adminDb } = getFirebaseAdmin();

    const body = (await request.json()) as LoginRequest;

    const studentId = body.studentId?.trim();
    const studentCode = body.studentCode?.trim();

    if (!studentId || !studentCode) {
      return NextResponse.json(
        {
          success: false,
          message: "يرجى اختيار اسم الطالب وإدخال رمز الدخول.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(studentCode)) {
      return NextResponse.json(
        {
          success: false,
          message: "رمز الدخول يجب أن يتكون من أربعة أرقام.",
        },
        { status: 400 }
      );
    }

    /*
      نحصل على عنوان الاتصال قدر الإمكان.
      سنستخدمه مع رقم الطالب حتى لا تؤثر
      المحاولات من جهاز على جميع الأجهزة.
    */
    const forwardedFor =
      request.headers.get("x-forwarded-for") ?? "";

    const realIp =
      request.headers.get("x-real-ip") ?? "";

    const clientIp =
      forwardedFor
        .split(",")[0]
        ?.trim() ||
      realIp.trim() ||
      "unknown";

    const safeIp = clientIp.replace(
      /[^a-zA-Z0-9._:-]/g,
      "_"
    );

    const attemptDocumentId =
      `${studentId}__${safeIp}`;

    const attemptReference =
      adminDb
        .collection("studentLoginAttempts")
        .doc(attemptDocumentId);

    const now = Date.now();

    /*
      1) نفحص أولًا هل الجهاز محظور مؤقتًا.
    */
    const attemptSnapshot =
      await attemptReference.get();

    if (attemptSnapshot.exists) {
      const attemptData =
        attemptSnapshot.data();

      const lockedUntil =
        Number(attemptData?.lockedUntil ?? 0);

      if (lockedUntil > now) {
        const remainingSeconds =
          Math.ceil(
            (lockedUntil - now) / 1000
          );

        const remainingMinutes =
          Math.max(
            1,
            Math.ceil(
              remainingSeconds / 60
            )
          );

        return NextResponse.json(
          {
            success: false,
            message:
              `تم إيقاف المحاولات مؤقتًا. حاول مرة أخرى بعد ${remainingMinutes} دقائق.`,
          },
          {
            status: 429,
            headers: {
              "Retry-After":
                String(remainingSeconds),
            },
          }
        );
      }
    }

    /*
      2) نتحقق من الطالب.
    */
    const studentReference =
      adminDb
        .collection("students")
        .doc(studentId);

    const studentSnapshot =
      await studentReference.get();

    if (!studentSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم العثور على بيانات الطالب.",
        },
        { status: 404 }
      );
    }

    const studentData =
      studentSnapshot.data();

    if (
      !studentData ||
      studentData.active !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "حساب الطالب غير متاح حاليًا.",
        },
        { status: 403 }
      );
    }

    const savedLoginCode =
      String(
        studentData.loginCode ?? ""
      ).trim();

    /*
      3) الرمز غير صحيح:
      نسجل محاولة فاشلة داخل Transaction.
    */
    if (
      savedLoginCode !== studentCode
    ) {
      const rateLimitResult =
        await adminDb.runTransaction(
          async (transaction) => {
            const snapshot =
              await transaction.get(
                attemptReference
              );

            const data =
              snapshot.exists
                ? snapshot.data()
                : {};

            const windowStartedAt =
              Number(
                data?.windowStartedAt ??
                  now
              );

            const windowMilliseconds =
              ATTEMPT_WINDOW_MINUTES *
              60 *
              1000;

            const windowExpired =
              now -
                windowStartedAt >
              windowMilliseconds;

            const previousAttempts =
              windowExpired
                ? 0
                : Number(
                    data?.failedAttempts ??
                      0
                  );

            const nextAttempts =
              previousAttempts + 1;

            const nextWindowStartedAt =
              windowExpired
                ? now
                : windowStartedAt;

            let lockedUntil = 0;

            if (
              nextAttempts >=
              MAX_FAILED_ATTEMPTS
            ) {
              lockedUntil =
                now +
                LOCK_MINUTES *
                  60 *
                  1000;
            }

            transaction.set(
              attemptReference,
              {
                studentId,
                clientIp: safeIp,

                failedAttempts:
                  nextAttempts,

                windowStartedAt:
                  nextWindowStartedAt,

                lockedUntil,

                updatedAt:
                  new Date(),
              },
              {
                merge: true,
              }
            );

            return {
              nextAttempts,
              lockedUntil,
            };
          }
        );

      if (
        rateLimitResult.lockedUntil >
        now
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `تم تجاوز عدد المحاولات المسموح بها. تم إيقاف المحاولات لمدة ${LOCK_MINUTES} دقائق.`,
          },
          {
            status: 429,
            headers: {
              "Retry-After":
                String(
                  LOCK_MINUTES * 60
                ),
            },
          }
        );
      }

      const remainingAttempts =
        MAX_FAILED_ATTEMPTS -
        rateLimitResult.nextAttempts;

      return NextResponse.json(
        {
          success: false,
          message:
            remainingAttempts > 0
              ? `رمز الدخول غير صحيح. تبقى ${remainingAttempts} محاولات.`
              : "رمز الدخول غير صحيح.",
        },
        { status: 401 }
      );
    }

    /*
      4) تسجيل الدخول صحيح:
      نحذف سجل المحاولات السابقة.
    */
    try {
      await attemptReference.delete();
    } catch (error) {
      console.error(
        "تعذر حذف سجل محاولات الدخول:",
        error
      );
    }

    const resolvedStudentId =
      String(
        studentData.studentId ??
          studentSnapshot.id
      );

    const studentName =
      String(
        studentData.studentName ??
          "طالب"
      );

    const classroom =
      String(
        studentData.classroom ?? ""
      );

    const uid =
      `student_${resolvedStudentId}`;

    const customToken =
      await adminAuth.createCustomToken(
        uid,
        {
          role: "student",

          studentId:
            resolvedStudentId,

          studentDocId:
            studentSnapshot.id,
        }
      );

    return NextResponse.json({
      success: true,

      token: customToken,

      student: {
        id: studentSnapshot.id,
        studentId:
          resolvedStudentId,
        studentName,
        classroom,
      },
    });
  } catch (error) {
    console.error(
      "Student login error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر تسجيل الدخول الآن. حاول مرة أخرى.",
      },
      { status: 500 }
    );
  }
}