'use client';
import { useEffect, useState } from 'react';
import styles from './AcademyContinuation.module.css';
type Seats = { capacity: number; registered: number; remaining: number };
const number = (value: number) => value.toLocaleString('ar-SA');
export default function AcademySeatCounter({ refreshKey }: { refreshKey: number }) {
  const [seats, setSeats] = useState<Seats | null>(null);
  const [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/academy-continuation/seats', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw Error('SEATS');
        const data = await response.json();
        if (!data.success || ![data.capacity, data.registered, data.remaining].every(value => Number.isSafeInteger(value) && value >= 0)) throw Error('SEATS');
        if (!controller.signal.aborted) { setSeats(data); setFailed(false); }
      }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [refreshKey, retry]);
  return <div className={styles.seats} aria-live="polite">
    {failed ? <><p>تعذر تحديث عدد المقاعد حاليًا.</p><button type="button" className={styles.secondary} onClick={() => setRetry(value => value + 1)}>إعادة المحاولة</button></> : seats ? <>
      <div className={styles.seatNumbers}><div><strong>{number(seats.remaining)}</strong><span>{seats.remaining ? 'مقعدًا متبقيًا فقط' : 'مقاعد متبقية'}</span></div><div><strong>{number(seats.registered)}</strong><span>رغبة مسجّلة</span></div><div><strong>{number(seats.capacity)}</strong><span>الطاقة الاستيعابية</span></div></div>
      <progress max={seats.capacity} value={Math.min(seats.capacity, seats.registered)} aria-label="الرغبات المسجلة من الطاقة الاستيعابية" />
      <p>{seats.remaining ? 'المتبقي محسوب من رغبات الطلاب المسجّلة، والقبول النهائي بعد مراجعة المعلم.' : 'بلغت الرغبات المسجّلة الطاقة الاستيعابية. يمكن إرسال رغبتك للمراجعة في حال توافر مقعد.'}</p>
    </> : <p role="status">جارٍ تحديث عدد المقاعد…</p>}
  </div>;
}
