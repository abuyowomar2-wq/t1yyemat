"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browserAuthClient";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      setError("البريد أو كلمة السر غير صحيحة.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-5"
    >
      <h1 className="text-xl font-bold text-slate-900 text-center">
        تسجيل الدخول للوحة التحكم
      </h1>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm text-slate-600">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          type="email"
          required
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm text-slate-600">
          كلمة السر
        </label>
        <input
          id="password"
          type="password"
          required
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
        {loading ? "جارٍ الدخول..." : "دخول"}
      </button>
    </form>
  );
}
