import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAllowedAdminEmail } from "@/lib/adminAllowlist";
import type { Customer, Review } from "@/lib/types";
import { NewRequestForCustomerForm } from "./NewRequestForCustomerForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

const STATUS_LABELS: Record<Review["status"], string> = {
  pending_review: "بانتظار العميل",
  submitted: "بانتظار المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
};

const STATUS_STYLES: Record<Review["status"], string> = {
  pending_review: "bg-slate-100 text-slate-600",
  submitted: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedAdminEmail(user.email)) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!customer) {
    notFound();
  }

  const { data } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  const reviews = (data ?? []) as Review[];
  const typedCustomer = customer as Customer;

  const ratedReviews = reviews.filter((r) => r.rating != null);
  const averageRating =
    ratedReviews.length > 0
      ? ratedReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
        ratedReviews.length
      : null;

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10 space-y-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {typedCustomer.full_name}
          </h1>
          <p dir="ltr" className="text-slate-500 text-sm mt-1 text-right">
            {typedCustomer.phone}
          </p>
        </div>
        <Link
          href="/admin/customers"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
        >
          كل العملاء
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-900">
            {reviews.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">إجمالي طلبات التقييم</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-900">
            {averageRating != null ? averageRating.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-slate-500 mt-1">متوسط تقييماته</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-4">طلب تقييم جديد</h2>
        <NewRequestForCustomerForm customerId={typedCustomer.id} />
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-slate-900">تاريخ الطلبات</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">التاريخ</th>
                <th className="px-4 py-3 font-medium">رقم الطلب</th>
                <th className="px-4 py-3 font-medium">المنتج</th>
                <th className="px-4 py-3 font-medium">التقييم</th>
                <th className="px-4 py-3 font-medium">التعليق</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("ar-SA")}
                  </td>
                  <td className="px-4 py-3">{r.order_number}</td>
                  <td className="px-4 py-3">{r.product_name}</td>
                  <td className="px-4 py-3">{r.rating ?? "—"}</td>
                  <td className="px-4 py-3 max-w-xs whitespace-pre-wrap">
                    {r.comment ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[r.status]}`}
                    >
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    ما فيه طلبات لهذا العميل بعد
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
