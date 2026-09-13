import { createBrowserClient } from "@supabase/ssr";

// Only for the login form — signs in and lets @supabase/ssr sync the
// session into cookies so the server (middleware, Server Components,
// Server Actions) can see it too.
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
