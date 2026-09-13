"use client";

import { useState, useTransition } from "react";
import { createReviewRequestAction } from "./actions";

export function NewRequestForm() {
  const [customerName, setCustomerName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [productName, setProductName] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setLink(null);
          startTransition(async () => {
            const res = await createReviewRequestAction({
              customerName,
              orderNumber,
              productName,
            });
            if (!res.success) {
              setError(res.message);
              return;
            }
            setLink(res.link ?? null);
            setCustomerName("");
            setOrderNumber("");
            setProductName("");
          });
        }}
      >
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="اسم العميل"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="رقم الطلب"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="اسم المنتج"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="sm:col-span-3 rounded-lg bg-slate-900 py-2.5 text-white text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60"
        >
          {isPending ? "جارٍ الإنشاء..." : "إنشاء رابط التقييم"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {link ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm">
          <span className="text-emerald-700">تم الإنشاء:</span>
          <code dir="ltr" className="text-emerald-900 break-all">
            {link}
          </code>
          <button
            type="button"
            onClick={() => {
              const fullUrl = `${window.location.origin}${link}`;
              navigator.clipboard.writeText(fullUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
            className="rounded-md bg-emerald-600 px-2.5 py-1 text-white text-xs hover:bg-emerald-700"
          >
            {copied ? "تم النسخ ✓" : "نسخ الرابط"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
