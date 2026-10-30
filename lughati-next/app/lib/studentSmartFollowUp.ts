export type StudentSmartFollowUp = {
  date: string;
  homeworkLabel: string;
  readingLevelLabel: string;
  readingTitle: string;
  readingErrors: number | null;
  readingNote: string;
  readingAccuracyLabel: string;
  readingFluencyLabel: string;
  readingDiacriticsLabel: string;
};

// Use the existing student-journey payload; no database request is needed.
export function normalizeStudentSmartFollowUp(value: unknown): StudentSmartFollowUp | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const saved = value as Record<string, unknown>;
  const text = (key: string) => typeof saved[key] === "string" ? (saved[key] as string).trim() : "";
  const errors = typeof saved.readingErrors === "number" && Number.isFinite(saved.readingErrors) && saved.readingErrors >= 0
    ? Math.round(saved.readingErrors) : null;
  const level = errors !== null
    ? errors === 0 ? "prince" : errors <= 2 ? "hero" : errors === 3 ? "star" : "diligent"
    : text("readingLevel");
  const labels: Record<string, string> = {
    prince: "🌟 أمير القراءة", hero: "🏅 بطل القراءة", star: "⭐ نجم القراءة", diligent: "🌱 مجتهد القراءة",
    mastered: "متقن", "very-good": "جيد جدًا", good: "جيد", "needs-practice": "يحتاج إلى تدريب",
    "intensive-support": "يحتاج إلى دعم مكثف", "not-evaluated": "— لم يُقيّم",
  };
  const readingLevelLabel = saved.readingKing === true && (errors !== null || (level && level !== "not-evaluated"))
    ? "👑 ملك القراءة" : labels[level] || text("readingLevelLabel") || "— لم يُقيّم";
  const homework: Record<string, string> = {
    complete: "✅ كامل", partial: "🟡 جزء من الواجب", "not-done": "❌ لم يحل الواجب",
    mastered: "✅ كامل", "complete-minor-errors": "✅ كامل", "most-completed": "✅ كامل", "needs-redo": "🟡 جزء من الواجب",
  };
  return {
    date: text("date"),
    homeworkLabel: text("homeworkLabel") || homework[text("homeworkLevel")] || (saved.homeworkCompleted === true ? "✅ كامل" : ""),
    readingLevelLabel,
    readingTitle: text("readingTitle"),
    readingErrors: errors,
    readingNote: text("note") || text("readingNote"),
    // Preserve older explicit assessments, but never infer these skills from a total error count.
    readingAccuracyLabel: text("readingAccuracyLabel"),
    readingFluencyLabel: text("readingFluencyLabel"),
    readingDiacriticsLabel: text("readingDiacriticsLabel"),
  };
}
