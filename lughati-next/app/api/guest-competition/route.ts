import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '../../../firebase-admin';
import { verifyCompetitionSession } from '../../lib/competitionGuestSession';
export const runtime = 'nodejs';
const challengeId = 'linguistic-contest-01';
const questions = [
  { prompt: 'ما الكلمة التي تحتوي على مقطع ساكن؟', options: ['كَتَبَ', 'مَدْرَسَةٌ', 'رَسَمَ'], correct: 1 },
  { prompt: 'اختر الكلمة التي تنتهي بتنوين الضم.', options: ['قَلَمٌ', 'قَلَمًا', 'قَلَمٍ'], correct: 0 },
  { prompt: 'ما ضد كلمة «قريب»؟', options: ['سريع', 'بعيد', 'جميل'], correct: 1 },
  { prompt: 'ما جمع كلمة «كتاب»؟', options: ['كاتب', 'كتب', 'مكتبة'], correct: 1 },
  { prompt: 'أي الكلمات تبدأ باللام الشمسية؟', options: ['الشَّمْسُ', 'الْقَمَرُ', 'الْبَابُ'], correct: 0 },
  { prompt: 'اختر الجملة الصحيحة.', options: ['الطلابُ مجتهدونَ.', 'الطلابَ مجتهدونَ.', 'الطلابِ مجتهدونَ.'], correct: 0 },
];
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
async function identity(request: Request) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw Error('UNAUTHORIZED');
  const { adminAuth, adminDb } = getFirebaseAdmin({ allowSuspended: true });
  const raw = header.slice(7);
  // Guest sessions are never Firebase credentials and have no Firestore client privileges.
  if (raw.startsWith('guest.')) {
    const id = verifyCompetitionSession(raw.slice(6));
    const snap = await adminDb.collection('externalGradeJoinRequests').doc(id).get();
    if (!snap.exists || snap.data()?.status !== 'approved' || snap.data()?.membershipScope !== 'competitions-only') throw Error('FORBIDDEN');
    return { kind: 'guest' as const, db: adminDb, id, name: String(snap.data()?.studentName ?? '') };
  }
  const firebaseToken = await adminAuth.verifyIdToken(raw);
  const isTeacher = firebaseToken.role === 'teacher' || firebaseToken.role === 'admin' || firebaseToken.email?.toLowerCase() === 'a31164949@gmail.com';
  if (!isTeacher) throw Error('FORBIDDEN');
  return { kind: 'teacher' as const, db: adminDb };
}

export async function GET(request: Request) {
  try {
    const actor = await identity(request);
    if (actor.kind === 'teacher') {
      if (new URL(request.url).searchParams.get('mode') !== 'results') return json({ message: 'غير صالح.' }, 400);
      const rows = await actor.db.collection('guestCompetitionResults').where('challengeId', '==', challengeId).limit(30).get();
      return json({ success: true, results: rows.docs.map(row => ({ name: row.data().studentName, score: row.data().score, total: questions.length })) });
    }
    const previous = await actor.db.collection('guestCompetitionResults').doc(challengeId + '_' + actor.id).get();
    return json({ success: true, title: 'تحدي المهارات اللغوية', questions: questions.map(({ prompt, options }) => ({ prompt, options })), submitted: previous.exists, score: previous.exists ? previous.data()?.score : null });
  } catch { return json({ message: 'غير مصرح أو تعذر تحميل المسابقة.' }, 403); }
}
export async function POST(request: Request) {
  try {
    const actor = await identity(request);
    if (actor.kind !== 'guest') throw Error('FORBIDDEN');
    const body = await request.json();
    const answers = body?.answers;
    if (!Array.isArray(answers) || answers.length !== questions.length || !answers.every((n: unknown) => Number.isInteger(n) && Number(n) >= 0 && Number(n) <= 2))
      return json({ message: 'أجب عن جميع الأسئلة.' }, 400);
    const score = questions.reduce((sum, question, i) => sum + Number(answers[i] === question.correct), 0);
    const ref = actor.db.collection('guestCompetitionResults').doc(challengeId + '_' + actor.id);
    await ref.create({ challengeId, requestId: actor.id, studentName: actor.name, score, total: questions.length, submittedAt: FieldValue.serverTimestamp() });
    return json({ success: true, score, total: questions.length });
  } catch (error) {
    const code = error as { code?: number | string };
    return json({ message: code?.code === 6 || code?.code === 'already-exists' ? 'سبق إرسال إجابتك لهذه المسابقة.' : 'تعذر إرسال الإجابات.' }, code?.code === 6 || code?.code === 'already-exists' ? 409 : 403);
  }
}
