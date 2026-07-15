const units = [
  {
    title: "الوحدة الأولى",
    subtitle: "آداب التعامل",
    icon: "🤝",
    href: "#",
  },
  {
    title: "الوحدة الثانية",
    subtitle: "أصدقائي وجيراني",
    icon: "👦",
    href: "#",
  },
  {
    title: "الوحدة الثالثة",
    subtitle: "وطني السعودية",
    icon: "🇸🇦",
    href: "#",
  },
  {
    title: "الوحدة الرابعة",
    subtitle: "محاصيل من بلادي",
    icon: "🌾",
    href: "#",
  },
];

export default function LessonsPage() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #ecfdf5 0%, #eff6ff 100%)",
        padding: "32px 20px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "32px",
          }}
        >
          <div>
            <p
              style={{
                color: "#0f766e",
                fontSize: "18px",
                fontWeight: "700",
                margin: "0 0 8px",
              }}
            >
              أكاديمية لغتي
            </p>

            <h1
              style={{
                color: "#0f172a",
                fontSize: "42px",
                margin: "0 0 10px",
              }}
            >
              📚 دروسي
            </h1>

            <p
              style={{
                color: "#475569",
                fontSize: "20px",
                margin: 0,
              }}
            >
              اختر الوحدة التي تريد أن تبدأ بها رحلتك التعليمية
            </p>
          </div>

          <a
            href="/"
            style={{
              textDecoration: "none",
              background: "#ffffff",
              color: "#0f766e",
              padding: "12px 18px",
              borderRadius: "14px",
              border: "1px solid #ccfbf1",
              fontWeight: "700",
              boxShadow: "0 8px 20px rgba(15, 118, 110, 0.08)",
            }}
          >
            العودة للرئيسية
          </a>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "22px",
          }}
        >
          {units.map((unit) => (
            <article
              key={unit.title}
              style={{
                background: "#ffffff",
                borderRadius: "24px",
                padding: "28px",
                boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "18px",
                  background: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  marginBottom: "20px",
                }}
              >
                {unit.icon}
              </div>

              <h2
                style={{
                  color: "#0f766e",
                  fontSize: "28px",
                  margin: "0 0 10px",
                }}
              >
                {unit.title}
              </h2>

              <p
                style={{
                  color: "#475569",
                  fontSize: "18px",
                  lineHeight: "1.8",
                  margin: "0 0 22px",
                }}
              >
                {unit.subtitle}
              </p>

              <a
                href={unit.href}
                style={{
                  display: "block",
                  textAlign: "center",
                  textDecoration: "none",
                  background: "#059669",
                  color: "#ffffff",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  fontSize: "17px",
                  fontWeight: "700",
                }}
              >
                الدخول إلى دروس الوحدة
              </a>
            </article>
          ))}
        </div>

        <section
          style={{
            marginTop: "34px",
            background: "#ffffff",
            borderRadius: "20px",
            padding: "22px",
            border: "1px solid #dbeafe",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
          }}
        >
          <h3
            style={{
              color: "#0f172a",
              fontSize: "24px",
              margin: "0 0 10px",
            }}
          >
            ماذا ستجد داخل كل درس؟
          </h3>

          <p
            style={{
              color: "#64748b",
              fontSize: "17px",
              lineHeight: "1.8",
              margin: 0,
            }}
          >
            شرح مبسط، قراءة، مفردات، تدريبات، أوراق عمل، ألعاب تعليمية،
            وتقويم قصير لكل درس.
          </p>
        </section>
      </section>
    </main>
  );
}