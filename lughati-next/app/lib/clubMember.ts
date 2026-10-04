import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../firebase-admin";

export async function requireClubMember(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");

  const { adminAuth, adminDb } = getFirebaseAdmin();
  const token = await adminAuth.verifyIdToken(authorization.slice(7));
  if (token.role !== "student") throw new Error("FORBIDDEN");

  const studentId =
    typeof token.studentDocId === "string" ? token.studentDocId : "";
  if (!studentId) throw new Error("STUDENT_NOT_FOUND");

  const studentSnapshot = await adminDb.collection("students").doc(studentId).get();
  if (!studentSnapshot.exists) throw new Error("STUDENT_NOT_FOUND");

  const studentData = studentSnapshot.data() ?? {};
  const membership = studentData.academyClubMembership;
  const expiry = membership?.expiresAt instanceof Timestamp
    ? membership.expiresAt.toDate()
    : null;

  if (
    !membership ||
    membership.active !== true ||
    (expiry && expiry.getTime() < Date.now())
  ) {
    throw new Error("MEMBERSHIP_REQUIRED");
  }

  return {
    studentId,
    studentName:
      typeof studentData.studentName === "string"
        ? studentData.studentName
        : "طالب الأكاديمية",
    classroom:
      typeof studentData.classroom === "string" ? studentData.classroom : "",
  };
}
