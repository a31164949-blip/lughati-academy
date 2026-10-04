import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { getFirebaseAdmin } from "../../firebase-admin";
import { MAX_VIDEO_BYTES, VIDEO_TYPES, videoUploadUrl, verifyVideoObject } from "./r2Video";
import { getStudentSubmissionWindow } from "./studentSubmissionWindow";

export type VideoPurpose = "stories" | "works";
export async function mediaActor(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth, adminDb } = getFirebaseAdmin();
  const token = await adminAuth.verifyIdToken(header.slice(7));
  const teacher = token.role === "teacher" || token.role === "admin" || token.email?.toLowerCase() === "a31164949@gmail.com";
  const studentId = typeof token.studentDocId === "string" ? token.studentDocId : "";
  if (!teacher && (token.role !== "student" || !studentId)) throw new Error("FORBIDDEN");
  if (!teacher) {
    const student = await adminDb.collection("students").doc(studentId).get();
    if (!student.exists || student.data()?.active === false) throw new Error("FORBIDDEN");
  }
  return { uid: token.uid, teacher, studentId: teacher ? "" : studentId };
}

export async function reserveMediaVideo(request: Request, body: Record<string, unknown>) {
  const actor = await mediaActor(request);
  const purpose = body.purpose as VideoPurpose;
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  const contentType = typeof body.contentType === "string" ? body.contentType : "";
  const size = Number(body.size);
  if (!["stories", "works"].includes(purpose) || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId) || !VIDEO_TYPES[contentType] || !Number.isSafeInteger(size) || size < 1 || size > MAX_VIDEO_BYTES) throw new Error("INVALID_VIDEO");
  if (purpose === "works" && (actor.teacher || !getStudentSubmissionWindow().isOpen)) throw new Error("SUBMISSION_CLOSED");
  const { adminDb } = getFirebaseAdmin();
  if (purpose === "stories" && !actor.teacher) {
    const pending = await adminDb.collection("academyStories").where("studentId", "==", actor.studentId).limit(10).get();
    if (pending.docs.some(doc => doc.data().status === "pending")) throw new Error("PENDING_STORY");
  }
  const proposedKey = `media/${randomUUID()}.${VIDEO_TYPES[contentType]}`;
  await videoUploadUrl(proposedKey, size, contentType);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
  const reservation = adminDb.collection("r2MediaReservations").doc(`${actor.uid}-${requestId}`);
  const total = adminDb.collection("r2VideoUsage").doc("storage");
  const day = adminDb.collection("r2VideoUsage").doc(`upload-${today}`);
  const person = adminDb.collection("r2VideoUsage").doc(`media-upload-${actor.uid}-${today}`);
  const data = await adminDb.runTransaction(async tx => {
    const [old, all, daily, user] = await Promise.all([tx.get(reservation), tx.get(total), tx.get(day), tx.get(person)]);
    const previous = old.data();
    const count = Number(user.data()?.count || 0);
    if (count >= (actor.teacher ? 10 : 3)) throw new Error("DAILY_LIMIT");
    if (previous && (previous.purpose !== purpose || previous.size !== size || previous.contentType !== contentType)) throw new Error("INVALID_VIDEO");
    const bytes = Number(all.data()?.bytes || 0), dailyBytes = Number(daily.data()?.bytes || 0);
    if (!previous && (bytes + size > 8 * 1024 ** 3 || dailyBytes + size > 200 * 1024 ** 2)) throw new Error("STORAGE_LIMIT");
    tx.set(person, { count: count + 1 });
    const next = previous || { key: proposedKey, size, contentType, purpose, uid: actor.uid, studentId: actor.studentId, createdAt: Timestamp.now() };
    if (!previous) {
      tx.create(reservation, next);
      tx.set(total, { bytes: bytes + size });
      tx.set(day, { bytes: dailyBytes + size });
    }
    return next;
  });
  return { reservationId: reservation.id, uploadUrl: await videoUploadUrl(data.key, size, contentType) };
}

export async function verifyMediaVideo(request: Request, reservationId: string, purpose: VideoPurpose) {
  const actor = await mediaActor(request);
  if (!/^[a-zA-Z0-9_-]{10,210}$/.test(reservationId)) throw new Error("INVALID_VIDEO");
  const { adminDb } = getFirebaseAdmin();
  const ref = adminDb.collection("r2MediaReservations").doc(reservationId);
  const data = await adminDb.runTransaction(async tx => {
    const snapshot = await tx.get(ref), data = snapshot.data();
    if (!data || data.uid !== actor.uid || data.purpose !== purpose || Number(data.verificationAttempts || 0) >= 5) throw new Error("INVALID_VIDEO");
    tx.update(ref, { verificationAttempts: Number(data.verificationAttempts || 0) + 1 });
    return data;
  });
  await verifyVideoObject(data.key, data.size, data.contentType);
  return { key: String(data.key), id: reservationId, url: `/api/media/video?purpose=${purpose}&id=${encodeURIComponent(reservationId)}` };
}
