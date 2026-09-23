import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

function validCloudinaryUrl(value: string, type: "image" | "video") {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.startsWith(`/ffv5igmg/${type}/upload/`)
    );
  } catch {
    return false;
  }
}

async function getStudent(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth, adminDb } = getFirebaseAdmin();
  const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
  if (decoded.role !== "student") throw new Error("FORBIDDEN");
  const studentId = typeof decoded.studentDocId === "string" ? decoded.studentDocId : "";
  if (!studentId) throw new Error("STUDENT_NOT_FOUND");
  const snapshot = await adminDb.collection("students").doc(studentId).get();
  if (!snapshot.exists) throw new Error("STUDENT_NOT_FOUND");
  return { studentId, data: snapshot.data() ?? {} };
}

function millis(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as {toMillis?: unknown}).toMillis === "function") {
    return (value as {toMillis: () => number}).toMillis();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export async function GET(request: Request) {
  try {
    const { adminAuth, adminDb } = getFirebaseAdmin();
    let studentId = "";
    const authorization = request.headers.get("authorization");

    if (authorization?.startsWith("Bearer ")) {
      try {
        const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
        if (decoded.role === "student" && typeof decoded.studentDocId === "string") {
          studentId = decoded.studentDocId;
        }
      } catch {
        // عرض الحالات المعتمدة عام، وتعطل الرمز لا يمنع مشاهدة النبض.
      }
    }

    const approvedSnapshot = await adminDb
      .collection("academyStories")
      .where("status", "==", "approved")
      .limit(60)
      .get();
    const ownSnapshot = studentId
      ? await adminDb.collection("academyStories").where("studentId", "==", studentId).limit(10).get()
      : null;

    const now = Date.now();
    const stories = approvedSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((story) => millis((story as {expiresAt?: unknown}).expiresAt) > now)
      .sort((a, b) => millis((a as {approvedAt?: unknown}).approvedAt) - millis((b as {approvedAt?: unknown}).approvedAt))
      .map((story) => {
        const item = story as Record<string, unknown>;
        return {
          id: String(item.id),
          mediaType: item.mediaType === "video" ? "video" : "image",
          mediaUrl: typeof item.mediaUrl === "string" ? item.mediaUrl : "",
          caption: typeof item.caption === "string" ? item.caption : "",
          authorLabel: item.authorType === "teacher" ? "الأكاديمية" : "بطل الأكاديمية",
          approvedAt: millis(item.approvedAt),
          expiresAt: millis(item.expiresAt),
        };
      });

    const ownPending = ownSnapshot
      ? ownSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((story) => (story as {status?: unknown}).status === "pending")
          .sort((a, b) => millis((b as {createdAt?: unknown}).createdAt) - millis((a as {createdAt?: unknown}).createdAt))[0] ?? null
      : null;

    return NextResponse.json({
      success: true,
      stories,
      ownPending: ownPending ? { id: ownPending.id, status: "pending" } : null,
    });
  } catch {
    return NextResponse.json({ success: false, message: "تعذر تحميل نبض الأكاديمية." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { studentId, data } = await getStudent(request);
    const body = await request.json();
    const mediaType = body?.mediaType === "video" ? "video" : "image";
    const mediaUrl = typeof body?.mediaUrl === "string" ? body.mediaUrl.trim() : "";
    const publicId = typeof body?.publicId === "string" ? body.publicId.trim().slice(0, 300) : "";
    const caption = typeof body?.caption === "string" ? body.caption.trim().slice(0, 120) : "";
    const duration = typeof body?.duration === "number" ? body.duration : 0;

    if (!validCloudinaryUrl(mediaUrl, mediaType)) {
      return NextResponse.json({ success: false, message: "رابط الملف غير صالح." }, { status: 400 });
    }
    if (mediaType === "video" && (duration <= 0 || duration > 30)) {
      return NextResponse.json({ success: false, message: "يجب ألا يتجاوز الفيديو 30 ثانية." }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    const pendingSnapshot = await adminDb.collection("academyStories").where("studentId", "==", studentId).limit(10).get();
    const hasPending = pendingSnapshot.docs.some((doc) => doc.data()?.status === "pending");
    if (hasPending) {
      return NextResponse.json({ success: false, message: "لديك حالة بانتظار موافقة المعلّم." }, { status: 409 });
    }

    const reference = await adminDb.collection("academyStories").add({
      studentId,
      studentName: typeof data.studentName === "string" ? data.studentName : typeof data.name === "string" ? data.name : "طالب الأكاديمية",
      classroom: typeof data.classroom === "string" ? data.classroom : "",
      authorType: "student",
      mediaType,
      mediaUrl,
      publicId,
      caption,
      duration: mediaType === "video" ? duration : null,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      approved: false,
    });

    return NextResponse.json({ success: true, id: reference.id, message: "تم إرسال حالتك إلى المعلّم للمراجعة ✅" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "STUDENT_NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ success: false, message: status === 500 ? "تعذر إرسال الحالة الآن." : "تعذر التحقق من حساب الطالب." }, { status });
  }
}
