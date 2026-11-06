-- ============================================================================
-- Cartoon Cat Couple's Arcade — Supabase PostgreSQL Schema
-- Run this entire script in your Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================================

-- 1. Couple Rooms Table (Persistent room, customizable Cat Avatars, Lifetime Scoreboard)
create table if not exists public.couple_rooms (
  room_code text primary key,
  p1_avatar jsonb not null default '{"name":"Lovey 1","breed":"strawberry-cat","accessory":"crown"}'::jsonb,
  p2_avatar jsonb not null default '{"name":"Lovey 2","breed":"orange-tabby","accessory":"ribbon"}'::jsonb,
  p1_dama_wins integer not null default 0,
  p2_dama_wins integer not null default 0,
  p1_snakes_wins integer not null default 0,
  p2_snakes_wins integer not null default 0,
  p1_uno_wins integer not null default 0,
  p2_uno_wins integer not null default 0,
  current_mode text not null default 'dama' check (current_mode in ('dama', 'snakes', 'uno')),
  updated_at timestamptz not null default now()
);

-- 2. Active Matches Table (Authoritative board state & boardSeed for instant reconnect)
create table if not exists public.active_matches (
  room_code text primary key references public.couple_rooms(room_code) on delete cascade,
  game_mode text not null default 'dama' check (game_mode in ('dama', 'snakes', 'uno')),
  turn text not null default 'p1' check (turn in ('p1', 'p2')),
  board_seed integer not null default 123456,
  state_json jsonb not null default '{}'::jsonb,
  winner text check (winner in ('p1', 'p2', 'draw') or winner is null),
  updated_at timestamptz not null default now()
);

-- 3. Match History Table (Recent couple match log)
create table if not exists public.match_history (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references public.couple_rooms(room_code) on delete cascade,
  game_mode text not null check (game_mode in ('dama', 'snakes', 'uno')),
  winner text not null check (winner in ('p1', 'p2', 'draw')),
  p1_name text not null,
  p2_name text not null,
  summary text not null default '',
  played_at timestamptz not null default now()
);

-- 4. Safe Migrations for Existing Supabase Tables
alter table if exists public.couple_rooms add column if not exists p1_uno_wins integer not null default 0;
alter table if exists public.couple_rooms add column if not exists p2_uno_wins integer not null default 0;
alter table if exists public.couple_rooms drop constraint if exists couple_rooms_current_mode_check;
alter table if exists public.couple_rooms add constraint couple_rooms_current_mode_check check (current_mode in ('dama', 'snakes', 'uno'));

alter table if exists public.active_matches drop constraint if exists active_matches_game_mode_check;
alter table if exists public.active_matches add constraint active_matches_game_mode_check check (game_mode in ('dama', 'snakes', 'uno'));

alter table if exists public.match_history drop constraint if exists match_history_game_mode_check;
alter table if exists public.match_history add constraint match_history_game_mode_check check (game_mode in ('dama', 'snakes', 'uno'));

-- 5. Enable Row Level Security (Open anonymous access scoped by room_code for frictionless 2-player couple login)
alter table public.couple_rooms enable row level security;
alter table public.active_matches enable row level security;
alter table public.match_history enable row level security;

drop policy if exists "Allow anon access to couple_rooms" on public.couple_rooms;
create policy "Allow anon access to couple_rooms"
  on public.couple_rooms for all
  using (true)
  with check (true);

drop policy if exists "Allow anon access to active_matches" on public.active_matches;
create policy "Allow anon access to active_matches"
  on public.active_matches for all
  using (true)
  with check (true);

drop policy if exists "Allow anon access to match_history" on public.match_history;
create policy "Allow anon access to match_history"
  on public.match_history for all
  using (true)
  with check (true);

-- 6. Enable Realtime Postgres Changes for couple_rooms and active_matches
alter publication supabase_realtime add table public.couple_rooms;
alter publication supabase_realtime add table public.active_matches;
