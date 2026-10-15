import Image from "next/image";
import styles from "./NationalIdentity.module.css";

// Portraits: Saudi Ministry of Foreign Affairs, /en/ksa/Pages/leadership.aspx.
export default function NationalIdentity() {
  return (
    <section className={styles.banner} aria-label="وطننا وقيادتنا" dir="rtl">
      <figure className={styles.leader}>
        <Image className={styles.portrait} src="/national/king.webp" width={144} height={146} alt="خادم الحرمين الشريفين الملك سلمان بن عبدالعزيز آل سعود" unoptimized />
        <figcaption><span>خادم الحرمين الشريفين</span><strong>الملك سلمان بن عبدالعزيز</strong><small>حفظه الله</small></figcaption>
      </figure>
      <div className={styles.center}>
        <Image className={styles.flag} src="/national/saudi-flag.svg" width={120} height={80} alt="علم المملكة العربية السعودية" unoptimized />
        <p className={styles.eyebrow}>المملكة العربية السعودية</p>
        <h2>بعلمنا نبني مستقبل وطننا</h2>
        <p className={styles.message}>في أكاديمية لغتي… نعتز بلغتنا، ونفخر بوطننا</p>
      </div>
      <figure className={styles.leader}>
        <Image className={styles.portrait} src="/national/prince.webp" width={144} height={146} alt="صاحب السمو الملكي الأمير محمد بن سلمان بن عبدالعزيز آل سعود" unoptimized />
        <figcaption><span>صاحب السمو الملكي الأمير</span><strong>محمد بن سلمان بن عبدالعزيز</strong><small>ولي العهد رئيس مجلس الوزراء — حفظه الله</small></figcaption>
      </figure>
    </section>
  );
}
