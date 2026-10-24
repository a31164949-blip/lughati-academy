'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../../firebase';
import { ADMISSION_LABELS, ACADEMY_CAPACITY, type AdmissionStatus, type ContinuationRequest } from '../../lib/academyContinuation';
import styles from '../../components/AcademyContinuation.module.css';
async function request(account: User, cursor?: string, body?: Record<string, unknown>) {
  const response = await fetch(`/api/academy-continuation?scope=all${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { method: body ? 'PATCH' : 'GET', cache: 'no-store', headers: { Authorization: `Bearer ${await account.getIdToken()}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok || !data.success) throw Error(data.message || 'تعذر تحميل الطلبات.');
  return data as { requests: ContinuationRequest[]; cursor: string | null; status: 'new' | 'reviewed'; admissionStatus: AdmissionStatus; revision: string; admissions: { accepted: number; remaining: number } };
}
export default function ContinuationTeacherPage() {
  const [user, setUser] = useState<User | null>(null), [rows, setRows] = useState<ContinuationRequest[]>([]), [cursor, setCursor] = useState<string | null>(null);
  const [search, setSearch] = useState(''), [classroom, setClassroom] = useState('all'), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('all'), [admissions, setAdmissions] = useState<{ accepted: number; remaining: number } | null>(null);
  const generation = useRef(0), lock = useRef(false);
  useEffect(() => {
    const stop = onAuthStateChanged(auth, account => {
      const version = ++generation.current; setUser(account); setRows([]); setCursor(null); setError(''); setAdmissions(null); lock.current = false;
      if (!account) { setBusy(false); return; }
      setBusy(true);
      void request(account).then(data => { if (version === generation.current) { setRows(data.requests); setCursor(data.cursor); setAdmissions(data.admissions); } }).catch(error => { if (version === generation.current) setError(error.message); }).finally(() => { if (version === generation.current) setBusy(false); });
    });
    // Invalidate private responses when the teacher session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { ++generation.current; stop(); };
  }, []);
  async function load(more = false) {
    if (!user || busy || lock.current) return;
    const version = generation.current; lock.current = true; setBusy(true); setError('');
    try {
      const data = await request(user, more ? cursor ?? undefined : undefined);
      if (version === generation.current) { setRows(old => more ? [...old, ...data.requests.filter(row => !old.some(saved => saved.id === row.id))] : data.requests); setCursor(data.cursor); setAdmissions(data.admissions); }
    } catch (error) { if (version === generation.current) setError(error instanceof Error ? error.message : 'تعذر تحميل الطلبات.'); }
    finally { if (version === generation.current) { lock.current = false; setBusy(false); } }
  }
  async function review(row: ContinuationRequest, decision?: AdmissionStatus) {
    if (!user || busy || lock.current) return;
    const version = generation.current; lock.current = true; setBusy(true); setError('');
    try {
      const data = await request(user, undefined, { studentId: row.id, revision: row.revision, ...(decision ? { admissionStatus: decision } : { status: row.status === 'reviewed' ? 'new' : 'reviewed' }) });
      if (version === generation.current) { setRows(old => old.map(saved => saved.id === row.id ? { ...saved, status: data.status, admissionStatus: data.admissionStatus, revision: data.revision } : saved)); setAdmissions(data.admissions); }
    } catch (error) { if (version === generation.current) setError(error instanceof Error ? error.message : 'تعذر تحديث الطلب.'); }
    finally { if (version === generation.current) { lock.current = false; setBusy(false); } }
  }
  const filtered = rows.filter(row => (classroom === 'all' || row.classroom === classroom) && (decisionFilter === 'all' || (row.admissionStatus ?? 'pending') === decisionFilter) && (!search.trim() || row.studentName.includes(search.trim())));
  return <main dir="rtl" className={styles.page}><div className={styles.manager}><Link href="/teacher">العودة إلى لوحة المعلم ←</Link><h1>طلبات الاستمرار في أكاديمية لغتي</h1><p>مساحة خاصة للمعلم لمراجعة رغبات الطلاب ورسائل أسرهم.</p><aside className={styles.capacity}><strong>الطاقة الاستيعابية: {ACADEMY_CAPACITY} طالبًا</strong><p>القبول النهائي بقرارك، وليس بأسبقية التسجيل. يمكنك قبول الطالب أو وضعه في قائمة الانتظار أو عدم قبول طلبه. الحد الأقصى ٢٠ مقبولًا فعليًا؛ الحساب التجريبي لا يُحتسب، والترقية من الانتظار بقرارك فقط. القبول لا يفتح الأكاديمية تلقائيًا أثناء الإغلاق المؤقت.</p></aside>
    <p className={styles.stats}>{admissions ? `المقبولون المعتمدون: ${admissions.accepted} / ${ACADEMY_CAPACITY} · المقاعد المتاحة للقبول: ${admissions.remaining}` : 'جارٍ تحميل ملخص القبول…'}</p><div className={styles.actions}><button type="button" disabled={busy} className={styles.primary} onClick={() => void load()}>تحديث الطلبات</button><Link className={styles.secondary} href="/teacher/friends">لوحة الشكر السابقة وردودها</Link></div>
    <div className={styles.filters}><input aria-label="البحث باسم الطالب في الطلبات المحملة" placeholder="ابحث في الأسماء المحمّلة…" value={search} onChange={event => setSearch(event.target.value)} /><select aria-label="تصفية الطلبات حسب الصف" value={classroom} onChange={event => setClassroom(event.target.value)}><option value="all">جميع الصفوف المحمّلة</option>{[...new Set(rows.map(row => row.classroom))].sort().map(value => <option key={value}>{value}</option>)}</select><select aria-label="تصفية الطلبات حسب قرار القبول" value={decisionFilter} onChange={event => setDecisionFilter(event.target.value)}><option value="all">جميع حالات القبول المحمّلة</option>{(Object.keys(ADMISSION_LABELS) as AdmissionStatus[]).map(value => <option key={value} value={value}>{ADMISSION_LABELS[value]}</option>)}</select></div>
    <p className={styles.stats}>الطلبات المحمّلة: {rows.length} · الجديدة منها: {rows.filter(row => row.status === 'new').length} · نتائج العرض: {filtered.length}{cursor ? ' — توجد طلبات أخرى في «عرض المزيد».' : ''}</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}{busy && <p role="status">جارٍ إتمام طلبك…</p>}
    {filtered.map(row => <article key={row.id} className={styles.entry}><header><h2>{row.studentName}</h2><span className={styles.badge}>{row.status === 'reviewed' ? 'تم الاطلاع' : 'طلب جديد'}{row.isTrial ? ' · حساب تجريبي' : ''}</span></header><p>الصف: <strong>{row.classroom}</strong></p><p className={styles.notice}><strong>{ADMISSION_LABELS[row.admissionStatus ?? 'pending']}</strong></p><div className={styles.actions}>{([{ value: 'accepted', label: 'قبول الطالب' }, { value: 'waiting', label: 'نقل إلى قائمة الانتظار' }, { value: 'declined', label: 'عدم قبول الطلب' }, { value: 'pending', label: 'إعادة إلى المراجعة' }] as const).map(choice => <button key={choice.value} type="button" className={choice.value === 'accepted' ? styles.primary : styles.secondary} aria-label={`${choice.label} — ${row.studentName}`} disabled={busy || (row.admissionStatus ?? 'pending') === choice.value || (choice.value === 'accepted' && !row.isTrial && admissions?.remaining === 0)} onClick={() => void review(row, choice.value)}>{choice.label}</button>)}</div><p>✓ لديّ الرغبة في الاستمرار بالتعلّم من خلال الأكاديمية.</p><h3>رسالة خاصة للمعلم</h3><div className={styles.letter}>{row.message || 'لم تُضَف رسالة مع هذا الطلب.'}</div>{row.updatedAt && <p className={styles.stats}>آخر تحديث من الطالب: {new Date(row.updatedAt).toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}</p>}<button type="button" disabled={busy} className={styles.secondary} onClick={() => void review(row)}>{row.status === 'reviewed' ? 'إعادته إلى الطلبات الجديدة' : 'تعليم الطلب بأنه تم الاطلاع'}</button></article>)}
    {!rows.length && !busy && !error && <p className={styles.notice}>لم تصل طلبات استمرار بعد.</p>}{!filtered.length && rows.length > 0 && <p className={styles.notice}>لا توجد نتائج مطابقة ضمن الطلبات المحمّلة.</p>}{cursor && <button type="button" disabled={busy} className={styles.primary} onClick={() => void load(true)}>عرض المزيد من الطلبات</button>}
  </div></main>;
}
