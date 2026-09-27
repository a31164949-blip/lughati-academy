import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../../firebase-admin";

export const runtime = "nodejs";

function getSaudiDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

async function getStudentId(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth } = getFirebaseAdmin();
  const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
  if (decoded.role !== "student") throw new Error("FORBIDDEN");
  if (typeof decoded.studentDocId !== "string" || !decoded.studentDocId) throw new Error("STUDENT_NOT_FOUND");
  return decoded.studentDocId;
}

export async function POST(request: Request) {
  try {
    const studentId = await getStudentId(request);
    const body = await request.json();
    if (body?.score !== 3 || body?.total !== 3) {
      return NextResponse.json({ success:false, message:"لم يكتمل الإتقان بعد." }, { status:400 });
    }

    const { adminDb } = getFirebaseAdmin();
    const ref = adminDb.collection("students").doc(studentId);
    const result = await adminDb.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new Error("STUDENT_NOT_FOUND");
      const data = snapshot.data() ?? {};
      const membership = data.academyClubMembership && typeof data.academyClubMembership === "object"
        ? data.academyClubMembership as Record<string, unknown> : null;
      const expiresAt = typeof membership?.expiresAt === "string" ? membership.expiresAt : "";
      if (!membership || membership.active !== true || (expiresAt && expiresAt < getSaudiDateKey())) {
        throw new Error("CLUB_REQUIRED");
      }
      const elite = data.eliteLibrary && typeof data.eliteLibrary === "object"
        ? data.eliteLibrary as Record<string, unknown> : {};
      if (elite.masteryKey === true) return { alreadyAwarded:true };

      transaction.update(ref, {
        "eliteLibrary.masteryKey": true,
        "eliteLibrary.masteryCompletedAt": FieldValue.serverTimestamp(),
        "eliteLibrary.updatedAt": FieldValue.serverTimestamp(),
      });
      return { alreadyAwarded:false };
    });

    return NextResponse.json({ success:true, masteryKey:true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message==="UNAUTHORIZED"?401:message==="FORBIDDEN"?403:message==="CLUB_REQUIRED"?403:500;
    return NextResponse.json({ success:false, message:status===403?"هذا المسار خاص بأعضاء نادي الأكاديمية.":"تعذر حفظ قطعة مفتاح النخبة." }, { status });
  }
}
