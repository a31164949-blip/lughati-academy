'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import type { LiveChampion } from '../lib/liveChallengeChampions';
import styles from './LiveChallengeChampions.module.css';
export default function LiveChallengeChampions() {
  const [items, setItems] = useState<LiveChampion[]>([]), [error, setError] = useState(false), [retry, setRetry] = useState(0), [loading, setLoading] = useState(true);
  useEffect(() => {
    let version = 0;
    const stop = onAuthStateChanged(auth, async user => {
      const current = ++version; setItems([]); setError(false); setLoading(Boolean(user));
      if (!user) return;
      try {
        const response = await fetch('/api/live-challenge-champions', { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: 'no-store' });
        if (!response.ok) throw Error('CHAMPIONS');
        const data = await response.json();
        if (!data.success || !Array.isArray(data.champions)) throw Error('CHAMPIONS');
        if (version === current) setItems(data.champions.filter((item: LiveChampion) => item.published));
      } catch { if (version === current) setError(true); }
      finally { if (version === current) setLoading(false); }
    });
    return () => { ++version; stop(); };
  }, [retry]);
  if (!loading && !error && !items.length) return null;
  return <section className={styles.panel} aria-label="أبطال التحدي المباشر">
    <div className={styles.heading}><span aria-hidden="true">🏆</span><div><h3>أبطال التحدي المباشر</h3><p>نحتفي بإنجازهم… والبطل القادم قد يكون أنت!</p></div></div>
    {loading ? <p className={styles.hint} role="status">جارٍ تحميل أبطالنا…</p> : error ? <button type="button" className={styles.retry} onClick={() => setRetry(value => value + 1)}>إعادة تحميل صور الأبطال</button> : <ul className={styles.list} aria-label="صور أبطال التحدي المباشر">{items.map(item => <li key={item.id} className={styles.item}><div className={styles.photo}><Image unoptimized src={item.imageUrl} alt={item.name ? `البطل ${item.name}` : 'بطل التحدي المباشر يحمل كأس الفوز'} width={108} height={144} style={{ transform: `scale(${item.zoom})` }} /></div><span className={styles.cup} aria-hidden="true">🏆</span><strong>{item.name || 'بطل التحدي'}</strong>{item.weekLabel && <small>{item.weekLabel}</small>}</li>)}</ul>}
    {items.length > 4 && <p className={styles.hint}>اسحب لمشاهدة بقية أبطالنا ←</p>}
  </section>;
}
