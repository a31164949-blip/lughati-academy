import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { FieldPath, FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '../../../firebase-admin';
import { canReadCouncilTopic, canReadCouncilReply, councilTopicInput, councilReplyVisibility, validCouncilId, COUNCIL_REPLY_LIMIT } from '../../lib/academyCouncilPolicy';
export const runtime = 'nodejs';

async function identity(req: Request) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw Error('UNAUTHORIZED');
  // The council is a narrow communication service available during the student pause.
  const { adminAuth, adminDb: db } = getFirebaseAdmin({ allowSuspended: true });
  const token = await adminAuth.verifyIdToken(header.slice(7));
  const teacher = token.role === 'teacher' || token.role === 'admin' || token.email?.toLowerCase() === 'a31164949@gmail.com';
  if (teacher) return { db, teacher: true, id: token.uid, name: 'المعلم' };
  if (token.role !== 'student' || !validCouncilId(token.studentDocId)) throw Error('FORBIDDEN');
  const snapshot = await db.collection('students').doc(token.studentDocId).get();
  const student = snapshot.data();
  if (!student || student.active === false || student.deleted === true) throw Error('FORBIDDEN');
  const control = student.accessControl;
  const until = control?.until?.toMillis?.();
  if (control?.mode === 'account' && (until == null || until > Date.now())) throw Error('FORBIDDEN');
  return { db, teacher: false, id: token.studentDocId, name: String(student.studentName ?? student.name ?? 'عضو').slice(0, 150) };
}
function json(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } }); }
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  const status = code === 'UNAUTHORIZED' || code.includes('auth/') ? 401 : code === 'FORBIDDEN' ? 403 : ['INVALID', 'CLOSED', 'CHANGED'].includes(code) || error instanceof SyntaxError ? 400 : ['PENDING', 'WAIT'].includes(code) ? 409 : 500;
  const messages: Record<string, string> = { UNAUTHORIZED: 'سجّل دخولك لزيارة مجلس الأكاديمية.', FORBIDDEN: 'هذا الإجراء غير متاح لهذا الحساب.', INVALID: 'تحقق من الحقول وحدود النص وخيار الخصوصية.', CLOSED: 'الموضوع غير منشور أو مغلق للردود.', CHANGED: 'تغيّر المحتوى منذ عرضه. حدّثه وراجعه قبل الاعتماد.', PENDING: 'لديك موضوع ينتظر مراجعة المعلم. راجع تبويب مواضيعي.', WAIT: 'انتظر قليلًا قبل إرسال مشاركة أخرى.' };
  return json({ success: false, message: messages[code] ?? 'تعذر إتمام الطلب. تحقق من الاتصال وحاول مجددًا.' }, status);
}
function topicDto(id: string, data: Record<string, unknown>, teacher: boolean, userId: string) {
  const own = data.authorId === userId;
  return { id, title: data.title, text: data.text, authorRole: data.authorRole, authorName: teacher ? data.authorName : data.authorRole === 'teacher' ? 'المعلم' : own ? 'موضوعك' : 'أحد أعضاء الأكاديمية', own, replyPolicy: data.replyPolicy, status: data.status, active: data.active === true, revision: teacher || own ? data.revision : undefined };
}
function replyDto(id: string, data: Record<string, unknown>, teacher: boolean, userId: string) {
  return { id, text: data.text, visibility: data.visibility, status: data.status, name: teacher ? data.name : data.studentId === userId ? 'ردّك' : 'أحد أعضاء الأكاديمية', teacherReply: typeof data.teacherReply === 'string' ? data.teacherReply : '', revision: teacher ? data.revision : undefined };
}

export async function GET(req: Request) {
  try {
    const { db, teacher, id } = await identity(req);
    const url = new URL(req.url);
    const topicId = url.searchParams.get('topicId');
    const cursor = url.searchParams.get('cursor');
    if (cursor && !validCouncilId(cursor)) throw Error('INVALID');
    const topics = db.collection('academyCouncilTopics');
    if (topicId) {
      if (!validCouncilId(topicId)) throw Error('INVALID');
      const saved = await topics.doc(topicId).get();
      const topic = saved.data();
      if (!topic || !canReadCouncilTopic(topic, teacher, id)) throw Error('FORBIDDEN');
      const replies = saved.ref.collection('replies');
      let query = (teacher ? replies : replies.where('status', '==', 'published')).orderBy(FieldPath.documentId()).limit(10);
      if (cursor) query = query.startAfter(cursor);
      const canList = teacher || (topic.status === 'published' && topic.replyPolicy !== 'teacher');
      const [rows, own] = await Promise.all([canList ? query.get() : null, teacher ? null : replies.doc(id).get()]);
      const visible = rows?.docs.filter(row => canReadCouncilReply(topic, row.data(), teacher, id)) ?? [];
      return json({ success: true, teacher, topic: topicDto(saved.id, topic, teacher, id), replies: visible.map(row => replyDto(row.id, row.data(), teacher, id)), mine: own?.exists ? replyDto(own.id, own.data()!, false, id) : null, cursor: rows?.size === 10 ? rows.docs[9].id : null });
    }
    const view = url.searchParams.get('view') ?? (teacher ? 'pending' : 'published');
    if (!['published', 'pending', 'mine', 'all'].includes(view) || (!teacher && ['pending', 'all'].includes(view))) throw Error('FORBIDDEN');
    let query = (view === 'mine' ? topics.where('authorId', '==', id) : view === 'all' ? topics : topics.where('status', '==', view === 'pending' ? 'pending' : 'published')).orderBy(FieldPath.documentId()).limit(10);
    if (cursor) query = query.startAfter(cursor);
    const rows = await query.get();
    return json({ success: true, teacher, topics: rows.docs.filter(row => canReadCouncilTopic(row.data(), teacher, id)).map(row => topicDto(row.id, row.data(), teacher, id)), cursor: rows.size === 10 ? rows.docs[9].id : null });
  } catch (error) { return failure(error); }
}

export async function POST(req: Request) {
  try {
    const { db, teacher, id, name } = await identity(req);
    const body = await req.json();
    if (!body || typeof body !== 'object') throw Error('INVALID');
    if (body.action === 'createTopic') {
      const input = councilTopicInput(body, teacher);
      const topicId = `${9999999999999 - Date.now()}_${randomUUID()}`;
      const ref = db.collection('academyCouncilTopics').doc(topicId);
      await db.runTransaction(async tx => {
        const authorRef = db.collection('academyCouncilAuthors').doc(id);
        const author = teacher ? null : await tx.get(authorRef);
        if (author?.data()?.pendingTopicId) throw Error('PENDING');
        if (!teacher && Date.now() - (author?.data()?.lastSubmittedAt ?? 0) < 30000) throw Error('WAIT');
        tx.set(ref, { ...input, authorId: id, authorName: name, authorRole: teacher ? 'teacher' : 'student', status: teacher ? 'published' : 'pending', active: true, revision: randomUUID(), createdAt: FieldValue.serverTimestamp() });
        if (!teacher) tx.set(authorRef, { pendingTopicId: topicId, lastSubmittedAt: Date.now() }, { merge: true });
      });
      return json({ success: true, topicId, message: teacher ? 'نُشر موضوعك في المجلس.' : 'وصل موضوعك للمعلم، وسيظهر للأعضاء بعد اعتماده.' });
    }
    if (body.action !== 'reply' || teacher || !validCouncilId(body.topicId)) throw Error('INVALID');
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text || text.length > COUNCIL_REPLY_LIMIT) throw Error('INVALID');
    await db.runTransaction(async tx => {
      const topic = await tx.get(db.collection('academyCouncilTopics').doc(body.topicId));
      const data = topic.data();
      if (!data || data.status !== 'published' || data.active !== true) throw Error('CLOSED');
      const visibility = councilReplyVisibility(data, body.visibility);
      const ref = topic.ref.collection('replies').doc(id);
      const old = await tx.get(ref);
      if (Date.now() - (old.data()?.lastUpdatedAt ?? 0) < 10000) throw Error('WAIT');
      // Replacing a reply removes any earlier approval and teacher response.
      tx.set(ref, { text, visibility, status: visibility === 'public' ? 'pending' : 'private', name, studentId: id, revision: randomUUID(), lastUpdatedAt: Date.now(), updatedAt: FieldValue.serverTimestamp() });
    });
    return json({ success: true, message: 'حُفظ ردك. الرد العام ينتظر اعتماد المعلم.' });
  } catch (error) { return failure(error); }
}

export async function PATCH(req: Request) {
  try {
    const { db, teacher, id } = await identity(req);
    if (!teacher) throw Error('FORBIDDEN');
    const body = await req.json();
    if (!body || !validCouncilId(body.topicId)) throw Error('INVALID');
    await db.runTransaction(async tx => {
      const ref = db.collection('academyCouncilTopics').doc(body.topicId);
      const snapshot = await tx.get(ref);
      const topic = snapshot.data();
      if (!topic || topic.revision !== body.topicRevision) throw Error('CHANGED');
      if (['approveTopic', 'restoreTopic', 'hideTopic', 'toggleTopic'].includes(body.action)) {
        const authorRef = db.collection('academyCouncilAuthors').doc(String(topic.authorId));
        const author = topic.authorRole === 'student' ? await tx.get(authorRef) : null;
        if (body.action === 'toggleTopic') {
          if (topic.status !== 'published') throw Error('INVALID');
          tx.update(ref, { active: !topic.active, revision: randomUUID() });
        } else {
          if (body.action === 'approveTopic' && topic.status !== 'pending') throw Error('INVALID');
          if (body.action === 'restoreTopic' && topic.status !== 'hidden') throw Error('INVALID');
          const published = body.action !== 'hideTopic';
          tx.update(ref, { status: published ? 'published' : 'hidden', active: published, revision: randomUUID(), reviewedAt: FieldValue.serverTimestamp(), reviewedBy: id });
          if (author?.data()?.pendingTopicId === snapshot.id) tx.set(authorRef, { pendingTopicId: null }, { merge: true });
        }
        return;
      }
      if (!validCouncilId(body.replyId) || !['publishReply', 'hideReply', 'respond'].includes(body.action)) throw Error('INVALID');
      const replyRef = ref.collection('replies').doc(body.replyId);
      const reply = await tx.get(replyRef);
      const data = reply.data();
      if (!data || data.revision !== body.revision) throw Error('CHANGED');
      if (body.action === 'respond') {
        const teacherReply = typeof body.teacherReply === 'string' ? body.teacherReply.trim() : '';
        if (!teacherReply || teacherReply.length > 1500) throw Error('INVALID');
        tx.update(replyRef, { teacherReply, revision: randomUUID(), teacherRepliedAt: FieldValue.serverTimestamp() });
      } else {
        if (body.action === 'publishReply' && (data.visibility !== 'public' || topic.replyPolicy === 'teacher' || topic.status !== 'published')) throw Error('FORBIDDEN');
        tx.update(replyRef, { status: body.action === 'publishReply' ? 'published' : 'hidden', revision: randomUUID(), reviewedAt: FieldValue.serverTimestamp() });
      }
    });
    return json({ success: true, message: 'تم حفظ التغيير.' });
  } catch (error) { return failure(error); }
}
