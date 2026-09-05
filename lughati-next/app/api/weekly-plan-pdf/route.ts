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

const fontPath = path.join(
  process.cwd(),
  "public",
  "fonts",
  "NotoNaskhArabic-VariableFont_wght.ttf"
);

Font.register({
  family: "NotoNaskhArabic",
  src: fontPath,
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoNaskhArabic",
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 30,
    backgroundColor: "#ffffff",
    direction: "rtl",
  },

  header: {
    paddingBottom: 15,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#059669",
    textAlign: "center",
  },

  academyName: {
    fontSize: 20,
    color: "#047857",
    textAlign: "center",
    marginBottom: 4,
  },

  title: {
    fontSize: 16,
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "center",
  },

  specialBox: {
    borderWidth: 1,
    borderColor: "#d1fae5",
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },

  challengeBox: {
    borderWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },

 specialTitle: {
  fontSize: 12,
  color: "#065f46",
  textAlign: "right",
  marginBottom: 4,
},

  challengeTitle: {
  fontSize: 12,
  color: "#92400e",
  textAlign: "right",
  marginBottom: 4,
},

  specialText: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.7,
    textAlign: "right",
  },

  dayCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 9,
    marginBottom: 10,
    overflow: "hidden",
  },

  dayHeader: {
    backgroundColor: "#047857",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  dayTitle: {
    color: "#ffffff",
    fontSize: 13,
    textAlign: "right",
  },

  dayBody: {
    padding: 10,
  },

  row: {
    flexDirection: "row-reverse",
    marginBottom: 5,
    alignItems: "flex-start",
  },

  label: {
    width: 92,
    fontSize: 9.5,
    color: "#047857",
    textAlign: "right",
  },

  value: {
    flex: 1,
    fontSize: 9.5,
    color: "#1e293b",
    textAlign: "right",
    lineHeight: 1.6,
  },

  bringBox: {
    marginTop: 5,
    padding: 7,
    backgroundColor: "#eff6ff",
    borderRadius: 6,
  },

  footer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },

  footerText: {
    fontSize: 8.5,
    color: "#64748b",
    textAlign: "center",
  },
});

function safeText(value: unknown) {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : "—";
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
          "نتعلّم، نقرأ، نبدع"
        )
      ),

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
              farisMessage
            )
          )
        : null,

      weeklyChallenge
        ? React.createElement(
            View,
            {
              style: styles.challengeBox,
            },
            React.createElement(
              Text,
              {
                style:
                  styles.challengeTitle,
              },
              "تحدي الأسبوع"
            ),
            React.createElement(
              Text,
              {
                style: styles.specialText,
              },
              weeklyChallenge
            )
          )
        : null,

      ...days.map((item) =>
        React.createElement(
          View,
          {
            key: item.day,
            style: styles.dayCard,
            wrap: false,
          },

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
              item.day
            )
          ),

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

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as
        WeeklyPlanPayload;

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

   const document = PlanDocument({
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