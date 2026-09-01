import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AcademyBoardCategory =
  | "announcement"
  | "event"
  | "competition";

type PublicAcademyMilestone = {
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

type PublicAcademyBoardSlide = {
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

type PublicAcademyBoardSettings = {
  enabled: boolean;
  intervalSeconds: number;
  tickerEnabled: boolean;
  tickerText: string;
};

type PublicAcademyHero = {
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

type PublicAcademyBoardPayload = {
  success: true;
  settings: PublicAcademyBoardSettings;
  slides: PublicAcademyBoardSlide[];
  milestones: PublicAcademyMilestone[];
  heroes: PublicAcademyHero[];
};

const defaultAcademyBoardSettings: PublicAcademyBoardSettings = {
  enabled: true,
  intervalSeconds: 6,
  tickerEnabled: true,
  tickerText:
    "🌟 كل إنجاز جديد يكتب اسمًا جديدًا في تاريخ أكاديمية لغتي",
};

const CACHE_TTL_MS = 30 * 60 * 1000;

let cachedPayload: PublicAcademyBoardPayload | null = null;
let cachedAt = 0;

function toMillis(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (
      value as {
        toMillis: () => number;
      }
    ).toMillis();
  }

  return 0;
}

function getRiyadhDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function jsonWithCache(
  payload: PublicAcademyBoardPayload,
  cacheState: "HIT" | "MISS" | "STALE"
) {
  return NextResponse.json(payload, {
    status: 200,
    headers: {
      // اللوحة عامة؛ يسمح هذا لكاش CDN بتقليل استدعاءات الـ API في الإنتاج.
      "Cache-Control":
        "public, s-maxage=1800, stale-while-revalidate=300",
      "X-Academy-Board-Cache": cacheState,
    },
  });
}

export async function GET() {
  const now = Date.now();

  if (
    cachedPayload &&
    now - cachedAt < CACHE_TTL_MS
  ) {
    return jsonWithCache(
      cachedPayload,
      "HIT"
    );
  }

  try {
    const { adminDb } = getFirebaseAdmin();

    // لوحة الصفحة الرئيسية أصبحت مخصصة للإعلانات المهمة فقط.
    // لذلك نقرأ الإعدادات وشرائح اللوحة فقط، ولا نقرأ الإنجازات أو الأبطال هنا.
    const [
      settingsSnapshot,
      slidesSnapshot,
    ] = await Promise.all([
      adminDb
        .collection("academyBoardSettings")
        .doc("main")
        .get(),

      adminDb
        .collection("academyBoardSlides")
        .get(),
    ]);

    const settingsData =
      settingsSnapshot.exists
        ? settingsSnapshot.data() ?? {}
        : {};

    const settings: PublicAcademyBoardSettings = {
      enabled:
        settingsData.enabled !== false,

      intervalSeconds:
        typeof settingsData.intervalSeconds === "number" &&
        settingsData.intervalSeconds >= 3
          ? Math.min(
              30,
              settingsData.intervalSeconds
            )
          : defaultAcademyBoardSettings.intervalSeconds,

      tickerEnabled:
        settingsData.tickerEnabled !== false,

      tickerText:
        typeof settingsData.tickerText === "string" &&
        settingsData.tickerText.trim()
          ? settingsData.tickerText
          : defaultAcademyBoardSettings.tickerText,
    };

    const riyadhDateKey =
      getRiyadhDateKey();

    const slides: PublicAcademyBoardSlide[] =
      slidesSnapshot.docs
        .map((document) => {
          const data =
            document.data() ?? {};

          const category: AcademyBoardCategory =
            data.category === "event"
              ? "event"
              : data.category === "competition"
              ? "competition"
              : "announcement";

          return {
            id: document.id,

            title:
              typeof data.title === "string"
                ? data.title
                : "",

            message:
              typeof data.message === "string"
                ? data.message
                : "",

            category,

            icon:
              typeof data.icon === "string" &&
              data.icon.trim()
                ? data.icon
                : category === "event"
                ? "🎉"
                : category === "competition"
                ? "🏆"
                : "📣",

            visible:
              data.visible !== false,

            startDate:
              typeof data.startDate === "string"
                ? data.startDate
                : "",

            endDate:
              typeof data.endDate === "string"
                ? data.endDate
                : "",

            createdAtMilliseconds:
              toMillis(data.createdAt) ||
              toMillis(data.updatedAt),
          };
        })
        .filter((slide) => {
          if (
            !slide.visible ||
            slide.title.trim() === ""
          ) {
            return false;
          }

          const hasStarted =
            !slide.startDate ||
            riyadhDateKey >=
              slide.startDate;

          const hasNotEnded =
            !slide.endDate ||
            riyadhDateKey <=
              slide.endDate;

          return (
            hasStarted &&
            hasNotEnded
          );
        })
        .sort(
          (first, second) =>
            second.createdAtMilliseconds -
            first.createdAtMilliseconds
        );

    // أبقينا الحقلين في الاستجابة للتوافق مع الصفحة الحالية،
    // لكن دون أي قراءة إضافية من Firestore.
    const milestones: PublicAcademyMilestone[] = [];
    const heroes: PublicAcademyHero[] = [];

    const payload: PublicAcademyBoardPayload = {
      success: true,
      settings,
      slides,
      milestones,
      heroes,
    };

    cachedPayload = payload;
    cachedAt = now;

    return jsonWithCache(
      payload,
      "MISS"
    );
  } catch (error) {
    console.error(
      "Public academy board error:",
      error
    );

    // إذا تعطل Firestore مؤقتًا نعرض آخر نسخة ناجحة بدل إسقاط اللوحة.
    if (cachedPayload) {
      return jsonWithCache(
        cachedPayload,
        "STALE"
      );
    }

    return NextResponse.json(
      {
        success: false,
        settings:
          defaultAcademyBoardSettings,
        slides: [],
        milestones: [],
        heroes: [],
        message:
          "تعذر تحميل لوحة الأكاديمية.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Academy-Board-Cache": "ERROR",
        },
      }
    );
  }
}
