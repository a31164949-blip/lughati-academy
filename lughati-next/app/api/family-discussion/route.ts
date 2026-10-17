import { FAMILY_DISCUSSION_TOPIC_MAX_LENGTH } from "../../lib/familyDiscussionPolicy";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";
import { requireStudentExtras } from "../../lib/studentAccess";
export const runtime = "nodejs";

async function identity(req: Request) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth, adminDb: db } = getFirebaseAdmin();
  const token = await adminAuth.verifyIdToken(header.slice(7));
  const teacher = token.role === "teacher" || token.role === "admin" || token.email?.toLowerCase() === "a31164949@gmail.com";
  if (teacher) return { db, teacher, id: token.uid, name: "المعلم" };
  if (token.role !== "student" || typeof token.studentDocId !== "string") throw new Error("FORBIDDEN");
  const student = await db.collection("students").doc(token.studentDocId).get();
  await requireStudentExtras(token.studentDocId, student.data());
  return { db, teacher: false, id: token.studentDocId, name: String(student.data()?.name ?? student.data()?.studentName ?? "طالب") };
}
function json(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } }); }
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "INVALID" || code === "TOPIC_TOO_LONG" || code === "CLOSED" ? 400 : 500;
  return json({ success: false, message: code === "TOPIC_TOO_LONG" ? `يمكن أن يصل موضوع الحوار إلى ${FAMILY_DISCUSSION_TOPIC_MAX_LENGTH} حرف. اختصر النص ثم حاول مجددًا.` : code === "CLOSED" ? "تغير الموضوع أو أُغلقت المشاركة. حدّث الصفحة." : status === 400 ? "تحقق من الموضوع والمشاركة (حتى 800 حرف)." : "تعذر إتمام الطلب. حاول مرة أخرى." }, status);
}
const validId = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(v);
export async function GET(req: Request) {
  try {
    const { db, teacher, id } = await identity(req);
    const topic = (await db.collection("familyDiscussion").doc("current").get()).data();
    if (!topic) return json({ success: true, topic: null, replies: [], mine: null });
    const collection = db.collection("familyDiscussion").doc(topic.topicId).collection("replies");
    const cursor = new URL(req.url).searchParams.get("cursor");
    if (cursor && !validId(cursor)) throw new Error("INVALID");
    let query = (teacher ? collection : collection.where("status", "==", "published")).orderBy(FieldPath.documentId()).limit(10);
    if (cursor) query = query.startAfter(cursor);
    const [rows, own] = await Promise.all([query.get(), teacher ? Promise.resolve(null) : collection.doc(id).get()]);
    const replies = rows.docs.map(row => {
      const d = row.data();
      return { id: row.id, text: d.text, status: d.status, visibility: d.visibility, name: teacher ? d.name : "مشاركة إحدى الأسر", teacherReply: typeof d.teacherReply === "string" ? d.teacherReply : "", revision: teacher ? d.revision : undefined };
    });
    const mine = own?.data();
    return json({ success: true, topic: { topicId: topic.topicId, title: topic.title, active: topic.active === true }, replies, mine: mine ? { text: mine.text, visibility: mine.visibility, status: mine.status, teacherReply: typeof mine.teacherReply === "string" ? mine.teacherReply : "" } : null, cursor: rows.size === 10 ? rows.docs[9].id : null });
  } catch (error) { return failure(error); }
}
export async function POST(req: Request) {
  try {
    const { db, teacher, id, name } = await identity(req);
    const body = await req.json();
    if (teacher) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) throw new Error("INVALID");
      if (title.length > FAMILY_DISCUSSION_TOPIC_MAX_LENGTH) throw new Error("TOPIC_TOO_LONG");
      const topicId = randomUUID();
      const value = { topicId, title, active: true, createdAt: FieldValue.serverTimestamp(), createdBy: id };
      const batch = db.batch();
      batch.set(db.collection("familyDiscussion").doc("current"), value);
      batch.set(db.collection("familyDiscussion").doc(topicId), value);
      await batch.commit();
    } else {
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text || text.length > 800 || !validId(body.topicId) || !["private", "public"].includes(body.visibility)) throw new Error("INVALID");
      await db.runTransaction(async tx => {
        const current = await tx.get(db.collection("familyDiscussion").doc("current"));
        if (!current.data()?.active || current.data()?.topicId !== body.topicId) throw new Error("CLOSED");
        const ref = db.collection("familyDiscussion").doc(body.topicId).collection("replies").doc(id);
        tx.set(ref, { revision: randomUUID(), text, visibility: body.visibility, status: body.visibility === "public" ? "pending" : "private", name, studentId: id, updatedAt: FieldValue.serverTimestamp() });
      });
    }
    return json({ success: true });
  } catch (error) { return failure(error); }
}
export async function PATCH(req: Request) {
  try {
    const { db, teacher } = await identity(req);
    if (!teacher) throw new Error("FORBIDDEN");
    const body = await req.json();
    if (!validId(body.topicId)) throw new Error("INVALID");
    await db.runTransaction(async tx => {
      const currentRef = db.collection("familyDiscussion").doc("current");
      const current = await tx.get(currentRef);
      if (current.data()?.topicId !== body.topicId) throw new Error("CLOSED");
      if (typeof body.active === "boolean") { tx.update(currentRef, { active: body.active }); return; }
      if (!validId(body.replyId) || !["publish", "hide", "respond"].includes(body.action)) throw new Error("INVALID");
      const ref = db.collection("familyDiscussion").doc(body.topicId).collection("replies").doc(body.replyId);
      const reply = await tx.get(ref);
      if (!reply.exists || reply.data()?.revision !== body.revision || (body.action === "publish" && reply.data()?.visibility !== "public")) throw new Error("INVALID");
      if (body.action === "respond") {
        const teacherReply = typeof body.teacherReply === "string" ? body.teacherReply.trim() : "";
        if (!teacherReply || teacherReply.length > 1500) throw new Error("INVALID");
        tx.update(ref, { teacherReply, teacherRepliedAt: FieldValue.serverTimestamp() });
        return;
      }
      tx.update(ref, { status: body.action === "publish" ? "published" : "hidden", reviewedAt: FieldValue.serverTimestamp() });
    });
    return json({ success: true });
  } catch (error) { return failure(error); }
}
