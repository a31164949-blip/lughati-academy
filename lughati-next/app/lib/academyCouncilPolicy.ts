export const COUNCIL_TOPIC_LIMIT = 3000;
export const COUNCIL_REPLY_LIMIT = 800;
export type CouncilTopic = {
  id: string; title: string; text: string; authorRole: 'teacher' | 'student'; authorName: string;
  own: boolean; replyPolicy: 'choice' | 'public' | 'teacher'; status: string; active: boolean; revision?: string;
};
export type CouncilReply = { id: string; text: string; name: string; visibility: string; status: string; teacherReply: string; revision?: string };
export const validCouncilId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
export function councilTopicInput(body: Record<string, unknown>, teacher: boolean) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!title || title.length > 120 || !text || text.length > COUNCIL_TOPIC_LIMIT) throw Error('INVALID');
  if (!teacher && body.replyPolicy !== 'public' && body.replyPolicy !== 'teacher') throw Error('INVALID');
  return { title, text, replyPolicy: teacher ? 'choice' as const : body.replyPolicy as 'public' | 'teacher' };
}
export function councilReplyVisibility(topic: { authorRole?: unknown; replyPolicy?: unknown }, requested: unknown) {
  if (topic.authorRole === 'teacher') {
    if (requested !== 'private' && requested !== 'public') throw Error('INVALID');
    return requested;
  }
  return topic.replyPolicy === 'public' ? 'public' : 'private';
}
export function canReadCouncilTopic(topic: Record<string, unknown>, teacher: boolean, userId: string) {
  return teacher || topic.status === 'published' || topic.authorId === userId;
}
export function canReadCouncilReply(topic: Record<string, unknown>, reply: Record<string, unknown>, teacher: boolean, userId: string) {
  return teacher || reply.studentId === userId || (topic.status === 'published' && topic.replyPolicy !== 'teacher' && reply.visibility === 'public' && reply.status === 'published');
}
