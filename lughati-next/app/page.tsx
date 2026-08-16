"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase";

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
    icon: "📤",
    title: "ارفع عملك",
    description:
      "أرسل صورة أو تسجيلًا صوتيًا أو مقطع فيديو لمعلمك",
    href: "/upload",
    className: "teal-card",
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
    icon: "✏️",
    title: "الواجبات",
    description:
      "شاهد واجباتك اليومية وأنجزها",
    href: "/homework",
    className: "yellow-card",
  },
  {
    icon: "🏫",
    title: "جسر مدرستي",
    description:
      "أنجز واجبك في مدرستي ثم عد للأكاديمية",
    href: "/madrasati-bridge",
    className: "green-card",
  },
  {
    icon: "🗓️",
    title: "الخطة الأسبوعية",
    description:
      "اطّلع على خطة التعلم لهذا الأسبوع",
    href: "/login",
    className: "pink-card",
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

  const [announcements, setAnnouncements] =
    useState<AcademyAnnouncement[]>([]);

  const [
    announcementsLoading,
    setAnnouncementsLoading,
  ] = useState(true);

  const [heroes, setHeroes] =
    useState<AcademyHero[]>([]);

  const [heroIndex, setHeroIndex] =
    useState(0);

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

        const data =
          await response.json();

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
        setAnnouncementsLoading(false);
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
            .map((document) => {
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
              } satisfies AcademyHero;
            })
            .filter(
              (hero) =>
                hero.published &&
                hero.photoConsent
            );

        setHeroes(loadedHeroes);
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
   * تدوير بطاقة الأبطال.
   */
  useEffect(() => {
    if (heroes.length <= 1) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setHeroIndex(
          (current) =>
            current + 1 >=
            heroes.length
              ? 0
              : current + 1
        );
      }, 6000);

    return () =>
      window.clearInterval(timer);
  }, [heroes.length]);

  /*
   * التاريخ.
   */
  useEffect(() => {
  const updateToday = () => {
    const formattedDate =
      new Intl.DateTimeFormat(
        "ar-SA",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Riyadh",
        }
      ).format(new Date());

    setToday(formattedDate);
  };

  updateToday();
}, []);

  function getAnnouncementPreview(
    message: string
  ) {
    const firstLine = message
      .split("\n")
      .map((line) =>
        line.trim()
      )
      .find(Boolean);

    return firstLine || "";
  }

  const featuredHero =
    heroes.length > 0
      ? heroes[
          Math.min(
            heroIndex,
            heroes.length - 1
          )
        ]
      : null;

  return (
    <main
      className="academy-page"
      dir="rtl"
    >
      <HomeworkReminder />

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
          maxWidth: "1180px",
          margin:
            "24px auto 18px",
          padding:
            "18px 22px",
          borderRadius: "26px",
          background:
            "linear-gradient(135deg, #158057, #20a06d)",
          color: "white",
          boxShadow:
            "0 12px 30px rgba(25, 120, 80, 0.16)",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "18px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "20px",
              background:
                "rgba(255,255,255,0.15)",
              display: "grid",
              placeItems: "center",
              fontSize: "38px",
              flexShrink: 0,
            }}
          >
            🧒🏻
          </div>

          <div>
            <div
              style={{
                fontSize:
                  "clamp(22px, 3vw, 31px)",
                fontWeight: 900,
              }}
            >
              السلام عليكم يا بطل 👋
            </div>

            <p
              style={{
                margin:
                  "5px 0 0",
                opacity: 0.9,
                lineHeight: 1.6,
              }}
            >
              فارس معك… جاهز
              لإنجاز جديد اليوم؟
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              opacity: 0.9,
            }}
          >
            {today ? (
  <>🗓️ {today}</>
) : (
  <>🗓️ اليوم</>
)}
          </span>

          <Link
            href="/login"
            style={{
              background:
                "white",
              color: "#126846",
              textDecoration:
                "none",
              padding:
                "12px 18px",
              borderRadius:
                "15px",
              fontWeight: 900,
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

      {/* بطاقة الأبطال المختصرة */}

      <section
        style={{
          maxWidth: "1180px",
          margin:
            "18px auto",
          border:
            "1px solid #dcece4",
          borderRadius: "24px",
          background:
            "linear-gradient(135deg, #ffffff, #f7fff9)",
          boxShadow:
            "0 8px 24px rgba(30, 90, 60, 0.08)",
          padding:
            "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        {featuredHero ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: "13px",
              }}
            >
              {featuredHero.imageUrl ? (
                <img
                  src={
                    featuredHero.imageUrl
                  }
                  alt=""
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius:
                      "18px",
                    objectFit:
                      "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width:
                      "60px",
                    height:
                      "60px",
                    borderRadius:
                      "18px",
                    background:
                      "#e5f8ed",
                    display:
                      "grid",
                    placeItems:
                      "center",
                    fontSize:
                      "32px",
                  }}
                >
                  🌟
                </div>
              )}

              <div>
                <small
                  style={{
                    color:
                      "#7a6500",
                    fontWeight:
                      800,
                  }}
                >
                  🌟 بطل الأكاديمية
                </small>

                <div
                  style={{
                    marginTop:
                      "3px",
                    fontSize:
                      "19px",
                    fontWeight:
                      900,
                    color:
                      "#174c36",
                  }}
                >
                  {
                    featuredHero.studentFirstName
                  }
                  {" — "}
                  {
                    featuredHero.title
                  }
                </div>

                <div
                  style={{
                    marginTop:
                      "3px",
                    color:
                      "#68776f",
                    fontSize:
                      "14px",
                  }}
                >
                  ⭐{" "}
                  {
                    featuredHero.achievementsCount
                  }{" "}
                  إنجازًا
                  {featuredHero.badge
                    ? ` • ${featuredHero.badge}`
                    : ""}
                </div>
              </div>
            </div>

            <Link
              href="/heroes"
              style={{
                textDecoration:
                  "none",
                color: "#14744d",
                fontWeight: 900,
                background:
                  "#eaf9f0",
                padding:
                  "10px 15px",
                borderRadius:
                  "14px",
              }}
            >
              شاهد جميع الأبطال ←
            </Link>
          </>
        ) : (
          <>
            <div>
              <strong
                style={{
                  display:
                    "block",
                  color:
                    "#176c46",
                  fontSize:
                    "18px",
                }}
              >
                🌟 أبطال أكاديمية
                لغتي
              </strong>

              <span
                style={{
                  display:
                    "block",
                  marginTop:
                    "4px",
                  color:
                    "#6f7f76",
                }}
              >
                قريبًا نحتفي هنا
                بإنجازات أبطالنا ✨
              </span>
            </div>

            <Link
              href="/heroes"
              style={{
                textDecoration:
                  "none",
                color: "#14744d",
                fontWeight: 900,
              }}
            >
              اكتشف ركن الأبطال ←
            </Link>
          </>
        )}
      </section>

      <AcademicJourney
        events={
          academicJourneyEvents
        }
      />

      <ClassDiary />

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

      <section className="quick-plan">
        <div>
          <span className="section-label">
            خطتي اليوم
          </span>

          <h2>
            خطوات صغيرة… وإنجاز
            كبير
          </h2>
        </div>

        <div className="plan-items">
          <div className="plan-item">
            <span>1</span>
            <p>أقرأ درسي</p>
          </div>

          <div className="plan-line" />

          <div className="plan-item">
            <span>2</span>
            <p>أتدرّب</p>
          </div>

          <div className="plan-line" />

          <div className="plan-item">
            <span>3</span>
            <p>ألعب وأتحدى</p>
          </div>

          <div className="plan-line" />

          <div className="plan-item">
            <span>4</span>
            <p>أكسب النجوم</p>
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
    maxWidth: "1180px",
    margin: "14px auto 10px",
    padding: "12px 16px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, #ffffff 0%, #eef9f4 100%)",
    border: "1px solid #d4eade",
    boxShadow:
      "0 8px 22px rgba(23, 108, 70, 0.06)",
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    }}
  >
    <div
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "14px",
        background:
          "linear-gradient(135deg, #168a63, #0f7654)",
        color: "white",
        display: "grid",
        placeItems: "center",
        fontSize: "23px",
        flexShrink: 0,
      }}
    >
      🏫
    </div>

    <div
      style={{
        flex: 1,
        minWidth: "220px",
      }}
    >
      <div
        style={{
          color: "#168a63",
          fontSize: "12px",
          fontWeight: 900,
          marginBottom: "3px",
        }}
      >
        الهوية الرسمية
      </div>

      <h2
        style={{
          margin: "0 0 4px",
          color: "#174c3b",
          fontSize:
            "clamp(16px, 2.2vw, 19px)",
          lineHeight: 1.5,
        }}
      >
        ابتدائية ومتوسطة زيد بن الخطاب والشهداء
      </h2>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          color: "#64756d",
          fontSize: "13px",
          lineHeight: 1.6,
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
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "5px",
          color: "#126b49",
          textDecoration: "none",
          fontWeight: 900,
          fontSize: "13px",
          direction: "ltr",
        }}
      >
        ✉️ t267707@asrb.moe.gov.sa
      </a>
    </div>

    <div
      style={{
        padding: "7px 11px",
        borderRadius: "999px",
        background: "#fff7d6",
        color: "#8a6500",
        fontWeight: 900,
        fontSize: "13px",
        whiteSpace: "nowrap",
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