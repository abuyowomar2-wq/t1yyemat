import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAllowedAdminEmail } from "@/lib/adminAllowlist";
import type { Customer } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedAdminEmail(user.email)) {
    redirect("/admin/login");
  }

  const { q } = await searchParams;
  const query = (q ?? "").trim();

  let request = supabaseAdmin
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (query) {
    request = request.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`);
  }

  const { data } = await request;
  const customers = (data ?? []) as Customer[];

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">العملاء</h1>
          <p className="text-slate-500 text-sm mt-1">
            كل عميل وتاريخه من طلبات التقييم
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
        >
          رجوع للوحة
        </Link>
      </header>

      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="ابحث بالاسم أو رقم الجوال"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition"
        >
          بحث
        </button>
      </form>

      <ul className="space-y-2">
        {customers.map((c) => (
          <li key={c.id}>
            <Link
              href={`/admin/customers/${c.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 transition"
            >
              <span className="font-semibold text-slate-900">
                {c.full_name}
              </span>
              <span dir="ltr" className="text-sm text-slate-500">
                {c.phone}
              </span>
            </Link>
          </li>
        ))}
        {customers.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-6">
            {query ? "ما فيه عملاء مطابقين." : "ما فيه عملاء بعد."}
          </p>
        ) : null}
      </ul>
    </main>
  );
}
