import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";
const TEACHER_EMAIL = "a31164949@gmail.com";

async function requireTeacher(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth } = getFirebaseAdmin();
  const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
  const email = typeof decoded.email === "string" ? decoded.email.trim().toLowerCase() : "";
  const role = typeof decoded.role === "string" ? decoded.role : "";
  if (role !== "teacher" && role !== "admin" && email !== TEACHER_EMAIL) {
    throw new Error("FORBIDDEN");
  }
  return decoded.uid;
}

function validCloudinaryUrl(value: string, mediaType: "image" | "video") {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && url.pathname.includes(`/${mediaType}/upload/`);
  } catch {
    return false;
  }
}

function millis(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as {toMillis?: unknown}).toMillis === "function") {
    return (value as {toMillis: () => number}).toMillis();
  }
  return 0;
}

export async function GET(request: Request) {
  try {
    await requireTeacher(request);
    const { adminDb } = getFirebaseAdmin();
    const snapshot = await adminDb.collection("academyStories").limit(100).get();
    const items = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => millis((b as {createdAt?: unknown}).createdAt) - millis((a as {createdAt?: unknown}).createdAt))
      .map((raw) => {
        const item = raw as Record<string, unknown>;
        return {
          id: String(item.id),
          studentName: typeof item.studentName === "string" ? item.studentName : "طالب الأكاديمية",
          classroom: typeof item.classroom === "string" ? item.classroom : "",
          mediaType: item.mediaType === "video" ? "video" : "image",
          mediaUrl: typeof item.mediaUrl === "string" ? item.mediaUrl : "",
          caption: typeof item.caption === "string" ? item.caption : "",
          status: typeof item.status === "string" ? item.status : "pending",
          createdAt: millis(item.createdAt),
          expiresAt: millis(item.expiresAt),
        };
      });
    return NextResponse.json({ success: true, items });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, message: status === 500 ? "تعذر تحميل الحالات." : "غير مصرح بالدخول." }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const teacherUid = await requireTeacher(request);
    const body = await request.json();
    const mediaType = body?.mediaType === "video" ? "video" : "image";
    const mediaUrl = typeof body?.mediaUrl === "string" ? body.mediaUrl.trim() : "";
    const publicId = typeof body?.publicId === "string" ? body.publicId.trim().slice(0, 300) : "";
    const caption = typeof body?.caption === "string" ? body.caption.trim().slice(0, 120) : "";
    const duration = typeof body?.duration === "number" ? body.duration : 0;
    const durationHours = [24, 48, 72].includes(Number(body?.durationHours)) ? Number(body.durationHours) : 24;

    if (!validCloudinaryUrl(mediaUrl, mediaType)) {
      return NextResponse.json({ success: false, message: "رابط الملف غير صالح." }, { status: 400 });
    }
    if (mediaType === "video" && (duration <= 0 || duration > 30)) {
      return NextResponse.json({ success: false, message: "يجب ألا يتجاوز الفيديو 30 ثانية." }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    const now = new Date();
    const reference = await adminDb.collection("academyStories").add({
      studentId: "",
      studentName: "أكاديمية لغتي",
      classroom: "",
      authorType: "teacher",
      mediaType,
      mediaUrl,
      publicId,
      caption,
      duration: mediaType === "video" ? duration : null,
      status: "approved",
      approved: true,
      createdBy: teacherUid,
      createdAt: FieldValue.serverTimestamp(),
      approvedAt: FieldValue.serverTimestamp(),
      reviewedAt: FieldValue.serverTimestamp(),
      durationHours,
      expiresAt: Timestamp.fromDate(new Date(now.getTime() + durationHours * 60 * 60 * 1000)),
    });

    return NextResponse.json({ success: true, id: reference.id, message: "تم نشر حالة الأكاديمية مباشرة ✅" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, message: status === 500 ? "تعذر نشر الحالة." : "غير مصرح بالدخول." }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireTeacher(request);
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const action = body?.action === "approve" ? "approve" : body?.action === "reject" ? "reject" : "";
    const durationHours = [24, 48, 72].includes(Number(body?.durationHours)) ? Number(body.durationHours) : 24;
    if (!id || !action) return NextResponse.json({ success: false, message: "الطلب غير صحيح." }, { status: 400 });

    const { adminDb } = getFirebaseAdmin();
    const reference = adminDb.collection("academyStories").doc(id);
    await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error("NOT_FOUND");
      if (action === "approve") {
        const now = new Date();
        transaction.update(reference, {
          status: "approved",
          approved: true,
          approvedAt: FieldValue.serverTimestamp(),
          expiresAt: Timestamp.fromDate(new Date(now.getTime() + durationHours * 60 * 60 * 1000)),
          durationHours,
          reviewedAt: FieldValue.serverTimestamp(),
        });
      } else {
        transaction.update(reference, {
          status: "rejected",
          approved: false,
          rejectedAt: FieldValue.serverTimestamp(),
          reviewedAt: FieldValue.serverTimestamp(),
        });
      }
    });
    return NextResponse.json({ success: true, message: action === "approve" ? "تم نشر الحالة في نبض الأكاديمية ✅" : "تم رفض الحالة." });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ success: false, message: status === 500 ? "تعذر تحديث الحالة." : status === 404 ? "الحالة غير موجودة." : "غير مصرح بالدخول." }, { status });
  }
}
