import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { noticeIdentity, noticeJson, noticeError, readCurrentNotice } from "../../../lib/clubNotices";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { db, studentId, preview } = await noticeIdentity(request);
    const notice = await readCurrentNotice();
    if (!notice?.active) return noticeJson({ success: true, notice: null, reply: null });
    const reply = preview ? null : await db.collection("academyClubNotices").doc(notice.noticeId).collection("replies").doc(studentId).get();
    return noticeJson({ success: true, notice, reply: reply?.exists ? { text: String(reply.data()?.text || "") } : null });
  } catch (error) { return noticeError(error); }
}
export async function POST(request: Request) {
  try {
    const { db, studentId, studentName, preview } = await noticeIdentity(request);
    if (preview) throw new Error("FORBIDDEN");
    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text || text.length > 1000 || typeof body.noticeId !== "string" || !/^[a-f0-9-]{36}$/.test(body.noticeId)) throw new Error("INVALID");
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(db.collection("academyClubNotices").doc("current"));
      const data = current.data();
      if (!data?.active || !data.allowReplies || data.noticeId !== body.noticeId) throw new Error("CLOSED");
      const reference = db.collection("academyClubNotices").doc(body.noticeId).collection("replies").doc(studentId);
      const previous = await transaction.get(reference);
      if (previous.data()?.text === text) return;
      const updatedAt = previous.data()?.updatedAt;
      if (updatedAt instanceof Timestamp && Date.now() - updatedAt.toMillis() < 10000) throw new Error("TOO_FAST");
      transaction.set(reference, { studentId, studentName, text, updatedAt: FieldValue.serverTimestamp(), createdAt: previous.data()?.createdAt ?? FieldValue.serverTimestamp() });
    });
    return noticeJson({ success: true });
  } catch (error) { return noticeError(error); }
}
