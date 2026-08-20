-- ============================================================
-- DemoPilot – Database schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Enable required extensions
create extension if not exists "uuid-ossp" with schema extensions;

-- 2. Demos table
create table if not exists public.demos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  target_url  text not null,
  status      text not null default 'pending' check (status in ('pending','navigating','scripting','generating_audio','compositing','done','error')),
  steps       jsonb default '[]'::jsonb,
  script      text,
  audio_url   text,
  video_url   text,
  error       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

comment on table public.demos is 'Stores every generated demo, optionally linked to a user.';

-- 3. Enable Row Level Security
alter table public.demos enable row level security;

-- 4. RLS policies

-- Anyone can read demos (public gallery / shared links)
create policy "Public read access"
  on public.demos
  for select
  using (true);

-- Authenticated AND anonymous users can create demos
create policy "Authenticated and anonymous insert"
  on public.demos
  for insert
  with check (true);

-- Owner or the original creator can update their demos
create policy "Owner update"
  on public.demos
  for update
  using (auth.uid() = user_id or user_id is null);

-- Only the owner can delete their own demos
create policy "Owner delete"
  on public.demos
  for delete
  using (auth.uid() = user_id);

-- 5. Index for faster user-specific queries
create index if not exists idx_demos_user_id on public.demos(user_id);
create index if not exists idx_demos_created_at on public.demos(created_at desc);
