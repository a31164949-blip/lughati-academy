import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { getFirebaseAdmin } from "../../firebase-admin";
import { evaluateAccess } from "./studentAccessPolicy";

function milliseconds(value: unknown): number | null {
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") return value.toMillis();
  if (typeof value === "string") { const date = Date.parse(value); return Number.isFinite(date) ? date : null; }
  return null;
}
export function invalidateStudentAccess(id: string) { revalidateTag("student-access:" + id, { expire: 0 }); }
// One equality query per collection, cached across club polling. No new composite indexes required.
async function activity(id: string) {
  return unstable_cache(async () => {
    const db = getFirebaseAdmin().adminDb;
    const results = await Promise.all([
      db.collection("homeworkCompletions").where("studentId", "==", id).select("completedAt", "status", "solutionStatus", "needsRevision").get(),
      db.collection("reading-submissions").where("studentId", "==", id).select("createdAt", "status").get(),
    ]);
    let latest: number | null = null;
    for (const [index, result] of results.entries()) for (const row of result.docs) {
      const data = row.data();
      if (data.status === "rejected" || data.solutionStatus === "rejected" || data.needsRevision === true) continue;
      if (index === 0 && data.status !== "completed") continue;
      const date = milliseconds(index === 0 ? data.completedAt : data.createdAt);
      if (date !== null) latest = Math.max(latest ?? 0, date);
    }
    return latest;
  }, ["student-access-activity-v1", id], { revalidate: 300, tags: ["student-access:" + id] })();
}
export async function studentAccess(id: string, supplied?: FirebaseFirestore.DocumentData) {
  const data = supplied ?? (await getFirebaseAdmin().adminDb.collection("students").doc(id).get()).data();
  if (!data) throw new Error("STUDENT_NOT_FOUND");
  const control = data.accessControl ?? {};
  const until = milliseconds(control.until);
  const manual = ["extras", "account"].includes(control.mode) && (until === null || until > Date.now());
  return evaluateAccess({ now: Date.now(), enrolledAt: milliseconds(data.createdAt) ?? milliseconds(data.firstLoginAt), latestActivity: manual ? null : await activity(id), mode: control.mode, until, resumedAt: milliseconds(control.resumedAt) });
}
export async function requireStudentExtras(id: string, data?: FirebaseFirestore.DocumentData) {
  if ((await studentAccess(id, data)).extrasSuspended) throw new Error("FORBIDDEN");
}

export async function requireSubmissionIdentity(request: Request, id: string) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const token = await getFirebaseAdmin().adminAuth.verifyIdToken(header.slice(7));
  if (token.role !== "student" || token.studentDocId !== id) throw new Error("FORBIDDEN");
}
