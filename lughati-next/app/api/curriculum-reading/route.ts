import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
const DOC = "curriculumReading/current";
const headers = { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" };
function validImage(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com" &&
      parsed.pathname.startsWith("/ffv5igmg/image/upload/") &&
      !parsed.username && !parsed.password && !parsed.hash && url.length <= 1000;
  } catch { return false; }
}
async function teacher(request: Request) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) throw Error("UNAUTHORIZED");
  const { adminAuth } = getFirebaseAdmin({ allowSuspended: true });
  const decoded = await adminAuth.verifyIdToken(header.slice(7));
  if (decoded.role !== "teacher" && decoded.role !== "admin" &&
      String(decoded.email || "").toLowerCase() !== "a31164949@gmail.com") throw Error("FORBIDDEN");
  return decoded.uid;
}
export async function GET() {
  try {
    const { adminDb } = getFirebaseAdmin({ allowSuspended: true });
    const snap = await adminDb.doc(DOC).get();
    const data = snap.data() || {};
    return NextResponse.json({
      success: true,
      lesson: typeof data.imageUrl === "string" && validImage(data.imageUrl)
        ? { title: typeof data.title === "string" ? data.title : "قراءة المنهج", imageUrl: data.imageUrl }
        : null,
    }, { headers });
  } catch {
    return NextResponse.json({ success: false, message: "تعذر تحميل صفحة المنهج." }, { status: 503 });
  }
}
export async function PUT(request: Request) {
  try {
    const uid = await teacher(request);
    const raw = await request.text();
    if (raw.length > 2500) return NextResponse.json({ message: "البيانات كبيرة جدًا." }, { status: 413 });
    const body = JSON.parse(raw) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (title.length < 3 || title.length > 90 || !validImage(imageUrl)) {
      return NextResponse.json({ message: "أدخل عنوانًا صحيحًا وارفع صورة من أكاديمية لغتي." }, { status: 400 });
    }
    const { adminDb } = getFirebaseAdmin({ allowSuspended: true });
    await adminDb.doc(DOC).set({ title, imageUrl, updatedBy: uid, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ success: true, message: "تم نشر صورة المنهج للطلاب." });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json({ message: code === "UNAUTHORIZED" || code === "FORBIDDEN" ? "غير مصرح بالنشر." : "تعذر نشر صورة المنهج." }, { status: code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500 });
  }
}
export async function DELETE(request: Request) {
  try {
    await teacher(request);
    const { adminDb } = getFirebaseAdmin({ allowSuspended: true });
    await adminDb.doc(DOC).delete();
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ message: "تعذر إلغاء نشر الصورة." }, { status: 403 }); }
}
