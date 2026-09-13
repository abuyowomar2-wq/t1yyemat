"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setReviewStatusAction } from "./actions";
import type { Review } from "@/lib/types";

function Stars({ rating }: { rating: number }) {
  return (
    <span dir="ltr">
      <span className="text-amber-400">{"★".repeat(rating)}</span>
      <span className="text-slate-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function ModerationList({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        ما فيه تقييمات بانتظار المراجعة.
      </p>
    );
  }

  function handle(id: string, status: "approved" | "rejected") {
    setPendingId(id);
    startTransition(async () => {
      await setReviewStatusAction(id, status);
      router.refresh();
      setPendingId(null);
    });
  }

  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li
          key={r.id}
          className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">
                {r.customer_id ? (
                  <Link
                    href={`/admin/customers/${r.customer_id}`}
                    className="underline decoration-slate-300 hover:decoration-slate-900"
                  >
                    {r.customer_name}
                  </Link>
                ) : (
                  r.customer_name
                )}
              </p>
              <p className="text-xs text-slate-500">
                {r.product_name} — طلب {r.order_number}
              </p>
            </div>
            {r.rating != null ? <Stars rating={r.rating} /> : null}
          </div>
          {r.comment ? (
            <p className="text-sm text-slate-700">{r.comment}</p>
          ) : null}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={isPending && pendingId === r.id}
              onClick={() => handle(r.id, "approved")}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              اعتماد
            </button>
            <button
              type="button"
              disabled={isPending && pendingId === r.id}
              onClick={() => handle(r.id, "rejected")}
              className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-60"
            >
              رفض
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
