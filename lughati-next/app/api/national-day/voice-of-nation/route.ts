import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { getFirebaseAdmin } from "../../../../firebase-admin";

const START_AT = Date.parse("2026-09-20T00:00:00+03:00");
const END_AT = Date.parse("2026-09-26T23:59:59+03:00");
const COMPETITION_ID = "voice-of-nation-2026";

type Body = {
  studentId?: string;
  studentName?: string;
  classroom?: string;
  grade?: string;
  school?: string;
  title?: string;
  fileUrl?: string;
  cloudinaryPublicId?: string;
  duration?: number;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const now = Date.now();
    if (now < START_AT || now > END_AT) {
      return NextResponse.json({ success: false, message: now < START_AT ? "تفتح المشاركة يوم 20 سبتمبر 2026." : "انتهى وقت استقبال المشاركات." }, { status: 403 });
    }

    const body = (await request.json()) as Body;
    const studentId = text(body.studentId);
    const studentName = text(body.studentName);
    const classroom = text(body.classroom);
    const grade = text(body.grade);
    const school = text(body.school);
    const title = text(body.title);
    const fileUrl = text(body.fileUrl);
    const cloudinaryPublicId = text(body.cloudinaryPublicId);
    const duration = typeof body.duration === "number" ? body.duration : 0;

    if (!studentName || studentName.length < 5) return NextResponse.json({ success: false, message: "اكتب اسم الطالب الثلاثي." }, { status: 400 });
    if (!["الصف الثاني","الصف الثالث","الصف الرابع","الصف الخامس","الصف السادس"].includes(grade)) return NextResponse.json({ success: false, message: "اختر الصف الدراسي الصحيح." }, { status: 400 });
    if (!school || !title) return NextResponse.json({ success: false, message: "أكمل اسم المدرسة وعنوان المشاركة." }, { status: 400 });
    if (!fileUrl || !fileUrl.startsWith("https://res.cloudinary.com/ffv5igmg/")) return NextResponse.json({ success: false, message: "رابط الفيديو غير صالح." }, { status: 400 });
    if (!duration || duration > 60.5) return NextResponse.json({ success: false, message: "يجب ألا تتجاوز مدة الفيديو دقيقة واحدة." }, { status: 400 });

    const { adminDb } = getFirebaseAdmin();
    const participantIdentity = studentId || `${studentName}|${grade}|${school}`.replace(/\s+/g, " ").toLowerCase();
    const participantHash = createHash("sha256").update(participantIdentity).digest("hex").slice(0, 32);
    const documentId = `${COMPETITION_ID}_${participantHash}`;
    const reference = adminDb.collection("nationalDaySubmissions").doc(documentId);
    const existing = await reference.get();
    if (existing.exists && existing.data()?.status !== "revision_requested") return NextResponse.json({ success: false, message: "سبق أن أرسلت مشاركتك في صوت الوطن. المشاركة متاحة مرة واحدة فقط." }, { status: 409 });

    await reference.set({
      competitionId: COMPETITION_ID,
      competitionTitle: "صوت الوطن",
      studentId, studentName, classroom, grade, school, title,
      fileUrl, cloudinaryPublicId, duration,
      status: "pending",
      teacherNote: "",
      approved: false,
      createdAt: existing.exists ? existing.data()?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: false });

    return NextResponse.json({ success: true, id: reference.id, message: "وصلت مشاركتك بنجاح، وهي الآن بانتظار مراجعة المعلم ✅" });
  } catch (error) {
    console.error("VOICE OF NATION SUBMISSION ERROR:", error);
    return NextResponse.json({ success: false, message: "تعذر إرسال المشاركة حاليًا." }, { status: 500 });
  }
}
