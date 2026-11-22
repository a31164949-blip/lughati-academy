"use client";
import AcademyWelcome from "./components/AcademyWelcome";
import ExternalGradeJoinCard from "./components/ExternalGradeJoinCard";
import { auth } from "../firebase";

import NationalIdentity from "./components/NationalIdentity";
import WeeklyGames from "./components/WeeklyGames";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import HomeworkReminder from "./components/HomeworkReminder";
import AcademicJourney from "./components/AcademicJourney";
import InstallAppButton from "./components/InstallAppButton";
import TikTokShowcase from "./components/TikTokShowcase";
import AcademyStories from "./components/AcademyStories";
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
    | "classHero"
    | "academyAchievement"
    | "academyProgress";
};
type DayMessage = {
  show: boolean;
  title: string;
  message: string;
  icon: string;
};

type AcademyMilestone = {
  id: string;
  title: string;
  badgeTitle: string;
  studentName: string;
  pointsReached: number;
  boardVisible: boolean;
  boardStartDate: string;
  boardEndDate: string;
  createdAtMilliseconds: number;
};

type AcademyBoardCategory =
  | "announcement"
  | "event"
  | "competition";

type AcademyBoardManualSlide = {
  id: string;
  title: string;
  message: string;
  category: AcademyBoardCategory;
  icon: string;
  visible: boolean;
  startDate: string;
  endDate: string;
  createdAtMilliseconds: number;
};

type AcademyBoardSettings = {
  enabled: boolean;
  intervalSeconds: number;
  tickerEnabled: boolean;
  tickerText: string;
};

type WeeklyEngagementStudent = {
  rank: number;
  studentId: string;
  studentName: string;
  score: number;
  readings: number;
  homeworks: number;
  galleryWorks: number;
  movement: number;
};

type PointsChampion = {
  studentId: string;
  studentName: string;
  points: number;
};

type WeeklyEngagementCache = {
  displayActive: boolean;
  weekStart: string;
  rankings: Array<{
    rank?: number;
    studentId?: string;
    studentName?: string;
    score?: number;
  }>;
  pointsChampion: PointsChampion | null;
};

type AcademyBoardDisplaySlide =
  | {
      id: string;
      kind: "engagement";
      icon: string;
      eyebrow: string;
      title: string;
      message: string;
      rankings: WeeklyEngagementStudent[];
    }
  | {
      id: string;
      kind: "milestone";
      icon: string;
      eyebrow: string;
      title: string;
      message: string;
      points: number;
    }
  | {
      id: string;
      kind: "manual";
      icon: string;
      eyebrow: string;
      title: string;
      message: string;
      category: AcademyBoardCategory;
    };

const defaultAcademyBoardSettings: AcademyBoardSettings = {
  enabled: true,
  intervalSeconds: 6,
  tickerEnabled: true,
  tickerText:
    "🌟 كل إنجاز جديد يكتب اسمًا جديدًا في تاريخ أكاديمية لغتي",
};

function getPublicStudentName(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

function getMilestoneIcon(pointsReached: number) {
  if (pointsReached >= 1000) return "🚀";
  if (pointsReached >= 500) return "🏰";
  if (pointsReached >= 250) return "💎";
  if (pointsReached >= 100) return "👑";
  if (pointsReached >= 50) return "🥇";
  if (pointsReached >= 25) return "🌟";
  if (pointsReached >= 10) return "⭐";
  return "🏆";
}

const sections: AcademySection[] = [
  {
    icon: "📖",
    title: "الفهم القرائي",
    description:
      "نصوص وقصص وأسئلة لتنمية الفهم",
    href: "/reading",
    className: "purple-card",
  },
  {
    icon: "🎯",
    title: "تحديد المستوى القرائي",
    description:
      "اختبار قصير يعرفك بمهاراتك القرائية ويقترح خطوتك التالية",
    href: "/reading-level",
    className: "gold-card",
  },
  {
    icon: "🏆",
    title: "تحدّي الأكاديمية",
    description:
      "تحديات إثرائية في الفهم والمفردات وترتيب الأحداث للقراء المتميزين",
    href: "/academy-challenge",
    className: "gold-card",
  },
  {
    icon: "🎮",
    title: "الألعاب التعليمية",
    description:
      "تعلّم والعب واكسب النجوم",
    href: "/games",
    className: "orange-card",
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


const PUBLIC_API_CACHE_MS = 10 * 60 * 1000;

type PublicApiCacheEntry<T> = {
  cachedAt: number;
  data: T;
};

function readPublicApiCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PublicApiCacheEntry<T>;

    if (
      typeof parsed.cachedAt !== "number" ||
      Date.now() - parsed.cachedAt >= PUBLIC_API_CACHE_MS
    ) {
      sessionStorage.removeItem(key);
      return null;
    }

    return parsed.data ?? null;
  } catch {
    return null;
  }
}

function writePublicApiCache<T>(key: string, data: T) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        cachedAt: Date.now(),
        data,
      })
    );
  } catch {
    // التخزين المؤقت اختياري.
  }
}

function isWeeklyEngagementDisplayActive() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Riyadh",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );
  const minutes =
    Number(values.hour || 0) * 60 + Number(values.minute || 0);

  if (values.weekday === "Thu") return minutes >= 12 * 60;
  if (values.weekday === "Fri") return true;
  if (values.weekday === "Sat") return minutes < 12 * 60;
  return false;
}

function getCurrentRiyadhWeekStart() {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [year, month, day] = dateKey.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const start = new Date(
    Date.UTC(year, month - 1, day - noonUtc.getUTCDay(), 12, 0, 0)
  );

  return start.toISOString().slice(0, 10);
}

const ANNOUNCEMENTS_CACHE_KEY =
  "academy-home-public-announcements-v1";

const ACADEMY_BOARD_CACHE_KEY =
  "academy-home-public-board-v1";

const WEEKLY_ENGAGEMENT_CACHE_KEY =
  "academy-home-weekly-engagement-v3-week-history";

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

  const [
    academyMilestones,
    setAcademyMilestones,
  ] = useState<AcademyMilestone[]>([]);

  const [
    academyBoardManualSlides,
    setAcademyBoardManualSlides,
  ] = useState<AcademyBoardManualSlide[]>([]);

  const [
    academyBoardSettings,
    setAcademyBoardSettings,
  ] = useState<AcademyBoardSettings>(
    defaultAcademyBoardSettings
  );

  const [
    activeBoardSlideIndex,
    setActiveBoardSlideIndex,
  ] = useState(0);

  const [
    weeklyEngagement,
    setWeeklyEngagement,
  ] = useState<WeeklyEngagementStudent[]>([]);

  const [
    pointsChampion,
    setPointsChampion,
  ] = useState<PointsChampion | null>(null);

  const previousEngagementRanks =
    useRef<Map<string, number>>(new Map());

  const boardTouchStartX =
    useRef<number | null>(null);



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

  // Removed public homepage announcements, honors and weekly rankings to avoid unnecessary Firestore reads.

  /*
   * التاريخ.
   */
  /*
   * تدوير اللوحة الرقمية يُدار بعد دمج
   * الإنجازات والإعلانات في قائمة واحدة.
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
      classHero: 0,
      academyAchievement: 1,
      academyProgress: 2,
    };

    return (
      order[a.weeklyTrack] -
      order[b.weeklyTrack]
    );
  });

  const academyBoardSlides:
    AcademyBoardDisplaySlide[] = [
      ...academyBoardManualSlides.map(
        (slide) => ({
          id: `manual-${slide.id}`,
          kind: "manual" as const,
          icon: slide.icon,
          eyebrow:
            slide.category === "event"
              ? "فعالية جديدة"
              : slide.category ===
                "competition"
              ? "مسابقة جديدة"
              : "إعلان الأكاديمية",
          title: slide.title,
          message: slide.message,
          category: slide.category,
        })
      ),
    ];

  return (
    <main
      className="academy-page"
      dir="rtl"
    >
      <NationalIdentity />
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

      {/* الهوية الرسمية لأكاديمية لغتي الرقمية */}

      <style>{`
        .academy-identity-header {
          max-width: 1180px;
          margin: 8px auto 18px;
          padding: 26px 30px;
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) auto auto;
          align-items: center;
          gap: 28px;
          position: relative;
          overflow: hidden;
          border-radius: 34px;
          border: 1px solid rgba(234, 179, 8, 0.18);
          background:
            radial-gradient(circle at 92% 18%, rgba(34,197,94,.10), transparent 27%),
            radial-gradient(circle at 12% 84%, rgba(250,204,21,.08), transparent 25%),
            linear-gradient(135deg, rgba(255,255,255,.98), rgba(250,255,251,.96));
          box-shadow: 0 18px 46px rgba(15, 118, 72, 0.10);
        }

        .academy-identity-header::after {
          content: "";
          position: absolute;
          inset: auto -80px -95px auto;
          width: 310px;
          height: 190px;
          border-radius: 50%;
          background: rgba(34,197,94,.055);
          transform: rotate(-12deg);
          pointer-events: none;
        }

        .academy-brand-pro {
          display: flex;
          align-items: center;
          gap: 24px;
          min-width: 0;
          position: relative;
          z-index: 1;
        }

        .academy-logo-pro {
          width: clamp(126px, 10vw, 158px);
          height: clamp(126px, 10vw, 158px);
          flex: 0 0 auto;
          padding: 5px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(145deg, #16a34a 0%, #22c55e 48%, #facc15 100%);
          box-shadow:
            0 17px 36px rgba(15,118,72,.20),
            0 0 0 6px rgba(255,255,255,.78);
        }

        .academy-logo-pro img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          border-radius: 50%;
          border: 3px solid rgba(255,255,255,.95);
          background: #fff;
        }

        .academy-brand-copy {
          min-width: 0;
        }

        .academy-brand-copy .brand-label {
          margin-bottom: 7px;
          color: rgba(21, 94, 69, .58);
          font-weight: 800;
          letter-spacing: .1px;
        }

        .academy-brand-copy h1 {
          margin: 0;
          color: #104c39;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1.18;
          font-weight: 900;
          text-shadow: 0 2px 0 rgba(250,204,21,.18);
        }

        .academy-brand-copy .slogan {
          margin-top: 13px;
          color: #15945f;
          font-size: clamp(17px, 2vw, 22px);
          font-weight: 900;
        }

        .academy-symbolic-date {
          min-width: 165px;
          padding: 12px 16px 10px;
          position: relative;
          z-index: 1;
          border-radius: 24px;
          text-align: center;
          background:
            linear-gradient(135deg, rgba(236,253,245,.33), rgba(255,251,235,.20));
          border: 1px solid rgba(34,197,94,.10);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.60),
            0 8px 22px rgba(22,101,52,.035);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .academy-symbolic-date::before,
        .academy-symbolic-date::after {
          content: "🌿";
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          font-size: 18px;
          opacity: .20;
          filter: saturate(.65);
        }

        .academy-symbolic-date::before {
          right: -12px;
        }

        .academy-symbolic-date::after {
          left: -12px;
          transform: translateY(-50%) scaleX(-1);
        }

        .academy-date-icon {
          display: block;
          margin-bottom: 3px;
          font-size: 20px;
          opacity: .30;
        }

        .academy-date-value {
          display: inline-block;
          direction: ltr;
          unicode-bidi: isolate;
          color: rgba(21, 128, 84, .42);
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 1.4px;
        }

        .academy-date-line {
          width: 74px;
          height: 2px;
          margin: 8px auto 0;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(234,179,8,.34),
            transparent
          );
        }

        .academy-identity-points {
          position: relative;
          z-index: 1;
        }

        @media (max-width: 900px) {
          .academy-identity-header {
            grid-template-columns: 1fr auto;
            padding: 22px;
          }

          .academy-symbolic-date {
            grid-column: 1 / -1;
            justify-self: center;
            order: 3;
            min-width: 150px;
            padding: 9px 14px 8px;
          }
        }

        @media (max-width: 650px) {
          .academy-identity-header {
            grid-template-columns: 1fr;
            gap: 18px;
            margin-left: 12px;
            margin-right: 12px;
            padding: 22px 16px;
            text-align: center;
          }

          .academy-brand-pro {
            flex-direction: column;
            gap: 15px;
          }

          .academy-brand-copy {
            text-align: center;
          }

          .academy-identity-points {
            justify-self: center;
          }

          .academy-symbolic-date {
            grid-column: auto;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .academy-logo-pro {
            transition: none;
          }
        }
      `}</style>

      <header className="academy-header academy-identity-header">
        <div className="brand academy-brand-pro">
          <div className="academy-logo-pro">
            <img
              src="/الشعار.jpeg"
              alt="شعار أكاديمية لغتي الرقمية"
              width={158}
              height={158}
              loading="eager"
            />
          </div>

          <div className="academy-brand-copy">
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

        <div
          className="academy-symbolic-date"
          aria-label="تاريخ تأسيس أكاديمية لغتي الرقمية 1 نوفمبر 2020"
        >
          <span
            className="academy-date-icon"
            aria-hidden="true"
          >
            ◫
          </span>

          <span className="academy-date-value">
            1 / 11 / 2020
          </span>

          <div
            className="academy-date-line"
            aria-hidden="true"
          />
        </div>

        <div className="student-points academy-identity-points">
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

      <AcademyWelcome />

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
          <InstallAppButton />
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

      <AcademyStories />

{/* أبطال الأكاديمية — بطل النقاط وبطل التعلّم الأسبوعي وأفضل خمسة */}
<ExternalGradeJoinCard />



      <AcademicJourney
        events={
          academicJourneyEvents
        }
      />





      <WeeklyGames />



      <TikTokShowcase />

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
