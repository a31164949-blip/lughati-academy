export const HEART_TAG = 'heart-messages-v1';
export const HEART_LIMIT = 50;
export type HeartMessage = { id: string; title: string; studentName: string; showName: boolean; imageUrl: string; published: boolean };
export const HEART_SEEDS: HeartMessage[] = Array.from({ length: 5 }, (_, i) => ({ id: `letter-${i + 1}`, title: ['كلمات صنعت يومي', 'رسمة تحمل محبة', 'من القلب إلى المعلم', 'كلمات نعتز بها', 'محبة بخط صغير'][i], studentName: '', showName: false, imageUrl: `/heart-messages/letter-${i + 1}.webp`, published: true }));
export function heartInput(value: unknown): HeartMessage {
  if (!value || typeof value !== 'object') throw Error('INVALID');
  const d = value as Record<string, unknown>;
  if (typeof d.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(d.id) || typeof d.title !== 'string' || !d.title.trim() || d.title.trim().length > 100 || typeof d.studentName !== 'string' || d.studentName.trim().length > 90 || typeof d.showName !== 'boolean' || typeof d.published !== 'boolean' || typeof d.imageUrl !== 'string' || d.imageUrl.length > 1200) throw Error('INVALID');
  if (!HEART_SEEDS.some(item => item.imageUrl === d.imageUrl) && !/^https:\/\/res\.cloudinary\.com\/ffv5igmg\/image\/upload\/[^\s?#]+$/.test(d.imageUrl)) throw Error('INVALID');
  return { id: d.id, title: d.title.trim(), studentName: d.studentName.trim(), showName: d.showName, published: d.published, imageUrl: d.imageUrl };
}
export function publicHearts(items: HeartMessage[]) {
  return items.filter(item => item.published).map(({ id, title, imageUrl, studentName, showName }) => ({ id, title, imageUrl, studentName: showName ? studentName : '' }));
}
export type PublicHeart = ReturnType<typeof publicHearts>[number];
