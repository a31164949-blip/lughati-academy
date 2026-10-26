import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { revalidateTag, unstable_cache } from 'next/cache';
import { getFirebaseAdmin } from '../../../firebase-admin';
import { CHAMPIONS_TAG, CHAMPIONS_LIMIT, SEED_CHAMPIONS, championInput } from '../../lib/liveChallengeChampions';
export const runtime = 'nodejs';
const ref = () => getFirebaseAdmin().adminDb.collection('academyDisplaySettings').doc('liveChallengeChampions');
function config(data: FirebaseFirestore.DocumentData | undefined) {
  if (!data) return { champions: SEED_CHAMPIONS, revision: 'initial-v1' };
  if (!Array.isArray(data.champions) || data.champions.length > CHAMPIONS_LIMIT || typeof data.revision !== 'string') throw Error('CONFIG');
  const champions = data.champions.map(championInput);
  if (new Set(champions.map(item => item.id)).size !== champions.length) throw Error('CONFIG');
  return { champions, revision: data.revision };
}
const cachedConfig = unstable_cache(async () => config((await ref().get()).data()), [CHAMPIONS_TAG], { revalidate: 300, tags: [CHAMPIONS_TAG] });
async function identify(req: Request) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw Error('UNAUTHORIZED');
  const token = await getFirebaseAdmin().adminAuth.verifyIdToken(header.slice(7));
  const teacher = token.role === 'teacher' || token.role === 'admin' || token.email?.toLowerCase() === 'a31164949@gmail.com';
  if (!teacher && token.role !== 'student') throw Error('FORBIDDEN');
  return { teacher, uid: token.uid };
}
function json(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } }); }
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  const status = code === 'UNAUTHORIZED' || code.includes('auth/') ? 401 : code === 'FORBIDDEN' ? 403 : code === 'CHANGED' ? 409 : code === 'INVALID' || error instanceof SyntaxError ? 400 : 500;
  return json({ success: false, message: code === 'CHANGED' ? 'تغيّرت قائمة الأبطال. حدّث الصفحة قبل الحفظ.' : code === 'INVALID' ? 'تحقق من الصورة والاسم والأسبوع وحدود الحقول.' : 'تعذر إتمام الطلب. حاول مرة أخرى.' }, status);
}
export async function GET(req: Request) {
  try {
    const { teacher } = await identify(req), data = await cachedConfig();
    return json({ success: true, teacher, champions: teacher ? data.champions : data.champions.filter(item => item.published), ...(teacher ? { revision: data.revision } : {}) });
  } catch (error) { return failure(error); }
}
export async function POST(req: Request) {
  try {
    const { teacher, uid } = await identify(req);
    if (!teacher) throw Error('FORBIDDEN');
    const body = await req.json();
    if (!body || !['save', 'visibility'].includes(body.action)) throw Error('INVALID');
    const result = await getFirebaseAdmin().adminDb.runTransaction(async tx => {
      const document = ref(), old = config((await tx.get(document)).data());
      if (body.revision !== old.revision) throw Error('CHANGED');
      let champions = old.champions;
      if (body.action === 'save') {
        const item = championInput({ ...body.champion, id: body.champion?.id || randomUUID() });
        const existing = champions.some(row => row.id === item.id);
        if (!existing && (!item.name || champions.length >= CHAMPIONS_LIMIT)) throw Error('INVALID');
        champions = existing ? champions.map(row => row.id === item.id ? item : row) : [item, ...champions];
      } else {
        if (typeof body.published !== 'boolean' || !champions.some(row => row.id === body.id)) throw Error('INVALID');
        champions = champions.map(row => row.id === body.id ? { ...row, published: body.published } : row);
      }
      const revision = randomUUID();
      tx.set(document, { champions, revision, updatedBy: uid });
      return { champions, revision };
    });
    revalidateTag(CHAMPIONS_TAG, { expire: 0 });
    return json({ success: true, ...result });
  } catch (error) { return failure(error); }
}
