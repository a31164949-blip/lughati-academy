import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

type AvatarItem = {
  id: string;
  icon: string;
  name: string;
  requiredPoints: number;
};

const avatars: AvatarItem[] = [
  {
    id: "boy-1",
    icon: "👦🏻",
    name: "فارس الصغير",
    requiredPoints: 0,
  },
  {
    id: "boy-2",
    icon: "🧒🏻",
    name: "القارئ الصغير",
    requiredPoints: 0,
  },
  {
    id: "boy-3",
    icon: "👦🏽",
    name: "المستكشف",
    requiredPoints: 0,
  },
  {
    id: "boy-4",
    icon: "🧑🏻‍🎓",
    name: "طالب المعرفة",
    requiredPoints: 600,
  },
  {
    id: "boy-5",
    icon: "👦🏾",
    name: "بطل النشاط",
    requiredPoints: 800,
  },
  {
    id: "boy-6",
    icon: "🧑🏽‍💻",
    name: "المبدع",
    requiredPoints: 1000,
  },
  {
    id: "boy-7",
    icon: "🦸🏻‍♂️",
    name: "بطل لغتي",
    requiredPoints: 1500,
  },
  {
    id: "boy-8",
    icon: "🤴🏻",
    name: "نجم الأكاديمية",
    requiredPoints: 2000,
  },
];

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

    const studentSnapshot =
      await adminDb
        .collection("students")
        .doc(studentDocId)
        .get();

    if (
      !studentSnapshot.exists
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم العثور على الطالب.",
        },
        {
          status: 404,
        }
      );
    }

    const studentData =
      studentSnapshot.data() ??
      {};

    return NextResponse.json({
      success: true,

      points:
        typeof studentData.points ===
        "number"
          ? studentData.points
          : 0,

      selectedAvatar:
        typeof studentData.selectedAvatar ===
        "string"
          ? studentData.selectedAvatar
          : "boy-1",

      selectedAvatarIcon:
        typeof studentData.selectedAvatarIcon ===
        "string"
          ? studentData.selectedAvatarIcon
          : "👦🏻",

      selectedAvatarName:
        typeof studentData.selectedAvatarName ===
        "string"
          ? studentData.selectedAvatarName
          : "فارس الصغير",
    });
  } catch (error) {
    console.error(
      "Student avatar GET error:",
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
        {
          status: 401,
        }
      );
    }

    if (
      message ===
      "FORBIDDEN"
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

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر تحميل الشخصية.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const studentDocId =
      await getStudentFromRequest(
        request
      );

    const body =
      await request.json();

    const avatarId =
      typeof body?.avatarId ===
      "string"
        ? body.avatarId
        : "";

    const avatar =
      avatars.find(
        (item) =>
          item.id === avatarId
      );

    if (!avatar) {
      return NextResponse.json(
        {
          success: false,
          message:
            "الشخصية غير صحيحة.",
        },
        {
          status: 400,
        }
      );
    }

    const { adminDb } =
      getFirebaseAdmin();

    const studentRef =
      adminDb
        .collection("students")
        .doc(studentDocId);

    const studentSnapshot =
      await studentRef.get();

    if (
      !studentSnapshot.exists
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم العثور على الطالب.",
        },
        {
          status: 404,
        }
      );
    }

    const studentData =
      studentSnapshot.data() ??
      {};

    const points =
      typeof studentData.points ===
      "number"
        ? studentData.points
        : 0;

    if (
      points <
      avatar.requiredPoints
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `🔒 تحتاج إلى ${avatar.requiredPoints} نقطة لفتح ${avatar.name}.`,
        },
        {
          status: 403,
        }
      );
    }

    await studentRef.update({
      selectedAvatar:
        avatar.id,

      selectedAvatarIcon:
        avatar.icon,

      selectedAvatarName:
        avatar.name,

      selectedAvatarUpdatedAt:
        FieldValue.serverTimestamp(),

      updatedAt:
        FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,

      selectedAvatar:
        avatar.id,

      selectedAvatarIcon:
        avatar.icon,

      selectedAvatarName:
        avatar.name,

      message:
        `✅ تم اختيار صورة «${avatar.name}» بنجاح.`,
    });
  } catch (error) {
    console.error(
      "Student avatar POST error:",
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
        {
          status: 401,
        }
      );
    }

    if (
      message ===
      "FORBIDDEN"
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

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر حفظ الشخصية.",
      },
      {
        status: 500,
      }
    );
  }
}