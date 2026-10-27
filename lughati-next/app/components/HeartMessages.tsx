'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { PublicHeart } from '../lib/heartMessages';
import styles from './HeartMessages.module.css';
export default function HeartMessages() {
  const root = useRef<HTMLElement>(null), modal = useRef<HTMLDialogElement>(null), opener = useRef<HTMLElement | null>(null);
  const [items, setItems] = useState<PublicHeart[]>([]), [index, setIndex] = useState(0), [visible, setVisible] = useState(false), [paused, setPaused] = useState(false), [hover, setHover] = useState(false), [focused, setFocused] = useState(false), [expanded, setExpanded] = useState(false), [gallery, setGallery] = useState(false), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '100px' });
    observer.observe(element); return () => observer.disconnect();
  }, []);
  const loaded = useRef(false);
  useEffect(() => {
    if (!visible || loaded.current) return;
    loaded.current = true; let finished = false; const controller = new AbortController();
    fetch('/api/heart-messages', { signal: controller.signal, cache: 'no-store' }).then(async response => {
      if (!response.ok) throw Error();
      const data = await response.json();
      if (!data.success || !Array.isArray(data.items)) throw Error();
      finished = true; setItems(data.items); setFailed(false);
    }).catch(error => { if (error.name !== 'AbortError') { finished = true; setFailed(true); } });
    return () => { controller.abort(); if (!finished) loaded.current = false; };
  }, [visible, retry]);
  useEffect(() => {
    if (!visible || paused || hover || focused || expanded || items.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => { if (!document.hidden) setIndex(old => (old + 1) % items.length); }, 9000);
    return () => window.clearInterval(timer);
  }, [visible, paused, hover, focused, expanded, items.length]);
  function open(all: boolean) { opener.current = document.activeElement as HTMLElement; setGallery(all); setExpanded(true); modal.current?.showModal(); }
  function close() { modal.current?.close(); setExpanded(false); opener.current?.focus(); }
  const item = items[index];
  return <section ref={root} className={styles.section} dir="rtl" aria-labelledby="heart-heading" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className={styles.intro}><span className={styles.eyebrow}>من أبنائنا… بكل محبة</span><h2 id="heart-heading">رسائل من القلب <span aria-hidden="true">♡</span></h2><p>كلمات عفوية من أبنائنا… نعتز بها ونحفظ أثرها الجميل.</p><blockquote>«وصلت كلماتكم إلى قلبي… فخور بكم وبكل خطوة تخطونها في التعلّم.»</blockquote><small>معلمكم المحب: إبراهيم أحمد</small>
      {item && <button className={styles.all} onClick={() => open(true)}>شاهد جميع الرسائل ←</button>}
    </div>
    <div className={styles.display}>
      {item ? <><button className={styles.imageButton} onClick={() => open(false)} aria-label={`تكبير الرسالة: ${item.title}`}><Image unoptimized src={item.imageUrl} alt={item.title} width={1100} height={1400} loading="lazy" className={styles.letter} /></button><div className={styles.caption}><strong>{item.title}</strong>{item.studentName && <span>{item.studentName}</span>}<small>بخط أبنائنا ورسوماتهم الأصلية · اضغط للتكبير</small></div><div className={styles.controls}><button aria-label="الرسالة السابقة" onClick={() => setIndex((index - 1 + items.length) % items.length)}>→</button><span>{index + 1} / {items.length}</span><button aria-label="الرسالة التالية" onClick={() => setIndex((index + 1) % items.length)}>←</button><button onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? 'تشغيل التبديل' : 'إيقاف التبديل'}</button></div></> : <p className={styles.empty}>{failed ? <>تعذّر تحميل الرسائل. <button onClick={() => { loaded.current = false; setRetry(old => old + 1); }}>إعادة المحاولة</button></> : 'هنا نحفظ كلمات أبنائنا الجميلة 💚'}</p>}
    </div>
    <dialog ref={modal} className={styles.dialog} onCancel={close} onClose={() => { setExpanded(false); opener.current?.focus(); }}><button className={styles.close} onClick={close} autoFocus>إغلاق ×</button><h2>{gallery ? 'رسائل من القلب' : item?.title}</h2><div className={gallery ? styles.gallery : ''}>{expanded && (gallery ? items : item ? [item] : []).map(row => <figure key={row.id}><Image unoptimized src={row.imageUrl} width={1100} height={1400} loading="lazy" alt={row.title} /><figcaption>{row.title}{row.studentName ? ` — ${row.studentName}` : ''}</figcaption></figure>)}</div></dialog>
  </section>;
}
