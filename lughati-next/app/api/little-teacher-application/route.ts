import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";
import { requireStudentExtras } from "../../lib/studentAccess";
import { LITTLE_TEACHER_SETTINGS_ID, LITTLE_TEACHER_APPLICATION_SOURCE, littleTeacherApplicantName, readLittleTeacherLesson } from "../../lib/littleTeacherSpelling";

export const runtime = "nodejs";
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
export async function POST(request: Request) {
  try {
    const header = request.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) return json({ success: false, message: "سجّل دخولك بحساب الطالب أولًا." }, 401);
    const { adminAuth, adminDb } = getFirebaseAdmin();
    const token = await adminAuth.verifyIdToken(header.slice(7)).catch((error: unknown) => {
      if (error instanceof Error && error.message === "FORBIDDEN") throw error;
      throw Error("UNAUTHORIZED");
    });
    if (token.role !== "student" || typeof token.studentDocId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(token.studentDocId)) throw Error("FORBIDDEN");
    const body = await request.json();
    const name = littleTeacherApplicantName(body?.name);
    const lessonId = body?.lessonId ?? "alam-biladi";
    if (typeof lessonId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(lessonId)) throw Error("LESSON_CHANGED");
    const studentId = token.studentDocId;
    const student = await adminDb.collection("students").doc(studentId).get();
    const profile = student.data();
    if (!profile || profile.deleted === true || profile.archived === true) throw Error("FORBIDDEN");
    await requireStudentExtras(studentId, profile);
    const id = "little-teacher-application-" + createHash("sha256").update(lessonId + ":" + studentId).digest("hex");
    const ref = adminDb.collection("studentTeacherMessages").doc(id);
    const lessonRef = adminDb.collection("settings").doc(LITTLE_TEACHER_SETTINGS_ID);
    const result = await adminDb.runTransaction(async transaction => {
      const [previous, settings] = await Promise.all([transaction.get(ref), transaction.get(lessonRef)]);
      const lesson = readLittleTeacherLesson(settings.data());
      if (lessonId !== lesson.lessonId) throw Error("LESSON_CHANGED");
      if (previous.exists) {
        const saved = previous.data();
        if (saved?.studentId !== studentId || saved?.source !== LITTLE_TEACHER_APPLICATION_SOURCE || typeof saved?.applicantName !== "string") throw Error("CONFLICT");
        return { name: saved.applicantName as string, alreadySubmitted: true };
      }
      transaction.create(ref, {
        studentId,
        studentName: typeof profile.studentName === "string" ? profile.studentName : typeof profile.name === "string" ? profile.name : "طالب الأكاديمية",
        classroom: typeof profile.classroom === "string" ? profile.classroom : "",
        category: "lesson",
        categoryLabel: `🧑‍🏫 طلب ترشّح للمعلم الصغير — ${lesson.title}`,
        source: LITTLE_TEACHER_APPLICATION_SOURCE,
        lesson: lesson.title,
        lessonId: lesson.lessonId,
        applicantName: name,
        message: `أرغب أن أكون معلّمًا داخل الفصل في درس «${lesson.title}».\nاسمي: ${name}\nسأختار كلمات الإملاء، وأقرأها في مقطع فيديو لزملائي، وأملي الطلاب خلال الحصة، وأشارك في التصحيح بمساعدة معلمي. أنتظر ترشيحك.`,
        teacherReply: "", status: "new", studentViewedReply: false,
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      return { name, alreadySubmitted: false };
    });
    return json({ success: true, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const forbidden = code === "FORBIDDEN";
    const unauthorized = code === "UNAUTHORIZED";
    const invalid = code === "INVALID_NAME" || error instanceof SyntaxError;
    return json({ success: false, message: code === "LESSON_CHANGED" ? "غيّر معلمك عنوان الدرس. حدّث الصفحة ثم سجّل رغبتك للدرس الجديد." : unauthorized ? "سجّل دخولك بحساب الطالب أولًا." : forbidden ? "الترشّح متاح للطالب الذي يملك صلاحية المشاركة في الأكاديمية." : invalid ? "اكتب اسمك في حدود ٨٠ حرفًا." : "تعذر إرسال رغبتك. حاول مرة أخرى." }, unauthorized ? 401 : forbidden ? 403 : invalid ? 400 : code === "CONFLICT" || code === "LESSON_CHANGED" ? 409 : 500);
  }
}
