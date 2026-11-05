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

export const LEARNING_DIALOGUE_ID = 'learning-dialogue-2026-11';
export const LEARNING_DIALOGUE_TOPIC = {
  title: 'نتحاور من أجل تقدّم أبنائنا',
  text: 'أبنائي الطلاب وأولياء الأمور الكرام، نرحّب بكم جميعًا في هذا الحوار، بمن فيكم أصحاب الحسابات المجمّدة.\n\nنريد أن نستمع إلى تجاربكم ومقترحاتكم لبناء خطوات عملية ترفع مستوى أبنائنا في القراءة والإملاء وتزيد ثقتهم بأنفسهم.\n\n١. ما أبرز صعوبة تواجه الطالب في القراءة أو الإملاء؟\n٢. ما الأسلوب الذي لاحظتم أنه يساعده على الفهم والتعلّم؟\n٣. كيف نجعل التدريب المنزلي قصيرًا ومنتظمًا وممتعًا؟\n٤. ما النشاط أو الدعم الذي تقترحونه داخل الفصل أو الأكاديمية؟\n\nشاركنا اقتراحًا عمليًا يمكننا تطبيقه معًا. ويمكن للطالب التعبير عن رأيه بمساعدة أسرته.\n\nيرجى تجنّب أسماء الطلاب والتفاصيل الشخصية في الردود العامة. اختر «المعلم فقط» إن أردت مناقشة وضع ابنك بشكل خاص. شكرًا لشراكتكم وحرصكم.',
  authorId: 'learning-dialogue-teacher',
  authorName: 'الأستاذ إبراهيم أحمد',
  authorRole: 'teacher',
  replyPolicy: 'choice',
  status: 'published',
  active: true,
  revision: 'learning-dialogue-initial-v1',
};
