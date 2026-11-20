'use client';
import { useEffect, useState } from 'react';

type Worksheet = { id: string; title: string; description: string; url: string; grade: string };
export default function GuestWorksheets({ session }: { session: string }) {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function refresh() {
    if (!session || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/guest-worksheets', {
        cache: 'no-store', headers: { Authorization: 'Bearer guest.' + session }
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw Error(result.message || 'تعذر تحميل الأوراق.');
      setWorksheets(result.worksheets);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر تحميل الأوراق.'); }
    finally { setBusy(false); }
  }
  // Load once on arrival, then only via manual refresh. No realtime Firestore listener.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/guest-worksheets', { cache: 'no-store', headers: { Authorization: 'Bearer guest.' + session } });
        const result = await response.json();
        if (!response.ok || !result.success) throw Error(result.message || 'تعذر تحميل الأوراق.');
        if (!cancelled) setWorksheets(result.worksheets);
      } catch (reason) { if (!cancelled) setError(reason instanceof Error ? reason.message : 'تعذر تحميل الأوراق.'); }
    })();
    return () => { cancelled = true; };
  }, [session]);
  return <section id="guest-worksheets" style={{ marginTop: 22, padding: 18, background: '#f7fcfa', border: '1px solid #d1e8d9', borderRadius: 18 }}>
    <h2 style={{ marginTop: 0 }}>📚 أوراق العمل</h2>
    <p>تدريبات اختارها لك المعلم. افتح الورقة ودرّب نفسك عليها مع أسرتك.</p>
    {worksheets.length === 0 && <p>لا توجد أوراق عمل منشورة لصفك حاليًا.</p>}
    <div style={{ display: 'grid', gap: 10 }}>
      {worksheets.map(item => <article key={item.id} style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #d9e9df' }}>
        <strong>{item.title}</strong>
        {item.description && <p>{item.description}</p>}
        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#047857', fontWeight: 800 }}>فتح ورقة العمل</a>
      </article>)}
    </div>
    <button type="button" onClick={() => void refresh()} disabled={busy} style={{ marginTop: 14, padding: '10px 16px', background: '#047857', borderRadius: 10, color: 'white', border: 0 }}>
      {busy ? 'جارٍ التحديث…' : 'تحديث الأوراق'}
    </button>
    {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
  </section>;
}
