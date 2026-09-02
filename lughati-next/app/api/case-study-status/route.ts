import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CaseStudyStatusPayload =
  | {
      success: true;
      completed: boolean;
    }
  | {
      success: false;
      completed: false;
      message: string;
    };

export async function GET(
  request: Request
) {
  try {
    const authHeader =
      request.headers.get(
        "authorization"
      );

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          completed: false,
          message:
            "غير مصرح بالدخول.",
        } satisfies CaseStudyStatusPayload,
        {
          status: 401,
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const idToken =
      authHeader.slice(
        "Bearer ".length
      );

    const {
      adminAuth,
      adminDb,
    } = getFirebaseAdmin();

    const decodedToken =
      await adminAuth.verifyIdToken(
        idToken
      );

    /*
      نحاول الحصول على معرف مستند الطالب
      من الـ custom claims أولًا.
    */
    const studentDocId =
      typeof decodedToken
        .studentDocId === "string" &&
      decodedToken.studentDocId.trim()
        ? decodedToken.studentDocId.trim()
        : "";

    const studentIdClaim =
      typeof decodedToken.studentId ===
        "string" &&
      decodedToken.studentId.trim()
        ? decodedToken.studentId.trim()
        : "";

    const studentId =
      studentDocId ||
      studentIdClaim;

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          completed: false,
          message:
            "تعذر تحديد حساب الطالب.",
        } satisfies CaseStudyStatusPayload,
        {
          status: 400,
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    /*
      قراءة مستند واحد فقط:
      studentCaseStudies/{studentId}
    */
    const caseStudySnapshot =
      await adminDb
        .collection(
          "studentCaseStudies"
        )
        .doc(studentId)
        .get();

    if (
      !caseStudySnapshot.exists
    ) {
      return NextResponse.json(
        {
          success: true,
          completed: false,
        } satisfies CaseStudyStatusPayload,
        {
          status: 200,
          headers: {
            "Cache-Control":
              "private, no-store",
          },
        }
      );
    }

    const data =
      caseStudySnapshot.data();

    const completed =
      data?.caseStudyCompleted ===
      true;

    return NextResponse.json(
      {
        success: true,
        completed,
      } satisfies CaseStudyStatusPayload,
      {
        status: 200,
        headers: {
          "Cache-Control":
            "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Case study status API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        completed: false,
        message:
          "تعذر التحقق من دراسة الحالة حاليًا.",
      } satisfies CaseStudyStatusPayload,
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}