-- ============================================
-- Supabase Database Setup for Blackjack Game
-- ============================================
-- This script sets up all necessary tables, RLS policies, and triggers
-- Note: Authentication will be handled by Clerk, so we'll use a custom user_id field
-- ============================================

-- ============================================
-- 1. Create Profiles Table
-- ============================================
-- Stores user profile information
-- Will be linked to Clerk user IDs when authentication is integrated
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique, -- Will store Clerk user ID when auth is integrated
  name text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for faster lookups
create index if not exists profiles_clerk_user_id_idx on public.profiles(clerk_user_id);
create index if not exists profiles_email_idx on public.profiles(email);

-- ============================================
-- 2. Create Game Stats Table
-- ============================================
-- Stores game statistics for each user
create table if not exists public.game_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bankroll integer not null default 1000,
  hands_played integer not null default 0,
  hands_won integer not null default 0,
  hands_lost integer not null default 0,
  hands_pushed integer not null default 0,
  total_moves integer not null default 0,
  strategy_decisions integer not null default 0,
  strategy_correct integer not null default 0,
  strategy_streak integer not null default 0,
  best_streak integer not null default 0,
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id)
);

-- Create index for faster lookups
create index if not exists game_stats_user_id_idx on public.game_stats(user_id);

-- ============================================
-- 3. Create Game Sessions Table (Optional)
-- ============================================
-- Stores individual game sessions for history/analytics
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_start timestamptz default now(),
  session_end timestamptz,
  hands_played integer not null default 0,
  starting_bankroll integer not null,
  ending_bankroll integer not null,
  net_result integer not null default 0,
  created_at timestamptz default now()
);

-- Create index for faster lookups
create index if not exists game_sessions_user_id_idx on public.game_sessions(user_id);
create index if not exists game_sessions_created_at_idx on public.game_sessions(created_at);

-- ============================================
-- 4. Enable Row Level Security (RLS)
-- ============================================
alter table public.profiles enable row level security;
alter table public.game_stats enable row level security;
alter table public.game_sessions enable row level security;

-- ============================================
-- 5. RLS Policies for Profiles
-- ============================================
-- Drop existing policies if they exist
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

-- Allow users to read their own profile
-- Note: When Clerk is integrated, update this to use Clerk user ID
create policy "profiles_select_own"
  on public.profiles for select
  using (true); -- Temporarily allow all reads until Clerk is integrated

-- Allow users to insert their own profile
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (true); -- Temporarily allow all inserts until Clerk is integrated

-- Allow users to update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  using (true) -- Temporarily allow all updates until Clerk is integrated
  with check (true);

-- Allow users to delete their own profile
create policy "profiles_delete_own"
  on public.profiles for delete
  using (true); -- Temporarily allow all deletes until Clerk is integrated

-- ============================================
-- 6. RLS Policies for Game Stats
-- ============================================
-- Drop existing policies if they exist
drop policy if exists "game_stats_select_own" on public.game_stats;
drop policy if exists "game_stats_insert_own" on public.game_stats;
drop policy if exists "game_stats_update_own" on public.game_stats;
drop policy if exists "game_stats_delete_own" on public.game_stats;

-- Allow users to read their own stats
create policy "game_stats_select_own"
  on public.game_stats for select
  using (true); -- Temporarily allow all reads until Clerk is integrated

-- Allow users to insert their own stats
create policy "game_stats_insert_own"
  on public.game_stats for insert
  with check (true); -- Temporarily allow all inserts until Clerk is integrated

-- Allow users to update their own stats
create policy "game_stats_update_own"
  on public.game_stats for update
  using (true) -- Temporarily allow all updates until Clerk is integrated
  with check (true);

-- Allow users to delete their own stats
create policy "game_stats_delete_own"
  on public.game_stats for delete
  using (true); -- Temporarily allow all deletes until Clerk is integrated

-- ============================================
-- 7. RLS Policies for Game Sessions
-- ============================================
-- Drop existing policies if they exist
drop policy if exists "game_sessions_select_own" on public.game_sessions;
drop policy if exists "game_sessions_insert_own" on public.game_sessions;
drop policy if exists "game_sessions_update_own" on public.game_sessions;
drop policy if exists "game_sessions_delete_own" on public.game_sessions;

-- Allow users to read their own sessions
create policy "game_sessions_select_own"
  on public.game_sessions for select
  using (true); -- Temporarily allow all reads until Clerk is integrated

-- Allow users to insert their own sessions
create policy "game_sessions_insert_own"
  on public.game_sessions for insert
  with check (true); -- Temporarily allow all inserts until Clerk is integrated

-- Allow users to update their own sessions
create policy "game_sessions_update_own"
  on public.game_sessions for update
  using (true) -- Temporarily allow all updates until Clerk is integrated
  with check (true);

-- Allow users to delete their own sessions
create policy "game_sessions_delete_own"
  on public.game_sessions for delete
  using (true); -- Temporarily allow all deletes until Clerk is integrated

-- ============================================
-- 8. Create Functions
-- ============================================

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Function to initialize game stats when profile is created
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert initial game stats for new profile
  insert into public.game_stats (user_id, bankroll)
  values (new.id, 1000)
  on conflict (user_id) do nothing;
  
  return new;
end;
$$;

-- ============================================
-- 9. Create Triggers
-- ============================================

-- Trigger to update updated_at on profiles
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Trigger to update updated_at on game_stats
drop trigger if exists game_stats_updated_at on public.game_stats;
create trigger game_stats_updated_at
  before update on public.game_stats
  for each row
  execute function public.handle_updated_at();

-- Trigger to auto-create game stats when profile is created
drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row
  execute function public.handle_new_profile();

-- ============================================
-- 10. Grant Permissions
-- ============================================
-- Ensure authenticated users can access tables
grant usage on schema public to anon, authenticated;
grant all on public.profiles to anon, authenticated;
grant all on public.game_stats to anon, authenticated;
grant all on public.game_sessions to anon, authenticated;

-- ============================================
-- Setup Complete!
-- ============================================
-- Next steps:
-- 1. When integrating Clerk, update RLS policies to check clerk_user_id
-- 2. Example: using (auth.jwt() ->> 'clerk_user_id' = clerk_user_id)
-- 3. Update the handle_new_profile function if needed for Clerk integration
-- ============================================
