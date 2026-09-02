"use client";

import WeeklyGames from "./components/WeeklyGames";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import WeeklyPicks from "./components/WeeklyPicks";
import HomeworkReminder from "./components/HomeworkReminder";
import AcademicJourney from "./components/AcademicJourney";
import ClassDiary from "./components/ClassDiary";
import InstallAppButton from "./components/InstallAppButton";
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
  movement: number;
};

type PointsChampion = {
  studentId: string;
  studentName: string;
  points: number;
};

type WeeklyEngagementCache = {
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

const ANNOUNCEMENTS_CACHE_KEY =
  "academy-home-public-announcements-v1";

const ACADEMY_BOARD_CACHE_KEY =
  "academy-home-public-board-v1";

const WEEKLY_ENGAGEMENT_CACHE_KEY =
  "academy-home-weekly-engagement-v1";

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

  /*
  /*
 * تحميل الإعلانات.
 */
useEffect(() => {
  let active = true;

  async function loadAnnouncements() {
    try {
      setAnnouncementsLoading(true);

      const cached =
        readPublicApiCache<AcademyAnnouncement[]>(
          ANNOUNCEMENTS_CACHE_KEY
        );

      if (cached) {
        if (active) {
          setAnnouncements(cached);
        }
        return;
      }

      const response = await fetch(
        "/api/public-announcements",
        {
          method: "GET",
          cache: "default",
        }
      );

      const responseText =
        await response.text();

      if (!responseText.trim()) {
        if (active) {
          setAnnouncements([]);
        }
        return;
      }

      let data: {
        success?: boolean;
        announcements?: AcademyAnnouncement[];
      };

      try {
        data = JSON.parse(responseText);
      } catch {
        if (active) {
          setAnnouncements([]);
        }
        return;
      }

      if (!response.ok || !data.success) {
        if (active) {
          setAnnouncements([]);
        }
        return;
      }

      const rows =
        Array.isArray(data.announcements)
          ? data.announcements
          : [];

      writePublicApiCache(
        ANNOUNCEMENTS_CACHE_KEY,
        rows
      );

      if (active) {
        setAnnouncements(rows);
      }
    } catch (error) {
      console.warn(
        "تعذر تحميل نبض الأكاديمية:",
        error
      );

      if (active) {
        setAnnouncements([]);
      }
    } finally {
      if (active) {
        setAnnouncementsLoading(false);
      }
    }
  }

  void loadAnnouncements();

  return () => {
    active = false;
  };
}, []);
  /*
   * تحميل لوحة الأكاديمية العامة من API آمن.
   * يمنع القراءة المباشرة من Firestore للزوار.
   */
  useEffect(() => {
  let active = true;

  function applyBoardData(data: {
    settings?: AcademyBoardSettings;
    slides?: AcademyBoardManualSlide[];
    milestones?: AcademyMilestone[];
    heroes?: AcademyHero[];
  }) {
    if (!active) return;

    setAcademyBoardSettings(
      data.settings &&
      typeof data.settings === "object"
        ? {
            enabled:
              data.settings.enabled !== false,
            intervalSeconds:
              typeof data.settings.intervalSeconds ===
                "number" &&
              data.settings.intervalSeconds >= 3
                ? Math.min(
                    30,
                    data.settings.intervalSeconds
                  )
                : defaultAcademyBoardSettings.intervalSeconds,
            tickerEnabled:
              data.settings.tickerEnabled !== false,
            tickerText:
              typeof data.settings.tickerText ===
                "string" &&
              data.settings.tickerText.trim()
                ? data.settings.tickerText
                : defaultAcademyBoardSettings.tickerText,
          }
        : defaultAcademyBoardSettings
    );

    setAcademyBoardManualSlides(
      Array.isArray(data.slides)
        ? data.slides
        : []
    );

    setAcademyMilestones(
      Array.isArray(data.milestones)
        ? data.milestones
        : []
    );

    setHeroes(
      Array.isArray(data.heroes)
        ? data.heroes
        : []
    );
  }

  async function loadPublicAcademyBoard() {
    try {
      const cached =
        readPublicApiCache<{
          settings?: AcademyBoardSettings;
          slides?: AcademyBoardManualSlide[];
          milestones?: AcademyMilestone[];
          heroes?: AcademyHero[];
        }>(
          ACADEMY_BOARD_CACHE_KEY
        );

      if (cached) {
        applyBoardData(cached);
        return;
      }

      const response = await fetch(
        "/api/public-academy-board",
        {
          method: "GET",
          cache: "default",
        }
      );

      const responseText =
        await response.text();

      if (!responseText.trim()) {
        return;
      }

      let data: {
        success?: boolean;
        settings?: AcademyBoardSettings;
        slides?: AcademyBoardManualSlide[];
        milestones?: AcademyMilestone[];
        heroes?: AcademyHero[];
      };

      try {
        data = JSON.parse(responseText);
      } catch {
        return;
      }

      if (!response.ok || !data.success) {
        return;
      }

      const cacheValue = {
        settings: data.settings,
        slides: data.slides,
        milestones: data.milestones,
        heroes: data.heroes,
      };

      writePublicApiCache(
        ACADEMY_BOARD_CACHE_KEY,
        cacheValue
      );

      applyBoardData(cacheValue);
    } catch (error) {
      console.warn(
        "تعذر تحميل لوحة الأكاديمية:",
        error
      );
    }
  }

  void loadPublicAcademyBoard();

  return () => {
    active = false;
  };
}, []);

  useEffect(() => {
  let cancelled = false;

  function normalizePointsChampion(
    value: unknown
  ): PointsChampion | null {
    if (
      !value ||
      typeof value !== "object"
    ) {
      return null;
    }

    const row =
      value as Partial<PointsChampion>;

    if (
      typeof row.studentId !== "string" ||
      typeof row.studentName !== "string" ||
      typeof row.points !== "number"
    ) {
      return null;
    }

    return {
      studentId: row.studentId,
      studentName: row.studentName,
      points: row.points,
    };
  }

  function applyWeeklyEngagement(
    rankings: Array<{
      rank?: number;
      studentId?: string;
      studentName?: string;
      score?: number;
    }>,
    champion: PointsChampion | null
  ) {
    if (cancelled) return;

    const oldRanks =
      previousEngagementRanks.current;

    const nextRows:
      WeeklyEngagementStudent[] =
      rankings.map((item) => {
        const rank =
          typeof item.rank === "number"
            ? item.rank
            : 0;

        const studentId =
          typeof item.studentId === "string"
            ? item.studentId
            : "";

        const previousRank =
          oldRanks.get(studentId);

        return {
          rank,
          studentId,
          studentName:
            typeof item.studentName === "string"
              ? item.studentName
              : "طالب الأكاديمية",
          score:
            typeof item.score === "number"
              ? item.score
              : 0,
          movement:
            typeof previousRank === "number"
              ? previousRank - rank
              : 0,
        };
      });

    previousEngagementRanks.current =
      new Map(
        nextRows.map((row) => [
          row.studentId,
          row.rank,
        ])
      );

    setWeeklyEngagement(nextRows);
    setPointsChampion(champion);
  }

  async function loadWeeklyEngagement(
    forceRefresh = false
  ) {
    try {
      if (!forceRefresh) {
        const cached =
          readPublicApiCache<
            WeeklyEngagementCache |
            Array<{
              rank?: number;
              studentId?: string;
              studentName?: string;
              score?: number;
            }>
          >(
            WEEKLY_ENGAGEMENT_CACHE_KEY
          );

        if (cached) {
          // دعم الكاش القديم حتى لا يتعطل أي مستخدم لديه نسخة سابقة.
          if (Array.isArray(cached)) {
            applyWeeklyEngagement(
              cached,
              null
            );
          } else {
            applyWeeklyEngagement(
              Array.isArray(cached.rankings)
                ? cached.rankings
                : [],
              normalizePointsChampion(
                cached.pointsChampion
              )
            );
          }

          return;
        }
      }

      const response = await fetch(
        "/api/public-weekly-engagement",
        {
          method: "GET",
          cache: "default",
        }
      );

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        rankings?: Array<{
          rank?: number;
          studentId?: string;
          studentName?: string;
          score?: number;
        }>;
        pointsChampion?: PointsChampion | null;
      } = {};

      if (responseText.trim()) {
        try {
          data = JSON.parse(
            responseText
          );
        } catch {
          return;
        }
      }

      if (
        !response.ok ||
        data.success !== true ||
        !Array.isArray(data.rankings)
      ) {
        return;
      }

      const champion =
        normalizePointsChampion(
          data.pointsChampion
        );

      writePublicApiCache(
        WEEKLY_ENGAGEMENT_CACHE_KEY,
        {
          rankings: data.rankings,
          pointsChampion: champion,
        } satisfies WeeklyEngagementCache
      );

      applyWeeklyEngagement(
        data.rankings,
        champion
      );
    } catch (error) {
      console.warn(
        "تعذر تحميل أبطال الأكاديمية هذا الأسبوع:",
        error
      );
    }
  }

  void loadWeeklyEngagement();

  return () => {
    cancelled = true;
  };
}, []);


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
      achievement: 0,
      progress: 1,
      commitment: 2,
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

  useEffect(() => {
    if (
      !academyBoardSettings.enabled ||
      academyBoardSlides.length <= 1
    ) {
      setActiveBoardSlideIndex(0);
      return;
    }

    setActiveBoardSlideIndex(
      (current) =>
        current >=
        academyBoardSlides.length
          ? 0
          : current
    );

    const timer =
      window.setInterval(() => {
        setActiveBoardSlideIndex(
          (current) =>
            (current + 1) %
            academyBoardSlides.length
        );
      },
      Math.max(
        3,
        academyBoardSettings.intervalSeconds
      ) * 1000
    );

    return () =>
      window.clearInterval(timer);
  }, [
    academyBoardSettings.enabled,
    academyBoardSettings.intervalSeconds,
    academyBoardSlides.length,
  ]);


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
{/* تنويه قناة التليجرام */}
      <section
        aria-label="تنويه قناة التليجرام"
        style={{
          maxWidth: "1180px",
          margin: "14px auto 18px",
          padding: "16px 18px",
          borderRadius: "22px",
          border: "1px solid #bae6fd",
          background:
            "linear-gradient(135deg, #effaff 0%, #f8fcff 100%)",
          boxShadow:
            "0 10px 26px rgba(14, 116, 144, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: 0,
            flex: "1 1 520px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "16px",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              background: "#229ED9",
              color: "#ffffff",
              fontSize: "25px",
              boxShadow:
                "0 8px 18px rgba(34, 158, 217, 0.22)",
            }}
          >
            ✈️
          </div>

          <div>
            <strong
              style={{
                display: "block",
                color: "#075985",
                fontSize: "16px",
                fontWeight: 900,
              }}
            >
              📢 تنويه مهم
            </strong>

            <p
              style={{
                margin: "4px 0 0",
                color: "#334155",
                fontSize: "14px",
                fontWeight: 800,
                lineHeight: 1.8,
              }}
            >
              أرجو الانضمام إلى قناتنا على التليجرام؛
              لضمان متابعة جميع المهام.
            </p>
          </div>
        </div>

        <a
          href="https://t.me/LughatiDigitalAcademy"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            padding: "11px 17px",
            borderRadius: "14px",
            background: "#229ED9",
            color: "#ffffff",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 900,
            whiteSpace: "nowrap",
            boxShadow:
              "0 8px 18px rgba(34, 158, 217, 0.2)",
          }}
        >
          📲 الانضمام إلى القناة
        </a>
      </section>


{/* أبطال الأكاديمية — بطل النقاط وبطل التفاعل وأفضل خمسة */}
{(pointsChampion || weeklyEngagement.length > 0) && (
  <section
    aria-label="أبطال الأكاديمية"
    className="academy-champions"
  >
    <style>{`
      @keyframes championsGlow {
        0%, 100% {
          opacity: .42;
          transform: scale(1);
        }
        50% {
          opacity: .72;
          transform: scale(1.08);
        }
      }

      @keyframes championCrownFloat {
        0%, 100% {
          transform: translateY(0) rotate(-3deg);
        }
        50% {
          transform: translateY(-5px) rotate(3deg);
        }
      }

      @keyframes championCardEnter {
        from {
          opacity: 0;
          transform: translateY(12px) scale(.985);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .academy-champions {
        max-width: 1148px;
        margin: 20px auto 10px;
        padding: clamp(18px, 3vw, 28px);
        border-radius: 32px;
        position: relative;
        overflow: hidden;
        isolation: isolate;
        color: #ffffff;
        background:
          radial-gradient(circle at 12% 10%, rgba(250,204,21,.16), transparent 30%),
          radial-gradient(circle at 90% 85%, rgba(56,189,248,.12), transparent 28%),
          linear-gradient(135deg,#061813 0%,#0a2b22 48%,#123d31 100%);
        border: 1px solid rgba(250,204,21,.32);
        box-shadow:
          0 22px 54px rgba(5,46,34,.22),
          inset 0 1px 0 rgba(255,255,255,.08);
      }

      .academy-champions::before {
        content: "";
        position: absolute;
        width: 260px;
        height: 260px;
        border-radius: 50%;
        top: -145px;
        right: -75px;
        background:
          radial-gradient(circle,rgba(250,204,21,.22),rgba(250,204,21,0) 70%);
        animation: championsGlow 5s ease-in-out infinite;
        pointer-events: none;
        z-index: -1;
      }

      .academy-champion-spotlights {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 14px;
      }

      .academy-champion-card {
        min-width: 0;
        border-radius: 22px;
        padding: 18px;
        position: relative;
        overflow: hidden;
        animation: championCardEnter .55s ease both;
      }

      .academy-champion-card--points {
        background:
          linear-gradient(135deg,rgba(250,204,21,.19),rgba(245,158,11,.08));
        border: 1px solid rgba(253,224,71,.34);
      }

      .academy-champion-card--engagement {
        background:
          linear-gradient(135deg,rgba(56,189,248,.17),rgba(14,165,233,.07));
        border: 1px solid rgba(125,211,252,.28);
      }

      .academy-champion-icon {
        width: 60px;
        height: 60px;
        border-radius: 19px;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        font-size: 34px;
        background: rgba(255,255,255,.10);
        border: 1px solid rgba(255,255,255,.13);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
      }

      .academy-champion-crown {
        display: inline-block;
        animation: championCrownFloat 2.4s ease-in-out infinite;
      }

      .academy-top-five-grid {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 9px 12px;
      }

      @media (max-width: 760px) {
        .academy-champion-spotlights,
        .academy-top-five-grid {
          grid-template-columns: 1fr;
        }

        .academy-champions {
          margin-left: 12px;
          margin-right: 12px;
          border-radius: 26px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .academy-champions::before,
        .academy-champion-card,
        .academy-champion-crown {
          animation: none !important;
        }
      }
    `}</style>

    <div
      style={{
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "18px",
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
              width: "56px",
              height: "56px",
              borderRadius: "18px",
              display: "grid",
              placeItems: "center",
              fontSize: "31px",
              color: "#5c4300",
              background:
                "linear-gradient(135deg,#fef3c7,#facc15)",
              border:
                "1px solid rgba(255,255,255,.4)",
              boxShadow:
                "0 9px 24px rgba(250,204,21,.18)",
              flexShrink: 0,
            }}
          >
            🏆
          </div>

          <div>
            <span
              style={{
                display: "block",
                color: "#fde68a",
                fontSize: "12px",
                fontWeight: 900,
                marginBottom: "3px",
                letterSpacing: ".2px",
              }}
            >
              ✨ تكريم أسبوعي
            </span>

            <strong
              style={{
                display: "block",
                fontSize:
                  "clamp(23px,4vw,36px)",
                lineHeight: 1.2,
                fontWeight: 900,
              }}
            >
              أبطال أكاديمية لغتي
            </strong>

            <span
              style={{
                display: "block",
                marginTop: "5px",
                color: "#d1fae5",
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              إنجاز • تفاعل • استمرار
            </span>
          </div>
        </div>

        <span
          style={{
            padding: "8px 12px",
            borderRadius: "999px",
            background:
              "rgba(250,204,21,.11)",
            border:
              "1px solid rgba(250,204,21,.24)",
            color: "#fde68a",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          الخميس 12 ظهرًا ← السبت 4 عصرًا
        </span>
      </div>

      <div className="academy-champion-spotlights">
        {pointsChampion && (
          <article
            className="academy-champion-card academy-champion-card--points"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div className="academy-champion-icon">
                <span className="academy-champion-crown">
                  👑
                </span>
              </div>

              <div
                style={{
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: "#fde68a",
                    fontSize: "11px",
                    fontWeight: 900,
                    marginBottom: "4px",
                  }}
                >
                  بطل النقاط
                </span>

                <strong
                  style={{
                    display: "block",
                    overflow: "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize:
                      "clamp(19px,3vw,27px)",
                    fontWeight: 900,
                  }}
                >
                  {pointsChampion.studentName}
                </strong>

                <span
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "6px",
                    marginTop: "8px",
                    padding:
                      "6px 10px",
                    borderRadius:
                      "999px",
                    background:
                      "rgba(250,204,21,.13)",
                    color: "#fef3c7",
                    fontSize: "12px",
                    fontWeight: 900,
                  }}
                >
                  ⭐ {pointsChampion.points} نقطة
                </span>
              </div>
            </div>
          </article>
        )}

        {weeklyEngagement[0] && (
          <article
            className="academy-champion-card academy-champion-card--engagement"
            style={{
              animationDelay: ".08s",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div className="academy-champion-icon">
                🔥
              </div>

              <div
                style={{
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: "#bae6fd",
                    fontSize: "11px",
                    fontWeight: 900,
                    marginBottom: "4px",
                  }}
                >
                  بطل التفاعل
                </span>

                <strong
                  style={{
                    display: "block",
                    overflow: "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize:
                      "clamp(19px,3vw,27px)",
                    fontWeight: 900,
                  }}
                >
                  {weeklyEngagement[0].studentName}
                </strong>

                <span
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "6px",
                    marginTop: "8px",
                    padding:
                      "6px 10px",
                    borderRadius:
                      "999px",
                    background:
                      "rgba(56,189,248,.13)",
                    color: "#e0f2fe",
                    fontSize: "12px",
                    fontWeight: 900,
                  }}
                >
                  ⚡ {weeklyEngagement[0].score} تفاعل
                </span>
              </div>
            </div>
          </article>
        )}
      </div>

      {pointsChampion &&
        weeklyEngagement[0] &&
        pointsChampion.studentId ===
          weeklyEngagement[0].studentId && (
          <div
            style={{
              margin: "12px 0 0",
              padding: "9px 12px",
              borderRadius: "14px",
              textAlign: "center",
              background:
                "rgba(255,255,255,.065)",
              border:
                "1px solid rgba(255,255,255,.09)",
              color: "#fef3c7",
              fontSize: "12px",
              fontWeight: 900,
            }}
          >
            🌟 بطل مميز هذا الأسبوع: جمع صدارة النقاط والتفاعل معًا!
          </div>
        )}

      {weeklyEngagement.length > 0 && (
        <div
          style={{
            marginTop: "18px",
            paddingTop: "17px",
            borderTop:
              "1px solid rgba(255,255,255,.09)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "11px",
            }}
          >
            <strong
              style={{
                fontSize: "15px",
                fontWeight: 900,
                color: "#ffffff",
              }}
            >
              🏅 قائمة الأكثر تفاعلًا
            </strong>

            <span
              style={{
                color: "#a7f3d0",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              أفضل خمسة أبطال هذا الأسبوع
            </span>
          </div>

          <div className="academy-top-five-grid">
            {weeklyEngagement
              .slice(0, 5)
              .map((row) => {
                const medal =
                  row.rank === 1
                    ? "🥇"
                    : row.rank === 2
                    ? "🥈"
                    : row.rank === 3
                    ? "🥉"
                    : row.rank === 4
                    ? "⭐"
                    : "🌟";

                return (
                  <div
                    key={row.studentId}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "44px minmax(0,1fr) auto",
                      alignItems:
                        "center",
                      gap: "9px",
                      minHeight: "50px",
                      padding: "8px 10px",
                      borderRadius:
                        "15px",
                      background:
                        row.rank <= 3
                          ? "rgba(255,255,255,.095)"
                          : "rgba(255,255,255,.055)",
                      border:
                        row.rank <= 3
                          ? "1px solid rgba(250,204,21,.16)"
                          : "1px solid rgba(255,255,255,.07)",
                    }}
                  >
                    <strong
                      style={{
                        textAlign:
                          "center",
                        fontSize:
                          row.rank <= 3
                            ? "21px"
                            : "18px",
                      }}
                    >
                      {medal}
                    </strong>

                    <span
                      style={{
                        minWidth: 0,
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                        whiteSpace:
                          "nowrap",
                        fontSize:
                          "13px",
                        fontWeight: 900,
                      }}
                    >
                      {row.studentName}
                    </span>

                    <span
                      style={{
                        minWidth:
                          "62px",
                        padding:
                          "6px 9px",
                        borderRadius:
                          "10px",
                        textAlign:
                          "center",
                        background:
                          "rgba(56,189,248,.11)",
                        color:
                          "#bae6fd",
                        fontSize:
                          "11px",
                        fontWeight: 900,
                      }}
                    >
                      {row.score} تفاعل
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <p
        style={{
          margin: "14px 0 0",
          textAlign: "center",
          color: "#a7f3d0",
          fontSize: "11px",
          fontWeight: 800,
          lineHeight: 1.7,
        }}
      >
        ✨ استمر في التعلم والإنجاز؛ فقد يكون اسمك بين أبطال الأسبوع القادم.
      </p>
    </div>
  </section>
)}

{/* لوحة الأكاديمية — لا تظهر إلا عند وجود إعلان أو فعالية أو مسابقة مهمة */}

{academyBoardSettings.enabled &&
  academyBoardSlides.length > 0 &&
  (() => {
    const activeSlide =
      academyBoardSlides[
        Math.min(
          activeBoardSlideIndex,
          academyBoardSlides.length - 1
        )
      ];

    const showPreviousSlide = () => {
      setActiveBoardSlideIndex(
        (current) =>
          current === 0
            ? academyBoardSlides.length - 1
            : current - 1
      );
    };

    const showNextSlide = () => {
      setActiveBoardSlideIndex(
        (current) =>
          (current + 1) %
          academyBoardSlides.length
      );
    };

    const isMilestone =
      activeSlide.kind === "milestone";

    const isEngagement =
      activeSlide.kind === "engagement";

    const accent =
      isMilestone
        ? "#facc15"
        : isEngagement
        ? "#38bdf8"
        : activeSlide.category === "event"
        ? "#34d399"
        : activeSlide.category ===
          "competition"
        ? "#fb923c"
        : "#60a5fa";

    const tickerLabel =
      isMilestone
        ? "خبر الإنجاز"
        : isEngagement
        ? "Top 5"
        : activeSlide.category === "event"
        ? "فعالية"
        : activeSlide.category ===
          "competition"
        ? "مسابقة"
        : "إعلان";

    return (
      <div
        style={{
          maxWidth: "1180px",
          margin: "16px auto 6px",
          padding: "0 16px",
        }}
      >
        <style>{`
          @keyframes academyBillboardEnter {
            0% {
              opacity: 0;
              transform: translateY(10px) scale(.985);
              filter: blur(3px);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          @keyframes academyBillboardGlow {
            0%, 100% {
              opacity: .42;
              transform: scale(1);
            }
            50% {
              opacity: .72;
              transform: scale(1.05);
            }
          }

          @keyframes academyTickerMove {
            from { transform: translateX(-8%); }
            to { transform: translateX(108%); }
          }

          @media (max-width: 620px) {
            .academy-firsts-slide {
              grid-template-columns:
                68px minmax(0,1fr) !important;
            }

            .academy-firsts-points {
              grid-column: 1 / -1;
              justify-self: stretch;
            }
          }

          @media (max-width: 760px) {
            .academy-engagement-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .academy-firsts-slide,
            .academy-firsts-glow,
            .academy-firsts-ticker {
              animation: none !important;
            }
          }
        `}</style>

        <section
          aria-label="لوحة إعلانات الأكاديمية الرقمية"
          onTouchStart={(event) => {
            boardTouchStartX.current =
              event.touches[0]?.clientX ??
              null;
          }}
          onTouchEnd={(event) => {
            const startX =
              boardTouchStartX.current;

            const endX =
              event.changedTouches[0]
                ?.clientX;

            boardTouchStartX.current =
              null;

            if (
              startX === null ||
              typeof endX !== "number"
            ) {
              return;
            }

            const distance =
              endX - startX;

            if (
              Math.abs(distance) < 45
            ) {
              return;
            }

            if (distance > 0) {
              showPreviousSlide();
            } else {
              showNextSlide();
            }
          }}
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "28px",
            border:
              "1px solid rgba(250,204,21,.38)",
            background:
              "linear-gradient(135deg,#071b16 0%,#0b2f25 42%,#123d31 72%,#071b16 100%)",
            boxShadow:
              "0 18px 44px rgba(5,46,34,.22), inset 0 1px 0 rgba(255,255,255,.08)",
            color: "#ffffff",
            minHeight: "300px",
            isolation: "isolate",
          }}
        >
          <div
            className="academy-firsts-glow"
            aria-hidden="true"
            style={{
              position: "absolute",
              width: "260px",
              height: "260px",
              borderRadius: "50%",
              background: `radial-gradient(circle,${accent}40 0%,${accent}00 70%)`,
              top: "-120px",
              right: "-70px",
              animation:
                "academyBillboardGlow 5s ease-in-out infinite",
              pointerEvents: "none",
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
              gap: "12px",
              padding:
                "16px 18px 8px",
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
                  width: "48px",
                  height: "48px",
                  borderRadius: "15px",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "27px",
                  color: "#5c4300",
                  background:
                    "linear-gradient(135deg,#fde68a,#facc15)",
                  border:
                    "1px solid rgba(255,255,255,.35)",
                  boxShadow:
                    "0 7px 20px rgba(250,204,21,.16)",
                  flexShrink: 0,
                }}
              >
                🏆
              </div>

              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize:
                      "clamp(17px,2.5vw,22px)",
                    fontWeight: 900,
                  }}
                >
                  لوحة إعلانات الأكاديمية
                </strong>

                <span
                  style={{
                    display: "block",
                    marginTop: "2px",
                    color: "#d1fae5",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  إعلانات مهمة • فعاليات • مسابقات
                </span>
              </div>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 11px",
                borderRadius: "999px",
                background:
                  "rgba(255,255,255,.08)",
                border:
                  "1px solid rgba(255,255,255,.12)",
                color: accent,
                fontSize: "11px",
                fontWeight: 900,
                whiteSpace: "nowrap",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: accent,
                  boxShadow: `0 0 0 4px ${accent}22`,
                }}
              />
              اللوحة المباشرة
            </div>
          </div>

          {isEngagement ? (
            <div
              key={activeSlide.id}
              className="academy-firsts-slide"
              style={{
                position: "relative",
                zIndex: 2,
                padding:
                  "clamp(16px,3vw,24px) clamp(16px,4vw,30px)",
                animation:
                  "academyBillboardEnter .55s ease both",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "14px",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      color: accent,
                      fontSize: "12px",
                      fontWeight: 900,
                      marginBottom: "4px",
                    }}
                  >
                    🔥 {activeSlide.eyebrow}
                  </span>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "clamp(22px,4vw,34px)",
                      fontWeight: 900,
                      color: "#ffffff",
                    }}
                  >
                    {activeSlide.title}
                  </strong>
                </div>

                <span
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "rgba(56,189,248,.12)",
                    border: "1px solid rgba(56,189,248,.28)",
                    color: "#bae6fd",
                    fontSize: "11px",
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  أبطال الأسبوع
                </span>
              </div>

              <div
                className="academy-engagement-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  gap: "8px 12px",
                }}
              >
                {activeSlide.rankings.map((row) => {
                  const medal =
                    row.rank === 1
                      ? "🥇"
                      : row.rank === 2
                      ? "🥈"
                      : row.rank === 3
                      ? "🥉"
                      : String(row.rank);

                  const movementAmount =
                    Math.abs(row.movement);

                  const movementUnit =
                    movementAmount === 1
                      ? "مركزًا"
                      : "مراكز";

                  const movementLabel =
                    row.movement > 0
                      ? `↑ صعد ${movementAmount} ${movementUnit}`
                      : row.movement < 0
                      ? `↓ تراجع ${movementAmount} ${movementUnit}`
                      : previousEngagementRanks.current.size > 0
                      ? "— ثابت"
                      : "—";

                  const movementColor =
                    row.movement > 0
                      ? "#86efac"
                      : row.movement < 0
                      ? "#fca5a5"
                      : "#94a3b8";

                  return (
                    <div
                      key={row.studentId}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "48px minmax(0,1fr) auto auto",
                        alignItems: "center",
                        gap: "9px",
                        minHeight: "46px",
                        padding: "7px 10px",
                        borderRadius: "14px",
                        background:
                          row.rank <= 3
                            ? "rgba(255,255,255,.105)"
                            : "rgba(255,255,255,.065)",
                        border:
                          row.rank <= 3
                            ? "1px solid rgba(250,204,21,.18)"
                            : "1px solid rgba(255,255,255,.08)",
                      }}
                    >
                      <strong
                        style={{
                          textAlign: "center",
                          color:
                            row.rank <= 3
                              ? "#fde68a"
                              : "#cbd5e1",
                          fontSize: row.rank <= 3 ? "19px" : "14px",
                          fontWeight: 900,
                        }}
                      >
                        {medal}
                      </strong>

                      <span
                        style={{
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: 900,
                        }}
                      >
                        {row.studentName}
                      </span>

                      <span
                        title="تغير المركز منذ آخر تحديث"
                        style={{
                          minWidth: "34px",
                          textAlign: "center",
                          color: movementColor,
                          fontSize: "11px",
                          fontWeight: 900,
                        }}
                      >
                        {movementLabel}
                      </span>

                      <span
                        style={{
                          minWidth: "54px",
                          padding: "5px 8px",
                          borderRadius: "10px",
                          textAlign: "center",
                          background: "rgba(56,189,248,.12)",
                          color: "#bae6fd",
                          fontSize: "11px",
                          fontWeight: 900,
                        }}
                      >
                        {row.score} تفاعل
                      </span>
                    </div>
                  );
                })}
              </div>

              <p
                style={{
                  margin: "12px 0 0",
                  color: "#a7f3d0",
                  fontSize: "11px",
                  fontWeight: 800,
                  lineHeight: 1.7,
                }}
              >
                يظهر أبطال الأسبوع من الخميس الساعة 12 ظهرًا حتى السبت الساعة 4 عصرًا.
              </p>
            </div>
          ) : (
            <div
              key={activeSlide.id}
              className="academy-firsts-slide"
              style={{
                position: "relative",
                zIndex: 2,
                minHeight: "176px",
                display: "grid",
                gridTemplateColumns:
                  isMilestone
                    ? "minmax(72px,100px) minmax(0,1fr) auto"
                    : "minmax(72px,100px) minmax(0,1fr)",
                alignItems: "center",
                gap:
                  "clamp(13px,3vw,24px)",
                padding:
                  "clamp(18px,3vw,26px) clamp(18px,4vw,34px)",
                animation:
                  "academyBillboardEnter .55s ease both",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width:
                    "clamp(72px,10vw,96px)",
                  height:
                    "clamp(72px,10vw,96px)",
                  borderRadius: "26px",
                  display: "grid",
                  placeItems: "center",
                  fontSize:
                    "clamp(38px,6vw,58px)",
                  background:
                    "linear-gradient(145deg,rgba(255,255,255,.14),rgba(255,255,255,.06))",
                  border:
                    "1px solid rgba(255,255,255,.16)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,.12), 0 12px 30px rgba(0,0,0,.14)",
                }}
              >
                {activeSlide.icon}
              </div>

              <div style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "6px",
                    color: accent,
                    fontSize: "12px",
                    fontWeight: 900,
                  }}
                >
                  ✨ {activeSlide.eyebrow}
                </span>

                <strong
                  style={{
                    display: "block",
                    color: "#ffffff",
                    fontSize:
                      isMilestone
                        ? "clamp(24px,5vw,42px)"
                        : "clamp(23px,4.5vw,38px)",
                    lineHeight: 1.25,
                    fontWeight: 900,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace:
                      isMilestone
                        ? "nowrap"
                        : "normal",
                    textShadow:
                      "0 3px 16px rgba(0,0,0,.18)",
                  }}
                >
                  {activeSlide.title}
                </strong>

                <div
                  style={{
                    marginTop: "8px",
                    color: "#d1fae5",
                    fontSize:
                      "clamp(13px,2.3vw,17px)",
                    lineHeight: 1.7,
                    fontWeight: 800,
                  }}
                >
                  {activeSlide.message}
                </div>
              </div>

              {activeSlide.kind ===
                "milestone" && (
                <div
                  className="academy-firsts-points"
                  style={{
                    minWidth: "78px",
                    padding: "12px 13px",
                    borderRadius: "20px",
                    textAlign: "center",
                    background:
                      "linear-gradient(145deg,#fff8d8,#fde68a)",
                    color: "#6b4d00",
                    border:
                      "1px solid rgba(255,255,255,.45)",
                    boxShadow:
                      "0 10px 25px rgba(250,204,21,.13)",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize:
                        "clamp(22px,4vw,32px)",
                      lineHeight: 1,
                      fontWeight: 900,
                    }}
                  >
                    {activeSlide.points}
                  </strong>

                  <span
                    style={{
                      display: "block",
                      marginTop: "5px",
                      fontSize: "10px",
                      fontWeight: 900,
                    }}
                  >
                    نقطة
                  </span>
                </div>
              )}
            </div>
          )}

          {academyBoardSlides.length >
            1 && (
            <div
              style={{
                position: "relative",
                zIndex: 3,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                gap: "8px",
                padding:
                  "0 16px 13px",
              }}
            >
              <button
                type="button"
                onClick={
                  showPreviousSlide
                }
                aria-label="الشريحة السابقة"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border:
                    "1px solid rgba(255,255,255,.16)",
                  background:
                    "rgba(255,255,255,.08)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: "17px",
                  fontWeight: 900,
                }}
              >
                ›
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  gap: "6px",
                  flex: 1,
                  flexWrap: "wrap",
                }}
              >
                {academyBoardSlides.map(
                  (slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() =>
                        setActiveBoardSlideIndex(
                          index
                        )
                      }
                      aria-label={`عرض الشريحة ${index + 1}`}
                      style={{
                        width:
                          index ===
                          activeBoardSlideIndex
                            ? "26px"
                            : "8px",
                        height: "8px",
                        borderRadius:
                          "999px",
                        border: 0,
                        padding: 0,
                        background:
                          index ===
                          activeBoardSlideIndex
                            ? accent
                            : "rgba(255,255,255,.28)",
                        cursor: "pointer",
                        transition:
                          "width .25s ease, background .25s ease",
                      }}
                    />
                  )
                )}
              </div>

              <button
                type="button"
                onClick={showNextSlide}
                aria-label="الشريحة التالية"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border:
                    "1px solid rgba(255,255,255,.16)",
                  background:
                    "rgba(255,255,255,.08)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: "17px",
                  fontWeight: 900,
                }}
              >
                ‹
              </button>
            </div>
          )}

          {academyBoardSettings
            .tickerEnabled && (
            <div
              style={{
                position: "relative",
                zIndex: 4,
                display: "grid",
                gridTemplateColumns:
                  "auto minmax(0,1fr)",
                alignItems: "center",
                minHeight: "38px",
                borderTop:
                  "1px solid rgba(255,255,255,.10)",
                background:
                  "rgba(0,0,0,.17)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  alignSelf: "stretch",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 13px",
                  background: accent,
                  color: "#17251f",
                  fontSize: "11px",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                }}
              >
                {tickerLabel}
              </div>

              <div
                style={{
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  direction: "ltr",
                }}
              >
                <span
                  className="academy-firsts-ticker"
                  style={{
                    display:
                      "inline-block",
                    minWidth: "100%",
                    padding: "0 18px",
                    color: "#ecfdf5",
                    fontSize: "11px",
                    fontWeight: 800,
                    direction: "rtl",
                    animation:
                      "academyTickerMove 13s linear infinite",
                  }}
                >
                  {academyBoardSettings
                    .tickerText}
                  &nbsp;&nbsp; ✦
                  &nbsp;&nbsp;
                  {activeSlide.eyebrow}
                  {" — "}
                  {activeSlide.title}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  })()}

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