-- ============================================
-- منصة التقييمات العامة (Multi-tenant) — إضافة منفصلة تمامًا
-- عن بيانات شامل بلس الحالية (reviews/customers). ما تمسّها إطلاقًا.
-- الصق هذا كامل في Supabase SQL Editor واضغط Run.
-- ============================================

-- 1) جدول البائعين (كل حساب تسجيل = بائع واحد)
create table merchants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'),
  business_name text not null,
  created_at timestamptz not null default now()
);

create index idx_merchants_slug on merchants(slug);

alter table merchants enable row level security;

-- البائع يقدر يقرأ ويعدّل سجله هو بس
create policy "merchants read own row"
on merchants for select
using (auth.uid() = user_id);

create policy "merchants update own row"
on merchants for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 2) جدول عملاء كل بائع (نفس فكرة customers بس مع merchant_id)
create table merchant_customers (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  full_name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  unique (merchant_id, phone)
);

create index idx_merchant_customers_merchant on merchant_customers(merchant_id);

alter table merchant_customers enable row level security;
-- ما فيه policy هنا عمدًا — كل القراءة/الكتابة من لوحة تحكم البائع فقط
-- عن طريق السيرفر (service_role)، بعد التحقق إن الحساب يملك merchant_id هذا.

-- 3) جدول تقييمات كل بائع
create table merchant_reviews (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  customer_id uuid references merchant_customers(id),
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

create index idx_merchant_reviews_token on merchant_reviews(token);
create index idx_merchant_reviews_merchant on merchant_reviews(merchant_id);
create index idx_merchant_reviews_customer on merchant_reviews(customer_id);

alter table merchant_reviews enable row level security;

-- أي زائر يقدر يقرأ بس التقييمات "المعتمدة" (تستخدمها صفحة /u/[slug] العامة)
create policy "public reads approved merchant reviews"
on merchant_reviews for select
using (status = 'approved');

-- 4) دالة: الصفحة العامة /u/[slug] تستخدمها لجلب اسم النشاط من الرابط
create or replace function get_merchant_by_slug(p_slug text)
returns table (id uuid, business_name text)
language sql
security definer
set search_path = public
as $$
  select id, business_name from merchants where slug = p_slug;
$$;

-- 5) دالة: صفحة تقييم العميل (/r/[token]) تجيب بياناته
create or replace function get_merchant_review_by_token(p_token text)
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
  from merchant_reviews
  where token = p_token;
$$;

-- 6) دالة: العميل يرسل تقييمه (مرة وحدة بس لكل توكن)
create or replace function submit_merchant_review(p_token text, p_rating smallint, p_comment text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update merchant_reviews
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
-- خلاص! جداول ودوال المنصة العامة جاهزة ومنفصلة كليًا عن بيانات شامل بلس.
-- لا تنسى: Supabase Dashboard → Authentication → Providers → Email →
-- عطّل "Confirm email" عشان التسجيل الذاتي يصير فوري بدون إيميل تأكيد
-- (إلا إذا ضبطت SMTP حقيقي، وقتها سيبها مفعّلة).
-- ============================================
