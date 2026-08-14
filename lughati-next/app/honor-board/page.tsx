"use client";

export default function HonorBoardPage() {
  return (
    <main style={styles.page} dir="rtl">
      <a href="/journey" style={styles.backButton}>
        ← العودة إلى رحلتي
      </a>

      <section style={styles.hero}>
        <div style={styles.heroIcon}>🏆</div>

        <div>
          <p style={styles.eyebrow}>أكاديمية لغتي الرقمية</p>

          <h1 style={styles.title}>لوحة الشرف</h1>

          <p style={styles.subtitle}>
            نحتفي بالاجتهاد والتقدم والاستمرار، فكل طالب يستطيع أن يكون من أبطال الأكاديمية.
          </p>
        </div>
      </section>

      <section style={styles.highlightCard}>
        <div style={styles.bigIcon}>🌟</div>

        <h2 style={styles.highlightTitle}>
          كل مجتهد له مكان في لوحة الشرف
        </h2>

        <p style={styles.highlightText}>
          لا تعتمد لوحة الشرف على الدرجات فقط، بل على القراءة، والإملاء،
          وإنجاز الواجبات، والاستمرار، والتطور الملحوظ.
        </p>
      </section>

      <section style={styles.cardsGrid}>
        <article style={styles.rewardCard}>
          <div style={styles.cardIcon}>📚</div>
          <h3 style={styles.cardTitle}>بطل القراءة</h3>
          <p style={styles.cardText}>
            للطالب الذي يواصل القراءة ويتطور يومًا بعد يوم.
          </p>
        </article>

        <article style={styles.rewardCard}>
          <div style={styles.cardIcon}>✍️</div>
          <h3 style={styles.cardTitle}>بطل الإملاء</h3>
          <p style={styles.cardText}>
            لمن يحرص على التدريب ويتقدم في كتابة الكلمات بصورة صحيحة.
          </p>
        </article>

        <article style={styles.rewardCard}>
          <div style={styles.cardIcon}>🔥</div>
          <h3 style={styles.cardTitle}>وسام الاستمرارية</h3>
          <p style={styles.cardText}>
            للطالب الذي يحافظ على إنجازه ويستمر دون انقطاع.
          </p>
        </article>

        <article style={styles.rewardCard}>
          <div style={styles.cardIcon}>🌱</div>
          <h3 style={styles.cardTitle}>الأكثر تطورًا</h3>
          <p style={styles.cardText}>
            للطالب الذي يظهر تقدمًا واضحًا مقارنة بمستواه السابق.
          </p>
        </article>

        <article style={styles.rewardCard}>
          <div style={styles.cardIcon}>✅</div>
          <h3 style={styles.cardTitle}>الأكثر التزامًا</h3>
          <p style={styles.cardText}>
            لمن ينجز مهامه ويحافظ على واجباته باستمرار.
          </p>
        </article>

        <article style={styles.rewardCard}>
          <div style={styles.cardIcon}>🎨</div>
          <h3 style={styles.cardTitle}>مبدع الأكاديمية</h3>
          <p style={styles.cardText}>
            للأعمال المميزة والمشاركات الإبداعية الجميلة.
          </p>
        </article>
      </section>

      <section style={styles.comingSection}>
        <div style={styles.comingIcon}>👑</div>

        <div>
          <h2 style={styles.comingTitle}>
            قريبًا: أبطال هذا الأسبوع
          </h2>

          <p style={styles.comingText}>
            ستظهر هنا أسماء الطلاب المتميزين بعد اعتماد الإنجازات من المعلم،
            مع الحفاظ على خصوصية بيانات الطلاب.
          </p>
        </div>
      </section>

      <section style={styles.messageCard}>
        <div style={styles.messageIcon}>💚</div>

        <div>
          <h3 style={styles.messageTitle}>
            لا تقارن نفسك بغيرك
          </h3>

          <p style={styles.messageText}>
            نافس نفسك، وتقدم خطوة كل يوم، فكل تقدم صغير يقربك من التميز.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background:
      "linear-gradient(180deg, #f2fbf7 0%, #ffffff 100%)",
    color: "#154f3d",
    fontFamily: "Arial, sans-serif",
  },

  backButton: {
    display: "inline-block",
    marginBottom: "18px",
    textDecoration: "none",
    background: "#ffffff",
    color: "#087f5b",
    border: "1px solid #b7ead6",
    borderRadius: "14px",
    padding: "12px 18px",
    fontWeight: 700,
  },

  hero: {
    maxWidth: "1100px",
    margin: "0 auto 28px",
    padding: "30px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    borderRadius: "28px",
    background: "#ffffff",
    border: "1px solid #cfe5da",
    boxShadow: "0 12px 30px rgba(21, 79, 61, 0.08)",
    flexWrap: "wrap",
  },

  heroIcon: {
    width: "96px",
    height: "96px",
    display: "grid",
    placeItems: "center",
    borderRadius: "26px",
    background: "#15936d",
    fontSize: "48px",
  },

  eyebrow: {
    margin: "0 0 8px",
    color: "#168c68",
    fontSize: "18px",
    fontWeight: 800,
  },

  title: {
    margin: 0,
    fontSize: "44px",
    color: "#123f32",
  },

  subtitle: {
    margin: "10px 0 0",
    color: "#648579",
    fontSize: "18px",
    lineHeight: 1.8,
  },

  highlightCard: {
    maxWidth: "1100px",
    margin: "0 auto 28px",
    padding: "30px",
    textAlign: "center",
    borderRadius: "28px",
    background:
      "linear-gradient(135deg, #fff9db 0%, #fffef7 100%)",
    border: "1px solid #f1df95",
  },

  bigIcon: {
    fontSize: "56px",
  },

  highlightTitle: {
    margin: "12px 0 10px",
    fontSize: "28px",
    color: "#7a5a0a",
  },

  highlightText: {
    margin: 0,
    color: "#6b5b2a",
    fontSize: "17px",
    lineHeight: 1.9,
  },

  cardsGrid: {
    maxWidth: "1100px",
    margin: "0 auto 30px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },

  rewardCard: {
    padding: "24px",
    borderRadius: "24px",
    background: "#ffffff",
    border: "1px solid #cfe5da",
    boxShadow: "0 8px 22px rgba(21, 79, 61, 0.06)",
  },

  cardIcon: {
    fontSize: "40px",
    marginBottom: "12px",
  },

  cardTitle: {
    margin: "0 0 9px",
    color: "#123f32",
    fontSize: "21px",
  },

  cardText: {
    margin: 0,
    color: "#648579",
    lineHeight: 1.8,
  },

  comingSection: {
    maxWidth: "1100px",
    margin: "0 auto 24px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    borderRadius: "24px",
    background: "#eef9f4",
    border: "1px solid #cfe5da",
  },

  comingIcon: {
    fontSize: "44px",
  },

  comingTitle: {
    margin: "0 0 7px",
    color: "#154f3d",
  },

  comingText: {
    margin: 0,
    color: "#5d7e73",
    lineHeight: 1.8,
  },

  messageCard: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    borderRadius: "24px",
    background: "#f8fbff",
    border: "1px solid #dce7f3",
  },

  messageIcon: {
    fontSize: "40px",
  },

  messageTitle: {
    margin: "0 0 6px",
    color: "#173b57",
  },

  messageText: {
    margin: 0,
    color: "#60788c",
    lineHeight: 1.8,
  },
};