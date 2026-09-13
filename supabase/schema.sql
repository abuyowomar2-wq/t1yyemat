-- ============================================
-- منصة التقييمات - إعداد قاعدة البيانات
-- الصق هذا الكود كامل في Supabase SQL Editor واضغط Run
-- ============================================

-- 1) جدول العملاء — كل عميل له سجل واحد بغض النظر عن كم مرة نطلب منه
-- تقييم. رقم الجوال هو مفتاح المطابقة (موحّد الصيغة عن طريق التطبيق قبل
-- الحفظ، عشان "0501234567" و"+966501234567" ما يصيرون عميلين مختلفين).
create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  created_at timestamptz not null default now()
);

create index idx_customers_phone on customers(phone);

alter table customers enable row level security;
-- ما فيه أي policy هنا عمدًا — القراءة والكتابة على هذا الجدول من لوحة
-- التحكم فقط عن طريق service_role key، اللي يتجاوز RLS أصلًا.

-- 2) الجدول الأساسي
create table reviews (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  customer_id uuid references customers(id),
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
create index idx_reviews_customer_id on reviews(customer_id);

-- 3) تفعيل الحماية على مستوى الصفوف (RLS)
-- بعد تفعيلها، محد يوصل للجدول مباشرة إلا حسب السياسات تحت
alter table reviews enable row level security;

-- سياسة: أي زائر يقدر يقرأ بس التقييمات "المعتمدة" (تستخدمها الويدجت العامة)
create policy "public reads approved reviews"
on reviews for select
using (status = 'approved');

-- ملاحظة: لوحة التحكم تسجّل دخول حقيقي عبر Supabase Auth، لكن كل عمليات
-- الكتابة (إنشاء طلب، اعتماد، رفض) تمر عبر السيرفر باستخدام service_role
-- key اللي يتجاوز RLS تلقائيًا بعد التحقق من الجلسة والإيميل المسموح —
-- لهذا ما فيه policy لـ"authenticated" هنا. أي مفتاح غير service_role
-- يقدر يقرأ بس التقييمات المعتمدة، ولا يقدر يكتب على الجدول إطلاقًا.

-- 4) دالة: صفحة التقييم تستخدمها لجلب بيانات العميل عن طريق التوكن
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

-- 5) دالة: العميل يرسل تقييمه عن طريقها (مرة وحدة بس لكل توكن)
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
