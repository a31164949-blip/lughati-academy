"use client";

import Link from "next/link";

type WeeklyGame = {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  badge: string;
  skill: string;
  color: string;
  lightColor: string;
  featured?: boolean;
  locked?: boolean;
};

const weeklyGames: WeeklyGame[] = [
  {
    id: "maze",
    title: "متاهة لغتي",
    description:
      "اعبر المتاهة، وافتح الأبواب بالإجابات الصحيحة حتى تصل إلى كنز لغتي.",
    icon: "🌀",
    href: "/games/maze",
    badge: "تحدي هذا الأسبوع",
    skill: "قراءة • تركيز • مفردات",
    color: "#7357d9",
    lightColor: "#f1edff",
    featured: true,
  },
  {
    id: "letter-bridge",
    title: "جسر الحروف",
    description:
      "اختر الحرف أو الحركة الصحيحة لتساعد فارس على عبور الجسر خطوة بعد خطوة.",
    icon: "🌉",
    href: "/games/letter-bridge",
    badge: "اللعبة القادمة",
    skill: "الحروف • الحركات",
    color: "#1584b8",
    lightColor: "#eaf8ff",
    locked: true,
  },
  {
    id: "missing-box",
    title: "الصندوق المفقود",
    description:
      "اكتشف الحرف أو المقطع المفقود وأكمل الكلمات قبل انتهاء التحدي.",
    icon: "🎁",
    href: "/games/missing-box",
    badge: "قريبًا",
    skill: "مقاطع • كلمات • إملاء",
    color: "#d77a17",
    lightColor: "#fff5e7",
    locked: true,
  },
];

export default function WeeklyGames() {
  const featuredGame =
    weeklyGames.find(
      (game) => game.featured
    ) ?? weeklyGames[0];

  const otherGames =
    weeklyGames.filter(
      (game) =>
        game.id !== featuredGame.id
    );

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
          justifyContent:
            "space-between",
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
              background: "#fff4dc",
              color: "#a45d00",
              fontSize: "13px",
              fontWeight: 900,
            }}
          >
            🎮 ألعاب لغتي
          </span>

          <h2
            style={{
              margin: "8px 0 3px",
              color: "#174c3b",
              fontSize:
                "clamp(26px,4vw,35px)",
              lineHeight: 1.4,
            }}
          >
            تحدي جديد كل أسبوع ✨
          </h2>

          <p
            style={{
              margin: 0,
              color: "#718078",
              lineHeight: 1.8,
              fontWeight: 700,
            }}
          >
            لعبة تعليمية مختلفة كل
            أسبوع؛ تعلّم، العب، وتحدَّ
            نفسك.
          </p>
        </div>

        <Link
          href="/games"
          style={{
            textDecoration: "none",
            padding: "11px 17px",
            borderRadius: "15px",
            background: "#eef8f3",
            color: "#14704b",
            border:
              "1px solid #d3eade",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          🎮 جميع الألعاب ←
        </Link>
      </div>

      {/* شريط التحديث الأسبوعي */}

      <div
        style={{
          marginBottom: "14px",
          padding: "11px 15px",
          borderRadius: "18px",
          background:
            "linear-gradient(135deg,#f7fbff,#f4fff8)",
          border:
            "1px solid #dcece6",
          color: "#49675c",
          fontWeight: 800,
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <span>🗓️</span>

        <span>
          يتم اختيار لعبة أو تحدٍ
          جديد كل أسبوع حتى تبقى
          رحلة التعلم ممتعة ومتجددة.
        </span>
      </div>

      {/* اللعبة الرئيسية */}

      <article
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "34px",
          padding: "27px",
          background:
            "linear-gradient(135deg,#6d4bd8 0%,#7658df 48%,#4d86db 100%)",
          color: "white",
          boxShadow:
            "0 18px 42px rgba(90,70,190,.22)",
        }}
      >
        {/* دوائر خلفية */}

        <div
          style={{
            position: "absolute",
            width: "230px",
            height: "230px",
            borderRadius: "50%",
            background:
              "rgba(255,255,255,.07)",
            top: "-110px",
            left: "-70px",
          }}
        />

        <div
          style={{
            position: "absolute",
            width: "170px",
            height: "170px",
            borderRadius: "50%",
            background:
              "rgba(255,226,104,.09)",
            bottom: "-90px",
            right: "17%",
          }}
        />

        <div
          className="weekly-game-featured"
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1.45fr) minmax(220px,.7fr)",
            gap: "24px",
            alignItems: "center",
          }}
        >
          {/* النص */}

          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 13px",
                marginBottom: "13px",
                borderRadius: "999px",
                background: "#ffe887",
                color: "#6b4a00",
                fontWeight: 900,
                fontSize: "13px",
                boxShadow:
                  "0 4px 12px rgba(0,0,0,.08)",
              }}
            >
              🔥 {featuredGame.badge}
            </span>

            <h3
              style={{
                margin: 0,
                fontSize:
                  "clamp(30px,5vw,44px)",
                lineHeight: 1.4,
              }}
            >
              {featuredGame.icon}{" "}
              {featuredGame.title}
            </h3>

            <p
              style={{
                maxWidth: "680px",
                margin: "12px 0 0",
                color:
                  "rgba(255,255,255,.92)",
                lineHeight: 1.95,
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              {featuredGame.description}
            </p>

            {/* المهارات */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "17px",
              }}
            >
              <span
                style={{
                  padding: "7px 12px",
                  borderRadius: "999px",
                  background:
                    "rgba(255,255,255,.14)",
                  border:
                    "1px solid rgba(255,255,255,.22)",
                  fontSize: "13px",
                  fontWeight: 800,
                }}
              >
                🧠 {featuredGame.skill}
              </span>

              <span
                style={{
                  padding: "7px 12px",
                  borderRadius: "999px",
                  background:
                    "rgba(255,255,255,.14)",
                  border:
                    "1px solid rgba(255,255,255,.22)",
                  fontSize: "13px",
                  fontWeight: 800,
                }}
              >
                👨‍👩‍👧 متاح للجميع
              </span>

              <span
                style={{
                  padding: "7px 12px",
                  borderRadius: "999px",
                  background:
                    "rgba(255,255,255,.14)",
                  border:
                    "1px solid rgba(255,255,255,.22)",
                  fontSize: "13px",
                  fontWeight: 800,
                }}
              >
                ⚡ خفيف وسريع
              </span>
            </div>

            <Link
              href={featuredGame.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "21px",
                padding: "14px 21px",
                borderRadius: "17px",
                background: "white",
                color: "#6041c2",
                textDecoration: "none",
                fontWeight: 900,
                boxShadow:
                  "0 8px 20px rgba(40,30,100,.16)",
              }}
            >
              🎮 ابدأ التحدي الآن
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
            <div
              className="weekly-game-orb"
              style={{
                position: "relative",
                width: "195px",
                height: "195px",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background:
                  "rgba(255,255,255,.12)",
                border:
                  "1px solid rgba(255,255,255,.18)",
                boxShadow:
                  "inset 0 0 35px rgba(255,255,255,.08), 0 16px 35px rgba(40,30,100,.16)",
              }}
            >
              <div
                style={{
                  fontSize: "90px",
                }}
              >
                🌀
              </div>

              <span
                style={{
                  position: "absolute",
                  top: "17px",
                  right: "14px",
                  fontSize: "28px",
                }}
              >
                ⭐
              </span>

              <span
                style={{
                  position: "absolute",
                  bottom: "18px",
                  left: "16px",
                  fontSize: "27px",
                }}
              >
                🏆
              </span>

              <span
                style={{
                  position: "absolute",
                  bottom: "14px",
                  right: "21px",
                  fontSize: "24px",
                }}
              >
                🚪
              </span>
            </div>
          </div>
        </div>
      </article>

      {/* الألعاب القادمة */}

      <div
        style={{
          marginTop: "15px",
        }}
      >
        <div
          style={{
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <strong
            style={{
              color: "#315c4d",
              fontSize: "16px",
            }}
          >
            🚀 ألعاب قادمة
          </strong>

          <span
            style={{
              color: "#7b8982",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            كل لعبة تدرب مهارة مختلفة
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: "14px",
          }}
        >
          {otherGames.map(
            (game) => (
              <article
                key={game.id}
                style={{
                  position: "relative",
                  padding: "18px",
                  borderRadius: "24px",
                  background: "white",
                  border:
                    "1px solid #e3ece7",
                  boxShadow:
                    "0 8px 20px rgba(30,90,60,.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "13px",
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "19px",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      fontSize: "32px",
                      background:
                        game.lightColor,
                    }}
                  >
                    {game.icon}
                  </div>

                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        color: game.color,
                        fontSize: "12px",
                        fontWeight: 900,
                      }}
                    >
                      {game.locked
                        ? "🔒 "
                        : "✨ "}
                      {game.badge}
                    </span>

                    <h3
                      style={{
                        margin: "3px 0",
                        color: "#243d34",
                        fontSize: "18px",
                      }}
                    >
                      {game.title}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "#708078",
                        fontSize: "13px",
                        lineHeight: 1.65,
                      }}
                    >
                      {game.skill}
                    </p>
                  </div>
                </div>

                <p
                  style={{
                    margin:
                      "13px 0 0",
                    color: "#687870",
                    fontSize: "13px",
                    lineHeight: 1.75,
                  }}
                >
                  {game.description}
                </p>

                <div
                  style={{
                    marginTop: "13px",
                    padding: "9px 11px",
                    borderRadius: "13px",
                    background:
                      game.lightColor,
                    color: game.color,
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 900,
                  }}
                >
                  🔒 سنفتحها في تحدٍ
                  قادم
                </div>
              </article>
            )
          )}
        </div>
      </div>

      <style jsx>{`
        .weekly-game-orb {
          animation:
            weeklyGameFloat
            4s
            ease-in-out
            infinite;
        }

        @keyframes weeklyGameFloat {
          0%,
          100% {
            transform:
              translateY(0);
          }

          50% {
            transform:
              translateY(-7px);
          }
        }

        @media (
          max-width: 760px
        ) {
          .weekly-game-featured {
            grid-template-columns:
              1fr !important;
          }
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .weekly-game-orb {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}