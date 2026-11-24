import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";
const DOCUMENT = "academySettings/achievementGrandPrize";
const GOAL = 1200;
const cacheHeaders = { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" };

function validImage(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 1000) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com" &&
      url.pathname.startsWith("/ffv5igmg/image/upload/") &&
      !url.username && !url.password && !url.hash && !url.search;
  } catch { return false; }
}

const getPrize = unstable_cache(async () => {
  const { adminDb } = getFirebaseAdmin({ allowSuspended: true });
  const snap = await adminDb.doc(DOCUMENT).get();
  return validImage(snap.data()?.imageUrl) ? snap.data()?.imageUrl as string : "";
}, ["achievement-grand-prize-2026-1"], { revalidate: 60 });

export async function GET() {
  try {
    const imageUrl = await getPrize();
    return NextResponse.json({ success: true, goal: GOAL, imageUrl }, { headers: cacheHeaders });
  } catch {
    return NextResponse.json({ success: false, message: "تعذر تحميل صورة الجائزة." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
    const { adminAuth, adminDb } = getFirebaseAdmin({ allowSuspended: true });
    const token = await adminAuth.verifyIdToken(authorization.slice(7));
    const teacher = token.role === "teacher" || token.role === "admin" ||
      String(token.email || "").toLowerCase() === "a31164949@gmail.com";
    if (!teacher) return NextResponse.json({ message: "للمعلم فقط." }, { status: 403 });
    const raw = await request.text();
    if (raw.length > 2000) return NextResponse.json({ message: "الطلب كبير." }, { status: 413 });
    const body = JSON.parse(raw) as Record<string, unknown>;
    if (!validImage(body.imageUrl)) return NextResponse.json({ message: "اختر صورة جائزة صالحة." }, { status: 400 });
    await adminDb.doc(DOCUMENT).set({
      imageUrl: body.imageUrl,
      title: "السيارة الزرقاء بالتحكم عن بُعد",
      goal: GOAL,
      updatedBy: token.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true, message: "تم اعتماد صورة الجائزة الكبرى." });
  } catch {
    return NextResponse.json({ message: "تعذر حفظ صورة الجائزة." }, { status: 500 });
  }
}
