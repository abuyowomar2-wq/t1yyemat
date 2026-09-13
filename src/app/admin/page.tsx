import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAllowedAdminEmail } from "@/lib/adminAllowlist";
import type { Review } from "@/lib/types";
import { NewRequestForm } from "./NewRequestForm";
import { ModerationList } from "./ModerationList";
import { signOutAction } from "./actions";

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

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedAdminEmail(user.email)) {
    redirect("/admin/login");
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) || user.email;

  const { data } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  const reviews = (data ?? []) as Review[];

  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => r.status === "pending_review").length,
    awaitingModeration: reviews.filter((r) => r.status === "submitted").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };

  const ratedReviews = reviews.filter((r) => r.rating != null);
  const averageRating =
    ratedReviews.length > 0
      ? ratedReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
        ratedReviews.length
      : null;

  const awaitingModeration = reviews.filter((r) => r.status === "submitted");

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 space-y-10">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            لوحة التحكم
          </h1>
          <p className="text-slate-500 text-sm mt-1">أهلًا {displayName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/customers"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
          >
            العملاء
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              تسجيل الخروج
            </button>
          </form>
        </div>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="الإجمالي" value={stats.total} />
        <StatCard label="بانتظار العميل" value={stats.pending} />
        <StatCard
          label="بانتظار المراجعة"
          value={stats.awaitingModeration}
          highlight
        />
        <StatCard label="معتمدة" value={stats.approved} />
        <StatCard label="مرفوضة" value={stats.rejected} />
      </section>

      {averageRating != null ? (
        <p className="text-slate-600 text-sm">
          متوسط التقييمات المرسلة: {averageRating.toFixed(1)} من 5
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-4">طلب تقييم جديد</h2>
        <NewRequestForm />
      </section>

      <section className="space-y-4">
        <h2 className="font-bold text-slate-900">
          تقييمات بانتظار المراجعة ({awaitingModeration.length})
        </h2>
        <ModerationList reviews={awaitingModeration} />
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-slate-900">كل الطلبات</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">العميل</th>
                <th className="px-4 py-3 font-medium">الطلب</th>
                <th className="px-4 py-3 font-medium">المنتج</th>
                <th className="px-4 py-3 font-medium">التقييم</th>
                <th className="px-4 py-3 font-medium">التعليق</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    {r.customer_id ? (
                      <Link
                        href={`/admin/customers/${r.customer_id}`}
                        className="text-slate-900 underline decoration-slate-300 hover:decoration-slate-900"
                      >
                        {r.customer_name}
                      </Link>
                    ) : (
                      r.customer_name
                    )}
                  </td>
                  <td className="px-4 py-3">{r.order_number}</td>
                  <td className="px-4 py-3">{r.product_name}</td>
                  <td className="px-4 py-3">{r.rating ?? "—"}</td>
                  <td className="px-4 py-3 max-w-xs whitespace-pre-wrap">
                    {r.comment ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
              {reviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    ما فيه طلبات بعد
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

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 text-center ${
        highlight && value > 0
          ? "border-amber-300 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Review["status"] }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
