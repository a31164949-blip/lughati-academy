export const CONTINUATION_ROUND = 'reopening-2026-10';
export const CONTINUATION_OPEN = true;
export const ACADEMY_CAPACITY = 20;
export const CONTINUATION_SEATS_TAG = `continuation-seats-${CONTINUATION_ROUND}`;
export const ADMISSION_ACCESS_TAG = `academy-admission-access-${CONTINUATION_ROUND}`;
export type AdmissionStatus = 'pending' | 'accepted' | 'waiting' | 'declined';
export const ADMISSION_LABELS: Record<AdmissionStatus, string> = { pending: 'بانتظار قرار المعلم', accepted: 'مقبول بقرار المعلم', waiting: 'على قائمة الانتظار', declined: 'لم يُقبل الطلب حاليًا' };
export function admissionStatus(value: unknown): AdmissionStatus {
  return value === 'accepted' || value === 'waiting' || value === 'declined' ? value : 'pending';
}
export function acceptedStudentIds(data: { acceptedStudentIds?: unknown } | undefined): string[] {
  const ids = data?.acceptedStudentIds;
  if (ids === undefined) return [];
  if (!Array.isArray(ids) || !ids.every(validContinuationId)) throw Error('INVALID_ADMISSIONS');
  const unique = [...new Set(ids)] as string[];
  if (unique.length > ACADEMY_CAPACITY) throw Error('INVALID_ADMISSIONS');
  return unique;
}
export function continuationSeats(registered: number, accepted: number) {
  if (![registered, accepted].every(value => Number.isSafeInteger(value) && value >= 0) || accepted > ACADEMY_CAPACITY) throw Error('INVALID_COUNT');
  return { capacity: ACADEMY_CAPACITY, registered, accepted, remaining: ACADEMY_CAPACITY - accepted };
}
export const CONTINUATION_MESSAGE_LIMIT = 1000;
export type ContinuationProfile = { studentName: string; classroom: string };
export type ContinuationRequest = ContinuationProfile & { id: string; message: string; wantsToContinue: boolean; status: 'new' | 'reviewed'; admissionStatus: AdmissionStatus; revision: string; teacherReply?: string; teacherReplyAt?: string; updatedAt: string; isTrial: boolean };
export const validContinuationId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
export function continuationInput(body: unknown) {
  if (!body || typeof body !== 'object' || !('wantsToContinue' in body) || body.wantsToContinue !== true) throw Error('CONSENT');
  const value = body as Record<string, unknown>;
  if (value.message !== undefined && typeof value.message !== 'string') throw Error('INVALID');
  const message = typeof value.message === 'string' ? value.message.trim() : '';
  if (message.length > CONTINUATION_MESSAGE_LIMIT) throw Error('INVALID');
  return { message, wantsToContinue: true };
}
