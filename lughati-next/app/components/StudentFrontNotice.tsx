'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { usePathname } from 'next/navigation';
import { auth } from '../../firebase';
import type { StudentFrontNotice as Notice } from '../lib/studentFrontNotice';
import StudentNoticeReplies from './StudentNoticeReplies';
import styles from './StudentFrontNotice.module.css';
export function StudentNoticeBanner({ notice, children }: { notice: Notice; children?: React.ReactNode }) {
  const safeHref = /^\/[A-Za-z0-9/?#&=_.%+-]*$/.test(notice.href) && !notice.href.startsWith('//') && !/%0[ad]|%5c/i.test(notice.href);
  return <aside dir="rtl" className={styles.notice} aria-label="رسالة من معلمك"><p className={styles.kicker}>📣 تنبيه من معلمك</p><h2>{notice.title}</h2><p className={styles.message}>{notice.message}</p>{notice.href && safeHref && <a className={styles.link} href={notice.href}>{notice.linkLabel} ←</a>}{children}</aside>;
}
function StudentFrontNotice({ user }: { user: User | null }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  useEffect(() => {
    if (!user) return;
    let alive = true, lastCheck = 0, pending = false;
    async function load() {
      if (pending || document.visibilityState === 'hidden' || Date.now() - lastCheck < 60000) return;
      pending = true; lastCheck = Date.now();
      try {
        const token = await user!.getIdToken();
        const response = await fetch('/api/student-front-notice', { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' });
        if (!response.ok) { if (alive) setNotice(null); return; }
        const data = await response.json();
        if (alive) setNotice(data.success && data.notice?.active ? data.notice : null);
      } catch { /* Keep the last displayed message when temporarily offline. */ }
      finally { pending = false; }
    }
    void load();
    const focus = () => void load();
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', focus);
    return () => { alive = false; window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); };
  }, [user]);
  return user && notice ? <StudentNoticeBanner notice={notice}>{notice.noticeId && <StudentNoticeReplies key={notice.noticeId} noticeId={notice.noticeId} allowReplies={notice.allowReplies} />}</StudentNoticeBanner> : null;
}

export default function StudentFrontNoticeSlot() {
  const path = usePathname();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  return path === '/journey' && user ? <StudentFrontNotice key={user.uid} user={user} /> : null;
}
