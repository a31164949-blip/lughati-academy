import styles from "./TeacherWhatsAppCard.module.css";

export default function TeacherWhatsAppCard() {
  return (
    <section className={styles.card} aria-label="التواصل المباشر مع المعلم" dir="rtl">
      <div className={styles.copy}>
        <span className={styles.label}>💬 التواصل المباشر مع المعلم</span>
        <h2>معك حتى تتجاوز الصعوبة</h2>
        <p>هل واجهتك صعوبة في درس أو واجب، أو مشكلة في دخول الأكاديمية؟ تواصل مع معلمك بمساعدة أسرتك؛ لنتعاون على حلها وتواصل تعلّمك بثقة.</p>
      </div>
      <div className={styles.action}>
        <a href="/contact" target="_blank" rel="noopener noreferrer">تواصل مع معلمي عبر واتساب <span aria-hidden="true">↗</span></a>
        <small>يفتح واتساب، ويمكنك مراجعة رسالتك قبل إرسالها.</small>
      </div>
    </section>
  );
}
