import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getFirebaseAdmin } from '../../../../firebase-admin';
import { CONTINUATION_ROUND, CONTINUATION_SEATS_TAG, continuationSeats, acceptedStudentIds } from '../../../lib/academyContinuation';

export const runtime = 'nodejs';
// Cache one aggregate number for all visitors; never fetch or expose private letters.
const getSeats = unstable_cache(async () => {
  const { adminDb } = getFirebaseAdmin({ allowSuspended: true });
  const round = adminDb.collection('academyContinuationRounds').doc(CONTINUATION_ROUND);
  const [result, metadata] = await Promise.all([round.collection('requests').where('isTrial', '==', false).count().get(), round.get()]);
  return continuationSeats(result.data().count, acceptedStudentIds(metadata.data()).length);
}, ['continuation-seats-teacher-decisions-v2', CONTINUATION_ROUND], { revalidate: 60, tags: [CONTINUATION_SEATS_TAG] });

export async function GET() {
  try {
    return NextResponse.json({ success: true, ...await getSeats() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // An unavailable count must never be replaced by an invented full-capacity value.
    return NextResponse.json({ success: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
