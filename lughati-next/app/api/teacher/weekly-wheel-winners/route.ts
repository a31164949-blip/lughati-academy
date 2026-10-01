import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEACHER_EMAIL = "a31164949@gmail.com";

async function requireTeacher(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");

  const { adminAuth } = getFirebaseAdmin();
  const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
  const email = typeof decoded.email === "string" ? decoded.email.trim().toLowerCase() : "";
  const role = typeof decoded.role === "string" ? decoded.role : "";

  if (role !== "teacher" && role !== "admin" && email !== TEACHER_EMAIL.toLowerCase()) {
    throw new Error("FORBIDDEN");
  }
}

function getWeekKey() {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().slice(0, 10);
}

function timestampMillis(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    // استدعاء الدالة من الكائن نفسه حتى لا نفقد سياق Firestore Timestamp.
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export async function GET(request: Request) {
  try {
    await requireTeacher(request);
    const { adminDb } = getFirebaseAdmin();
    const weekKey = getWeekKey();

    /*
      نقرأ سجلات العجلة ثم نرشّح الأسبوع في الخادم.
      مجموعة weeklyRewardSpins صغيرة (محاولتان كحد أقصى لكل طالب في الأسبوع)،
      وهذا يتجنب اعتماد الصفحة على فهرس Firestore إضافي.
      
      معرّفات سجلات العجلة تبدأ بمعرّف الطالب ثم مفتاح الأسبوع،
      لذلك نقرأ مجموعة العجلة مرة واحدة ونرشّح الأسبوع في الخادم.
      هذا يتجنب اعتماد الصفحة على فهرس Firestore إضافي قد لا يكون منشورًا بعد.
    */
    const spinsSnapshot = await adminDb
      .collection("weeklyRewardSpins")
      .get();

    const weekSpinDocs = spinsSnapshot.docs.filter(
      (doc) => doc.data()?.weekKey === weekKey
    );

    const studentIds = Array.from(
      new Set(
        weekSpinDocs
          .map((doc) => doc.data()?.studentId)
          .filter((id): id is string => typeof id === "string" && Boolean(id))
      )
    );

    const studentRefs = studentIds.map((id) => adminDb.collection("students").doc(id));
    const studentSnapshots = studentRefs.length ? await adminDb.getAll(...studentRefs) : [];
    const studentNames = new Map(
      studentSnapshots.map((snapshot) => {
        const data = snapshot.data() ?? {};
        const name =
          typeof data.studentName === "string" && data.studentName.trim()
            ? data.studentName.trim()
            : typeof data.name === "string" && data.name.trim()
              ? data.name.trim()
              : "طالب الأكاديمية";
        return [snapshot.id, name] as const;
      })
    );

    const winners = weekSpinDocs
      .map((doc) => {
        const data = doc.data() ?? {};
        const prizePoints = typeof data.prizePoints === "number" ? data.prizePoints : 0;
        const prizeType = typeof data.prizeType === "string" ? data.prizeType : "";
        return {
          id: doc.id,
          studentId: typeof data.studentId === "string" ? data.studentId : "",
          studentName: studentNames.get(data.studentId) ?? "طالب الأكاديمية",
          tier: data.tier === "heroes" ? "heroes" : "points",
          prizeLabel: typeof data.prizeLabel === "string" ? data.prizeLabel : "جائزة",
          prizeType,
          prizePoints,
          earnedPoints: typeof data.earnedPoints === "number" ? data.earnedPoints : 0,
          createdAt: timestampMillis(data.createdAt),
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({
      success: true,
      weekKey,
      summary: {
        totalSpins: winners.length,
        pointsWinners: winners.filter((item) => item.prizePoints > 0).length,
        otherPrizes: winners.filter((item) => item.prizePoints <= 0).length,
        pointsAwarded: winners.reduce((sum, item) => sum + item.prizePoints, 0),
      },
      winners,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        message: status === 500 ? "تعذر تحميل نتائج عجلة الحظ." : "غير مصرح لك بعرض النتائج.",
      },
      { status }
    );
  }
}
