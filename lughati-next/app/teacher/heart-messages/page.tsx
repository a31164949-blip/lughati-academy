'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../../firebase';
import { uploadMessageImage } from '../../lib/uploadMessageImage';
import { HEART_LIMIT, type HeartMessage } from '../../lib/heartMessages';
import styles from './page.module.css';
type Result = { success: boolean; items: HeartMessage[]; revision: string; message?: string };
const empty = (): HeartMessage => ({ id: '', title: '', studentName: '', showName: false, imageUrl: '', published: false });
async function api(user: User, body?: Record<string, unknown>) {
  const response = await fetch('/api/heart-messages?manage=1', { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${await user.getIdToken()}`, 'Content-Type': 'application/json' }, cache: 'no-store', ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json() as Result;
  if (!response.ok || !data.success) throw Error(data.message || 'تعذر إتمام الطلب.');
  return data;
}
async function smallLetter(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw Error('اختر صورة JPG أو PNG أو WebP لا تتجاوز ١٠ ميجابايت.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height)), canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw Error('تعذر تجهيز الصورة.');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(Error('تعذر تجهيز الصورة.')), 'image/jpeg', .78));
    return new File([blob], 'heart-letter.jpg', { type: 'image/jpeg' });
  } finally { bitmap.close(); }
}
export default function HeartManager() {
  const [user, setUser] = useState<User | null>(null), [items, setItems] = useState<HeartMessage[]>([]), [revision, setRevision] = useState('');
  const [draft, setDraft] = useState(empty), [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const generation = useRef(0), lock = useRef(false), previewUrl = useRef(''), input = useRef<HTMLInputElement>(null), editor = useRef<HTMLFormElement>(null);
  function clearPhoto(clearInput = true) { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); previewUrl.current = ''; setPreview(''); setFile(null); if (clearInput && input.current) input.current.value = ''; }
  useEffect(() => {
    const stop = onAuthStateChanged(auth, account => {
      const version = ++generation.current; setUser(account); setItems([]); setRevision(''); setError(''); setNotice(''); setDraft(empty()); clearPhoto(); lock.current = false;
      if (!account) { setBusy(false); return; }
      setBusy(true);
      void api(account).then(data => { if (version === generation.current) { setItems(data.items); setRevision(data.revision); } }).catch(error => { if (version === generation.current) setError(error.message); }).finally(() => { if (version === generation.current) setBusy(false); });
    });
    return () => { ++generation.current; stop(); if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); };
  }, []);
  async function mutate(body: Record<string, unknown>) {
    if (!user || busy || !revision || lock.current) return;
    const version = generation.current; lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      if (body.action === 'save') {
        const imageUrl = file ? await uploadMessageImage(await smallLetter(file)) : draft.imageUrl;
        body.item = { ...draft, imageUrl };
      }
      if (version !== generation.current) return;
      const data = await api(user, { ...body, revision });
      if (version === generation.current) { setItems(data.items); setRevision(data.revision); if (body.action === 'save') { setDraft(empty()); clearPhoto(); } setNotice('تم حفظ التعديل. يظهر المحتوى المنشور في الواجهة عند تحميلها مجددًا.'); }
    } catch (error) { if (version === generation.current) setError(error instanceof Error ? error.message : 'تعذر الحفظ.'); }
    finally { if (version === generation.current) { lock.current = false; setBusy(false); } }
  }
  async function refresh() {
    if (!user || busy) return;
    const version = generation.current; setBusy(true); setError('');
    try { const data = await api(user); if (version === generation.current) { setItems(data.items); setRevision(data.revision); } }
    catch (error) { if (version === generation.current) setError(error instanceof Error ? error.message : 'تعذر التحميل.'); }
    finally { if (version === generation.current) setBusy(false); }
  }
  const source = preview || draft.imageUrl;
  return <main dir="rtl" className={styles.manager}><Link href="/teacher">العودة إلى لوحة المعلم ←</Link><h1>💚 رسائل من القلب</h1><p>كلمات عفوية من أبنائنا… نعتز بها ونحفظ أثرها الجميل.</p><p>تُضغط الصور تلقائيًا قبل رفعها. اختر «نشر» بعد مراجعة الصورة؛ وما يظهر فيها من أسماء أو معلومات سيشاهده زوار الأكاديمية.</p><button disabled={busy} onClick={() => void refresh()}>تحديث القائمة</button> <Link href="/#heart-heading">معاينة الواجهة الرئيسية ←</Link>
    {error && <p role="alert" className={styles.error}>{error}</p>}{notice && <p role="status">{notice}</p>}
    <form ref={editor} className={styles.editor} onSubmit={event => { event.preventDefault(); void mutate({ action: 'save' }); }}><h2>{draft.id ? 'تعديل الرسالة' : 'إضافة رسالة جديدة'}</h2><label>عنوان الرسالة<input maxLength={100} required disabled={busy} value={draft.title} onChange={event => setDraft(old => ({ ...old, title: event.target.value }))} /></label><label>اسم الطالب — اختياري<input maxLength={90} disabled={busy} value={draft.studentName} onChange={event => setDraft(old => ({ ...old, studentName: event.target.value }))} /></label><label><input type="checkbox" checked={draft.showName} disabled={busy} onChange={event => setDraft(old => ({ ...old, showName: event.target.checked }))} /> إظهار الاسم تحت الرسالة</label><small>هذا الخيار يخفي التعليق فقط؛ الاسم المكتوب داخل الصورة يبقى ظاهرًا. احجب أي معلومات لا ترغب بنشرها قبل الرفع.</small><label>صورة الرسالة<input ref={input} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} required={!draft.imageUrl} onChange={event => { const chosen = event.target.files?.[0]; clearPhoto(false); if (chosen) { setFile(chosen); const url = URL.createObjectURL(chosen); previewUrl.current = url; setPreview(url); } }} /></label>
      {source && <Image className={styles.preview} unoptimized src={source} width={1100} height={1400} alt="معاينة الرسالة" />}
      <label><input type="checkbox" checked={draft.published} disabled={busy} onChange={event => setDraft(old => ({ ...old, published: event.target.checked }))} /> نشر الرسالة على الواجهة الرئيسية</label><div className={styles.buttons}><button type="submit" disabled={busy || !revision || (!draft.id && items.length >= HEART_LIMIT)}>{busy ? 'جارٍ الحفظ…' : 'حفظ الرسالة'}</button><button type="button" disabled={busy} onClick={() => { setDraft(empty()); clearPhoto(); }}>إلغاء / إضافة رسالة أخرى</button></div><small>{items.length} / {HEART_LIMIT} رسالة</small></form>
    <div className={styles.list}>{items.map(item => <article key={item.id}><Image unoptimized loading="lazy" src={item.imageUrl} width={330} height={400} alt={item.title} /><h2>{item.title}</h2><p>{item.published ? 'منشورة للزوار' : 'مسودة مخفية'}</p><div className={styles.buttons}><button disabled={busy} onClick={() => { setDraft({ ...item }); clearPhoto(); setNotice(''); editor.current?.scrollIntoView({ block: 'start' }); }}>تعديل</button><button disabled={busy} onClick={() => void mutate({ action: 'visibility', id: item.id, published: !item.published })}>{item.published ? 'إخفاء' : 'نشر'}</button></div></article>)}</div>
  </main>;
}
