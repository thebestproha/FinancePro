-- FinancePro Supabase schema
-- Run this in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.finance_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid(),
    profile_name text not null default 'Main Profile',
    state jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists finance_profiles_user_unique
    on public.finance_profiles (user_id);

create table if not exists public.market_prices (
    id uuid primary key default gen_random_uuid(),
    symbol text not null,
    asset_type text not null,
    price numeric(18, 4) not null,
    currency text not null default 'INR',
    source text not null,
    meta jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);

create index if not exists market_prices_symbol_idx
    on public.market_prices (symbol);

create table if not exists public.loan_templates (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    principal numeric(18, 2) not null default 0,
    annual_rate numeric(8, 4) not null default 0,
    tenure_months integer not null default 0,
    lender text,
    notes text,
    created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid(),
    event_type text not null,
    entity_type text,
    entity_id text,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

alter table public.finance_profiles enable row level security;
alter table public.market_prices enable row level security;
alter table public.loan_templates enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "finance_profiles_select_own" on public.finance_profiles;
create policy "finance_profiles_select_own"
    on public.finance_profiles
    for select
    using (auth.uid() = user_id);

drop policy if exists "finance_profiles_insert_own" on public.finance_profiles;
create policy "finance_profiles_insert_own"
    on public.finance_profiles
    for insert
    with check (auth.uid() = user_id);

drop policy if exists "finance_profiles_update_own" on public.finance_profiles;
create policy "finance_profiles_update_own"
    on public.finance_profiles
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "market_prices_read_all" on public.market_prices;
create policy "market_prices_read_all"
    on public.market_prices
    for select
    using (true);

drop policy if exists "loan_templates_read_all" on public.loan_templates;
create policy "loan_templates_read_all"
    on public.loan_templates
    for select
    using (true);

drop policy if exists "audit_events_select_own" on public.audit_events;
create policy "audit_events_select_own"
    on public.audit_events
    for select
    using (auth.uid() = user_id);

drop policy if exists "audit_events_insert_own" on public.audit_events;
create policy "audit_events_insert_own"
    on public.audit_events
    for insert
    with check (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists touch_finance_profiles_updated_at on public.finance_profiles;
create trigger touch_finance_profiles_updated_at
before update on public.finance_profiles
for each row execute function public.touch_updated_at();
