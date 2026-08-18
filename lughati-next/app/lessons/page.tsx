import Link from "next/link";

type UnitItem = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  href: string;
  background: string;
  border: string;
  status: "available" | "coming";
};

const units: UnitItem[] = [
  
   {
  id: "unit-1",
  number: 1,
  title: "الوحدة الأولى",
  subtitle: "أقاربي",
  icon: "🤝",
  description:
    "نتعلم عن صلة الرحم، وبر الوالدين، والتعاون وتحمل المسؤولية.",
  href: "/lessons/unit1",
  background:
    "linear-gradient(135deg,#e9fbf3,#ffffff)",
  border: "#bce7d2",
  status: "available",
},
  {
    id: "unit-2",
    number: 2,
    title: "الوحدة الثانية",
    subtitle: "أصدقائي وجيراني",
    icon: "👦🏻",
    description:
      "نقرأ ونتعلم عن الصداقة والجيرة والتعاون.",
    href: "#",
    background:
      "linear-gradient(135deg,#edf6ff,#ffffff)",
    border: "#c8def6",
    status: "coming",
  },
  {
    id: "unit-3",
    number: 3,
    title: "الوحدة الثالثة",
    subtitle: "وطني السعودية",
    icon: "🇸🇦",
    description:
      "نتعرف على وطننا ونقرأ نصوصًا جميلة عنه.",
    href: "#",
    background:
      "linear-gradient(135deg,#ecfdf5,#ffffff)",
    border: "#bce7cf",
    status: "coming",
  },
  {
    id: "unit-4",
    number: 4,
    title: "الوحدة الرابعة",
    subtitle: "محاصيل من بلادي",
    icon: "🌾",
    description:
      "نكتشف خيرات بلادنا ومحاصيلها من خلال القراءة والتعلم.",
    href: "#",
    background:
      "linear-gradient(135deg,#fff8dc,#ffffff)",
    border: "#eddc9a",
    status: "coming",
  },
];

const lessonFeatures = [
  {
    icon: "📖",
    title: "أقرأ",
    text: "قراءة الدرس بطريقة واضحة ومتدرجة",
  },
  {
    icon: "💡",
    title: "أفهم",
    text: "مفردات وفهم قرائي وأسئلة قصيرة",
  },
  {
    icon: "✍️",
    title: "إملائي",
    text: "تدريب على الكلمات والمهارات الإملائية",
  },
  {
    icon: "🖋️",
    title: "خطي",
    text: "تدريب منظم على الكتابة والخط",
  },
  {
    icon: "🎯",
    title: "أتدرب",
    text: "أنشطة وتدريبات تساعدني على الإتقان",
  },
  {
    icon: "🦸",
    title: "تحدي فارس",
    text: "تحدٍ ممتع في نهاية رحلتي مع الدرس",
  },
];

export default function LessonsPage() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#edfdf5 0%,#f4f9ff 48%,#fffaf0 100%)",
        padding: "26px 16px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#173b31",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
        }}
      >
        {/* أعلى الصفحة */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <Link
            href="/journey"
            style={{
              textDecoration: "none",
              background: "#ffffff",
              color: "#176c46",
              border: "1px solid #cfe7dc",
              borderRadius: 15,
              padding: "11px 17px",
              fontWeight: 900,
              boxShadow:
                "0 7px 18px rgba(30,90,65,.06)",
            }}
          >
            ← العودة إلى رحلتي
          </Link>

          <span
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              background: "#ffffff",
              border: "1px solid #dcebe4",
              color: "#176c46",
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            📚 مقرر لغتي
          </span>
        </div>

        {/* رأس المقرر */}

        <section
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 32,
            padding: "36px 22px",
            marginBottom: 24,
            background:
              "linear-gradient(135deg,#147a55,#2eaf7b)",
            color: "#ffffff",
            boxShadow:
              "0 16px 40px rgba(20,122,85,.17)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 18,
              left: 24,
              fontSize: 30,
              opacity: 0.35,
            }}
          >
            ✨
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 18,
              right: 24,
              fontSize: 27,
              opacity: 0.3,
            }}
          >
            ⭐
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 82,
                height: 82,
                borderRadius: 25,
                background:
                  "rgba(255,255,255,.16)",
                display: "grid",
                placeItems: "center",
                fontSize: 46,
                flexShrink: 0,
              }}
            >
              📚
            </div>

            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: 999,
                  background:
                    "rgba(255,255,255,.15)",
                  fontSize: 13,
                  fontWeight: 900,
                  marginBottom: 9,
                }}
              >
                رحلتي مع لغتي
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize:
                    "clamp(31px,5vw,45px)",
                }}
              >
                المقرر الدراسي
              </h1>

              <p
                style={{
                  margin: "9px 0 0",
                  maxWidth: 700,
                  lineHeight: 1.9,
                  opacity: 0.94,
                  fontSize: 17,
                }}
              >
                أختار وحدتي، ثم أبدأ رحلتي
                في القراءة والفهم والإملاء
                والخط والتدريب والتحدي.
              </p>
            </div>
          </div>
        </section>

        {/* فارس */}

        <section
          style={{
            marginBottom: 25,
            padding: "17px 20px",
            borderRadius: 23,
            background:
              "linear-gradient(135deg,#ffffff,#f0fbf5)",
            border: "1px solid #d5ebe0",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow:
              "0 9px 25px rgba(30,90,65,.06)",
          }}
        >
          <div
            style={{
              width: 57,
              height: 57,
              borderRadius: 18,
              background: "#e5f8ed",
              display: "grid",
              placeItems: "center",
              fontSize: 32,
              flexShrink: 0,
            }}
          >
            🦸
          </div>

          <div>
            <strong
              style={{
                display: "block",
                color: "#176c46",
                fontSize: 17,
              }}
            >
              فارس يقول:
            </strong>

            <p
              style={{
                margin: "4px 0 0",
                color: "#64756d",
                lineHeight: 1.7,
              }}
            >
              لا تستعجل الوصول للنهاية…
              أتقن كل محطة، وستجد تاجك في انتظارك 👑
            </p>
          </div>
        </section>

        {/* الوحدات */}

        <div
          style={{
            marginBottom: 15,
          }}
        >
          <h2
            style={{
              margin: "0 0 5px",
              color: "#176c46",
              fontSize: 27,
            }}
          >
            🗺️ وحدات المقرر
          </h2>

          <p
            style={{
              margin: 0,
              color: "#718078",
            }}
          >
            اختر الوحدة التي تريد أن تبدأ بها
          </p>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(240px,1fr))",
            gap: 18,
          }}
        >
          {units.map((unit) => {
            const available =
              unit.status === "available";

            return (
              <article
                key={unit.id}
                style={{
                  position: "relative",
                  background:
                    unit.background,
                  border:
                    `2px solid ${unit.border}`,
                  borderRadius: 27,
                  padding: 22,
                  minHeight: 315,
                  display: "flex",
                  flexDirection: "column",
                  boxShadow:
                    "0 11px 28px rgba(35,75,60,.07)",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    minWidth: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    color: "#176c46",
                    boxShadow:
                      "0 5px 12px rgba(0,0,0,.06)",
                  }}
                >
                  {unit.number}
                </span>

                <div
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 21,
                    background: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 38,
                    marginBottom: 17,
                    boxShadow:
                      "0 7px 17px rgba(0,0,0,.05)",
                  }}
                >
                  {unit.icon}
                </div>

                <span
                  style={{
                    color: "#718078",
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  {unit.title}
                </span>

                <h3
                  style={{
                    margin: "5px 0 8px",
                    color: "#174c3b",
                    fontSize: 24,
                  }}
                >
                  {unit.subtitle}
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: "#65766e",
                    lineHeight: 1.75,
                    flex: 1,
                  }}
                >
                  {unit.description}
                </p>

                {available ? (
                  <a
                    href={unit.href}
                    style={{
                      marginTop: 18,
                      display: "block",
                      textAlign: "center",
                      textDecoration: "none",
                      padding: "13px 15px",
                      borderRadius: 15,
                      background:
                        "linear-gradient(135deg,#168a63,#0f7654)",
                      color: "#ffffff",
                      fontWeight: 900,
                    }}
                  >
                    🚀 ابدأ الوحدة
                  </a>
                ) : (
                  <div
                    style={{
                      marginTop: 18,
                      padding: "13px 15px",
                      borderRadius: 15,
                      background:
                        "rgba(255,255,255,.75)",
                      color: "#7a877f",
                      textAlign: "center",
                      fontWeight: 900,
                      border:
                        "1px dashed #d7dfdb",
                    }}
                  >
                    🔒 تُفتح قريبًا
                  </div>
                )}
              </article>
            );
          })}
        </section>

        {/* ماذا يوجد داخل الدرس */}

        <section
          style={{
            marginTop: 28,
            padding: 23,
            borderRadius: 28,
            background: "#ffffff",
            border: "1px solid #dfece6",
            boxShadow:
              "0 10px 28px rgba(30,80,60,.06)",
          }}
        >
          <div
            style={{
              marginBottom: 17,
            }}
          >
            <h2
              style={{
                margin: "0 0 6px",
                color: "#176c46",
                fontSize: 25,
              }}
            >
              ✨ ماذا سأجد داخل كل درس؟
            </h2>

            <p
              style={{
                margin: 0,
                color: "#708078",
                lineHeight: 1.7,
              }}
            >
              لكل درس رحلة قصيرة وواضحة تساعدني على الوصول إلى الإتقان.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(160px,1fr))",
              gap: 11,
            }}
          >
            {lessonFeatures.map(
              (feature) => (
                <div
                  key={feature.title}
                  style={{
                    padding: 15,
                    borderRadius: 18,
                    background: "#f8fbf9",
                    border:
                      "1px solid #e1ebe6",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 30,
                    }}
                  >
                    {feature.icon}
                  </div>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 6,
                      color: "#176c46",
                    }}
                  >
                    {feature.title}
                  </strong>

                  <small
                    style={{
                      display: "block",
                      marginTop: 5,
                      color: "#718078",
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.text}
                  </small>
                </div>
              )
            )}
          </div>
        </section>

        {/* الربط بالإنجاز */}

        <section
          style={{
            marginTop: 20,
            padding: "19px 21px",
            borderRadius: 23,
            background:
              "linear-gradient(135deg,#fff7ce,#fffdf3)",
            border: "2px solid #efd166",
            display: "flex",
            gap: 14,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 38,
              flexShrink: 0,
            }}
          >
            👑
          </span>

          <div>
            <strong
              style={{
                color: "#805c00",
                fontSize: 18,
              }}
            >
              إتقاني يصنع إنجازي
            </strong>

            <p
              style={{
                margin: "5px 0 0",
                color: "#776832",
                lineHeight: 1.7,
              }}
            >
              تقدمي في الدروس سيقودني إلى الألقاب
              والتيجان والمكافآت في رحلتي.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}