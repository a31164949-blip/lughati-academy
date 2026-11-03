import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";
import { isResultsViewingOpen, RESULTS_VIEW_END } from "../../lib/resultsViewingWindow";
import { validContinuationId } from "../../lib/academyContinuation";
export const runtime = "nodejs";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET(request: Request) {
  if (!isResultsViewingOpen()) return json({ message: "انتهت فترة الاطلاع المؤقتة." }, 403);
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return json({ message: "يجب تسجيل الدخول." }, 401);
  try {
    const { adminAuth, adminDb } = getFirebaseAdmin({ allowSuspended: true });
    const token = await adminAuth.verifyIdToken(header.slice(7)).catch(() => null);
    if (!token) return json({ message: "يجب تسجيل الدخول مجددًا." }, 401);
    if (token.role !== "student" || !validContinuationId(token.studentDocId)) return json({ message: "غير مصرح." }, 403);
    const student = await adminDb.collection("students").doc(token.studentDocId).get();
    if (!student.exists || student.data()?.deleted === true) return json({ message: "الحساب غير متاح." }, 403);
    // Always derive identity from the verified token, never a query or browser storage.
    const snapshot = await adminDb.collection("quizResults").where("studentId", "==", token.studentDocId)
      .select("quizTitle", "studentScore", "totalScore", "teacherNote").get();
    if (!isResultsViewingOpen()) return json({ message: "انتهت فترة الاطلاع المؤقتة." }, 403);
    const results = snapshot.docs.map(row => {
      const data = row.data();
      return { id: row.id, title: typeof data.quizTitle === "string" ? data.quizTitle : "اختبار لغتي",
        score: typeof data.studentScore === "number" ? data.studentScore : null,
        total: typeof data.totalScore === "number" ? data.totalScore : null,
        note: typeof data.teacherNote === "string" ? data.teacherNote : "" };
    });
    return json({ results, expiresAt: RESULTS_VIEW_END });
  } catch { return json({ message: "تعذر تحميل النتائج. حاول مجددًا." }, 503); }
}
