import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAllowedAdminEmail } from "@/lib/adminAllowlist";
import { COMPANION_NAME } from "@/lib/companion/persona";
import { ChatLoader } from "./ChatLoader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: `سوالف مع ${COMPANION_NAME}`,
  robots: { index: false, follow: false },
};

export default async function ChatPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedAdminEmail(user.email)) {
    redirect("/admin/login");
  }

  return <ChatLoader companionName={COMPANION_NAME} />;
}
