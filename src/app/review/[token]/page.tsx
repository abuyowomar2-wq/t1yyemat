import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabase/client";
import type { ReviewByToken } from "@/lib/types";
import { ReviewForm } from "./ReviewForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

const STATUS_MESSAGES: Record<Exclude<ReviewByToken["status"], "pending_review">, string> = {
  submitted: "تم استلام تقييمك من قبل، شاكرين لك وقتك 🌿",
  approved: "تم استلام تقييمك ونشره، شاكرين لك ثقتك 🌿",
  rejected: "تم استلام تقييمك من قبل.",
};

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data, error } = await supabasePublic
    .rpc("get_review_by_token", { p_token: token })
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const review = data as ReviewByToken;

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-14">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-xl font-bold text-slate-900">قيّم تجربتك</h1>
          <p className="text-sm text-slate-500">
            الطلب {review.order_number} — {review.product_name}
          </p>
        </header>

        {review.status === "pending_review" ? (
          <ReviewForm token={token} customerName={review.customer_name} />
        ) : (
          <p className="text-center text-slate-600">
            {STATUS_MESSAGES[review.status]}
          </p>
        )}
      </div>
    </main>
  );
}
