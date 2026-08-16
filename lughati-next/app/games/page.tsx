"use client";

import Link from "next/link";

const games = [
  {
    title: "🧩 الكلمة المفقودة",
    description:
      "اختر الكلمة المناسبة لإكمال الجملة وتدرب على الفهم والقراءة.",
    href: "/games/missing-word",
    status: "متاحة الآن",
  },
  {
    title: "🎯 الحركات القصيرة",
    description:
      "تمييز الفتحة والضمة والكسرة من خلال أنشطة تفاعلية ممتعة.",
    href: "#",
    status: "قريبًا",
  },
  {
   
  title: "🔒 السكون",
  description:
    "تدرب على معرفة الحرف الساكن وقراءته داخل المقاطع والكلمات.",
  href: "/games/sukoon",
  status: "متاحة الآن",
},
  {
  title: "🌟 حروف المد",
  description:
    "تمييز المد بالألف والواو والياء والتفريق بين المد والحركة القصيرة.",
  href: "/games/long-vowels",
  status: "متاحة الآن",
},
  {
    title: "🔊 اسمع واختر",
    description:
      "استمع إلى المقطع أو الكلمة ثم اختر الصوت الصحيح.",
    href: "#",
    status: "قريبًا",
  },
  {
    title: "🏗️ ابنِ الكلمة",
    description:
      "ركّب المقاطع والحروف لتكوين كلمات صحيحة بطريقة ممتعة.",
    href: "#",
    status: "قريبًا",
  },
];

export default function GamesPage() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #effbf4 0%, #f8fbff 48%, #fffaf0 100%)",
        padding: "28px 16px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#173f31",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "24px",
          }}
        >
          <Link
            href="/journey"
            style={{
              display: "inline-block",
              textDecoration: "none",
              background: "#ffffff",
              border: "1px solid #cfe8dd",
              color: "#176d4c",
              borderRadius: "15px",
              padding: "11px 18px",
              fontWeight: 900,
            }}
          >
            ← العودة إلى رحلتي
          </Link>
        </div>

        <section
          style={{
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, #137c53 0%, #1f9d6c 60%, #35b978 100%)",
            borderRadius: "32px",
            padding: "38px 22px",
            color: "#ffffff",
            textAlign: "center",
            boxShadow: "0 16px 38px rgba(20,120,80,.18)",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              fontSize: "58px",
              marginBottom: "10px",
            }}
          >
            🎮
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "clamp(32px,5vw,48px)",
            }}
          >
            ألعاب المهارات
          </h1>

          <p
            style={{
              maxWidth: "760px",
              margin: "0 auto",
              lineHeight: 1.9,
              fontSize: "17px",
              opacity: 0.94,
            }}
          >
            تعلّم، جرّب، واكتشف مهارات لغتي بطريقة ممتعة وتفاعلية.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: "18px",
          }}
        >
          {games.map((game) => {
            const available = game.status === "متاحة الآن";

            const card = (
              <article
                style={{
                  height: "100%",
                  background: "#ffffff",
                  border: available
                    ? "2px solid #7fd9ad"
                    : "1px solid #dceae4",
                  borderRadius: "24px",
                  padding: "24px",
                  boxShadow: available
                    ? "0 14px 32px rgba(22,138,99,.14)"
                    : "0 8px 22px rgba(34,80,60,.06)",
                  transition: "transform .25s ease, box-shadow .25s ease",
                  opacity: available ? 1 : 0.78,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <span
                    style={{
                      background: available ? "#eaf9f1" : "#f3f5f4",
                      color: available ? "#16835f" : "#75827d",
                      padding: "6px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 900,
                    }}
                  >
                    {game.status}
                  </span>

                  {available && (
                    <span
                      style={{
                        fontSize: "20px",
                      }}
                    >
                      ✨
                    </span>
                  )}
                </div>

                <h2
                  style={{
                    margin: "0 0 12px",
                    fontSize: "24px",
                    color: available ? "#176c49" : "#4e6259",
                  }}
                >
                  {game.title}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#71847c",
                    lineHeight: 1.9,
                    fontSize: "15px",
                  }}
                >
                  {game.description}
                </p>

                <div
                  style={{
                    marginTop: "20px",
                    background: available ? "#168a63" : "#eef2f0",
                    color: available ? "#ffffff" : "#7f8d87",
                    borderRadius: "14px",
                    padding: "12px",
                    textAlign: "center",
                    fontWeight: 900,
                  }}
                >
                  {available ? "ابدأ اللعب 🎮" : "قريبًا 🔒"}
                </div>
              </article>
            );

            if (!available) {
              return <div key={game.title}>{card}</div>;
            }

            return (
              <Link
                key={game.title}
                href={game.href}
                style={{
                  textDecoration: "none",
                }}
              >
                {card}
              </Link>
            );
          })}
        </section>

        <section
          style={{
            marginTop: "28px",
            background: "#ffffff",
            border: "1px solid #dceee6",
            borderRadius: "24px",
            padding: "22px",
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(30,90,60,.06)",
          }}
        >
          <div style={{ fontSize: "34px", marginBottom: "8px" }}>🌱</div>

          <strong
            style={{
              display: "block",
              color: "#176c49",
              fontSize: "20px",
              marginBottom: "8px",
            }}
          >
            كل لعبة تدربك على مهارة
          </strong>

          <p
            style={{
              margin: 0,
              color: "#71847c",
              lineHeight: 1.8,
            }}
          >
            سنبدأ بالحركات والسكون وحروف المد، ثم نتدرج إلى قراءة الكلمات
            والجمل والفهم.
          </p>
        </section>
      </div>
    </main>
  );
}