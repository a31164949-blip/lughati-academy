"use client";
import { collection, query, where, limit, startAfter, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { getDocsOnce } from "./firestoreReadOnce";

export type ReviewCursor = {
  journey?: QueryDocumentSnapshot;
  homework?: QueryDocumentSnapshot;
  journeyDone: boolean;
  homeworkDone: boolean;
};
export const READING_REVIEW_PAGE_SIZE = 50;
export async function readReadingReviewPage(scope: "pending" | "all", cursor: ReviewCursor) {
  const readPage = (name: string, field: string, after: QueryDocumentSnapshot | undefined, done: boolean) => {
    if (done) return Promise.resolve(null);
    // The implicit document-ID order preserves undated legacy records and needs
    // no composite index. Use the actual snapshot cursor, never an offset.
    return getDocsOnce(query(collection(db, name),
      ...(scope === "pending" ? [where(field, "==", "pending")] : []),
      ...(after ? [startAfter(after)] : []), limit(READING_REVIEW_PAGE_SIZE)));
  };
  const [journeySnapshot, homeworkSnapshot] = await Promise.all([
    readPage("reading-submissions", "status", cursor.journey, cursor.journeyDone),
    readPage("homeworkCompletions", "readingStatus", cursor.homework, cursor.homeworkDone),
  ]);
  const next: ReviewCursor = {
    journey: journeySnapshot?.docs.at(-1) ?? cursor.journey,
    homework: homeworkSnapshot?.docs.at(-1) ?? cursor.homework,
    journeyDone: cursor.journeyDone || (journeySnapshot?.size ?? 0) < READING_REVIEW_PAGE_SIZE,
    homeworkDone: cursor.homeworkDone || (homeworkSnapshot?.size ?? 0) < READING_REVIEW_PAGE_SIZE,
  };
  return { journeySnapshot, homeworkSnapshot, cursor: next, hasMore: !next.journeyDone || !next.homeworkDone };
}
