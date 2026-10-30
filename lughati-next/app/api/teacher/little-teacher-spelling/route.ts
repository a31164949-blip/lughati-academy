import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";
import { getLittleTeacherLesson } from "../../../lib/littleTeacherLesson";
import { LITTLE_TEACHER_CONFIG_TAG, LITTLE_TEACHER_SETTINGS_ID, littleTeacherLessonTitle, readLittleTeacherLesson } from "../../../lib/littleTeacherSpelling";
export const runtime = "nodejs";
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
async function teacher(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw Error("UNAUTHORIZED");
  const { adminAuth, adminDb } = getFirebaseAdmin({ allowSuspended: true });
  const token = await adminAuth.verifyIdToken(header.slice(7)).catch(() => { throw Error("UNAUTHORIZED"); });
  if (token.role !== "teacher" && token.role !== "admin" && token.email?.toLowerCase() !== "a31164949@gmail.com") throw Error("FORBIDDEN");
  return { adminDb, teacherId: token.uid };
}
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  return json({ success: false, message: code === "CHANGED" ? "غيّر المعلم إعداد الدرس من صفحة أخرى. أعد تحميل الإعداد قبل الحفظ." : code === "INVALID_TITLE" ? "اكتب عنوان الدرس في حدود ٨٠ حرفًا." : code === "UNAUTHORIZED" ? "سجّل دخولك بحساب المعلم." : code === "FORBIDDEN" ? "تغيير عنوان الدرس متاح للمعلم فقط." : "تعذر حفظ إعداد الدرس." }, code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "CHANGED" ? 409 : code === "INVALID_TITLE" || error instanceof SyntaxError ? 400 : 500);
}
export async function GET(request: Request) {
  try { await teacher(request); return json({ success: true, lesson: await getLittleTeacherLesson() }); } catch (error) { return failure(error); }
}
export async function PATCH(request: Request) {
  try {
    const { adminDb, teacherId } = await teacher(request);
    const body = await request.json();
    const title = littleTeacherLessonTitle(body?.title);
    if (typeof body?.revision !== "string") throw Error("CHANGED");
    const ref = adminDb.collection("settings").doc(LITTLE_TEACHER_SETTINGS_ID);
    const lessonId = randomUUID(), revision = randomUUID();
    const lesson = await adminDb.runTransaction(async transaction => {
      const previous = await transaction.get(ref);
      const current = readLittleTeacherLesson(previous.data());
      if (body.revision !== current.revision) throw Error("CHANGED");
      if (title === current.title) return current;
      const next = { title, lessonId, revision };
      transaction.set(ref, { ...next, updatedBy: teacherId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return next;
    });
    revalidateTag(LITTLE_TEACHER_CONFIG_TAG, { expire: 0 });
    return json({ success: true, lesson });
  } catch (error) { return failure(error); }
}
