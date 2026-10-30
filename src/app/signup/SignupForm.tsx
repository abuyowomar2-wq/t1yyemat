"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browserAuthClient";
import { isValidSlug } from "@/lib/slug";
import { completeSignupAction } from "./actions";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function SignupForm() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanSlug = slug.trim().toLowerCase();
    if (!isValidSlug(cleanSlug)) {
      setError(
        "الرابط لازم يكون حروف إنجليزية صغيرة وأرقام وشرطات بس، من 3 إلى 32 حرف."
      );
      return;
    }

    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { business_name: businessName.trim() } },
    });

    if (signUpError) {
      setLoading(false);
      setError(
        signUpError.message.includes("already registered")
          ? "هذا البريد مسجّل مسبقًا، جرّب تسجّل الدخول."
          : "صار خطأ أثناء إنشاء الحساب."
      );
      return;
    }

    if (!data.session) {
      setLoading(false);
      setError(
        "تم إنشاء الحساب، لكن يحتاج تأكيد بريد إلكتروني قبل الدخول — تحقق من بريدك."
      );
      return;
    }

    const res = await completeSignupAction({
      slug: cleanSlug,
      businessName,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-4"
    >
      <h1 className="text-xl font-bold text-slate-900 text-center">
        سجّل حسابك مجانًا
      </h1>

      <div className="space-y-1">
        <label className="text-sm text-slate-600">اسم نشاطك أو متجرك</label>
        <input
          required
          value={businessName}
          onChange={(e) => {
            setBusinessName(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-slate-600">رابطك العام</label>
        <div className="flex items-center gap-1 text-sm" dir="ltr">
          <span className="text-slate-400 whitespace-nowrap">/u/</span>
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(slugify(e.target.value));
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-slate-600">البريد الإلكتروني</label>
        <input
          type="email"
          required
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-slate-600">كلمة السر</label>
        <input
          type="password"
          required
          minLength={6}
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      {error ? <p className="text-sm text-red-600 text-center">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-slate-900 py-2.5 text-white text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60"
      >
        {loading ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
      </button>

      <p className="text-center text-sm text-slate-500">
        عندك حساب؟{" "}
        <a href="/login" className="text-slate-900 underline">
          سجّل دخولك
        </a>
      </p>
    </form>
  );
}
