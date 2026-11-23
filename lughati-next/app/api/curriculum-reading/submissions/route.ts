import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "private, no-store" };
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: noStore });

function validAudio(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 1100) return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && u.hostname === "res.cloudinary.com" &&
      u.pathname.startsWith("/ffv5igmg/video/upload/") && !u.username && !u.password && !u.hash;
  } catch { return false; }
}

async function studentIdentity(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw Error("UNAUTHORIZED");
  const { adminAuth, adminDb } = getFirebaseAdmin();
  const decoded = await adminAuth.verifyIdToken(header.slice(7));
  if (decoded.role !== "student" || typeof decoded.studentDocId !== "string" ||
      !/^[A-Za-z0-9_-]{1,100}$/.test(decoded.studentDocId)) throw Error("FORBIDDEN");
  return { db: adminDb, id: decoded.studentDocId };
}
async function teacherIdentity(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw Error("UNAUTHORIZED");
  const { adminAuth, adminDb } = getFirebaseAdmin({ allowSuspended: true });
  const decoded = await adminAuth.verifyIdToken(header.slice(7));
  if (decoded.role !== "teacher" && decoded.role !== "admin" &&
      String(decoded.email || "").toLowerCase() !== "a31164949@gmail.com") throw Error("FORBIDDEN");
  return { db: adminDb, uid: decoded.uid };
}
function resultError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500;
  return reply({ success: false, message: status === 500 ? "تعذر معالجة التسجيل." : "غير مصرح بهذا الإجراء." }, status);
}
export async function POST(request: Request) {
  try {
    const actor = await studentIdentity(request);
    const raw = await request.text();
    if (raw.length > 3500) return reply({ success: false, message: "طلب كبير جدًا." }, 413);
    const body = JSON.parse(raw) as Record<string, unknown>;
    if (!validAudio(body.audioUrl) || typeof body.durationSeconds !== "number" ||
        !Number.isInteger(body.durationSeconds) || body.durationSeconds < 1 || body.durationSeconds > 60)
      return reply({ success: false, message: "رابط التسجيل أو مدته غير صالح." }, 400);
    const lesson = await actor.db.doc("curriculumReading/current").get();
    const title = String(lesson.data()?.title || "").slice(0, 90);
    if (!lesson.exists || !lesson.data()?.imageUrl) return reply({ success: false, message: "الدرس غير متاح." }, 409);
    const student = await actor.db.collection("students").doc(actor.id).get();
    if (!student.exists || student.data()?.deleted === true) return reply({ success: false, message: "حساب الطالب غير متاح." }, 403);
    const data = student.data() || {};
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const id = `${actor.id}_${date}`;
    const ref = actor.db.collection("curriculumReadingSubmissions").doc(id);
    const previous = await ref.get();
    if (previous.exists) return reply({ success: false, message: "وصل تسجيلك لهذا اليوم مسبقًا. يمكنك التدريب محليًا دون إعادة الإرسال." }, 409);
    try {
      await ref.create({
        studentId: actor.id,
        studentName: String(data.name || data.studentName || "طالب الأكاديمية").slice(0, 100),
        studentClassroom: String(data.classroom || "").slice(0, 40),
        lessonTitle: title,
        audioUrl: body.audioUrl,
        durationSeconds: body.durationSeconds,
        submittedDate: date,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        source: "curriculum-reading",
      });
    } catch (e) {
      if ((e as {code?: unknown}).code === 6 || String(e).includes("ALREADY_EXISTS"))
        return reply({ success: false, message: "وصل تسجيلك لهذا اليوم مسبقًا." }, 409);
      throw e;
    }
    return reply({ success: true, message: "وصل تسجيلك إلى صفحة المعلم بنجاح ✅" });
  } catch (e) { return resultError(e); }
}
export async function GET(request: Request) {
  try {
    const actor = await teacherIdentity(request);
    const snapshot = await actor.db.collection("curriculumReadingSubmissions")
      .orderBy("createdAt", "desc").limit(40).get();
    const submissions = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        studentName: String(d.studentName || "طالب"),
        studentClassroom: String(d.studentClassroom || ""),
        lessonTitle: String(d.lessonTitle || ""),
        audioUrl: validAudio(d.audioUrl) ? d.audioUrl : "",
        durationSeconds: typeof d.durationSeconds === "number" ? d.durationSeconds : 0,
        submittedDate: String(d.submittedDate || ""),
        status: String(d.status || "pending"),
      };
    });
    return reply({ success: true, submissions });
  } catch (e) { return resultError(e); }
}
