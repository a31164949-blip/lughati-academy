import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";
import { requireStudentExtras } from "../../lib/studentAccess";
import { LITTLE_TEACHER_LESSON, LITTLE_TEACHER_SOURCE, littleTeacherWord } from "../../lib/littleTeacherSpelling";

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
    const word = littleTeacherWord(body?.word);
    const studentId = token.studentDocId;
    const student = await adminDb.collection("students").doc(studentId).get();
    const profile = student.data();
    if (!profile || profile.deleted === true || profile.archived === true) throw Error("FORBIDDEN");
    await requireStudentExtras(studentId, profile);
    const id = "little-teacher-" + createHash("sha256").update("alam-biladi:" + studentId).digest("hex");
    const ref = adminDb.collection("studentTeacherMessages").doc(id);
    const result = await adminDb.runTransaction(async transaction => {
      const previous = await transaction.get(ref);
      if (previous.exists) {
        const saved = previous.data();
        if (saved?.studentId !== studentId || saved?.source !== LITTLE_TEACHER_SOURCE || typeof saved?.proposedWord !== "string") throw Error("CONFLICT");
        return { word: saved.proposedWord as string, alreadySubmitted: true };
      }
      transaction.create(ref, {
        studentId,
        studentName: typeof profile.studentName === "string" ? profile.studentName : typeof profile.name === "string" ? profile.name : "طالب الأكاديمية",
        classroom: typeof profile.classroom === "string" ? profile.classroom : "",
        category: "lesson",
        categoryLabel: "🧑‍🏫 المعلم الصغير — علم بلادي",
        source: LITTLE_TEACHER_SOURCE,
        lesson: LITTLE_TEACHER_LESSON,
        proposedWord: word,
        message: `أقترح كلمة «${word}» للإملاء من درس «${LITTLE_TEACHER_LESSON}».`,
        teacherReply: "", status: "new", studentViewedReply: false,
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      return { word, alreadySubmitted: false };
    });
    return json({ success: true, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const forbidden = code === "FORBIDDEN";
    const unauthorized = code === "UNAUTHORIZED";
    const invalid = code === "INVALID_WORD" || error instanceof SyntaxError;
    return json({ success: false, message: unauthorized ? "سجّل دخولك بحساب الطالب أولًا." : forbidden ? "الاقتراح متاح للطالب الذي يملك صلاحية المشاركة في الأكاديمية." : invalid ? "اكتب كلمة عربية واحدة فقط من الدرس، في حدود ٤٠ حرفًا مع التشكيل." : "تعذر إرسال اقتراحك. حاول مرة أخرى." }, unauthorized ? 401 : forbidden ? 403 : invalid ? 400 : code === "CONFLICT" ? 409 : 500);
  }
}
