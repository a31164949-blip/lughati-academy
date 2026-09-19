import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import React from "react";
import path from "path";

export const runtime = "nodejs";

type DayPlan = {
  day: string;
  lesson: string;
  objective: string;
  homework: string;
  readingTask: string;
  spellingWords: string;
  bringTomorrow: string;
  teacherNote: string;
};

type WeeklyPlanPayload = {
  weekTitle?: string;
  weeklyChallenge?: string;
  farisMessage?: string;
  classroom?: string;
  days?: DayPlan[];
};

/* =========================================================
   الخط العربي
========================================================= */

const fontPath = path.join(
  process.cwd(),
  "public",
  "fonts",
  "NotoSansArabic-Variable.ttf"
);

Font.register({
  family: "NotoSansArabic",
  fonts: [
    {
      src: fontPath,
      fontWeight: 400,
    },
    {
      src: fontPath,
      fontWeight: 700,
    },
  ],
});

/* =========================================================
   التنسيقات
========================================================= */

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansArabic",
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 28,
    backgroundColor: "#ffffff",
  },

  header: {
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: "#059669",
    textAlign: "center",
  },

  academyName: {
    fontFamily: "NotoSansArabic",
    fontWeight: 700,
    fontSize: 21,
    color: "#047857",
    textAlign: "center",
    lineHeight: 1.5,
    marginBottom: 5,
    paddingHorizontal: 4,
    direction: "rtl",
  },

  title: {
    fontFamily: "NotoSansArabic",
    fontWeight: 700,
    fontSize: 17,
    color: "#0f172a",
    textAlign: "center",
    lineHeight: 1.5,
    marginBottom: 4,
    paddingHorizontal: 4,
    direction: "rtl",
  },

  subtitle: {
    fontFamily: "NotoSansArabic",
    fontWeight: 400,
    fontSize: 10.5,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 1.6,
    paddingHorizontal: 4,
    direction: "rtl",
  },

  specialBox: {
    borderWidth: 1,
    borderColor: "#a7f3d0",
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 9,
  },

  challengeBox: {
    borderWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 9,
  },

  specialTitle: {
    fontFamily: "NotoSansArabic",
    fontWeight: 700,
    fontSize: 12,
    color: "#065f46",
    textAlign: "right",
    lineHeight: 1.6,
    marginBottom: 3,
    paddingHorizontal: 4,
    direction: "rtl",
  },

  challengeTitle: {
    fontFamily: "NotoSansArabic",
    fontWeight: 700,
    fontSize: 12,
    color: "#92400e",
    textAlign: "right",
    lineHeight: 1.6,
    marginBottom: 3,
    paddingHorizontal: 4,
    direction: "rtl",
  },

  specialText: {
    fontFamily: "NotoSansArabic",
    fontWeight: 400,
    fontSize: 10.5,
    color: "#334155",
    textAlign: "right",
    lineHeight: 1.75,
    paddingHorizontal: 4,
    direction: "rtl",
  },

  dayCard: {
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 9,
    marginBottom: 9,
    overflow: "hidden",
  },

  dayHeader: {
    backgroundColor: "#047857",
    paddingVertical: 7,
    paddingHorizontal: 12,
  },

  dayTitle: {
    fontFamily: "NotoSansArabic",
    fontWeight: 700,
    color: "#ffffff",
    fontSize: 14,
    textAlign: "right",
    lineHeight: 1.55,
    paddingHorizontal: 4,
    direction: "rtl",
  },

  dayBody: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  row: {
    flexDirection: "row-reverse",
    marginBottom: 4,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },

  label: {
    width: 115,
    fontFamily: "NotoSansArabic",
    fontWeight: 700,
    fontSize: 10.5,
    color: "#047857",
    textAlign: "right",
    lineHeight: 1.7,
    paddingRight: 6,
    paddingLeft: 4,
    direction: "rtl",
  },

  value: {
    width: 350,
    fontFamily: "NotoSansArabic",
    fontWeight: 400,
    fontSize: 10.5,
    color: "#1e293b",
    textAlign: "right",
    lineHeight: 1.7,
    paddingRight: 14,
    paddingLeft: 10,
    direction: "rtl",
  },

  bringBox: {
    marginTop: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  footer: {
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },

  footerText: {
    fontFamily: "NotoSansArabic",
    fontWeight: 400,
    fontSize: 8.5,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 1.6,
    paddingHorizontal: 4,
    direction: "rtl",
  },
});

/* =========================================================
   أدوات مساعدة
========================================================= */

function safeText(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return "—";
  }

  return value
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ");
}

function createRow(
  label: string,
  value: string
) {
  return React.createElement(
    View,
    {
      style: styles.row,
    },

    React.createElement(
      Text,
      {
        style: styles.label,
      },
      `${label}:`
    ),

    React.createElement(
      Text,
      {
        style: styles.value,
      },
      safeText(value)
    )
  );
}

/* =========================================================
   مستند الخطة
========================================================= */

function PlanDocument({
  weekTitle,
  weeklyChallenge,
  farisMessage,
  classroom,
  days,
}: {
  weekTitle: string;
  weeklyChallenge: string;
  farisMessage: string;
  classroom: string;
  days: DayPlan[];
}) {
  return React.createElement(
    Document,
    null,

    React.createElement(
      Page,
      {
        size: "A4",
        style: styles.page,
      },

      /* رأس الصفحة */

      React.createElement(
        View,
        {
          style: styles.header,
        },

        React.createElement(
          Text,
          {
            style: styles.academyName,
          },
          "أكاديمية لغتي الرقمية"
        ),

        React.createElement(
          Text,
          {
            style: styles.title,
          },
          weekTitle
        ),

        classroom
          ? React.createElement(
              Text,
              {
                style: styles.subtitle,
              },
              classroom
            )
          : null,

        React.createElement(
          Text,
          {
            style: styles.subtitle,
          },
          "تعلّم، اقرأ، أبدع"
        )
      ),

      /* رسالة فارس */

      farisMessage
        ? React.createElement(
            View,
            {
              style: styles.specialBox,
            },

            React.createElement(
              Text,
              {
                style: styles.specialTitle,
              },
              "رسالة فارس"
            ),

            React.createElement(
              Text,
              {
                style: styles.specialText,
              },
              safeText(farisMessage)
            )
          )
        : null,

      /* تحدي الأسبوع */

      weeklyChallenge
        ? React.createElement(
            View,
            {
              style: styles.challengeBox,
            },

            React.createElement(
              Text,
              {
                style: styles.challengeTitle,
              },
              "تحدي الأسبوع"
            ),

            React.createElement(
              Text,
              {
                style: styles.specialText,
              },
              safeText(weeklyChallenge)
            )
          )
        : null,

      /* أيام الأسبوع */

      ...days.map((item) =>
        React.createElement(
          View,
          {
            key: item.day,
            style: styles.dayCard,
            wrap: false,
          },

          /* اسم اليوم */

          React.createElement(
            View,
            {
              style: styles.dayHeader,
            },

            React.createElement(
              Text,
              {
                style: styles.dayTitle,
              },
              safeText(item.day)
            )
          ),

          /* بيانات اليوم */

          React.createElement(
            View,
            {
              style: styles.dayBody,
            },

            createRow(
              "الدرس",
              item.lesson
            ),

            createRow(
              "الهدف",
              item.objective
            ),

            createRow(
              "الواجب",
              item.homework
            ),

            createRow(
              "مهمة القراءة",
              item.readingTask
            ),

            createRow(
              "كلمات الإملاء",
              item.spellingWords
            ),

            item.bringTomorrow
              ? React.createElement(
                  View,
                  {
                    style:
                      styles.bringBox,
                  },

                  createRow(
                    "ماذا أحضر غدًا؟",
                    item.bringTomorrow
                  )
                )
              : null,

            item.teacherNote
              ? createRow(
                  "ملاحظة المعلم",
                  item.teacherNote
                )
              : null
          )
        )
      ),

      /* التذييل */

      React.createElement(
        View,
        {
          style: styles.footer,
        },

        React.createElement(
          Text,
          {
            style: styles.footerText,
          },
          "أكاديمية لغتي الرقمية — تعلّم، اقرأ، أبدع"
        )
      )
    )
  );
}

/* =========================================================
   API
========================================================= */

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as WeeklyPlanPayload;

    const weekTitle =
      safeText(body.weekTitle);

    const weeklyChallenge =
      typeof body.weeklyChallenge ===
      "string"
        ? body.weeklyChallenge.trim()
        : "";

    const farisMessage =
      typeof body.farisMessage ===
      "string"
        ? body.farisMessage.trim()
        : "";

    const classroom =
      typeof body.classroom ===
      "string"
        ? body.classroom.trim()
        : "";

    const days =
      Array.isArray(body.days)
        ? body.days
        : [];

    if (days.length === 0) {
      return Response.json(
        {
          error:
            "لا توجد أيام في الخطة لإنشاء ملف PDF.",
        },
        {
          status: 400,
        }
      );
    }

    const document =
      PlanDocument({
        weekTitle,
        weeklyChallenge,
        farisMessage,
        classroom,
        days,
      });

    const pdfInstance =
      pdf(document);

    const blob =
      await pdfInstance.toBlob();

    const arrayBuffer =
      await blob.arrayBuffer();

    const safeFileName =
      weekTitle
        .replace(
          /[\\/:*?"<>|]/g,
          ""
        )
        .replace(/\s+/g, "-");

    return new Response(
      arrayBuffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename*=UTF-8''${encodeURIComponent(
              `الخطة-الأسبوعية-${safeFileName}.pdf`
            )}`,

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "weekly-plan-pdf error:",
      error
    );

    return Response.json(
      {
        error:
          "تعذر إنشاء ملف PDF للخطة الأسبوعية.",
      },
      {
        status: 500,
      }
    );
  }
}