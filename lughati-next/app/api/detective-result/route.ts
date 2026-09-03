import { NextResponse } from "next/server";
import {
  FieldValue,
} from "firebase-admin/firestore";

import { getFirebaseAdmin } from "../../../firebase-admin";

const CHALLENGE_ID =
  "detective-2026-09-04";

const EVENT_DATE =
  "2026-09-04";

const EVENT_START_AT =
  "2026-09-04T00:00:00+03:00";

const EVENT_END_AT =
  "2026-09-05T16:00:00+03:00";

const VALID_GRADES =
  new Set(["2", "3", "4", "5", "6"]);

type ParticipantType =
  | "student"
  | "visitor";

function riyadhDate() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(new Date());
}

function cleanText(
  value: unknown,
  maxLength: number
) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

function normalizeName(
  value: string
) {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as {
        challengeId?: unknown;
        participantType?: unknown;
        visitorId?: unknown;
        studentId?: unknown;
        name?: unknown;
        grade?: unknown;
        durationSeconds?: unknown;
        preview?: unknown;
      };

    const challengeId =
      cleanText(
        body.challengeId,
        60
      );

    const participantType:
      ParticipantType =
      body.participantType ===
      "student"
        ? "student"
        : "visitor";

    const visitorId =
      cleanText(
        body.visitorId,
        100
      );

    const studentId =
      cleanText(
        body.studentId,
        100
      );

    const name =
      cleanText(
        body.name,
        40
      );

    const grade =
      cleanText(
        body.grade,
        2
      );

    const durationSeconds =
      Number(
        body.durationSeconds
      );

    const preview =
      body.preview === true;

    /*
      التحقق العام لا يفرض visitorId،
      لأن طالب الأكاديمية يرسل studentId بدلًا منه.
    */
    if (
      challengeId !==
        CHALLENGE_ID ||
      !name ||
      !VALID_GRADES.has(
        grade
      ) ||
      !Number.isFinite(
        durationSeconds
      ) ||
      durationSeconds < 1 ||
      durationSeconds > 3600
    ) {
      return NextResponse.json(
        {
          error:
            "بيانات النتيجة غير مكتملة أو غير صحيحة.",
        },
        { status: 400 }
      );
    }

    /*
      وضع المعاينة لا يقرأ ولا يكتب أي شيء
      في Firestore، سواء كان المستخدم طالبًا
      أو زائرًا.
    */
    if (preview) {
      return NextResponse.json({
        ok: true,
        preview: true,
        totalPoints: null,
        message:
          "🧪 نتيجة معاينة فقط — لم تُحفظ في الترتيب الرسمي.",
      });
    }

    const nowMs =
      Date.now();

    const eventIsOpen =
      nowMs >=
        Date.parse(
          EVENT_START_AT
        ) &&
      nowMs <
        Date.parse(
          EVENT_END_AT
        );

    if (!eventIsOpen) {
      return NextResponse.json(
        {
          error:
            "التحدي الرسمي مغلق الآن. انتهى السبت الساعة 4:00 مساءً بتوقيت الرياض.",
        },
        { status: 403 }
      );
    }

    if (
      participantType ===
        "student" &&
      !studentId
    ) {
      return NextResponse.json(
        {
          error:
            "تعذر التحقق من حساب طالب الأكاديمية.",
        },
        { status: 400 }
      );
    }

    if (
      participantType ===
        "visitor" &&
      !visitorId
    ) {
      return NextResponse.json(
        {
          error:
            "تعذر التحقق من هوية الزائر.",
        },
        { status: 400 }
      );
    }

    const { adminDb } =
      getFirebaseAdmin();

    /*
      طالب الأكاديمية:
      قراءة واحدة فقط للتحقق من أن studentId
      حقيقي ومطابق لاسم الطالب، ثم نستخدم نفس
      القراءة للحصول على رصيده الحالي.
    */
    let verifiedStudent =
      false;

    let officialStudentName =
      name;

    let currentStudentPoints:
      number | null = null;

    if (
      participantType ===
      "student"
    ) {
      const studentRef =
        adminDb
          .collection(
            "students"
          )
          .doc(
            studentId
          );

      const studentSnapshot =
        await studentRef.get();

      if (
        !studentSnapshot.exists
      ) {
        return NextResponse.json(
          {
            error:
              "لم يتم العثور على حساب الطالب في الأكاديمية.",
          },
          { status: 403 }
        );
      }

      const studentData =
        studentSnapshot.data();

      const savedStudentName =
        cleanText(
          studentData?.studentName,
          40
        );

      const isArchived =
        studentData?.archived ===
        true;

      const isActive =
        studentData?.active !==
        false;

      if (
        !savedStudentName ||
        normalizeName(
          savedStudentName
        ) !==
          normalizeName(
            name
          ) ||
        isArchived ||
        !isActive
      ) {
        return NextResponse.json(
          {
            error:
              "بيانات حساب الطالب لا تطابق سجل الأكاديمية.",
          },
          { status: 403 }
        );
      }

      verifiedStudent = true;
      officialStudentName =
        savedStudentName;

      currentStudentPoints =
        typeof studentData
          ?.points ===
        "number"
          ? studentData.points
          : 0;
    }

    /*
      معرّف النتيجة ثابت:
      تحدٍ واحد + مشارك واحد = محاولة رسمية واحدة.
      لا نحتاج query للبحث عن التكرار.
    */
    const rawParticipantId =
      participantType ===
      "student"
        ? studentId
        : visitorId;

    const safeParticipantId =
      rawParticipantId.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );

    if (!safeParticipantId) {
      return NextResponse.json(
        {
          error:
            "تعذر إنشاء معرّف آمن للمشارك.",
        },
        { status: 400 }
      );
    }

    const resultRef =
      adminDb
        .collection(
          "communityChallengeResults"
        )
        .doc(
          `${CHALLENGE_ID}_${participantType}_${safeParticipantId}`
        );

    const resultSnapshot =
      await resultRef.get();

    if (
      resultSnapshot.exists
    ) {
      const existing =
        resultSnapshot.data();

      return NextResponse.json({
        ok: true,
        duplicate: true,
        totalPoints:
          participantType ===
          "student"
            ? currentStudentPoints
            : null,
        message:
          "لديك محاولة رسمية محفوظة مسبقًا لهذه القضية.",
        durationSeconds:
          existing?.durationSeconds ??
          null,
      });
    }

    /*
      أثناء التحدي نحفظ النتيجة فقط.
      نقاط 5 / 3 / 2 / 1 تُمنح لاحقًا
      بعد انتهاء اليوم واعتماد الترتيب.
    */
    await resultRef.set({
      challengeId:
        CHALLENGE_ID,

      participantType,

      visitorId:
        participantType ===
        "visitor"
          ? safeParticipantId
          : "",

      studentId:
        participantType ===
        "student"
          ? studentId
          : "",

      verifiedStudent:
        participantType ===
        "student"
          ? verifiedStudent
          : false,

      name:
        participantType ===
        "student"
          ? officialStudentName
          : name,

      grade,

      durationSeconds:
        Math.round(
          durationSeconds
        ),

      correct: true,

      pointsAwarded: 0,

      pointsFinalized:
        false,

      completedAt:
        FieldValue.serverTimestamp(),

      eventDate:
        EVENT_DATE,
    });

    /*
      لطالب الأكاديمية لا توجد قراءة إضافية:
      رصيده جاء من قراءة التحقق نفسها.

      للزائر فقط نقرأ وثيقة الرصيد الحالية
      حتى يظهر له رصيد مجتمع لغتي بعد الحل.
    */
    if (
      participantType ===
      "student"
    ) {
      return NextResponse.json({
        ok: true,
        participantType:
          "student",
        totalPoints:
          currentStudentPoints,
        message:
          "✅ تم حفظ وقتك رسميًا باسم حسابك في الأكاديمية. تُضاف نقاطك بعد اعتماد الترتيب النهائي.",
      });
    }

    const visitorRef =
      adminDb
        .collection(
          "communityVisitors"
        )
        .doc(
          safeParticipantId
        );

    const visitorSnapshot =
      await visitorRef.get();

    const totalPoints =
      visitorSnapshot.exists &&
      typeof visitorSnapshot
        .data()?.totalPoints ===
        "number"
        ? visitorSnapshot
            .data()?.totalPoints
        : 0;

    return NextResponse.json({
      ok: true,
      participantType:
        "visitor",
      totalPoints,
      message:
        "✅ تم حفظ وقتك رسميًا. تُوزّع نقاط المراكز بعد إغلاق التحدي حتى يكون الترتيب عادلًا.",
    });
  } catch (error) {
    console.error(
      "detective-result POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "تعذر حفظ النتيجة الآن. حاول مرة أخرى.",
      },
      { status: 500 }
    );
  }
}
