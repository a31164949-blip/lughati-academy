import "server-only";
import { unstable_cache } from "next/cache";
import { getFirebaseAdmin } from "../../firebase-admin";
import { LITTLE_TEACHER_CONFIG_TAG, LITTLE_TEACHER_SETTINGS_ID, readLittleTeacherLesson } from "./littleTeacherSpelling";
export const getLittleTeacherLesson = unstable_cache(async () => {
  const snapshot = await getFirebaseAdmin().adminDb.collection("settings").doc(LITTLE_TEACHER_SETTINGS_ID).get();
  return readLittleTeacherLesson(snapshot.data());
}, ["little-teacher-lesson-settings-v1"], { revalidate: 600, tags: [LITTLE_TEACHER_CONFIG_TAG] });
