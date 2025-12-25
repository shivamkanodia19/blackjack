-- Create user profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- RLS policies for profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Create game stats table
create table if not exists public.game_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bankroll integer not null default 1000,
  hands_played integer not null default 0,
  hands_won integer not null default 0,
  hands_lost integer not null default 0,
  hands_pushed integer not null default 0,
  total_moves integer not null default 0,
  strategy_decisions integer not null default 0,
  strategy_correct integer not null default 0,
  strategy_streak integer not null default 0,
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.game_stats enable row level security;

-- RLS policies for game_stats
create policy "game_stats_select_own"
  on public.game_stats for select
  using (auth.uid() = user_id);

create policy "game_stats_insert_own"
  on public.game_stats for insert
  with check (auth.uid() = user_id);

create policy "game_stats_update_own"
  on public.game_stats for update
  using (auth.uid() = user_id);

-- Create trigger to auto-create profile and game stats on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert profile
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', 'Player'),
    new.email
  )
  on conflict (id) do nothing;

  -- Insert initial game stats
  insert into public.game_stats (user_id, bankroll)
  values (new.id, 1000)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
