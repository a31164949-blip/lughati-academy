import "server-only";
import { getFirebaseAdmin } from "../../firebase-admin";
export async function noticeIdentity(request: Request) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw Error('UNAUTHORIZED');
  const { adminAuth } = getFirebaseAdmin();
  const token = await adminAuth.verifyIdToken(header.slice(7));
  const teacher = token.role === 'teacher' || token.role === 'admin' || token.email?.toLowerCase() === 'a31164949@gmail.com';
  if (!teacher && (token.role !== 'student' || typeof token.studentDocId !== 'string')) throw Error('FORBIDDEN');
  return { teacher, uid: token.uid, studentId: typeof token.studentDocId === 'string' ? token.studentDocId : '' };
}
