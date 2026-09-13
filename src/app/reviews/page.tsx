import { supabasePublic } from "@/lib/supabase/client";
import type { Review } from "@/lib/types";

export const dynamic = "force-dynamic";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-amber-400" aria-label={`${rating} من 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n}>{n <= rating ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

export default async function ReviewsPage() {
  const { data, error } = await supabasePublic
    .from("reviews")
    .select("id, customer_name, product_name, rating, comment, submitted_at")
    .eq("status", "approved")
    .order("submitted_at", { ascending: false });

  const reviews = (data ?? []) as Pick<
    Review,
    "id" | "customer_name" | "product_name" | "rating" | "comment" | "submitted_at"
  >[];

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
      : 0;

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-14 space-y-10">
      <header className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          آراء عملائنا
        </h1>
        {reviews.length > 0 ? (
          <p className="text-slate-600">
            متوسط التقييم {average.toFixed(1)} من 5 — بناءً على{" "}
            {reviews.length} {reviews.length === 1 ? "تقييم" : "تقييمات"}
          </p>
        ) : null}
      </header>

      {error ? (
        <p className="text-center text-red-600">
          ما قدرنا نجيب التقييمات الحين، حاول تحدّث الصفحة.
        </p>
      ) : reviews.length === 0 ? (
        <p className="text-center text-slate-500">
          ما فيه تقييمات معتمدة بعد.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">
                  {r.customer_name}
                </span>
                {r.rating != null ? <Stars rating={r.rating} /> : null}
              </div>
              <p className="text-sm text-slate-500">{r.product_name}</p>
              {r.comment ? (
                <p className="text-slate-700 leading-relaxed">{r.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
