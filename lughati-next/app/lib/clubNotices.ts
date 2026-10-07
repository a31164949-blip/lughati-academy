import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../firebase-admin";

export const NOTICE_TAG = "club-pinned-notice-v1";
export function isActiveClubStudent(data: Record<string, unknown>, now = new Date()) {
  if (data.deleted === true || data.active === false || data.isActive === false) return false;
  const value = data.academyClubMembership;
  if (!value || typeof value !== "object") return false;
  const membership = value as Record<string, unknown>;
  if (membership.active !== true) return false;
  const expiry = membership.expiresAt;
  if (expiry instanceof Timestamp) return expiry.toMillis() >= now.getTime();
  if (typeof expiry === "string" && expiry) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
      return expiry >= today;
    }
    const milliseconds = Date.parse(expiry);
    return Number.isFinite(milliseconds) && milliseconds >= now.getTime();
  }
  return expiry == null || expiry === "";
}
export async function noticeIdentity(request: Request, teacherOnly = false) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth, adminDb } = getFirebaseAdmin();
  const token = await adminAuth.verifyIdToken(authorization.slice(7)).catch(() => { throw new Error("UNAUTHORIZED"); });
  const teacher = token.role === "teacher" || token.role === "admin" || token.email?.toLowerCase() === "a31164949@gmail.com";
  if (teacherOnly || new URL(request.url).searchParams.get("teacherPreview") === "1") {
    if (!teacher) throw new Error("FORBIDDEN");
    return { db: adminDb, uid: token.uid, studentId: "", studentName: "", preview: true };
  }
  if (token.role !== "student" || typeof token.studentDocId !== "string" || !token.studentDocId) throw new Error("FORBIDDEN");
  const snapshot = await adminDb.collection("students").doc(token.studentDocId).get();
  const data = snapshot.data();
  if (!data || !isActiveClubStudent(data)) throw new Error("FORBIDDEN");
  return { db: adminDb, uid: token.uid, studentId: token.studentDocId, studentName: String(data.studentName || "طالب الأكاديمية"), preview: false };
}
export function noticeView(data: FirebaseFirestore.DocumentData | undefined) {
  if (!data) return null;
  return { noticeId: String(data.noticeId || ""), title: String(data.title || ""), text: String(data.text || ""), active: data.active === true, allowReplies: data.allowReplies === true };
}
export const readCurrentNotice = unstable_cache(async () => {
  const snapshot = await getFirebaseAdmin().adminDb.collection("academyClubNotices").doc("current").get();
  return noticeView(snapshot.data());
}, [NOTICE_TAG], { revalidate: 60, tags: [NOTICE_TAG] });
export function invalidateNotice(studentIds: string[] = []) {
  revalidateTag(NOTICE_TAG, { expire: 0 });
  for (const id of studentIds) revalidateTag("student-notifications:" + createHash("sha256").update(id).digest("hex"), { expire: 0 });
}
export function noticeJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}
export function noticeError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "INVALID" || code === "CLOSED" ? 400 : code === "TOO_FAST" ? 429 : code === "TOO_MANY" ? 409 : 500;
  const message = code === "CLOSED" ? "أُغلقت الرسالة أو تغيرت. حدّث الصفحة." : code === "TOO_FAST" ? "انتظر قليلًا قبل تعديل الرد." : code === "TOO_MANY" ? "عدد الأعضاء يتجاوز حد النشر الحالي؛ لم تُنشر الرسالة." : code === "INVALID" ? "تحقق من النص والبيانات المدخلة." : code === "FORBIDDEN" ? "هذه الرسالة مخصصة لأعضاء النادي النشطين." : "تعذر إتمام الطلب. حاول مرة أخرى.";
  return noticeJson({ success: false, message }, status);
}
