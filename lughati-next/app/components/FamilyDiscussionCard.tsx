import Link from "next/link";
import styles from "./FamilyDiscussionCard.module.css";

export default function FamilyDiscussionCard() {
  return (
    <section className={styles.card} aria-label="زاوية الحوار مع الأسرة" dir="rtl">
      <div className={styles.content}>
        <span className={styles.label}>🤝 زاوية الحوار مع الأسرة</span>
        <h2>نتحاور من أجل أبنائنا</h2>
        <p>ما الصعوبات التي تواجه ابنك؟ وما مقترحاتك لدعمه؟ شاركنا رأيك، لنتعاون على تقدّمه ونبحث عن الحلول معًا.</p>
        <p className={styles.privacy}>🔒 تختار أنت: مشاركة للمعلم فقط، أو للجميع بعد اعتماد المعلم. ويمكن للمعلم الردّ عليك داخل الزاوية.</p>
      </div>
      <Link href="/discussion" className={styles.button}>
        <span aria-hidden="true">💬</span> شاركنا رأيك
        <span aria-hidden="true">←</span>
      </Link>
    </section>
  );
}
