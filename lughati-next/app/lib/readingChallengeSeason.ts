// The new challenge counts approved school reading dates from its first day.
// No reading history is copied, removed or fetched by this helper.
export const readingChallengeStartDate =
  process.env.NEXT_PUBLIC_READING_CHALLENGE_START_DATE?.trim() || "";

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !dateKeyPattern.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

if (readingChallengeStartDate && !isDateKey(readingChallengeStartDate)) {
  throw new Error("NEXT_PUBLIC_READING_CHALLENGE_START_DATE must be a valid YYYY-MM-DD date.");
}

export const readingChallengePromotionPath = readingChallengeStartDate
  ? `readingChallengeSeasons/${readingChallengeStartDate}/fluencyPromotionRequests`
  : "fluencyPromotionRequests";

export const readingChallengeRequestPrefix = readingChallengeStartDate
  ? readingChallengeStartDate + "__"
  : "";

const fluencyMilestonePrefix = "fluency-level-";

export function getReadingChallengeMilestoneId(level: number): string {
  return fluencyMilestonePrefix + readingChallengeRequestPrefix + level;
}

// Older promotions remain in notification history, but should not pop up as
// new achievements after restarting the challenge.
export function canCelebrateReadingChallengeMilestone(milestoneId?: string): boolean {
  return !readingChallengeRequestPrefix ||
    !milestoneId?.startsWith(fluencyMilestonePrefix) ||
    milestoneId.startsWith(fluencyMilestonePrefix + readingChallengeRequestPrefix);
}

type ReadingProgress = {
  approvedDates?: unknown;
  totalApprovedDays?: unknown;
  fluencyLevel?: unknown;
  readingChallengeLevels?: unknown;
};

export function getChallengeApprovedDays(progress: ReadingProgress): number {
  if (!readingChallengeStartDate) {
    const total = progress.totalApprovedDays;
    return typeof total === "number" && Number.isFinite(total)
      ? Math.max(0, Math.round(total))
      : 0;
  }
  if (!Array.isArray(progress.approvedDates)) return 0;
  // Dates are already the Academy's Riyadh school date keys.
  return new Set(progress.approvedDates.filter(
    (date) => isDateKey(date) && date >= readingChallengeStartDate
  )).size;
}

export function getChallengeLevel(progress: ReadingProgress): number {
  const levels = progress.readingChallengeLevels;
  const level = readingChallengeStartDate
    ? levels && typeof levels === "object"
      ? (levels as Record<string, unknown>)[readingChallengeStartDate]
      : undefined
    : progress.fluencyLevel;
  return typeof level === "number" && Number.isFinite(level)
    ? Math.max(1, Math.min(8, Math.round(level)))
    : 1;
}
