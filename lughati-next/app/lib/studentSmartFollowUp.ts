export type SmartRecordAwardLevel = "prince" | "hero" | "star" | "diligent" | "not-evaluated";
export type StudentSmartFollowUp = {
  date: string;
  attendance: "present" | "absent" | "late";
  attendanceLabel: string;
  readingKing: boolean;
  spellingKing: boolean;
  homeworkLabel: string;
  readingTitle: string;
  readingErrors: number | null;
  readingLevelLabel: string;
  spellingTitle: string;
  spellingWordCount: number | null;
  spellingErrors: number | null;
  spellingLevelLabel: string;
  note: string;
};
export function smartRecordClassroom(value: unknown): "second-a" | "second-b" | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/الابتدائي/g, "").replace(/\s+/g, " ").trim();
  if (text === "second-a" || text.includes("الثاني أ") || text.includes("الثاني ا")) return "second-a";
  if (text === "second-b" || text.includes("الثاني ب")) return "second-b";
  return null;
}
export function validSmartRecordDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value + "T12:00:00Z")) && new Date(value + "T12:00:00Z").toISOString().slice(0,10) === value;
}
export const smartRecordCacheTag = (classroom: string) => "smart-record-follow-up:" + classroom;
export function getSmartRecordAwardLevel(errors: number | null): SmartRecordAwardLevel {
  if (errors === null) return "not-evaluated";
  return errors === 0 ? "prince" : errors <= 2 ? "hero" : errors === 3 ? "star" : "diligent";
}
export function getSmartRecordAwardLabel(level: SmartRecordAwardLevel, kind: "reading" | "spelling") {
  const subject = kind === "reading" ? "القراءة" : "الإملاء";
  if (level === "prince") return `🌟 أمير ${subject}`;
  if (level === "hero") return `🏅 بطل ${subject}`;
  if (level === "star") return `⭐ نجم ${subject}`;
  if (level === "diligent") return `🌱 مجتهد ${subject}`;
  return "— لم يُقيّم";
}
export function oldSmartRecordErrors(level: unknown): number | null {
  if (level === "mastered") return 0;
  if (level === "very-good") return 1;
  if (level === "good") return 3;
  if (level === "needs-practice" || level === "intensive-support") return 4;
  return null;
}
function errors(value: unknown, oldLevel: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : oldSmartRecordErrors(oldLevel);
}
function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
export function normalizeStudentSmartFollowUp(value: unknown): StudentSmartFollowUp | null {
  const saved = record(value);
  if (!saved || !validSmartRecordDate(saved.date)) return null;
  const text = (key: string) => typeof saved[key] === "string" ? (saved[key] as string).trim() : "";
  const readingErrors = errors(saved.readingErrors, saved.readingLevel);
  const spellingErrors = errors(saved.spellingErrors, saved.spellingLevel);
  const homework = text("homeworkLevel");
  const homeworkLabel = ["complete", "mastered", "complete-minor-errors", "most-completed"].includes(homework) ? "✅ كامل"
    : ["partial", "needs-redo"].includes(homework) ? "🟡 جزء من الواجب"
    : saved.homeworkCompleted === true && homework !== "not-done" ? "✅ كامل" : "❌ لم يحل الواجب";
  return {
    date: saved.date,
    attendance: saved.attendance === "absent" || saved.attendance === "late" ? saved.attendance : "present",
    readingKing: saved.readingKing === true,
    spellingKing: saved.spellingKing === true,
    attendanceLabel: saved.attendance === "absent" ? "غائب" : saved.attendance === "late" ? "متأخر" : "حاضر",
    homeworkLabel: text("homeworkLabel") || homeworkLabel,
    readingTitle: text("readingTitle"),
    readingErrors,
    readingLevelLabel: saved.readingKing === true ? "👑 ملك القراءة" : getSmartRecordAwardLabel(getSmartRecordAwardLevel(readingErrors), "reading"),
    spellingTitle: text("spellingTitle"),
    spellingWordCount: typeof saved.spellingWordCount === "number" && Number.isFinite(saved.spellingWordCount) ? Math.max(0, Math.round(saved.spellingWordCount)) : null,
    spellingErrors,
    spellingLevelLabel: saved.spellingKing === true ? "👑 ملك الإملاء" : getSmartRecordAwardLabel(getSmartRecordAwardLevel(spellingErrors), "spelling"),
    note: text("note"),
  };
}
export function studentFollowUpFromSmartRecord(value: unknown, studentId: string): StudentSmartFollowUp | null {
  const day = record(value);
  if (!day || !Array.isArray(day.records) || !validSmartRecordDate(day.date)) return null;
  const own = day.records.map(record).find(row => row?.studentId === studentId);
  if (!own) return null;
  return normalizeStudentSmartFollowUp({
    ...own, date: day.date,
    readingTitle: day.readingTitle,
    spellingTitle: typeof day.spellingTitle === "string" ? day.spellingTitle : day.spellingTextName,
    spellingWordCount: day.spellingWordCount,
  });
}
