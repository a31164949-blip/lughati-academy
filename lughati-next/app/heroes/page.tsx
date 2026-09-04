"use client";

import Link from "next/link";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { db } from "../../firebase";

type AcademyHero = {
  id: string;
  studentId: string;
  studentFirstName: string;
  title: string;
  badge: string;
  achievementsCount: number;
  honorCount: number;
  imageUrl: string;
  photoConsent: boolean;
  published: boolean;
  weeklyTrack:
    | "classHero"
    | "academyAchievement"
    | "academyProgress";
  weekKey: string;
  weekLabel: string;
};

function getCurrentWeekInfo() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
        timeZone: "Asia/Riyadh",
      }
    ).formatToParts(new Date());

  const get = (
    type: Intl.DateTimeFormatPartTypes
  ) =>
    parts.find(
      (part) => part.type === type
    )?.value ?? "";

  const weekdayIndex:
    Record<string, number> = {
      Sat: 0,
      Sun: 1,
      Mon: 2,
      Tue: 3,
      Wed: 4,
      Thu: 5,
      Fri: 6,
    };

  const currentIndex =
    weekdayIndex[get("weekday")] ?? 0;

  const currentUtc =
    new Date(
      Date.UTC(
        Number(get("year")),
        Number(get("month")) - 1,
        Number(get("day"))
      )
    );

  const start =
    new Date(currentUtc);

  start.setUTCDate(
    currentUtc.getUTCDate() -
      currentIndex
  );

  const end =
    new Date(start);

  end.setUTCDate(
    start.getUTCDate() + 6
  );

  const ymd = (date: Date) =>
    [
      date.getUTCFullYear(),
      String(
        date.getUTCMonth() + 1
      ).padStart(2, "0"),
      String(
        date.getUTCDate()
      ).padStart(2, "0"),
    ].join("-");

  const formatter =
    new Intl.DateTimeFormat(
      "ar-SA",
      {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }
    );

  return {
    key: ymd(start),
    label: `${formatter.format(
      start
    )} — ${formatter.format(
      end
    )}`,
  };
}

export default function HeroesPage() {
  const currentWeek =
    useMemo(
      () => getCurrentWeekInfo(),
      []
    );

  const [
    heroes,
    setHeroes,
  ] = useState<AcademyHero[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHeroes() {
      try {
        setLoading(true);
        setErrorMessage("");

        const snapshot =
          await getDocs(
            collection(
              db,
              "academyHeroes"
            )
          );

        const allHeroRecords =
          snapshot.docs.map(
            (document) => {
              const data =
                document.data();

              return {
                id: document.id,
                studentId:
                  typeof data.studentId ===
                  "string"
                    ? data.studentId
                    : "",
                studentFirstName:
                  typeof data.studentFirstName ===
                  "string"
                    ? data.studentFirstName
                    : "بطل الأكاديمية",
                title:
                  typeof data.title ===
                  "string"
                    ? data.title
                    : "بطل الأكاديمية",
                badge:
                  typeof data.badge ===
                  "string"
                    ? data.badge
                    : "",
                achievementsCount:
                  typeof data.achievementsCount ===
                  "number"
                    ? data.achievementsCount
                    : 0,
                imageUrl:
                  typeof data.imageUrl ===
                  "string"
                    ? data.imageUrl
                    : "",
                photoConsent:
                  data.photoConsent === true,
                published:
                  data.published === true,
                weeklyTrack:
                  data.weeklyTrack === "classHero" ||
                  data.weeklyTrack === "academyAchievement" ||
                  data.weeklyTrack === "academyProgress"
                    ? data.weeklyTrack
                    : data.weeklyTrack === "progress" ||
                      data.weeklyTrack === "commitment"
                    ? "academyProgress"
                    : "academyAchievement",
                weekKey:
                  typeof data.weekKey ===
                  "string"
                    ? data.weekKey
                    : "",
                weekLabel:
                  typeof data.weekLabel ===
                  "string"
                    ? data.weekLabel
                    : "",
              };
            }
          );

        // كل أسبوع يُحسب تكريمًا واحدًا للطالب،
        // حتى لو ظهر في أكثر من مسار خلال الأسبوع نفسه.
        const honorWeeksByStudent =
          new Map<string, Set<string>>();

        allHeroRecords.forEach(
          (hero) => {
            if (
              !hero.studentId ||
              !hero.weekKey
            ) {
              return;
            }

            const weeks =
              honorWeeksByStudent.get(
                hero.studentId
              ) ?? new Set<string>();

            weeks.add(hero.weekKey);

            honorWeeksByStudent.set(
              hero.studentId,
              weeks
            );
          }
        );

        const loadedHeroes =
          allHeroRecords
            .filter(
              (hero) =>
                hero.published &&
                hero.photoConsent &&
                hero.weekKey ===
                  currentWeek.key
            )
            .map(
              (hero) =>
                ({
                  ...hero,
                  honorCount:
                    honorWeeksByStudent.get(
                      hero.studentId
                    )?.size ?? 1,
                }) satisfies AcademyHero
            )
            .sort((a, b) => {
              const order: Record<
                string,
                number
              > = {
                classHero: 0,
                academyAchievement: 1,
                academyProgress: 2,
              };

              return (
                (order[
                  String(a.weeklyTrack)
                ] ?? 99) -
                (order[
                  String(b.weeklyTrack)
                ] ?? 99)
              );
            });

        if (!active) {
          return;
        }

        setHeroes(
          loadedHeroes
        );
      } catch (error) {
        console.error(
          "تعذر تحميل أبطال الأكاديمية:",
          error
        );

        if (active) {
          setHeroes([]);
          setErrorMessage(
            "تعذر تحميل أبطال الأكاديمية الآن."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadHeroes();

    return () => {
      active = false;
    };
  }, [currentWeek.key]);

  const weekLabel =
    currentWeek.label;

  const topHeroes =
    heroes.slice(0, 3);

  const remainingHeroes =
    heroes.slice(3);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f2fbf6 0%,#ffffff 47%,#fffaf0 100%)",
        padding:
          "24px 16px 60px",
        fontFamily:
          "Arial, sans-serif",
        color:
          "#173f31",
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
            marginBottom: "18px",
          }}
        >
          <Link
            href="/"
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: "7px",
              textDecoration:
                "none",
              background:
                "#ffffff",
              border:
                "1px solid #d5e9df",
              color:
                "#176d4c",
              borderRadius:
                "15px",
              padding:
                "11px 17px",
              fontWeight:
                900,
              boxShadow:
                "0 7px 18px rgba(30,90,60,.06)",
            }}
          >
            ← العودة إلى الرئيسية
          </Link>
        </div>

        <section
          style={{
            position:
              "relative",
            overflow:
              "hidden",
            borderRadius:
              "32px",
            padding:
              "34px 24px",
            background:
              "linear-gradient(135deg,#147a52 0%,#1e9b6b 55%,#39b978 100%)",
            color:
              "#ffffff",
            boxShadow:
              "0 18px 42px rgba(20,120,80,.18)",
            textAlign:
              "center",
          }}
        >
          <div
            style={{
              position:
                "absolute",
              width:
                "230px",
              height:
                "230px",
              borderRadius:
                "50%",
              background:
                "rgba(255,255,255,.08)",
              top:
                "-105px",
              left:
                "-60px",
            }}
          />

          <div
            style={{
              position:
                "relative",
              zIndex: 2,
            }}
          >
            <div
              style={{
                fontSize:
                  "58px",
                marginBottom:
                  "6px",
              }}
            >
              🏆
            </div>

            <span
              style={{
                display:
                  "inline-flex",
                padding:
                  "7px 13px",
                borderRadius:
                  "999px",
                background:
                  "rgba(255,255,255,.16)",
                fontSize:
                  "13px",
                fontWeight:
                  900,
                marginBottom:
                  "10px",
              }}
            >
              ✨ تكريم أسبوعي
            </span>

            <h1
              style={{
                margin:
                  "0 0 9px",
                fontSize:
                  "clamp(32px,5vw,50px)",
                lineHeight:
                  1.35,
              }}
            >
              أبطال الأكاديمية
              في أسبوع
            </h1>

            <p
              style={{
                maxWidth:
                  "760px",
                margin:
                  "0 auto",
                lineHeight:
                  1.9,
                fontSize:
                  "16px",
                fontWeight:
                  700,
                opacity:
                  0.94,
              }}
            >
              نحتفي كل أسبوع
              ببطل من الفصل
              وبطلين من الأكاديمية،
              تقديرًا للمشاركة
              والإنجاز والتطور
              والالتزام.
            </p>

            <div
              style={{
                display:
                  "inline-flex",
                marginTop:
                  "16px",
                padding:
                  "8px 14px",
                borderRadius:
                  "999px",
                background:
                  "#fff4c7",
                color:
                  "#805b00",
                fontWeight:
                  900,
                fontSize:
                  "13px",
              }}
            >
              🗓️ {weekLabel}
            </div>
          </div>
        </section>

        {loading ? (
          <section
            style={
              messageCardStyle
            }
          >
            ⏳ جارٍ تحميل
            أبطال الأسبوع...
          </section>
        ) : errorMessage ? (
          <section
            style={{
              ...messageCardStyle,
              color:
                "#b91c1c",
              background:
                "#fef2f2",
              border:
                "1px solid #fecaca",
            }}
          >
            {errorMessage}
          </section>
        ) : heroes.length ===
          0 ? (
          <section
            style={
              messageCardStyle
            }
          >
            <div
              style={{
                fontSize:
                  "48px",
              }}
            >
              🌟
            </div>

            <h2
              style={{
                margin:
                  "8px 0 4px",
                color:
                  "#176c46",
              }}
            >
              أبطال هذا الأسبوع
              قادمون قريبًا
            </h2>

            <p
              style={{
                margin: 0,
                color:
                  "#718078",
                lineHeight:
                  1.8,
              }}
            >
              تابع الأكاديمية
              لتكتشف الأبطال
              والإنجازات الجديدة.
            </p>
          </section>
        ) : (
          <>
            <section
              style={{
                marginTop:
                  "24px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "end",
                  gap: "12px",
                  flexWrap:
                    "wrap",
                  marginBottom:
                    "14px",
                }}
              >
                <div>
                  <span
                    style={{
                      color:
                        "#a66a00",
                      fontWeight:
                        900,
                      fontSize:
                        "13px",
                    }}
                  >
                    🌟 منصة التميز
                  </span>

                  <h2
                    style={{
                      margin:
                        "4px 0 0",
                      color:
                        "#174c3b",
                      fontSize:
                        "clamp(24px,4vw,32px)",
                    }}
                  >
                    أبطال الأسبوع
                  </h2>
                </div>

                <span
                  style={{
                    color:
                      "#718078",
                    fontSize:
                      "12px",
                    fontWeight:
                      800,
                  }}
                >
                  بطل من الفصل
                  وبطلان من الأكاديمية
                </span>
              </div>

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(240px,1fr))",
                  gap:
                    "16px",
                  alignItems:
                    "stretch",
                }}
              >
                {topHeroes.map(
                  (
                    hero,
                    index
                  ) => (
                    <HeroPodiumCard
                      key={
                        hero.id
                      }
                      hero={
                        hero
                      }
                      rank={
                        index + 1
                      }
                    />
                  )
                )}
              </div>
            </section>

            {remainingHeroes.length >
              0 && (
              <section
                style={{
                  marginTop:
                    "24px",
                  background:
                    "#ffffff",
                  border:
                    "1px solid #dcece4",
                  borderRadius:
                    "26px",
                  padding:
                    "20px",
                  boxShadow:
                    "0 10px 28px rgba(30,90,60,.06)",
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
                    gap:
                      "10px",
                    flexWrap:
                      "wrap",
                    marginBottom:
                      "14px",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      color:
                        "#176c46",
                      fontSize:
                        "21px",
                    }}
                  >
                    ✨ بقية أبطال
                    الأسبوع
                  </h2>

                  <span
                    style={{
                      color:
                        "#718078",
                      fontSize:
                        "12px",
                      fontWeight:
                        800,
                    }}
                  >
                    كل إنجاز يستحق
                    التقدير
                  </span>
                </div>

                <div
                  style={{
                    display:
                      "grid",
                    gap:
                      "10px",
                  }}
                >
                  {remainingHeroes.map(
                    (
                      hero,
                      index
                    ) => (
                      <HeroRow
                        key={
                          hero.id
                        }
                        hero={
                          hero
                        }
                        rank={
                          index + 4
                        }
                      />
                    )
                  )}
                </div>
              </section>
            )}

            <section
              style={{
                marginTop:
                  "22px",
                borderRadius:
                  "24px",
                padding:
                  "19px",
                background:
                  "linear-gradient(135deg,#fffaf0,#f3fff8)",
                border:
                  "1px solid #ece3bf",
                textAlign:
                  "center",
                boxShadow:
                  "0 8px 22px rgba(120,90,20,.05)",
              }}
            >
              <div
                style={{
                  fontSize:
                    "34px",
                }}
              >
                💚
              </div>

              <strong
                style={{
                  display:
                    "block",
                  color:
                    "#176c46",
                  fontSize:
                    "19px",
                  marginTop:
                    "4px",
                }}
              >
                أنت بطل الأسبوع
                القادم
              </strong>

              <p
                style={{
                  margin:
                    "6px 0 0",
                  color:
                    "#718078",
                  lineHeight:
                    1.8,
                }}
              >
                استمر في التعلم
                والقراءة والإنجاز،
                فكل تقدم جديد
                يقربك من منصة
                الأبطال.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function getTrackInfo(
  track: AcademyHero["weeklyTrack"]
) {
  if (track === "classHero") {
    return {
      icon: "🏫",
      label: "بطل الفصل",
    };
  }

  if (
    track ===
    "academyProgress"
  ) {
    return {
      icon: "🌱",
      label:
        "بطل التطور والالتزام في الأكاديمية",
    };
  }

  return {
    icon: "🥇",
    label:
      "بطل الإنجاز في الأكاديمية",
  };
}


function getHonorCountLabel(
  count?: number
) {
  const safeCount =
    typeof count === "number" &&
    Number.isFinite(count) &&
    count > 0
      ? count
      : 1;

  if (safeCount === 1) {
    return "🏆 التكريم الأول";
  }

  if (safeCount === 2) {
    return "🏆 تُوِّج مرتين";
  }

  return `🏆 تُوِّج ${safeCount} مرات`;
}


function HeroPodiumCard({
  hero,
  rank,
}: {
  hero: AcademyHero;
  rank: number;
}) {
  const trackInfo =
    getTrackInfo(
      hero.weeklyTrack
    );

  const rankInfo =
    rank === 1
      ? {
          medal: trackInfo.icon,
          label: trackInfo.label,
          background:
            "linear-gradient(180deg,#fff9df,#ffffff)",
          border:
            "#f5d56d",
        }
      : rank === 2
      ? {
          medal: trackInfo.icon,
          label: trackInfo.label,
          background:
            "linear-gradient(180deg,#f4f7fa,#ffffff)",
          border:
            "#cbd5e1",
        }
      : {
          medal: trackInfo.icon,
          label: trackInfo.label,
          background:
            "linear-gradient(180deg,#fff3e7,#ffffff)",
          border:
            "#fdba74",
        };

  return (
    <article
      style={{
        position:
          "relative",
        overflow:
          "hidden",
        borderRadius:
          "26px",
        padding:
          "22px 18px",
        background:
          rankInfo.background,
        border:
          `2px solid ${rankInfo.border}`,
        boxShadow:
          rank === 1
            ? "0 16px 34px rgba(184,134,11,.15)"
            : "0 10px 25px rgba(30,70,60,.07)",
        textAlign:
          "center",
      }}
    >
      <div
        style={{
          position:
            "absolute",
          top:
            "12px",
          right:
            "13px",
          fontSize:
            "30px",
        }}
      >
        {rankInfo.medal}
      </div>

      <span
        style={{
          display:
            "inline-flex",
          padding:
            "6px 10px",
          borderRadius:
            "999px",
          background:
            "rgba(255,255,255,.8)",
          color:
            "#765c11",
          fontSize:
            "11px",
          fontWeight:
            900,
          marginBottom:
            "13px",
        }}
      >
        {rankInfo.label}
      </span>

      <HeroAvatar
        hero={hero}
        size={84}
      />

      <h3
        style={{
          margin:
            "13px 0 4px",
          color:
            "#174c3b",
          fontSize:
            "21px",
        }}
      >
        {hero.studentFirstName}
      </h3>

      <p
        style={{
          margin: 0,
          color:
            "#5f7168",
          fontSize:
            "14px",
          fontWeight:
            800,
        }}
      >
        {hero.title}
      </p>

      <div
        style={{
          display:
            "inline-flex",
          marginTop:
            "10px",
          padding:
            "7px 11px",
          borderRadius:
            "999px",
          background:
            "#fff8dc",
          border:
            "1px solid #f3df9b",
          color:
            "#7a5900",
          fontSize:
            "12px",
          fontWeight:
            900,
        }}
      >
        {getHonorCountLabel(
          hero.honorCount
        )}
      </div>

      {hero.badge && (
        <div
          style={{
            display:
              "inline-flex",
            marginTop:
              "10px",
            padding:
              "6px 10px",
            borderRadius:
              "999px",
            background:
              "#fff4c7",
            color:
              "#805b00",
            fontSize:
              "12px",
            fontWeight:
              900,
          }}
        >
          ✨ {hero.badge}
        </div>
      )}
     {hero.achievementsCount > 0 && (
      <div
        style={{
          marginTop:
            "13px",
          padding:
            "10px",
          borderRadius:
            "14px",
          background:
            "#f1fbf5",
          color:
            "#176c46",
          fontWeight:
            900,
          fontSize:
            "13px",
        }}
      >
        ⭐{" "}
        {
          hero.achievementsCount
        }{" "}
        إنجازًا
      </div>
      )}
    </article>
  );
}

function HeroRow({
  hero,
  rank,
}: {
  hero: AcademyHero;
  rank: number;
}) {
  return (
    <article
      style={{
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "space-between",
        gap:
          "12px",
        flexWrap:
          "wrap",
        padding:
          "13px 14px",
        borderRadius:
          "17px",
        background:
          "#fbfefc",
        border:
          "1px solid #e0eee7",
      }}
    >
      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap:
            "11px",
          minWidth: 0,
        }}
      >
        <div
          style={{
            width:
              "34px",
            height:
              "34px",
            borderRadius:
              "11px",
            display:
              "grid",
            placeItems:
              "center",
            background:
              "#eef8f3",
            color:
              "#176c46",
            fontWeight:
              900,
            flexShrink:
              0,
          }}
        >
          {rank}
        </div>

        <HeroAvatar
          hero={hero}
          size={48}
        />

        <div
          style={{
            minWidth: 0,
          }}
        >
          <strong
            style={{
              display:
                "block",
              color:
                "#174c3b",
            }}
          >
            {
              hero.studentFirstName
            }
          </strong>

          <span
            style={{
              color:
                "#718078",
              fontSize:
                "12px",
              fontWeight:
                700,
            }}
          >
            {hero.title}
          </span>
        </div>
      </div>

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap:
            "8px",
          flexWrap:
            "wrap",
        }}
      >
        {hero.badge && (
          <span
            style={{
              padding:
                "5px 9px",
              borderRadius:
                "999px",
              background:
                "#fff7d6",
              color:
                "#806000",
              fontSize:
                "11px",
              fontWeight:
                900,
            }}
          >
            ✨ {hero.badge}
          </span>
        )}

        <span
          style={{
            padding:
              "6px 10px",
            borderRadius:
              "999px",
            background:
              "#eaf9f0",
            color:
              "#176c46",
            fontSize:
              "12px",
            fontWeight:
              900,
          }}
        >
          ⭐{" "}
          {
            hero.achievementsCount
          }
        </span>
      </div>
    </article>
  );
}

function HeroAvatar({
  hero,
  size,
}: {
  hero: AcademyHero;
  size: number;
}) {
  return (
    <div
      style={{
        width:
          `${size}px`,
        height:
          `${size}px`,
        borderRadius:
          "50%",
        overflow:
          "hidden",
        margin:
          size > 60
            ? "0 auto"
            : undefined,
        background:
          "#e9f8ef",
        border:
          "3px solid #ffffff",
        boxShadow:
          "0 7px 18px rgba(30,90,60,.12)",
        display:
          "grid",
        placeItems:
          "center",
        fontSize:
          `${Math.round(
            size * 0.46
          )}px`,
        flexShrink:
          0,
      }}
    >
      {hero.imageUrl ? (
        <img
          src={hero.imageUrl}
          alt=""
          style={{
            width:
              "100%",
            height:
              "100%",
            objectFit:
              "cover",
          }}
        />
      ) : (
        "🌟"
      )}
    </div>
  );
}

const messageCardStyle:
  React.CSSProperties = {
    marginTop: "22px",
    background: "#ffffff",
    border:
      "1px solid #dcece4",
    borderRadius:
      "24px",
    padding: "30px",
    textAlign:
      "center",
    color: "#64756d",
    fontWeight: 800,
    boxShadow:
      "0 9px 25px rgba(30,90,60,.06)",
  };