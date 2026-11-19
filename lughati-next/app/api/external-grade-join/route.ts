import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '../../../firebase-admin';

export const runtime = 'nodejs';
const collection = 'externalGradeJoinRequests';
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

async function teacherDb(req: Request) {
  const bearer = req.headers.get('authorization');
  if (!bearer?.startsWith('Bearer ')) return null;
  const { adminAuth, adminDb } = getFirebaseAdmin({ allowSuspended: true });
  const token = await adminAuth.verifyIdToken(bearer.slice(7)).catch(() => null);
  if (!token || !(token.role === 'teacher' || token.role === 'admin' || token.email?.toLowerCase() === 'a31164949@gmail.com')) return null;
  return adminDb;
}
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    if (raw.length > 4096) return reply({ message: 'الطلب كبير جدًا.' }, 413);
    const input = JSON.parse(raw);
    if (!input || typeof input !== 'object') return reply({ message: 'البيانات غير صحيحة.' }, 400);
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return reply({ message: 'استقبال الطلبات غير مفعل حاليًا.' }, 503);
    if (input.website) return reply({ success: true });
    const token = typeof input.turnstileToken === 'string' ? input.turnstileToken : '';
    if (!token || token.length > 2048) return reply({ message: 'أكمل التحقق الأمني.' }, 400);
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(8000),
    });
    if (!verify.ok || (await verify.json()).success !== true) return reply({ message: 'تعذر التحقق الأمني، أعد المحاولة.' }, 403);
    const name = typeof input.studentName === 'string' ? input.studentName.trim().replace(/\s+/g, ' ') : '';
    const grade = typeof input.grade === 'string' ? input.grade : '';
    const classroom = typeof input.classroom === 'string' ? input.classroom.trim() : '';
    const note = typeof input.note === 'string' ? input.note.trim() : '';
    if (name.length < 5 || name.length > 90 ||
      !['الأول الابتدائي','الثاني الابتدائي','الثالث الابتدائي','الرابع الابتدائي','الخامس الابتدائي','السادس الابتدائي'].includes(grade) ||
      classroom.length > 35 || note.length > 300 || input.consent !== true)
      return reply({ message: 'تحقق من الاسم والصف والموافقة على إرسال الطلب.' }, 400);
    const { adminDb } = getFirebaseAdmin({ allowSuspended: true });
    await adminDb.collection(collection).doc(randomUUID()).create({
      studentName: name, grade, classroom, note, status: 'pending', membershipScope: 'competitions-only',
      createdAt: FieldValue.serverTimestamp(), reviewedAt: null,
      source: 'external-grades', visibility: 'teacher-only'
    });
    return reply({ success: true, message: 'وصل طلب عضوية التحديات والمسابقات للمراجعة. لا تُمنح أي صلاحية تلقائيًا، وهذه العضوية لا تشمل بقية خدمات الأكاديمية.' });
  } catch { return reply({ message: 'تعذر إرسال الطلب حاليًا.' }, 500); }
}
export async function GET(req: Request) {
  try {
    const db = await teacherDb(req);
    if (!db) return reply({ message: 'غير مصرح.' }, 403);
    const snapshot = await db.collection(collection).orderBy('createdAt', 'desc').limit(30).get();
    return reply({ success: true, requests: snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, studentName: data.studentName, grade: data.grade, classroom: data.classroom,
        note: data.note, status: data.status, membershipScope: data.membershipScope ?? 'competitions-only', createdAt: data.createdAt?.toDate?.()?.toISOString() ?? '' };
    }) });
  } catch { return reply({ message: 'تعذر عرض الطلبات.' }, 500); }
}
export async function PATCH(req: Request) {
  try {
    const db = await teacherDb(req);
    if (!db) return reply({ message: 'غير مصرح.' }, 403);
    const input = await req.json();
    if (typeof input?.id !== 'string' || !/^[0-9a-f-]{36}$/.test(input.id) || !['reviewed', 'waiting', 'declined'].includes(input.status))
      return reply({ message: 'طلب غير صالح.' }, 400);
    const ref = db.collection(collection).doc(input.id);
    const old = await ref.get();
    if (!old.exists) return reply({ message: 'الطلب غير موجود.' }, 404);
    await ref.update({ status: input.status, reviewedAt: FieldValue.serverTimestamp() });
    return reply({ success: true });
  } catch { return reply({ message: 'تعذر تحديث الطلب.' }, 500); }
}
