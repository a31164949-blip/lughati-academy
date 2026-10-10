import { unstable_cache } from "next/cache";
import { FieldPath } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebase-admin";

export const runtime = "nodejs";
const fields = {
  plan: ["weekTitle", "weeklyChallenge", "farisMessage", "days", "published"],
  diary: ["title", "description", "imageUrl", "date", "isPublished", "learnedToday", "teacherMessage", "starStudents", "starOfDay", "starStudentId", "starStudentName", "starPersonalPhotoUrl", "starSelectedAvatarIcon"],
  heroes: ["studentId", "studentFirstName", "title", "badge", "achievementsCount", "imageUrl", "photoConsent", "published", "weeklyTrack"],
  highlights: ["row"],
} as const;
type Kind = keyof typeof fields | "latestDiary";
function project(kind: Kind, id: string, data: FirebaseFirestore.DocumentData) {
  return { id, data: Object.fromEntries(fields[kind === "latestDiary" ? "diary" : kind].filter(key => data[key] !== undefined).map(key => [key, data[key]])) };
}
async function load(kind: Kind, cursor: string) {
  const { adminDb } = getFirebaseAdmin();
  if (kind === "plan") {
    const snapshot = await adminDb.collection("weeklyPlans").doc("current").get();
    return { documents: snapshot.exists && snapshot.data()?.published === true ? [project(kind, snapshot.id, snapshot.data()!)] : [], nextCursor: null };
  }
  const collection = (kind === "diary" || kind === "latestDiary") ? "classDiary" : kind === "heroes" ? "academyHeroes" : "galleryHighlights";
  let query: FirebaseFirestore.Query = adminDb.collection(collection);
  if (kind === "diary" || kind === "latestDiary") query = query.where("isPublished", "==", true);
  if (kind === "heroes") query = query.where("published", "==", true);
  if (kind === "latestDiary") {
    const snapshot = await query.orderBy("createdAt", "desc").limit(1).get();
    return { documents: snapshot.docs.map(doc => project(kind, doc.id, doc.data())), nextCursor: null };
  }
  if (kind === "diary") {
    query = query.orderBy("createdAt", "desc");
    if (cursor) {
      const previous = await adminDb.collection(collection).doc(cursor).get();
      if (!previous.exists || !previous.get("createdAt")) throw new Error("CURSOR_EXPIRED");
      query = query.startAfter(previous);
    }
    const snapshot = await query.limit(20).get();
    return { documents: snapshot.docs.map(doc => project(kind, doc.id, doc.data())), nextCursor: snapshot.size === 20 ? snapshot.docs.at(-1)!.id : null };
  }
  const snapshot = await query.orderBy(FieldPath.documentId()).get();
  return { documents: snapshot.docs.map(doc => project(kind, doc.id, doc.data())), nextCursor: null };
}
const cachedLoad = unstable_cache(load, ["shared-public-content-v1"], { revalidate: 300, tags: ["shared-public-content"] });
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind") as Kind;
  const cursor = params.get("cursor") || "";
  if ((!Object.hasOwn(fields, kind) && kind !== "latestDiary") || cursor.length > 1500 || cursor.includes("/")) return NextResponse.json({ success: false }, { status: 400 });
  try {
    return NextResponse.json({ success: true, ...await cachedLoad(kind, cursor) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Public content load failed", error);
    return NextResponse.json({ success: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
