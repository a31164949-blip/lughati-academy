import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

const durationSeconds = 2 * 60 * 60;
function secret() {
  const value = process.env.COMPETITION_GUEST_SESSION_SECRET;
  if (!value || value.length < 32) throw Error('GUEST_SESSION_NOT_CONFIGURED');
  return value;
}
function signature(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}
export function issueCompetitionSession(id: string) {
  const payload = Buffer.from(JSON.stringify({ id, exp: Math.floor(Date.now() / 1000) + durationSeconds })).toString('base64url');
  return payload + '.' + signature(payload);
}
export function verifyCompetitionSession(token: string) {
  if (typeof token !== 'string' || token.length > 1024) throw Error('FORBIDDEN');
  const parts = token.split('.');
  if (parts.length !== 2) throw Error('FORBIDDEN');
  const [payload, mac] = parts;
  const expected = Buffer.from(signature(payload));
  const actual = Buffer.from(mac);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw Error('FORBIDDEN');
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (typeof data?.id !== 'string' || !/^[0-9a-f-]{36}$/.test(data.id) || !Number.isInteger(data.exp) || data.exp <= Math.floor(Date.now() / 1000)) throw Error('FORBIDDEN');
  return data.id as string;
}
