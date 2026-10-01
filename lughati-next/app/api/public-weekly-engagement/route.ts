import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EngagementRow = {
  studentId: string;
  studentName: string;
  score: number;
  details: {
    homeworks: number;
    readings: number;
    galleryWorks: number;
  };
};

const WEIGHTS = {
  reading: 40,
  homework: 40,
  gallery: 20,
} as const;

const SUMMARY_VERSION = "learning-v2";

type RankingItem = {
  rank: number;
  studentId: string;
  studentName: string;
  score: number;
  readings: number;
  homeworks: number;
  galleryWorks: number;
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
let cachedWeekStart = "";

type SummaryDocument = WeeklyEngagementPayload & {
  status: "ready";
};

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

  // السبت حتى 12:00 ظهرًا، والساعة 12:00 نفسها هي وقت الإيقاف.
  if (weekday === "Sat") {
    return minutes < 12 * 60;
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

function getInactivePayload(startDate: string, endDate: string) {
  return {
    success: true as const,
    title: "أفضل خمسة طلاب هذا الأسبوع",
    weekStart: startDate,
    weekEnd: endDate,
    weights: WEIGHTS,
    rankings: [],
    pointsChampion: null,
    updatedAt: new Date().toISOString(),
    displayActive: false,
  } satisfies WeeklyEngagementPayload;
}

async function claimSummary(
  summaryRef: FirebaseFirestore.DocumentReference,
  now: number
) {
  const { adminDb } = getFirebaseAdmin();

  return adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(summaryRef);
    const data = snapshot.data() as
      | { status?: string; claimExpiresAt?: number }
      | undefined;

    if (
      data?.status === "ready" ||
      (data?.status === "calculating" &&
        typeof data.claimExpiresAt === "number" &&
        data.claimExpiresAt > now)
    ) {
      return false;
    }

    transaction.set(
      summaryRef,
      {
        status: "calculating",
        claimExpiresAt: now + 2 * 60 * 1000,
        updatedAt: new Date(now).toISOString(),
      },
      { merge: true }
    );
    return true;
  });
}

async function readReadySummary(summaryRef: FirebaseFirestore.DocumentReference) {
  const snapshot = await summaryRef.get();
  if (!snapshot.exists) return null;

  const data = snapshot.data() as Partial<SummaryDocument>;
  if (data.status !== "ready" || data.displayActive !== true) return null;

  return data as WeeklyEngagementPayload;
}

async function waitForReadySummary(
  summaryRef: FirebaseFirestore.DocumentReference,
  attempts = 4
) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const summary = await readReadySummary(summaryRef);
    if (summary) return summary;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  return null;
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

export async function GET(request: Request) {
  try {
    const now = Date.now();
    const { startDate, endDate } = getWeekRange();
    const url = new URL(request.url);
    const teacherPreview = url.searchParams.get("teacherPreview") === "1";

    /*
      خارج نافذة التكريم لا نقرأ Firestore إطلاقًا.
      العرض المعتمد:
      الخميس 12:00 ظهرًا -> السبت 12:00 ظهرًا بتوقيت الرياض.
    */
    if (!isTopFiveDisplayWindow() && !teacherPreview) {
      return NextResponse.json(
        getInactivePayload(startDate, endDate),
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=300, stale-while-revalidate=300",
            "X-Engagement-Display": "INACTIVE",
          },
        }
      );
    }

    if (cachedPayload && cachedWeekStart === startDate) {
      return NextResponse.json(cachedPayload, {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=300",
          "X-Engagement-Cache": "HIT",
        },
      });
    }

    const { adminDb } = getFirebaseAdmin();
    const summaryRef = adminDb
      .collection("weeklyEngagementSummaries")
      .doc(
        teacherPreview
          ? `${startDate}-${SUMMARY_VERSION}-preview`
          : `${startDate}-${SUMMARY_VERSION}`
      );

    const storedSummary = await readReadySummary(summaryRef);
    if (storedSummary && storedSummary.weekStart === startDate) {
      cachedPayload = storedSummary;
      cachedWeekStart = startDate;
      return NextResponse.json(storedSummary, {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=300",
          "X-Engagement-Cache": "SUMMARY-HIT",
        },
      });
    }

    const claimed = await claimSummary(summaryRef, now);
    if (!claimed) {
      const concurrentSummary = await waitForReadySummary(summaryRef);
      if (!concurrentSummary || concurrentSummary.weekStart !== startDate) {
        return NextResponse.json(
          {
            ...getInactivePayload(startDate, endDate),
            message: "جارٍ إعداد الملخص الأسبوعي.",
          },
          { status: 503, headers: { "Retry-After": "5" } }
        );
      }

      cachedPayload = concurrentSummary;
      cachedWeekStart = startDate;
      return NextResponse.json(concurrentSummary, {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=300",
          "X-Engagement-Cache": "SUMMARY-HIT",
        },
      });
    }

    const startAt = new Date(startDate + "T00:00:00+03:00");
    const endAt = new Date(endDate + "T23:59:59.999+03:00");
    const [
      studentsSnapshot,
      homeworkByReviewSnapshot,
      homeworkLegacySnapshot,
      readingSnapshot,
      studentWorksByPublishSnapshot,
      studentWorksLegacySnapshot,
      notebookByPublishSnapshot,
      notebookLegacySnapshot,
    ] = await Promise.all([
      adminDb.collection("students").where("active", "==", true).get(),
      adminDb.collection("homeworkCompletions")
        .where("solutionReviewedAt", ">=", startAt).where("solutionReviewedAt", "<=", endAt).get(),
      adminDb.collection("homeworkCompletions")
        .where("createdAt", ">=", startAt).where("createdAt", "<=", endAt).get(),
      adminDb.collection("reading-submissions")
        .where("readingDate", ">=", startDate).where("readingDate", "<=", endDate).get(),
      adminDb.collection("studentWorks")
        .where("publishedAt", ">=", startAt).where("publishedAt", "<=", endAt).get(),
      adminDb.collection("studentWorks")
        .where("createdAt", ">=", startAt).where("createdAt", "<=", endAt).get(),
      adminDb.collection("notebookGallery")
        .where("publishedAt", ">=", startAt).where("publishedAt", "<=", endAt).get(),
      adminDb.collection("notebookGallery")
        .where("createdAt", ">=", startAt).where("createdAt", "<=", endAt).get(),
    ]);

    const mergeSnapshots = (...snapshots: FirebaseFirestore.QuerySnapshot[]) => {
      const documents = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
      snapshots.forEach((snapshot) =>
        snapshot.docs.forEach((document) => documents.set(document.id, document))
      );
      return [...documents.values()];
    };

    const homeworkDocs = mergeSnapshots(homeworkByReviewSnapshot, homeworkLegacySnapshot);
    const studentWorkDocs = mergeSnapshots(studentWorksByPublishSnapshot, studentWorksLegacySnapshot);
    const notebookGalleryDocs = mergeSnapshots(notebookByPublishSnapshot, notebookLegacySnapshot);

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
          homeworks: 0,
          readings: 0,
          galleryWorks: 0,
        },
      };

      rows.set(studentDoc.id, row);
      aliases.set(studentDoc.id, studentDoc.id);
      aliases.set(logicalId, studentDoc.id);

    });

    const resolveStudent = (rawId: unknown) => {
      if (typeof rawId !== "string" || !rawId.trim()) return null;
      const canonical = aliases.get(rawId.trim()) ?? rawId.trim();
      return rows.get(canonical) ?? null;
    };

    const homeworkSeen = new Set<string>();
    const homeworkCompletionSeen = new Set<string>();
    homeworkDocs.forEach((docSnapshot) => {
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
      homeworkCompletionSeen.add(`${row.studentId}:${docSnapshot.id}`);
      row.details.homeworks += 1;
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
      row.details.readings += 1;
    });

    const gallerySeen = new Set<string>();

    studentWorkDocs.forEach((docSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      const row = resolveStudent(data.studentId ?? data.studentDocId);
      if (!row) return;

      const approved =
        data.status === "approved" ||
        data.status === "معتمد" ||
        data.teacherApproved === true;

      const published =
        data.publishedToGallery === true ||
        data.published === true;

      if (!approved || !published) return;

      const dateKey = firstDateKey(data, [
        "publishedAt",
        "approvedAt",
        "updatedAt",
        "createdAt",
      ]);

      if (!isInsideWeek(dateKey, startDate, endDate)) return;

      const sourceCompletionId =
        typeof data.sourceCompletionId === "string"
          ? data.sourceCompletionId.trim()
          : "";

      // إذا كان العمل منشورًا من واجب سبق احتسابه، فلا نحسبه مرة ثانية.
      if (
        sourceCompletionId &&
        homeworkCompletionSeen.has(`${row.studentId}:${sourceCompletionId}`)
      ) {
        return;
      }

      const uniqueKey = `${row.studentId}:work:${docSnapshot.id}`;
      if (gallerySeen.has(uniqueKey)) return;

      gallerySeen.add(uniqueKey);
      row.details.galleryWorks += 1;
    });

    notebookGalleryDocs.forEach((docSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      const row = resolveStudent(data.studentId ?? data.studentDocId);
      if (!row || data.isPublished === false) return;

      const dateKey = firstDateKey(data, [
        "publishedAt",
        "approvedAt",
        "updatedAt",
        "createdAt",
      ]);

      if (!isInsideWeek(dateKey, startDate, endDate)) return;

      const uniqueKey = `${row.studentId}:notebook:${docSnapshot.id}`;
      if (gallerySeen.has(uniqueKey)) return;

      gallerySeen.add(uniqueKey);
      row.details.galleryWorks += 1;
    });

    const activeRows = [...rows.values()].filter(
      (row) =>
        row.details.readings > 0 ||
        row.details.homeworks > 0 ||
        row.details.galleryWorks > 0
    );

    const maxReadings = Math.max(
      1,
      ...activeRows.map((row) => row.details.readings)
    );
    const maxHomeworks = Math.max(
      1,
      ...activeRows.map((row) => row.details.homeworks)
    );
    const maxGalleryWorks = Math.max(
      1,
      ...activeRows.map((row) => row.details.galleryWorks)
    );

    const ranked = activeRows
      .map((row) => ({
        ...row,
        score: Number(
          (
            (row.details.readings / maxReadings) * WEIGHTS.reading +
            (row.details.homeworks / maxHomeworks) * WEIGHTS.homework +
            (row.details.galleryWorks / maxGalleryWorks) * WEIGHTS.gallery
          ).toFixed(2)
        ),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.details.readings !== a.details.readings) {
          return b.details.readings - a.details.readings;
        }
        if (b.details.homeworks !== a.details.homeworks) {
          return b.details.homeworks - a.details.homeworks;
        }
        if (b.details.galleryWorks !== a.details.galleryWorks) {
          return b.details.galleryWorks - a.details.galleryWorks;
        }
        return a.studentName.localeCompare(b.studentName, "ar");
      })
      .slice(0, 5)
      .map((row, index) => ({
        rank: index + 1,
        studentId: row.studentId,
        studentName: row.studentName,
        score: row.score,
        readings: row.details.readings,
        homeworks: row.details.homeworks,
        galleryWorks: row.details.galleryWorks,
      }));

    const payload: WeeklyEngagementPayload = {
      success: true,
      title: "أفضل خمسة طلاب هذا الأسبوع",
      weekStart: startDate,
      weekEnd: endDate,
      weights: WEIGHTS,
      rankings: ranked,
      pointsChampion,
      updatedAt: new Date().toISOString(),
      displayActive: true,
    };

    const batch = adminDb.batch();

    batch.set(summaryRef, {
      ...payload,
      status: "ready",
      claimExpiresAt: null,
    });

    /*
      تُسجّل الصدارة مرة واحدة فقط لكل أسبوع.
      arrayUnion يجعل العملية آمنة حتى لو أُعيد تنفيذ الملخص.
      المقصود بالصدارة هنا: المركز الأول في ترتيب التعلّم الأسبوعي.
    */
    const weeklyLearningChampion = ranked[0];
    if (weeklyLearningChampion) {
      batch.update(
        adminDb.collection("students").doc(weeklyLearningChampion.studentId),
        {
          weeklyLeadershipWeeks: FieldValue.arrayUnion(startDate),
        }
      );
    }

    await batch.commit();

    cachedPayload = payload;
    cachedWeekStart = startDate;

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
