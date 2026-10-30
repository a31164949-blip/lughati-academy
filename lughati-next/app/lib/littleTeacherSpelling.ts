export const LITTLE_TEACHER_LESSON = "علم بلادي";
export const LITTLE_TEACHER_SOURCE = "little-teacher-spelling";
export function littleTeacherWord(value: unknown): string {
  if (typeof value !== "string") throw Error("INVALID_WORD");
  const word = value.normalize("NFC").trim().replace(/\u0640/g, "");
  if (word.length > 40 || !/^[\u0621-\u063A\u0641-\u064A\u064B-\u065F\u0670\u0671]+$/.test(word) || !/[\u0621-\u063A\u0641-\u064A\u0671]/.test(word)) throw Error("INVALID_WORD");
  return word;
}

export type LittleTeacherLesson = { title: string; lessonId: string; revision: string };
export const LITTLE_TEACHER_CONFIG_TAG = "little-teacher-lesson-v1";
export const LITTLE_TEACHER_SETTINGS_ID = "littleTeacherSpelling";
export function littleTeacherLessonTitle(value: unknown): string {
  if (typeof value !== "string" || /[\u0000-\u001F\u007F<>]/.test(value)) throw Error("INVALID_TITLE");
  const title = value.normalize("NFC").trim().replace(/\s+/g, " ");
  if (!title || title.length > 80) throw Error("INVALID_TITLE");
  return title;
}
export function readLittleTeacherLesson(value: unknown): LittleTeacherLesson {
  const saved = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const validId = (id: unknown): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(id);
  try {
    if (validId(saved.lessonId) && validId(saved.revision)) return { title: littleTeacherLessonTitle(saved.title), lessonId: saved.lessonId, revision: saved.revision };
  } catch { /* Fall back for the initial, unconfigured lesson only. */ }
  return { title: LITTLE_TEACHER_LESSON, lessonId: "alam-biladi", revision: "default" };
}
