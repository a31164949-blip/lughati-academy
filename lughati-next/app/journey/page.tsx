import Link from "next/link";

const shortcuts = [
  {
    icon: "📚",
    title: "الدروس",
    description: "تعلم واقرأ واستمتع",
    href: "/lessons",
    background: "#e8f2ff",
  },
  {
    icon: "📝",
    title: "واجباتي",
    description: "أنجز واجباتك اليومية",
    href: "/homeworks",
    background: "#fff3df",
  },
  {
    icon: "📅",
    title: "خطتي الأسبوعية",
    description: "تعرف على مهام الأسبوع",
    href: "/weekly-plan",
    background: "#e9f9ee",
  },
  {
    icon: "🌱",
    title: "رحلة الدعم",
    description: "تدريبات تساعدني على التقدم",
    href: "/support",
    background: "#f2ebff",
  },
  {
    icon: "🏆",
    title: "لوحة الشرف",
    description: "شاهد أبطال الأكاديمية",
    href: "/honor-board",
    background: "#fff8d8",
  },
  {
    icon: "📤",
    title: "ارفع عملي",
    description: "أرسل صوتًا أو صورة أو فيديو",
    href: "/upload",
    background: "#ffecef",
  },
];

export default function JourneyPage() {
  const today = new Intl.DateTimeFormat("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f3fbf6 0%, #f7f9ff 45%, #fffdf7 100%)",
        padding: "24px 16px 50px",
        fontFamily: "Tahoma, Arial, sans-serif",
        color: "#17352a",
      }}
    >
      <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
        <header
          style={{
            background: "white",
            borderRadius: "28px",
            padding: "22px",
            boxShadow: "0 12px 35px rgba(31, 90, 61, 0.10)",
            border: "1px solid #e5f1e9",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 6px",
                  color: "#678177",
                  fontSize: "15px",
                }}
              >
                {today}
              </p>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(27px, 5vw, 43px)",
                  color: "#176c45",
                }}
              >
                🚀 رحلتي
              </h1>

              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: "18px",
                  lineHeight: 1.8,
                }}
              >
                السلام عليكم يا بطل 🌟
                <br />
                فارس سعيد بعودتك إلى أكاديمية لغتي الرقمية.
              </p>
            </div>

            <div
              aria-label="شخصية فارس"
              style={{
                width: "115px",
                height: "115px",
                borderRadius: "50%",
                background: "#dcf5e5",
                display: "grid",
                placeItems: "center",
                fontSize: "64px",
                border: "5px solid white",
                boxShadow: "0 8px 25px rgba(33, 104, 68, 0.16)",
              }}
            >
              🧒🏻
            </div>
          </div>
        </header>

        <section
          style={{
            background: "linear-gradient(135deg, #18784c, #2fa86c)",
            color: "white",
            borderRadius: "28px",
            padding: "25px",
            boxShadow: "0 15px 35px rgba(24, 120, 76, 0.22)",
            marginBottom: "18px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              opacity: 0.9,
              fontWeight: 700,
            }}
          >
            🎯 مهمتي اليوم
          </p>

          <h2
            style={{
              margin: "10px 0 8px",
              fontSize: "clamp(23px, 4vw, 34px)",
            }}
          >
            اقرأ درس اليوم ثم أنجز واجبك
          </h2>

          <p
            style={{
              margin: "0 0 18px",
              lineHeight: 1.8,
              fontSize: "17px",
            }}
          >
            أكمل المهمة لتحصل على نجمة و10 نقاط.
          </p>

          <Link
            href="/lessons"
            style={{
              display: "inline-block",
              background: "white",
              color: "#176c45",
              padding: "14px 30px",
              borderRadius: "16px",
              fontWeight: 800,
              fontSize: "18px",
              textDecoration: "none",
              boxShadow: "0 7px 18px rgba(0,0,0,0.12)",
            }}
          >
            ابدأ المهمة 🚀
          </Link>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          {[
            { icon: "⭐", value: "0", label: "نقاطي" },
            { icon: "🌟", value: "0", label: "نجومي" },
            { icon: "🏅", value: "مستكشف", label: "رتبتي" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "white",
                borderRadius: "22px",
                padding: "18px 10px",
                textAlign: "center",
                border: "1px solid #ebf1ed",
                boxShadow: "0 8px 22px rgba(39, 70, 55, 0.07)",
              }}
            >
              <div style={{ fontSize: "29px" }}>{item.icon}</div>
              <strong
                style={{
                  display: "block",
                  marginTop: "7px",
                  fontSize: "21px",
                  color: "#176c45",
                }}
              >
                {item.value}
              </strong>
              <span style={{ color: "#6a7d74", fontSize: "14px" }}>
                {item.label}
              </span>
            </div>
          ))}
        </section>

        <section
          style={{
            background: "white",
            borderRadius: "25px",
            padding: "21px",
            marginBottom: "18px",
            border: "1px solid #e8eee9",
            boxShadow: "0 8px 25px rgba(39, 70, 55, 0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 8px", color: "#176c45" }}>
                🧒🏻 رسالة فارس
              </h2>
              <p style={{ margin: 0, lineHeight: 1.8, fontSize: "17px" }}>
                تقدمك الصغير كل يوم يصنع إنجازًا كبيرًا. واصل يا بطل!
              </p>
            </div>

            <span
              style={{
                background: "#e9f8ee",
                color: "#176c45",
                padding: "10px 16px",
                borderRadius: "14px",
                fontWeight: 800,
              }}
            >
              أنت تستطيع 💪
            </span>
          </div>
        </section>

        <section>
          <h2
            style={{
              color: "#176c45",
              margin: "0 4px 14px",
              fontSize: "25px",
            }}
          >
            محطات رحلتي
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
            }}
          >
            {shortcuts.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                style={{
                  background: item.background,
                  borderRadius: "23px",
                  padding: "21px",
                  textDecoration: "none",
                  color: "#17352a",
                  border: "2px solid rgba(255,255,255,0.8)",
                  boxShadow: "0 8px 22px rgba(39, 70, 55, 0.07)",
                }}
              >
                <div style={{ fontSize: "37px", marginBottom: "10px" }}>
                  {item.icon}
                </div>

                <h3
                  style={{
                    margin: "0 0 7px",
                    fontSize: "21px",
                    color: "#176c45",
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: "#60736a",
                    lineHeight: 1.7,
                  }}
                >
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <footer
          style={{
            textAlign: "center",
            marginTop: "34px",
            color: "#6f8178",
            lineHeight: 1.8,
          }}
        >
          <strong style={{ color: "#176c45" }}>
            نتعلّم… نقرأ… نبدع
          </strong>
          <br />
          أكاديمية لغتي الرقمية
        </footer>
      </div>
    </main>
  );
}
