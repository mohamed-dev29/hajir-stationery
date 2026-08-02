-- Supabase schema for Haajir Stationery
-- Run this in the Supabase SQL editor if the app shows "table not found" errors.

create extension if not exists pgcrypto;

create table if not exists public.key_values (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  description text not null default '',
  category_id text references public.categories(id) on delete set null,
  price numeric not null default 0,
  cost_price numeric not null default 0,
  stock integer not null default 0,
  barcode text not null default '',
  image text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id text primary key,
  items jsonb not null,
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  total numeric not null default 0,
  cash_paid numeric not null default 0,
  change numeric not null default 0,
  customer_name text not null default '',
  customer_phone text not null default '',
  payment_method text not null,
  created_at timestamptz not null default now(),
  receipt_number text not null unique
);

create table if not exists public.customers (
  id text primary key,
  name text not null,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  total_purchases integer not null default 0,
  total_spent numeric not null default 0,
  last_purchase_date text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id text primary key,
  title text not null,
  amount numeric not null default 0,
  category text not null default '',
  date text not null default '',
  payment_method text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id text primary key,
  name text not null,
  contact_person text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  products jsonb not null default '[]'::jsonb,
  total_supplies integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id text primary key,
  customer_name text not null default '',
  customer_phone text not null default '',
  rating integer not null default 0,
  comment text not null default '',
  category text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.money_accounts (
  id text primary key,
  name text not null,
  type text not null,
  balance numeric not null default 0,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.money_transactions (
  id text primary key,
  account_id text not null references public.money_accounts(id) on delete cascade,
  type text not null,
  amount numeric not null default 0,
  description text not null default '',
  category text not null default '',
  date text not null default '',
  reference text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.user_profile (
  id text primary key default 'singleton',
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  business_name text not null default '',
  address text not null default '',
  created_at timestamptz not null default now()
);

alter table public.products
  drop constraint if exists products_category_id_fkey;
alter table public.products
  add constraint products_category_id_fkey
  foreign key (category_id) references public.categories(id) on delete set null;

alter table public.money_transactions
  drop constraint if exists money_transactions_account_id_fkey;
alter table public.money_transactions
  add constraint money_transactions_account_id_fkey
  foreign key (account_id) references public.money_accounts(id) on delete cascade;

create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_money_transactions_account_id on public.money_transactions(account_id);
