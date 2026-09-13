import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
          منصة التقييمات
        </h1>
        <p className="text-slate-600 leading-relaxed">
          أداة بسيطة لجمع تقييمات عملائك بعد كل عملية شراء عبر رابط تقييم
          خاص بكل طلب، ثم مراجعة واعتماد التقييمات قبل ما تظهر للعامة.
        </p>
        <div>
          <Link
            href="/reviews"
            className="inline-block rounded-lg bg-slate-900 px-6 py-3 text-white font-medium hover:bg-slate-800 transition"
          >
            شاهد التقييمات المعتمدة
          </Link>
        </div>
      </div>
    </main>
  );
}
