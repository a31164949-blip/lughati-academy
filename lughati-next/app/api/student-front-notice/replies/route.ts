import { NextResponse } from 'next/server';
import { FieldPath, FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '../../../../firebase-admin';
import { noticeIdentity } from '../../../lib/studentNoticeIdentity';
import { readStudentNotice } from '../../../lib/readStudentNotice';
export const runtime = 'nodejs';
function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } }); }
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  const messages: Record<string, string> = { CLOSED: 'الردود مغلقة حاليًا أو تغيّرت الرسالة. حدّث الصفحة.', INVALID: 'اكتب ردًا في حدود ٨٠٠ حرف.', TOO_FAST: 'انتظر عشر ثوانٍ قبل تحديث ردّك.' };
  return json({ success: false, message: messages[code] ?? 'تعذر إتمام الطلب. تحقق من الحساب والاتصال.' }, code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' || code.includes('auth/') ? 401 : code === 'INVALID' ? 400 : code === 'CLOSED' ? 409 : code === 'TOO_FAST' ? 429 : 500);
}
function replies(noticeId: string) { return getFirebaseAdmin().adminDb.collection('academyStudentNotices').doc('current').collection('threads').doc(noticeId).collection('replies'); }
function dto(id: string, data: FirebaseFirestore.DocumentData) { return { id, text: data.text, studentName: data.studentName, classroom: data.classroom, updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? '' }; }
export async function GET(request: Request) {
  try {
    const actor = await noticeIdentity(request), notice = await readStudentNotice();
    const url = new URL(request.url);
    if (url.searchParams.get('noticeId') !== notice.noticeId || (!actor.teacher && !notice.active)) throw Error('CLOSED');
    const ref = replies(notice.noticeId);
    if (!actor.teacher) { const own = await ref.doc(actor.studentId).get(); return json({ success: true, reply: own.exists ? dto(own.id, own.data()!) : null }); }
    const cursor = url.searchParams.get('cursor');
    if (cursor && !/^[A-Za-z0-9_-]{1,128}$/.test(cursor)) throw Error('INVALID');
    let query = ref.orderBy(FieldPath.documentId()).limit(20);
    if (cursor) query = query.startAfter(cursor);
    const rows = await query.get();
    return json({ success: true, replies: rows.docs.map(row => dto(row.id, row.data())), cursor: rows.size === 20 ? rows.docs[19].id : null });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const actor = await noticeIdentity(request);
    if (actor.teacher) throw Error('FORBIDDEN');
    const body = await request.json();
    if (!body || typeof body.text !== 'string' || !body.text.trim() || body.text.trim().length > 800) throw Error('INVALID');
    const { adminDb } = getFirebaseAdmin();
    const current = adminDb.collection('academyStudentNotices').doc('current');
    const notice = await readStudentNotice();
    if (body.noticeId !== notice.noticeId || !notice.active || !notice.allowReplies) throw Error('CLOSED');
    const ref = replies(notice.noticeId);
    await adminDb.runTransaction(async tx => {
      const [fresh, student, old] = await Promise.all([tx.get(current), tx.get(adminDb.collection('students').doc(actor.studentId)), tx.get(ref.doc(actor.studentId))]);
      const data = fresh.data();
      if (!data?.active || data.allowReplies === false || JSON.stringify([data.title, data.message, data.href, data.linkLabel]) !== JSON.stringify([notice.title, notice.message, notice.href, notice.linkLabel])) throw Error('CLOSED');
      const profile = student.data();
      if (!profile || profile.deleted === true || profile.active === false) throw Error('FORBIDDEN');
      if (Date.now() - (old.data()?.updatedAt?.toMillis?.() ?? 0) < 10000) throw Error('TOO_FAST');
      tx.set(ref.doc(actor.studentId), { text: body.text.trim(), studentId: actor.studentId, studentName: String(profile.studentName ?? profile.name ?? 'طالب'), classroom: String(profile.classroom ?? ''), updatedAt: FieldValue.serverTimestamp() });
    });
    return json({ success: true });
  } catch (error) { return failure(error); }
}
