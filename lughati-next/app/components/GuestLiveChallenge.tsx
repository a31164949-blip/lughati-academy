'use client';
import { useEffect, useRef, useState } from 'react';
import LiveVoiceAnswer from './LiveVoiceAnswer';
import { useLiveGamePolling } from '../hooks/useLiveGamePolling';

type Room = {
  answered: boolean;
  code: string;
  status: 'waiting' | 'active' | 'finished';
  question: { index: number; total: number; prompt: string } | null;
  participants: { id: string; name: string; score: number; answered: boolean }[];
};

export default function GuestLiveChallenge({ session }: { session: string }) {
  const [code, setCode] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [suggestedCode, setSuggestedCode] = useState('');
  const [checkingCurrent, setCheckingCurrent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('أدخل رمز غرفة التحدي المباشر الذي يرسله المعلم.');
  const mutation = useRef(false);
  const isMounted = useRef(true);
  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);
  // One lookup when the child opens this tab, not continuous polling.
  async function findCurrent() {
    if (!session) return;
    setCheckingCurrent(true);
    try {
      const response = await fetch('/api/academy-club/live-game?mode=current', {
        cache: 'no-store', headers: { Authorization: 'Bearer guest.' + session },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw Error('تعذر البحث عن التحدي الحالي.');
      if (!isMounted.current) return;
      setSuggestedCode(typeof data.code === 'string' && /^\\d{6}$/.test(data.code) ? data.code : '');
    } catch {
      if (isMounted.current) setSuggestedCode('');
    } finally {
      if (isMounted.current) setCheckingCurrent(false);
    }
  }
  useEffect(() => { void findCurrent(); /* only when the guest opens the live tab */ 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);
  async function request(action?: 'join' | 'answer', audioUrl?: string, question?: number, overrideCode?: string) {
    if (!session || mutation.current) return;
    const targetCode = overrideCode ?? code;
    if (action) mutation.current = true;
    setBusy(true);
    try {
      const response = await fetch(
        action ? '/api/academy-club/live-game' : '/api/academy-club/live-game?code=' + encodeURIComponent(targetCode),
        { method: action ? 'POST' : 'GET', cache: 'no-store',
          headers: { Authorization: 'Bearer guest.' + session, ...(action ? { 'Content-Type': 'application/json' } : {}) },
          ...(action ? { body: JSON.stringify({ action, code: targetCode, audioUrl, question }) } : {}) });
      const data = await response.json();
      if (!response.ok || !data.success) throw Error(data.message || 'تعذر الاتصال بغرفة التحدي.');
      if (!isMounted.current) return;
      setRoom(data.room);
      if (action === 'join') setCode(targetCode);
      if (action === 'join') setMessage('انضممت إلى غرفة التحدي! انتظر بدء المعلم.');
      if (action === 'answer') setMessage('وصل تسجيلك الصوتي إلى المعلم لمراجعته.');
    } catch (error) {
      if (isMounted.current) setMessage(error instanceof Error ? error.message : 'تعذر الاتصال بغرفة التحدي.');
      if (action === 'answer') throw error;
    } finally { if (isMounted.current) setBusy(false); if (action) mutation.current = false; }
  }
  useLiveGamePolling(() => request(), Boolean(session && room && room.status !== 'finished'), room?.code, 25000);
  return <section dir="rtl" style={{ marginTop: 25, padding: 18, border: '1px solid #bbdccb', borderRadius: 18, background: '#f0fdf4' }}>
    <h2>🔴 التحدي المباشر</h2>
    {!room ? <>
      {suggestedCode ? <div style={{ padding: 12, background: '#dcfce7', borderRadius: 12, marginBottom: 12 }}>
        <p style={{ fontWeight: 800 }}>🎉 يوجد تحدٍ مباشر متاح للانضمام!</p>
        <button type="button" disabled={busy} onClick={() => void request('join', undefined, undefined, suggestedCode)} style={button}>انضم إلى التحدي الآن</button>
      </div> : <p>{checkingCurrent ? 'جارٍ البحث عن التحدي الحالي…' : 'لا يوجد تحدٍ مباشر مُعلن حاليًا. يمكنك المحاولة مجددًا عند بدء المعلم.'}</p>}
      <button type="button" disabled={busy || checkingCurrent} onClick={() => void findCurrent()} style={{ ...button, background: '#e2f3e9', color: '#14532d' }}>تحديث التحدي</button>
      <details style={{ marginTop: 14 }}>
        <summary style={{ cursor: 'pointer' }}>لديّ رمز غرفة من المعلم</summary>
        <p>استخدم رمز الغرفة إذا أرسله المعلم إليك مباشرة.</p>
        <input aria-label="رمز غرفة التحدي" inputMode="numeric" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="رمز الغرفة" style={{ padding: 12, fontSize: 22, borderRadius: 12, border: '1px solid #a9d3bb' }} />
        <button type="button" disabled={busy || code.length !== 6} onClick={() => void request('join')} style={button}>انضم برمز الغرفة</button>
      </details>
    </> : <>
      <p>الغرفة {room.code} — {room.status === 'waiting' ? 'بانتظار المعلم' : room.status === 'active' ? 'التحدي جارٍ الآن' : 'انتهى التحدي'}</p>
      {room.question && <div style={{ padding: 15, background: '#fff', borderRadius: 14 }}>
        <p>السؤال {room.question.index + 1} من {room.question.total}</p><h3>{room.question.prompt}</h3>
        {room.answered ? <p>✅ تم تسليم إجابتك. انتظر السؤال التالي.</p> :
          <LiveVoiceAnswer key={room.code + '-' + room.question.index} disabled={busy} onSubmit={audioUrl => request('answer', audioUrl, room.question!.index)} />}
      </div>}
      <h3>ترتيب المشاركين</h3>
      {room.participants.slice(0, 10).map((participant, index) => <p key={participant.id}>{index + 1}. {participant.name} — {participant.score} نقطة</p>)}
      {room.status === 'finished' && <button type="button" onClick={() => void request()} disabled={busy} style={button}>تحديث النتيجة</button>}
    </>}
    <p role="status">{message}</p>
  </section>;
}
const button: React.CSSProperties = { margin: 10, padding: 12, borderRadius: 12, background: '#047857', color: '#fff', border: 0, cursor: 'pointer' };
