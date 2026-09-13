// Only these emails may ever hold an admin session, regardless of what
// exists in Supabase Auth — configured via env so it never needs a code
// change or redeploy to update.
export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const allowed = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.toLowerCase());
}
