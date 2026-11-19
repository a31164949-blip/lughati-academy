import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '../../../firebase-admin';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 1000) return NextResponse.json({ message: 'بيانات غير صالحة.' }, { status: 400 });
    const { id, code } = JSON.parse(raw) as Record<string, unknown>;
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id) || typeof code !== 'string' || !/^[A-Za-z0-9_-]{32}$/.test(code))
      return NextResponse.json({ message: 'رمز الدعوة غير صحيح.' }, { status: 401 });
    const { adminDb, adminAuth } = getFirebaseAdmin({ allowCompetitionGuest: true });
    const snap = await adminDb.collection('externalGradeJoinRequests').doc(id).get();
    const data = snap.data();
    const actual = createHash('sha256').update(code).digest();
    const expected = typeof data?.inviteHash === 'string' && /^[0-9a-f]{64}$/.test(data.inviteHash) ? Buffer.from(data.inviteHash, 'hex') : Buffer.alloc(32);
    if (!snap.exists || data?.status !== 'approved' || data?.membershipScope !== 'competitions-only' || !timingSafeEqual(actual, expected))
      return NextResponse.json({ message: 'الدعوة غير صالحة أو أُلغي قبولها.' }, { status: 401 });
    const token = await adminAuth.createCustomToken('contest-' + id, { role: 'competition_guest', competitionRequestId: id });
    return NextResponse.json({ success: true, token }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'تعذر تسجيل الدخول.' }, { status: 500 });
  }
}
