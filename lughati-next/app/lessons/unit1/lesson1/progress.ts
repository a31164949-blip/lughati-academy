export type LessonOneStation =
  | "reading"
  | "comprehension"
  | "words"
  | "language"
  | "spelling"
  | "handwriting";

export const LESSON_ONE_PROGRESS_KEY =
  "lughati-unit1-lesson1-progress";

export function getLessonOneProgress(): LessonOneStation[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(
      LESSON_ONE_PROGRESS_KEY
    );

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function completeLessonOneStation(
  station: LessonOneStation
) {
  if (typeof window === "undefined") {
    return;
  }

  const current = getLessonOneProgress();

  if (current.includes(station)) {
    return;
  }

  const updated = [...current, station];

  localStorage.setItem(
    LESSON_ONE_PROGRESS_KEY,
    JSON.stringify(updated)
  );
}