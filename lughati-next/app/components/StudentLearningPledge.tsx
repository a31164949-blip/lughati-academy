'use client';

import { useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { usePathname } from 'next/navigation';
import { auth } from '../../firebase';
import { STUDENT_ACADEMY_PAUSED } from '../lib/academyAvailability';
import { AcademyStudentAccessContext } from './AcademyStudentAccessContext';

const pledgeVersion = 'learning-integrity-v1';
const storageKey = (uid: string) => `${pledgeVersion}:${uid}`;

// A device-local acknowledgement; no Firestore reads, polling, or public records.
export default function StudentLearningPledge({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const studentEnabled = useContext(AcademyStudentAccessContext);
  const [state, setState] = useState<'loading' | 'pass' | 'pledge' | 'error'>('loading');
  const [uid, setUid] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let version = 0;
    const stop = onAuthStateChanged(auth, account => {
      const current = ++version;
      setUid(''); setConfirmed(false); setError(''); setLeaving(false);
      if (!account) { setState('pass'); return; }
      setState('loading');
      void account.getIdTokenResult().then(token => {
        if (version !== current) return;
        if (token.claims.role !== 'student') { setState('pass'); return; }
        if (STUDENT_ACADEMY_PAUSED && !studentEnabled) { setState('pass'); return; }
        let accepted = false;
        try { accepted = localStorage.getItem(storageKey(account.uid)) === 'accepted'; } catch { /* Ask again when browser storage is unavailable. */ }
        setUid(account.uid); setState(accepted ? 'pass' : 'pledge');
      }).catch(() => { if (version === current) setState('error'); });
    });
    return () => { ++version; stop(); };
  }, [retry, studentEnabled]);

  function accept() {
    if (!confirmed || !uid || auth.currentUser?.uid !== uid) return;
    try { localStorage.setItem(storageKey(uid), 'accepted'); } catch { /* The acknowledgement remains valid for this mounted session. */ }
    setState('pass');
  }
  async function leave() {
    setLeaving(true); setError('');
    try { await signOut(auth); window.location.assign('/'); }
    catch { setLeaving(false); setError('تعذر تسجيل الخروج. حاول مرة أخرى.'); }
  }
  if (path === '/login' || path === '/teacher-login' || path.startsWith('/teacher/') || path === '/teacher') return <>{children}</>;
  if (state === 'pass') return <>{children}</>;
  if (state === 'loading') return <main dir="rtl" className="p-8 text-center" role="status">جارٍ التحقق من الدخول…</main>;
  if (state === 'error') return <main dir="rtl" className="p-8 text-center"><p role="alert">تعذر التحقق من الحساب.</p><button type="button" onClick={() => setRetry(value => value + 1)}>إعادة المحاولة</button></main>;
  return <main dir="rtl" className="min-h-screen bg-[#f5f6ed] px-4 py-12 text-[#17483b]">
    <section aria-labelledby="learning-pledge-title" className="mx-auto max-w-2xl rounded-3xl border border-[#ddd2a6] bg-white p-6 shadow-lg sm:p-10">
      <p className="mb-4 font-bold text-[#927337]">أكاديمية لغتي الرقمية · أمانة التعلّم</p>
      <h1 id="learning-pledge-title" className="mb-5 text-3xl font-bold leading-relaxed">أتعلم بأمانة… وأحفظ جهد زملائي</h1>
      <p className="mb-5 leading-8">مرحبًا بعودتك يا بطل! اقرأ التعهّد بمساعدة أسرتك، ثم أكّد موافقتك قبل متابعة رحلتك.</p>
      <p className="rounded-2xl border border-[#e4d8b0] bg-[#fff9e9] p-5 text-lg leading-9">أتعهد بأن أؤدي أنشطة الاختبارات والإملاء داخل الأكاديمية، وألا أنشر أسئلتها أو إجاباتها أو صورها ومقاطعها، أو أتداولها خارج الأكاديمية؛ حفاظًا على أمانة التعلّم وتكافؤ الفرص بين زملائي.</p>
      <form onSubmit={event => { event.preventDefault(); accept(); }}>
        <label className="my-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-emerald-50 p-5 font-bold leading-8"><input type="checkbox" required checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-2 h-5 w-5 shrink-0 accent-emerald-800" /><span>قرأت التعهّد وفهمته، وألتزم به بمساندة أسرتي.</span></label>
        <button type="submit" disabled={!confirmed || leaving} className="w-full rounded-2xl bg-emerald-800 p-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">أوافق وأتابع التعلّم ←</button>
      </form>
      <button type="button" disabled={leaving} onClick={() => void leave()} className="mt-5 rounded-lg p-2 underline">{leaving ? 'جارٍ تسجيل الخروج…' : 'تسجيل الخروج الآن'}</button>
      {error && <p role="alert" className="mt-3 text-red-800">{error}</p>}
    </section>
  </main>;
}
