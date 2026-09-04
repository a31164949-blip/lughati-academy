"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../../../firebase";

type WeeklyHeroTrack =
  | "classHero"
  | "academyAchievement"
  | "academyProgress";

type LegacyHeroCategory =
  | "reading"
  | "spelling"
  | "progress"
  | "commitment"
  | "creativity"
  | "notebook"
  | "achievement";

type StudentOption = {
  id: string;
  name: string;
  classroom: string;
  photoConsent: boolean;
};

type WeeklyStudentStats = {
  points: number;
  readingCount: number;
  spellingCount: number;
  achievementsCount: number;
  badgesCount: number;
  streak: number;
  highlights: string[];
};

type SavedHero = {
  id: string;
  studentId: string;
  studentFirstName: string;
  classroom: string;
  category: LegacyHeroCategory;
  weeklyTrack: WeeklyHeroTrack;
  weekKey: string;
  weekLabel: string;
  title: string;
  badge: string;
  imageUrl: string;
  achievementsCount: number;
  readingCount: number;
  spellingCount: number;
  photoConsent: boolean;
  published: boolean;
};

const weeklyTrackOptions: {
  key: WeeklyHeroTrack;
  label: string;
  icon: string;
  defaultTitle: string;
  defaultBadge: string;
  description: string;
}[] = [
  {
    key: "classHero",
    label: "بطل الفصل",
    icon: "🏫",
    defaultTitle: "بطل الفصل",
    defaultBadge: "بطل الفصل لهذا الأسبوع",
    description:
      "يختاره المعلم بناءً على المشاركة والتفاعل والقراءة والسلوك والتحسن داخل الفصل.",
  },
  {
    key: "academyAchievement",
    label: "بطل الإنجاز في الأكاديمية",
    icon: "🥇",
    defaultTitle: "بطل الإنجاز",
    defaultBadge: "بطل الإنجاز في الأكاديمية لهذا الأسبوع",
    description:
      "للطالب الأبرز في الإنجازات والنقاط والنشاط داخل الأكاديمية خلال الأسبوع.",
  },
  {
    key: "academyProgress",
    label: "بطل التطور والالتزام في الأكاديمية",
    icon: "🌱",
    defaultTitle: "بطل التطور والالتزام",
    defaultBadge: "بطل التطور والالتزام في الأكاديمية لهذا الأسبوع",
    description:
      "للطالب الذي أظهر تطورًا واضحًا والتزامًا مستمرًا بالتعلم والقراءة والمهام.",
  },
];

function firstNameOnly(
  fullName: string
) {
  const trimmed =
    fullName.trim();

  if (!trimmed) {
    return "بطل الأكاديمية";
  }

  return (
    trimmed.split(/\s+/)[0] ||
    trimmed
  );
}

function getLegacyCategory(
  value: unknown
): LegacyHeroCategory {
  if (
    value === "spelling" ||
    value === "progress" ||
    value === "commitment" ||
    value === "creativity" ||
    value === "notebook" ||
    value === "achievement"
  ) {
    return value;
  }

  return "reading";
}

function getWeeklyTrack(
  value: unknown,
  legacyCategory?: unknown
): WeeklyHeroTrack {
  if (
    value === "classHero" ||
    value === "academyAchievement" ||
    value === "academyProgress"
  ) {
    return value;
  }

  // توافق مع السجلات القديمة.
  if (
    value === "progress" ||
    value === "commitment" ||
    legacyCategory === "progress" ||
    legacyCategory === "commitment"
  ) {
    return "academyProgress";
  }

  return "academyAchievement";
}

function getRiyadhDateParts() {
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
    ).formatToParts(
      new Date()
    );

  const get = (
    type: Intl.DateTimeFormatPartTypes
  ) =>
    parts.find(
      (part) =>
        part.type === type
    )?.value ?? "";

  return {
    year:
      Number(get("year")),
    month:
      Number(get("month")),
    day:
      Number(get("day")),
    weekday:
      get("weekday"),
  };
}

function getCurrentWeekInfo() {
  const riyadh =
    getRiyadhDateParts();

  // أسبوع التكريم يبدأ السبت وينتهي الجمعة.
  // بذلك يمكن إعلان الأبطال يوم السبت وإبقاؤهم ظاهرين طوال الأسبوع.
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
    weekdayIndex[
      riyadh.weekday
    ] ?? 0;

  const currentUtc =
    new Date(
      Date.UTC(
        riyadh.year,
        riyadh.month - 1,
        riyadh.day
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

  const ymd = (
    date: Date
  ) =>
    [
      date.getUTCFullYear(),
      String(
        date.getUTCMonth() + 1
      ).padStart(2, "0"),
      String(
        date.getUTCDate()
      ).padStart(2, "0"),
    ].join("-");

  const arabicFormatter =
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
    label: `${arabicFormatter.format(
      start
    )} — ${arabicFormatter.format(
      end
    )}`,
  };
}

export default function TeacherHeroesPage() {
  const currentWeek =
    useMemo(
      () =>
        getCurrentWeekInfo(),
      []
    );

  const [
    students,
    setStudents,
  ] =
    useState<StudentOption[]>(
      []
    );

  const [
    savedHeroes,
    setSavedHeroes,
  ] =
    useState<SavedHero[]>(
      []
    );

  const [
    selectedStudentId,
    setSelectedStudentId,
  ] = useState("");

  const [
    weeklyTrack,
    setWeeklyTrack,
  ] =
    useState<WeeklyHeroTrack>(
      "classHero"
    );

  const [
    customTitle,
    setCustomTitle,
  ] =
    useState(
      "بطل الإنجاز"
    );

  const [
    badge,
    setBadge,
  ] =
    useState(
      "الأكثر إنجازًا هذا الأسبوع"
    );

  const [
    imageUrl,
    setImageUrl,
  ] = useState("");

  const [
    achievementsCount,
    setAchievementsCount,
  ] = useState(0);

  const [
    readingCount,
    setReadingCount,
  ] = useState(0);

  const [
    spellingCount,
    setSpellingCount,
  ] = useState(0);

  const [
    published,
    setPublished,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    statusMessage,
    setStatusMessage,
  ] = useState("");

  const [
    weeklyStudentStats,
    setWeeklyStudentStats,
  ] =
    useState<WeeklyStudentStats | null>(
      null
    );

  const [
    isLoadingStudentStats,
    setIsLoadingStudentStats,
  ] = useState(false);

  async function loadSavedHeroes() {
    const heroesSnapshot =
      await getDocs(
        collection(
          db,
          "academyHeroes"
        )
      );

    const loadedHeroes:
      SavedHero[] =
      heroesSnapshot.docs.map(
        (heroDoc) => {
          const data =
            heroDoc.data();

          const category =
            getLegacyCategory(
              data.category
            );

          return {
            id:
              heroDoc.id,

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

            classroom:
              typeof data.classroom ===
              "string"
                ? data.classroom
                : "",

            category,

            weeklyTrack:
              getWeeklyTrack(
                data.weeklyTrack,
                data.category
              ),

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

            imageUrl:
              typeof data.imageUrl ===
              "string"
                ? data.imageUrl
                : "",

            achievementsCount:
              typeof data.achievementsCount ===
              "number"
                ? data.achievementsCount
                : 0,

            readingCount:
              typeof data.readingCount ===
              "number"
                ? data.readingCount
                : 0,

            spellingCount:
              typeof data.spellingCount ===
              "number"
                ? data.spellingCount
                : 0,

            photoConsent:
              data.photoConsent ===
              true,

            published:
              data.published ===
              true,
          };
        }
      );

    loadedHeroes.sort(
      (a, b) => {
        if (
          a.weekKey !==
          b.weekKey
        ) {
          return b.weekKey.localeCompare(
            a.weekKey
          );
        }

        return a.weeklyTrack.localeCompare(
          b.weeklyTrack
        );
      }
    );

    setSavedHeroes(
      loadedHeroes
    );
  }

  useEffect(() => {
    async function loadPageData() {
      try {
        setIsLoading(true);
        setStatusMessage("");

        const studentsSnapshot =
          await getDocs(
            collection(
              db,
              "students"
            )
          );

        const loadedStudents:
          StudentOption[] = [];

        for (
          const studentDoc of
          studentsSnapshot.docs
        ) {
          const data =
            studentDoc.data();

          const name =
            typeof data.studentName ===
            "string"
              ? data.studentName
              : typeof data.name ===
                "string"
              ? data.name
              : studentDoc.id;

          const classroom =
            typeof data.classroom ===
            "string"
              ? data.classroom
              : "";

          let photoConsent =
            false;

          try {
            const caseStudySnapshot =
              await getDoc(
                doc(
                  db,
                  "studentCaseStudies",
                  studentDoc.id
                )
              );

            if (
              caseStudySnapshot.exists()
            ) {
              const caseStudyData =
                caseStudySnapshot.data();

              photoConsent =
                caseStudyData.photoConsent ===
                  true ||
                caseStudyData.photoConsent ===
                  "نعم" ||
                caseStudyData.photoConsent ===
                  "yes";
            }
          } catch (error) {
            console.error(
              `تعذر قراءة موافقة الصورة للطالب ${studentDoc.id}:`,
              error
            );
          }

          loadedStudents.push({
            id:
              studentDoc.id,
            name,
            classroom,
            photoConsent,
          });
        }

        loadedStudents.sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              "ar"
            )
        );

        setStudents(
          loadedStudents
        );

        await loadSavedHeroes();
      } catch (error) {
        console.error(
          "تعذر تحميل لوحة الأبطال:",
          error
        );

        setStatusMessage(
          "❌ تعذر تحميل بعض بيانات لوحة الأبطال."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadPageData();
  }, []);

  const selectedStudent =
    useMemo(
      () =>
        students.find(
          (student) =>
            student.id ===
            selectedStudentId
        ) ?? null,
      [
        students,
        selectedStudentId,
      ]
    );

  function convertToDate(
    value: unknown
  ): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    if (
      typeof value === "object" &&
      value !== null
    ) {
      const timestampLike = value as {
        toDate?: () => Date;
        seconds?: number;
      };

      if (
        typeof timestampLike.toDate ===
        "function"
      ) {
        return timestampLike.toDate();
      }

      if (
        typeof timestampLike.seconds ===
        "number"
      ) {
        return new Date(
          timestampLike.seconds * 1000
        );
      }
    }

    return null;
  }

  function isDateInCurrentWeek(
    value: unknown
  ) {
    const date =
      convertToDate(value);

    if (!date) {
      return false;
    }

    // currentWeek.key يمثل السبت حسب توقيت الرياض.
    const start = new Date(
      `${currentWeek.key}T00:00:00+03:00`
    );

    const end = new Date(start);

    end.setDate(
      end.getDate() + 7
    );

    return (
      date >= start &&
      date < end
    );
  }

  useEffect(() => {
    let active = true;

    async function loadSelectedStudentStats() {
      if (!selectedStudentId) {
        setWeeklyStudentStats(null);
        setAchievementsCount(0);
        setReadingCount(0);
        setSpellingCount(0);
        setIsLoadingStudentStats(false);
        return;
      }

      try {
        setIsLoadingStudentStats(true);
        setWeeklyStudentStats(null);

        const studentSnapshot =
          await getDoc(
            doc(
              db,
              "students",
              selectedStudentId
            )
          );

        if (!active) {
          return;
        }

        if (!studentSnapshot.exists()) {
          setWeeklyStudentStats(null);
          setAchievementsCount(0);
          setReadingCount(0);
          setSpellingCount(0);
          return;
        }

        const data =
          studentSnapshot.data();

        const pointsHistory =
          Array.isArray(
            data.pointsHistory
          )
            ? data.pointsHistory
            : [];

        const readingHistory =
          Array.isArray(
            data.readingHistory
          )
            ? data.readingHistory
            : [];

        const spellingHistory =
          Array.isArray(
            data.spellingHistory
          )
            ? data.spellingHistory
            : [];

        const achievements =
          Array.isArray(
            data.achievements
          )
            ? data.achievements
            : [];

        const badges =
          Array.isArray(
            data.badges
          )
            ? data.badges
            : [];

        const weeklyPoints =
          pointsHistory
            .filter(
              (item: Record<string, unknown>) =>
                isDateInCurrentWeek(
                  item.createdAt
                )
            )
            .reduce(
              (
                total: number,
                item: Record<string, unknown>
              ) =>
                total +
                (typeof item.points ===
                "number"
                  ? item.points
                  : 0),
              0
            );

        const weeklyReadings =
          readingHistory.filter(
            (item: Record<string, unknown>) =>
              isDateInCurrentWeek(
                item.createdAt
              )
          );

        const weeklySpellings =
          spellingHistory.filter(
            (item: Record<string, unknown>) =>
              isDateInCurrentWeek(
                item.createdAt
              )
          );

        const weeklyAchievements =
          achievements.filter(
            (item: Record<string, unknown>) =>
              isDateInCurrentWeek(
                item.achievedAt
              )
          );

        const weeklyBadges =
          badges.filter(
            (item: Record<string, unknown>) =>
              isDateInCurrentWeek(
                item.awardedAt
              )
          );

        // نزيل التكرار إذا كان الإنجاز نفسه محفوظًا كإنجاز وكوسام.
        const highlightMap =
          new Map<string, string>();

        weeklyAchievements.forEach(
          (item: Record<string, unknown>) => {
            const title =
              typeof item.title ===
              "string"
                ? item.title
                : "إنجاز جديد";

            const icon =
              typeof item.icon ===
              "string"
                ? item.icon
                : "🌟";

            const key =
              typeof item.rewardId ===
              "string" &&
              item.rewardId
                ? item.rewardId
                : title;

            highlightMap.set(
              key,
              `${icon} ${title}`
            );
          }
        );

        weeklyBadges.forEach(
          (item: Record<string, unknown>) => {
            const title =
              typeof item.title ===
              "string"
                ? item.title
                : "وسام جديد";

            const icon =
              typeof item.icon ===
              "string"
                ? item.icon
                : "🏅";

            const key =
              typeof item.rewardId ===
              "string" &&
              item.rewardId
                ? item.rewardId
                : title;

            if (!highlightMap.has(key)) {
              highlightMap.set(
                key,
                `${icon} ${title}`
              );
            }
          }
        );

        const highlights =
          Array.from(
            highlightMap.values()
          ).slice(0, 5);

        const stats:
          WeeklyStudentStats = {
          points: weeklyPoints,
          readingCount:
            weeklyReadings.length,
          spellingCount:
            weeklySpellings.length,
          achievementsCount:
            highlightMap.size,
          badgesCount:
            weeklyBadges.length,
          streak:
            typeof data.achievementStreak ===
            "number"
              ? data.achievementStreak
              : 0,
          highlights,
        };

        setWeeklyStudentStats(
          stats
        );

        // نحفظ لقطة الأرقام نفسها مع بطل الأسبوع عند الاعتماد.
        setAchievementsCount(
          stats.achievementsCount
        );
        setReadingCount(
          stats.readingCount
        );
        setSpellingCount(
          stats.spellingCount
        );
      } catch (error) {
        if (!active) {
          return;
        }

        console.error(
          "تعذر تحميل إنجازات الطالب الأسبوعية:",
          error
        );

        setWeeklyStudentStats(null);
        setAchievementsCount(0);
        setReadingCount(0);
        setSpellingCount(0);
      } finally {
        if (active) {
          setIsLoadingStudentStats(
            false
          );
        }
      }
    }

    void loadSelectedStudentStats();

    return () => {
      active = false;
    };
  }, [
    selectedStudentId,
    currentWeek.key,
  ]);

  const selectedTrackInfo =
    weeklyTrackOptions.find(
      (item) =>
        item.key ===
        weeklyTrack
    ) ??
    weeklyTrackOptions[0];

  const currentWeekHeroes =
    useMemo(
      () =>
        savedHeroes.filter(
          (hero) =>
            hero.weekKey ===
            currentWeek.key
        ),
      [
        savedHeroes,
        currentWeek.key,
      ]
    );

  // عدد مرات التكريم التاريخية لكل طالب.
  // نحسب كل أسبوع مرة واحدة فقط للطالب حتى لو حصل على أكثر من مسار في الأسبوع نفسه.
  const heroWinsByStudent =
    useMemo(() => {
      const weeksByStudent =
        new Map<string, Set<string>>();

      savedHeroes.forEach((hero) => {
        if (!hero.studentId) {
          return;
        }

        const weekIdentity =
          hero.weekKey ||
          hero.weekLabel ||
          hero.id;

        const studentWeeks =
          weeksByStudent.get(
            hero.studentId
          ) ?? new Set<string>();

        studentWeeks.add(
          weekIdentity
        );

        weeksByStudent.set(
          hero.studentId,
          studentWeeks
        );
      });

      const counts =
        new Map<string, number>();

      weeksByStudent.forEach(
        (weeks, studentId) => {
          counts.set(
            studentId,
            weeks.size
          );
        }
      );

      return counts;
    }, [savedHeroes]);

  const selectedStudentHeroWins =
    selectedStudentId
      ? heroWinsByStudent.get(
          selectedStudentId
        ) ?? 0
      : 0;

  const archivedHeroes =
    useMemo(
      () =>
        savedHeroes.filter(
          (hero) =>
            hero.weekKey !==
            currentWeek.key
        ),
      [
        savedHeroes,
        currentWeek.key,
      ]
    );

  function resetForm() {
    setSelectedStudentId("");
    setWeeklyTrack(
      "classHero"
    );
    setCustomTitle(
      "بطل الفصل"
    );
    setBadge(
      "بطل الفصل لهذا الأسبوع"
    );
    setImageUrl("");
    setAchievementsCount(
      0
    );
    setReadingCount(0);
    setSpellingCount(0);
    setPublished(false);
  }

  function handleEditHero(
    hero: SavedHero
  ) {
    setSelectedStudentId(
      hero.studentId
    );
    setWeeklyTrack(
      hero.weeklyTrack
    );
    setCustomTitle(
      hero.title
    );
    setBadge(hero.badge);
    setImageUrl(
      hero.imageUrl
    );
    setAchievementsCount(
      hero.achievementsCount
    );
    setReadingCount(
      hero.readingCount
    );
    setSpellingCount(
      hero.spellingCount
    );
    setPublished(
      hero.published
    );

    setStatusMessage(
      `✏️ أنت الآن تعدّل: ${hero.studentFirstName} — ${hero.title}`
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function unpublishOlderWeeks() {
    const snapshot =
      await getDocs(
        collection(
          db,
          "academyHeroes"
        )
      );

    const batch =
      writeBatch(db);

    let hasChanges =
      false;

    snapshot.docs.forEach(
      (heroDoc) => {
        const data =
          heroDoc.data();

        if (
          data.published ===
            true &&
          data.weekKey !==
            currentWeek.key
        ) {
          batch.set(
            heroDoc.ref,
            {
              published: false,
              updatedAt:
                serverTimestamp(),
            },
            {
              merge: true,
            }
          );

          hasChanges =
            true;
        }
      }
    );

    if (hasChanges) {
      await batch.commit();
    }
  }

  async function handleSave() {
    if (!selectedStudent) {
      setStatusMessage(
        "⚠️ اختر الطالب أولًا."
      );
      return;
    }

    if (
      published &&
      !selectedStudent.photoConsent
    ) {
      setStatusMessage(
        "⚠️ لا يمكن نشر هذا الطالب للزوار لأن موافقة الأسرة على النشر غير موجودة."
      );
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage("");

      if (published) {
        await unpublishOlderWeeks();
      }

      const heroId =
        `weekly_${currentWeek.key}_${weeklyTrack}`;

      await setDoc(
        doc(
          db,
          "academyHeroes",
          heroId
        ),
        {
          studentId:
            selectedStudent.id,

          studentFirstName:
            firstNameOnly(
              selectedStudent.name
            ),

          classroom:
            selectedStudent.classroom,

          category:
            weeklyTrack === "academyProgress"
              ? "progress"
              : "achievement",

          weeklyTrack,

          weekKey:
            currentWeek.key,

          weekLabel:
            currentWeek.label,

          title:
            customTitle.trim() ||
            selectedTrackInfo.defaultTitle,

          badge:
            badge.trim() ||
            selectedTrackInfo.defaultBadge,

          imageUrl:
            imageUrl.trim(),

          achievementsCount:
            Math.max(
              0,
              achievementsCount
            ),

          readingCount:
            Math.max(
              0,
              readingCount
            ),

          spellingCount:
            Math.max(
              0,
              spellingCount
            ),

          photoConsent:
            selectedStudent.photoConsent,

          published,

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      await loadSavedHeroes();

      setStatusMessage(
        published
          ? `✅ تم اعتماد ${selectedTrackInfo.label} ونشره ضمن أبطال هذا الأسبوع.`
          : `✅ تم حفظ ${selectedTrackInfo.label} كمسودة لهذا الأسبوع.`
      );
    } catch (error) {
      console.error(
        "تعذر حفظ بطل الأسبوع:",
        error
      );

      setStatusMessage(
        "❌ تعذر حفظ بيانات بطل الأسبوع. تحقق من الاتصال أو الصلاحيات."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-6"
      >
        <div className="rounded-3xl bg-white px-8 py-6 text-xl font-black text-emerald-700 shadow-sm">
          ⏳ جارٍ تحميل لوحة أبطال الأسبوع...
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-3xl bg-gradient-to-l from-emerald-800 to-emerald-600 p-7 text-white shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-bold text-emerald-100">
                لوحة المعلم
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                🏆 إدارة أبطال الأكاديمية في أسبوع
              </h1>

              <p className="mt-3 max-w-3xl leading-8 text-emerald-50">
                اختر ثلاثة أبطال أسبوعيًا: بطل واحد من الفصل،
                وبطلان من الأكاديمية للإنجاز والتطور والالتزام.
              </p>

              <div className="mt-4 inline-flex rounded-full bg-white/15 px-4 py-2 font-black text-emerald-50">
                🗓️ {currentWeek.label}
              </div>
            </div>

            <Link
              href="/teacher"
              className="rounded-2xl bg-white px-5 py-3 font-black text-emerald-700 no-underline"
            >
              ← العودة إلى لوحة المعلم
            </Link>
          </div>
        </header>

        {/* حالة المسارات الثلاثة */}

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          {weeklyTrackOptions.map(
            (track) => {
              const hero =
                currentWeekHeroes.find(
                  (item) =>
                    item.weeklyTrack ===
                    track.key
                );

              return (
                <article
                  key={track.key}
                  className={`rounded-3xl border p-5 shadow-sm ${
                    hero?.published
                      ? "border-emerald-200 bg-emerald-50"
                      : hero
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="text-3xl">
                    {track.icon}
                  </div>

                  <h2 className="mt-3 text-xl font-black text-slate-800">
                    {track.label}
                  </h2>

                  {hero ? (
                    <>
                      <p className="mt-2 font-black text-emerald-800">
                        {hero.studentFirstName}
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-500">
                        {hero.title}
                      </p>

                      <span
                        className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          hero.published
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {hero.published
                          ? "🌍 منشور"
                          : "📝 مسودة"}
                      </span>
                    </>
                  ) : (
                    <p className="mt-2 text-sm font-bold text-slate-500">
                      لم يتم اختيار بطل هذا المسار بعد.
                    </p>
                  )}
                </article>
              );
            }
          )}
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-lg font-black text-slate-800">
              👨‍🎓 اختر الطالب
            </label>

            <select
              value={selectedStudentId}
              onChange={(event) => {
                setSelectedStudentId(
                  event.target.value
                );
                setWeeklyStudentStats(null);
                setStatusMessage("");
              }}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 font-bold"
            >
              <option value="">
                اختر الطالب
              </option>

              {students.map(
                (student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.name} — {student.classroom}
                    {" — 🏆 "}
                    {heroWinsByStudent.get(
                      student.id
                    ) ?? 0}
                    {" مرة"}
                  </option>
                )
              )}
            </select>

            {selectedStudent && (
              <div
                className={`mt-4 rounded-2xl p-4 font-bold ${
                  selectedStudent.photoConsent
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                {selectedStudent.photoConsent
                  ? "✅ الأسرة موافقة على النشر في الواجهة العامة."
                  : "⚠️ لا توجد موافقة أسرة على النشر للزوار."}
              </div>
            )}

            {selectedStudent && (
              <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-sky-600">
                      📊 إنجازات هذا الأسبوع
                    </p>

                    <h3 className="mt-1 text-xl font-black text-slate-800">
                      {selectedStudent.name}
                    </h3>

                    <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-2 text-sm font-black text-amber-800">
                      🏆 عدد مرات التكريم:{" "}
                      {selectedStudentHeroWins}
                    </span>
                  </div>

                  <span className="rounded-full bg-white px-3 py-2 text-sm font-black text-sky-700">
                    🗓️ {currentWeek.label}
                  </span>
                </div>

                {isLoadingStudentStats ? (
                  <div className="mt-5 rounded-2xl bg-white p-5 text-center font-black text-sky-700">
                    ⏳ جارٍ تحميل إنجازات الطالب...
                  </div>
                ) : weeklyStudentStats ? (
                  <>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                        <div className="text-2xl">⭐</div>
                        <p className="mt-2 text-sm font-bold text-slate-500">
                          نقاط الأسبوع
                        </p>
                        <strong className="mt-1 block text-2xl text-emerald-700">
                          {weeklyStudentStats.points}
                        </strong>
                      </div>

                      <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                        <div className="text-2xl">📖</div>
                        <p className="mt-2 text-sm font-bold text-slate-500">
                          القراءات
                        </p>
                        <strong className="mt-1 block text-2xl text-emerald-700">
                          {weeklyStudentStats.readingCount}
                        </strong>
                      </div>

                      <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                        <div className="text-2xl">✍️</div>
                        <p className="mt-2 text-sm font-bold text-slate-500">
                          الإملاء
                        </p>
                        <strong className="mt-1 block text-2xl text-emerald-700">
                          {weeklyStudentStats.spellingCount}
                        </strong>
                      </div>

                      <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                        <div className="text-2xl">🏅</div>
                        <p className="mt-2 text-sm font-bold text-slate-500">
                          الإنجازات
                        </p>
                        <strong className="mt-1 block text-2xl text-emerald-700">
                          {weeklyStudentStats.achievementsCount}
                        </strong>
                      </div>

                      <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                        <div className="text-2xl">🔥</div>
                        <p className="mt-2 text-sm font-bold text-slate-500">
                          سلسلة الإنجاز
                        </p>
                        <strong className="mt-1 block text-2xl text-emerald-700">
                          {weeklyStudentStats.streak}
                        </strong>
                      </div>
                    </div>

                    {weeklyStudentStats.highlights.length > 0 && (
                      <div className="mt-4 rounded-2xl bg-white p-4">
                        <p className="font-black text-slate-800">
                          ✨ أبرز إنجازاته
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {weeklyStudentStats.highlights.map(
                            (highlight, index) => (
                              <span
                                key={`${highlight}-${index}`}
                                className="rounded-full bg-amber-50 px-3 py-2 text-sm font-black text-amber-800"
                              >
                                {highlight}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-5 rounded-2xl bg-white p-5 text-center font-bold text-slate-500">
                    لا توجد بيانات أسبوعية مسجلة لهذا الطالب حتى الآن.
                  </div>
                )}
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-lg font-black text-slate-800">
              🏆 مسار التكريم الأسبوعي
            </label>

            <select
              value={weeklyTrack}
              onChange={(event) => {
                const newTrack =
                  event.target
                    .value as WeeklyHeroTrack;

                setWeeklyTrack(
                  newTrack
                );

                const info =
                  weeklyTrackOptions.find(
                    (item) =>
                      item.key ===
                      newTrack
                  );

                if (info) {
                  setCustomTitle(
                    info.defaultTitle
                  );
                  setBadge(
                    info.defaultBadge
                  );
                }

                setStatusMessage("");
              }}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 font-bold"
            >
              {weeklyTrackOptions.map(
                (item) => (
                  <option
                    key={item.key}
                    value={item.key}
                  >
                    {item.icon} {item.label}
                  </option>
                )
              )}
            </select>

            <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
              {selectedTrackInfo.description}
            </p>
          </article>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block font-black text-slate-800">
              👑 اللقب المعروض
            </label>

            <input
              value={customTitle}
              onChange={(event) =>
                setCustomTitle(
                  event.target.value
                )
              }
              placeholder="مثال: بطل الإنجاز"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold"
            />
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block font-black text-slate-800">
              🏅 الشارة
            </label>

            <input
              value={badge}
              onChange={(event) =>
                setBadge(
                  event.target.value
                )
              }
              placeholder="مثال: الأكثر تطورًا هذا الأسبوع"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold"
            />
          </article>
        </section>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-3 block font-black text-slate-800">
            🖼️ رابط صورة الطالب
          </label>

          <input
            value={imageUrl}
            onChange={(event) =>
              setImageUrl(
                event.target.value
              )
            }
            placeholder="ضع رابط الصورة هنا"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />

          <p className="mt-2 text-sm text-slate-500">
            يمكن ترك الرابط فارغًا، ولن يتم نشر الطالب للزوار
            إذا لم تكن موافقة الأسرة موجودة.
          </p>
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <NumberField
            label="⭐ عدد الإنجازات"
            value={
              achievementsCount
            }
            onChange={
              setAchievementsCount
            }
          />

          <NumberField
            label="📖 قراءات معتمدة"
            value={
              readingCount
            }
            onChange={
              setReadingCount
            }
          />

          <NumberField
            label="✍️ إنجازات الإملاء"
            value={
              spellingCount
            }
            onChange={
              setSpellingCount
            }
          />
        </section>

        <section className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <div>
              <p className="text-lg font-black text-emerald-800">
                🌍 نشر بطل الأسبوع للزوار
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                عند نشر أول بطل من أسبوع جديد سيتم إخفاء أبطال
                الأسابيع السابقة تلقائيًا من الواجهة العامة.
              </p>
            </div>

            <input
              type="checkbox"
              checked={published}
              onChange={(event) => {
                setPublished(
                  event.target.checked
                );
                setStatusMessage("");
              }}
              className="h-7 w-7 accent-emerald-600"
            />
          </label>
        </section>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={
              handleSave
            }
            disabled={
              isSaving
            }
            className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-xl font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {isSaving
              ? "⏳ جارٍ حفظ بطل الأسبوع..."
              : `💾 حفظ ${selectedTrackInfo.label}`}
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setStatusMessage(
                "✅ تم تجهيز نموذج جديد."
              );
            }}
            className="rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 font-black text-slate-700"
          >
            ＋ اختيار جديد
          </button>
        </div>

        {statusMessage && (
          <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-center font-black text-amber-800">
            {statusMessage}
          </p>
        )}

        <section className="mt-7 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                🏆 أبطال هذا الأسبوع
              </h2>

              <p className="mt-2 text-slate-500">
                الأبطال المختارون للأسبوع الحالي: {currentWeek.label}
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-4 py-2 font-black text-emerald-700">
              {currentWeekHeroes.length} من 3
            </span>
          </div>

          {currentWeekHeroes.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center font-bold text-slate-500">
              لم يتم اختيار أبطال هذا الأسبوع حتى الآن.
            </div>
          ) : (
            <div className="grid gap-3">
              {currentWeekHeroes.map(
                (hero) => {
                  const track =
                    weeklyTrackOptions.find(
                      (item) =>
                        item.key ===
                        hero.weeklyTrack
                    );

                  const totalWins =
                    heroWinsByStudent.get(
                      hero.studentId
                    ) ?? 0;

                  return (
                    <article
                      key={hero.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                          {track?.icon ?? "🌟"}
                        </div>

                        <div>
                          <h3 className="font-black text-slate-800">
                            {hero.studentFirstName}
                            {" — "}
                            {hero.title}
                          </h3>

                          <p className="mt-1 text-sm font-bold text-slate-500">
                            {track?.label ?? "تكريم"}
                            {" • 🏆 "}
                            {totalWins}
                            {" "}
                            {totalWins === 1
                              ? "مرة"
                              : "مرات"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-2 text-sm font-black ${
                            hero.published
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {hero.published
                            ? "🌍 منشور"
                            : "📝 مسودة"}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleEditHero(
                              hero
                            )
                          }
                          className="rounded-xl bg-white px-4 py-2 font-black text-slate-700 shadow-sm"
                        >
                          ✏️ تعديل
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                🗂️ أرشيف أبطال الأكاديمية
              </h2>

              <p className="mt-2 text-slate-500">
                تنتقل الأسابيع السابقة إلى هنا تلقائيًا، ويظهر عدد مرات تكريم كل طالب.
              </p>
            </div>

            <span className="rounded-full bg-amber-50 px-4 py-2 font-black text-amber-800">
              {archivedHeroes.length} سجل مؤرشف
            </span>
          </div>

          {archivedHeroes.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center font-bold text-slate-500">
              لا توجد أسابيع سابقة في الأرشيف حتى الآن.
            </div>
          ) : (
            <div className="grid gap-3">
              {archivedHeroes.map(
                (hero) => {
                  const track =
                    weeklyTrackOptions.find(
                      (item) =>
                        item.key ===
                        hero.weeklyTrack
                    );

                  const totalWins =
                    heroWinsByStudent.get(
                      hero.studentId
                    ) ?? 0;

                  return (
                    <article
                      key={hero.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                          {track?.icon ?? "🌟"}
                        </div>

                        <div>
                          <h3 className="font-black text-slate-800">
                            {hero.studentFirstName}
                            {" — "}
                            {hero.title}
                          </h3>

                          <p className="mt-1 text-sm font-bold text-slate-500">
                            {track?.label ?? "تكريم"}
                            {" • "}
                            {hero.weekLabel ||
                              "سجل سابق"}
                          </p>

                          <span className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                            🏆 مجموع مرات التكريم:{" "}
                            {totalWins}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleEditHero(
                            hero
                          )
                        }
                        className="rounded-xl bg-white px-4 py-2 font-black text-slate-700 shadow-sm"
                      >
                        ✏️ عرض / تعديل
                      </button>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-violet-200 bg-violet-50 p-5">
          <h2 className="text-xl font-black text-violet-800">
            💡 فلسفة التكريم
          </h2>

          <p className="mt-2 leading-8 text-violet-900">
            نكرّم بطلًا من الفصل تقديرًا للمشاركة والتفاعل والتحسن،
            وبطلين من الأكاديمية تقديرًا للإنجاز والتطور والالتزام،
            حتى تتنوع فرص الوصول إلى منصة الأبطال.
          </p>
        </section>

        <section className="mt-4 rounded-3xl border border-sky-200 bg-sky-50 p-5">
          <h2 className="text-xl font-black text-sky-800">
            🔐 الخصوصية أولًا
          </h2>

          <p className="mt-2 leading-8 text-sky-900">
            التكريم داخل الأكاديمية مستقل عن موافقة نشر الصورة.
            الظهور في الواجهة العامة يخضع لموافقة الأسرة.
          </p>
        </section>
      </div>
    </main>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (
    value: number
  ) => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <label className="mb-3 block font-black text-slate-800">
        {label}
      </label>

      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) =>
          onChange(
            Math.max(
              0,
              Number(
                event.target.value
              ) || 0
            )
          )
        }
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-center text-xl font-black"
      />
    </article>
  );
}