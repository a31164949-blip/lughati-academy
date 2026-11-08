import test from "node:test";
import assert from "node:assert/strict";
import { canViewPollVoters } from "../app/api/teacher/polls/voter-access.ts";
const owner = "a31164949@gmail.com";
test("verified academy owner may view voter identities", () => {
  assert.equal(canViewPollVoters({ email: owner, email_verified: true, role: "admin" }, owner), true);
});
test("students cannot view voter identities even with a matching role or forged email claim", () => {
  for (const claims of [
    { role: "student", email: "student@example.com", email_verified: true },
    { role: "student", email: owner, email_verified: false },
    { role: "student", email: owner },
    { role: "student" },
    { role: "teacher", email: "other@example.com", email_verified: true },
    { role: "admin", email: "other@example.com", email_verified: true },
    {},
  ]) assert.equal(canViewPollVoters(claims, owner), false);
});
test("owner email comparison is normalized", () => {
  assert.equal(canViewPollVoters({ email: "  A31164949@GMAIL.COM ", email_verified: true }, owner), true);
});
