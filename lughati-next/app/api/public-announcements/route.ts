import { unstable_cache } from "next/cache";
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

type PublicAnnouncementsPayload = {
  success: true;
  announcements: PublicAnnouncement[];
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

function jsonWithCache(
  payload: PublicAnnouncementsPayload,
  cacheState: "HIT" | "MISS" | "STALE"
) {
  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control":
        "no-store",
      "X-Announcements-Cache": cacheState,
    },
  });
}

async function loadPublicContent(): Promise<PublicAnnouncementsPayload> {
    const { adminDb } = getFirebaseAdmin();

    /*
      نقرأ الإعلانات المنشورة فقط بدل قراءة المجموعة كاملة،
      ثم نرتبها محليًا حتى لا نحتاج إلى فهرس مركب إضافي.
    */
    const snapshot = await adminDb
      .collection("announcements")
      .where("published", "==", true)
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

            published: true,

            createdAt: toMillis(data.createdAt),

            updatedAt: toMillis(data.updatedAt),
          };
        })
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

    const payload: PublicAnnouncementsPayload = {
      success: true,
      announcements,
    };

    return payload;
}

const getCachedContent = unstable_cache(loadPublicContent, ["public-announcements-v2"], { revalidate: 300, tags: ["public-announcements"] });

export async function GET() {
  try {
    return jsonWithCache(await getCachedContent(), "HIT");
  } catch (error) {
    console.error("Public content error:", error);
    return NextResponse.json(
      {
        success: false,
        announcements: [],
        message:
          "تعذر تحميل إعلانات الأكاديمية.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Announcements-Cache": "ERROR",
        },
      }
    );
  }
}
