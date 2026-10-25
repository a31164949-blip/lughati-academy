'use client';
import { useState, type FormEvent } from 'react';
import { auth } from '../../firebase';
type Reply = { id: string; text: string; studentName: string; classroom: string; updatedAt: string };
async function request(noticeId: string, method = 'GET', text?: string, cursor?: string) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw Error('سجّل الدخول أولًا.');
  const url = '/api/student-front-notice/replies?noticeId=' + encodeURIComponent(noticeId) + (cursor ? '&cursor=' + encodeURIComponent(cursor) : '');
  const response = await fetch(url, { method, cache: 'no-store', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify({ noticeId, text }) : undefined });
  const data = await response.json();
  if (!response.ok) throw Error(data.message ?? 'تعذر تحميل الردود.');
  return data;
}
export default function StudentNoticeReplies({ noticeId, allowReplies }: { noticeId: string; allowReplies: boolean }) {
  const [open, setOpen] = useState(false), [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false);
  const [text, setText] = useState(''), [message, setMessage] = useState('');
  async function load() {
    setBusy(true); setMessage('');
    try { const data = await request(noticeId); setText(data.reply?.text ?? ''); setLoaded(true); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر التحميل.'); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await request(noticeId, 'POST', text); setMessage('تم إرسال ردّك للمعلم بشكل خاص. يمكنك تحديثه من هنا.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر الإرسال.'); }
    finally { setBusy(false); }
  }
  return <section className="mt-4 border-t border-amber-300 pt-4">
    <button type="button" className="rounded-xl border border-emerald-700 px-4 py-2 font-bold" aria-expanded={open} onClick={() => { setOpen(!open); if (!open && !loaded) void load(); }}>{allowReplies ? '💬 الرد على رسالة المعلم' : '💬 عرض ردّي — الردود مغلقة'}</button>
    {open && <div className="mt-3"><p className="mb-3 text-sm">ردّك خاص بك وبالمعلم، ولا يظهر لبقية الطلاب.</p><p role="status">{message}</p>{!loaded ? <button type="button" disabled={busy} onClick={() => void load()}>{busy ? 'جارٍ التحميل…' : 'إعادة المحاولة'}</button> : <form onSubmit={save}><label className="block">ردّك<textarea className="my-2 block w-full rounded-xl border bg-white p-3" value={text} rows={3} maxLength={800} required disabled={busy || !allowReplies} onChange={e => setText(e.target.value)} /></label><small>{text.length} / ٨٠٠</small>{allowReplies && <button type="submit" className="mr-4 rounded-xl bg-emerald-800 px-4 py-2 text-white" disabled={busy}>{busy ? 'جارٍ الإرسال…' : 'إرسال / تحديث الرد'}</button>}</form>}</div>}
  </section>;
}
export function TeacherNoticeReplies({ noticeId }: { noticeId: string }) {
  const [rows, setRows] = useState<Reply[]>([]), [cursor, setCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function load(more = false) {
    setBusy(true); setMessage('');
    try { const data = await request(noticeId, 'GET', undefined, more ? cursor ?? undefined : undefined); setRows(old => more ? [...old, ...data.replies] : data.replies); setCursor(data.cursor); setLoaded(true); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر تحميل الردود.'); }
    finally { setBusy(false); }
  }
  return <section className="mt-8 rounded-2xl border bg-white p-5"><h2 className="mb-3 text-xl font-bold">💬 ردود الطلاب على الرسالة المحفوظة</h2><p className="mb-3 text-sm">الردود خاصة بك. عند تغيير نص الرسالة تبدأ مجموعة ردود مستقلة، وتبقى الردود السابقة محفوظة.</p><button type="button" disabled={busy} onClick={() => void load()} className="rounded-xl border px-4 py-2">{busy ? 'جارٍ التحميل…' : loaded ? 'تحديث الردود' : 'عرض ردود الطلاب'}</button><p role="status">{message}</p>{loaded && !rows.length && <p className="mt-3">لا توجد ردود حتى الآن.</p>}{rows.map(row => <article key={row.id} className="mt-4 rounded-xl border p-4"><h3 className="font-bold">{row.studentName} — {row.classroom}</h3><p className="whitespace-pre-wrap break-words leading-8">{row.text}</p>{row.updatedAt && <time className="text-sm" dateTime={row.updatedAt}>{new Date(row.updatedAt).toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}</time>}</article>)}{cursor && <button type="button" disabled={busy} onClick={() => void load(true)} className="mt-4 rounded-xl border px-4 py-2">عرض المزيد</button>}</section>;
}
