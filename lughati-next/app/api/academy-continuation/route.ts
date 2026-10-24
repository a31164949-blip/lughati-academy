import { randomUUID } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { FieldPath, FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '../../../firebase-admin';
import { ADMISSION_ACCESS_TAG, ACADEMY_CAPACITY, CONTINUATION_OPEN, CONTINUATION_ROUND, CONTINUATION_SEATS_TAG, continuationInput, validContinuationId, acceptedStudentIds, admissionStatus, type AdmissionStatus } from '../../lib/academyContinuation';
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
  if (code === 'FULL') return json({ success: false, code: 'FULL', message: 'اكتملت المقاعد العشرون المعتمدة. انقل أحد المقبولين إلى الانتظار قبل قبول طالب آخر، أو ضع هذا الطلب في قائمة الانتظار.' }, status);
  return json({ success: false, message: messages[code] ?? 'تعذر إتمام الطلب. تحقق من الاتصال وحاول مجددًا.' }, status);
}
function requests(db: FirebaseFirestore.Firestore) { return db.collection('academyContinuationRounds').doc(CONTINUATION_ROUND).collection('requests'); }
function dto(id: string, data: FirebaseFirestore.DocumentData) {
  const updatedAt = data.updatedAt?.toDate?.();
  return { id, studentName: data.studentName, classroom: data.classroom, message: typeof data.message === 'string' ? data.message : '', wantsToContinue: data.wantsToContinue === true, status: data.status === 'reviewed' ? 'reviewed' : 'new', admissionStatus: admissionStatus(data.admissionStatus), revision: data.revision, isTrial: data.isTrial === true, updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : typeof data.updatedAt === 'string' ? data.updatedAt : '' };
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
    const [rows, round] = await Promise.all([query.get(), db.collection('academyContinuationRounds').doc(CONTINUATION_ROUND).get()]);
    const accepted = acceptedStudentIds(round.data()).length;
    return json({ success: true, requests: rows.docs.map(row => dto(row.id, row.data())), cursor: rows.size === 20 ? rows.docs[19].id : null, admissions: { accepted, remaining: ACADEMY_CAPACITY - accepted } });
  } catch (error) { return failure(error); }
}
export async function POST(req: Request) {
  try {
    const { db, teacher, id, profile, isTrial } = await identity(req);
    if (teacher || !profile) throw Error('FORBIDDEN');
    if (!CONTINUATION_OPEN) throw Error('CLOSED');
    const input = continuationInput(await req.json());
    const ref = requests(db).doc(id), now = Date.now(), revision = randomUUID();
    const decision = await db.runTransaction(async tx => {
      const old = await tx.get(ref);
      if (now - Number(old.data()?.lastSubmittedAt ?? 0) < 10000) throw Error('TOO_FAST');
      let decision: AdmissionStatus = admissionStatus(old.data()?.admissionStatus);
      if (!old.exists) {
        const round = await tx.get(db.collection('academyContinuationRounds').doc(CONTINUATION_ROUND));
        decision = !isTrial && acceptedStudentIds(round.data()).length >= ACADEMY_CAPACITY ? 'waiting' : 'pending';
      }
      // Editing a letter cannot override the teacher's admission decision.
      tx.set(ref, { ...input, ...profile, studentId: id, isTrial, status: 'new', admissionStatus: decision, revision, round: CONTINUATION_ROUND, visibility: 'teacher-only', lastSubmittedAt: now, createdAt: old.data()?.createdAt ?? FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return decision;
    });
    // Refresh only the public aggregate after a successful save, not private records.
    revalidateTag(CONTINUATION_SEATS_TAG, { expire: 0 });
    // Return the member's own saved values without an extra read or public exposure.
    return json({ success: true, profile, request: { ...input, ...profile, id, isTrial, status: 'new', admissionStatus: decision, revision, updatedAt: new Date(now).toISOString() }, message: decision === 'waiting' ? 'وصل طلبك إلى قائمة الانتظار. اختيار المقبولين والترقية من الانتظار بقرار المعلم.' : 'حُفظ طلبك ورسالتك. قرار القبول للمعلم، وأسبقية التسجيل لا تحجز مقعدًا. اعتماد المعلم للقبول يتيح الدخول إلى الأكاديمية.' });
  } catch (error) { return failure(error); }
}
export async function PATCH(req: Request) {
  try {
    const { db, teacher, id: teacherId } = await identity(req);
    if (!teacher) throw Error('FORBIDDEN');
    const body = await req.json();
    if (!body || !validContinuationId(body.studentId)) throw Error('INVALID');
    const reviewing = ['new', 'reviewed'].includes(body.status), deciding = ['pending', 'accepted', 'waiting', 'declined'].includes(body.admissionStatus);
    if (reviewing === deciding) throw Error('INVALID');
    const ref = requests(db).doc(body.studentId), revision = randomUUID();
    const result = await db.runTransaction(async tx => {
      const old = await tx.get(ref);
      if (!old.exists || old.data()?.revision !== body.revision) throw Error('CHANGED');
      const round = db.collection('academyContinuationRounds').doc(CONTINUATION_ROUND);
      const metadata = await tx.get(round);
      const studentRef = db.collection('students').doc(body.studentId);
      const student = deciding ? await tx.get(studentRef) : null;
      if (deciding && body.admissionStatus === 'accepted' && (!student?.exists || student.data()?.deleted === true)) throw Error('INVALID');
      let acceptedIds = acceptedStudentIds(metadata.data());
      const decision = deciding ? body.admissionStatus as AdmissionStatus : admissionStatus(old.data()?.admissionStatus);
      if (deciding) {
        acceptedIds = acceptedIds.filter(id => id !== body.studentId);
        if (decision === 'accepted' && old.data()?.isTrial !== true) {
          if (acceptedIds.length >= ACADEMY_CAPACITY) throw Error('FULL');
          acceptedIds.push(body.studentId);
        }
        // A shared round document serializes all teacher decisions for the last seat.
        tx.set(round, { acceptedStudentIds: acceptedIds }, { merge: true });
        if (student?.exists) tx.update(studentRef, {
          academyAdmission: { round: CONTINUATION_ROUND, status: decision },
          ...(decision === 'accepted' && ['account', 'extras'].includes(student.data()?.accessControl?.mode) ? {
            accessControl: { mode: 'resume', until: null, resumedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), updatedBy: teacherId },
          } : {}),
        });
      }
      const status = reviewing ? body.status : 'reviewed';
      tx.update(ref, { status, admissionStatus: decision, revision, teacherReviewedAt: FieldValue.serverTimestamp(), ...(deciding ? { teacherDecisionBy: teacherId, teacherDecisionAt: FieldValue.serverTimestamp() } : {}) });
      return { status, admissionStatus: decision, admissions: { accepted: acceptedIds.length, remaining: ACADEMY_CAPACITY - acceptedIds.length } };
    });
    if (deciding) { revalidateTag(CONTINUATION_SEATS_TAG, { expire: 0 }); revalidateTag(ADMISSION_ACCESS_TAG, { expire: 0 }); }
    return json({ success: true, ...result, revision });
  } catch (error) { return failure(error); }
}
