import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

const TEACHER_EMAIL = "a31164949@gmail.com";
const ACTIVE_LESSON_ID = "active-live-lesson";

type Payload = {
  action?: "create" | "close";
  title?: string;
  description?: string;
  meetingUrl?: string;
  targetClassroom?: string;
  startAt?: string;
  durationMinutes?: number;
};

async function requireTeacher(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");

  const { adminAuth } = getFirebaseAdmin();
  const token = await adminAuth.verifyIdToken(authorization.slice(7));
  const email = typeof token.email === "string" ? token.email.trim().toLowerCase() : "";
  const role = typeof token.role === "string" ? token.role : "";

  if (role !== "teacher" && email !== TEACHER_EMAIL.toLowerCase()) {
    throw new Error("FORBIDDEN");
  }

  return { uid: token.uid, email };
}

function toIso(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : null;
}

function serializeLesson(id: string, data: Record<string, unknown>) {
  return {
    id,
    title: typeof data.title === "string" ? data.title : "درس مباشر",
    description: typeof data.description === "string" ? data.description : "",
    meetingUrl: typeof data.meetingUrl === "string" ? data.meetingUrl : "",
    targetClassroom: typeof data.targetClassroom === "string" ? data.targetClassroom : "الجميع",
    startAt: typeof data.startAt === "string" ? data.startAt : "",
    endAt: typeof data.endAt === "string" ? data.endAt : "",
    durationMinutes: typeof data.durationMinutes === "number" ? data.durationMinutes : 30,
    active: data.active === true,
    createdAt: toIso(data.createdAt),
  };
}

export async function GET(request: Request) {
  try {
    await requireTeacher(request);
    const { adminDb } = getFirebaseAdmin();
    const lessonSnapshot = await adminDb.collection("liveLessons").doc(ACTIVE_LESSON_ID).get();

    if (!lessonSnapshot.exists) {
      return NextResponse.json(
        { success: true, lesson: null, attendance: [] },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const lessonData = lessonSnapshot.data() ?? {};
    const lessonVersion = typeof lessonData.lessonVersion === "string" ? lessonData.lessonVersion : "";
    let attendance: Array<{ id: string; studentName: string; classroom: string; joinedAt: string | null }> = [];

    if (lessonData.active === true && lessonVersion) {
      const attendanceSnapshot = await adminDb
        .collection("liveLessonAttendance")
        .where("lessonVersion", "==", lessonVersion)
        .limit(200)
        .get();

      attendance = attendanceSnapshot.docs
        .map((document) => {
          const data = document.data() ?? {};
          return {
            id: document.id,
            studentName: typeof data.studentName === "string" ? data.studentName : "طالب",
            classroom: typeof data.classroom === "string" ? data.classroom : "",
            joinedAt: toIso(data.joinedAt),
          };
        })
        .sort((a, b) => (a.joinedAt ?? "").localeCompare(b.joinedAt ?? ""));
    }

    return NextResponse.json(
      { success: true, lesson: serializeLesson(lessonSnapshot.id, lessonData), attendance },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const teacher = await requireTeacher(request);
    const payload = (await request.json()) as Payload;
    const { adminDb } = getFirebaseAdmin();
    const lessonRef = adminDb.collection("liveLessons").doc(ACTIVE_LESSON_ID);

    if (payload.action === "close") {
      const snapshot = await lessonRef.get();
      if (!snapshot.exists) {
        return NextResponse.json({ success: false, message: "لا يوجد درس مباشر لإنهائه." }, { status: 404 });
      }
      await lessonRef.update({
        active: false,
        closedAt: FieldValue.serverTimestamp(),
        closedBy: teacher.uid,
      });
      return NextResponse.json({ success: true, message: "تم إنهاء الدرس المباشر." });
    }

    if (payload.action !== "create") {
      return NextResponse.json({ success: false, message: "الإجراء غير صحيح." }, { status: 400 });
    }

    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const description = typeof payload.description === "string" ? payload.description.trim() : "";
    const meetingUrl = typeof payload.meetingUrl === "string" ? payload.meetingUrl.trim() : "";
    const targetClassroom = typeof payload.targetClassroom === "string" && payload.targetClassroom.trim() ? payload.targetClassroom.trim() : "الجميع";
    const startAt = typeof payload.startAt === "string" ? payload.startAt : "";
    const durationMinutes = typeof payload.durationMinutes === "number" ? payload.durationMinutes : Number.NaN;

    if (!title) return NextResponse.json({ success: false, message: "اكتب عنوان الدرس." }, { status: 400 });

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(meetingUrl);
    } catch {
      return NextResponse.json({ success: false, message: "رابط الدرس غير صحيح." }, { status: 400 });
    }
    if (parsedUrl.protocol !== "https:") {
      return NextResponse.json({ success: false, message: "يجب أن يبدأ رابط الدرس بـ https." }, { status: 400 });
    }

    const startTime = new Date(startAt).getTime();
    if (!Number.isFinite(startTime)) {
      return NextResponse.json({ success: false, message: "موعد بداية الدرس غير صحيح." }, { status: 400 });
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 180) {
      return NextResponse.json({ success: false, message: "مدة الدرس يجب أن تكون من 5 إلى 180 دقيقة." }, { status: 400 });
    }

    const lessonVersion = `${Date.now()}-${teacher.uid.slice(0, 8)}`;
    const endAt = new Date(startTime + durationMinutes * 60 * 1000).toISOString();

    await lessonRef.set(
      {
        title,
        description,
        meetingUrl: parsedUrl.toString(),
        targetClassroom,
        startAt: new Date(startTime).toISOString(),
        endAt,
        durationMinutes,
        lessonVersion,
        active: true,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: teacher.uid,
        createdByEmail: teacher.email,
        closedAt: null,
      },
      { merge: false }
    );

    return NextResponse.json({ success: true, message: "تم نشر الدرس المباشر.", lessonVersion });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  console.error("Teacher live lesson API error:", error);
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHORIZED") {
    return NextResponse.json({ success: false, message: "يجب تسجيل الدخول بحساب المعلم." }, { status: 401 });
  }
  if (message === "FORBIDDEN") {
    return NextResponse.json({ success: false, message: "هذا الحساب غير مخول بإدارة الدروس المباشرة." }, { status: 403 });
  }
  return NextResponse.json({ success: false, message: "تعذر تنفيذ العملية حاليًا." }, { status: 500 });
}
