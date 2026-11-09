import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { parseChallengeGuestToken, verifyChallengeGuestInvite } from "./challengeGuestToken.ts";

const secret = "a".repeat(64);
const hash = createHash("sha256").update(secret).digest("hex");
const validInvite = { name: "ضيف الصف الثالث", hash, active: true };

test("accepts only two guest slots bound to a six-digit room", () => {
  assert.deepEqual(parseChallengeGuestToken("123456.guest-1." + secret), { code: "123456", guestId: "guest-1", secret });
  assert.deepEqual(parseChallengeGuestToken("123456.guest-2." + secret), { code: "123456", guestId: "guest-2", secret });
  for (const token of [
    "123456.guest-3." + secret,
    "123456.guest-0." + secret,
    "12345.guest-1." + secret,
    "123456.guest-1." + secret + ".extra",
    "123456.guest-1." + "A".repeat(64),
    "123456.guest-1." + "a".repeat(63),
    "123456.guest-1." + secret + "\n",
    "",
  ]) assert.equal(parseChallengeGuestToken(token), null, token);
});

test("accepts a valid active invitation with a matching digest", () => {
  assert.equal(verifyChallengeGuestInvite(secret, validInvite), true);
});

test("rejects revoked, malformed, missing, or mismatched invitations", () => {
  for (const invite of [
    undefined,
    { ...validInvite, active: false },
    { ...validInvite, name: 4 },
    { ...validInvite, hash: "z".repeat(64) },
    { ...validInvite, hash: "a".repeat(63) },
    { ...validInvite, hash: createHash("sha256").update("b".repeat(64)).digest("hex") },
  ]) assert.equal(verifyChallengeGuestInvite(secret, invite), false);
  assert.equal(verifyChallengeGuestInvite("b".repeat(64), validInvite), false);
  assert.equal(verifyChallengeGuestInvite("A".repeat(64), validInvite), false);
});
