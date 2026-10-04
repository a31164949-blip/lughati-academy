import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../../firebase-admin";
import { mediaActor, reserveMediaVideo } from "../../../lib/r2Media";
import { videoPlaybackUrl } from "../../../lib/r2Video";
export const runtime = "nodejs";
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const messages: Record<string, string> = {
    INVALID_VIDEO: "اختر فيديو MP4 أو MOV أو WebM بحجم لا يتجاوز 20 ميجابايت.",
    DAILY_LIMIT: "بلغت حد رفع الفيديو اليومي. حاول غدًا.",
    STORAGE_LIMIT: "توقف رفع الفيديو لحماية ميزانية الأكاديمية.",
    SUBMISSION_CLOSED: "رفع أعمال الطلاب متاح من 1 ظهرًا إلى 10 مساءً.",
    PENDING_STORY: "لديك حالة بانتظار موافقة المعلم.",
    R2_NOT_CONFIGURED: "رفع الفيديو غير جاهز حاليًا.",
  };
  return NextResponse.json({ message: messages[code] || "تعذر الوصول إلى الفيديو." }, { status: code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : ["DAILY_LIMIT", "STORAGE_LIMIT"].includes(code) ? 429 : 400, headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  try { return NextResponse.json(await reserveMediaVideo(request, await request.json()), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return failure(error); }
}
export async function GET(request: Request) {
  try {
    const url = new URL(request.url), purpose = url.searchParams.get("purpose"), id = url.searchParams.get("id") || "";
    if (!["stories", "works"].includes(purpose || "") || !/^[a-zA-Z0-9_-]{10,210}$/.test(id)) throw new Error("INVALID_VIDEO");
    const { adminDb } = getFirebaseAdmin();
    const snapshot = await adminDb.collection(purpose === "stories" ? "academyStories" : "studentWorks").doc(id).get();
    const data = snapshot.data();
    if (!data?.r2Key) throw new Error("INVALID_VIDEO");
    const reservation = await adminDb.collection("r2MediaReservations").doc(id).get();
    if (reservation.data()?.key !== data.r2Key || reservation.data()?.purpose !== purpose || reservation.data()?.studentId !== data.studentId) throw new Error("FORBIDDEN");
    const approved = purpose === "stories"
      ? data.status === "approved" && (data.expiresAt?.toMillis?.() || 0) > Date.now()
      : ["approved", "معتمد"].includes(data.status) && (data.publishedToGallery === true || data.published === true);
    if (!approved) {
      const actor = await mediaActor(request);
      if (!actor.teacher && data.studentId !== actor.studentId) throw new Error("FORBIDDEN");
    }
    return NextResponse.json({ url: await videoPlaybackUrl(data.r2Key) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
