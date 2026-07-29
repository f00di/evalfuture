-- Optional Evalfuture. lead-storage schema for Supabase.
-- Apply in the Supabase SQL editor, then keep SUPABASE_SERVICE_ROLE_KEY server-only.

create table if not exists public.leads (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) between 5 and 254),
  phone text check (phone is null or char_length(phone) <= 30),
  property_location text check (
    property_location is null or char_length(property_location) <= 160
  ),
  purpose text not null check (
    purpose in ('buy', 'rent', 'invest', 'rent out', 'refinance', 'other')
  ),
  message text not null check (char_length(message) between 10 and 2000),
  comparison_reference text check (
    comparison_reference is null or char_length(comparison_reference) <= 100
  ),
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;
alter table public.leads force row level security;

-- The public browser must never read or write leads directly.
-- No browser-facing RLS policies are intentional: only the server-side service role
-- may access this table through the FastAPI integration.
revoke all on table public.leads from public, anon, authenticated;
revoke all on sequence public.leads_id_seq from public, anon, authenticated;

create index if not exists leads_created_at_idx
  on public.leads (created_at desc);
