import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isAllowedAdminEmail } from "@/lib/adminAllowlist";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // --- لوحة شامل بلس الخاصة (allowlist ثابتة، بدون علاقة بالمنصة العامة) ---
  const isAdminLoginPage = pathname === "/admin/login";
  const isAdminAuthorized = !!user && isAllowedAdminEmail(user.email);

  if (pathname.startsWith("/admin") && !isAdminLoginPage && !isAdminAuthorized) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (isAdminLoginPage && isAdminAuthorized) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // --- لوحة تحكم البائعين بالمنصة العامة (أي حساب مسجّل) ---
  if (pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
