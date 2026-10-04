import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { getFirebaseAdmin } from "../../../../firebase-admin";
import { requireClubMember } from "../../../lib/clubMember";
import { MAX_VIDEO_BYTES, VIDEO_TYPES, videoUploadUrl, videoPlaybackUrl } from "../../../lib/r2Video";

export const runtime = "nodejs";
const DAILY_BYTES = 200 * 1024 * 1024;
const LIFETIME_BYTES = 8 * 1024 * 1024 * 1024;

// Reservations are never refunded: failed uploads also count toward the conservative ceiling.
export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
    const { adminAuth, adminDb } = getFirebaseAdmin();
    const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
    const teacher = decoded.role === "teacher" || decoded.role === "admin" || decoded.email?.toLowerCase() === "a31164949@gmail.com";
    const body = await request.json();
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });

    if (body.action === "play") {
      const id = typeof body.submissionId === "string" ? body.submissionId : "";
      if (!id || id.includes("/")) throw new Error("INVALID_VIDEO");
      const student = teacher ? null : await requireClubMember(request);
      const snapshot = await adminDb.collection("academyClubChallengeSubmissions").doc(id).get();
      const data = snapshot.data();
      if (!snapshot.exists || !data?.r2Key || (!teacher && data.studentId !== student?.studentId)) throw new Error("FORBIDDEN");
      const usage = adminDb.collection("r2VideoUsage").doc(`play-${decoded.uid}-${today}`);
      await adminDb.runTransaction(async tx => {
        const current = await tx.get(usage);
        const count = Number(current.data()?.count || 0);
        if (count >= (teacher ? 200 : 30)) throw new Error("DAILY_LIMIT");
        tx.set(usage, { count: count + 1 });
      });
      return NextResponse.json({ url: await videoPlaybackUrl(data.r2Key) }, { headers: { "Cache-Control": "no-store" } });
    }

    const student = await requireClubMember(request);
    const challengeId = typeof body.challengeId === "string" ? body.challengeId : "";
    const contentType = typeof body.contentType === "string" ? body.contentType : "";
    const size = body.size;
    if (!challengeId || challengeId.includes("/") || !VIDEO_TYPES[contentType] || !Number.isSafeInteger(size) || size < 1 || size > MAX_VIDEO_BYTES) throw new Error("INVALID_VIDEO");
    // Check configuration before reserving storage. The signed length restricts each PUT.
    const proposedKey = `club/${randomUUID()}.${VIDEO_TYPES[contentType]}`;
    await videoUploadUrl(proposedKey, size, contentType);
    const reservation = adminDb.collection("r2VideoReservations").doc(`${challengeId}_${student.studentId}`);
    const challengeRef = adminDb.collection("academyClubChallenges").doc("current");
    const submissionRef = adminDb.collection("academyClubChallengeSubmissions").doc(reservation.id);
    const totalRef = adminDb.collection("r2VideoUsage").doc("storage");
    const dayRef = adminDb.collection("r2VideoUsage").doc(`upload-${today}`);
    const studentRef = adminDb.collection("r2VideoUsage").doc(`upload-${student.studentId}-${today}`);
    const key = await adminDb.runTransaction(async tx => {
      const [challengeSnap, submissionSnap, reserveSnap, totalSnap, daySnap, studentSnap] = await Promise.all([
        tx.get(challengeRef), tx.get(submissionRef), tx.get(reservation), tx.get(totalRef), tx.get(dayRef), tx.get(studentRef),
      ]);
      const challenge = challengeSnap.data();
      if (!challengeSnap.exists || !challenge?.active || challenge.challengeId !== challengeId || !challenge.allowedTypes?.includes("video") || (challenge.closesAt instanceof Timestamp && challenge.closesAt.toMillis() < Date.now())) throw new Error("CHALLENGE_UNAVAILABLE");
      if (submissionSnap.exists) throw new Error("ALREADY_SUBMITTED");
      const count = Number(studentSnap.data()?.count || 0);
      if (count >= 3) throw new Error("DAILY_LIMIT");
      const previous = reserveSnap.data();
      if (previous && (previous.size !== size || previous.contentType !== contentType)) throw new Error("RESERVATION_EXISTS");
      const total = Number(totalSnap.data()?.bytes || 0);
      const daily = Number(daySnap.data()?.bytes || 0);
      if (!previous && (total + size > LIFETIME_BYTES || daily + size > DAILY_BYTES)) throw new Error("STORAGE_LIMIT");
      tx.set(studentRef, { count: count + 1 });
      if (!previous) {
        tx.create(reservation, { key: proposedKey, size, contentType, studentId: student.studentId, challengeId, createdAt: Timestamp.now() });
        tx.set(totalRef, { bytes: total + size });
        tx.set(dayRef, { bytes: daily + size });
      }
      return previous?.key || proposedKey;
    });
    return NextResponse.json({ key, uploadUrl: await videoUploadUrl(key, size, contentType) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const messages: Record<string, string> = {
      INVALID_VIDEO: "اختر فيديو MP4 أو WebM أو MOV بحجم لا يتجاوز 20 ميجابايت.",
      R2_NOT_CONFIGURED: "رفع الفيديو غير جاهز بعد. تواصل مع المعلم.",
      DAILY_LIMIT: "بلغت الحد اليومي. حاول غدًا.",
      STORAGE_LIMIT: "توقف رفع الفيديو مؤقتًا لحماية ميزانية الأكاديمية. تواصل مع المعلم.",
      CHALLENGE_UNAVAILABLE: "التحدي غير متاح لاستقبال الفيديو الآن.",
      ALREADY_SUBMITTED: "سبق إرسال مشاركتك.",
      RESERVATION_EXISTS: "أعد المحاولة بالملف السابق؛ سبق حجز رفع لهذه المشاركة.",
    };
    return NextResponse.json({ message: messages[code] || "تعذر الوصول إلى الفيديو." }, {
      status: code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" || code === "MEMBERSHIP_REQUIRED" ? 403 : code === "STORAGE_LIMIT" || code === "DAILY_LIMIT" ? 429 : 400,
    });
  }
}
