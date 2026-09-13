"use client";

import { useState, useTransition } from "react";
import { submitReviewAction, type SubmitReviewResult } from "./actions";

export function ReviewForm({
  token,
  customerName,
}: {
  token: string;
  customerName: string;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [result, setResult] = useState<SubmitReviewResult | null>(null);
  const [isPending, startTransition] = useTransition();

  if (result?.success) {
    return (
      <p className="text-center text-emerald-600 font-medium">
        {result.message}
      </p>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (rating === 0) {
          setResult({ success: false, message: "اختر تقييمك بالنجوم أولًا." });
          return;
        }
        startTransition(async () => {
          const res = await submitReviewAction(token, rating, comment);
          setResult(res);
        });
      }}
    >
      <p className="text-center text-slate-600">
        أهلًا {customerName}، ودّنا نعرف رأيك
      </p>

      <div className="flex justify-center gap-1 text-3xl" dir="ltr">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className={
              n <= (hovered || rating) ? "text-amber-400" : "text-slate-300"
            }
            aria-label={`${n} نجوم`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="أضف تعليقك (اختياري)"
        rows={4}
        maxLength={2000}
        className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
      />

      {result && !result.success ? (
        <p className="text-sm text-red-600 text-center">{result.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-slate-900 py-3 text-white font-medium hover:bg-slate-800 transition disabled:opacity-60"
      >
        {isPending ? "جارٍ الإرسال..." : "إرسال التقييم"}
      </button>
    </form>
  );
}
