'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import styles from './ContinuationReplyNotice.module.css';
type Reply = { text: string; at: string };
export default function ContinuationReplyNotice() {
  const [reply, setReply] = useState<Reply | null>(null);
  const [opened, setOpened] = useState(false);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    let version = 0, lastCheck = 0, pending = false;
    const check = async (generation: number) => {
      const account = auth.currentUser;
      if (!account || pending) return;
      pending = true; lastCheck = Date.now();
      try {
        const token = await account.getIdTokenResult();
        if (generation !== version || token.claims.role !== 'student') return;
        const response = await fetch('/api/academy-continuation', { headers: { Authorization: 'Bearer ' + token.token }, cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (generation !== version || !data.success) return;
        const saved = data.request;
        setReply(saved?.teacherReply ? { text: saved.teacherReply, at: saved.teacherReplyAt || '' } : null);
        try { setSeen(localStorage.getItem('continuation-reply-seen:' + account.uid) === saved?.teacherReplyAt); } catch { setSeen(false); }
      } catch { /* The request card remains available if the notice cannot load. */ }
      finally { if (generation === version) pending = false; }
    };
    const unsubscribe = onAuthStateChanged(auth, () => {
      ++version; pending = false; setReply(null); setOpened(false); setSeen(false);
      void check(version);
    });
    const focus = () => { if (document.visibilityState !== 'hidden' && Date.now() - lastCheck >= 60000) void check(version); };
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', focus);
    return () => { ++version; unsubscribe(); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); };
  }, []);
  function open() {
    setOpened(value => !value);
    if (!opened && reply) {
      setSeen(true);
      try { if (auth.currentUser) localStorage.setItem('continuation-reply-seen:' + auth.currentUser.uid, reply.at); } catch { /* Reading the reply does not depend on browser storage. */ }
    }
  }
  if (!reply) return null;
  return <aside dir="rtl" className={styles.notice} aria-label="رد المعلم على طلب العودة">
    <div className={styles.heading}><span className={styles.icon} aria-hidden="true">🔔</span><div><strong>{seen ? 'رد المعلم على طلب عودتك' : 'لديك رد من معلمك على طلب العودة'}</strong><p>رسالة خاصة بك — يمكنك قراءتها حتى بعد قبولك.</p></div>{!seen && <span className={styles.badge}>جديد</span>}<button type="button" onClick={open} aria-expanded={opened} aria-controls="continuation-reply-content">{opened ? 'إغلاق الرد' : 'قراءة الرد'}</button></div>
    {opened && <div id="continuation-reply-content" className={styles.content}><h2>رسالة معلمك</h2><p>{reply.text}</p>{reply.at && <small>{new Date(reply.at).toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}</small>}</div>}
  </aside>;
}
