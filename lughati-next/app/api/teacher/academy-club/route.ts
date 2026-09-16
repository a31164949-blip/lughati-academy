import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";
const TEACHER_EMAIL = "a31164949@gmail.com";


type AcademyClubLevel =
  | "member"
  | "star"
  | "ambassador"
  | "leader";

const levelLabels: Record<AcademyClubLevel, string> = {
  member: "عضو نادي الأكاديمية",
  star: "نجم نادي الأكاديمية",
  ambassador: "سفير نادي الأكاديمية",
  leader: "قائد نادي الأكاديمية",
};

async function requireTeacher(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const { adminAuth } = getFirebaseAdmin();
  const decodedToken = await adminAuth.verifyIdToken(
    authorization.slice(7)
  );

  const email =
    typeof decodedToken.email === "string"
      ? decodedToken.email.trim().toLowerCase()
      : "";

  const role =
    typeof decodedToken.role === "string"
      ? decodedToken.role
      : "";

  if (
    role !== "teacher" &&
    role !== "admin" &&
    email !== TEACHER_EMAIL
  ) {
    throw new Error("FORBIDDEN");
  }

  return decodedToken.uid;
}

function createMembershipNumber(studentId: string) {
  const year = new Date().getUTCFullYear();
  const code = createHash("sha256")
    .update(studentId)
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();

  return `LAC-${year}-${code}`;
}

export async function POST(request: Request) {
  try {
    const teacherUid = await requireTeacher(request);
    const body = (await request.json()) as Record<string, unknown>;

    const studentId =
      typeof body.studentId === "string"
        ? body.studentId.trim()
        : "";

    const action =
      body.action === "stop" ? "stop" : "grant";

    const allowedLevels: AcademyClubLevel[] = [
      "member",
      "star",
      "ambassador",
      "leader",
    ];

    const level =
      typeof body.level === "string" &&
      allowedLevels.includes(body.level as AcademyClubLevel)
        ? (body.level as AcademyClubLevel)
        : "member";

    const durationDays =
      typeof body.durationDays === "number" &&
      [30, 60, 90].includes(body.durationDays)
        ? body.durationDays
        : 30;

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "معرّف الطالب غير صحيح." },
        { status: 400 }
      );
    }

    const { adminDb } = getFirebaseAdmin();
    const studentRef = adminDb.collection("students").doc(studentId);

    const membership = await adminDb.runTransaction(
      async (transaction) => {
        const snapshot = await transaction.get(studentRef);

        if (!snapshot.exists) {
          throw new Error("STUDENT_NOT_FOUND");
        }

        const studentData = snapshot.data() ?? {};
        const current =
          studentData.academyClubMembership &&
          typeof studentData.academyClubMembership === "object"
            ? studentData.academyClubMembership
            : {};

        if (action === "stop") {
          transaction.update(studentRef, {
            "academyClubMembership.active": false,
            "academyClubMembership.stoppedAt":
              FieldValue.serverTimestamp(),
            "academyClubMembership.stoppedBy": teacherUid,
            updatedAt: FieldValue.serverTimestamp(),
          });

          return null;
        }

        const now = new Date();
        const currentExpiry =
          current.expiresAt instanceof Timestamp
            ? current.expiresAt.toDate()
            : null;

        const renewalBase =
          current.active === true &&
          currentExpiry &&
          currentExpiry.getTime() > now.getTime()
            ? currentExpiry
            : now;

        const expiresAt = new Date(
          renewalBase.getTime() +
            durationDays * 24 * 60 * 60 * 1000
        );

        const membershipNumber =
          typeof current.membershipNumber === "string" &&
          current.membershipNumber.trim()
            ? current.membershipNumber
            : createMembershipNumber(studentId);

        const nextMembership = {
          active: true,
          membershipNumber,
          level,
          levelLabel: levelLabels[level],
          joinedAt:
            current.joinedAt instanceof Timestamp
              ? current.joinedAt
              : Timestamp.fromDate(now),
          expiresAt: Timestamp.fromDate(expiresAt),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: teacherUid,
          stoppedAt: null,
          stoppedBy: null,
        };

        transaction.update(studentRef, {
          academyClubMembership: nextMembership,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          ...nextMembership,
          joinedAt:
            nextMembership.joinedAt instanceof Timestamp
              ? nextMembership.joinedAt.toDate().toISOString()
              : now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          updatedAt: undefined,
        };
      }
    );

    return NextResponse.json({
      success: true,
      membership,
    });
  } catch (error) {
    console.error("Academy club membership error:", error);

    const message =
      error instanceof Error ? error.message : "";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "غير مصرح بالدخول." },
        { status: 401 }
      );
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, message: "هذا الإجراء مخصص للمعلم." },
        { status: 403 }
      );
    }

    if (message === "STUDENT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "لم يتم العثور على الطالب." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: "تعذر تحديث عضوية النادي." },
      { status: 500 }
    );
  }
}
