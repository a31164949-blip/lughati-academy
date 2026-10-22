'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../firebase';
import { ACADEMY_CAPACITY, CONTINUATION_OPEN, CONTINUATION_MESSAGE_LIMIT, type ContinuationProfile, type ContinuationRequest } from '../lib/academyContinuation';
import styles from './AcademyContinuation.module.css';
type Result = { success: boolean; teacher?: boolean; profile: ContinuationProfile | null; request: ContinuationRequest | null; message?: string };
async function request(user: User, body?: { message: string; wantsToContinue: boolean }) {
  const response = await fetch('/api/academy-continuation', { method: body ? 'POST' : 'GET', cache: 'no-store', headers: { Authorization: `Bearer ${await user.getIdToken()}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json() as Result;
  if (!response.ok || !data.success) throw Error(data.message || 'تعذر حفظ طلبك.');
  return data;
}
export default function AcademyContinuationCard() {
  const [user, setUser] = useState<User | null>(null), [ready, setReady] = useState(false), [teacher, setTeacher] = useState(false);
  const [profile, setProfile] = useState<ContinuationProfile | null>(null), [saved, setSaved] = useState<ContinuationRequest | null>(null);
  const [wantsToContinue, setWants] = useState(false), [message, setMessage] = useState(''), [status, setStatus] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const generation = useRef(0), lock = useRef(false);
  async function load(account: User, version: number) {
    const data = await request(account);
    if (version !== generation.current) return;
    setTeacher(data.teacher === true); setProfile(data.profile); setSaved(data.request); setWants(data.request?.wantsToContinue ?? false); setMessage(data.request?.message ?? '');
  }
  useEffect(() => {
    const stop = onAuthStateChanged(auth, account => {
      const version = ++generation.current;
      setUser(account); setReady(true); setTeacher(false); setProfile(null); setSaved(null); setWants(false); setMessage(''); setStatus(''); setError(''); lock.current = false;
      if (!account) { setBusy(false); return; }
      setBusy(true);
      void load(account, version).catch(error => { if (version === generation.current) setError(error.message); }).finally(() => { if (version === generation.current) setBusy(false); });
    });
    // Cancel the display of outstanding private responses after identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { ++generation.current; stop(); };
  }, []);
  useEffect(() => { if (profile && window.location.hash === '#academy-continuation') document.getElementById('academy-continuation')?.scrollIntoView({ block: 'start' }); }, [profile]);
  async function submit() {
    if (!user || !profile || teacher || busy || lock.current || !wantsToContinue) return;
    const version = generation.current; lock.current = true; setBusy(true); setError(''); setStatus('');
    try {
      const data = await request(user, { message, wantsToContinue });
      if (version !== generation.current) return;
      setSaved(data.request); setMessage(data.request?.message ?? ''); setStatus(data.message ?? 'وصل طلبك للمعلم.');
    } catch (error) { if (version === generation.current) setError(error instanceof Error ? error.message : 'تعذر إرسال الطلب.'); }
    finally { if (version === generation.current) { lock.current = false; setBusy(false); } }
  }
  return <section id="academy-continuation" dir="rtl" className={styles.card} aria-busy={busy}>
    <div className={styles.intro}><span className={styles.eyebrow}>رحلتك مع التعلّم تستحق أن تستمر</span><div className={styles.symbol} aria-hidden="true">✦</div><h2>هل ترغب بالدخول إلى الأكاديمية<br /><span>والاستمرار في التعلّم؟</span></h2><p>يسعدنا أن نسمع رغبتك في مواصلة القراءة والأنشطة والتحديات. أكّد اهتمامك بمساعدة أسرتك، ودع معلمك يتعرّف على خطوتك القادمة.</p></div>
    <aside className={styles.capacity}><strong>{ACADEMY_CAPACITY} طالبًا فقط</strong><p>تقتصر الطاقة الاستيعابية للأكاديمية على ٢٠ طالبًا، ويُعتمد القبول بعد مراجعة المعلم للطلبات. إرسال الرغبة لا يعني القبول النهائي.</p></aside>
    {teacher ? <div className={styles.teacherBox}><h3>طلبات الطلاب ورسائلهم في مساحة خاصة بك</h3><p>يمكنك متابعة الأسماء والصفوف ورغبات الاستمرار والرسائل من لوحة المعلم.</p><Link className={styles.primary} href="/teacher/continuation">مراجعة طلبات الاستمرار ←</Link></div> : <form className={styles.form} onSubmit={event => { event.preventDefault(); void submit(); }}>
      <div className={styles.fields}><label>اسم الطالب<input readOnly value={profile?.studentName ?? ''} placeholder="يظهر من حساب الطالب بعد تسجيل الدخول" aria-readonly="true" /></label><label>الصف<input readOnly value={profile?.classroom ?? ''} placeholder="يظهر الصف المسجّل في الحساب" aria-readonly="true" /></label></div>
      <p className={styles.hint}>يُؤخذ الاسم والصف من حساب الطالب لضمان وصول الطلب بالبيانات الصحيحة.</p>
      <label className={styles.check}><input type="checkbox" checked={wantsToContinue} required disabled={!profile || busy || !CONTINUATION_OPEN} onChange={event => setWants(event.target.checked)} /><span>لديّ الرغبة في أن أستمرّ بالتعلّم من خلال الأكاديمية.</span></label>
      <label className={styles.messageLabel}>هل لديك رسالة للمعلم؟ <small>اختياري · للمعلم فقط</small><textarea rows={4} maxLength={CONTINUATION_MESSAGE_LIMIT} disabled={!profile || busy || !CONTINUATION_OPEN} value={message} onChange={event => setMessage(event.target.value)} placeholder="اكتب ما تحب أن يعرفه معلمك، أو ما تحتاج إليه لمواصلة تعلّمك…" /></label>
      <div className={styles.privacy}><span aria-hidden="true">🔒</span><p>طلبك ورسالتك خاصّان بالمعلم، ولا يظهران لبقية الطلاب أو الأسر.</p><small>{message.length} / {CONTINUATION_MESSAGE_LIMIT}</small></div>
      {!ready ? <p role="status">جارٍ التحقق من الدخول…</p> : !user ? <div className={styles.login}><p>سجّل دخولك بحساب الطالب لتأكيد اسمك وصفّك وإرسال رغبتك، حتى أثناء الإغلاق المؤقت.</p><Link href="/login?returnTo=%2F%23academy-continuation" className={styles.primary}>تسجيل الدخول لإرسال رغبتي ←</Link></div> : <div className={styles.actions}><button type="submit" className={styles.primary} disabled={busy || !profile || !wantsToContinue || !CONTINUATION_OPEN}>{busy ? 'جارٍ الحفظ…' : saved ? 'تحديث طلب الاستمرار' : 'إرسال رغبتي للمعلم'}</button>{error && <button type="button" className={styles.secondary} disabled={busy} onClick={() => { if (!user) return; const version = generation.current; setBusy(true); setError(''); void load(user, version).catch(error => { if (version === generation.current) setError(error.message); }).finally(() => { if (version === generation.current) setBusy(false); }); }}>إعادة تحميل بيانات الحساب</button>}</div>}
      {!CONTINUATION_OPEN && <p className={styles.notice}>استقبال طلبات الاستمرار متوقف حاليًا.</p>}
      {saved && <p className={styles.saved}>✓ طلبك محفوظ لدى المعلم {saved.status === 'reviewed' ? '— تم الاطلاع عليه.' : '— بانتظار المراجعة.'} يمكنك تحديثه من هنا.</p>}
      {status && <p role="status" className={styles.saved}>{status}</p>}{error && <p role="alert" className={styles.error}>{error}</p>}
    </form>}
  </section>;
}
