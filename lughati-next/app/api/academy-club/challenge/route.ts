import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";

async function requireClubMember(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");

  const { adminAuth, adminDb } = getFirebaseAdmin();
  const token = await adminAuth.verifyIdToken(authorization.slice(7));
  if (token.role !== "student") throw new Error("FORBIDDEN");

  const studentId =
    typeof token.studentDocId === "string" ? token.studentDocId : "";
  if (!studentId) throw new Error("STUDENT_NOT_FOUND");

  const studentSnapshot = await adminDb.collection("students").doc(studentId).get();
  if (!studentSnapshot.exists) throw new Error("STUDENT_NOT_FOUND");

  const studentData = studentSnapshot.data() ?? {};
  const membership = studentData.academyClubMembership;
  const expiry = membership?.expiresAt instanceof Timestamp
    ? membership.expiresAt.toDate()
    : null;

  if (
    !membership ||
    membership.active !== true ||
    (expiry && expiry.getTime() < Date.now())
  ) {
    throw new Error("MEMBERSHIP_REQUIRED");
  }

  return {
    studentId,
    studentName:
      typeof studentData.studentName === "string"
        ? studentData.studentName
        : "طالب الأكاديمية",
    classroom:
      typeof studentData.classroom === "string" ? studentData.classroom : "",
  };
}

function toIso(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toISOString() : "";
}

export async function GET(request: Request) {
  try {
    const student = await requireClubMember(request);
    const { adminDb } = getFirebaseAdmin();
    const challengeSnapshot = await adminDb
      .collection("academyClubChallenges")
      .doc("current")
      .get();

    if (!challengeSnapshot.exists) {
      return NextResponse.json({ success: true, challenge: null, submission: null });
    }

    const challengeData = challengeSnapshot.data() ?? {};
    if (challengeData.active !== true) {
      return NextResponse.json({ success: true, challenge: null, submission: null });
    }

    const challengeId =
      typeof challengeData.challengeId === "string" ? challengeData.challengeId : "";
    const closesAt = toIso(challengeData.closesAt);
    const isClosed = closesAt ? new Date(closesAt).getTime() < Date.now() : false;

    const submissionId = `${challengeId}_${student.studentId}`;
    const submissionSnapshot = challengeId
      ? await adminDb.collection("academyClubChallengeSubmissions").doc(submissionId).get()
      : null;
    const submissionData = submissionSnapshot?.exists
      ? submissionSnapshot.data() ?? {}
      : null;

    return NextResponse.json({
      success: true,
      challenge: {
        challengeId,
        title: typeof challengeData.title === "string" ? challengeData.title : "تحدي النادي",
        instructions:
          typeof challengeData.instructions === "string"
            ? challengeData.instructions
            : "",
        points: typeof challengeData.points === "number" ? challengeData.points : 0,
        allowedTypes: Array.isArray(challengeData.allowedTypes)
          ? challengeData.allowedTypes
          : ["image"],
        closesAt,
        isClosed,
      },
      submission: submissionData
        ? {
            status:
              typeof submissionData.status === "string"
                ? submissionData.status
                : "pending",
            note: typeof submissionData.note === "string" ? submissionData.note : "",
            teacherNote:
              typeof submissionData.teacherNote === "string"
                ? submissionData.teacherNote
                : "",
            submittedAt: toIso(submissionData.submittedAt),
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status =
      message === "UNAUTHORIZED" ? 401 :
      message === "FORBIDDEN" || message === "MEMBERSHIP_REQUIRED" ? 403 :
      message === "STUDENT_NOT_FOUND" ? 404 : 500;
    return NextResponse.json(
      {
        success: false,
        code: message,
        message:
          message === "MEMBERSHIP_REQUIRED"
            ? "هذا التحدي مخصص لأعضاء نادي الأكاديمية."
            : "تعذر تحميل تحدي النادي.",
      },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const student = await requireClubMember(request);
    const body = (await request.json()) as Record<string, unknown>;
    const challengeId = typeof body.challengeId === "string" ? body.challengeId.trim() : "";
    const workType =
      body.workType === "audio" || body.workType === "video" ? body.workType : "image";
    const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl.trim() : "";
    const cloudinaryPublicId =
      typeof body.cloudinaryPublicId === "string" ? body.cloudinaryPublicId.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";

    if (!challengeId || !fileUrl.startsWith("https://")) {
      return NextResponse.json(
        { success: false, message: "بيانات المشاركة غير مكتملة." },
        { status: 400 }
      );
    }

    const { adminDb } = getFirebaseAdmin();
    const challengeRef = adminDb.collection("academyClubChallenges").doc("current");
    const submissionRef = adminDb
      .collection("academyClubChallengeSubmissions")
      .doc(`${challengeId}_${student.studentId}`);

    await adminDb.runTransaction(async (transaction) => {
      const [challengeSnapshot, submissionSnapshot] = await Promise.all([
        transaction.get(challengeRef),
        transaction.get(submissionRef),
      ]);

      const challenge = challengeSnapshot.data() ?? {};
      if (
        !challengeSnapshot.exists ||
        challenge.active !== true ||
        challenge.challengeId !== challengeId
      ) {
        throw new Error("CHALLENGE_UNAVAILABLE");
      }

      if (
        challenge.closesAt instanceof Timestamp &&
        challenge.closesAt.toDate().getTime() < Date.now()
      ) {
        throw new Error("CHALLENGE_CLOSED");
      }

      const allowedTypes = Array.isArray(challenge.allowedTypes)
        ? challenge.allowedTypes
        : ["image"];
      if (!allowedTypes.includes(workType)) throw new Error("TYPE_NOT_ALLOWED");
      if (submissionSnapshot.exists) throw new Error("ALREADY_SUBMITTED");

      transaction.create(submissionRef, {
        challengeId,
        challengeTitle: challenge.title ?? "تحدي النادي",
        studentId: student.studentId,
        studentName: student.studentName,
        classroom: student.classroom,
        workType,
        fileUrl,
        cloudinaryPublicId,
        note,
        status: "pending",
        teacherNote: "",
        pointsGranted: false,
        submittedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const messages: Record<string, string> = {
      ALREADY_SUBMITTED: "سبق أن أرسلت مشاركتك في هذا التحدي.",
      CHALLENGE_CLOSED: "انتهى وقت استقبال المشاركات.",
      CHALLENGE_UNAVAILABLE: "التحدي غير متاح الآن.",
      TYPE_NOT_ALLOWED: "نوع الملف غير مسموح في هذا التحدي.",
      MEMBERSHIP_REQUIRED: "هذا التحدي مخصص لأعضاء النادي.",
    };
    return NextResponse.json(
      { success: false, code, message: messages[code] || "تعذر إرسال المشاركة." },
      { status: code === "ALREADY_SUBMITTED" ? 409 : code === "UNAUTHORIZED" ? 401 : 400 }
    );
  }
}
