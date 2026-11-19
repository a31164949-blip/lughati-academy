'use client';
import { useEffect, useRef, useState } from 'react';

declare global { interface Window { onExternalJoinTurnstile?: (token: string) => void; onExternalJoinTurnstileExpired?: () => void; turnstile?: { reset: () => void } } }
const grades = ['الأول الابتدائي','الثاني الابتدائي','الثالث الابتدائي','الرابع الابتدائي','الخامس الابتدائي','السادس الابتدائي'];
export default function ExternalGradeJoinCard() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [studentName, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [classroom, setClassroom] = useState('');
  const [note, setNote] = useState('');
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const website = useRef<HTMLInputElement>(null);
  useEffect(() => {
    window.onExternalJoinTurnstile = setToken;
    window.onExternalJoinTurnstileExpired = () => setToken('');
    return () => { delete window.onExternalJoinTurnstile; delete window.onExternalJoinTurnstileExpired; };
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !siteKey || !turnstileToken) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/external-grade-join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, grade, classroom, note, consent, website: website.current?.value || '', turnstileToken })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw Error(result.message || 'تعذر إرسال الطلب.');
      setNotice(result.message); setName(''); setGrade(''); setClassroom(''); setNote(''); setConsent(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر إرسال الطلب.'); }
    finally { setBusy(false); setToken(''); window.turnstile?.reset(); }
  }
  return <section dir="rtl" id="external-grade-join" style={{ maxWidth: 1040, margin: '24px auto', padding: 24, borderRadius: 24, border: '1px solid #b7e5cc', background: 'linear-gradient(135deg,#ecfdf3,#fff)', boxShadow: '0 8px 26px #14532d12' }}>
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}><span aria-hidden style={{ fontSize: 42 }}>🌱</span><div><small style={{ color: '#047857', fontWeight: 800 }}>فرصة جديدة للتعلّم</small><h2 style={{ margin: '6px 0', color: '#14532d' }}>عضوية التحديات والمسابقات</h2><p style={{ margin: 0, color: '#365849' }}>لطلاب الصفوف الابتدائية الأخرى للمشاركة في التحديات والمسابقات التعليمية فقط.</p></div></div>
    <p style={{ color: '#52675b' }}>هذه عضوية محدودة بالتحديات والمسابقات فقط، ولا تشمل الواجبات أو رحلة القراءة أو سجلات الطلاب أو بقية خدمات الأكاديمية. يُراجع المعلم كل طلب، ولا يمنح التقديم صلاحية الدخول تلقائيًا.</p>
    <form onSubmit={submit} style={{ display: 'grid', gap: 14, maxWidth: 680 }}>
      <label style={{ display: 'grid', gap: 6 }}>اسم الطالب<input required minLength={5} maxLength={90} value={studentName} onChange={e => setName(e.target.value)} placeholder="اسم الطالب الكامل" style={field} /></label>
      <label style={{ display: 'grid', gap: 6 }}>الصف<select required value={grade} onChange={e => setGrade(e.target.value)} style={field}><option value="">اختر الصف</option>{grades.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
      <label style={{ display: 'grid', gap: 6 }}>الفصل (اختياري)<input maxLength={35} value={classroom} onChange={e => setClassroom(e.target.value)} placeholder="مثل: الثالث أ" style={field} /></label>
      <label style={{ display: 'grid', gap: 6 }}>رسالة قصيرة للمعلم (اختياري)<textarea maxLength={300} rows={2} value={note} onChange={e => setNote(e.target.value)} style={field} /></label>
      <label><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} /> أوافق على إرسال بيانات الطلب للمعلم لمراجعتها، بمساعدة ولي الأمر.</label>
      <input ref={website} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden style={{ position: 'absolute', left: '-9999px' }} />
      {siteKey ? <><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer /><div className="cf-turnstile" data-sitekey={siteKey} data-callback="onExternalJoinTurnstile" data-expired-callback="onExternalJoinTurnstileExpired" /></> : <p style={{ color: '#92400e' }}>استقبال الطلبات غير مفعل إلى حين إعداد الحماية ضد الطلبات الآلية.</p>}
      <button type="submit" disabled={busy || !turnstileToken || !siteKey || !consent} style={{ padding: '12px 22px', color: 'white', background: '#047857', border: 0, borderRadius: 12, fontWeight: 800, cursor: 'pointer', opacity: busy || !turnstileToken ? .65 : 1 }}>{busy ? 'جارٍ الإرسال…' : 'إرسال طلب عضوية المسابقات'}</button>
      {notice && <p role="status" style={{ color: '#047857' }}>{notice}</p>}{error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
    </form>
  </section>;
}
const field: React.CSSProperties = { padding: 12, borderRadius: 12, border: '1px solid #badbca', background: '#fff', color: '#143d2c', font: 'inherit', width: '100%' };
