import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";

const ACTIVE_LESSON_ID = "active-live-lesson";

async function requireStudent(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth } = getFirebaseAdmin();
  const token = await adminAuth.verifyIdToken(authorization.slice(7));
  if (token.role !== "student") throw new Error("FORBIDDEN");
  const studentDocId = typeof token.studentDocId === "string" ? token.studentDocId.trim() : "";
  if (!studentDocId) throw new Error("STUDENT_NOT_FOUND");
  return studentDocId;
}

export async function POST(request: Request) {
  try {
    const studentDocId = await requireStudent(request);
    const { adminDb } = getFirebaseAdmin();
    const lessonSnapshot = await adminDb.collection("liveLessons").doc(ACTIVE_LESSON_ID).get();
    if (!lessonSnapshot.exists) throw new Error("LESSON_CLOSED");

    const lesson = lessonSnapshot.data() ?? {};
    const lessonVersion = typeof lesson.lessonVersion === "string" ? lesson.lessonVersion : "";
    const meetingUrl = typeof lesson.meetingUrl === "string" ? lesson.meetingUrl : "";
    const targetClassroom = typeof lesson.targetClassroom === "string" ? lesson.targetClassroom.trim().replace(/\s+/g, " ") : "الجميع";
    const startTime = new Date(typeof lesson.startAt === "string" ? lesson.startAt : "").getTime();
    const endTime = new Date(typeof lesson.endAt === "string" ? lesson.endAt : "").getTime();
    const now = Date.now();

    if (lesson.active !== true || !lessonVersion || !meetingUrl || !Number.isFinite(startTime) || !Number.isFinite(endTime) || now > endTime) {
      throw new Error("LESSON_CLOSED");
    }

    /* يسمح بالدخول قبل البداية بعشر دقائق فقط. */
    if (now < startTime - 10 * 60 * 1000) throw new Error("LESSON_NOT_OPEN");

    const studentSnapshot = await adminDb.collection("students").doc(studentDocId).get();
    if (!studentSnapshot.exists) throw new Error("STUDENT_NOT_FOUND");
    const student = studentSnapshot.data() ?? {};
    const classroom = typeof student.classroom === "string" ? student.classroom.trim().replace(/\s+/g, " ") : "";

    if (targetClassroom !== "الجميع" && classroom !== targetClassroom) {
      throw new Error("CLASSROOM_MISMATCH");
    }

    const studentName = typeof student.studentName === "string" && student.studentName.trim() ? student.studentName.trim() : "طالب";
    const safeVersion = lessonVersion.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeStudent = studentDocId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const attendanceRef = adminDb.collection("liveLessonAttendance").doc(`${safeVersion}__${safeStudent}`);

    await attendanceRef.set(
      {
        lessonId: ACTIVE_LESSON_ID,
        lessonVersion,
        lessonTitle: typeof lesson.title === "string" ? lesson.title : "درس مباشر",
        studentId: studentDocId,
        studentName,
        classroom,
        joinedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, meetingUrl, message: "تم تسجيل حضورك، نراك في الدرس 🌟" });
  } catch (error) {
    console.error("Live lesson attendance POST error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED") return NextResponse.json({ success: false, message: "يجب تسجيل الدخول أولًا." }, { status: 401 });
    if (message === "FORBIDDEN") return NextResponse.json({ success: false, message: "هذا المسار مخصص للطلاب." }, { status: 403 });
    if (message === "STUDENT_NOT_FOUND") return NextResponse.json({ success: false, message: "تعذر تحديد الطالب." }, { status: 404 });
    if (message === "LESSON_NOT_OPEN") return NextResponse.json({ success: false, message: "يفتح الانضمام قبل بداية الدرس بعشر دقائق." }, { status: 403 });
    if (message === "CLASSROOM_MISMATCH") return NextResponse.json({ success: false, message: "هذا الدرس غير مخصص لفصلك." }, { status: 403 });
    if (message === "LESSON_CLOSED") return NextResponse.json({ success: false, message: "انتهى الدرس أو تم إغلاقه." }, { status: 410 });
    return NextResponse.json({ success: false, message: "تعذر تسجيل الحضور حاليًا." }, { status: 500 });
  }
}
