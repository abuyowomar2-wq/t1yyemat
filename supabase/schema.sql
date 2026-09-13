-- ============================================
-- منصة التقييمات - إعداد قاعدة البيانات
-- الصق هذا الكود كامل في Supabase SQL Editor واضغط Run
-- ============================================

-- 1) الجدول الأساسي
create table reviews (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  customer_name text not null,
  order_number text not null,
  product_name text not null,
  rating smallint check (rating between 1 and 5),
  comment text,
  status text not null default 'pending_review'
    check (status in ('pending_review','submitted','approved','rejected')),
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);

create index idx_reviews_token on reviews(token);
create index idx_reviews_status on reviews(status);

-- 2) تفعيل الحماية على مستوى الصفوف (RLS)
-- بعد تفعيلها، محد يوصل للجدول مباشرة إلا حسب السياسات تحت
alter table reviews enable row level security;

-- سياسة: أي زائر يقدر يقرأ بس التقييمات "المعتمدة" (تستخدمها الويدجت العامة)
create policy "public reads approved reviews"
on reviews for select
using (status = 'approved');

-- سياسة: أنت (بعد تسجيل الدخول) عندك صلاحية كاملة على الجدول
-- (إنشاء طلبات تقييم، موافقة، رفض، حذف... الخ)
create policy "authenticated admin full access"
on reviews for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- 3) دالة: صفحة التقييم تستخدمها لجلب بيانات العميل عن طريق التوكن
-- ترجّع بس بيانات هذا التقييم بالذات، ما تكشف باقي الجدول
create or replace function get_review_by_token(p_token text)
returns table (
  customer_name text,
  order_number text,
  product_name text,
  status text
)
language sql
security definer
set search_path = public
as $$
  select customer_name, order_number, product_name, status
  from reviews
  where token = p_token;
$$;

-- 4) دالة: العميل يرسل تقييمه عن طريقها (مرة وحدة بس لكل توكن)
create or replace function submit_review(p_token text, p_rating smallint, p_comment text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update reviews
  set rating = p_rating,
      comment = p_comment,
      status = 'submitted',
      submitted_at = now()
  where token = p_token
    and status = 'pending_review';

  return found;
end;
$$;

-- ============================================
-- خلاص! بعد تشغيل هذا الكود، الجدول والحماية والدوال جاهزة.
-- الخطوة الجاية: لوحة التحكم.
-- ============================================
