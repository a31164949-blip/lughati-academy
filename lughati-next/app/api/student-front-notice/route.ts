import { TAG, readStudentNotice } from '../../lib/readStudentNotice';
import { noticeIdentity } from '../../lib/studentNoticeIdentity';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '../../../firebase-admin';
import { parseStudentNotice } from '../../lib/studentFrontNotice';
export const runtime = 'nodejs';
function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } }); }
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  return json({ success: false, message: code === 'INVALID' ? 'تحقق من النص والرابط الداخلي وحدود الحروف.' : 'تعذر إتمام الطلب. تحقق من حسابك واتصالك وحاول مجددًا.' }, code === 'INVALID' ? 400 : code === 'UNAUTHORIZED' || code.includes('auth/') ? 401 : code === 'FORBIDDEN' ? 403 : 500);
}
export async function GET(request: Request) {
  try { const { teacher } = await noticeIdentity(request); const notice = await readStudentNotice(); return json({ success: true, teacher, notice: teacher || notice.active ? notice : null }); }
  catch (error) { return failure(error); }
}
export async function PUT(request: Request) {
  try {
    const actor = await noticeIdentity(request);
    if (!actor.teacher) throw Error('FORBIDDEN');
    const notice = parseStudentNotice(await request.json());
    await getFirebaseAdmin().adminDb.collection('academyStudentNotices').doc('current').set({ ...notice, updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() });
    revalidateTag(TAG, { expire: 0 });
    return json({ success: true, notice: await readStudentNotice() });
  } catch (error) { return failure(error); }
}
