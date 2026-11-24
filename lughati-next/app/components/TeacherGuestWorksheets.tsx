'use client';
import { useState } from 'react';
import type { User } from 'firebase/auth';

type Worksheet = { id: string; title: string; description: string; url: string; grade: string };
const grades = ['', 'الأول الابتدائي', 'الثاني الابتدائي', 'الثالث الابتدائي', 'الرابع الابتدائي', 'الخامس الابتدائي', 'السادس الابتدائي'];
const inputStyle: React.CSSProperties = { padding: 9, border: '1px solid #a7d6b9', borderRadius: 10, width: '100%', boxSizing: 'border-box' };
const button: React.CSSProperties = { padding: '10px 14px', background: '#047857', color: 'white', border: 0, borderRadius: 10, cursor: 'pointer' };

export default function TeacherGuestWorksheets({ user }: { user: User | null }) {
  const [items, setItems] = useState<Worksheet[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function load() {
    if (!user || busy) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/guest-worksheets', { cache: 'no-store', headers: { Authorization: 'Bearer ' + await user.getIdToken() } });
      const data = await response.json();
      if (!response.ok || !data.success) throw Error(data.message || 'تعذر عرض الأوراق.');
      setItems(data.worksheets);
      setLoaded(true);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذر عرض الأوراق.'); }
    finally { setBusy(false); }
  }
  function update(id: string, key: keyof Worksheet, value: string) {
    setItems(old => old.map(item => item.id === id ? { ...item, [key]: value } : item));
  }
  async function save() {
    if (!user || busy) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/guest-worksheets', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await user.getIdToken() },
        body: JSON.stringify({ worksheets: items }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw Error(data.message || 'تعذر حفظ الأوراق.');
      setItems(data.worksheets);
      setMessage('تم نشر أوراق العمل للطلاب المقبولين.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذر حفظ الأوراق.'); }
    finally { setBusy(false); }
  }
  return <section style={{ marginTop: 28, padding: 18, border: '1px solid #b8d9c2', borderRadius: 16, background: 'white' }}>
    <h2>📚 أوراق عمل ضيوف الأكاديمية</h2>
    <p>أضف رابطًا مباشرًا لورقة PDF أو نشاط HTTPS. اختر الصف أو اتركه «جميع الصفوف». تظهر الأوراق للطلاب المقبولين فقط، دون رفع ملفات على Firebase.</p>
    {!loaded ? <button style={button} disabled={!user || busy} onClick={() => void load()}>تحميل أوراق العمل</button> : <>
      {items.map(item => <article key={item.id} style={{ display: 'grid', gap: 8, margin: '16px 0', padding: 12, borderRadius: 12, background: '#f0fdf4' }}>
        <label>عنوان الورقة<input style={inputStyle} value={item.title} maxLength={100} onChange={e => update(item.id, 'title', e.target.value)} /></label>
        <label>رابط ورقة العمل (HTTPS)<input style={inputStyle} value={item.url} type="url" onChange={e => update(item.id, 'url', e.target.value)} placeholder="https://..." /></label>
        <label>وصف قصير<input style={inputStyle} value={item.description} maxLength={300} onChange={e => update(item.id, 'description', e.target.value)} /></label>
        <label>الصف<select style={inputStyle} value={item.grade} onChange={e => update(item.id, 'grade', e.target.value)}>
          {grades.map(grade => <option value={grade} key={grade}>{grade || 'جميع الصفوف'}</option>)}
        </select></label>
        <button type="button" onClick={() => setItems(old => old.filter(row => row.id !== item.id))} style={{ ...button, background: '#a12626' }}>حذف هذه الورقة من القائمة</button>
      </article>)}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" disabled={busy || items.length >= 20} onClick={() => setItems(old => [...old, { id: crypto.randomUUID().replaceAll('-', ''), title: '', url: '', description: '', grade: '' }])} style={button}>إضافة ورقة</button>
        <button type="button" disabled={busy} onClick={() => void save()} style={button}>حفظ ونشر الأوراق</button>
      </div>
      <p style={{ fontSize: 13 }}>احرص على مراجعة الرابط قبل نشره؛ الحذف أو التعديل لا يُحفظ إلا بعد الضغط على «حفظ ونشر الأوراق».</p>
    </>}
    {message && <p role="status">{message}</p>}
  </section>;
}
