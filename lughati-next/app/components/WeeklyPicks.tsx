"use client";

import Link from "next/link";

type PickItem = {
  id: string;
  icon: string;
  label: string;
  title: string;
  description: string;
  action: string;
  href: string;
  color: string;
  lightColor: string;
};

const picks: PickItem[] = [
  {
    id: "story",
    icon: "📖",
    label: "قصة الأسبوع",
    title: "صندوق الصور في بيت جدي",
    description:
  "قصة مصوّرة عن الأقارب والمحبة وصلة الرحم، مع مفردات وأسئلة فهم ونسخة قابلة للطباعة.",
    action: "اقرأ القصة",
    href: "/reading/stories/relatives",
    color: "#6d4bd8",
    lightColor: "#f2efff",
  },
  {
    id: "word",
    icon: "💎",
    label: "اكتشف كلمة الأسبوع",
    title: "كلمة هذا الأسبوع: 🔒 ؟",
    description:
      "اكتشف معناها، واستمع إليها، ثم حاول استخدامها في جملة من إنشائك.",
    action: "اكتشف الكلمة",
    href: "/picks/word",
    color: "#168a63",
    lightColor: "#eaf9f2",
  },
  {
    id: "did-you-know",
    icon: "💡",
    label: "هل تعلم؟",
    title: "معلومة صغيرة… معرفة كبيرة",
    description:
      "معلومة ممتعة ومبسطة نضيفها كل أسبوع لتتعلم شيئًا جديدًا.",
    action: "اكتشف المعلومة",
    href: "/picks/did-you-know",
    color: "#d77a17",
    lightColor: "#fff5e7",
  },
  {
    id: "quick-challenge",
    icon: "⚡",
    label: "تحدي سريع",
    title: "هل تستطيع حلها؟",
    description:
      "سؤال لغوي قصير يحتاج إلى تركيز. فكّر جيدًا قبل اختيار الإجابة.",
    action: "ابدأ التحدي",
    href: "/picks/challenge",
    color: "#167bb2",
    lightColor: "#eaf7ff",
  },
];

export default function WeeklyPicks() {
  return (
    <section
      dir="rtl"
      style={{
        maxWidth: "1180px",
        margin: "28px auto",
      }}
    >
      {/* رأس الركن */}

      <div
        style={{
          display: "flex",
          alignItems: "end",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 13px",
              borderRadius: "999px",
              background: "#eef8f3",
              color: "#14704b",
              fontSize: "13px",
              fontWeight: 900,
            }}
          >
            ✨ من اختيار أكاديمية لغتي
          </span>

          <h2
            style={{
              margin: "8px 0 3px",
              color: "#174c3b",
              fontSize: "clamp(26px,4vw,35px)",
              lineHeight: 1.4,
            }}
          >
            مختارات متنوعة 🌟
          </h2>

          <p
            style={{
              margin: 0,
              color: "#718078",
              lineHeight: 1.8,
              fontWeight: 700,
            }}
          >
            اقرأ، اكتشف، فكّر واستمتع
            بمختارات جديدة ومتنوعة.
          </p>
        </div>

        <Link
          href="/picks"
          style={{
            textDecoration: "none",
            padding: "11px 17px",
            borderRadius: "15px",
            background: "#fff",
            color: "#14704b",
            border: "1px solid #d3eade",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          جميع المختارات ←
        </Link>
      </div>

      {/* البطاقة الرئيسية */}

      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "24px",
          marginBottom: "15px",
          borderRadius: "30px",
          background:
            "linear-gradient(135deg,#0f7654 0%,#168a63 55%,#29a77a 100%)",
          color: "white",
          boxShadow:
            "0 15px 35px rgba(20,112,75,.18)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "190px",
            height: "190px",
            borderRadius: "50%",
            background: "rgba(255,255,255,.07)",
            left: "-60px",
            top: "-80px",
          }}
        />

        <div
          style={{
            position: "absolute",
            width: "130px",
            height: "130px",
            borderRadius: "50%",
            background: "rgba(255,224,112,.10)",
            right: "30%",
            bottom: "-70px",
          }}
        />

        <div
          className="picks-featured"
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1.5fr) minmax(190px,.55fr)",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div>
            <span
              style={{
                display: "inline-flex",
                padding: "7px 12px",
                borderRadius: "999px",
                background: "#fff0a8",
                color: "#765800",
                fontSize: "13px",
                fontWeight: 900,
              }}
            >
              🌟 اختيار هذا الأسبوع
            </span>

            <h3
              style={{
                margin: "12px 0 4px",
                fontSize: "clamp(27px,4vw,39px)",
                lineHeight: 1.4,
              }}
            >
              📖 قصة الأسبوع
            </h3>

            <p
              style={{
                maxWidth: "650px",
                margin: "8px 0 0",
                color: "rgba(255,255,255,.92)",
                lineHeight: 1.9,
                fontWeight: 700,
              }}
            >
              قصة قصيرة نقرأها للمتعة،
              ونبحث بين كلماتها عن فكرة
              جميلة ومهارة لغوية جديدة.
            </p>

            <div
              style={{
                display: "flex",
                gap: "9px",
                flexWrap: "wrap",
                marginTop: "15px",
              }}
            >
              <span className="pick-chip">
                📚 قراءة
              </span>

              <span className="pick-chip">
                🧠 فهم
              </span>

              <span className="pick-chip">
                💭 تفكير
              </span>
            </div>

            <Link
  href="/reading/stories/relatives"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                marginTop: "19px",
                padding: "13px 19px",
                borderRadius: "16px",
                background: "white",
                color: "#126846",
                textDecoration: "none",
                fontWeight: 900,
                boxShadow:
                  "0 8px 20px rgba(0,0,0,.12)",
              }}
            >
              📖 افتح قصة الأسبوع
              <span>←</span>
            </Link>
          </div>

          {/* الرسم */}

          <div
            style={{
              display: "grid",
              placeItems: "center",
            }}
          >
            <div className="pick-book">
              <span className="pick-book__main">
                📖
              </span>

              <span className="pick-book__star pick-book__star--one">
                ✨
              </span>

              <span className="pick-book__star pick-book__star--two">
                ⭐
              </span>

              <span className="pick-book__star pick-book__star--three">
                💡
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* المختارات */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(230px,1fr))",
          gap: "14px",
        }}
      >
        {picks.map((item) => (
          <article
            key={item.id}
            className="pick-card"
            style={{
              background: "white",
              border: "1px solid #e1ebe6",
              borderRadius: "24px",
              padding: "18px",
              boxShadow:
                "0 8px 20px rgba(30,90,60,.06)",
            }}
          >
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "18px",
                display: "grid",
                placeItems: "center",
                fontSize: "31px",
                background: item.lightColor,
              }}
            >
              {item.icon}
            </div>

            <span
              style={{
                display: "block",
                marginTop: "13px",
                color: item.color,
                fontSize: "12px",
                fontWeight: 900,
              }}
            >
              {item.label}
            </span>

            <h3
              style={{
                margin: "5px 0 0",
                color: "#243d34",
                fontSize: "18px",
                lineHeight: 1.55,
              }}
            >
              {item.title}
            </h3>

            <p
              style={{
                margin: "8px 0 0",
                minHeight: "66px",
                color: "#708078",
                fontSize: "13px",
                lineHeight: 1.75,
              }}
            >
              {item.description}
            </p>

            <Link
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                marginTop: "14px",
                padding: "10px 12px",
                borderRadius: "14px",
                background: item.lightColor,
                color: item.color,
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 900,
              }}
            >
              <span>{item.action}</span>
              <span>←</span>
            </Link>
          </article>
        ))}
      </div>

      <style jsx>{`
        .pick-chip {
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 12px;
          font-weight: 800;
        }

        .pick-card {
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .pick-card:hover {
          transform: translateY(-4px);
          box-shadow:
            0 14px 28px rgba(30, 90, 60, 0.1) !important;
        }

        .pick-book {
          position: relative;
          width: 180px;
          height: 180px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          animation: pickFloat 4s ease-in-out infinite;
        }

        .pick-book__main {
          font-size: 82px;
        }

        .pick-book__star {
          position: absolute;
        }

        .pick-book__star--one {
          right: 18px;
          top: 22px;
          font-size: 27px;
        }

        .pick-book__star--two {
          left: 19px;
          bottom: 26px;
          font-size: 24px;
        }

        .pick-book__star--three {
          right: 24px;
          bottom: 25px;
          font-size: 23px;
        }

        @keyframes pickFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-6px);
          }
        }

        @media (max-width: 760px) {
          .picks-featured {
            grid-template-columns: 1fr !important;
          }

          .pick-book {
            width: 150px;
            height: 150px;
          }

          .pick-book__main {
            font-size: 68px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pick-book {
            animation: none;
          }

          .pick-card {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}