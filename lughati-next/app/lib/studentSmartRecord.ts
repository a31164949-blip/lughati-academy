import "server-only";
import { unstable_cache } from "next/cache";
import { getFirebaseAdmin } from "../../firebase-admin";
import { smartRecordClassroom, smartRecordCacheTag, validSmartRecordDate, studentFollowUpFromSmartRecord } from "./studentSmartFollowUp";

// One cached class record is shared by all students. Only the requesting
// student's allowlisted follow-up is returned by the API.
export async function getStudentSmartRecordFollowUp(studentId: string, student: Record<string, unknown>, today: string) {
  const classroom = smartRecordClassroom(student.classroom);
  if (!classroom) return null;
  const db = getFirebaseAdmin().adminDb;
  const latestDate = await unstable_cache(async () => {
    const pointer = await db.collection("smartRecords").doc("latest_" + classroom).get();
    const date = pointer.data()?.latestSmartRecordDate;
    return validSmartRecordDate(date) ? date : null;
  }, ["smart-record-latest-v1", classroom], { revalidate: 600, tags: [smartRecordCacheTag(classroom)] })();
  const saved = student.smartFollowUp as { date?: unknown } | undefined;
  const dates = [...new Set([latestDate, today, saved?.date].filter(validSmartRecordDate))].sort((a,b) => b.localeCompare(a));
  for (const date of dates) {
    const data = await unstable_cache(async () => {
      const snapshot = await db.collection("smartRecords").doc(date + "_" + classroom).get();
      const day = snapshot.data();
      // Avoid putting Firestore Timestamp instances into the shared cache.
      return day ? { date, readingTitle: day.readingTitle ?? "", spellingTitle: day.spellingTitle ?? day.spellingTextName ?? "", spellingWordCount: day.spellingWordCount ?? null,
        records: Array.isArray(day.records) ? day.records.filter((row: unknown) => row && typeof row === "object" && !Array.isArray(row)).map((row: Record<string, unknown>) => ({
          studentId: row.studentId ?? "", attendance: row.attendance ?? "present",
          homeworkLevel: row.homeworkLevel ?? "", homeworkCompleted: row.homeworkCompleted === true,
          readingErrors: row.readingErrors ?? null, readingLevel: row.readingLevel ?? "", readingKing: row.readingKing === true,
          spellingErrors: row.spellingErrors ?? null, spellingLevel: row.spellingLevel ?? "", spellingKing: row.spellingKing === true,
          note: typeof row.note === "string" ? row.note : "",
        })) : [] } : null;
    }, ["smart-record-day-v1", classroom, date], { revalidate: 600, tags: [smartRecordCacheTag(classroom)] })();
    const followUp = studentFollowUpFromSmartRecord(data, studentId);
    if (followUp) return followUp;
  }
  return null;
}
