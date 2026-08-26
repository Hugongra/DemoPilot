-- ============================================================
-- DemoPilot – Full Platform Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Extensions
create extension if not exists "uuid-ossp" with schema extensions;

-- ============================================================
-- 2. Workspaces (teams / organizations)
-- ============================================================
create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  logo_url    text,
  brand_color text default '#ff6058',
  owner_id    uuid references auth.users(id) on delete cascade not null,
  created_at  timestamptz default now()
);

create table if not exists public.workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  role         text not null default 'member' check (role in ('owner','admin','member','viewer')),
  joined_at    timestamptz default now(),
  unique(workspace_id, user_id)
);

-- ============================================================
-- 3. Demos table (enhanced)
-- ============================================================
create table if not exists public.demos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  workspace_id  uuid references public.workspaces(id) on delete set null,
  target_url    text not null,
  title         text,
  status        text not null default 'pending'
    check (status in ('pending','navigating','scripting','generating_audio','compositing','done','error')),
  language      text default 'en',
  steps         jsonb default '[]'::jsonb,
  script        text,
  audio_url     text,
  video_url     text,
  error         text,
  -- Personalization
  prospect_name    text,
  prospect_role    text,
  prospect_company text,
  -- Branding
  custom_intro     text,
  custom_cta_text  text,
  custom_cta_url   text,
  -- Analytics counters
  view_count       int default 0,
  -- Timestamps
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- 4. Analytics events (granular tracking)
-- ============================================================
create table if not exists public.demo_analytics (
  id         uuid primary key default gen_random_uuid(),
  demo_id    uuid references public.demos(id) on delete cascade not null,
  event_type text not null check (event_type in ('view','play','pause','complete','cta_click','embed_view','share')),
  viewer_id  text,
  duration_seconds numeric,
  metadata   jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- 5. CRM webhook configurations
-- ============================================================
create table if not exists public.webhooks (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name         text not null,
  url          text not null,
  events       text[] not null default '{}',
  secret       text,
  active       boolean default true,
  created_at   timestamptz default now()
);

-- ============================================================
-- 6. Live demo sessions (for interactive mode)
-- ============================================================
create table if not exists public.live_sessions (
  id           uuid primary key default gen_random_uuid(),
  demo_id      uuid references public.demos(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  target_url   text not null,
  status       text not null default 'waiting'
    check (status in ('waiting','active','ended')),
  language     text default 'en',
  viewer_name  text,
  viewer_role  text,
  viewer_company text,
  transcript   jsonb default '[]'::jsonb,
  started_at   timestamptz,
  ended_at     timestamptz,
  created_at   timestamptz default now()
);

-- ============================================================
-- 7. Product Knowledge Base
-- ============================================================
create table if not exists public.product_knowledge (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  source_type  text not null check (source_type in ('document','url','demo_script','faq','objection')),
  title        text not null,
  content      text not null,
  source_url   text,
  metadata     jsonb default '{}'::jsonb,
  created_at   timestamptz default now()
);

-- ============================================================
-- 8. Row Level Security
-- ============================================================
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.demos enable row level security;
alter table public.demo_analytics enable row level security;
alter table public.webhooks enable row level security;
alter table public.live_sessions enable row level security;
alter table public.product_knowledge enable row level security;

-- Workspaces: members can read, owner can modify
create policy "Members read workspaces" on public.workspaces
  for select using (
    id in (select workspace_id from public.workspace_members where user_id = auth.uid())
    or owner_id = auth.uid()
  );
create policy "Owner manage workspaces" on public.workspaces
  for all using (owner_id = auth.uid());

-- Workspace members: members can read their workspace
create policy "Read workspace members" on public.workspace_members
  for select using (
    workspace_id in (select workspace_id from public.workspace_members wm where wm.user_id = auth.uid())
  );
create policy "Admin manage members" on public.workspace_members
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('owner','admin')
    )
  );

-- Demos: public read, owner/workspace write
create policy "Public read demos" on public.demos for select using (true);
create policy "Insert demos" on public.demos for insert with check (true);
create policy "Owner update demos" on public.demos for update
  using (auth.uid() = user_id or user_id is null);
create policy "Owner delete demos" on public.demos for delete
  using (auth.uid() = user_id);

-- Analytics: public insert (for tracking), owner read
create policy "Insert analytics" on public.demo_analytics for insert with check (true);
create policy "Read own analytics" on public.demo_analytics for select
  using (
    demo_id in (select id from public.demos where user_id = auth.uid())
  );

-- Webhooks: workspace admins only
create policy "Workspace admin webhooks" on public.webhooks
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('owner','admin')
    )
  );

-- Live sessions: public read (viewers need access), owner manage
create policy "Public read live sessions" on public.live_sessions for select using (true);
create policy "Insert live sessions" on public.live_sessions for insert with check (true);
create policy "Update live sessions" on public.live_sessions for update using (true);

-- ============================================================
-- 8. Indexes
-- ============================================================
create index if not exists idx_demos_user_id on public.demos(user_id);
create index if not exists idx_demos_workspace_id on public.demos(workspace_id);
create index if not exists idx_demos_created_at on public.demos(created_at desc);
create index if not exists idx_analytics_demo_id on public.demo_analytics(demo_id);
create index if not exists idx_analytics_created_at on public.demo_analytics(created_at desc);
create index if not exists idx_workspace_members_user on public.workspace_members(user_id);
create index if not exists idx_live_sessions_status on public.live_sessions(status);
create index if not exists idx_knowledge_user on public.product_knowledge(user_id);
create index if not exists idx_knowledge_workspace on public.product_knowledge(workspace_id);

-- Knowledge base: owner read/write
create policy "Owner manage knowledge" on public.product_knowledge
  for all using (user_id = auth.uid());
create policy "Workspace read knowledge" on public.product_knowledge
  for select using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );
