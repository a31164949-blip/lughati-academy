export const LITTLE_TEACHER_LESSON = "علم بلادي";
export const LITTLE_TEACHER_SOURCE = "little-teacher-spelling";
export function littleTeacherWord(value: unknown): string {
  if (typeof value !== "string") throw Error("INVALID_WORD");
  const word = value.normalize("NFC").trim().replace(/\u0640/g, "");
  if (word.length > 40 || !/^[\u0621-\u063A\u0641-\u064A\u064B-\u065F\u0670\u0671]+$/.test(word) || !/[\u0621-\u063A\u0641-\u064A\u0671]/.test(word)) throw Error("INVALID_WORD");
  return word;
}
