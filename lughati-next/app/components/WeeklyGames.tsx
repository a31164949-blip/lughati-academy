"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";

type WeeklyGame = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  href: string;
  skill: string;
  background: string;
  available: boolean;
  audience: string;
  leaderboardMode?: "time" | "wins";
  competitionLabel?: string;
};

type GameScore = {
  id: string;
  playerName: string;
  timeSeconds: number;
};

const weeklyGames: WeeklyGame[] = [
  {
    id: "maze",
    title: "متاهة لغتي",
    shortTitle: "اعثر على الكنز",
    description:
      "اعبر المتاهة وافتح الأبواب بالإجابات الصحيحة حتى تصل إلى كنز لغتي.",
    icon: "🌀",
    href: "/games/maze",
    skill: "قراءة • تركيز • مفردات",
    background:
      "linear-gradient(135deg,#6d28d9 0%,#7c3aed 48%,#2563eb 100%)",
    available: true,
    audience: "للجميع",
  },
  {
    id: "crosswords",
    title: "الكلمات المتقاطعة",
    shortTitle: "حلّ الشبكة",
    description:
      "اكتشف الكلمات من خلال التلميحات وأكمل الشبكة بأسرع وقت.",
    icon: "✏️",
    href: "/games/crosswords",
    skill: "مفردات • إملاء • تفكير",
    background:
      "linear-gradient(135deg,#b45309 0%,#ea580c 52%,#f59e0b 100%)",
    available: false,
    audience: "للجميع",
  },
  {
    id: "lost-word",
    title: "الكلمة الضائعة",
    shortTitle: "ابحث واكتشف",
    description:
      "ابحث عن الكلمات المختبئة بين الحروف واكتشفها قبل الجميع.",
    icon: "🔎",
    href: "/games/lost-word",
    skill: "قراءة • تركيز • سرعة",
    background:
      "linear-gradient(135deg,#0f766e 0%,#0891b2 52%,#2563eb 100%)",
    available: true,
    audience: "للجميع",
  },
  {
    id: "picture-story",
    title: "ترتيب الصور",
    shortTitle: "اصنع القصة",
    description:
      "رتب الصور بالتسلسل الصحيح ثم اكتشف القصة التي تحكيها.",
    icon: "🧩",
    href: "/games/picture-story",
    skill: "تسلسل • تعبير • فهم",
    background:
      "linear-gradient(135deg,#be123c 0%,#e11d48 52%,#fb7185 100%)",
    available: false,
    audience: "للصغار والعائلة",
  },
  {
    id: "family-challenge",
    title: "التحدي العائلي",
    shortTitle: "من سيفوز؟",
    description:
      "تحديات ممتعة تجمع الطفل وأسرته في منافسة سريعة ومليئة بالمرح.",
    icon: "👨‍👩‍👧",
    href: "/games/family-challenge",
    skill: "مرح • منافسة • تعاون",
    background:
      "linear-gradient(135deg,#166534 0%,#15803d 52%,#22c55e 100%)",
    available: false,
    audience: "للعائلة",
  },
  {
    id: "detective",
    title: "المحقق",
    shortTitle: "حلّ القضية",
    description:
      "اقرأ الأدلة، اربط التفاصيل، واكتشف الحل قبل انتهاء الوقت.",
    icon: "🕵️‍♂️",
    href: "/games/detective",
    skill: "استنتاج • ملاحظة • ذكاء",
    background:
      "linear-gradient(135deg,#172554 0%,#1e3a8a 52%,#334155 100%)",
    available: false,
    audience: "للكبار والعائلة",
  },
  {
    id: "thirty-seconds",
    title: "كلمة في 30 ثانية",
    shortTitle: "سابق الزمن",
    description:
      "كوّن أكبر عدد من الكلمات الصحيحة قبل أن تنتهي الثلاثون ثانية.",
    icon: "⏱️",
    href: "/games/30-seconds",
    skill: "سرعة • مفردات • تركيز",
    background:
      "linear-gradient(135deg,#9f1239 0%,#be123c 48%,#e11d48 100%)",
    available: false,
    audience: "للكبار والعائلة",
  },
  {
    id: "error-hunter",
    title: "صائد الأخطاء",
    shortTitle: "اكتشف الخطأ",
    description:
      "هناك أخطاء مخفية أمامك؛ اكتشفها وصححها بأسرع وقت ممكن.",
    icon: "🎯",
    href: "/games/error-hunter",
    skill: "إملاء • ملاحظة • سرعة",
    background:
      "linear-gradient(135deg,#075985 0%,#0369a1 50%,#0ea5e9 100%)",
    available: false,
    audience: "للكبار والعائلة",
  },
  {
    id: "genius",
    title: "تحدي العباقرة",
    shortTitle: "هل أنت جاهز؟",
    description:
      "أسئلة متدرجة تختبر المعرفة واللغة وسرعة التفكير حتى السؤال الأخير.",
    icon: "🧠",
    href: "/games/genius",
    skill: "معرفة • لغة • سرعة",
    background:
      "linear-gradient(135deg,#854d0e 0%,#a16207 50%,#ca8a04 100%)",
    available: false,
    audience: "للكبار والعائلة",
  },
  {
    id: "lughati-kingdom",
    title: "مملكة لغتي",
    shortTitle: "خطّط… تحرّك… وانتصر",
    description:
      "لعبة استراتيجية لغوية مستوحاة من الشطرنج؛ حرّك قطعك، واجتز تحديات لغتي، وحقق الانتصار.",
    icon: "♟️",
    href: "/games/lughati-kingdom",
    skill: "استراتيجية • لغة • تفكير",
    background:
      "linear-gradient(135deg,#111827 0%,#312e81 52%,#7c3aed 100%)",
    available: false,
    audience: "للصغار والكبار والعائلة",
    leaderboardMode: "wins",
    competitionLabel: "🏆 خُض التحدي وسجّل انتصارك",
  },
];

export default function WeeklyGames() {
  const sliderRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [
    activeGame,
    setActiveGame,
  ] = useState("maze");

  const [
    scoreState,
    setScoreState,
  ] = useState<{
    gameId: string;
    scores: GameScore[];
    error: boolean;
  } | null>(null);

  const activeGameData =
    weeklyGames.find(
      (game) =>
        game.id === activeGame
    ) ?? weeklyGames[0];

  useEffect(() => {
    const game =
      weeklyGames.find(
        (item) =>
          item.id === activeGame
      );

    if (
      !game ||
      !game.available ||
      game.leaderboardMode ===
        "wins"
    ) {
      return;
    }

    const controller =
      new AbortController();

    async function loadScores() {
      try {
        const response =
          await fetch(
            `/api/game-scores?gameId=${encodeURIComponent(
              game.id
            )}`,
            {
              cache: "no-store",
              signal:
                controller.signal,
            }
          );

        const data =
          (await response.json()) as {
            ok?: boolean;
            scores?: GameScore[];
          };

        if (
          controller.signal.aborted
        ) {
          return;
        }

        setScoreState({
          gameId: game.id,
          scores:
            response.ok &&
            data.ok &&
            Array.isArray(
              data.scores
            )
              ? data.scores
              : [],
          error:
            !response.ok ||
            !data.ok,
        });
      } catch {
        if (
          controller.signal.aborted
        ) {
          return;
        }

        setScoreState({
          gameId: game.id,
          scores: [],
          error: true,
        });
      }
    }

    void loadScores();

    return () => {
      controller.abort();
    };
  }, [activeGame]);

  const activeScores =
    scoreState?.gameId ===
    activeGame
      ? scoreState.scores
      : [];

  const scoresLoading =
    activeGameData.available &&
    activeGameData.leaderboardMode !==
      "wins" &&
    scoreState?.gameId !==
      activeGame;

  function scrollCards(
    direction:
      | "next"
      | "previous"
  ) {
    if (!sliderRef.current) {
      return;
    }

    const amount =
      Math.min(
        sliderRef.current.clientWidth *
          0.72,
        430
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
    <section
      dir="rtl"
      style={{
        maxWidth: "1180px",
        margin: "30px auto",
      }}
    >
      <style>{`
        .lughati-games-slider {
          scrollbar-width: none;
          scroll-padding-inline: 12px;
        }

        .lughati-games-slider::-webkit-scrollbar {
          display: none;
        }

        .lughati-cinema-card {
          transition:
            transform .28s ease,
            box-shadow .28s ease,
            opacity .28s ease;
        }

        .lughati-cinema-card-active {
          transform:
            translateY(-8px)
            scale(1.015);
        }

        @media (hover: hover) {
          .lughati-cinema-card:hover {
            transform:
              translateY(-8px)
              scale(1.015);
          }
        }

        @media (max-width: 640px) {
          .lughati-cinema-card {
            width: 82vw !important;
            min-width: 82vw !important;
          }
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .lughati-cinema-card {
            transition: none;
          }

          .lughati-cinema-card-active {
            transform: none;
          }
        }
      `}</style>

      {/* رأس القسم */}

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
            🎮 ألعاب وتحديات
          </span>

          <h2
            style={{
              margin: "8px 0 3px",
              color: "#174c3b",
              fontSize:
                "clamp(27px,4vw,36px)",
              lineHeight: 1.4,
            }}
          >
            اختر مغامرتك 🎬
          </h2>

          <p
            style={{
              margin: 0,
              color: "#718078",
              lineHeight: 1.8,
              fontWeight: 700,
            }}
          >
            للصغار والكبار والعائلة…
            اختر التحدي، سجّل وقتك أو
            انتصارك، ونافس على الصدارة.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() =>
              scrollCards(
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
              scrollCards("next")
            }
            aria-label="التالي"
            style={arrowButton}
          >
            ←
          </button>

          <Link
            href="/games"
            style={{
              textDecoration: "none",
              padding: "11px 16px",
              borderRadius: "15px",
              background: "#eef8f3",
              color: "#14704b",
              border:
                "1px solid #d3eade",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            🎮 جميع الألعاب
          </Link>
        </div>
      </div>

      {/* شريط أسرع المتحدّين */}

      <div
        style={{
          position: "relative",
          overflow: "hidden",
          marginBottom: "20px",
          borderRadius: "22px",
          background:
            "linear-gradient(135deg,#172554 0%,#312e81 48%,#581c87 100%)",
          color: "#ffffff",
          padding: "15px 18px",
          boxShadow:
            "0 10px 26px rgba(49,46,129,.18)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background:
              "rgba(255,255,255,.07)",
            top: "-65px",
            left: "-25px",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "11px",
            }}
          >
            <div
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "15px",
                display: "grid",
                placeItems: "center",
                background:
                  "rgba(255,255,255,.14)",
                fontSize: "24px",
              }}
            >
              ⚡
            </div>

            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: "16px",
                }}
              >
                {activeGameData.leaderboardMode ===
                "wins"
                  ? "أبطال مملكة لغتي"
                  : `أسرع المتحدّين — ${activeGameData.title}`}
              </strong>

              <span
                style={{
                  display: "block",
                  marginTop: "2px",
                  color:
                    "rgba(255,255,255,.75)",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {activeGameData.leaderboardMode ===
                "wins"
                  ? "كم انتصارًا تستطيع تحقيقه؟ 👑"
                  : "هل تستطيع كسر الرقم؟ 👀"}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              gap: "8px",
              flexWrap: "wrap",
              padding: "9px 14px",
              borderRadius: "16px",
              background:
                "rgba(255,255,255,.12)",
              border:
                "1px solid rgba(255,255,255,.16)",
              fontSize: "13px",
              fontWeight: 900,
              minHeight: "38px",
            }}
          >
            {!activeGameData.available ? (
              <span>
                🔒 هذه المغامرة ستفتح
                قريبًا
              </span>
            ) : activeGameData.leaderboardMode ===
              "wins" ? (
              <span>
                👑 الانتصارات وسلسلة
                الفوز ستظهر هنا
              </span>
            ) : scoresLoading ? (
              <span>
                ⏳ جارٍ تحميل أسرع
                الأوقات...
              </span>
            ) : scoreState?.gameId ===
                activeGame &&
              scoreState.error ? (
              <span>
                ⚠️ تعذر تحميل لوحة
                الأوقات الآن
              </span>
            ) : activeScores.length ===
              0 ? (
              <span>
                🏆 كن أول من يسجل
                رقمًا قياسيًا
              </span>
            ) : (
              activeScores.map(
                (score, index) => (
                  <span
                    key={score.id}
                    style={{
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      gap: "5px",
                      padding:
                        "6px 9px",
                      borderRadius:
                        "999px",
                      background:
                        "rgba(255,255,255,.10)",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : "🥉"}{" "}
                    {score.playerName}{" "}
                    <strong>
                      {formatTime(
                        score.timeSeconds
                      )}
                    </strong>
                  </span>
                )
              )
            )}
          </div>

          <span
            style={{
              color:
                "rgba(255,255,255,.72)",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            الاسم اختياري
          </span>
        </div>
      </div>

      {/* البطاقات */}

      <div
        ref={sliderRef}
        className="lughati-games-slider"
        style={{
          display: "flex",
          gap: "18px",
          overflowX: "auto",
          scrollSnapType:
            "x mandatory",
          padding:
            "12px 12px 34px",
          WebkitOverflowScrolling:
            "touch",
        }}
      >
        {weeklyGames.map(
          (game) => {
            const active =
              activeGame === game.id;

            const card = (
              <article
                className={`lughati-cinema-card ${
                  active
                    ? "lughati-cinema-card-active"
                    : ""
                }`}
                onMouseEnter={() =>
                  setActiveGame(
                    game.id
                  )
                }
                onClick={() =>
                  setActiveGame(
                    game.id
                  )
                }
                style={{
                  position: "relative",
                  overflow: "hidden",
                  width: "340px",
                  minWidth: "340px",
                  height: "405px",
                  scrollSnapAlign:
                    "start",
                  borderRadius: "30px",
                  background:
                    game.background,
                  color: "#ffffff",
                  padding: "23px",
                  boxSizing:
                    "border-box",
                  boxShadow:
                    active
                      ? "0 24px 52px rgba(30,50,90,.25)"
                      : "0 13px 28px rgba(30,50,90,.13)",
                  opacity:
                    game.available
                      ? 1
                      : 0.88,
                  cursor:
                    game.available
                      ? "pointer"
                      : "default",
                }}
              >
                {/* زخارف الخلفية */}

                <div
                  style={{
                    position:
                      "absolute",
                    width: "190px",
                    height: "190px",
                    borderRadius:
                      "50%",
                    background:
                      "rgba(255,255,255,.10)",
                    top: "-72px",
                    left: "-55px",
                  }}
                />

                <div
                  style={{
                    position:
                      "absolute",
                    width: "135px",
                    height: "135px",
                    borderRadius:
                      "50%",
                    background:
                      "rgba(255,255,255,.08)",
                    bottom: "-40px",
                    right: "-25px",
                  }}
                />

                <div
                  style={{
                    position:
                      "relative",
                    zIndex: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection:
                      "column",
                  }}
                >
                  {/* أعلى البطاقة */}

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        background:
                          game.available
                            ? "#fde68a"
                            : "rgba(255,255,255,.16)",
                        color:
                          game.available
                            ? "#713f12"
                            : "#ffffff",
                        border:
                          "1px solid rgba(255,255,255,.16)",
                        padding:
                          "8px 11px",
                        borderRadius:
                          "999px",
                        fontSize:
                          "11px",
                        fontWeight: 900,
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {game.competitionLabel ??
                        "⚡ خُض التحدي وسجّل وقتك"}
                    </span>

                    <span
                      style={{
                        fontSize: "29px",
                      }}
                    >
                      {game.icon}
                    </span>
                  </div>

                  {/* محتوى البطاقة */}

                  <div
                    style={{
                      marginTop: "auto",
                      marginBottom:
                        "auto",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "66px",
                        marginBottom:
                          "10px",
                        filter:
                          "drop-shadow(0 12px 16px rgba(0,0,0,.14))",
                      }}
                    >
                      {game.icon}
                    </div>

                    <p
                      style={{
                        margin:
                          "0 0 4px",
                        opacity: 0.84,
                        fontSize:
                          "13px",
                        fontWeight: 900,
                      }}
                    >
                      {game.title}
                    </p>

                    <h3
                      style={{
                        margin:
                          "0 0 10px",
                        fontSize:
                          "28px",
                        lineHeight:
                          1.25,
                      }}
                    >
                      {game.shortTitle}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        lineHeight: 1.75,
                        fontSize:
                          "13px",
                        opacity: 0.92,
                      }}
                    >
                      {
                        game.description
                      }
                    </p>
                  </div>

                  {/* أسفل البطاقة */}

                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                        marginBottom:
                          "10px",
                      }}
                    >
                      <span
                        style={miniBadge}
                      >
                        🧠 {game.skill}
                      </span>

                      <span
                        style={miniBadge}
                      >
                        👥 {game.audience}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize:
                            "11px",
                          fontWeight: 900,
                          opacity: 0.86,
                        }}
                      >
                        {game.available
                          ? "🟢 متاحة الآن"
                          : "🔒 قريبًا"}
                      </span>

                      <span
                        style={{
                          background:
                            "#ffffff",
                          color:
                            game.available
                              ? "#4c1d95"
                              : "#64748b",
                          padding:
                            "10px 13px",
                          borderRadius:
                            "14px",
                          fontSize:
                            "13px",
                          fontWeight:
                            900,
                          boxShadow:
                            "0 7px 18px rgba(0,0,0,.13)",
                        }}
                      >
                        {game.available
                          ? "ابدأ 🎮"
                          : "قريبًا"}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );

            if (!game.available) {
              return (
                <div
                  key={game.id}
                  style={{
                    flex: "0 0 auto",
                  }}
                >
                  {card}
                </div>
              );
            }

            return (
              <Link
                key={game.id}
                href={game.href}
                style={{
                  flex: "0 0 auto",
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

      <div
        style={{
          marginTop: "-10px",
          textAlign: "center",
          color: "#708078",
          fontSize: "12px",
          fontWeight: 800,
        }}
      >
        ← اسحب لاكتشاف تحديات
        الصغار والكبار والعائلة →
      </div>
    </section>
  );
}

function formatTime(
  totalSeconds: number
) {
  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const seconds =
    totalSeconds % 60;

  return `${String(
    minutes
  ).padStart(
    2,
    "0"
  )}:${String(
    seconds
  ).padStart(
    2,
    "0"
  )}`;
}

const miniBadge:
  React.CSSProperties = {
    padding: "6px 8px",
    borderRadius: "999px",
    background:
      "rgba(255,255,255,.13)",
    border:
      "1px solid rgba(255,255,255,.16)",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: 800,
  };

const arrowButton:
  React.CSSProperties = {
    width: "46px",
    height: "46px",
    border:
      "1px solid #d3eade",
    borderRadius: "50%",
    background: "#ffffff",
    color: "#176d4c",
    fontSize: "21px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow:
      "0 8px 18px rgba(30,90,60,.08)",
  };