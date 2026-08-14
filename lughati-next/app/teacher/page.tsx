import Link from "next/link";

const sections = [
  {
    title: "📢 إدارة الإعلانات",
    description: "إنشاء الإعلانات وتعديلها ونشرها للطلاب.",
    href: "/teacher/announcements",
  },
  {
    title: "🗓️ الخطة الأسبوعية",
    description: "إعداد خطة الأسبوع والدروس والأهداف والواجبات.",
    href: "/teacher/weekly-plan",
  },
  {
    title: "📝 إدارة الواجبات",
    description: "إنشاء الواجبات اليومية ونشرها للفصول.",
    href: "/teacher/homeworks",
  },
  {
    title: "📝 إدارة الاختبارات",
    description: "إنشاء الاختبارات والأسئلة ونشرها للطلاب.",
    href: "/teacher/quizzes",
  },
  {
    title: "📋 متابعة إنجاز الواجبات",
    description: "معرفة الطلاب الذين أكدوا الإنجاز ومراجعة حالاتهم.",
    href: "/teacher/homework-tracking",
  },
  {
    title: "🎙️ مراجعة قراءات الطلاب",
    description: "الاستماع إلى تسجيلات القراءة واعتمادها أو طلب إعادة التسجيل.",
    href: "/teacher/reading-submissions",
  },
  {
    title: "👨‍🎓 إدارة الطلاب",
    description: "إضافة الطلاب وتنظيمهم حسب الفصل.",
    href: "/teacher/students",
  },
  {
    title: "🏫 تهيئة العام الدراسي",
    description: "إعداد الطلاب والفصول وبيانات الدخول قبل بداية العام الدراسي.",
    href: "/teacher/school-year",
  },
  {
    title: "📅 إدارة الجدول المدرسي",
    description: "إعداد جدول الثاني أ والثاني ب وأوقات الحصص.",
    href: "/teacher/school-schedule",
  },
  {
    title: "📋 السجل الذكي",
    description: "متابعة الحضور والغياب والواجب والقراءة والمشاركة يوميًا.",
    href: "/teacher/smart-record",
  },
  {
    title: "🌟 أبطال الأكاديمية",
    description: "إدارة الأبطال والألقاب والإنجازات والنشر في الواجهة العامة.",
    href: "/teacher/heroes",
  },
  {
    title: "📤 مراجعة أعمال الطلاب",
    description: "مراجعة الملفات والصور والمقاطع المرفوعة.",
    href: "/teacher/submissions",
  },
  {
    title: "🎨 إدارة معرض الطلاب",
    description: "إدارة الأعمال المنشورة وتمييزها أو إخفاؤها ومتابعة محتوى المعرض.",
    href: "/teacher/gallery",
  },
  {
    title: "✨ جماليات الدفاتر",
    description: "إدارة ونشر صور الدفاتر المميزة وتصنيفها وعرضها في معرض الطلاب.",
    href: "/teacher/notebook-gallery",
  },
];

export default function TeacherDashboardPage() {
  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.icon}>👨‍🏫</div>

        <div>
          <p style={styles.label}>أكاديمية لغتي الرقمية</p>

          <h1 style={styles.title}>لوحة المعلم</h1>

          <p style={styles.subtitle}>
            أهلاً أستاذ إبراهيم، اختر القسم الذي ترغب في إدارته.
          </p>
        </div>
      </section>

      <section style={styles.stats}>
        <article style={styles.statCard}>
          <strong style={styles.statNumber}>60</strong>
          <span>طالبًا</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>2</strong>
          <span>فصلان</span>
        </article>

        <article style={styles.statCard}>
          <strong style={styles.statNumber}>
            {sections.length}
          </strong>
          <span>أداة إدارية</span>
        </article>
      </section>

      <section>
        <div style={styles.heading}>
          <p style={styles.label}>الإدارة اليومية</p>

          <h2 style={styles.sectionTitle}>
            أقسام لوحة المعلم
          </h2>
        </div>

        <div style={styles.grid}>
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              style={
                section.href === "/teacher/heroes"
                  ? {
                      ...styles.card,
                      ...styles.heroesCard,
                    }
                  : styles.card
              }
            >
              <h3 style={styles.cardTitle}>
                {section.title}
              </h3>

              <p style={styles.cardText}>
                {section.description}
              </p>

              <span
                style={
                  section.href === "/teacher/heroes"
                    ? {
                        ...styles.open,
                        color: "#8a6500",
                      }
                    : styles.open
                }
              >
                فتح القسم ←
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section style={styles.note}>
        <span style={styles.noteIcon}>⚡</span>

        <div>
          <strong>كل أدوات المعلم في مكان واحد</strong>

          <p style={styles.noteText}>
            يمكنك الوصول مباشرة إلى الجدول المدرسي والسجل الذكي
            وأبطال الأكاديمية والواجبات والاختبارات دون كتابة أي رابط.
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
    color: "#174d3b",
    fontFamily: "Arial, sans-serif",
  },

  hero: {
    maxWidth: "1100px",
    margin: "0 auto 28px",
    padding: "28px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    borderRadius: "28px",
    background: "#ffffff",
    border: "1px solid #d6ebe2",
    boxShadow: "0 12px 35px rgba(23, 77, 59, 0.08)",
  },

  icon: {
    width: "90px",
    height: "90px",
    display: "grid",
    placeItems: "center",
    borderRadius: "24px",
    background: "#168c65",
    fontSize: "45px",
  },

  label: {
    margin: "0 0 8px",
    color: "#168c65",
    fontWeight: 800,
  },

  title: {
    margin: 0,
    fontSize: "42px",
    lineHeight: 1.3,
  },

  subtitle: {
    margin: "10px 0 0",
    color: "#668379",
    fontSize: "18px",
    lineHeight: 1.8,
  },

  stats: {
    maxWidth: "1100px",
    margin: "0 auto 30px",
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "16px",
  },

  statCard: {
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    borderRadius: "22px",
    background: "#ffffff",
    border: "1px solid #d6ebe2",
  },

  statNumber: {
    color: "#168c65",
    fontSize: "38px",
  },

  heading: {
    maxWidth: "1100px",
    margin: "0 auto 18px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "32px",
  },

  grid: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },

  card: {
    padding: "24px",
    minHeight: "170px",
    display: "flex",
    flexDirection: "column",
    borderRadius: "24px",
    background: "#ffffff",
    border: "1px solid #d6ebe2",
    boxShadow:
      "0 10px 28px rgba(23, 77, 59, 0.06)",
    color: "#174d3b",
    textDecoration: "none",
  },

  heroesCard: {
    background:
      "linear-gradient(135deg, #fffdf2 0%, #fff8d8 100%)",
    border: "2px solid #f0d56b",
    boxShadow:
      "0 12px 30px rgba(180, 140, 20, 0.12)",
  },

  cardTitle: {
    margin: "0 0 12px",
    fontSize: "24px",
  },

  cardText: {
    margin: 0,
    color: "#668379",
    lineHeight: 1.8,
    flex: 1,
  },

  open: {
    marginTop: "20px",
    color: "#168c65",
    fontWeight: 800,
  },

  note: {
    maxWidth: "1100px",
    margin: "28px auto 0",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    borderRadius: "22px",
    background: "#e8f7f0",
    border: "1px solid #cde9dc",
  },

  noteIcon: {
    fontSize: "34px",
  },

  noteText: {
    margin: "6px 0 0",
    color: "#668379",
    lineHeight: 1.7,
  },
};