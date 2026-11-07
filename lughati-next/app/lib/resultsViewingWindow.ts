import opening from "./academyOpening.json";
// Keep the historic results-only window separate from general academy access.
export const RESULTS_VIEW_START = Date.parse("2026-11-03T00:00:00+03:00");
export const RESULTS_VIEW_END = Date.parse("2026-11-04T00:00:00+03:00");
export function isResultsViewingOpen(now = Date.now()) {
  return now >= RESULTS_VIEW_START && now < RESULTS_VIEW_END;
}

export function isTemporaryAcademyOpen(now = Date.now()) {
  return opening.openToAllStudents || isResultsViewingOpen(now);
}
