import "server-only";
import { timingSafeEqual } from "crypto";

// The admin dashboard has no login screen — the secret path segment
// (/admin/<token>) IS the credential. Compare it in constant time so a
// slow string compare can't leak how many leading characters matched.
export function isValidAdminSecret(secret: string): boolean {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  if (!expected || !secret) return false;

  const a = Buffer.from(secret);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
