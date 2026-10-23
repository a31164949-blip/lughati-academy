import { randomUUID } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { FieldPath, FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '../../../firebase-admin';
import { ACADEMY_CAPACITY, CONTINUATION_OPEN, CONTINUATION_ROUND, CONTINUATION_SEATS_TAG, continuationInput, validContinuationId } from '../../lib/academyContinuation';
export const runtime = 'nodejs';

async function identity(req: Request) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw Error('UNAUTHORIZED');
  // Requests to return remain available during closure and manual suspension.
  const { adminAuth, adminDb: db } = getFirebaseAdmin({ allowSuspended: true });
  const token = await adminAuth.verifyIdToken(header.slice(7)).catch(() => { throw Error('UNAUTHORIZED'); });
  const teacher = token.role === 'teacher' || token.role === 'admin' || token.email?.toLowerCase() === 'a31164949@gmail.com';
  if (teacher) return { db, teacher: true, id: token.uid, profile: null, isTrial: false };
  if (token.role !== 'student' || !validContinuationId(token.studentDocId)) throw Error('FORBIDDEN');
  const snapshot = await db.collection('students').doc(token.studentDocId).get();
  const data = snapshot.data();
  if (!data || data.deleted === true) throw Error('FORBIDDEN');
  const studentName = String(data.studentName ?? data.name ?? '').trim();
  const classroom = String(data.classroom ?? '').trim();
  if (!studentName || !classroom) throw Error('PROFILE');
  const isTrial = data.isTestAccount === true || data.isTest === true || data.isDemo === true || /تجريب|\btest\b|\bdemo\b/i.test(studentName);
  return { db, teacher: false, id: token.studentDocId, profile: { studentName, classroom }, isTrial };
}
function json(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } }); }
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  const status = code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' ? 403 : ['INVALID', 'CONSENT', 'CLOSED', 'PROFILE'].includes(code) || error instanceof SyntaxError ? 400 : ['CHANGED', 'FULL'].includes(code) ? 409 : code === 'TOO_FAST' ? 429 : 500;
  const messages: Record<string, string> = { UNAUTHORIZED: 'سجّل دخولك بحساب الطالب لتأكيد طلبك.', FORBIDDEN: 'هذا الإجراء متاح لصاحب الحساب أو المعلم حسب الصلاحية.', CONSENT: 'أكّد رغبتك في الاستمرار بالتعلّم أولًا.', INVALID: 'تحقق من البيانات، واجعل رسالتك في حدود ١٠٠٠ حرف.', PROFILE: 'تواصل مع المعلم لاستكمال اسم الطالب وصفّه في الحساب.', CLOSED: 'استقبال طلبات الاستمرار متوقف حاليًا.', TOO_FAST: 'انتظر عشر ثوانٍ قبل تعديل طلبك مرة أخرى.', CHANGED: 'تم تحديث هذا الطلب. حدّث القائمة قبل مراجعته.' };
  if (code === 'FULL') return json({ success: false, code: 'FULL', message: 'اكتمل العدد: أُغلق التسجيل بعد تسجيل ٢٠ طالبًا. نشكر لكم اهتمامكم.' }, status);
  return json({ success: false, message: messages[code] ?? 'تعذر إتمام الطلب. تحقق من الاتصال وحاول مجددًا.' }, status);
}
function requests(db: FirebaseFirestore.Firestore) { return db.collection('academyContinuationRounds').doc(CONTINUATION_ROUND).collection('requests'); }
function dto(id: string, data: FirebaseFirestore.DocumentData) {
  const updatedAt = data.updatedAt?.toDate?.();
  return { id, studentName: data.studentName, classroom: data.classroom, message: typeof data.message === 'string' ? data.message : '', wantsToContinue: data.wantsToContinue === true, status: data.status === 'reviewed' ? 'reviewed' : 'new', revision: data.revision, isTrial: data.isTrial === true, updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : typeof data.updatedAt === 'string' ? data.updatedAt : '' };
}
export async function GET(req: Request) {
  try {
    const { db, teacher, id, profile } = await identity(req);
    const url = new URL(req.url), scope = url.searchParams.get('scope') ?? 'mine';
    if (scope === 'mine') {
      if (teacher) return json({ success: true, teacher, profile: null, request: null });
      const own = await requests(db).doc(id).get();
      return json({ success: true, teacher: false, profile, request: own.exists ? dto(own.id, own.data()!) : null });
    }
    if (scope !== 'all' || !teacher) throw Error('FORBIDDEN');
    const cursor = url.searchParams.get('cursor');
    if (cursor && !validContinuationId(cursor)) throw Error('INVALID');
    let query = requests(db).orderBy(FieldPath.documentId()).limit(20);
    if (cursor) query = query.startAfter(cursor);
    const rows = await query.get();
    return json({ success: true, requests: rows.docs.map(row => dto(row.id, row.data())), cursor: rows.size === 20 ? rows.docs[19].id : null });
  } catch (error) { return failure(error); }
}
export async function POST(req: Request) {
  try {
    const { db, teacher, id, profile, isTrial } = await identity(req);
    if (teacher || !profile) throw Error('FORBIDDEN');
    if (!CONTINUATION_OPEN) throw Error('CLOSED');
    const input = continuationInput(await req.json());
    const ref = requests(db).doc(id), now = Date.now(), revision = randomUUID();
    await db.runTransaction(async tx => {
      const old = await tx.get(ref);
      if (now - Number(old.data()?.lastSubmittedAt ?? 0) < 10000) throw Error('TOO_FAST');
      if (!isTrial && (!old.exists || old.data()?.isTrial !== false)) {
        const round = db.collection('academyContinuationRounds').doc(CONTINUATION_ROUND);
        // All new real applicants share this transaction guard. Concurrent attempts
        // for the last seat conflict and retry against the newly committed requests.
        await tx.get(round);
        const occupied = await tx.get(requests(db).where('isTrial', '==', false).limit(ACADEMY_CAPACITY));
        if (occupied.size >= ACADEMY_CAPACITY) throw Error('FULL');
        tx.set(round, { capacityRevision: randomUUID() }, { merge: true });
      }
      tx.set(ref, { ...input, ...profile, studentId: id, isTrial, status: 'new', revision, round: CONTINUATION_ROUND, visibility: 'teacher-only', lastSubmittedAt: now, createdAt: old.data()?.createdAt ?? FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    });
    // Refresh only the public aggregate after a successful save, not private records.
    revalidateTag(CONTINUATION_SEATS_TAG, { expire: 0 });
    // Return the member's own saved values without an extra read or public exposure.
    return json({ success: true, profile, request: { ...input, ...profile, id, isTrial, status: 'new', revision, updatedAt: new Date(now).toISOString() }, message: 'وصل طلبك ورسالتك للمعلم. القبول بعد مراجعة الطلبات، ولا يتفعّل الدخول تلقائيًا.' });
  } catch (error) { return failure(error); }
}
export async function PATCH(req: Request) {
  try {
    const { db, teacher } = await identity(req);
    if (!teacher) throw Error('FORBIDDEN');
    const body = await req.json();
    if (!body || !validContinuationId(body.studentId) || !['new', 'reviewed'].includes(body.status)) throw Error('INVALID');
    const ref = requests(db).doc(body.studentId), revision = randomUUID();
    await db.runTransaction(async tx => {
      const old = await tx.get(ref);
      if (!old.exists || old.data()?.revision !== body.revision) throw Error('CHANGED');
      tx.update(ref, { status: body.status, revision, teacherReviewedAt: FieldValue.serverTimestamp() });
    });
    return json({ success: true, status: body.status, revision });
  } catch (error) { return failure(error); }
}
