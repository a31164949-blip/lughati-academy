import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '../../../firebase-admin';
import { verifyCompetitionSession } from '../../lib/competitionGuestSession';

export const runtime = 'nodejs';
const collection = 'guestLearning';
const documentId = 'worksheets';
type Worksheet = { id: string; title: string; description: string; url: string; grade: string };
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

function validUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 1000) return false;
  try {
    const url = new URL(value);
    // Limit links to HTTPS. Do not fetch or proxy any user-supplied URL.
    return url.protocol === 'https:' && !url.username && !url.password && !url.hash;
  } catch { return false; }
}

async function identity(request: Request) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw Error('UNAUTHORIZED');
  const raw = header.slice(7);
  if (raw.startsWith('guest.')) {
    const id = verifyCompetitionSession(raw.slice(6));
    const { adminDb } = getFirebaseAdmin({ allowSuspended: true });
    const member = await adminDb.collection('externalGradeJoinRequests').doc(id).get();
    if (!member.exists || member.data()?.status !== 'approved' || member.data()?.membershipScope !== 'competitions-only') throw Error('FORBIDDEN');
    return { role: 'guest' as const, db: adminDb, grade: String(member.data()?.grade || '') };
  }
  const { adminAuth, adminDb } = getFirebaseAdmin({ allowSuspended: true });
  const token = await adminAuth.verifyIdToken(raw);
  if (!(token.role === 'teacher' || token.role === 'admin' || token.email?.toLowerCase() === 'a31164949@gmail.com')) throw Error('FORBIDDEN');
  return { role: 'teacher' as const, db: adminDb, grade: '' };
}

function filterWorksheets(data: unknown): Worksheet[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is Worksheet =>
    item != null && typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.description === 'string' &&
    typeof item.grade === 'string' && validUrl(item.url)).slice(0, 20);
}

export async function GET(request: Request) {
  try {
    const actor = await identity(request);
    const doc = await actor.db.collection(collection).doc(documentId).get();
    const all = filterWorksheets(doc.data()?.items);
    const worksheets = actor.role === 'teacher' ? all : all.filter(item => !item.grade || item.grade === actor.grade);
    return json({ success: true, worksheets });
  } catch { return json({ message: 'غير مصرح بعرض أوراق العمل.' }, 403); }
}

export async function PUT(request: Request) {
  try {
    const actor = await identity(request);
    if (actor.role !== 'teacher') return json({ message: 'هذا الإجراء للمعلم فقط.' }, 403);
    const raw = await request.text();
    if (raw.length > 25000) return json({ message: 'حجم البيانات كبير جدًا.' }, 413);
    const input = JSON.parse(raw) as Record<string, unknown>;
    if (!Array.isArray(input.worksheets) || input.worksheets.length > 20) return json({ message: 'الحد الأعلى 20 ورقة عمل.' }, 400);
    const grades = ['', 'الأول الابتدائي', 'الثاني الابتدائي', 'الثالث الابتدائي', 'الرابع الابتدائي', 'الخامس الابتدائي', 'السادس الابتدائي'];
    const items: Worksheet[] = [];
    for (const row of input.worksheets) {
      if (!row || typeof row !== 'object') return json({ message: 'ورقة عمل غير صالحة.' }, 400);
      const data = row as Record<string, unknown>;
      const id = typeof data.id === 'string' ? data.id : '';
      const title = typeof data.title === 'string' ? data.title.trim() : '';
      const description = typeof data.description === 'string' ? data.description.trim() : '';
      const grade = typeof data.grade === 'string' ? data.grade : '';
      if (!/^[a-zA-Z0-9_-]{8,60}$/.test(id) || title.length < 3 || title.length > 100 || description.length > 300 || !grades.includes(grade) || !validUrl(data.url))
        return json({ message: 'تحقق من عنوان الورقة ورابط HTTPS والصف.' }, 400);
      items.push({ id, title, description, grade, url: data.url });
    }
    if (new Set(items.map(item => item.id)).size !== items.length) return json({ message: 'معرّفات مكررة.' }, 400);
    await actor.db.collection(collection).doc(documentId).set({ items, updatedAt: FieldValue.serverTimestamp() });
    return json({ success: true, worksheets: items });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN') {
      return json({ message: 'غير مصرح بتعديل أوراق العمل.' }, code === 'UNAUTHORIZED' ? 401 : 403);
    }
    return json({ message: 'تعذر حفظ أوراق العمل.' }, 500);
  }
}
