import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EngagementRow = {
  studentId: string;
  studentName: string;
  score: number;
  details: {
    weeklyPlan: number;
    homeworks: number;
    readings: number;
    dailyCompletions: number;
    login: number;
  };
};

const WEIGHTS = {
  weeklyPlan: 1,
  homework: 3,
  reading: 3,
  dailyCompletion: 1,
  weeklyLogin: 1,
} as const;

const CACHE_TTL_MS = 60 * 60 * 1000;

type RankingItem = {
  rank: number;
  studentId: string;
  studentName: string;
  score: number;
};

type PointsChampion = {
  studentId: string;
  studentName: string;
  points: number;
};

type WeeklyEngagementPayload = {
  success: true;
  title: string;
  weekStart: string;
  weekEnd: string;
  weights: typeof WEIGHTS;
  rankings: RankingItem[];
  pointsChampion: PointsChampion | null;
  updatedAt: string;
  displayActive: boolean;
};

let cachedPayload: WeeklyEngagementPayload | null = null;
let cachedAt = 0;

function getRiyadhDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}


function getRiyadhClockParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Riyadh",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    weekday: values.weekday || "",
    hour: Number(values.hour || 0),
    minute: Number(values.minute || 0),
  };
}

function isTopFiveDisplayWindow(date = new Date()) {
  const { weekday, hour, minute } =
    getRiyadhClockParts(date);

  const minutes = hour * 60 + minute;

  // الخميس من 12:00 ظهرًا حتى نهاية اليوم.
  if (weekday === "Thu") {
    return minutes >= 12 * 60;
  }

  // الجمعة كاملة.
  if (weekday === "Fri") {
    return true;
  }

  // السبت حتى 4:00 عصرًا، والساعة 4:00 نفسها هي وقت الإيقاف.
  if (weekday === "Sat") {
    return minutes < 16 * 60;
  }

  return false;
}

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return getRiyadhDateKey(date);
}

function getWeekRange() {
  const todayKey = getRiyadhDateKey();
  const [year, month, day] = todayKey.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = noonUtc.getUTCDay(); // الأحد = 0
  const startDate = addDays(todayKey, -weekday);
  const endDate = addDays(startDate, 6);
  return { startDate, endDate };
}

function toDateKey(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return getRiyadhDateKey(parsed);
    return "";
  }

  if (value instanceof Date) return getRiyadhDateKey(value);

  if (typeof value === "object" && value !== null) {
    const maybeTimestamp = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof maybeTimestamp.toDate === "function") {
      return getRiyadhDateKey(maybeTimestamp.toDate());
    }

    const seconds = maybeTimestamp.seconds ?? maybeTimestamp._seconds;
    if (typeof seconds === "number") {
      return getRiyadhDateKey(new Date(seconds * 1000));
    }
  }

  return "";
}

function isInsideWeek(dateKey: string, startDate: string, endDate: string) {
  return Boolean(dateKey && dateKey >= startDate && dateKey <= endDate);
}

function firstDateKey(data: Record<string, unknown>, fields: string[]) {
  for (const field of fields) {
    const key = toDateKey(data[field]);
    if (key) return key;
  }
  return "";
}

function getStudentDocumentId(data: Record<string, unknown>, fallbackId: string) {
  const value = data.studentId;
  return typeof value === "string" && value.trim() ? value.trim() : fallbackId;
}

function getStudentName(data: Record<string, unknown>) {
  const candidates = [data.studentName, data.name, data.fullName];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return "طالب الأكاديمية";
}

function getPublicStudentName(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

export async function GET() {
  try {
    const now = Date.now();

    if (
      cachedPayload &&
      now - cachedAt < CACHE_TTL_MS
    ) {
      return NextResponse.json(
        cachedPayload,
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=300",
            "X-Engagement-Cache": "HIT",
          },
        }
      );
    }

    const { startDate, endDate } = getWeekRange();

    /*
      خارج نافذة التكريم لا نقرأ Firestore إطلاقًا.
      العرض المعتمد:
      الخميس 12:00 ظهرًا -> السبت 4:00 عصرًا بتوقيت الرياض.
    */
    if (!isTopFiveDisplayWindow()) {
      return NextResponse.json(
        {
          success: true,
          title: "الأكثر تفاعلًا هذا الأسبوع",
          weekStart: startDate,
          weekEnd: endDate,
          weights: WEIGHTS,
          rankings: [],
          pointsChampion: null,
          updatedAt: new Date().toISOString(),
          displayActive: false,
        },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=300, stale-while-revalidate=300",
            "X-Engagement-Display": "INACTIVE",
          },
        }
      );
    }

    const { adminDb } = getFirebaseAdmin();

    const [
      studentsSnapshot,
      weeklyPlanViewsSnapshot,
      homeworkSnapshot,
      readingSnapshot,
      dailySnapshot,
    ] = await Promise.all([
      adminDb.collection("students").get(),
      adminDb.collection("weeklyPlanViews").get(),
      adminDb.collection("homeworkCompletions").get(),
      adminDb.collection("reading-submissions").get(),
      adminDb
        .collection("dailyCompletions")
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .get(),
    ]);

    const rows = new Map<string, EngagementRow>();
    const aliases = new Map<string, string>();

    let pointsChampion: PointsChampion | null = null;

    studentsSnapshot.docs.forEach((studentDoc) => {
      const data = studentDoc.data() as Record<string, unknown>;

      if (data.deleted === true || data.active === false || data.isActive === false) {
        return;
      }

      const logicalId = getStudentDocumentId(data, studentDoc.id);
      const publicStudentName = getPublicStudentName(getStudentName(data));
      const studentPoints =
        typeof data.points === "number" && Number.isFinite(data.points)
          ? data.points
          : Number(data.points ?? 0) || 0;

      if (
        !pointsChampion ||
        studentPoints > pointsChampion.points ||
        (studentPoints === pointsChampion.points &&
          publicStudentName.localeCompare(pointsChampion.studentName, "ar") < 0)
      ) {
        pointsChampion = {
          studentId: studentDoc.id,
          studentName: publicStudentName,
          points: studentPoints,
        };
      }

      const row: EngagementRow = {
        studentId: studentDoc.id,
        studentName: publicStudentName,
        score: 0,
        details: {
          weeklyPlan: 0,
          homeworks: 0,
          readings: 0,
          dailyCompletions: 0,
          login: 0,
        },
      };

      rows.set(studentDoc.id, row);
      aliases.set(studentDoc.id, studentDoc.id);
      aliases.set(logicalId, studentDoc.id);

      const lastLoginKey = firstDateKey(data, [
        "lastLoginAt",
        "lastLogin",
        "lastLoginDate",
        "lastSeenAt",
      ]);

      if (isInsideWeek(lastLoginKey, startDate, endDate)) {
        row.details.login = WEIGHTS.weeklyLogin;
      }
    });

    const resolveStudent = (rawId: unknown) => {
      if (typeof rawId !== "string" || !rawId.trim()) return null;
      const canonical = aliases.get(rawId.trim()) ?? rawId.trim();
      return rows.get(canonical) ?? null;
    };

    const weeklyPlanSeen = new Set<string>();
    weeklyPlanViewsSnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      const row = resolveStudent(data.studentId ?? data.studentDocId);
      if (!row) return;

      const dateKey = firstDateKey(data, [
        "viewedAt",
        "firstViewedAt",
        "lastViewedAt",
        "createdAt",
        "updatedAt",
        "date",
      ]);

      if (!isInsideWeek(dateKey, startDate, endDate)) return;
      if (weeklyPlanSeen.has(row.studentId)) return;

      weeklyPlanSeen.add(row.studentId);
      row.details.weeklyPlan += WEIGHTS.weeklyPlan;
    });

    const homeworkSeen = new Set<string>();
    homeworkSnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      const row = resolveStudent(data.studentId ?? data.studentDocId);
      if (!row) return;

      const approved =
        data.solutionStatus === "approved" ||
        data.status === "approved" ||
        data.teacherReviewed === true ||
        data.approved === true;

      if (!approved) return;

      const dateKey = firstDateKey(data, [
        "solutionReviewedAt",
        "reviewedAt",
        "approvedAt",
        "updatedAt",
        "completedAt",
        "createdAt",
      ]);

      if (!isInsideWeek(dateKey, startDate, endDate)) return;

      const homeworkId =
        typeof data.homeworkId === "string" && data.homeworkId.trim()
          ? data.homeworkId.trim()
          : docSnapshot.id;

      const uniqueKey = `${row.studentId}:${homeworkId}`;
      if (homeworkSeen.has(uniqueKey)) return;

      homeworkSeen.add(uniqueKey);
      row.details.homeworks += WEIGHTS.homework;
    });

    const readingSeen = new Set<string>();
    readingSnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      const row = resolveStudent(data.studentId ?? data.studentDocId);
      if (!row || data.status !== "approved") return;

      const readingDate =
        typeof data.readingDate === "string" && data.readingDate.trim()
          ? data.readingDate.trim().slice(0, 10)
          : firstDateKey(data, ["reviewedAt", "approvedAt", "createdAt"]);

      if (!isInsideWeek(readingDate, startDate, endDate)) return;

      const uniqueKey = `${row.studentId}:${readingDate}`;
      if (readingSeen.has(uniqueKey)) return;

      readingSeen.add(uniqueKey);
      row.details.readings += WEIGHTS.reading;
    });

    const dailySeen = new Set<string>();
    dailySnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      const row = resolveStudent(data.studentId ?? data.studentDocId);
      if (!row || data.completed !== true) return;

      const dateKey =
        typeof data.date === "string" && data.date.trim()
          ? data.date.trim().slice(0, 10)
          : firstDateKey(data, ["completedAt", "updatedAt", "createdAt"]);

      if (!isInsideWeek(dateKey, startDate, endDate)) return;

      const uniqueKey = `${row.studentId}:${dateKey}`;
      if (dailySeen.has(uniqueKey)) return;

      dailySeen.add(uniqueKey);
      row.details.dailyCompletions += WEIGHTS.dailyCompletion;
    });

    const ranked = [...rows.values()]
      .map((row) => ({
        ...row,
        score:
          row.details.weeklyPlan +
          row.details.homeworks +
          row.details.readings +
          row.details.dailyCompletions +
          row.details.login,
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.details.homeworks !== a.details.homeworks) {
          return b.details.homeworks - a.details.homeworks;
        }
        if (b.details.readings !== a.details.readings) {
          return b.details.readings - a.details.readings;
        }
        return a.studentName.localeCompare(b.studentName, "ar");
      })
      .slice(0, 5)
      .map((row, index) => ({
        rank: index + 1,
        studentId: row.studentId,
        studentName: row.studentName,
        score: row.score,
      }));

    const payload: WeeklyEngagementPayload = {
      success: true,
      title: "الأكثر تفاعلًا هذا الأسبوع",
      weekStart: startDate,
      weekEnd: endDate,
      weights: WEIGHTS,
      rankings: ranked,
      pointsChampion,
      updatedAt: new Date().toISOString(),
      displayActive: true,
    };

    cachedPayload = payload;
    cachedAt = now;

    return NextResponse.json(
      payload,
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=300",
          "X-Engagement-Cache": "MISS",
        },
      }
    );
  } catch (error) {
    console.error("تعذر حساب ترتيب التفاعل الأسبوعي:", error);

    if (cachedPayload) {
      return NextResponse.json(
        cachedPayload,
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=300",
            "X-Engagement-Cache": "STALE",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        rankings: [],
        pointsChampion: null,
        message: "تعذر تحميل ترتيب التفاعل حاليًا.",
      },
      { status: 500 }
    );
  }
}
