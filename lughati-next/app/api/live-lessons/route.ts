import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { getFirebaseAdmin } from "../../../firebase-admin";

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

const getCachedLesson = unstable_cache(
  async () => {
    const { adminDb } = getFirebaseAdmin();
    const snapshot = await adminDb.collection("liveLessons").doc(ACTIVE_LESSON_ID).get();
    if (!snapshot.exists) return null;
    const data = snapshot.data() ?? {};
    if (data.active !== true) return null;

    const startAt = typeof data.startAt === "string" ? data.startAt : "";
    const endAt = typeof data.endAt === "string" ? data.endAt : "";
    const startTime = new Date(startAt).getTime();
    const endTime = new Date(endAt).getTime();
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return null;

    /* تظهر البطاقة قبل الموعد بـ24 ساعة وتختفي بعد نهاية الدرس. */
    const now = Date.now();
    if (now < startTime - 24 * 60 * 60 * 1000 || now > endTime) return null;

    return {
      id: snapshot.id,
      title: typeof data.title === "string" ? data.title : "درس مباشر",
      description: typeof data.description === "string" ? data.description : "",
      targetClassroom: typeof data.targetClassroom === "string" ? data.targetClassroom.trim() : "الجميع",
      targetStudentDocId: typeof data.targetStudentDocId === "string" ? data.targetStudentDocId.trim() : "",
      targetStudentName: typeof data.targetStudentName === "string" ? data.targetStudentName.trim() : "",
      startAt,
      endAt,
      durationMinutes: typeof data.durationMinutes === "number" ? data.durationMinutes : 30,
      lessonVersion: typeof data.lessonVersion === "string" ? data.lessonVersion : snapshot.id,
    };
  },
  ["active-live-lesson-student-v3"],
  { revalidate: 20 }
);

async function getStudentAccess(studentDocId: string) {
  const { adminDb } = getFirebaseAdmin();
  const snapshot = await adminDb.collection("students").doc(studentDocId).get();
  if (!snapshot.exists) throw new Error("STUDENT_NOT_FOUND");

  const data = snapshot.data() ?? {};
  const membership =
    data.academyClubMembership &&
    typeof data.academyClubMembership === "object"
      ? (data.academyClubMembership as Record<string, unknown>)
      : {};

  const expiresAtValue = membership.expiresAt;
  const expiresAt =
    expiresAtValue &&
    typeof expiresAtValue === "object" &&
    "toDate" in expiresAtValue &&
    typeof (expiresAtValue as { toDate?: unknown }).toDate === "function"
      ? (expiresAtValue as { toDate: () => Date }).toDate().getTime()
      : Number.POSITIVE_INFINITY;

  return {
    classroom:
      typeof data.classroom === "string"
        ? data.classroom.trim().replace(/\s+/g, " ")
        : "",
    isAcademyClubMember:
      membership.active === true && expiresAt > Date.now(),
  };
}

export async function GET(request: Request) {
  try {
    const studentDocId = await requireStudent(request);
    const lesson = await getCachedLesson();
    if (!lesson) {
      return NextResponse.json({ success: true, lesson: null }, { headers: { "Cache-Control": "private, no-store" } });
    }

    if (lesson.targetStudentDocId && lesson.targetStudentDocId !== studentDocId) {
      return NextResponse.json({ success: true, lesson: null }, { headers: { "Cache-Control": "private, no-store" } });
    }

    if (!lesson.targetStudentDocId && lesson.targetClassroom && lesson.targetClassroom !== "الجميع") {
      const access = await getStudentAccess(studentDocId);

      if (
        lesson.targetClassroom === "أعضاء نادي الأكاديمية" &&
        !access.isAcademyClubMember
      ) {
        return NextResponse.json({ success: true, lesson: null }, { headers: { "Cache-Control": "private, no-store" } });
      }

      if (
        lesson.targetClassroom !== "أعضاء نادي الأكاديمية" &&
        access.classroom !== lesson.targetClassroom.replace(/\s+/g, " ")
      ) {
        return NextResponse.json({ success: true, lesson: null }, { headers: { "Cache-Control": "private, no-store" } });
      }
    }

    return NextResponse.json({ success: true, lesson }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Student live lesson GET error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED") return NextResponse.json({ success: false, message: "يجب تسجيل الدخول أولًا." }, { status: 401 });
    if (message === "FORBIDDEN") return NextResponse.json({ success: false, message: "هذا المسار مخصص للطلاب." }, { status: 403 });
    if (message === "STUDENT_NOT_FOUND") return NextResponse.json({ success: false, message: "تعذر تحديد الطالب." }, { status: 404 });
    return NextResponse.json({ success: false, message: "تعذر تحميل الدرس المباشر." }, { status: 500 });
  }
}
