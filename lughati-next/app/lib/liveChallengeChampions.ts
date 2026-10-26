export const CHAMPIONS_TAG = 'live-challenge-champions-v1';
export const CHAMPIONS_LIMIT = 100;
export type LiveChampion = { id: string; name: string; weekLabel: string; imageUrl: string; zoom: number; published: boolean };
export const SEED_CHAMPIONS: LiveChampion[] = [
  { id: 'champion-01', name: '', weekLabel: '', imageUrl: '/champions/champion-01.jpg', zoom: 1.2, published: true },
  { id: 'champion-02', name: '', weekLabel: '', imageUrl: '/champions/champion-02.jpg', zoom: 1.8, published: true },
];
export function championInput(body: unknown): LiveChampion {
  if (!body || typeof body !== 'object') throw Error('INVALID');
  const data = body as Record<string, unknown>;
  if (typeof data.id !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(data.id) || typeof data.name !== 'string' || data.name.trim().length > 90 || typeof data.weekLabel !== 'string' || data.weekLabel.trim().length > 40 || typeof data.imageUrl !== 'string' || data.imageUrl.length > 1200 || typeof data.zoom !== 'number' || !Number.isFinite(data.zoom) || data.zoom < 1 || data.zoom > 2.2 || typeof data.published !== 'boolean') throw Error('INVALID');
  const local = SEED_CHAMPIONS.some(item => item.imageUrl === data.imageUrl);
  if (!local && !/^https:\/\/res\.cloudinary\.com\/ffv5igmg\/image\/upload\/[^\s]+$/.test(data.imageUrl)) throw Error('INVALID');
  return { id: data.id, name: data.name.trim(), weekLabel: data.weekLabel.trim(), imageUrl: data.imageUrl, zoom: Math.round(data.zoom * 100) / 100, published: data.published };
}
