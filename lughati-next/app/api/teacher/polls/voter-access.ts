/** Only the verified academy owner's Firebase ID token may access voter identities. */
export function canViewPollVoters(claims: { email?: unknown; email_verified?: unknown; role?: unknown }, ownerEmail: string): boolean {
  const email = typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
  return email !== "" && email === ownerEmail.trim().toLowerCase() && claims.email_verified === true;
}
