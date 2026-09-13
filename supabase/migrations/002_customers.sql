-- ترقية لقاعدة بيانات موجودة سلفًا (شغّلت supabase/schema.sql قبل إضافة
-- ميزة العملاء). آمن التشغيل — إضافات فقط، ما يحذف ولا يغيّر أي بيانات
-- حالية. الصقه بـ SQL Editor واضغط Run.

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_customers_phone on customers(phone);

alter table customers enable row level security;

alter table reviews add column if not exists customer_id uuid references customers(id);

create index if not exists idx_reviews_customer_id on reviews(customer_id);
