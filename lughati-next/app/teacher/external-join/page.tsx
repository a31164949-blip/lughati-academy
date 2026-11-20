'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../../firebase';
import TeacherGuestWorksheets from '../../components/TeacherGuestWorksheets';

type Entry = { id: string; studentName: string; grade: string; classroom: string; note: string; status: string; createdAt: string };
export default function ExternalJoinRequestsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [rows, setRows] = useState<Entry[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<{ studentName: string; id: string; code: string } | null>(null);
  const [results, setResults] = useState<{ name: string; score: number; total: number }[]>([]);
  useEffect(() => onAuthStateChanged(auth, account => { setUser(account); setRows([]); setError(''); setInvite(null); setResults([]); }), []);
  async function load(account = user) {
    if (!account || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/external-grade-join', { cache: 'no-store', headers: { Authorization: 'Bearer ' + await account.getIdToken() } });
      const result = await response.json();
      if (!response.ok || !result.success) throw Error(result.message || 'تعذر التحميل.');
      setRows(result.requests);
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر التحميل.'); }
    finally { setBusy(false); }
  }
  async function change(entry: Entry, status: 'approved' | 'reviewed' | 'waiting' | 'declined') {
    if (!user || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/external-grade-join', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await user.getIdToken() }, body: JSON.stringify({ id: entry.id, status }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw Error(result.message || 'تعذر التحديث.');
      setRows(old => old.map(row => row.id === entry.id ? { ...row, status } : row));
      if (result.invitationCode) setInvite({ studentName: entry.studentName, id: entry.id, code: result.invitationCode });
      else if (invite?.id === entry.id) setInvite(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر التحديث.'); }
    finally { setBusy(false); }
  }
  async function loadResults() {
    if (!user || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/guest-competition?mode=results', { cache: 'no-store', headers: { Authorization: 'Bearer ' + await user.getIdToken() } });
      const result = await response.json();
      if (!response.ok || !result.success) throw Error(result.message || 'تعذر تحميل النتائج.');
      setResults(result.results);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر تحميل النتائج.'); }
    finally { setBusy(false); }
  }
  const invitationText = invite ? ['أهلًا بك في مسابقات أكاديمية لغتي!', 'الرابط: https://lughati-academy.duckdns.org/guest-competitions?requestId=' + encodeURIComponent(invite.id), 'رمز الدعوة: ' + invite.code, 'هذه العضوية لأوراق العمل والمسابقات والتحدي المباشر فقط.'].join(String.fromCharCode(10)) : '';
  return <main dir="rtl" style={{ minHeight: '100vh', background: '#f0fdf4', color: '#14532d', padding: 24 }}>
    <div style={{ maxWidth: 850, margin: 'auto' }}><Link href="/teacher">العودة إلى لوحة المعلم</Link><h1>طلبات عضوية التحديات والمسابقات</h1><p>العضوية المطلوبة مقتصرة على التحديات والمسابقات. الطلبات لا تنشئ حسابات؛ ولا تتيح الواجبات أو الخدمات الأخرى. عند القبول يصدر رمز دعوة خاص بالدخول إلى مساحة المسابقات فقط.</p>
      <button disabled={!user || busy} onClick={() => void load()} style={button}>عرض / تحديث آخر 30 طلبًا</button>
      {invite && <aside style={{ padding: 18, marginTop: 14, background: '#dcfce7', borderRadius: 14, border: '1px solid #86efac' }}>
        <strong>رمز الدعوة للطالب: {invite.studentName}</strong>
        <p>يظهر الرمز عند القبول فقط. انسخه وأرسله إلى ولي الأمر بوسيلة خاصة. لا تشاركه في مجموعة عامة.</p>
        <code dir="ltr" style={{ display: 'block', overflowWrap: 'anywhere', padding: 10 }}>{invite.code}</code>
        <button type="button" onClick={() => void navigator.clipboard.writeText(invitationText)} style={button}>نسخ رسالة الدعوة</button>
      </aside>}
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      {rows.map(row => <article key={row.id} style={{ padding: 18, marginTop: 14, background: 'white', borderRadius: 16, border: '1px solid #c6e7d2' }}><h2>{row.studentName}</h2><p>{row.grade}{row.classroom ? ' — ' + row.classroom : ''}</p><p>الحالة: {row.status === 'pending' ? 'بانتظار المراجعة' : row.status === 'reviewed' ? 'تم الاطلاع' : row.status === 'waiting' ? 'قائمة انتظار' : row.status === 'approved' ? 'مقبول للمسابقات فقط' : 'لم يقبل الطلب'}</p><p>{row.note || 'لا توجد رسالة.'}</p><small>{row.createdAt ? new Date(row.createdAt).toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' }) : ''}</small><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>{([{ status: 'approved', label: 'قبول عضوية المسابقات وإصدار دعوة' }, { status: 'reviewed', label: 'تم الاطلاع' }, { status: 'waiting', label: 'قائمة الانتظار' }, { status: 'declined', label: 'عدم القبول' }] as const).map(item => <button key={item.status} disabled={busy || row.status === item.status} onClick={() => void change(row, item.status)} style={button}>{item.label}</button>)}</div></article>)}
      <TeacherGuestWorksheets user={user} />
      <section style={{ marginTop: 28 }}>
        <h2>نتائج مسابقة الضيوف</h2>
        <button type="button" disabled={!user || busy} onClick={() => void loadResults()} style={button}>تحميل آخر نتائج المسابقة</button>
        {results.map((result, i) => <p key={i}>{result.name}: {result.score} من {result.total}</p>)}
      </section>
      {!rows.length && !busy && <p>اضغط على «عرض الطلبات» لمراجعة الطلبات الواردة.</p>}
    </div>
  </main>;
}
const button: React.CSSProperties = { padding: '10px 16px', background: '#047857', color: '#fff', borderRadius: 10, border: 0, cursor: 'pointer' };
