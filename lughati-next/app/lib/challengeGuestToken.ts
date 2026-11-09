import { createHash, timingSafeEqual } from "node:crypto";

export type GuestInvite = { name?: unknown; hash?: unknown; active?: unknown };

export function parseChallengeGuestToken(token: string): { code: string; guestId: "guest-1" | "guest-2"; secret: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [code, guestId, secret] = parts;
  if (!/^\d{6}$/.test(code) || !/^guest-[12]$/.test(guestId) || !/^[a-f0-9]{64}$/.test(secret)) return null;
  return { code, guestId: guestId as "guest-1" | "guest-2", secret };
}

export function verifyChallengeGuestInvite(secret: string, invite: GuestInvite | undefined): invite is { name: string; hash: string; active: true } {
  if (!invite || invite.active !== true || typeof invite.name !== "string" || typeof invite.hash !== "string" || !/^[a-f0-9]{64}$/.test(invite.hash)) return false;
  if (!/^[a-f0-9]{64}$/.test(secret)) return false;
  const actual = createHash("sha256").update(secret).digest();
  const expected = Buffer.from(invite.hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
