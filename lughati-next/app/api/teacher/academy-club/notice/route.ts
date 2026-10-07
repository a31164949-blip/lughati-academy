import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { noticeIdentity, noticeView, noticeJson, noticeError, isActiveClubStudent, invalidateNotice } from "../../../../lib/clubNotices";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { db } = await noticeIdentity(request, true);
    const url = new URL(request.url), cursor = url.searchParams.get("cursor") || "";
    if (cursor.length > 150 || cursor.includes("/")) throw new Error("INVALID");
    const current = await db.collection("academyClubNotices").doc("current").get();
    const notice = noticeView(current.data());
    if (!notice) return noticeJson({ success: true, notice: null, replies: [], nextCursor: "" });
    let query = db.collection("academyClubNotices").doc(notice.noticeId).collection("replies").orderBy(FieldPath.documentId()).limit(50);
    if (cursor) query = query.startAfter(cursor);
    const replies = await query.get();
    return noticeJson({ success: true, notice, replies: replies.docs.map(doc => ({ id: doc.id, studentName: String(doc.data().studentName || "طالب"), text: String(doc.data().text || "") })), nextCursor: replies.size === 50 ? replies.docs.at(-1)?.id : "" });
  } catch (error) { return noticeError(error); }
}
export async function POST(request: Request) {
  try {
    const { db, uid } = await noticeIdentity(request, true);
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!title || title.length > 120 || !text || text.length > 3000 || typeof body.noticeId !== "string" || !/^[a-f0-9-]{36}$/.test(body.noticeId)) throw new Error("INVALID");
    const ids = await db.runTransaction(async (transaction) => {
      const reference = db.collection("academyClubNotices").doc(body.noticeId);
      const old = await transaction.get(reference);
      if (old.exists) return Array.isArray(old.data()?.recipientIds) ? old.data()!.recipientIds as string[] : []; // Retry invalidates the same member caches without resending alerts.
      const members = await transaction.get(db.collection("students").where("academyClubMembership.active", "==", true).limit(201));
      if (members.size > 200) throw new Error("TOO_MANY");
      const recipients = members.docs.filter(doc => isActiveClubStudent(doc.data()));
      const notice = { noticeId: body.noticeId, title, text, active: true, allowReplies: body.allowReplies !== false, recipientIds: recipients.map(doc => doc.id), createdBy: uid, createdAt: FieldValue.serverTimestamp() };
      transaction.set(reference, notice);
      transaction.set(db.collection("academyClubNotices").doc("current"), notice);
      for (const member of recipients) transaction.set(db.collection("studentNotifications").doc(`club-notice-${body.noticeId}-${member.id}`), { studentId: member.id, type: "clubImportantNotice", title: `📌 تنبيه هام للنادي: ${title}`, message: "رسالة مثبتة من معلمك، افتح النادي للاطلاع والرد.", href: "/academy-club#club-important-notice", read: false, opened: false, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      return recipients.map(doc => doc.id);
    });
    invalidateNotice(ids);
    return noticeJson({ success: true, notifiedMembers: ids.length });
  } catch (error) { return noticeError(error); }
}
export async function PATCH(request: Request) {
  try {
    const { db } = await noticeIdentity(request, true);
    const body = await request.json();
    if (typeof body.noticeId !== "string" || (body.action !== "unpin" && body.action !== "closeReplies")) throw new Error("INVALID");
    await db.runTransaction(async transaction => {
      const reference = db.collection("academyClubNotices").doc("current");
      const current = await transaction.get(reference);
      if (current.data()?.noticeId !== body.noticeId) throw new Error("CLOSED");
      const update = body.action === "unpin" ? { active: false, allowReplies: false } : { allowReplies: false };
      transaction.update(reference, update);
      transaction.update(db.collection("academyClubNotices").doc(body.noticeId), update);
    });
    invalidateNotice();
    return noticeJson({ success: true });
  } catch (error) { return noticeError(error); }
}
