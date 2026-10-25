import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { getFirebaseAdmin } from "../../firebase-admin";
import { EMPTY_STUDENT_NOTICE, parseStudentNotice } from "./studentFrontNotice";
export const TAG = 'student-front-notice-v1';
export const readStudentNotice = unstable_cache(async () => {
  const row = await getFirebaseAdmin().adminDb.collection('academyStudentNotices').doc('current').get();
  const notice = row.exists ? parseStudentNotice(row.data()) : EMPTY_STUDENT_NOTICE;
  return { ...notice, noticeId: createHash('sha256').update(JSON.stringify([notice.title, notice.message, notice.href, notice.linkLabel])).digest('hex').slice(0, 32) };
}, [TAG + "-replies-v2"], { revalidate: 300, tags: [TAG] });
