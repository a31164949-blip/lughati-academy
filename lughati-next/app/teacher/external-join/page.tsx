'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../../firebase';

type Entry = { id: string; studentName: string; grade: string; classroom: string; note: string; status: string; createdAt: string };
export default function ExternalJoinRequestsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [rows, setRows] = useState<Entry[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => onAuthStateChanged(auth, account => { setUser(account); setRows([]); setError(''); }), []);
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
  async function change(entry: Entry, status: 'reviewed' | 'waiting' | 'declined') {
    if (!user || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/external-grade-join', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await user.getIdToken() }, body: JSON.stringify({ id: entry.id, status }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw Error(result.message || 'تعذر التحديث.');
      setRows(old => old.map(row => row.id === entry.id ? { ...row, status } : row));
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر التحديث.'); }
    finally { setBusy(false); }
  }
  return <main dir="rtl" style={{ minHeight: '100vh', background: '#f0fdf4', color: '#14532d', padding: 24 }}>
    <div style={{ maxWidth: 850, margin: 'auto' }}><Link href="/teacher">العودة إلى لوحة المعلم</Link><h1>طلبات عضوية التحديات والمسابقات</h1><p>العضوية المطلوبة مقتصرة على التحديات والمسابقات. الطلبات لا تنشئ حسابات؛ وأزرار المراجعة والانتظار وعدم القبول لا تمنح دخولًا لأي خدمة. يلزم تطبيق صلاحيات مقيدة واختبارها قبل تفعيل أي عضوية فعلية.</p>
      <button disabled={!user || busy} onClick={() => void load()} style={button}>عرض / تحديث آخر 30 طلبًا</button>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      {rows.map(row => <article key={row.id} style={{ padding: 18, marginTop: 14, background: 'white', borderRadius: 16, border: '1px solid #c6e7d2' }}><h2>{row.studentName}</h2><p>{row.grade}{row.classroom ? ' — ' + row.classroom : ''}</p><p>الحالة: {row.status === 'pending' ? 'بانتظار المراجعة' : row.status === 'reviewed' ? 'تم الاطلاع' : row.status === 'waiting' ? 'قائمة انتظار' : 'لم يقبل الطلب'}</p><p>{row.note || 'لا توجد رسالة.'}</p><small>{row.createdAt ? new Date(row.createdAt).toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' }) : ''}</small><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>{([{ status: 'reviewed', label: 'تم الاطلاع' }, { status: 'waiting', label: 'قائمة الانتظار' }, { status: 'declined', label: 'عدم القبول' }] as const).map(item => <button key={item.status} disabled={busy || row.status === item.status} onClick={() => void change(row, item.status)} style={button}>{item.label}</button>)}</div></article>)}
      {!rows.length && !busy && <p>اضغط على «عرض الطلبات» لمراجعة الطلبات الواردة.</p>}
    </div>
  </main>;
}
const button: React.CSSProperties = { padding: '10px 16px', background: '#047857', color: '#fff', borderRadius: 10, border: 0, cursor: 'pointer' };
