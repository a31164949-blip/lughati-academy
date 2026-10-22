import Link from "next/link";
import styles from "./FamilyDiscussionCard.module.css";

export default function FamilyDiscussionCard() {
  return (
    <section className={styles.card} aria-label="مساحة الفكرة والمشاركة" dir="rtl">
      <div className={styles.content}>
        <span className={styles.label}>🤝 مساحة الفكرة والمشاركة</span>
        <h2>مجلس الأكاديمية</h2>
        <p>فكرة تستحق أن تُسمع، وتجربة تستحق أن تُروى. شاركنا موضوعك، وتحاور مع مجتمع الأكاديمية بإشراف المعلم.</p>
        <p className={styles.privacy}>✦ مواضيع الأعضاء تُنشر بعد اعتماد المعلم، وخيارات خصوصية الردود واضحة قبل المشاركة.</p>
      </div>
      <Link href="/discussion" className={styles.button}>
        <span aria-hidden="true">💬</span> ادخل مجلسنا
        <span aria-hidden="true">←</span>
      </Link>
    </section>
  );
}
