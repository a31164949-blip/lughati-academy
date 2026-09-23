import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";

type WheelTier = "points" | "heroes";
type HistoryEntry = {
  points?: unknown;
  date?: unknown;
  source?: unknown;
  reason?: unknown;
};

const POINTS_TARGET = 30;
const HEROES_TARGET = 60;

const pointPrizes = [
  { label: "نقطتان إضافيتان", points: 2, type: "points" },
  { label: "3 نقاط إضافية", points: 3, type: "points" },
  { label: "5 نقاط إضافية", points: 5, type: "points" },
  { label: "7 نقاط إضافية", points: 7, type: "points" },
  { label: "10 نقاط إضافية", points: 10, type: "points" },
] as const;

const heroesPrizes = [
  { label: "5 نقاط إضافية", points: 5, type: "points" },
  { label: "10 نقاط إضافية", points: 10, type: "points" },
  { label: "15 نقطة إضافية", points: 15, type: "points" },
  { label: "20 نقطة إضافية", points: 20, type: "points" },
  { label: "وسام بطل الأسبوع", points: 0, type: "badge" },
  { label: "هدية عينية من المعلّم", points: 0, type: "physical-gift" },
] as const;

function getSaudiParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

function dateKey(date: Date) {
  return [
    date.getUTCFullYear().toString().padStart(4, "0"),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
}

function getWindow() {
  const saudi = getSaudiParts();
  const today = new Date(Date.UTC(saudi.year, saudi.month - 1, saudi.day, 12));
  const day = today.getUTCDay();
  const sunday = new Date(today);
  sunday.setUTCDate(today.getUTCDate() - day);
  const wednesday = new Date(sunday);
  wednesday.setUTCDate(sunday.getUTCDate() + 3);

  const active =
    (day === 0 && saudi.hour >= 13) ||
    day === 1 ||
    day === 2 ||
    (day === 3 && saudi.hour < 22);

  let statusMessage = "العجلة متاحة من الأحد الساعة 1 ظهرًا حتى الأربعاء الساعة 10 مساءً.";
  if (active) statusMessage = "العجلة مفتوحة الآن حتى الأربعاء الساعة 10 مساءً.";
  else if (day === 0 && saudi.hour < 13) statusMessage = "تفتح عجلة هذا الأسبوع اليوم الساعة 1 ظهرًا.";
  else if (day >= 4) statusMessage = "أُغلقت عجلة هذا الأسبوع، وتعود يوم الأحد الساعة 1 ظهرًا.";

  return {
    active,
    statusMessage,
    weekKey: dateKey(sunday),
    startKey: dateKey(sunday),
    endKey: dateKey(wednesday),
  };
}

function getHistoryDateKey(value: unknown) {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Riyadh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(parsed);
    }
    return value.slice(0, 10);
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format((value as { toDate: () => Date }).toDate());
  }
  return "";
}

function weeklyEarnedPoints(history: unknown, startKey: string, endKey: string) {
  if (!Array.isArray(history)) return 0;
  return history.reduce((sum: number, raw: HistoryEntry) => {
    const key = getHistoryDateKey(raw?.date);
    const isWheelReward =
      raw?.source === "weekly-reward-wheel" ||
      (typeof raw?.reason === "string" && raw.reason.startsWith("عجلة الحظ الأسبوعية"));
    const value = typeof raw?.points === "number" ? raw.points : 0;
    if (isWheelReward || value <= 0 || key < startKey || key > endKey) return sum;
    return sum + value;
  }, 0);
}

async function getStudentId(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth } = getFirebaseAdmin();
  const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
  if (decoded.role !== "student") throw new Error("FORBIDDEN");
  const studentDocId =
    typeof decoded.studentDocId === "string" ? decoded.studentDocId : "";
  if (!studentDocId) throw new Error("STUDENT_NOT_FOUND");
  return studentDocId;
}

async function buildState(studentDocId: string) {
  const { adminDb } = getFirebaseAdmin();
  const window = getWindow();
  const studentRef = adminDb.collection("students").doc(studentDocId);
  const [studentSnap, pointsSpin, heroesSpin] = await Promise.all([
    studentRef.get(),
    adminDb.collection("weeklyRewardSpins").doc(`${studentDocId}_${window.weekKey}_points`).get(),
    adminDb.collection("weeklyRewardSpins").doc(`${studentDocId}_${window.weekKey}_heroes`).get(),
  ]);
  if (!studentSnap.exists) throw new Error("STUDENT_NOT_FOUND");
  const data = studentSnap.data() ?? {};
  const earnedPoints = weeklyEarnedPoints(data.pointsHistory, window.startKey, window.endKey);
  return {
    success: true,
    ...window,
    earnedPoints,
    targets: { points: POINTS_TARGET, heroes: HEROES_TARGET },
    spins: {
      points: pointsSpin.exists ? pointsSpin.data() : null,
      heroes: heroesSpin.exists ? heroesSpin.data() : null,
    },
  };
}

export async function GET(request: Request) {
  try {
    return NextResponse.json(await buildState(await getStudentId(request)));
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "STUDENT_NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ success: false, message: status === 500 ? "تعذر تحميل عجلة المكافآت." : "تعذر التحقق من حساب الطالب." }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const studentDocId = await getStudentId(request);
    const body = await request.json();
    const tier: WheelTier = body?.tier === "heroes" ? "heroes" : "points";
    const window = getWindow();
    if (!window.active) {
      return NextResponse.json({ success: false, message: window.statusMessage }, { status: 409 });
    }

    const { adminDb } = getFirebaseAdmin();
    const studentRef = adminDb.collection("students").doc(studentDocId);
    const spinRef = adminDb.collection("weeklyRewardSpins").doc(`${studentDocId}_${window.weekKey}_${tier}`);
    const prizes = tier === "heroes" ? heroesPrizes : pointPrizes;
    const target = tier === "heroes" ? HEROES_TARGET : POINTS_TARGET;

    const result = await adminDb.runTransaction(async (transaction) => {
      const [studentSnap, spinSnap] = await Promise.all([
        transaction.get(studentRef),
        transaction.get(spinRef),
      ]);
      if (!studentSnap.exists) throw new Error("STUDENT_NOT_FOUND");
      if (spinSnap.exists) {
        return { alreadySpun: true, ...(spinSnap.data() ?? {}) };
      }
      const studentData = studentSnap.data() ?? {};
      const earnedPoints = weeklyEarnedPoints(studentData.pointsHistory, window.startKey, window.endKey);
      if (earnedPoints < target) throw new Error("TARGET_NOT_REACHED");

      const prize = prizes[Math.floor(Math.random() * prizes.length)];
      const entry = {
        studentId: studentDocId,
        weekKey: window.weekKey,
        tier,
        prizeLabel: prize.label,
        prizeType: prize.type,
        prizePoints: prize.points,
        earnedPoints,
        createdAt: FieldValue.serverTimestamp(),
      };
      transaction.set(spinRef, entry);

      const update: Record<string, unknown> = {};
      if (prize.points > 0) {
        update.points = FieldValue.increment(prize.points);
        update.pointsHistory = FieldValue.arrayUnion({
          reason: `عجلة الحظ الأسبوعية — ${prize.label}`,
          points: prize.points,
          date: new Date().toISOString(),
          source: "weekly-reward-wheel",
          weekKey: window.weekKey,
          tier,
        });
      }
      if (prize.type === "badge") {
        update.badges = FieldValue.arrayUnion("بطل الأسبوع");
      }
      if (Object.keys(update).length > 0) transaction.update(studentRef, update);
      return { alreadySpun: false, ...entry };
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "STUDENT_NOT_FOUND" ? 404 : code === "TARGET_NOT_REACHED" ? 409 : 500;
    const message =
      code === "TARGET_NOT_REACHED"
        ? "واصل إنجازاتك؛ لم تصل بعد إلى نقاط فتح هذه العجلة."
        : status === 500
          ? "تعذر تشغيل العجلة الآن. حاول مرة أخرى."
          : "تعذر التحقق من حساب الطالب.";
    return NextResponse.json({ success: false, message }, { status });
  }
}
