import { NextResponse } from "next/server";

import {
  getFirebaseAdmin,
} from "../../../firebase-admin";

async function getStudentFromRequest(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization?.startsWith(
      "Bearer "
    )
  ) {
    throw new Error(
      "UNAUTHORIZED"
    );
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
    decodedToken.role !==
    "student"
  ) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  const studentDocId =
    typeof decodedToken.studentDocId ===
      "string"
      ? decodedToken.studentDocId
      : "";

  if (!studentDocId) {
    throw new Error(
      "STUDENT_NOT_FOUND"
    );
  }

  return studentDocId;
}

function toMillis(
  value: unknown
) {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (
      value as {
        toMillis?: unknown;
      }
    ).toMillis === "function"
  ) {
    return (
      value as {
        toMillis: () => number;
      }
    ).toMillis();
  }

  return 0;
}

function toIso(
  value: unknown
) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    return (
      value as {
        toDate: () => Date;
      }
    )
      .toDate()
      .toISOString();
  }

  return "";
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

    /*
      استعلام الإنجازات هو نفسه المستخدم لتيجان الطالب.
      أضفنا فقط قراءة وثيقة ملخص واحدة لآخر تقييم،
      ولا يوجد onSnapshot أو استعلام مفتوح جديد.
    */
    const [
      summarySnapshot,
      achievementsSnapshot,
    ] = await Promise.all([
      adminDb
        .collection(
          "studentCrownSummary"
        )
        .doc(studentDocId)
        .get(),

      adminDb
        .collection(
          "lughatiCrownAchievements"
        )
        .where(
          "studentId",
          "==",
          studentDocId
        )
        .get(),
    ]);

    const achievements =
      achievementsSnapshot.docs
        .map((document) => {
          const data =
            document.data() ?? {};

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
            achievedAtMillis:
              toMillis(
                data.kingAchievedAt ??
                  data.updatedAt ??
                  data.createdAt
              ),
          };
        })
        .filter(
          (item) =>
            item.king === true
        )
        .sort(
          (a, b) =>
            b.achievedAtMillis -
            a.achievedAtMillis
        );

    const readingKingCount =
      achievements.filter(
        (item) =>
          item.mode ===
          "reading"
      ).length;

    const spellingKingCount =
      achievements.filter(
        (item) =>
          item.mode ===
          "spelling"
      ).length;

    const masteryCount =
      achievements.filter(
        (item) =>
          item.fullMastery
      ).length;

    const latestAchievement =
      achievements.length > 0
        ? (() => {
            const item =
              achievements[0];

            return {
              id: item.id,
              mode: item.mode,
              lessonName:
                item.lessonName,
              king:
                item.king,
              kingTitle:
                item.kingTitle,
              fullMastery:
                item.fullMastery,
              personalPhotoUrl:
                item.personalPhotoUrl,
              selectedAvatarIcon:
                item.selectedAvatarIcon,
            };
          })()
        : null;

    let latestAssessment:
      | {
          mode: string;
          lessonName: string;
          pageNumber: number;
          bestErrors: number;
          lastErrors: number;
          attemptCount: number;
          title: string;
          updatedAt: string;
        }
      | null = null;

    if (
      summarySnapshot.exists
    ) {
      const summaryData =
        summarySnapshot.data() ?? {};

      const saved =
        summaryData.latestAssessment;

      if (
        saved &&
        typeof saved === "object"
      ) {
        latestAssessment = {
          mode:
            typeof saved.mode ===
            "string"
              ? saved.mode
              : "",
          lessonName:
            typeof saved.lessonName ===
            "string"
              ? saved.lessonName
              : "",
          pageNumber:
            typeof saved.pageNumber ===
            "number"
              ? saved.pageNumber
              : 0,
          bestErrors:
            typeof saved.bestErrors ===
            "number"
              ? saved.bestErrors
              : 0,
          lastErrors:
            typeof saved.lastErrors ===
            "number"
              ? saved.lastErrors
              : 0,
          attemptCount:
            typeof saved.attemptCount ===
            "number"
              ? saved.attemptCount
              : 0,
          title:
            typeof saved.title ===
            "string"
              ? saved.title
              : "",
          updatedAt:
            toIso(
              saved.updatedAt
            ),
        };
      }
    }

    return NextResponse.json({
      success: true,
      readingKingCount,
      spellingKingCount,
      masteryCount,
      latestAchievement,
      latestAssessment,
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
      message ===
      "UNAUTHORIZED"
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

    if (
      message ===
      "STUDENT_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم العثور على الطالب.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر تحميل تاج لغتي.",
      },
      { status: 500 }
    );
  }
}
