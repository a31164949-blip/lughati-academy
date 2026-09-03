import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";

type WeeklyStatus =
  | "excellent"
  | "good"
  | "needs-follow-up";

type WeeklySummaryData = {
  success: boolean;

  shouldShow?: boolean;
  parentViewed?: boolean;

  weekKey?: string;
  weekStart?: string;
  weekEnd?: string;

  studentName?: string;

  status?: WeeklyStatus;
  statusLabel?: string;

  readingDays?: number;

  homeworkSubmitted?: number;
  homeworkApproved?: number;

  activityDays?: number;

  weeklyPoints?: number;

  message?: string;
};

/*
|--------------------------------------------------------------------------
| التاريخ والوقت بتوقيت الرياض
|--------------------------------------------------------------------------
*/

function getSaudiParts(date = new Date()) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Riyadh",

        year: "numeric",
        month: "2-digit",
        day: "2-digit",

        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",

        hourCycle: "h23",
      }
    );

  const parts =
    formatter.formatToParts(date);

  const map =
    Object.fromEntries(
      parts.map((part) => [
        part.type,
        part.value,
      ])
    );

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),

    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function toDateKey(
  year: number,
  month: number,
  day: number
) {
  return [
    year.toString().padStart(4, "0"),

    month
      .toString()
      .padStart(2, "0"),

    day
      .toString()
      .padStart(2, "0"),
  ].join("-");
}

/*
|--------------------------------------------------------------------------
| نستخدم تاريخًا افتراضيًا داخليًا للحساب فقط
|--------------------------------------------------------------------------
|
| لا نعتمد عليه كتوقيت محلي للمستخدم.
| نأخذ أولًا التاريخ الحقيقي بتوقيت الرياض،
| ثم نستخدم Date فقط للحساب بين الأيام.
|
*/

function createCalculationDate(
  year: number,
  month: number,
  day: number
) {
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      12,
      0,
      0
    )
  );
}

function addDays(
  date: Date,
  days: number
) {
  const next =
    new Date(date);

  next.setUTCDate(
    next.getUTCDate() + days
  );

  return next;
}

function calculationDateKey(
  date: Date
) {
  return toDateKey(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

/*
|--------------------------------------------------------------------------
| تحديد آخر خميس وصل إلى الساعة 1 ظهرًا
|--------------------------------------------------------------------------
|
| JavaScript:
| الأحد = 0
| الاثنين = 1
| الثلاثاء = 2
| الأربعاء = 3
| الخميس = 4
| الجمعة = 5
| السبت = 6
|
*/

function getCurrentWeeklyReportWindow() {
  const saudi =
    getSaudiParts();

  const today =
    createCalculationDate(
      saudi.year,
      saudi.month,
      saudi.day
    );

  const currentDay =
    today.getUTCDay();

  /*
   * كم يوم نعود للوصول إلى الخميس؟
   */
  let daysBack =
    (currentDay - 4 + 7) % 7;

  /*
   * إذا كان اليوم الخميس
   * لكن قبل الساعة 1 ظهرًا:
   * نعود إلى خميس الأسبوع السابق.
   */
  if (
    currentDay === 4 &&
    saudi.hour < 13
  ) {
    daysBack = 7;
  }

  const reportThursday =
    addDays(
      today,
      -daysBack
    );

  /*
   * أسبوعنا الدراسي:
   * الأحد → الخميس
   */
  const sunday =
    addDays(
      reportThursday,
      -4
    );

  const weekStart =
    calculationDateKey(sunday);

  const weekEnd =
    calculationDateKey(
      reportThursday
    );

  /*
   * مفتاح فريد لكل تقرير أسبوعي.
   */
  const weekKey =
    weekEnd;

  /*
   * إذا لم يصل النظام حتى الآن
   * إلى أول خميس الساعة 1
   * فهذا الشرط يمنع الظهور.
   *
   * عمليًا getCurrentWeeklyReportWindow
   * يعيد دائمًا آخر خميس متاح.
   */
  const shouldShow =
    true;

  return {
    shouldShow,
    weekKey,
    weekStart,
    weekEnd,
  };
}

/*
|--------------------------------------------------------------------------
| التحقق من الطالب
|--------------------------------------------------------------------------
*/

async function getStudentFromRequest(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization?.startsWith(
      "Bearer "
    )
  ) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  const token =
    authorization.slice(7);

  const {
    adminAuth,
  } = getFirebaseAdmin();

  const decodedToken =
    await adminAuth.verifyIdToken(
      token
    );

  if (
    decodedToken.role !==
    "student"
  ) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  const studentDocId =
    typeof decodedToken
      .studentDocId ===
    "string"
      ? decodedToken
          .studentDocId
      : "";

  if (!studentDocId) {
    throw new Error(
      "STUDENT_NOT_FOUND"
    );
  }

  return studentDocId;
}

/*
|--------------------------------------------------------------------------
| استخراج التاريخ من سجل النقاط
|--------------------------------------------------------------------------
*/

function getHistoryDateKey(
  value: unknown
) {
  if (!value) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  try {
    if (
      typeof value ===
        "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (
        value as {
          toDate?: unknown;
        }
      ).toDate ===
        "function"
    ) {
      const date =
        (
          value as {
            toDate: () => Date;
          }
        ).toDate();

      return new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            "Asia/Riyadh",

          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }
      ).format(date);
    }

    if (
      value instanceof Date
    ) {
      return new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            "Asia/Riyadh",

          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }
      ).format(value);
    }
  } catch {
    return "";
  }

  return "";
}

function isWithinWeek(
  date: string,
  start: string,
  end: string
) {
  return (
    date >= start &&
    date <= end
  );
}

/*
|--------------------------------------------------------------------------
| حساب حالة الطالب
|--------------------------------------------------------------------------
*/

function calculateStatus(
  readingDays: number,
  homeworkSubmitted: number,
  homeworkApproved: number,
  activityDays: number
): {
  status: WeeklyStatus;
  label: string;
} {
  let score = 0;

  /*
   * القراءة:
   * حدها الأعلى 5 أيام
   */
  score +=
    Math.min(
      readingDays,
      5
    ) * 4;

  /*
   * النشاط:
   * حد أقصى 5 أيام
   */
  score +=
    Math.min(
      activityDays,
      5
    ) * 3;

  /*
   * الواجب المعتمد
   */
  score +=
    Math.min(
      homeworkApproved,
      5
    ) * 4;

  /*
   * وجود واجبات مرفوعة
   * حتى وإن كانت بانتظار الاعتماد
   */
  if (
    homeworkSubmitted > 0
  ) {
    score += 5;
  }

  if (score >= 40) {
    return {
      status: "excellent",
      label: "ممتاز 🌟",
    };
  }

  if (score >= 22) {
    return {
      status: "good",
      label: "جيد 👍",
    };
  }

  return {
    status:
      "needs-follow-up",

    label:
      "يحتاج متابعة 🌱",
  };
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export async function GET(
  request: Request
) {
  try {
    const studentDocId =
      await getStudentFromRequest(
        request
      );

    const {
      adminDb,
    } = getFirebaseAdmin();

    const {
      shouldShow,
      weekKey,
      weekStart,
      weekEnd,
    } =
      getCurrentWeeklyReportWindow();

    /*
     * مستند واحد لكل طالب
     * لكل أسبوع.
     */
    const summaryRef =
      adminDb
        .collection(
          "weeklyStudentSummaries"
        )
        .doc(
          `${studentDocId}_${weekKey}`
        );

    /*
     * أول قراءة:
     * هل التقرير محسوب أصلًا؟
     */
    const existingSummary =
      await summaryRef.get();

    /*
     * إذا كان موجودًا:
     * لا نعيد قراءة أي سجلات أسبوعية.
     */
    if (
      existingSummary.exists
    ) {
      const data =
        existingSummary.data() ??
        {};

      return NextResponse.json({
        success: true,

        shouldShow:
          shouldShow &&
          data.parentViewed !==
            true,

        parentViewed:
          data.parentViewed ===
          true,

        weekKey,
        weekStart,
        weekEnd,

        studentName:
          typeof data.studentName ===
          "string"
            ? data.studentName
            : "",

        status:
  data.status === "excellent" ||
  data.status === "good" ||
  data.status === "needs-follow-up"
    ? data.status
    : "needs-follow-up",
        statusLabel:
          typeof data.statusLabel ===
          "string"
            ? data.statusLabel
            : "يحتاج متابعة 🌱",

        readingDays:
          typeof data.readingDays ===
          "number"
            ? data.readingDays
            : 0,

        homeworkSubmitted:
          typeof data
            .homeworkSubmitted ===
          "number"
            ? data
                .homeworkSubmitted
            : 0,

        homeworkApproved:
          typeof data
            .homeworkApproved ===
          "number"
            ? data
                .homeworkApproved
            : 0,

        activityDays:
          typeof data.activityDays ===
          "number"
            ? data.activityDays
            : 0,

        weeklyPoints:
          typeof data.weeklyPoints ===
          "number"
            ? data.weeklyPoints
            : 0,
      } satisfies WeeklySummaryData);
    }

    /*
    |--------------------------------------------------------------------------
    | التقرير غير موجود
    | نحسبه مرة واحدة فقط
    |--------------------------------------------------------------------------
    */

    const studentRef =
      adminDb
        .collection(
          "students"
        )
        .doc(studentDocId);

    /*
     * نقرأ بيانات الطالب.
     */
    const studentSnapshot =
      await studentRef.get();

    if (
      !studentSnapshot.exists
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم العثور على الطالب.",
        },
        {
          status: 404,
        }
      );
    }

    const studentData =
      studentSnapshot.data() ??
      {};

    /*
    |--------------------------------------------------------------------------
    | القراءة الأسبوعية
    |--------------------------------------------------------------------------
    */

    const readingSnapshot =
      await adminDb
        .collection(
          "dailyReadingRecords"
        )
        .where(
          "studentId",
          "==",
          studentDocId
        )
        .where(
          "date",
          ">=",
          weekStart
        )
        .where(
          "date",
          "<=",
          weekEnd
        )
        .get();

    const approvedReadingDays =
      new Set<string>();

    readingSnapshot.docs.forEach(
      (document) => {
        const data =
          document.data() ?? {};

        if (
          data.approved !== true
        ) {
          return;
        }

        const date =
          typeof data.date ===
          "string"
            ? data.date
            : "";

        if (
          date &&
          isWithinWeek(
            date,
            weekStart,
            weekEnd
          )
        ) {
          approvedReadingDays.add(
            date
          );
        }
      }
    );

    const readingDays =
      approvedReadingDays.size;

    /*
    |--------------------------------------------------------------------------
    | الواجبات الأسبوعية
    |--------------------------------------------------------------------------
    */

    const homeworkSnapshot =
      await adminDb
        .collection(
          "homeworkCompletions"
        )
        .where(
          "studentId",
          "==",
          studentDocId
        )
        .where(
          "date",
          ">=",
          weekStart
        )
        .where(
          "date",
          "<=",
          weekEnd
        )
        .get();

    let homeworkSubmitted =
      0;

    let homeworkApproved =
      0;

    homeworkSnapshot.docs.forEach(
      (document) => {
        const data =
          document.data() ?? {};

        const solutionUrl =
          typeof data.solutionUrl ===
          "string"
            ? data.solutionUrl.trim()
            : "";

        if (!solutionUrl) {
          return;
        }

        homeworkSubmitted += 1;

        if (
          data.solutionStatus ===
          "approved"
        ) {
          homeworkApproved += 1;
        }
      }
    );

    /*
    |--------------------------------------------------------------------------
    | نشاط الطالب في المهام اليومية
    |--------------------------------------------------------------------------
    */

    const activitySnapshot =
      await adminDb
        .collection(
          "dailyCompletions"
        )
        .where(
          "studentId",
          "==",
          studentDocId
        )
        .where(
          "date",
          ">=",
          weekStart
        )
        .where(
          "date",
          "<=",
          weekEnd
        )
        .get();

    const activeDays =
      new Set<string>();

    activitySnapshot.docs.forEach(
      (document) => {
        const data =
          document.data() ?? {};

        /*
         * نستبعد مستند المكافأة
         * ونحسب اليوم مرة واحدة.
         */
        if (
          typeof data.taskId !==
          "number"
        ) {
          return;
        }

        const date =
          typeof data.date ===
          "string"
            ? data.date
            : "";

        if (date) {
          activeDays.add(date);
        }
      }
    );

    const activityDays =
      activeDays.size;

    /*
    |--------------------------------------------------------------------------
    | نقاط هذا الأسبوع
    |--------------------------------------------------------------------------
    |
    | لا نفتح مجموعة مستقلة.
    | نستفيد من pointsHistory الموجودة
    | أصلًا في مستند الطالب.
    |
    */

    const pointsHistory =
      Array.isArray(
        studentData.pointsHistory
      )
        ? studentData.pointsHistory
        : [];

    let weeklyPoints = 0;

    pointsHistory.forEach(
      (
        entry: Record<
          string,
          unknown
        >
      ) => {
        const date =
          typeof entry.date ===
          "string"
            ? entry.date
            : getHistoryDateKey(
                entry.createdAt
              );

        if (
          !date ||
          !isWithinWeek(
            date,
            weekStart,
            weekEnd
          )
        ) {
          return;
        }

        const points =
          typeof entry.points ===
          "number"
            ? entry.points
            : 0;

        /*
         * لا نحسب القيم السالبة
         * ضمن "النقاط المكتسبة".
         */
        if (points > 0) {
          weeklyPoints += points;
        }
      }
    );

    /*
    |--------------------------------------------------------------------------
    | الحالة العامة
    |--------------------------------------------------------------------------
    */

    const {
      status,
      label: statusLabel,
    } =
      calculateStatus(
        readingDays,
        homeworkSubmitted,
        homeworkApproved,
        activityDays
      );

    /*
    |--------------------------------------------------------------------------
    | اسم الطالب
    |--------------------------------------------------------------------------
    */

    const studentName =
      typeof studentData.name ===
      "string"
        ? studentData.name
        : typeof studentData
            .studentName ===
          "string"
        ? studentData.studentName
        : "";

    /*
    |--------------------------------------------------------------------------
    | حفظ التقرير
    |--------------------------------------------------------------------------
    |
    | هذه هي النقطة المهمة:
    | بعد أول حساب لا نكرر قراءات
    | سجلات الأسبوع عند كل فتح للصفحة.
    |
    */

    await summaryRef.set({
      studentId:
        studentDocId,

      studentName,

      weekKey,
      weekStart,
      weekEnd,

      status,
      statusLabel,

      readingDays,

      homeworkSubmitted,
      homeworkApproved,

      activityDays,

      weeklyPoints,

      parentViewed: false,
      parentViewedAt: null,

      createdAt:
        FieldValue.serverTimestamp(),

      updatedAt:
        FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,

      shouldShow,
      parentViewed: false,

      weekKey,
      weekStart,
      weekEnd,

      studentName,

      status,
      statusLabel,

      readingDays,

      homeworkSubmitted,
      homeworkApproved,

      activityDays,

      weeklyPoints,
    } satisfies WeeklySummaryData);
  } catch (error) {
    console.error(
      "Weekly summary GET error:",
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
        {
          status: 401,
        }
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
        {
          status: 403,
        }
      );
    }

    if (
      message ===
      "STUDENT_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم العثور على الطالب.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "تعذر تحميل موجز الأسبوع.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
|
| تسجيل:
| "لقد اطّلعت على مستوى ابني"
|
*/

export async function POST(
  request: Request
) {
  try {
    const studentDocId =
      await getStudentFromRequest(
        request
      );

    const {
      adminDb,
    } = getFirebaseAdmin();

    const {
      weekKey,
    } =
      getCurrentWeeklyReportWindow();

    const summaryRef =
      adminDb
        .collection(
          "weeklyStudentSummaries"
        )
        .doc(
          `${studentDocId}_${weekKey}`
        );

    const summarySnapshot =
      await summaryRef.get();

    if (
      !summarySnapshot.exists
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم إنشاء موجز الأسبوع بعد.",
        },
        {
          status: 404,
        }
      );
    }

    const summaryData =
      summarySnapshot.data() ??
      {};

    /*
     * إذا سبق الاطلاع:
     * لا نكتب مرة أخرى.
     */
    if (
      summaryData.parentViewed ===
      true
    ) {
      return NextResponse.json({
        success: true,
        alreadyViewed: true,
      });
    }

    await summaryRef.update({
      parentViewed: true,

      parentViewedAt:
        FieldValue.serverTimestamp(),

      updatedAt:
        FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      parentViewed: true,
    });
} catch (error) {
  console.error(
    "❌ خطأ weekly-summary GET:",
    error
  );

  const errorMessage =
    error instanceof Error
      ? error.message
      : "خطأ غير معروف";

  return NextResponse.json(
    {
      success: false,
      message: errorMessage,
    },
    {
      status: 500,
    }
  );
}
}