'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../../firebase';
import { uploadMessageImage } from '../../lib/uploadMessageImage';
import type { LiveChampion } from '../../lib/liveChallengeChampions';
import styles from '../../components/LiveChallengeChampions.module.css';
type Result = { success: boolean; teacher?: boolean; champions: LiveChampion[]; revision: string; message?: string };
const empty = (): LiveChampion => ({ id: '', name: '', weekLabel: '', imageUrl: '', zoom: 1, published: true });
async function api(user: User, body?: Record<string, unknown>) {
  const response = await fetch('/api/live-challenge-champions', { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${await user.getIdToken()}`, 'Content-Type': 'application/json' }, cache: 'no-store', ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json() as Result;
  if (!response.ok || !data.success) throw Error(data.message || 'تعذر حفظ التعديل.');
  return data;
}
async function smallPhoto(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw Error('اختر صورة JPG أو PNG أو WebP لا تتجاوز ١٠ ميجابايت.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 480 / bitmap.width, 640 / bitmap.height), canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw Error('تعذر تجهيز الصورة.');
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(Error('تعذر تجهيز الصورة.')), 'image/jpeg', 0.8));
    return new File([blob], 'champion.jpg', { type: 'image/jpeg' });
  } finally { bitmap.close(); }
}
export default function ChampionsManager() {
  const [user, setUser] = useState<User | null>(null), [items, setItems] = useState<LiveChampion[]>([]), [revision, setRevision] = useState('');
  const [draft, setDraft] = useState(empty), [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const generation = useRef(0), lock = useRef(false), previewUrl = useRef(''), inputRef = useRef<HTMLInputElement>(null);
  function resetPhoto(clearInput = true) { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); previewUrl.current = ''; setPreview(''); setFile(null); if (clearInput && inputRef.current) inputRef.current.value = ''; }
  useEffect(() => {
    const stop = onAuthStateChanged(auth, account => {
      const version = ++generation.current; setUser(account); setItems([]); setRevision(''); setError(''); setNotice(''); setDraft(empty()); resetPhoto(); lock.current = false;
      if (!account) { setBusy(false); return; }
      setBusy(true);
      void api(account).then(data => { if (version === generation.current) { if (!data.teacher) throw Error('هذه الصفحة مخصصة للمعلم.'); setItems(data.champions); setRevision(data.revision); } }).catch(error => { if (version === generation.current) setError(error.message); }).finally(() => { if (version === generation.current) setBusy(false); });
    });
    return () => { ++generation.current; stop(); if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); };
  }, []);
  async function save() {
    if (!user || busy || !revision || lock.current) return;
    const version = generation.current; lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      let imageUrl = draft.imageUrl;
      if (file) imageUrl = await uploadMessageImage(await smallPhoto(file));
      if (version !== generation.current) return;
      const data = await api(user, { action: 'save', revision, champion: { ...draft, imageUrl } });
      if (version === generation.current) { setItems(data.champions); setRevision(data.revision); setDraft(empty()); resetPhoto(); setNotice('حُفظ البطل في ركن أبطال التحدي المباشر.'); }
    } catch (error) { if (version === generation.current) setError(error instanceof Error ? error.message : 'تعذر الحفظ.'); }
    finally { if (version === generation.current) { lock.current = false; setBusy(false); } }
  }
  async function visibility(item: LiveChampion) {
    if (!user || busy || lock.current) return;
    const version = generation.current; lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const data = await api(user, { action: 'visibility', revision, id: item.id, published: !item.published });
      if (version === generation.current) { setItems(data.champions); setRevision(data.revision); setNotice(item.published ? 'أُخفي البطل من بطاقة الطالب.' : 'أُعيد إظهار البطل في بطاقة الطالب.'); }
    } catch (error) { if (version === generation.current) setError(error instanceof Error ? error.message : 'تعذر التحديث.'); }
    finally { if (version === generation.current) { lock.current = false; setBusy(false); } }
  }
  async function refresh() {
    if (!user || busy || lock.current) return;
    const version = generation.current; setBusy(true); setError('');
    try { const data = await api(user); if (version === generation.current) { setItems(data.champions); setRevision(data.revision); } }
    catch (error) { if (version === generation.current) setError(error instanceof Error ? error.message : 'تعذر التحميل.'); }
    finally { if (version === generation.current) setBusy(false); }
  }
  const source = preview || draft.imageUrl;
  return <main dir="rtl" className={styles.manager}><Link href="/teacher">العودة إلى لوحة المعلم ←</Link><h1>أبطال التحدي المباشر</h1><p>صور صغيرة داخل بطاقة «نقرأ اليوم، لنصنع حكاية الغد» في صفحة الطالب. أضف بطلًا كل أسبوع واحتفظ بالأبطال السابقين.</p><button type="button" disabled={busy} onClick={() => void refresh()}>تحديث القائمة</button>
    {error && <p role="alert" className={styles.error}>{error}</p>}{notice && <p role="status">{notice}</p>}
    <form onSubmit={event => { event.preventDefault(); void save(); }} className={styles.editor}><h2>{draft.id ? 'تعديل بيانات البطل' : 'إضافة بطل جديد'}</h2><label>اسم البطل<input maxLength={90} required={!draft.id} disabled={busy} value={draft.name} onChange={event => setDraft(old => ({ ...old, name: event.target.value }))} /></label><label>الأسبوع أو المناسبة — اختياري<input maxLength={40} disabled={busy} value={draft.weekLabel} onChange={event => setDraft(old => ({ ...old, weekLabel: event.target.value }))} placeholder="مثال: الأسبوع العاشر" /></label><label>صورة البطل<input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} required={!draft.imageUrl} onChange={event => { const chosen = event.target.files?.[0]; resetPhoto(false); if (chosen) { setFile(chosen); const url = URL.createObjectURL(chosen); previewUrl.current = url; setPreview(url); } }} /></label>
    {source && <div className={styles.photo}><Image unoptimized src={source} width={108} height={144} alt="معاينة صورة البطل" style={{ transform: `scale(${draft.zoom})` }} /></div>}
    <label>تقريب الصورة داخل الإطار<input type="range" min={1} max={2.2} step={0.05} disabled={busy} value={draft.zoom} onChange={event => setDraft(old => ({ ...old, zoom: Number(event.target.value) }))} /></label><label><input type="checkbox" checked={draft.published} disabled={busy} onChange={event => setDraft(old => ({ ...old, published: event.target.checked }))} /> إظهار البطل في بطاقة الطالب</label><div className={styles.buttons}><button type="submit" disabled={busy || !revision}>{busy ? 'جارٍ الحفظ…' : 'حفظ البطل'}</button><button type="button" disabled={busy} onClick={() => { setDraft(empty()); resetPhoto(); }}>إضافة بطل آخر / إلغاء التعديل</button></div></form>
    <div className={styles.manageList}>{items.map(item => <article key={item.id}><div className={styles.photo}><Image unoptimized src={item.imageUrl} alt={item.name || 'بطل التحدي'} width={108} height={144} style={{ transform: `scale(${item.zoom})` }} /></div><h2>{item.name || 'بطل التحدي — أضف اسمه'}</h2><p>{item.weekLabel}</p><p>{item.published ? 'ظاهر للطلاب' : 'مخفي'}</p><div className={styles.buttons}><button type="button" disabled={busy} onClick={() => { setDraft({ ...item }); resetPhoto(); setNotice(''); }}>تعديل البيانات</button><button type="button" disabled={busy} onClick={() => void visibility(item)}>{item.published ? 'إخفاء' : 'إظهار'}</button></div></article>)}</div>
  </main>;
}
