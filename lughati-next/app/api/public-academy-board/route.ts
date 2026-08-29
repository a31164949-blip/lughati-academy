import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AcademyBoardCategory =
  | "announcement"
  | "event"
  | "competition";

type PublicAcademyMilestone = {
  id: string;
  title: string;
  badgeTitle: string;
  studentName: string;
  pointsReached: number;
  boardVisible: boolean;
  boardStartDate: string;
  boardEndDate: string;
  createdAtMilliseconds: number;
};

type PublicAcademyBoardSlide = {
  id: string;
  title: string;
  message: string;
  category: AcademyBoardCategory;
  icon: string;
  visible: boolean;
  startDate: string;
  endDate: string;
  createdAtMilliseconds: number;
};

type PublicAcademyBoardSettings = {
  enabled: boolean;
  intervalSeconds: number;
  tickerEnabled: boolean;
  tickerText: string;
};

const defaultAcademyBoardSettings: PublicAcademyBoardSettings = {
  enabled: true,
  intervalSeconds: 6,
  tickerEnabled: true,
  tickerText:
    "🌟 كل إنجاز جديد يكتب اسمًا جديدًا في تاريخ أكاديمية لغتي",
};

function toMillis(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (
      value as {
        toMillis: () => number;
      }
    ).toMillis();
  }

  return 0;
}

function getRiyadhDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function GET() {
  try {
    const { adminDb } = getFirebaseAdmin();

    const [
      settingsSnapshot,
      slidesSnapshot,
      milestonesSnapshot,
    ] = await Promise.all([
      adminDb
        .collection("academyBoardSettings")
        .doc("main")
        .get(),

      adminDb
        .collection("academyBoardSlides")
        .get(),

      adminDb
        .collection("academyMilestones")
        .get(),
    ]);

    const settingsData =
      settingsSnapshot.exists
        ? settingsSnapshot.data() ?? {}
        : {};

    const settings: PublicAcademyBoardSettings = {
      enabled:
        settingsData.enabled !== false,

      intervalSeconds:
        typeof settingsData.intervalSeconds === "number" &&
        settingsData.intervalSeconds >= 3
          ? Math.min(
              30,
              settingsData.intervalSeconds
            )
          : defaultAcademyBoardSettings.intervalSeconds,

      tickerEnabled:
        settingsData.tickerEnabled !== false,

      tickerText:
        typeof settingsData.tickerText === "string" &&
        settingsData.tickerText.trim()
          ? settingsData.tickerText
          : defaultAcademyBoardSettings.tickerText,
    };

    const riyadhDateKey =
      getRiyadhDateKey();

    const slides: PublicAcademyBoardSlide[] =
      slidesSnapshot.docs
        .map((document) => {
          const data =
            document.data() ?? {};

          const category: AcademyBoardCategory =
            data.category === "event"
              ? "event"
              : data.category === "competition"
              ? "competition"
              : "announcement";

          return {
            id: document.id,

            title:
              typeof data.title === "string"
                ? data.title
                : "",

            message:
              typeof data.message === "string"
                ? data.message
                : "",

            category,

            icon:
              typeof data.icon === "string" &&
              data.icon.trim()
                ? data.icon
                : category === "event"
                ? "🎉"
                : category === "competition"
                ? "🏆"
                : "📣",

            visible:
              data.visible !== false,

            startDate:
              typeof data.startDate === "string"
                ? data.startDate
                : "",

            endDate:
              typeof data.endDate === "string"
                ? data.endDate
                : "",

            createdAtMilliseconds:
              toMillis(data.createdAt) ||
              toMillis(data.updatedAt),
          };
        })
        .filter((slide) => {
          if (
            !slide.visible ||
            slide.title.trim() === ""
          ) {
            return false;
          }

          const hasStarted =
            !slide.startDate ||
            riyadhDateKey >=
              slide.startDate;

          const hasNotEnded =
            !slide.endDate ||
            riyadhDateKey <=
              slide.endDate;

          return (
            hasStarted &&
            hasNotEnded
          );
        })
        .sort(
          (first, second) =>
            second.createdAtMilliseconds -
            first.createdAtMilliseconds
        );

    const milestones: PublicAcademyMilestone[] =
      milestonesSnapshot.docs
        .map((document) => {
          const data =
            document.data() ?? {};

          return {
            id: document.id,

            title:
              typeof data.title === "string"
                ? data.title
                : "إنجاز جديد في أكاديمية لغتي",

            badgeTitle:
              typeof data.badgeTitle === "string"
                ? data.badgeTitle
                : "",

            studentName:
              typeof data.studentName === "string"
                ? data.studentName
                : "",

            pointsReached:
              typeof data.pointsReached === "number"
                ? data.pointsReached
                : 1,

            boardVisible:
              data.boardVisible !== false,

            boardStartDate:
              typeof data.boardStartDate === "string"
                ? data.boardStartDate
                : "",

            boardEndDate:
              typeof data.boardEndDate === "string"
                ? data.boardEndDate
                : "",

            createdAtMilliseconds:
              toMillis(data.createdAt) ||
              toMillis(data.updatedAt),
          };
        })
        .filter(
          (milestone) =>
            milestone.studentName
              .trim() !== ""
        )
        .sort(
          (first, second) =>
            second.createdAtMilliseconds -
            first.createdAtMilliseconds
        );

    return NextResponse.json({
      success: true,
      settings,
      slides,
      milestones,
    });
  } catch (error) {
    console.error(
      "Public academy board error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        settings:
          defaultAcademyBoardSettings,
        slides: [],
        milestones: [],
        message:
          "تعذر تحميل لوحة الأكاديمية.",
      },
      {
        status: 500,
      }
    );
  }
}
