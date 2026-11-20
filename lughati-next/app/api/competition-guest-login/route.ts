import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '../../../firebase-admin';
import { issueCompetitionSession } from '../../lib/competitionGuestSession';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 4096) return NextResponse.json({ message: 'بيانات غير صالحة.' }, { status: 400 });
    const { id, code, turnstileToken } = JSON.parse(raw) as Record<string, unknown>;
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return NextResponse.json({ message: 'الدخول متوقف لحين تفعيل الحماية.' }, { status: 503 });
    if (typeof turnstileToken !== 'string' || !turnstileToken || turnstileToken.length > 2048) return NextResponse.json({ message: 'أكمل التحقق الأمني.' }, { status: 400 });
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id) || typeof code !== 'string' || !/^[A-Za-z0-9_-]{32}$/.test(code))
      return NextResponse.json({ message: 'رمز الدعوة غير صحيح.' }, { status: 401 });
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret, response: turnstileToken }), signal: AbortSignal.timeout(8000) });
    if (!result.ok || (await result.json()).success !== true) return NextResponse.json({ message: 'تعذر التحقق الأمني.' }, { status: 403 });
    const { adminDb } = getFirebaseAdmin({ allowSuspended: true });
    const snap = await adminDb.collection('externalGradeJoinRequests').doc(id).get();
    const data = snap.data();
    const actual = createHash('sha256').update(code).digest();
    const expected = typeof data?.inviteHash === 'string' && /^[0-9a-f]{64}$/.test(data.inviteHash) ? Buffer.from(data.inviteHash, 'hex') : Buffer.alloc(32);
    if (!snap.exists || data?.status !== 'approved' || data?.membershipScope !== 'competitions-only' || !timingSafeEqual(actual, expected))
      return NextResponse.json({ message: 'الدعوة غير صالحة أو أُلغي قبولها.' }, { status: 401 });
    const token = issueCompetitionSession(id);
    return NextResponse.json({ success: true, token }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'تعذر تسجيل الدخول.' }, { status: 500 });
  }
}
