"use client";

import WeeklyGames from "./components/WeeklyGames";
import { useEffect, useState } from "react";
import Link from "next/link";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase";

import WeeklyPicks from "./components/WeeklyPicks";
import HomeworkReminder from "./components/HomeworkReminder";
import AcademicJourney from "./components/AcademicJourney";
import ClassDiary from "./components/ClassDiary";

type AcademySection = {
  icon: string;
  title: string;
  description: string;
  href: string;
  className: string;
};

type AcademyAnnouncement = {
  id: string;
  title: string;
  message: string;
  priority: string;
  pinned: boolean;
};

type AcademicJourneyEvent = {
  id: string;
  title: string;
  icon: string;
  semester: 1 | 2;
  date: string | null;
  category:
    | "study"
    | "holiday"
    | "national"
    | "exam";
};

type AcademyHero = {
  id: string;
  studentFirstName: string;
  title: string;
  badge: string;
  achievementsCount: number;
  imageUrl: string;
  photoConsent: boolean;
  published: boolean;
  weeklyTrack:
    | "achievement"
    | "progress"
    | "commitment";
};
type DayMessage = {
  show: boolean;
  title: string;
  message: string;
  icon: string;
};

const sections: AcademySection[] = [
  {
    icon: "📚",
    title: "دروسي",
    description:
      "الدروس والأنشطة التعليمية الممتعة",
    href: "/lessons",
    className: "blue-card",
  },
  {
    icon: "🌱",
    title: "رحلة الدعم",
    description:
      "تدريبات متدرجة لتقوية القراءة والكتابة",
    href: "/support",
    className: "green-card",
  },
  {
    icon: "📖",
    title: "الفهم القرائي",
    description:
      "نصوص وقصص وأسئلة لتنمية الفهم",
    href: "/reading",
    className: "purple-card",
  },
  {
    icon: "🎮",
    title: "الألعاب التعليمية",
    description:
      "تعلّم والعب واكسب النجوم",
    href: "/games",
    className: "orange-card",
  },
  {
    icon: "🌟",
    title: "أبطال الأكاديمية",
    description:
      "شاهد أبطال القراءة والإملاء والإنجاز",
    href: "/heroes",
    className: "gold-card",
  },
  {
    icon: "🎨",
    title: "معرض الطلاب",
    description:
      "شاهد إبداعات وأعمال زملائك",
    href: "/gallery",
    className: "teal-card",
  },
];

const academicJourneyEvents: AcademicJourneyEvent[] = [
  {
    id: "school-start",
    title: "بداية العام الدراسي",
    icon: "🏫",
    semester: 1,
    date: "2026-08-23",
    category: "study",
  },
  {
    id: "national-day",
    title: "إجازة اليوم الوطني",
    icon: "🇸🇦",
    semester: 1,
    date: "2026-09-23",
    category: "national",
  },
  {
    id: "autumn-break",
    title: "إجازة الخريف",
    icon: "🍂",
    semester: 1,
    date: "2026-11-20",
    category: "holiday",
  },
  {
    id: "midyear-break",
    title: "إجازة منتصف العام",
    icon: "❄️",
    semester: 1,
    date: null,
    category: "holiday",
  },
  {
    id: "semester-two-start",
    title: "بداية الفصل الدراسي الثاني",
    icon: "🚀",
    semester: 2,
    date: null,
    category: "study",
  },
  {
    id: "foundation-day",
    title: "إجازة يوم التأسيس",
    icon: "🐪",
    semester: 2,
    date: null,
    category: "national",
  },
  {
    id: "eid-al-fitr",
    title: "إجازة عيد الفطر",
    icon: "🌙",
    semester: 2,
    date: null,
    category: "holiday",
  },
  {
    id: "eid-al-adha",
    title: "إجازة عيد الأضحى",
    icon: "🕋",
    semester: 2,
    date: null,
    category: "holiday",
  },
  {
    id: "school-year-end",
    title: "نهاية العام الدراسي",
    icon: "🎓",
    semester: 2,
    date: null,
    category: "study",
  },
];

export default function Home() {
  const [points] = useState(0);
  const [stars] = useState(0);

  const [today, setToday] =
    useState("");

  const [
    announcements,
    setAnnouncements,
  ] =
    useState<
      AcademyAnnouncement[]
    >([]);

  const [
    dayMessage,
    setDayMessage,
  ] =
    useState<DayMessage>({
      show: false,
      title: "",
      message: "",
      icon: "🌙",
    });

  const [
    announcementsLoading,
    setAnnouncementsLoading,
  ] = useState(true);

  const [
    heroes,
    setHeroes,
  ] =
    useState<AcademyHero[]>([]);

  

  /*
   * رسالة الوقت الذكية.
   * تظهر بعد الساعة 10 مساءً
   * وحتى الساعة 5 صباحًا
   * حسب توقيت الرياض.
   */
/*
 * رسالة فارس الذكية حسب الوقت
 * بتوقيت الرياض.
 */
useEffect(() => {
  const updateDayMessage = () => {
    const parts =
      new Intl.DateTimeFormat(
        "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Riyadh",
        }
      ).formatToParts(new Date());

    const hour =
      Number(
        parts.find(
          (part) =>
            part.type === "hour"
        )?.value ?? 0
      );

    // من 5 صباحًا إلى 12 ظهرًا
    if (hour >= 5 && hour < 12) {
      setDayMessage({
        show: true,
        title:
          "صباح النشاط يا بطل ☀️",
        message:
          "يوم جديد بدأ… اقرأ، تعلّم، واصنع إنجازًا جميلًا مع فارس 🌱✨",
        icon: "☀️",
      });

      return;
    }

    // من 12 ظهرًا إلى 6 مساءً
    if (hour >= 12 && hour < 18) {
      setDayMessage({
        show: true,
        title:
          "استمر يا بطل 🌤️",
        message:
          "أحسنت حتى الآن… أكمل مهامك بهدوء، فكل خطوة تقرّبك من هدفك ⭐",
        icon: "🌤️",
      });

      return;
    }

    // من 6 مساءً إلى 10 مساءً
    if (hour >= 18 && hour < 22) {
      setDayMessage({
        show: true,
        title:
          "مساء الإنجاز يا بطل 🌙",
        message:
          "راجع ما تعلمته اليوم، وأنهِ ما بقي لك لتبدأ غدًا وأنت مستعد ✨",
        icon: "🌙",
      });

      return;
    }

    // من 10 مساءً إلى 5 صباحًا
    setDayMessage({
      show: true,
      title:
        "حان وقت الراحة يا بطل 🌙",
      message:
        "لقد أبدعت اليوم… نم مبكرًا، ونلتقي غدًا بطاقة جديدة بإذن الله 😴✨",
      icon: "🌙",
    });
  };

  updateDayMessage();

  const timer =
    window.setInterval(
      updateDayMessage,
      60 * 1000
    );

  return () =>
    window.clearInterval(timer);
}, []);

  /*
  /*
 * تحميل الإعلانات.
 */
useEffect(() => {
  async function loadAnnouncements() {
    try {
      setAnnouncementsLoading(true);

      const response = await fetch(
        "/api/public-announcements",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const responseText =
        await response.text();

      if (!responseText.trim()) {
        console.warn(
          "استجابة الإعلانات فارغة."
        );

        setAnnouncements([]);
        return;
      }

      let data: {
        success?: boolean;
        announcements?: AcademyAnnouncement[];
      };

      try {
        data = JSON.parse(
          responseText
        );
      } catch (parseError) {
        console.error(
          "استجابة الإعلانات ليست JSON صالحًا:",
          responseText,
          parseError
        );

        setAnnouncements([]);
        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        setAnnouncements([]);
        return;
      }

      setAnnouncements(
        Array.isArray(
          data.announcements
        )
          ? data.announcements
          : []
      );
    } catch (error) {
      console.error(
        "تعذر تحميل نبض الأكاديمية:",
        error
      );

      setAnnouncements([]);
    } finally {
      setAnnouncementsLoading(
        false
      );
    }
  }

  void loadAnnouncements();
}, []);

  /*
   * تحميل الأبطال المنشورين فقط.
   */
  useEffect(() => {
    async function loadHeroes() {
      try {
        const snapshot =
          await getDocs(
            collection(
              db,
              "academyHeroes"
            )
          );

        const loadedHeroes =
          snapshot.docs
            .map(
              (
                document
              ) => {
                const data =
                  document.data();

                return {
                  id: document.id,

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
                    data.photoConsent ===
                    true,

                  published:
                    data.published ===
                    true,
                    weeklyTrack:
  data.weeklyTrack === "progress"
    ? "progress"
    : data.weeklyTrack === "commitment"
    ? "commitment"
    : "achievement",
                } satisfies AcademyHero;
              }
            )
            .filter(
              (hero) =>
                hero.published &&
                hero.photoConsent
            );

        setHeroes(
          loadedHeroes
        );
      } catch (error) {
        console.error(
          "تعذر تحميل أبطال الأكاديمية:",
          error
        );

        setHeroes([]);
      }
    }

    void loadHeroes();
  }, []);


  /*
   * التاريخ.
   */
  useEffect(() => {
    const updateToday =
      () => {
        const formattedDate =
          new Intl.DateTimeFormat(
            "ar-SA",
            {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone:
                "Asia/Riyadh",
            }
          ).format(
            new Date()
          );

        setToday(
          formattedDate
        );
      };

    updateToday();
  }, []);

  function getAnnouncementPreview(
    message: string
  ) {
    const firstLine =
      message
        .split("\n")
        .map((line) =>
          line.trim()
        )
        .find(Boolean);

    return firstLine || "";
  }

  const weeklyHeroes =
  [...heroes].sort((a, b) => {
    const order = {
      achievement: 0,
      progress: 1,
      commitment: 2,
    };

    return (
      order[a.weeklyTrack] -
      order[b.weeklyTrack]
    );
  });


  return (
    <main
      className="academy-page"
      dir="rtl"
    >
      <HomeworkReminder />

      {/* رسالة المساء الذكية */}

      {dayMessage.show && (
        <section
          aria-label="رسالة المساء"
          style={{
            maxWidth:
              "1180px",
            margin:
              "14px auto 4px",
            padding:
              "13px 17px",
            borderRadius:
              "22px",
            color: "#ffffff",
            background:
              "linear-gradient(135deg,#172554 0%,#1e3a8a 50%,#312e81 100%)",
            boxShadow:
              "0 10px 28px rgba(30,58,138,.18)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap: "14px",
            flexWrap:
              "wrap",
            position:
              "relative",
            overflow:
              "hidden",
          }}
        >
          {/* قمر خلفي */}

          <div
            style={{
              position:
                "absolute",
              width:
                "130px",
              height:
                "130px",
              borderRadius:
                "50%",
              background:
                "rgba(255,255,255,.05)",
              left:
                "-35px",
              top:
                "-60px",
              pointerEvents:
                "none",
            }}
          />

          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "13px",
              position:
                "relative",
            }}
          >
            <div
              style={{
                width:
                  "48px",
                height:
                  "48px",
                borderRadius:
                  "16px",
                background:
                  "rgba(255,255,255,.12)",
                display:
                  "grid",
                placeItems:
                  "center",
                fontSize:
                  "28px",
                flexShrink:
                  0,
              }}
            >
              {
                dayMessage.icon
              }
            </div>

            <div>
              <strong
                style={{
                  display:
                    "block",
                  fontSize:
                    "16px",
                  fontWeight:
                    900,
                }}
              >
                {
                  dayMessage.title
                }
              </strong>

              <p
                style={{
                  margin:
                    "3px 0 0",
                  color:
                    "#dbeafe",
                  fontSize:
                    "13px",
                  fontWeight:
                    700,
                  lineHeight:
                    1.7,
                }}
              >
                {
                  dayMessage.message
                }
              </p>
            </div>
          </div>

          <div
            style={{
              display:
                "flex",
              gap: "8px",
              alignItems:
                "center",
              color:
                "#fde68a",
              fontSize:
                "16px",
              whiteSpace:
                "nowrap",
              position:
                "relative",
            }}
          >
            ✨ ⭐ ✨
          </div>
        </section>
      )}

      {/* الهوية */}

      <header className="academy-header">
        <div className="brand">
          <div className="brand-icon">
            📚
          </div>

          <div>
            <p className="brand-label">
              مرحبًا بك في
            </p>

            <h1>
              أكاديمية لغتي الرقمية
            </h1>

            <p className="slogan">
              نتعلّم… نقرأ… نبدع
            </p>
          </div>
        </div>

        <div className="student-points">
          <span>⭐</span>

          <div>
            <small>
              نجومك
            </small>

            <strong>
              {stars}
            </strong>

            <small>
              {points} نقطة
            </small>
          </div>
        </div>
      </header>

      {/* الترحيب المختصر الجديد */}

      <section
        style={{
          maxWidth:
            "1180px",
          margin:
            "24px auto 18px",
          padding:
            "18px 22px",
          borderRadius:
            "26px",
          background:
            "linear-gradient(135deg, #158057, #20a06d)",
          color: "white",
          boxShadow:
            "0 12px 30px rgba(25, 120, 80, 0.16)",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          gap: "18px",
          flexWrap:
            "wrap",
        }}
      >
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: "15px",
          }}
        >
          <div
            style={{
              width:
                "64px",
              height:
                "64px",
              borderRadius:
                "20px",
              background:
                "rgba(255,255,255,0.15)",
              display:
                "grid",
              placeItems:
                "center",
              fontSize:
                "38px",
              flexShrink:
                0,
            }}
          >
            🧒🏻
          </div>

          <div>
            <div
              style={{
                fontSize:
                  "clamp(22px, 3vw, 31px)",
                fontWeight:
                  900,
              }}
            >
              السلام عليكم يا بطل 👋
            </div>

            <p
              style={{
                margin:
                  "5px 0 0",
                opacity:
                  0.9,
                lineHeight:
                  1.6,
              }}
            >
              فارس معك… جاهز
              لإنجاز جديد اليوم؟
            </p>
          </div>
        </div>

        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: "12px",
            flexWrap:
              "wrap",
          }}
        >
          <span
            style={{
              fontSize:
                "14px",
              opacity:
                0.9,
            }}
          >
            {today ? (
              <>
                🗓️{" "}
                {today}
              </>
            ) : (
              <>
                🗓️ اليوم
              </>
            )}
          </span>

          <Link
            href="/login"
            style={{
              background:
                "white",
              color:
                "#126846",
              textDecoration:
                "none",
              padding:
                "12px 18px",
              borderRadius:
                "15px",
              fontWeight:
                900,
              whiteSpace:
                "nowrap",
            }}
          >
            ابدأ رحلتي ←
          </Link>
        </div>
      </section>

      {/* نبض الأكاديمية */}

      <section
        className="academy-pulse"
        aria-label="نبض الأكاديمية"
      >
        <div className="academy-pulse__badge">
          <span aria-hidden="true">
            📣
          </span>

          <strong>
            نبض الأكاديمية
          </strong>
        </div>

        <div className="academy-pulse__viewport">
          <div className="academy-pulse__track">
            {announcementsLoading ? (
              <span className="academy-pulse__item">
                ⏳ جارٍ تحميل أخبار
                الأكاديمية...
              </span>
            ) : announcements.length >
              0 ? (
              <>
                {announcements.map(
                  (
                    announcement,
                    index
                  ) => (
                    <span
                      key={
                        announcement.id
                      }
                      style={{
                        display:
                          "contents",
                      }}
                    >
                      <span className="academy-pulse__item">
                        {announcement.pinned
                          ? "📌 "
                          : "✨ "}

                        <strong>
                          {
                            announcement.title
                          }
                        </strong>

                        {getAnnouncementPreview(
                          announcement.message
                        ) && (
                          <>
                            {" — "}
                            {getAnnouncementPreview(
                              announcement.message
                            )}
                          </>
                        )}
                      </span>

                      {index <
                        announcements.length -
                          1 && (
                        <span
                          className="academy-pulse__separator"
                          aria-hidden="true"
                        >
                          ✦
                        </span>
                      )}
                    </span>
                  )
                )}
              </>
            ) : (
              <>
                <span className="academy-pulse__item">
                  🌟 أهلاً بأبطال
                  أكاديمية لغتي…
                  نتعلّم، نقرأ، نبدع.
                </span>

                <span
                  className="academy-pulse__separator"
                  aria-hidden="true"
                >
                  ✦
                </span>

                <span className="academy-pulse__item">
                  📚 تابع خطتك
                  الأسبوعية وابدأ
                  رحلتك التعليمية.
                </span>
              </>
            )}
          </div>
        </div>

        <span className="academy-pulse__live">
          <span aria-hidden="true"></span>
          مباشر
        </span>
        </section>
{/* أبطال الأكاديمية في أسبوع */}

<section
  style={{
    maxWidth: "1180px",
    margin: "14px auto",
    padding: "17px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg,#ffffff 0%,#f6fff9 55%,#fffaf0 100%)",
    border: "1px solid #dcece4",
    boxShadow:
      "0 9px 24px rgba(30,90,60,0.07)",
    position: "relative",
    overflow: "hidden",
  }}
>
  {/* زخرفة */}

  <div
    style={{
      position: "absolute",
      width: "150px",
      height: "150px",
      borderRadius: "50%",
      background:
        "rgba(255,214,64,.08)",
      left: "-55px",
      top: "-70px",
      pointerEvents: "none",
    }}
  />

  {/* رأس الشريط */}

  <div
    style={{
      position: "relative",
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom:
        weeklyHeroes.length > 0
          ? "14px"
          : 0,
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
          width: "48px",
          height: "48px",
          borderRadius: "15px",
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(135deg,#fff4c7,#fff9e6)",
          border:
            "1px solid #f5dfa0",
          fontSize: "26px",
          flexShrink: 0,
        }}
      >
        🏆
      </div>

      <div>
        <strong
          style={{
            display: "block",
            color: "#176c46",
            fontSize: "16px",
            fontWeight: 900,
          }}
        >
          أبطال الأكاديمية في أسبوع
        </strong>

        <span
          style={{
            display: "block",
            marginTop: "2px",
            color: "#718078",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          ✨ نحتفي بالإنجاز والتطور
          والالتزام
        </span>
      </div>
    </div>

    <Link
      href="/heroes"
      style={{
        textDecoration: "none",
        color: "#14744d",
        fontWeight: 900,
        fontSize: "13px",
        padding: "9px 13px",
        borderRadius: "13px",
        background: "#eaf9f0",
        border:
          "1px solid #d4ecdf",
        whiteSpace: "nowrap",
      }}
    >
      اكتشف أبطال الأسبوع ←
    </Link>
  </div>

  {/* الأبطال الثلاثة */}

  {weeklyHeroes.length > 0 ? (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(220px,1fr))",
        gap: "10px",
      }}
    >
      {weeklyHeroes
        .slice(0, 3)
        .map((hero) => {
          const track =
            hero.weeklyTrack ===
            "achievement"
              ? {
                  icon: "🥇",
                  label:
                    "الأكثر إنجازًا",
                  background:
                    "#fffaf0",
                  border:
                    "#f3df9a",
                  accent:
                    "#8a6700",
                }
              : hero.weeklyTrack ===
                "progress"
              ? {
                  icon: "🌱",
                  label:
                    "الأكثر تطورًا",
                  background:
                    "#f0fdf4",
                  border:
                    "#bbf7d0",
                  accent:
                    "#15803d",
                }
              : {
                  icon: "⭐",
                  label:
                    "الأكثر التزامًا",
                  background:
                    "#eff6ff",
                  border:
                    "#bfdbfe",
                  accent:
                    "#1d4ed8",
                };

          return (
            <article
              key={hero.id}
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: "11px",
                padding: "11px",
                borderRadius:
                  "17px",
                background:
                  track.background,
                border: `1px solid ${track.border}`,
                minWidth: 0,
              }}
            >
              {/* الأفاتار */}

              <div
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  display: "grid",
                  placeItems:
                    "center",
                  background:
                    "#ffffff",
                  border:
                    "3px solid #ffffff",
                  boxShadow:
                    "0 5px 13px rgba(30,90,60,.12)",
                  flexShrink: 0,
                  fontSize: "27px",
                }}
              >
                {hero.imageUrl ? (
                  <img
                    src={
                      hero.imageUrl
                    }
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
                  track.icon
                )}
              </div>

              {/* بيانات البطل */}

              <div
                style={{
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: "5px",
                    flexWrap:
                      "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "15px",
                    }}
                  >
                    {track.icon}
                  </span>

                  <span
                    style={{
                      color:
                        track.accent,
                      fontSize:
                        "11px",
                      fontWeight:
                        900,
                    }}
                  >
                    {track.label}
                  </span>
                </div>

                <strong
                  style={{
                    display:
                      "block",
                    marginTop:
                      "2px",
                    color:
                      "#174c36",
                    fontSize:
                      "16px",
                    fontWeight:
                      900,
                  }}
                >
                  {
                    hero.studentFirstName
                  }
                </strong>

                <span
                  style={{
                    display:
                      "block",
                    marginTop:
                      "1px",
                    color:
                      "#64756d",
                    fontSize:
                      "12px",
                    fontWeight:
                      800,
                  }}
                >
                  {hero.title}
                </span>

                {hero.badge && (
                  <span
                    style={{
                      display:
                        "inline-flex",
                      marginTop:
                        "4px",
                      color:
                        track.accent,
                      fontSize:
                        "10px",
                      fontWeight:
                        800,
                    }}
                  >
                    ✨ {hero.badge}
                  </span>
                )}
              </div>
            </article>
          );
        })}
    </div>
  ) : (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        padding: "9px 0 2px",
        color: "#6f7f76",
        fontSize: "13px",
        fontWeight: 700,
      }}
    >
      🌟 قريبًا نحتفي هنا بأبطال
      هذا الأسبوع.
    </div>
  )}
</section>

      <AcademicJourney
        events={
          academicJourneyEvents
        }
      />

      <ClassDiary />

      <WeeklyGames />

      <WeeklyPicks />

      {/* بوابات الأكاديمية */}

      <section className="academy-gates academy-gates--compact">
        <div className="academy-gates-header">
          <span className="section-label">
            بوابات الأكاديمية
          </span>

          <h2>
            اختر بوابتك إلى
            أكاديمية لغتي
          </h2>

          <p>
            وصول سريع وواضح لكل
            طالب وولي أمر ومعلم.
          </p>
        </div>

        <div className="academy-gates-layout">
          <Link
            href="/login"
            className="academy-gate academy-gate--featured student-gate"
          >
            <span className="academy-gate-icon">
              🎒
            </span>

            <div className="academy-gate-content">
              <span className="academy-gate-label">
                بوابة الطالب
              </span>

              <h3>
                ابدأ رحلتك
                التعليمية
              </h3>

              <p>
                تابع خطتك وواجباتك
                ودروسك وإنجازاتك.
              </p>

              <span className="academy-gate-action">
                دخول الطالب
                <span aria-hidden="true">
                  ←
                </span>
              </span>
            </div>
          </Link>

          <div className="academy-gates-secondary">
            <Link
              href="/parent"
              className="academy-gate academy-gate--small parent-gate"
            >
              <span className="academy-gate-icon">
                🤝
              </span>

              <div className="academy-gate-content">
                <span className="academy-gate-label">
                  شريك النجاح
                </span>

                <h3>
                  دخول ولي الأمر
                </h3>

                <p>
                  تابع تقدم ابنك
                  واحتفِ بإنجازاته.
                </p>
              </div>

              <span
                className="academy-gate-arrow"
                aria-hidden="true"
              >
                ←
              </span>
            </Link>

            <Link
              href="/teacher-login"
              className="academy-gate academy-gate--small teacher-gate"
            >
              <span className="academy-gate-icon">
                👨‍🏫
              </span>

              <div className="academy-gate-content">
                <span className="academy-gate-label">
                  بوابة المعلم
                </span>

                <h3>
                  دخول المعلم
                </h3>

                <p>
                  إدارة الطلاب والدروس
                  والواجبات والأبطال.
                </p>
              </div>

              <span
                className="academy-gate-arrow"
                aria-hidden="true"
              >
                ←
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="sections-area">
        <div className="section-heading">
          <div>
            <span className="section-label">
              أقسام الأكاديمية
            </span>

            <h2>
              اختر رحلتك
              التعليمية
            </h2>
          </div>

          <p>
            اضغط على القسم الذي
            ترغب في البدء به
          </p>
        </div>

        <div className="sections-grid">
          {sections.map(
            (section) => (
              <Link
                href={
                  section.href
                }
                className={`academy-card ${section.className}`}
                key={
                  section.title
                }
              >
                <div className="card-icon">
                  {
                    section.icon
                  }
                </div>

                <div className="card-content">
                  <h3>
                    {
                      section.title
                    }
                  </h3>

                  <p>
                    {
                      section.description
                    }
                  </p>
                </div>

                <span className="card-arrow">
                  ←
                </span>
              </Link>
            )
          )}
        </div>
      </section>

      <section className="support-banner">
        <div className="support-icon">
          🌱
        </div>

        <div className="support-text">
          <span>
            زاوية مخصصة للتأسيس
          </span>

          <h2>
            هل تحتاج إلى مساعدة
            في القراءة؟
          </h2>

          <p>
            ابدأ رحلة الدعم من
            الحروف والأصوات، ثم
            انتقل إلى المقاطع
            والكلمات والجمل.
          </p>
        </div>

        <Link
          href="/support"
          className="support-button"
        >
          ابدأ رحلة الدعم
          <span> ←</span>
        </Link>
      </section>

      {/* الهوية الرسمية للأكاديمية */}

      <section
        style={{
          maxWidth:
            "1180px",
          margin:
            "14px auto 10px",
          padding:
            "12px 16px",
          borderRadius:
            "18px",
          background:
            "linear-gradient(135deg, #ffffff 0%, #eef9f4 100%)",
          border:
            "1px solid #d4eade",
          boxShadow:
            "0 8px 22px rgba(23, 108, 70, 0.06)",
        }}
      >
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: "12px",
            flexWrap:
              "wrap",
          }}
        >
          <div
            style={{
              width:
                "44px",
              height:
                "44px",
              borderRadius:
                "14px",
              background:
                "linear-gradient(135deg, #168a63, #0f7654)",
              color:
                "white",
              display:
                "grid",
              placeItems:
                "center",
              fontSize:
                "23px",
              flexShrink:
                0,
            }}
          >
            🏫
          </div>

          <div
            style={{
              flex: 1,
              minWidth:
                "220px",
            }}
          >
            <div
              style={{
                color:
                  "#168a63",
                fontSize:
                  "12px",
                fontWeight:
                  900,
                marginBottom:
                  "3px",
              }}
            >
              الهوية الرسمية
            </div>

            <h2
              style={{
                margin:
                  "0 0 4px",
                color:
                  "#174c3b",
                fontSize:
                  "clamp(16px, 2.2vw, 19px)",
                lineHeight:
                  1.5,
              }}
            >
              ابتدائية ومتوسطة زيد بن الخطاب والشهداء
            </h2>

            <div
              style={{
                display:
                  "flex",
                gap: "12px",
                flexWrap:
                  "wrap",
                alignItems:
                  "center",
                color:
                  "#64756d",
                fontSize:
                  "13px",
                lineHeight:
                  1.6,
              }}
            >
              <span>
                📍 محايل عسير
              </span>

              <span>
                👨‍🏫 بإشراف الأستاذ / إبراهيم أحمد
              </span>
            </div>

            <a
              href="mailto:t267707@asrb.moe.gov.sa"
              style={{
                display:
                  "inline-flex",
                alignItems:
                  "center",
                gap: "6px",
                marginTop:
                  "5px",
                color:
                  "#126b49",
                textDecoration:
                  "none",
                fontWeight:
                  900,
                fontSize:
                  "13px",
                direction:
                  "ltr",
              }}
            >
              ✉️ t267707@asrb.moe.gov.sa
            </a>
          </div>

          <div
            style={{
              padding:
                "7px 11px",
              borderRadius:
                "999px",
              background:
                "#fff7d6",
              color:
                "#8a6500",
              fontWeight:
                900,
              fontSize:
                "13px",
              whiteSpace:
                "nowrap",
            }}
          >
            📚 نتعلّم… نقرأ… نبدع
          </div>
        </div>
      </section>

      <footer className="academy-footer">
        <span>
          أكاديمية لغتي الرقمية © 2026
        </span>
      </footer>
    </main>
  );
}