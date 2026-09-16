import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../../firebase-admin";

export const runtime = "nodejs";
const TEACHER_EMAIL = "a31164949@gmail.com";

async function requireTeacher(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth } = getFirebaseAdmin();
  const token = await adminAuth.verifyIdToken(authorization.slice(7));
  const email = typeof token.email === "string" ? token.email.trim().toLowerCase() : "";
  const role = typeof token.role === "string" ? token.role : "";
  if (role !== "teacher" && role !== "admin" && email !== TEACHER_EMAIL) {
    throw new Error("FORBIDDEN");
  }
  return token.uid;
}

function toIso(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toISOString() : "";
}

export async function GET(request: Request) {
  try {
    await requireTeacher(request);
    const { adminDb } = getFirebaseAdmin();
    const challengeSnapshot = await adminDb.collection("academyClubChallenges").doc("current").get();
    const challenge = challengeSnapshot.exists ? challengeSnapshot.data() ?? {} : null;
    const challengeId = challenge && typeof challenge.challengeId === "string"
      ? challenge.challengeId
      : "";

    const submissionsSnapshot = challengeId
      ? await adminDb
          .collection("academyClubChallengeSubmissions")
          .where("challengeId", "==", challengeId)
          .get()
      : null;

    const submissions = submissionsSnapshot
      ? submissionsSnapshot.docs
          .map((document) => {
            const data = document.data() ?? {};
            return {
              id: document.id,
              studentId: data.studentId ?? "",
              studentName: data.studentName ?? "طالب",
              classroom: data.classroom ?? "",
              workType: data.workType ?? "image",
              fileUrl: data.fileUrl ?? "",
              note: data.note ?? "",
              status: data.status ?? "pending",
              teacherNote: data.teacherNote ?? "",
              pointsGranted: data.pointsGranted === true,
              submittedAt: toIso(data.submittedAt),
            };
          })
          .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      : [];

    return NextResponse.json({
      success: true,
      challenge: challenge
        ? {
            challengeId,
            title: challenge.title ?? "",
            instructions: challenge.instructions ?? "",
            points: typeof challenge.points === "number" ? challenge.points : 0,
            allowedTypes: Array.isArray(challenge.allowedTypes) ? challenge.allowedTypes : ["image"],
            active: challenge.active === true,
            closesAt: toIso(challenge.closesAt),
          }
        : null,
      submissions,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { success: false, message: code === "FORBIDDEN" ? "هذا المسار مخصص للمعلم." : "تعذر تحميل تحدي النادي." },
      { status: code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const teacherUid = await requireTeacher(request);
    const body = (await request.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
    const instructions =
      typeof body.instructions === "string" ? body.instructions.trim().slice(0, 1200) : "";
    const points = typeof body.points === "number" ? Math.max(0, Math.min(100, Math.round(body.points))) : 0;
    const durationDays =
      typeof body.durationDays === "number" ? Math.max(1, Math.min(30, Math.round(body.durationDays))) : 7;
    const allowedTypes = Array.isArray(body.allowedTypes)
      ? body.allowedTypes.filter((type) => type === "image" || type === "audio" || type === "video")
      : ["image"];

    if (!title || !instructions || allowedTypes.length === 0) {
      return NextResponse.json({ success: false, message: "أكمل بيانات التحدي." }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    const now = new Date();
    const closesAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const challengeId = `club-${now.getTime()}`;

    await adminDb.collection("academyClubChallenges").doc("current").set({
      challengeId,
      title,
      instructions,
      points,
      allowedTypes,
      active: true,
      opensAt: Timestamp.fromDate(now),
      closesAt: Timestamp.fromDate(closesAt),
      createdBy: teacherUid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, challengeId });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { success: false, message: "تعذر نشر تحدي النادي." },
      { status: code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const teacherUid = await requireTeacher(request);
    const body = (await request.json()) as Record<string, unknown>;
    const submissionId = typeof body.submissionId === "string" ? body.submissionId.trim() : "";
    const decision = body.decision === "approved" ? "approved" : "returned";
    const teacherNote = typeof body.teacherNote === "string" ? body.teacherNote.trim().slice(0, 500) : "";
    if (!submissionId) {
      return NextResponse.json({ success: false, message: "لم تحدد المشاركة." }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    const submissionRef = adminDb.collection("academyClubChallengeSubmissions").doc(submissionId);
    const challengeRef = adminDb.collection("academyClubChallenges").doc("current");

    await adminDb.runTransaction(async (transaction) => {
      const [submissionSnapshot, challengeSnapshot] = await Promise.all([
        transaction.get(submissionRef),
        transaction.get(challengeRef),
      ]);
      if (!submissionSnapshot.exists) throw new Error("NOT_FOUND");

      const submission = submissionSnapshot.data() ?? {};
      const challenge = challengeSnapshot.data() ?? {};
      const points = typeof challenge.points === "number" ? challenge.points : 0;

      transaction.update(submissionRef, {
        status: decision,
        teacherNote,
        reviewedBy: teacherUid,
        reviewedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        ...(decision === "approved" && submission.pointsGranted !== true
          ? { pointsGranted: true }
          : {}),
      });

      if (decision === "approved" && submission.pointsGranted !== true && points > 0) {
        const studentRef = adminDb.collection("students").doc(String(submission.studentId));
        transaction.update(studentRef, {
          points: FieldValue.increment(points),
          pointsHistory: FieldValue.arrayUnion({
            type: "academyClubChallenge",
            points,
            reason: challenge.title ?? "تحدي نادي الأكاديمية",
            challengeId: challenge.challengeId ?? "",
            createdAt: Timestamp.now(),
          }),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { success: false, message: code === "NOT_FOUND" ? "المشاركة غير موجودة." : "تعذر مراجعة المشاركة." },
      { status: code === "NOT_FOUND" ? 404 : code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500 }
    );
  }
}
