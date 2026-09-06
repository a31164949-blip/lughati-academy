import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

const ACTIVE_SURPRISE_CHALLENGE_ID =
  "active-surprise-challenge";

async function getStudentFromRequest(
  request: Request
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization?.startsWith("Bearer ")
  ) {
    throw new Error("UNAUTHORIZED");
  }

  const token =
    authorization.slice(7);

  const { adminAuth } =
    getFirebaseAdmin();

  const decodedToken =
    await adminAuth.verifyIdToken(token);

  if (
    decodedToken.role !== "student"
  ) {
    throw new Error("FORBIDDEN");
  }

  return decodedToken;
}

export async function GET(
  request: Request
) {
  try {
    await getStudentFromRequest(
      request
    );

    const { adminDb } =
      getFirebaseAdmin();

    const snapshot =
      await adminDb
        .collection(
          "surpriseChallenges"
        )
        .doc(
          ACTIVE_SURPRISE_CHALLENGE_ID
        )
        .get();

    if (!snapshot.exists) {
      return NextResponse.json({
        success: true,
        challenge: null,
      });
    }

    const data =
      snapshot.data() ?? {};

    const active =
      data.active === true;

    const question =
      typeof data.question === "string"
        ? data.question.trim()
        : "";

    if (!active || !question) {
      return NextResponse.json({
        success: true,
        challenge: null,
      });
    }

    const expiresAt =
      typeof data.expiresAt === "string"
        ? data.expiresAt
        : "";

    if (expiresAt) {
      const expiresTime =
        new Date(
          expiresAt
        ).getTime();

      if (
        Number.isFinite(
          expiresTime
        ) &&
        Date.now() >= expiresTime
      ) {
        return NextResponse.json({
          success: true,
          challenge: null,
        });
      }
    }

    return NextResponse.json({
      success: true,

      challenge: {
        id: snapshot.id,

        title:
          typeof data.title ===
            "string" &&
          data.title.trim()
            ? data.title
            : "لغز البرق",

        question,

        points:
          typeof data.points ===
          "number"
            ? data.points
            : 0,

        targetClassroom:
          typeof data
            .targetClassroom ===
          "string"
            ? data.targetClassroom
            : "الجميع",

        active: true,

        expiresAt,

        challengeVersion:
          typeof data
            .challengeVersion ===
            "string" &&
          data.challengeVersion
            ? data.challengeVersion
            : snapshot.id,
      },
    });
  } catch (error) {
    console.error(
      "Surprise challenge GET error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "غير مصرح بالدخول.",
        },
        { status: 401 }
      );
    }

    if (
      message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "هذا المسار مخصص للطلاب.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر تحميل التحدي المفاجئ.",
      },
      { status: 500 }
    );
  }
}