/*
  سياسة استقبال أعمال الطلاب
  أكاديمية لغتي الرقمية

  الطالب:
  من 1:00 ظهرًا إلى 10:00 مساءً
  بتوقيت الرياض.

  المعلم:
  لا يخضع لهذا التوقيت.
*/

export const STUDENT_SUBMISSION_TIME_ZONE =
  "Asia/Riyadh";

export const STUDENT_SUBMISSION_OPEN_HOUR =
  13;

export const STUDENT_SUBMISSION_CLOSE_HOUR =
  22;

export const STUDENT_SUBMISSION_OPEN_TEXT =
  "1:00 ظهرًا";

export const STUDENT_SUBMISSION_CLOSE_TEXT =
  "10:00 مساءً";

export const STUDENT_SUBMISSION_CLOSED_MESSAGE =
  "🌙 انتهى وقت استقبال الأعمال لهذا اليوم. تستقبل الأكاديمية أعمالك يوميًا من الساعة 1:00 ظهرًا حتى 10:00 مساءً بتوقيت الرياض. ننتظرك في الوقت المحدد يا بطل ⭐";

export type StudentSubmissionWindowResult = {
  isOpen: boolean;
  hour: number;
  minute: number;
  timeZone: string;
  opensAt: string;
  closesAt: string;
  message: string;
};

/*
  الحصول على الوقت الحالي
  حسب توقيت الرياض، وليس توقيت
  جهاز الطالب أو الخادم.
*/
export function getRiyadhTimeParts(
  date: Date = new Date()
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          STUDENT_SUBMISSION_TIME_ZONE,

        hour:
          "2-digit",

        minute:
          "2-digit",

        hourCycle:
          "h23",
      }
    );

  const parts =
    formatter.formatToParts(date);

  const hour =
    Number(
      parts.find(
        (part) =>
          part.type === "hour"
      )?.value ?? "0"
    );

  const minute =
    Number(
      parts.find(
        (part) =>
          part.type === "minute"
      )?.value ?? "0"
    );

  return {
    hour,
    minute,
  };
}

/*
  هل استقبال أعمال الطلاب
  مفتوح الآن؟
*/
export function isStudentSubmissionWindowOpen(
  date: Date = new Date()
) {
  const {
    hour,
  } =
    getRiyadhTimeParts(date);

  return (
    hour >=
      STUDENT_SUBMISSION_OPEN_HOUR &&
    hour <
      STUDENT_SUBMISSION_CLOSE_HOUR
  );
}

/*
  إرجاع الحالة كاملة.

  يمكن استخدام هذه الدالة
  في صفحات الطالب وكذلك
  في API.
*/
export function getStudentSubmissionWindow(
  date: Date = new Date()
): StudentSubmissionWindowResult {
  const {
    hour,
    minute,
  } =
    getRiyadhTimeParts(date);

  const isOpen =
    hour >=
      STUDENT_SUBMISSION_OPEN_HOUR &&
    hour <
      STUDENT_SUBMISSION_CLOSE_HOUR;

  return {
    isOpen,

    hour,

    minute,

    timeZone:
      STUDENT_SUBMISSION_TIME_ZONE,

    opensAt:
      "13:00",

    closesAt:
      "22:00",

    message:
      isOpen
        ? "استقبال الأعمال متاح الآن ✅"
        : STUDENT_SUBMISSION_CLOSED_MESSAGE,
  };
}

/*
  تستخدم في API.

  إذا كان الإرسال من الطالب
  وخارج الوقت المسموح،
  ترجع false.

  ملاحظة:
  صلاحيات المعلم لا تستخدم
  هذه الدالة عند الاعتماد
  أو المراجعة أو النشر.
*/
export function canStudentSubmitNow(
  date: Date = new Date()
) {
  return isStudentSubmissionWindowOpen(
    date
  );
}