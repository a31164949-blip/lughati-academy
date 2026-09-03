"use client";

import Link from "next/link";
import {
  useRef,
  useState,
} from "react";

const games = [
  {
    id: "detective",
    icon: "🕵️",
    title: "تحدّي المحقّق",
    shortTitle: "حلّ القضية",
    description:
      "قضية خاصة ليوم واحد! اقرأ الأدلة، اربط التفاصيل، واكتشف الحل الصحيح بأسرع وقت.",
    href: "/games/detective",
    status: "متاحة الآن",
    badge: "🏆 جائزة لأسرع المحققين",
    background:
      "linear-gradient(135deg, #07111f 0%, #102a43 48%, #8a5a12 100%)",
  },
  {
    id: "missing-word",
    icon: "🧩",
    title: "الكلمة المفقودة",
    shortTitle: "اكتشف الكلمة",
    description:
      "اختر الكلمة المناسبة لإكمال الجملة وتدرب على الفهم والقراءة.",
    href: "/games/missing-word",
    status: "متاحة الآن",
    badge: "🔥 تحدٍ ممتع",
    background:
      "linear-gradient(135deg, #5b21b6 0%, #7c3aed 48%, #2563eb 100%)",
  },
  {
    id: "short-vowels",
    icon: "🎯",
    title: "الحركات القصيرة",
    shortTitle: "اضبط الحركة",
    description:
      "ميّز الفتحة والضمة والكسرة من خلال أنشطة سريعة وممتعة.",
    href: "#",
    status: "قريبًا",
    badge: "✨ قريبًا",
    background:
      "linear-gradient(135deg, #be123c 0%, #e11d48 48%, #fb7185 100%)",
  },
  {
    id: "sukoon",
    icon: "🔒",
    title: "السكون",
    shortTitle: "سرّ السكون",
    description:
      "تدرب على معرفة الحرف الساكن وقراءته داخل المقاطع والكلمات.",
    href: "/games/sukoon",
    status: "متاحة الآن",
    badge: "⚡ تحدٍ سريع",
    background:
      "linear-gradient(135deg, #0f766e 0%, #0891b2 52%, #2563eb 100%)",
  },
  {
    id: "long-vowels",
    icon: "🌟",
    title: "حروف المد",
    shortTitle: "رحلة المد",
    description:
      "ميّز المد بالألف والواو والياء وتعلّم التفريق بين المد والحركة القصيرة.",
    href: "/games/long-vowels",
    status: "متاحة الآن",
    badge: "🌟 مهارة مهمة",
    background:
      "linear-gradient(135deg, #b45309 0%, #ea580c 48%, #f59e0b 100%)",
  },
  {
    id: "listen",
    icon: "🔊",
    title: "اسمع واختر",
    shortTitle: "تحدي الصوت",
    description:
      "استمع إلى المقطع أو الكلمة ثم اختر الصوت الصحيح.",
    href: "#",
    status: "قريبًا",
    badge: "🎧 قريبًا",
    background:
      "linear-gradient(135deg, #1e3a8a 0%, #2563eb 48%, #06b6d4 100%)",
  },
  {
    id: "build-word",
    icon: "🏗️",
    title: "ابنِ الكلمة",
    shortTitle: "مصنع الكلمات",
    description:
      "ركّب المقاطع والحروف لتكوين كلمات صحيحة بطريقة ممتعة.",
    href: "#",
    status: "قريبًا",
    badge: "🧠 قريبًا",
    background:
      "linear-gradient(135deg, #166534 0%, #15803d 52%, #22c55e 100%)",
  },
];

export default function GamesPage() {
  const sliderRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [
    activeCard,
    setActiveCard,
  ] = useState(
    games[0].id
  );

  function scrollGames(
    direction:
      | "next"
      | "previous"
  ) {
    if (!sliderRef.current) {
      return;
    }

    const amount =
      Math.min(
        sliderRef.current
          .clientWidth * 0.82,
        520
      );

    sliderRef.current.scrollBy({
      left:
        direction === "next"
          ? -amount
          : amount,
      behavior: "smooth",
    });
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #effbf4 0%, #f8fbff 50%, #fffaf0 100%)",
        padding:
          "28px 0 60px",
        fontFamily:
          "Arial, sans-serif",
        color: "#173f31",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "1260px",
          margin: "0 auto",
          padding: "0 16px",
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
              display:
                "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              background: "#ffffff",
              border:
                "1px solid #cfe8dd",
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
            padding: "38px 24px",
            color: "#ffffff",
            boxShadow:
              "0 16px 38px rgba(20,120,80,.18)",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "240px",
              height: "240px",
              borderRadius: "50%",
              background:
                "rgba(255,255,255,.08)",
              top: "-100px",
              left: "-55px",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
            }}
          >
            <span
              style={{
                display:
                  "inline-flex",
                alignItems: "center",
                gap: "7px",
                background:
                  "rgba(255,255,255,.16)",
                padding:
                  "8px 14px",
                borderRadius:
                  "999px",
                fontWeight: 900,
                marginBottom:
                  "14px",
              }}
            >
              🎮 ألعاب لغتي
            </span>

            <h1
              style={{
                margin: "0 0 10px",
                fontSize:
                  "clamp(34px,5vw,52px)",
              }}
            >
              اختر تحديك
              واكتشف مهارتك ✨
            </h1>

            <p
              style={{
                maxWidth: "760px",
                margin: 0,
                lineHeight: 1.9,
                fontSize: "17px",
                opacity: 0.94,
              }}
            >
              ألعاب قصيرة ومتجددة
              تساعدك على القراءة
              والتركيز والفهم بطريقة
              ممتعة.
            </p>
          </div>
        </section>

        <section
          style={{
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "end",
              gap: "15px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <div>
              <p
                style={{
                  margin:
                    "0 0 5px",
                  color: "#15805a",
                  fontWeight: 900,
                }}
              >
                🎬 اختر لعبتك
              </p>

              <h2
                style={{
                  margin: 0,
                  color: "#174f3d",
                  fontSize:
                    "clamp(25px,4vw,34px)",
                }}
              >
                تحديات تنتظرك
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  scrollGames(
                    "previous"
                  )
                }
                aria-label="السابق"
                style={arrowButton}
              >
                →
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollGames(
                    "next"
                  )
                }
                aria-label="التالي"
                style={arrowButton}
              >
                ←
              </button>
            </div>
          </div>

          <div
            ref={sliderRef}
            style={{
              display: "flex",
              gap: "18px",
              overflowX: "auto",
              scrollSnapType:
                "x mandatory",
              padding:
                "14px 4px 30px",
              scrollbarWidth:
                "none",
              WebkitOverflowScrolling:
                "touch",
            }}
          >
            {games.map(
              (game) => {
                const available =
                  game.status ===
                  "متاحة الآن";

                const selected =
                  activeCard ===
                  game.id;

                const card = (
                  <article
                    onMouseEnter={() =>
                      setActiveCard(
                        game.id
                      )
                    }
                    onFocus={() =>
                      setActiveCard(
                        game.id
                      )
                    }
                    onClick={() =>
                      setActiveCard(
                        game.id
                      )
                    }
                    style={{
                      position:
                        "relative",
                      overflow:
                        "hidden",
                      width:
                        "min(78vw, 390px)",
                      height:
                        "430px",
                      flex:
                        "0 0 min(78vw, 390px)",
                      scrollSnapAlign:
                        "center",
                      borderRadius:
                        "30px",
                      background:
                        game.background,
                      color:
                        "#ffffff",
                      padding:
                        "26px",
                      boxSizing:
                        "border-box",
                      boxShadow:
                        selected
                          ? "0 24px 55px rgba(38,55,90,.25)"
                          : "0 14px 30px rgba(38,55,90,.14)",
                      transform:
                        selected
                          ? "translateY(-9px) scale(1.015)"
                          : "translateY(0) scale(1)",
                      transition:
                        "transform .28s ease, box-shadow .28s ease, opacity .28s ease",
                      opacity:
                        available
                          ? 1
                          : 0.8,
                      cursor:
                        available
                          ? "pointer"
                          : "default",
                    }}
                  >
                    <div
                      style={{
                        position:
                          "absolute",
                        width:
                          "210px",
                        height:
                          "210px",
                        borderRadius:
                          "50%",
                        background:
                          "rgba(255,255,255,.10)",
                        top:
                          "-65px",
                        left:
                          "-65px",
                      }}
                    />

                    <div
                      style={{
                        position:
                          "absolute",
                        width:
                          "145px",
                        height:
                          "145px",
                        borderRadius:
                          "50%",
                        background:
                          "rgba(255,255,255,.08)",
                        bottom:
                          "-45px",
                        right:
                          "-20px",
                      }}
                    />

                    <div
                      style={{
                        position:
                          "relative",
                        zIndex: 2,
                        height: "100%",
                        display:
                          "flex",
                        flexDirection:
                          "column",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            background:
                              available
                                ? "#fde68a"
                                : "rgba(255,255,255,.18)",
                            color:
                              available
                                ? "#854d0e"
                                : "#ffffff",
                            padding:
                              "8px 13px",
                            borderRadius:
                              "999px",
                            fontSize:
                              "12px",
                            fontWeight: 900,
                          }}
                        >
                          {game.badge}
                        </span>

                        <span
                          style={{
                            fontSize:
                              "34px",
                          }}
                        >
                          {game.icon}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop:
                            "auto",
                          marginBottom:
                            "auto",
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              "72px",
                            marginBottom:
                              "14px",
                            filter:
                              "drop-shadow(0 12px 16px rgba(0,0,0,.16))",
                          }}
                        >
                          {game.icon}
                        </div>

                        <p
                          style={{
                            margin:
                              "0 0 5px",
                            fontWeight: 900,
                            opacity: 0.82,
                          }}
                        >
                          {game.title}
                        </p>

                        <h3
                          style={{
                            margin:
                              "0 0 13px",
                            fontSize:
                              "32px",
                            lineHeight:
                              1.25,
                          }}
                        >
                          {game.shortTitle}
                        </h3>

                        <p
                          style={{
                            margin: 0,
                            lineHeight:
                              1.8,
                            fontSize:
                              "15px",
                            maxWidth:
                              "310px",
                            opacity:
                              0.92,
                          }}
                        >
                          {
                            game.description
                          }
                        </p>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",
                          gap: "10px",
                          marginTop:
                            "18px",
                        }}
                      >
                        <span
                          style={{
                            fontSize:
                              "13px",
                            fontWeight: 900,
                            background:
                              "rgba(255,255,255,.14)",
                            padding:
                              "8px 11px",
                            borderRadius:
                              "999px",
                          }}
                        >
                          {game.status}
                        </span>

                        <span
                          style={{
                            background:
                              "#ffffff",
                            color:
                              available
                                ? "#4c1d95"
                                : "#64748b",
                            borderRadius:
                              "15px",
                            padding:
                              "12px 16px",
                            fontWeight: 900,
                            boxShadow:
                              "0 8px 20px rgba(0,0,0,.14)",
                          }}
                        >
                          {available
                            ? "ابدأ الآن 🎮"
                            : "قريبًا 🔒"}
                        </span>
                      </div>
                    </div>
                  </article>
                );

                if (!available) {
                  return (
                    <div
                      key={
                        game.id
                      }
                    >
                      {card}
                    </div>
                  );
                }

                return (
                  <Link
                    key={game.id}
                    href={
                      game.href
                    }
                    style={{
                      textDecoration:
                        "none",
                    }}
                  >
                    {card}
                  </Link>
                );
              }
            )}
          </div>
        </section>

        <section
          style={{
            marginTop: "10px",
            background:
              "#ffffff",
            border:
              "1px solid #dceee6",
            borderRadius:
              "24px",
            padding: "22px",
            textAlign: "center",
            boxShadow:
              "0 8px 24px rgba(30,90,60,.06)",
          }}
        >
          <div
            style={{
              fontSize: "34px",
              marginBottom: "8px",
            }}
          >
            🌱
          </div>

          <strong
            style={{
              display: "block",
              color: "#176c49",
              fontSize: "20px",
              marginBottom: "8px",
            }}
          >
            كل لعبة تدربك على
            مهارة
          </strong>

          <p
            style={{
              margin: 0,
              color: "#71847c",
              lineHeight: 1.8,
            }}
          >
            اسحب البطاقات واختر
            التحدي الذي يناسبك،
            وستضاف ألعاب جديدة
            باستمرار.
          </p>
        </section>
      </div>
    </main>
  );
}

const arrowButton:
  React.CSSProperties = {
    width: "48px",
    height: "48px",
    border: "1px solid #d4e9df",
    borderRadius: "50%",
    background: "#ffffff",
    color: "#176d4c",
    fontSize: "23px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(20,90,60,.08)",
  };