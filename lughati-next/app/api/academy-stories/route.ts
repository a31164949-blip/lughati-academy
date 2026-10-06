import { verifyMediaVideo } from "../../lib/r2Media";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
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

// Cache only public fields. Private pending status is fetched separately per verified student.
const getPublicStories = unstable_cache(async () => {
  const { adminDb } = getFirebaseAdmin();
  // Single-field expiry query avoids a new composite index. Only approved stories
  // receive expiresAt; rejected legacy rows are still filtered before display.
  const snapshot = await adminDb.collection("academyStories")
    .where("expiresAt", ">", Timestamp.now()).limit(60).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(raw => (raw as Record<string, unknown>).status === "approved")
    .map(raw => {
      const item = raw as Record<string, unknown>;
      return {
        id: String(item.id), mediaType: item.mediaType === "video" ? "video" : "image",
        mediaUrl: typeof item.mediaUrl === "string" ? item.mediaUrl : "",
        caption: typeof item.caption === "string" ? item.caption : "",
        authorLabel: item.authorType === "teacher" ? "الأكاديمية" : "بطل الأكاديمية",
        approvedAt: millis(item.approvedAt), expiresAt: millis(item.expiresAt),
      };
    }).sort((a, b) => a.approvedAt - b.approvedAt);
}, ["academy-stories-public-budget-v1"], { revalidate: 30, tags: ["academy-stories-public"] });

export async function GET(request: Request) {
  try {
    const { adminAuth, adminDb } = getFirebaseAdmin();
    let studentId = "";
    const authorization = request.headers.get("authorization");
    if (authorization?.startsWith("Bearer ")) {
      try {
        const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
        if (decoded.role === "student" && typeof decoded.studentDocId === "string") studentId = decoded.studentDocId;
      } catch { /* Invalid tokens may view public stories only. */ }
    }
    const [publicStories, ownSnapshot] = await Promise.all([
      getPublicStories(),
      studentId ? adminDb.collection("academyStories").where("studentId", "==", studentId)
        .where("status", "==", "pending").limit(1).get() : Promise.resolve(null),
    ]);
    // Check expiry for every response, including cache hits.
    const stories = publicStories.filter(story => story.expiresAt > Date.now());
    const ownPending = ownSnapshot?.docs[0];
    return NextResponse.json({ success: true, stories,
      ownPending: ownPending ? { id: ownPending.id, status: "pending" } : null,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ success: false, message: "تعذر تحميل نبض الأكاديمية." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } });
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

    const reservationId = typeof body.reservationId === "string" ? body.reservationId : "";
    if (!reservationId && !validCloudinaryUrl(mediaUrl, mediaType)) {
      return NextResponse.json({ success: false, message: "رابط الملف غير صالح." }, { status: 400 });
    }
    if (mediaType === "video" && (duration <= 0 || duration > 30)) {
      return NextResponse.json({ success: false, message: "يجب ألا يتجاوز الفيديو 30 ثانية." }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    if (reservationId && mediaType !== "video") throw new Error("INVALID_VIDEO");
    const r2 = reservationId ? await verifyMediaVideo(request, reservationId, "stories") : null;
    const pendingSnapshot = await adminDb.collection("academyStories").where("studentId", "==", studentId).where("status", "==", "pending").limit(1).get();
    const hasPending = !pendingSnapshot.empty;
    if (hasPending) {
      return NextResponse.json({ success: false, message: "لديك حالة بانتظار موافقة المعلّم." }, { status: 409 });
    }

    const reference = r2 ? adminDb.collection("academyStories").doc(r2.id) : adminDb.collection("academyStories").doc();
    await reference.create({
      studentId,
      studentName: typeof data.studentName === "string" ? data.studentName : typeof data.name === "string" ? data.name : "طالب الأكاديمية",
      classroom: typeof data.classroom === "string" ? data.classroom : "",
      authorType: "student",
      mediaType,
      mediaUrl: r2?.url || mediaUrl,
      r2Key: r2?.key || "",
      storageProvider: r2 ? "r2" : "cloudinary",
      publicId: r2 ? "" : publicId,
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
