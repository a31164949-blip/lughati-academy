// A one-day all-services exception. Never changes admission or suspension records.
export const RESULTS_VIEW_START = Date.parse("2026-11-03T00:00:00+03:00");
export const RESULTS_VIEW_END = Date.parse("2026-11-04T00:00:00+03:00");
export function isResultsViewingOpen(now = Date.now()) {
  return now >= RESULTS_VIEW_START && now < RESULTS_VIEW_END;
}

export const isTemporaryAcademyOpen = isResultsViewingOpen;
