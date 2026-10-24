import { NextResponse } from 'next/server';
import { getFirebaseAdmin, hasAcademyAdmission, ensureAcademyAdmissionAccess } from '../../../firebase-admin';
import { STUDENT_ACADEMY_PAUSED, isStudentPreviewAccount } from '../../lib/academyAvailability';
import { validContinuationId } from '../../lib/academyContinuation';
export const runtime = 'nodejs';
function json(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } }); }
export async function GET(request: Request) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return json({ success: false }, 401);
  try {
    const { adminAuth } = getFirebaseAdmin({ allowSuspended: true });
    const token = await adminAuth.verifyIdToken(header.slice(7)).catch(() => null);
    if (!token) return json({ success: false }, 401);
    if (token.role !== 'student' || !validContinuationId(token.studentDocId)) return json({ success: false }, 403);
    const id = token.studentDocId;
    const allowed = !STUDENT_ACADEMY_PAUSED || isStudentPreviewAccount(id) || (await hasAcademyAdmission(id) && await ensureAcademyAdmissionAccess(id));
    return json({ success: true, allowed });
  } catch { return json({ success: false, message: 'تعذر التحقق من قرار القبول. حاول مجددًا.' }, 503); }
}
