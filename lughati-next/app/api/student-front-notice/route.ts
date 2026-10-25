import { unstable_cache, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '../../../firebase-admin';
import { EMPTY_STUDENT_NOTICE, parseStudentNotice } from '../../lib/studentFrontNotice';
export const runtime = 'nodejs';
const TAG = 'student-front-notice-v1';
const read = unstable_cache(async () => {
  const row = await getFirebaseAdmin().adminDb.collection('academyStudentNotices').doc('current').get();
  return row.exists ? parseStudentNotice(row.data()) : EMPTY_STUDENT_NOTICE;
}, [TAG], { revalidate: 300, tags: [TAG] });
function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } }); }
async function identity(request: Request) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw Error('UNAUTHORIZED');
  const { adminAuth } = getFirebaseAdmin();
  const token = await adminAuth.verifyIdToken(header.slice(7));
  const teacher = token.role === 'teacher' || token.role === 'admin' || token.email?.toLowerCase() === 'a31164949@gmail.com';
  if (!teacher && (token.role !== 'student' || typeof token.studentDocId !== 'string')) throw Error('FORBIDDEN');
  return { teacher, uid: token.uid };
}
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  return json({ success: false, message: code === 'INVALID' ? 'تحقق من النص والرابط الداخلي وحدود الحروف.' : 'تعذر إتمام الطلب. تحقق من حسابك واتصالك وحاول مجددًا.' }, code === 'INVALID' ? 400 : code === 'UNAUTHORIZED' || code.includes('auth/') ? 401 : code === 'FORBIDDEN' ? 403 : 500);
}
export async function GET(request: Request) {
  try { const { teacher } = await identity(request); const notice = await read(); return json({ success: true, teacher, notice: teacher || notice.active ? notice : null }); }
  catch (error) { return failure(error); }
}
export async function PUT(request: Request) {
  try {
    const actor = await identity(request);
    if (!actor.teacher) throw Error('FORBIDDEN');
    const notice = parseStudentNotice(await request.json());
    await getFirebaseAdmin().adminDb.collection('academyStudentNotices').doc('current').set({ ...notice, updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() });
    revalidateTag(TAG, { expire: 0 });
    return json({ success: true, notice });
  } catch (error) { return failure(error); }
}
