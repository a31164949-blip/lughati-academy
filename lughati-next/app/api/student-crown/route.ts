import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

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
    await adminAuth.verifyIdToken(
      token
    );

  if (
    decodedToken.role !== "student"
  ) {
    throw new Error("FORBIDDEN");
  }

  const studentDocId =
    typeof decodedToken.studentDocId === "string"
      ? decodedToken.studentDocId
      : "";

  if (!studentDocId) {
    throw new Error(
      "STUDENT_NOT_FOUND"
    );
  }

  return studentDocId;
}

export async function GET(
  request: Request
) {
  try {
    const studentDocId =
      await getStudentFromRequest(
        request
      );

    const { adminDb } =
      getFirebaseAdmin();

    const snapshot =
      await adminDb
        .collection(
          "lughatiCrownAchievements"
        )
        .where(
          "studentId",
          "==",
          studentDocId
        )
        .get();

    const achievements =
      snapshot.docs
        .map((document) => {
          const data =
            document.data();

          return {
            id:
              document.id,

            mode:
              typeof data.mode ===
              "string"
                ? data.mode
                : "",

            lessonName:
              typeof data.lessonName ===
              "string"
                ? data.lessonName
                : "",

            king:
              data.king === true,

            kingTitle:
              typeof data.kingTitle ===
              "string"
                ? data.kingTitle
                : "",

            fullMastery:
              data.fullMastery ===
              true,

            personalPhotoUrl:
              typeof data.personalPhotoUrl ===
              "string"
                ? data.personalPhotoUrl
                : "",

            selectedAvatarIcon:
              typeof data.selectedAvatarIcon ===
              "string"
                ? data.selectedAvatarIcon
                : "👦🏻",

            updatedAt:
              data.updatedAt ?? null,

            createdAt:
              data.createdAt ?? null,
          };
        })
        .filter(
          (item) => item.king
        );

    const readingKings =
      achievements.filter(
        (item) =>
          item.mode === "reading"
      );

    const spellingKings =
      achievements.filter(
        (item) =>
          item.mode === "spelling"
      );

    const masteryCount =
      achievements.filter(
        (item) =>
          item.fullMastery
      ).length;

    /*
     * نرتب الإنجازات بحيث الأحدث يظهر أولًا.
     * Firestore Timestamp يدعم toMillis().
     */
    achievements.sort(
      (a, b) => {
        const aTime =
          typeof a.updatedAt?.toMillis ===
          "function"
            ? a.updatedAt.toMillis()
            : typeof a.createdAt?.toMillis ===
                "function"
              ? a.createdAt.toMillis()
              : 0;

        const bTime =
          typeof b.updatedAt?.toMillis ===
          "function"
            ? b.updatedAt.toMillis()
            : typeof b.createdAt?.toMillis ===
                "function"
              ? b.createdAt.toMillis()
              : 0;

        return bTime - aTime;
      }
    );

    return NextResponse.json({
      success: true,

      readingKingCount:
        readingKings.length,

      spellingKingCount:
        spellingKings.length,

      masteryCount,

      latestAchievement:
        achievements[0] ?? null,

      achievements:
        achievements.map(
          (item) => ({
            id: item.id,
            mode: item.mode,
            lessonName:
              item.lessonName,
            king: item.king,
            kingTitle:
              item.kingTitle,
            fullMastery:
              item.fullMastery,
            personalPhotoUrl:
              item.personalPhotoUrl,
            selectedAvatarIcon:
              item.selectedAvatarIcon,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Student crown GET error:",
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
        {
          status: 401,
        }
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
        {
          status: 403,
        }
      );
    }

    if (
      message ===
      "STUDENT_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تعذر معرفة الطالب الحالي.",
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
          "تعذر تحميل بيانات تاج لغتي.",
      },
      {
        status: 500,
      }
    );
  }
}