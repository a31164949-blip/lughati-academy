import { NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";
const TAG = "reading-support-meeting";
const emptyMeeting = { title: "حصة إضافية للتمكين القرائي", meetingUrl: "", enabled: false };
async function teacher(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth } = getFirebaseAdmin();
  const token = await adminAuth.verifyIdToken(header.slice(7)).catch(() => { throw new Error("UNAUTHORIZED"); });
  if (token.role !== "teacher" && token.role !== "admin" && token.email?.toLowerCase() !== "a31164949@gmail.com") throw new Error("FORBIDDEN");
  return token.uid;
}
async function load() {
  const { adminDb } = getFirebaseAdmin();
  const row = (await adminDb.collection("academySettings").doc("readingSupportMeeting").get()).data();
  return { title: typeof row?.title === "string" ? row.title : emptyMeeting.title, meetingUrl: typeof row?.meetingUrl === "string" ? row.meetingUrl : "", enabled: row?.enabled === true };
}
const publicMeeting = unstable_cache(async () => {
  const row = await load();
  return row.enabled && row.meetingUrl ? row : null;
}, [TAG], { revalidate: 300, tags: [TAG] });
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  return json({ success: false, message: "تعذر إتمام الطلب. حاول مرة أخرى." }, code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500);
}
export async function GET(request: Request) {
  try {
    if (new URL(request.url).searchParams.get("manage") === "1") {
      await teacher(request);
      return json({ success: true, meeting: await load() });
    }
    return json({ success: true, meeting: await publicMeeting() });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const uid = await teacher(request);
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const meetingUrl = typeof body.meetingUrl === "string" ? body.meetingUrl.trim() : "";
    if (!title || title.length > 160 || meetingUrl.length > 4000 || typeof body.enabled !== "boolean") return json({ success: false, message: "راجع عنوان الحصة والرابط." }, 400);
    if (meetingUrl) {
      let url: URL;
      try { url = new URL(meetingUrl); } catch { return json({ success: false, message: "ألصق رابط اجتماع تيمز الصحيح." }, 400); }
      if (url.protocol !== "https:" || url.username || url.password || !["teams.microsoft.com", "teams.live.com", "teams.cloud.microsoft"].includes(url.hostname)) return json({ success: false, message: "استخدم رابط اجتماع تيمز الرسمي الذي يبدأ بـ https." }, 400);
    } else if (body.enabled) return json({ success: false, message: "أضف رابط تيمز قبل إظهاره." }, 400);
    const { adminDb } = getFirebaseAdmin();
    await adminDb.collection("academySettings").doc("readingSupportMeeting").set({ title, meetingUrl, enabled: body.enabled, updatedBy: uid, updatedAt: FieldValue.serverTimestamp() });
    revalidateTag(TAG, { expire: 0 });
    return json({ success: true });
  } catch (error) { return failure(error); }
}
