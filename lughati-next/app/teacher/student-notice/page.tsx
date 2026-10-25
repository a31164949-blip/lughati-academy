'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../firebase';
import { EMPTY_STUDENT_NOTICE, type StudentFrontNotice } from '../../lib/studentFrontNotice';
import { TeacherNoticeReplies } from '../../components/StudentNoticeReplies';
import { StudentNoticeBanner } from '../../components/StudentFrontNotice';
export default function StudentNoticeEditor() {
  const [notice, setNotice] = useState<StudentFrontNotice>(EMPTY_STUDENT_NOTICE);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setReady(false);
      if (!user) { setMessage('سجّل الدخول بحساب المعلم.'); return; }
      try {
        const response = await fetch('/api/student-front-notice', { headers: { Authorization: 'Bearer ' + await user.getIdToken() }, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.teacher) throw Error('هذه الصفحة متاحة للمعلم فقط.');
        if (alive) { setNotice(data.notice ?? EMPTY_STUDENT_NOTICE); setReady(true); setMessage(''); }
      } catch (error) { if (alive) setMessage(error instanceof Error ? error.message : 'تعذر التحميل.'); }
    });
    return () => { alive = false; unsubscribe(); };
  }, [retry]);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw Error('سجّل الدخول بحساب المعلم.');
      const response = await fetch('/api/student-front-notice', { method: 'PUT', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(notice) });
      const data = await response.json();
      if (!response.ok) throw Error(data.message);
      setNotice(data.notice); setMessage(data.notice.active ? 'تم النشر. يظهر التنبيه للطلاب عند فتح صفحة رحلتي أو العودة إليها.' : 'تم الحفظ وإخفاء التنبيه عن الطلاب.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر الحفظ.'); }
    finally { setBusy(false); }
  }
  return <main dir="rtl" className="mx-auto w-full max-w-3xl p-5 text-emerald-950"><Link href="/teacher">← لوحة المعلم</Link><h1 className="my-5 text-2xl font-bold">📣 رسالة واجهة الطالب</h1><p className="mb-5 leading-8">اكتب ملاحظة تظهر أعلى صفحة «رحلتي» للمقبولين في الأكاديمية. تبقى ظاهرة حتى تخفيها أو تستبدلها.</p>
    <p role="status" className="my-3">{message}</p>
    {!ready ? <button onClick={() => setRetry(x => x + 1)}>إعادة التحميل</button> : <form onSubmit={save} className="space-y-5 rounded-2xl border bg-white p-5">
      <fieldset disabled={busy} className="space-y-5"><label className="block font-bold"><input type="checkbox" checked={notice.active} onChange={e => setNotice({ ...notice, active: e.target.checked })} /> إظهار التنبيه للطلاب</label>
      <label className="block font-bold"><input type="checkbox" checked={notice.allowReplies} onChange={e => setNotice({ ...notice, allowReplies: e.target.checked })} /> السماح للطلاب بالرد بشكل خاص للمعلم</label>
      <label className="block">العنوان<input className="mt-2 block w-full rounded-lg border p-3" maxLength={100} required={notice.active} value={notice.title} onChange={e => setNotice({ ...notice, title: e.target.value })} /></label>
      <label className="block">نص الملاحظة<textarea className="mt-2 block w-full rounded-lg border p-3" rows={5} maxLength={1500} required={notice.active} placeholder="مثال: ننتظر رأيكم في التصويت، ونرحب بمشاركتكم في موضوع المجلس." value={notice.message} onChange={e => setNotice({ ...notice, message: e.target.value })} /><small>{notice.message.length} / ١٥٠٠</small></label>
      <label className="block">رابط داخل الأكاديمية (اختياري)<input dir="ltr" className="mt-2 block w-full rounded-lg border p-3" maxLength={500} placeholder="/discussion" value={notice.href} onChange={e => setNotice({ ...notice, href: e.target.value })} /></label>
      <div className="flex flex-wrap gap-3"><button type="button" onClick={() => setNotice({ ...notice, href: '/discussion', linkLabel: 'الدخول إلى النقاش' })}>إضافة رابط المجلس</button><button type="button" onClick={() => setNotice({ ...notice, href: '/journey', linkLabel: 'المشاركة في التصويت' })}>إضافة رابط التصويت</button></div>
      <label className="block">نص زر الرابط<input className="mt-2 block w-full rounded-lg border p-3" maxLength={60} required={!!notice.href} value={notice.linkLabel} onChange={e => setNotice({ ...notice, linkLabel: e.target.value })} /></label>
      <button className="rounded-xl bg-emerald-800 px-6 py-3 font-bold text-white" type="submit">{busy ? 'جارٍ الحفظ…' : 'حفظ التنبيه'}</button></fieldset>
    </form>}
    {ready && notice.noticeId && <TeacherNoticeReplies key={notice.noticeId} noticeId={notice.noticeId} />}
    {ready && <><h2 className="mt-8 font-bold">معاينة الشكل</h2><StudentNoticeBanner notice={notice} /></>}
  </main>;
}
