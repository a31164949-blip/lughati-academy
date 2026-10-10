import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";
import { studentAccess, invalidateStudentAccess } from "../../lib/studentAccess";
export const runtime = "nodejs";
async function identify(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth } = getFirebaseAdmin({ allowSuspended: true });
  return adminAuth.verifyIdToken(header.slice(7)).catch(() => { throw new Error("UNAUTHORIZED"); });
}
function teacher(token: Awaited<ReturnType<typeof identify>>) { return token.uid === "ftT1AsqL7sZhdKiULp9oMMrCRnY2"; }
function json(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } }); }
function failure(error: unknown) { const code = error instanceof Error ? error.message : ""; return json({ message: "تعذر إتمام الطلب. حاول مرة أخرى." }, code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "INVALID" ? 400 : 500); }
export async function GET(request: Request) {
  try {
    const token = await identify(request);
    const id = teacher(token) ? new URL(request.url).searchParams.get("studentId") : token.role === "student" ? token.studentDocId : null;
    if (typeof id !== "string" || !id || id.includes("/")) throw new Error("FORBIDDEN");
    return json(await studentAccess(id));
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const token = await identify(request);
    if (!teacher(token)) throw new Error("FORBIDDEN");
    const body = await request.json();
    const id = body.studentId;
    if (typeof id !== "string" || !id || id.includes("/") || !["extras", "account", "resume"].includes(body.mode) || (body.mode !== "resume" && (!Number.isInteger(body.days) || body.days < 0 || body.days > 90))) throw new Error("INVALID");
    const ref = getFirebaseAdmin().adminDb.collection("students").doc(id);
    if (!(await ref.get()).exists) throw new Error("INVALID");
    await ref.update({ accessControl: { mode: body.mode, until: body.mode === "resume" || body.days === 0 ? null : Timestamp.fromMillis(Date.now() + body.days * 86400000), resumedAt: body.mode === "resume" ? FieldValue.serverTimestamp() : null, updatedAt: FieldValue.serverTimestamp(), updatedBy: token.uid } });
    invalidateStudentAccess(id);
    return json(await studentAccess(id));
  } catch (error) { return failure(error); }
}
