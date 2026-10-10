"use client";
import { getDocs, queryEqual, type Query, type QuerySnapshot, type DocumentData } from "firebase/firestore";
import { auth } from "../../firebase";

// Coalesce only overlapping reads. Do not cache completed snapshots or persist
// student/teacher data; a subsequent visit always gets fresh server data.
const pending: { uid: string; query: Query; promise: Promise<QuerySnapshot> }[] = [];
export function getDocsOnce<T extends DocumentData>(source: Query<T>): Promise<QuerySnapshot<T>> {
  const uid = auth.currentUser?.uid;
  if (!uid) return getDocs(source);
  const existing = pending.find(entry => entry.uid === uid && queryEqual(entry.query, source));
  if (existing) return existing.promise as Promise<QuerySnapshot<T>>;
  const promise = getDocs(source);
  const entry = { uid, query: source, promise };
  pending.push(entry);
  void promise.then(() => remove(), () => remove());
  function remove() { const index = pending.indexOf(entry); if (index >= 0) pending.splice(index, 1); }
  return promise;
}
