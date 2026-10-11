"use client";
import { collection, query, where, orderBy, limit, startAfter, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { getDocsOnce } from "./firestoreReadOnce";

export type ReviewCursor = {
  weekStart?: Date;
  journey?: QueryDocumentSnapshot;
  homework?: QueryDocumentSnapshot;
  journeyDone: boolean;
  homeworkDone: boolean;
};
export const READING_REVIEW_PAGE_SIZE = 50;
export async function readReadingReviewPage(scope: "recent" | "pending" | "all", cursor: ReviewCursor) {
  // Sunday midnight in Riyadh; keep the boundary fixed across pagination.
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  now.setUTCDate(now.getUTCDate() - now.getUTCDay());
  now.setUTCHours(0, 0, 0, 0);
  const weekStart = cursor.weekStart ?? new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const readPage = (name: string, field: string, after: QueryDocumentSnapshot | undefined, done: boolean) => {
    if (done) return Promise.resolve(null);
    // Archive modes preserve undated legacy records. Recent mode is bounded
    // by the submission timestamp and uses the same field for ordering.
    return getDocsOnce(query(collection(db, name),
      ...(scope === "recent" ? [where("createdAt", ">=", weekStart), orderBy("createdAt", "desc")] : []),
      ...(scope === "pending" ? [where(field, "==", "pending")] : []),
      ...(after ? [startAfter(after)] : []), limit(READING_REVIEW_PAGE_SIZE)));
  };
  const [journeySnapshot, homeworkSnapshot] = await Promise.all([
    readPage("reading-submissions", "status", cursor.journey, cursor.journeyDone),
    readPage("homeworkCompletions", "readingStatus", cursor.homework, cursor.homeworkDone),
  ]);
  const next: ReviewCursor = {
    weekStart,
    journey: journeySnapshot?.docs.at(-1) ?? cursor.journey,
    homework: homeworkSnapshot?.docs.at(-1) ?? cursor.homework,
    journeyDone: cursor.journeyDone || (journeySnapshot?.size ?? 0) < READING_REVIEW_PAGE_SIZE,
    homeworkDone: cursor.homeworkDone || (homeworkSnapshot?.size ?? 0) < READING_REVIEW_PAGE_SIZE,
  };
  return { journeySnapshot, homeworkSnapshot, cursor: next, hasMore: !next.journeyDone || !next.homeworkDone };
}
