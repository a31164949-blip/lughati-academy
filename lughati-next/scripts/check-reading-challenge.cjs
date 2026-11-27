const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.join(__dirname, "..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");
const seasonSource = ts.transpileModule(source("app/lib/readingChallengeSeason.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const loadSeason = (startDate) => {
  const exports = {};
  vm.runInNewContext(seasonSource, {
    exports,
    process: { env: { NEXT_PUBLIC_READING_CHALLENGE_START_DATE: startDate } },
  });
  return exports;
};

const legacy = loadSeason("");
const reset = loadSeason("2026-11-29");
const old = { approvedDates: ["2026-11-26", "2026-11-28"], totalApprovedDays: 2, fluencyLevel: 7 };
assert.equal(legacy.getChallengeLevel(old), 7);
assert.equal(legacy.getChallengeApprovedDays(old), 2);
assert.equal(legacy.readingChallengePromotionPath, "fluencyPromotionRequests");
assert.equal(reset.getChallengeLevel(old), 1);
assert.equal(reset.getChallengeApprovedDays(old), 0);
assert.equal(reset.readingChallengePromotionPath, "readingChallengeSeasons/2026-11-29/fluencyPromotionRequests");
assert.equal(reset.getChallengeApprovedDays({ approvedDates: [...old.approvedDates, "2026-11-29", "2026-11-29", "2026-11-30", "2026-11-31", null] }), 2);
assert.equal(reset.getChallengeLevel({ ...old, readingChallengeLevels: { "2026-11-29": 2 } }), 2);
assert.equal(reset.getChallengeLevel({ ...old, readingChallengeLevels: { "2026-11-20": 8 } }), 1);
assert.throws(() => loadSeason("2026-02-30"), /valid YYYY-MM-DD/);

const paths = [
  "app/lib/readingChallengeSeason.ts",
  "app/api/fluency-promotion/review/route.ts",
  "app/api/fluency-promotion/route.ts",
  "app/api/student-journey/route.ts",
  "app/journey/page.tsx",
  "app/reading-journey/fluency-levels/page.tsx",
  "app/reading-journey/page.tsx",
  "app/teacher/fluency-promotions/page.tsx",
  "app/teacher/page.tsx",
];
for (const file of paths) {
  const parsed = ts.createSourceFile(file, source(file), ts.ScriptTarget.Latest, true);
  assert.equal(parsed.parseDiagnostics.length, 0, file);
  assert.doesNotMatch(source(file), /قمة الطلاقة|قمم الطلاقة/);
}
assert.equal(legacy.readingChallengeRequestPrefix, "");
assert.equal(reset.readingChallengeRequestPrefix, "2026-11-29__");
assert.equal("old-student__level-2".startsWith(reset.readingChallengeRequestPrefix), false);
assert.equal(legacy.getReadingChallengeMilestoneId(2), "fluency-level-2");
assert.equal(reset.getReadingChallengeMilestoneId(2), "fluency-level-2026-11-29__2");
assert.equal(reset.canCelebrateReadingChallengeMilestone(legacy.getReadingChallengeMilestoneId(2)), false);
assert.equal(reset.canCelebrateReadingChallengeMilestone("fluency-level-2026-11-20__2"), false);
assert.equal(reset.canCelebrateReadingChallengeMilestone(reset.getReadingChallengeMilestoneId(2)), true);
assert.equal(reset.canCelebrateReadingChallengeMilestone("weekly-reading-hero"), true);
assert.equal(reset.canCelebrateReadingChallengeMilestone(undefined), true);
assert.equal(legacy.canCelebrateReadingChallengeMilestone("fluency-level-2"), true);
const journey = source("app/journey/page.tsx");
const studentApi = source("app/api/student-journey/route.ts");
const challenge = source("app/reading-journey/fluency-levels/page.tsx");
const submit = source("app/api/fluency-promotion/route.ts");
const review = source("app/api/fluency-promotion/review/route.ts");
assert.match(journey, /setNotifications\(items\)/);
assert.match(journey, /canCelebrateReadingChallengeMilestone\(notification.milestoneId\)/);
assert.match(journey, /if \(latestUnopenedGift\)/);
assert.match(review, /getReadingChallengeMilestoneId\(targetLevel\)/);
assert.match(journey, /fluencyNextLevel\.requirement -\s+readingChallengeDays/);
assert.match(journey, /const readingProgress =\s+readingDays % 5/);
assert.match(studentApi, /readingDays:\s+typeof readingProgressData\s*\.totalApprovedDays/);
assert.match(studentApi, /readingChallengeDays: getChallengeApprovedDays\(readingProgressData\)/);
assert.match(challenge, /getChallengeApprovedDays\(data\)/);
assert.match(submit, /body.season !== readingChallengeStartDate/);
assert.match(review, /requestId.startsWith\(readingChallengeRequestPrefix\)/);
assert.match(submit, /getChallengeApprovedDays\(progressData\)/);
assert.match(submit, /collection\(\s*readingChallengePromotionPath/);
assert.equal([...review.matchAll(/collection\(\s*readingChallengePromotionPath/g)].length, 2);
assert.match(review, /readingChallengeLevels: \{ \[readingChallengeStartDate\]: targetLevel \}/);
assert.match(review, /getTeacherFromRequest\(\s*request/);
console.log("READING_CHALLENGE_RESET=PASS");
