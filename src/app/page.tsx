import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
          منصة التقييمات
        </h1>
        <p className="text-slate-600 leading-relaxed">
          اجمع تقييمات عملائك بعد كل عملية بيع عبر رابط خاص بكل طلب، راجع
          واعتمد التقييمات بنفسك، واحصل على صفحة عامة تشاركها كمرجع
          لثقة عملائك — حتى لو تبيع بدون متجر، مثل البيع عبر تيليجرام.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-block rounded-lg bg-slate-900 px-6 py-3 text-white font-medium hover:bg-slate-800 transition"
          >
            سجّل مجانًا
          </Link>
          <Link
            href="/login"
            className="inline-block rounded-lg border border-slate-300 px-6 py-3 text-slate-700 font-medium hover:bg-slate-50 transition"
          >
            تسجيل الدخول
          </Link>
        </div>
        <p className="text-sm text-slate-400">
          مثال حي:{" "}
          <Link href="/reviews" className="underline">
            تقييمات متجر شامل بلس
          </Link>
        </p>
      </div>
    </main>
  );
}
