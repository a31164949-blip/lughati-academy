import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

const tasks = [
  {
    id: 1,
    title: "قراءة درس اليوم",
    rewardPoints: 0,
    rewardStars: 2,
  },
  {
    id: 2,
    title: "حل الواجب اليومي",
    rewardPoints: 3,
    rewardStars: 0,
  },
  {
    id: 3,
    title: "التدرب على القراءة",
    rewardPoints: 0,
    rewardStars: 1,
  },
  {
    id: 4,
    title: "مراجعة كلمات الإملاء",
    rewardPoints: 2,
    rewardStars: 0,
  },
];

function getSaudiDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function getStudentFromRequest(request: Request) {
  const authorization =
    request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = authorization.slice(7);

  const { adminAuth } = getFirebaseAdmin();

  const decodedToken =
    await adminAuth.verifyIdToken(token);

  if (decodedToken.role !== "student") {
    throw new Error("FORBIDDEN");
  }

  const studentDocId =
    typeof decodedToken.studentDocId === "string"
      ? decodedToken.studentDocId
      : "";

  if (!studentDocId) {
    throw new Error("STUDENT_NOT_FOUND");
  }

  return studentDocId;
}

export async function GET(request: Request) {
  try {
    const studentDocId =
      await getStudentFromRequest(request);

    const { adminDb } = getFirebaseAdmin();

    const dateKey = getSaudiDateKey();

    const studentRef = adminDb
      .collection("students")
      .doc(studentDocId);

    const readingProgressRef = adminDb
      .collection("reading-progress")
      .doc(studentDocId);

    const completionRefs = tasks.map((task) =>
      adminDb
        .collection("dailyCompletions")
        .doc(
          `${studentDocId}_${dateKey}_task-${task.id}`
        )
    );

    const [
      studentSnapshot,
      readingProgressSnapshot,
      ...completionSnapshots
    ] = await adminDb.getAll(
      studentRef,
      readingProgressRef,
      ...completionRefs
    );

    if (!studentSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          message: "لم يتم العثور على الطالب.",
        },
        { status: 404 }
      );
    }

    const studentData =
      studentSnapshot.data() ?? {};

    const readingProgressData =
      readingProgressSnapshot.exists
        ? readingProgressSnapshot.data() ?? {}
        : {};

    const completedTaskIds =
      completionSnapshots
        .map((snapshot, index) =>
          snapshot.exists
            ? tasks[index].id
            : null
        )
        .filter(
          (taskId): taskId is number =>
            taskId !== null
        );

    return NextResponse.json({
      success: true,

      points:
        typeof studentData.points === "number"
          ? studentData.points
          : 0,

      stars:
        typeof studentData.stars === "number"
          ? studentData.stars
          : 0,

      streak:
        typeof studentData?.journey?.streak ===
        "number"
          ? studentData.journey.streak
          : 0,

      readingDays:
        typeof readingProgressData
          .totalApprovedDays === "number"
          ? readingProgressData.totalApprovedDays
          : 0,

      personalPhotoUrl:
        studentData.personalPhotoStatus ===
          "approved" &&
        typeof studentData.personalPhotoUrl ===
          "string"
          ? studentData.personalPhotoUrl
          : "",

      selectedAvatarIcon:
        typeof studentData.selectedAvatarIcon ===
          "string"
          ? studentData.selectedAvatarIcon
          : "🧒🏻",

      completedTaskIds,
    });
  } catch (error) {
    console.error(
      "Student journey GET error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          message: "غير مصرح بالدخول.",
        },
        { status: 401 }
      );
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "هذا المسار مخصص للطلاب.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر تحميل بيانات رحلة الطالب.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const studentDocId =
      await getStudentFromRequest(request);

    const body = await request.json();

    const taskId = Number(body?.taskId);

    const task = tasks.find(
      (item) => item.id === taskId
    );

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: "المهمة غير صحيحة.",
        },
        { status: 400 }
      );
    }

    const { adminDb } = getFirebaseAdmin();

    const dateKey = getSaudiDateKey();

    const studentRef = adminDb
      .collection("students")
      .doc(studentDocId);

    const completionRefs = tasks.map((item) =>
      adminDb
        .collection("dailyCompletions")
        .doc(
          `${studentDocId}_${dateKey}_task-${item.id}`
        )
    );

    const selectedCompletionRef = adminDb
      .collection("dailyCompletions")
      .doc(
        `${studentDocId}_${dateKey}_task-${task.id}`
      );

    const bonusRef = adminDb
      .collection("dailyCompletions")
      .doc(
        `${studentDocId}_${dateKey}_bonus`
      );

    const result =
      await adminDb.runTransaction(
        async (transaction) => {
          const studentSnapshot =
            await transaction.get(studentRef);

          const completionSnapshots =
            await Promise.all(
              completionRefs.map((ref) =>
                transaction.get(ref)
              )
            );

          const bonusSnapshot =
            await transaction.get(bonusRef);

          if (!studentSnapshot.exists) {
            throw new Error(
              "STUDENT_NOT_FOUND"
            );
          }

          const studentData =
            studentSnapshot.data() ?? {};

          const alreadyCompleted =
            completionSnapshots.some(
              (snapshot, index) =>
                tasks[index].id ===
                  task.id &&
                snapshot.exists
            );

          if (alreadyCompleted) {
            return {
              alreadyCompleted: true,

              points:
                typeof studentData.points ===
                "number"
                  ? studentData.points
                  : 0,

              stars:
                typeof studentData.stars ===
                "number"
                  ? studentData.stars
                  : 0,

              streak:
                typeof studentData?.journey
                  ?.streak === "number"
                  ? studentData.journey.streak
                  : 0,
            };
          }

          const completedBefore =
            completionSnapshots.filter(
              (snapshot) =>
                snapshot.exists
            ).length;

          const willCompleteAll =
            completedBefore + 1 ===
            tasks.length;

          const grantDailyBonus =
            willCompleteAll &&
            !bonusSnapshot.exists;

          const addedPoints =
            task.rewardPoints +
            (grantDailyBonus ? 10 : 0);

          const addedStars =
            task.rewardStars +
            (grantDailyBonus ? 3 : 0);

          let resultingStreak =
            typeof studentData?.journey
              ?.streak === "number"
              ? studentData.journey.streak
              : 0;

          transaction.set(
            selectedCompletionRef,
            {
              studentId: studentDocId,
              taskId: task.id,
              taskTitle: task.title,
              date: dateKey,
              completed: true,
              rewardPoints:
                task.rewardPoints,
              rewardStars:
                task.rewardStars,
              completedAt:
                FieldValue.serverTimestamp(),
            }
          );

          if (grantDailyBonus) {
            const currentStreak =
              typeof studentData?.journey
                ?.streak === "number"
                ? studentData.journey.streak
                : 0;

            const lastCompletedDate =
              typeof studentData?.journey
                ?.lastCompletedDate ===
              "string"
                ? studentData.journey
                    .lastCompletedDate
                : "";

            const yesterday = new Date();

            yesterday.setDate(
              yesterday.getDate() - 1
            );

            const yesterdayKey =
              getSaudiDateKey(yesterday);

            const newStreak =
              lastCompletedDate ===
              yesterdayKey
                ? currentStreak + 1
                : 1;

            resultingStreak =
              newStreak;

            transaction.set(
              bonusRef,
              {
                studentId:
                  studentDocId,
                date: dateKey,
                type:
                  "daily-completion-bonus",
                points: 10,
                stars: 3,
                completedAt:
                  FieldValue.serverTimestamp(),
              }
            );

            transaction.update(
              studentRef,
              {
                "journey.streak":
                  newStreak,
                "journey.lastCompletedDate":
                  dateKey,
              }
            );
          }

          const historyEntries: Record<
            string,
            unknown
          >[] = [
            {
              reason: `مهمة يومية: ${task.title}`,
              points:
                task.rewardPoints,
              stars:
                task.rewardStars,
              category: "مهمة يومية",
              date: dateKey,
              createdAt: new Date(),
            },
          ];

          if (grantDailyBonus) {
            historyEntries.push({
              reason:
                "إكمال جميع مهام اليوم",
              points: 10,
              stars: 3,
              category:
                "وسام النشاط اليومي",
              date: dateKey,
              createdAt: new Date(),
            });
          }

          transaction.update(
            studentRef,
            {
              points:
                FieldValue.increment(
                  addedPoints
                ),

              stars:
                FieldValue.increment(
                  addedStars
                ),

              "journey.xp":
                FieldValue.increment(
                  addedPoints
                ),

              pointsHistory:
                FieldValue.arrayUnion(
                  ...historyEntries
                ),

              updatedAt:
                FieldValue.serverTimestamp(),
            }
          );

          const currentPoints =
            typeof studentData.points ===
            "number"
              ? studentData.points
              : 0;

          const currentStars =
            typeof studentData.stars ===
            "number"
              ? studentData.stars
              : 0;

          return {
            alreadyCompleted: false,
            points:
              currentPoints +
              addedPoints,
            stars:
              currentStars +
              addedStars,
            grantDailyBonus,
            streak:
              resultingStreak,
          };
        }
      );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "Student journey POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر حفظ إنجاز المهمة.",
      },
      { status: 500 }
    );
  }
}