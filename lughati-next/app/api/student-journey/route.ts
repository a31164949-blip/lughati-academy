import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

/**
 * مهام اليوم:
 * 1 و4: مهام تدريبية يمكن للطالب تأكيدها.
 * 2: لا تُحتسب بالضغط؛ تُعد منجزة بعد اعتماد واجب اليوم.
 *
 * القراءة ليست من مهام اليوم هنا؛ لها مسار مستقل في رحلة القراءة.
 * لا توجد نقاط مباشرة لمجرد الضغط على أي مهمة.
 * نقاط الواجب (+3) تأتي من مسار اعتماد الواجب الرسمي.
 */
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
    rewardPoints: 0,
    rewardStars: 0,
  },
  {
    id: 4,
    title: "مراجعة كلمات الإملاء",
    rewardPoints: 0,
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

function getFirestoreDateKey(
  value: unknown
): string {
  if (!value) {
    return "";
  }

  try {
    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown })
        .toDate === "function"
    ) {
      return getSaudiDateKey(
        (
          value as {
            toDate: () => Date;
          }
        ).toDate()
      );
    }

    if (value instanceof Date) {
      return getSaudiDateKey(value);
    }
  } catch {
    return "";
  }

  return "";
}

async function getStudentFromRequest(
  request: Request
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization?.startsWith("Bearer ")
  ) {
    throw new Error("UNAUTHORIZED");
  }

  const token =
    authorization.slice(7);

  const { adminAuth } =
    getFirebaseAdmin();

  const decodedToken =
    await adminAuth.verifyIdToken(token);

  if (
    decodedToken.role !== "student"
  ) {
    throw new Error("FORBIDDEN");
  }

  const studentDocId =
    typeof decodedToken.studentDocId ===
    "string"
      ? decodedToken.studentDocId
      : "";

  if (!studentDocId) {
    throw new Error(
      "STUDENT_NOT_FOUND"
    );
  }

  return studentDocId;
}

type DailyProofStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected";

async function getHomeworkStatusForDate(
  studentDocId: string,
  dateKey: string
): Promise<DailyProofStatus> {
  const { adminDb } =
    getFirebaseAdmin();

  const snapshot =
    await adminDb
      .collection("homeworkCompletions")
      .where(
        "studentId",
        "==",
        studentDocId
      )
      .get();

  const todayRows =
    snapshot.docs
      .map((document) => ({
        id: document.id,
        data: document.data() ?? {},
      }))
      .filter(({ data }) => {
        const completedDateKey =
          getFirestoreDateKey(
            data.completedAt
          ) ||
          getFirestoreDateKey(
            data.createdAt
          );

        return (
          completedDateKey === dateKey &&
          typeof data.solutionUrl ===
            "string" &&
          data.solutionUrl.trim() !== ""
        );
      })
      .sort((first, second) => {
        const firstMillis =
          first.data.updatedAt
            ?.toMillis?.() ?? 0;
        const secondMillis =
          second.data.updatedAt
            ?.toMillis?.() ?? 0;

        return secondMillis -
          firstMillis;
      });

  if (todayRows.length === 0) {
    return "none";
  }

  const latest =
    todayRows[0].data;

  if (
    latest.solutionStatus ===
    "approved"
  ) {
    return "approved";
  }

  if (
    latest.solutionStatus ===
    "rejected"
  ) {
    return "rejected";
  }

  return "pending";
}

export async function GET(
  request: Request
) {
  try {
    const studentDocId =
      await getStudentFromRequest(
        request
      );

    const { adminDb } =
      getFirebaseAdmin();

    const dateKey =
      getSaudiDateKey();

    const studentRef =
      adminDb
        .collection("students")
        .doc(studentDocId);

    const readingProgressRef =
      adminDb
        .collection(
          "reading-progress"
        )
        .doc(studentDocId);

    const completionRefs =
      tasks.map((task) =>
        adminDb
          .collection(
            "dailyCompletions"
          )
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

    if (
      !studentSnapshot.exists
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم العثور على الطالب.",
        },
        { status: 404 }
      );
    }

    const homeworkStatus =
      await getHomeworkStatusForDate(
        studentDocId,
        dateKey
      );

    const hasApprovedHomeworkToday =
      homeworkStatus === "approved";


    const studentData =
      studentSnapshot.data() ?? {};

    const readingProgressData =
      readingProgressSnapshot.exists
        ? readingProgressSnapshot.data() ??
          {}
        : {};

    const completedSet =
      new Set<number>();

    completionSnapshots.forEach(
      (snapshot, index) => {
        if (snapshot.exists) {
          completedSet.add(
            tasks[index].id
          );
        }
      }
    );

    // المهمة 2 لا تصبح مكتملة إلا
    // بعد اعتماد الواجب.
    if (
      hasApprovedHomeworkToday
    ) {
      completedSet.add(2);
    } else {
      completedSet.delete(2);
    }


    const completedTaskIds =
      Array.from(completedSet).sort(
        (first, second) =>
          first - second
      );

    return NextResponse.json({
      success: true,

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
          ? studentData.journey
              .streak
          : 0,

      readingDays:
        typeof readingProgressData
          .totalApprovedDays ===
        "number"
          ? readingProgressData
              .totalApprovedDays
          : 0,

      personalPhotoUrl:
        studentData
          .personalPhotoStatus ===
          "approved" &&
        typeof studentData
          .personalPhotoUrl ===
          "string"
          ? studentData
              .personalPhotoUrl
          : "",

      selectedAvatarIcon:
        typeof studentData
          .selectedAvatarIcon ===
        "string"
          ? studentData
              .selectedAvatarIcon
          : "🧒🏻",

      completedTaskIds,
      hasApprovedHomeworkToday,
      homeworkStatus,
      smartFollowUp:
  studentData.smartFollowUp &&
  typeof studentData.smartFollowUp ===
    "object"
    ? studentData.smartFollowUp
    : null,
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

    if (
      message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "غير مصرح بالدخول.",
        },
        { status: 401 }
      );
    }

    if (
      message === "FORBIDDEN"
    ) {
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

export async function POST(
  request: Request
) {
  try {
    const studentDocId =
      await getStudentFromRequest(
        request
      );

    const body =
      await request.json();

    const taskId =
      Number(body?.taskId);

    const task =
      tasks.find(
        (item) =>
          item.id === taskId
      );

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message:
            "المهمة غير صحيحة.",
        },
        { status: 400 }
      );
    }

    // حماية الخادم:
    // لا يمكن تحويل الواجب أو القراءة
    // إلى نقاط/إنجاز بمجرد استدعاء API.
    if (task.id === 2) {
      return NextResponse.json(
        {
          success: false,
          code:
            "HOMEWORK_APPROVAL_REQUIRED",
          message:
            "أرفق واجبك من صفحة الواجبات، وتُحتسب +3 نقاط بعد اعتماد المعلم.",
        },
        { status: 409 }
      );
    }


    const { adminDb } =
      getFirebaseAdmin();

    const dateKey =
      getSaudiDateKey();

    const studentRef =
      adminDb
        .collection("students")
        .doc(studentDocId);

    const completionRefs =
      tasks.map((item) =>
        adminDb
          .collection(
            "dailyCompletions"
          )
          .doc(
            `${studentDocId}_${dateKey}_task-${item.id}`
          )
      );

    const selectedCompletionRef =
      adminDb
        .collection(
          "dailyCompletions"
        )
        .doc(
          `${studentDocId}_${dateKey}_task-${task.id}`
        );

    const bonusRef =
      adminDb
        .collection(
          "dailyCompletions"
        )
        .doc(
          `${studentDocId}_${dateKey}_bonus`
        );

    const result =
      await adminDb.runTransaction(
        async (transaction) => {
          const studentSnapshot =
            await transaction.get(
              studentRef
            );

          const completionSnapshots =
            await Promise.all(
              completionRefs.map(
                (ref) =>
                  transaction.get(
                    ref
                  )
              )
            );

          const bonusSnapshot =
            await transaction.get(
              bonusRef
            );

          if (
            !studentSnapshot.exists
          ) {
            throw new Error(
              "STUDENT_NOT_FOUND"
            );
          }

          const studentData =
            studentSnapshot.data() ??
            {};

          const alreadyCompleted =
            completionSnapshots.some(
              (
                snapshot,
                index
              ) =>
                tasks[index].id ===
                  task.id &&
                snapshot.exists
            );

          if (alreadyCompleted) {
            return {
              alreadyCompleted: true,

              points:
                typeof studentData
                  .points ===
                "number"
                  ? studentData.points
                  : 0,

              stars:
                typeof studentData
                  .stars ===
                "number"
                  ? studentData.stars
                  : 0,

              streak:
                typeof studentData
                  ?.journey
                  ?.streak ===
                "number"
                  ? studentData
                      .journey
                      .streak
                  : 0,
            };
          }

          const completedIdsBefore =
            new Set<number>();

          completionSnapshots.forEach(
            (
              snapshot,
              index
            ) => {
              if (snapshot.exists) {
                completedIdsBefore.add(
                  tasks[index].id
                );
              }
            }
          );


          const confirmableTaskIds =
            tasks
              .filter(
                (item) =>
                  item.id !== 2
              )
              .map((item) => item.id);

          const completedConfirmableBefore =
            confirmableTaskIds.filter(
              (id) =>
                completedIdsBefore.has(id)
            ).length;

          const willCompleteAll =
            confirmableTaskIds.includes(
              task.id
            ) &&
            !completedIdsBefore.has(
              task.id
            ) &&
            completedConfirmableBefore +
              1 ===
              confirmableTaskIds.length;

          const grantDailyBonus =
            willCompleteAll &&
            !bonusSnapshot.exists;

          const addedPoints = 0;

          const addedStars =
            task.rewardStars +
            (grantDailyBonus
              ? 3
              : 0);

          let resultingStreak =
            typeof studentData
              ?.journey?.streak ===
            "number"
              ? studentData
                  .journey.streak
              : 0;

          transaction.set(
            selectedCompletionRef,
            {
              studentId:
                studentDocId,
              taskId: task.id,
              taskTitle:
                task.title,
              date: dateKey,
              completed: true,
              rewardPoints: 0,
              rewardStars:
                task.rewardStars,
              completedAt:
                FieldValue.serverTimestamp(),
            }
          );

          if (grantDailyBonus) {
            const currentStreak =
              typeof studentData
                ?.journey
                ?.streak ===
              "number"
                ? studentData
                    .journey
                    .streak
                : 0;

            const lastCompletedDate =
              typeof studentData
                ?.journey
                ?.lastCompletedDate ===
              "string"
                ? studentData
                    .journey
                    .lastCompletedDate
                : "";

            const yesterday =
              new Date();

            yesterday.setDate(
              yesterday.getDate() -
                1
            );

            const yesterdayKey =
              getSaudiDateKey(
                yesterday
              );

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
                points: 0,
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

          const historyEntries:
            Record<
              string,
              unknown
            >[] = [];

          if (
            task.rewardStars > 0
          ) {
            historyEntries.push({
              reason:
                `مهمة يومية: ${task.title}`,
              points: 0,
              stars:
                task.rewardStars,
              category:
                "مهمة يومية",
              date: dateKey,
              createdAt:
                new Date(),
            });
          }

          if (grantDailyBonus) {
            historyEntries.push({
              reason:
                "إكمال جميع مهام اليوم",
              points: 0,
              stars: 3,
              category:
                "وسام النشاط اليومي",
              date: dateKey,
              createdAt:
                new Date(),
            });
          }

          const studentUpdate:
            Record<
              string,
              unknown
            > = {
              updatedAt:
                FieldValue.serverTimestamp(),
            };

          if (
            addedStars > 0
          ) {
            studentUpdate.stars =
              FieldValue.increment(
                addedStars
              );
          }

          if (
            historyEntries.length >
            0
          ) {
            studentUpdate.pointsHistory =
              FieldValue.arrayUnion(
                ...historyEntries
              );
          }

          // لا نزيد points أو journey.xp
          // لأن مهام اليوم نفسها لا تمنح
          // نقاطًا مباشرة.
          transaction.update(
            studentRef,
            studentUpdate
          );

          const currentPoints =
            typeof studentData
              .points === "number"
              ? studentData.points
              : 0;

          const currentStars =
            typeof studentData
              .stars === "number"
              ? studentData.stars
              : 0;

          return {
            alreadyCompleted:
              false,
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

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message ===
      "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "غير مصرح بالدخول.",
        },
        { status: 401 }
      );
    }

    if (
      message === "FORBIDDEN"
    ) {
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
          "تعذر حفظ إنجاز المهمة.",
      },
      { status: 500 }
    );
  }
}
