import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

// Public, read-only, CORS-open by design: only ever returns rows the
// "public reads approved reviews" RLS policy already allows anyone to
// read, so it's safe to call from any store domain.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const product = searchParams.get("product");
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
    100
  );

  let query = supabasePublic
    .from("reviews")
    .select("id, customer_name, product_name, rating, comment, submitted_at")
    .eq("status", "approved")
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (product) {
    query = query.eq("product_name", product);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { reviews: [], error: "fetch_failed" },
      {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const reviews = (data ?? []).map((r) => ({
    id: r.id,
    customerName: r.customer_name,
    productName: r.product_name,
    rating: r.rating,
    comment: r.comment,
    submittedAt: r.submitted_at,
  }));

  return NextResponse.json(
    { reviews },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
