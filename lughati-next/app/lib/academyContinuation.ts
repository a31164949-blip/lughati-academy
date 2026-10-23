export const CONTINUATION_ROUND = 'reopening-2026-10';
export const CONTINUATION_OPEN = true;
export const ACADEMY_CAPACITY = 20;
export const CONTINUATION_SEATS_TAG = `continuation-seats-${CONTINUATION_ROUND}`;
export function continuationSeats(registered: number) {
  if (!Number.isSafeInteger(registered) || registered < 0) throw Error('INVALID_COUNT');
  return { capacity: ACADEMY_CAPACITY, registered, remaining: Math.max(0, ACADEMY_CAPACITY - registered) };
}
export const CONTINUATION_MESSAGE_LIMIT = 1000;
export type ContinuationProfile = { studentName: string; classroom: string };
export type ContinuationRequest = ContinuationProfile & { id: string; message: string; wantsToContinue: boolean; status: 'new' | 'reviewed'; revision: string; updatedAt: string; isTrial: boolean };
export const validContinuationId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
export function continuationInput(body: unknown) {
  if (!body || typeof body !== 'object' || !('wantsToContinue' in body) || body.wantsToContinue !== true) throw Error('CONSENT');
  const value = body as Record<string, unknown>;
  if (value.message !== undefined && typeof value.message !== 'string') throw Error('INVALID');
  const message = typeof value.message === 'string' ? value.message.trim() : '';
  if (message.length > CONTINUATION_MESSAGE_LIMIT) throw Error('INVALID');
  return { message, wantsToContinue: true };
}
