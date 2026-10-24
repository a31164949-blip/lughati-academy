'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { COUNCIL_SEEN_EVENT, councilTopicSeen } from '../lib/councilNoticeSeen';
import styles from './ContinuationReplyNotice.module.css';
type Topic = { id: string; title: string; active: boolean; status: string };
export default function CouncilTopicNotice() {
  const [topics, setTopics] = useState<Topic[]>([]);
  useEffect(() => {
    let version = 0, pending = false, lastCheck = 0, saved: Topic[] = [];
    const display = () => {
      const account = auth.currentUser;
      setTopics(account ? saved.filter(topic => !councilTopicSeen(account.uid, topic.id)) : []);
    };
    const check = async (current: number) => {
      const account = auth.currentUser;
      if (!account || pending) return;
      pending = true; lastCheck = Date.now();
      try {
        const token = await account.getIdTokenResult();
        if (current !== version || token.claims.role !== 'student') return;
        const response = await fetch('/api/academy-council?view=published', { headers: { Authorization: 'Bearer ' + token.token }, cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (current !== version || !data.success) return;
        saved = (Array.isArray(data.topics) ? data.topics : []).filter((topic: Topic) => topic.status === 'published' && topic.active);
        display();
      } catch { /* Council remains accessible when the notice cannot refresh. */ }
      finally { if (current === version) pending = false; }
    };
    const unsubscribe = onAuthStateChanged(auth, () => {
      ++version; saved = []; pending = false; setTopics([]);
      void check(version);
    });
    const focus = () => { if (document.visibilityState !== 'hidden' && Date.now() - lastCheck >= 60000) void check(version); };
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', focus);
    window.addEventListener(COUNCIL_SEEN_EVENT, display); window.addEventListener('storage', display);
    return () => { ++version; unsubscribe(); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); window.removeEventListener(COUNCIL_SEEN_EVENT, display); window.removeEventListener('storage', display); };
  }, []);
  if (!topics.length) return null;
  return <aside dir="rtl" className={styles.notice} aria-label="مواضيع جديدة في مجلس الأكاديمية">
    <div className={styles.heading}><span className={styles.icon} aria-hidden="true">🔔</span><div><strong>دعوة للنقاش في مجلس الأكاديمية</strong><p>بانتظار رأيك ومشاركتك</p></div><span className={styles.badge}>جديد · {topics.length}</span></div>
    {topics.map(topic => <div key={topic.id} className={styles.heading} style={{ marginTop: 14 }}><strong style={{ overflowWrap: 'anywhere' }}>{topic.title}</strong><a className={styles.topicLink} href={'/discussion?topicId=' + encodeURIComponent(topic.id)}>قراءة الموضوع والمشاركة ←</a></div>)}
  </aside>;
}
