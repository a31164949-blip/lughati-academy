export type StudentFrontNotice = { active: boolean; allowReplies: boolean; noticeId?: string; title: string; message: string; href: string; linkLabel: string };
export const EMPTY_STUDENT_NOTICE: StudentFrontNotice = { active: false, allowReplies: true, title: 'رسالة من معلمك', message: '', href: '', linkLabel: 'عرض التفاصيل' };
export function parseStudentNotice(value: unknown): StudentFrontNotice {
  if (!value || typeof value !== 'object') throw Error('INVALID');
  const data = value as Record<string, unknown>;
  if ((data.allowReplies !== undefined && typeof data.allowReplies !== 'boolean') || typeof data.active !== 'boolean') throw Error('INVALID');
  for (const [key, max] of [['title', 100], ['message', 1500], ['href', 500], ['linkLabel', 60]] as const) {
    if (typeof data[key] !== 'string' || data[key].length > max) throw Error('INVALID');
  }
  const result = { active: data.active, allowReplies: data.allowReplies !== false, title: (data.title as string).trim(), message: (data.message as string).trim(), href: (data.href as string).trim(), linkLabel: (data.linkLabel as string).trim() };
  // Same-site paths only; reject protocol-relative URLs and browser-normalized escapes.
  if (result.href && (!/^\/[A-Za-z0-9/?#&=_.%+-]*$/.test(result.href) || result.href.startsWith('//') || /%0[ad]|%5c/i.test(result.href))) throw Error('INVALID');
  if ((result.active && (!result.title || !result.message)) || (result.href && !result.linkLabel)) throw Error('INVALID');
  return result;
}
