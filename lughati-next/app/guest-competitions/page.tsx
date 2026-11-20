'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import GuestWorksheets from '../components/GuestWorksheets';
import GuestLiveChallenge from '../components/GuestLiveChallenge';

declare global { interface Window { onContestGuestTurnstile?: (token: string) => void; onContestGuestTurnstileExpired?: () => void; turnstile?: { reset: () => void } } }
type Question = { prompt: string; options: string[] };
type Quiz = { success: boolean; title: string; questions: Question[]; submitted: boolean; score: number | null; message?: string };

export default function GuestCompetitionsPage() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [turnstileToken, setTurnstileToken] = useState('');
  const [requestId, setRequestId] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [session, setSession] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [section, setSection] = useState<'worksheets' | 'quiz' | 'live'>('worksheets');
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('requestId');
    if (id && /^[0-9a-f-]{36}$/.test(id)) queueMicrotask(() => setRequestId(id));
    window.onContestGuestTurnstile = setTurnstileToken;
    window.onContestGuestTurnstileExpired = () => setTurnstileToken('');
    return () => { delete window.onContestGuestTurnstile; delete window.onContestGuestTurnstileExpired; };
  }, []);

  async function load(token: string) {
    const response = await fetch('/api/guest-competition', { cache: 'no-store', headers: { Authorization: 'Bearer guest.' + token } });
    const body = await response.json();
    if (!response.ok || !body.success) throw Error(body.message || 'تعذر تحميل التحدي.');
    setQuiz(body as Quiz);
  }
  async function enter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !siteKey || !turnstileToken) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/competition-guest-login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId.trim(), code: invitationCode.trim(), turnstileToken }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.token) throw Error(data.message || 'تعذر الدخول.');
      await load(data.token);
      setSession(data.token);
      setInvitationCode('');
      setNotice('مرحبًا بك في مساحة التحديات والمسابقات!');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر تسجيل الدخول.'); }
    finally { setBusy(false); setTurnstileToken(''); window.turnstile?.reset(); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quiz || busy || Object.keys(answers).length !== quiz.questions.length) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/guest-competition', {
        method: 'POST', headers: { Authorization: 'Bearer guest.' + session, 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: quiz.questions.map((_, i) => answers[i]) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw Error(result.message || 'تعذر إرسال الحل.');
      setQuiz(old => old ? { ...old, submitted: true, score: result.score } : old);
      setNotice('تم تسليم إجابتك بنجاح ووصلت نتيجتك إلى المعلم.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر إرسال الحل.'); }
    finally { setBusy(false); }
  }
  const field: React.CSSProperties = { padding: 12, borderRadius: 12, border: '1px solid #c9e2d2', width: '100%', font: 'inherit' };
  return <main dir="rtl" style={{ minHeight: '100vh', padding: '30px 16px', background: '#f0fdf4', color: '#154734' }}>
    <section style={{ maxWidth: 780, margin: 'auto', background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 12px 32px #14532d15' }}>
      <Link href="/" style={{ color: '#047857' }}>العودة إلى الأكاديمية</Link>
      <h1>🌟 ركن ضيوف أكاديمية لغتي</h1>
      <p>صفحتك المختصرة: أوراق عمل تناسب صفك، مسابقات لغوية، والتحدي المباشر. لا تتيح هذه العضوية بقية خدمات الأكاديمية.</p>
      {!session ? <form onSubmit={enter} style={{ display: 'grid', gap: 12 }}>
        <label>معرّف طلب العضوية<input required value={requestId} onChange={event => setRequestId(event.target.value)} placeholder="المعرّف المرسل من المعلم" style={field}/></label>
        <label>رمز الدعوة الخاص بك<input required type="password" autoComplete="off" value={invitationCode} onChange={event => setInvitationCode(event.target.value)} placeholder="أدخل رمز الدعوة" style={field}/></label>
        {siteKey ? <><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer /><div className="cf-turnstile" data-sitekey={siteKey} data-callback="onContestGuestTurnstile" data-expired-callback="onContestGuestTurnstileExpired" /></> : <p>الدخول متوقف حتى تكتمل الحماية الأمنية.</p>}
        <button type="submit" disabled={busy || !siteKey || !turnstileToken} style={button}>{busy ? 'جارٍ التحقق…' : 'الدخول إلى المسابقات'}</button>
      </form> : <>
        <nav aria-label="أقسام ركن الضيوف" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {([{ id: 'worksheets', label: '📚 أوراق العمل' }, { id: 'quiz', label: '📝 المسابقات' }, { id: 'live', label: '🔴 التحدي المباشر' }] as const).map(item => <button key={item.id} type="button" onClick={() => setSection(item.id)} aria-pressed={section === item.id} style={{ ...button, background: section === item.id ? '#047857' : '#e4f5eb', color: section === item.id ? '#fff' : '#14532d' }}>{item.label}</button>)}
        </nav>
        {section === 'worksheets' && <GuestWorksheets session={session} />}
        {section === 'quiz' && quiz && <>
        <h2>{quiz.title}</h2>
        {quiz.submitted ? <p role="status" style={{ fontWeight: 800, color: '#047857' }}>أحسنت! درجتك: {quiz.score} من {quiz.questions.length}.</p> :
        <form onSubmit={submit} style={{ display: 'grid', gap: 20 }}>
          {quiz.questions.map((question, i) => <fieldset key={i} style={{ border: '1px solid #d2e8db', padding: 16, borderRadius: 14 }}>
            <legend style={{ fontWeight: 800 }}>السؤال {i + 1}: {question.prompt}</legend>
            {question.options.map((answer, j) => <label key={j} style={{ display: 'block', padding: 8 }}><input type="radio" name={'question-' + i} checked={answers[i] === j} onChange={() => setAnswers(old => ({ ...old, [i]: j }))} /> {answer}</label>)}
          </fieldset>)}
          <button type="submit" disabled={busy || Object.keys(answers).length !== quiz.questions.length} style={button}>{busy ? 'جارٍ الإرسال…' : 'تسليم إجابتي'}</button>
        </form>}
        </>}
        {section === 'live' && <GuestLiveChallenge session={session} />}
      </>}
      {notice && <p role="status" style={{ color: '#047857' }}>{notice}</p>}
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
    </section>
  </main>;
}
const button: React.CSSProperties = { padding: 14, border: 0, borderRadius: 12, color: '#fff', background: '#047857', fontWeight: 800, cursor: 'pointer' };
