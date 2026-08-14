import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublicAnnouncement = {
  id: string;
  title: string;
  message: string;
  priority: string;
  pinned: boolean;
  published: boolean;
  createdAt: number;
  updatedAt: number;
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

export async function GET() {
  try {
    const { adminDb } = getFirebaseAdmin();

    const snapshot = await adminDb
      .collection("announcements")
      .get();

    const announcements: PublicAnnouncement[] =
      snapshot.docs
        .map((document) => {
          const data = document.data();

          return {
            id: document.id,

            title:
              typeof data.title === "string"
                ? data.title
                : "إعلان",

            message:
              typeof data.message === "string"
                ? data.message
                : "",

            priority:
              typeof data.priority === "string"
                ? data.priority
                : "normal",

            pinned: data.pinned === true,

            published: data.published === true,

            createdAt: toMillis(data.createdAt),

            updatedAt: toMillis(data.updatedAt),
          };
        })
        .filter(
          (announcement) =>
            announcement.published
        )
        .sort((a, b) => {
          if (a.pinned !== b.pinned) {
            return a.pinned ? -1 : 1;
          }

          if (
            a.priority === "high" &&
            b.priority !== "high"
          ) {
            return -1;
          }

          if (
            b.priority === "high" &&
            a.priority !== "high"
          ) {
            return 1;
          }

          return (
            Math.max(
              b.updatedAt,
              b.createdAt
            ) -
            Math.max(
              a.updatedAt,
              a.createdAt
            )
          );
        });

    return NextResponse.json({
      success: true,
      announcements,
    });
  } catch (error) {
    console.error(
      "Public announcements error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        announcements: [],
        message:
          "تعذر تحميل إعلانات الأكاديمية.",
      },
      {
        status: 500,
      }
    );
  }
}