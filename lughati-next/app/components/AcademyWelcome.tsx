import Link from 'next/link';
import AcademyLogo from './AcademyLogo';
import styles from './AcademyWelcome.module.css';
import LiveChallengeChampions from './LiveChallengeChampions';
export default function AcademyWelcome({ paused = false, showCouncil = false }: { paused?: boolean; showCouncil?: boolean }) {
  return <header className={styles.welcome} dir="rtl">
    <div className={styles.top}>{paused ? <div className={styles.brand}><AcademyLogo size={78} /><div><strong>أكاديمية لغتي الرقمية</strong><p>نتعلّم… نقرأ… نبدع</p></div></div> : <span className={styles.label}>مساحة التعلّم والإنجاز</span>}{showCouncil && <Link href="/discussion" className={styles.nav}>مجلس الأكاديمية ↗</Link>}</div>
    <div className={styles.copy}><span className={styles.label}>كل كلمة… بداية لنجاح</span><h2>نقرأ اليوم،<br /><span>لنصنع حكاية الغد.</span></h2><p>رحلة يتقدّم فيها أبناؤنا بالقراءة، وتكبر فيها إنجازاتهم بتشجيع الأسرة ومساندة المعلم.</p></div>
    {showCouncil && !paused && <LiveChallengeChampions />}
    <div className={styles.bottom}><span>لغتنا هويتنا</span><span>الأسرة شريك النجاح</span><span>{paused ? 'خدمات الطلاب موقفة مؤقتًا' : 'لكل جهد أثر يستحق التقدير'}</span></div>
    <div className={styles.art} aria-hidden="true"><span>أ</span><span>ب</span><span>ت</span><i>✦</i></div>
  </header>;
}
