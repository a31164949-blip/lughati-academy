import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { revalidateTag, unstable_cache } from 'next/cache';
import { getFirebaseAdmin } from '../../../firebase-admin';
import { HEART_TAG, HEART_LIMIT, HEART_SEEDS, heartInput, publicHearts } from '../../lib/heartMessages';
export const runtime = 'nodejs';
const ref = () => getFirebaseAdmin().adminDb.collection('academyDisplaySettings').doc('heartMessages');
function config(data: FirebaseFirestore.DocumentData | undefined) {
  if (!data) return { items: HEART_SEEDS, revision: 'seed-v1' };
  if (!Array.isArray(data.items) || data.items.length > HEART_LIMIT || typeof data.revision !== 'string') throw Error('CONFIG');
  const items = data.items.map(heartInput);
  if (new Set(items.map(item => item.id)).size !== items.length) throw Error('CONFIG');
  return { items, revision: data.revision };
}
const cached = unstable_cache(async () => config((await ref().get()).data()), [HEART_TAG], { revalidate: 300, tags: [HEART_TAG] });
async function teacher(req: Request) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw Error('UNAUTHORIZED');
  let token;
  try { token = await getFirebaseAdmin().adminAuth.verifyIdToken(header.slice(7)); } catch { throw Error('UNAUTHORIZED'); }
  if (token.role !== 'teacher' && token.role !== 'admin' && token.email?.toLowerCase() !== 'a31164949@gmail.com') throw Error('FORBIDDEN');
  return token.uid;
}
function json(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } }); }
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  const status = code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' ? 403 : code === 'CHANGED' ? 409 : code === 'INVALID' || error instanceof SyntaxError ? 400 : 503;
  return json({ success: false, message: code === 'CHANGED' ? 'تغيّرت الرسائل. حدّث القائمة قبل الحفظ.' : code === 'INVALID' ? 'تحقق من العنوان والصورة وحدود الحقول.' : 'تعذر إتمام الطلب. حاول مرة أخرى.' }, status);
}
export async function GET(req: Request) {
  try {
    if (new URL(req.url).searchParams.get('manage') === '1') { await teacher(req); return json({ success: true, ...config((await ref().get()).data()) }); }
    return json({ success: true, items: publicHearts((await cached()).items) });
  } catch (error) { return failure(error); }
}
export async function POST(req: Request) {
  try {
    const uid = await teacher(req);
    const raw = await req.text();
    if (raw.length > 10000) throw Error('INVALID');
    const body = JSON.parse(raw);
    if (!body || !['save', 'visibility'].includes(body.action)) throw Error('INVALID');
    const result = await getFirebaseAdmin().adminDb.runTransaction(async tx => {
      const document = ref(), old = config((await tx.get(document)).data());
      if (body.revision !== old.revision) throw Error('CHANGED');
      let items = old.items;
      if (body.action === 'save') {
        const item = heartInput({ ...body.item, id: body.item?.id || randomUUID() });
        const exists = items.some(row => row.id === item.id);
        if (!exists && items.length >= HEART_LIMIT) throw Error('INVALID');
        items = exists ? items.map(row => row.id === item.id ? item : row) : [item, ...items];
      } else {
        if (typeof body.published !== 'boolean' || !items.some(row => row.id === body.id)) throw Error('INVALID');
        items = items.map(row => row.id === body.id ? { ...row, published: body.published } : row);
      }
      const revision = randomUUID();
      tx.set(document, { items, revision, updatedBy: uid });
      return { items, revision };
    });
    revalidateTag(HEART_TAG, { expire: 0 });
    return json({ success: true, ...result });
  } catch (error) { return failure(error); }
}
