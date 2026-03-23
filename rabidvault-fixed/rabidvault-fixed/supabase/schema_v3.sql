-- ================================================================
-- THE RABID VAULT — SCHEMA V3 + V4
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ================================================================

-- ── Extra columns on existing tables ──────────────────────────
alter table public.profiles
  add column if not exists xp           integer default 0,
  add column if not exists level        integer default 1,
  add column if not exists total_scans  integer default 0,
  add column if not exists country      text,
  add column if not exists last_seen    timestamptz default now();

alter table public.comics
  add column if not exists barcode            text,
  add column if not exists volume_id          text,
  add column if not exists volume_issue_count integer,
  add column if not exists deck               text;

alter table public.collection
  add column if not exists read_at       timestamptz default null,
  add column if not exists reading_order integer default null;

alter table public.wishlist
  add column if not exists comicvine_id text,
  add column if not exists cover_url    text;

-- ── Release cache ──────────────────────────────────────────────
create table if not exists public.release_cache (
  id        uuid default uuid_generate_v4() primary key,
  week_of   date unique not null,
  releases  jsonb not null,
  cached_at timestamptz default now()
);
alter table public.release_cache enable row level security;
do $$ begin
  create policy "Release cache public read"   on public.release_cache for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated can insert rc" on public.release_cache for insert with check (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated can update rc" on public.release_cache for update using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

-- ── Achievements master list ───────────────────────────────────
create table if not exists public.achievements (
  id          text primary key,
  name        text not null,
  description text not null,
  icon        text not null,
  xp_reward   integer default 25,
  tier        text default 'bronze' check (tier in ('bronze','silver','gold','platinum'))
);
alter table public.achievements enable row level security;
do $$ begin
  create policy "Achievements are public" on public.achievements for select using (true);
exception when duplicate_object then null; end $$;

insert into public.achievements (id, name, description, icon, xp_reward, tier) values
  ('first_comic',    'First Issue',      'Add your first comic',                   '📗', 10,  'bronze'),
  ('ten_comics',     'Collector',        'Add 10 comics',                          '📚', 25,  'bronze'),
  ('twenty_five',    'Bibliophile',      'Add 25 comics',                          '🗃️', 50,  'silver'),
  ('fifty_comics',   'Archivist',        'Add 50 comics',                          '🏛️', 100, 'gold'),
  ('hundred_comics', 'Legend',           'Add 100 comics',                         '👑', 250, 'platinum'),
  ('value_1k',       'Thousand Club',    'Collection worth over £1,000',           '💰', 25,  'bronze'),
  ('value_10k',      'Golden Key',       'Collection worth over £10,000',          '🔑', 100, 'gold'),
  ('value_50k',      'Diamond Tier',     'Collection worth over £50,000',          '💎', 500, 'platinum'),
  ('first_scan',     'Scanner',          'Scan your first comic cover',            '📷', 10,  'bronze'),
  ('fifty_scans',    'The Scout',        'Scan 50 comics',                         '🔭', 75,  'silver'),
  ('first_friend',   'Connected',        'Add your first friend',                  '🤝', 15,  'bronze'),
  ('five_friends',   'Social Butterfly', 'Add 5 friends',                          '🦋', 50,  'silver'),
  ('first_wishlist', 'Dreamer',          'Add your first wishlist item',           '⭐', 10,  'bronze'),
  ('wishlist_filled','Wish Fulfilled',   'Buy a comic from your wishlist',         '🎯', 50,  'silver'),
  ('roi_100',        'Savvy Investor',   'Achieve 100% ROI on your collection',    '📈', 75,  'silver'),
  ('roi_500',        'Wall Street',      'Achieve 500% ROI on your collection',    '🚀', 200, 'gold'),
  ('variant_hunter', 'Variant Hunter',  'Add 3 variant covers of the same issue', '🎨', 50,  'silver'),
  ('complete_run',   'Run Complete',     'Own issues #1-12 of any series',         '🏆', 150, 'gold')
on conflict (id) do nothing;

-- ── User achievements ──────────────────────────────────────────
create table if not exists public.user_achievements (
  id             uuid default uuid_generate_v4() primary key,
  user_id        uuid references public.profiles(id) on delete cascade,
  achievement_id text references public.achievements(id),
  unlocked_at    timestamptz default now(),
  unique(user_id, achievement_id)
);
alter table public.user_achievements enable row level security;
do $$ begin
  create policy "Users view own achievements"   on public.user_achievements for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public can view achievements"  on public.user_achievements for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users insert own achievements" on public.user_achievements for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ── XP log ─────────────────────────────────────────────────────
create table if not exists public.xp_log (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) on delete cascade,
  amount     integer not null,
  reason     text not null,
  created_at timestamptz default now()
);
alter table public.xp_log enable row level security;
do $$ begin
  create policy "Users view own xp log" on public.xp_log for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users insert own xp"   on public.xp_log for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ── Activity feed ──────────────────────────────────────────────
create table if not exists public.activity_feed (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) on delete cascade,
  type       text not null,
  payload    jsonb,
  read_at    timestamptz default null,
  created_at timestamptz default now()
);
alter table public.activity_feed enable row level security;
do $$ begin
  create policy "Users + friends see activity" on public.activity_feed for select
    using (
      auth.uid() = user_id or
      exists (
        select 1 from public.friendships
        where status = 'accepted'
        and ((requester = auth.uid() and addressee = user_id)
          or (addressee = auth.uid() and requester = user_id))
      )
    );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users insert own activity"    on public.activity_feed for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update own activity" on public.activity_feed for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ── Leaderboard view ───────────────────────────────────────────
create or replace view public.leaderboard as
select
  p.id, p.username, p.avatar_url, p.level, p.xp,
  coalesce(sum(c.current_value), 0) as total_value,
  count(c.id)                        as comic_count
from public.profiles p
left join public.collection c on c.user_id = p.id
group by p.id, p.username, p.avatar_url, p.level, p.xp
order by total_value desc;

-- ── Avatar storage bucket ──────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

do $$ begin
  create policy "Avatar images are public" on storage.objects for select using (bucket_id = 'avatars');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can upload own avatar" on storage.objects for insert
    with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update own avatar" on storage.objects for update
    using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;

-- ── delete_user RPC ────────────────────────────────────────────
create or replace function public.delete_user()
returns void language plpgsql security definer
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- ── Performance indexes ────────────────────────────────────────
create index if not exists collection_user_id_idx    on public.collection(user_id);
create index if not exists collection_comic_id_idx   on public.collection(comic_id);
create index if not exists collection_added_at_idx   on public.collection(added_at desc);
create index if not exists comics_volume_id_perf_idx on public.comics(volume_id) where volume_id is not null;
create index if not exists comics_comicvine_id_idx   on public.comics(comicvine_id) where comicvine_id is not null;
create index if not exists friendships_requester_idx on public.friendships(requester);
create index if not exists friendships_addressee_idx on public.friendships(addressee);

-- ── Additional RLS policies ────────────────────────────────────
do $$ begin
  create policy "Authenticated users can update comics" on public.comics for update
    using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can delete own friendships" on public.friendships for delete
    using (auth.uid() = requester or auth.uid() = addressee);
exception when duplicate_object then null; end $$;

-- ── Weekly value snapshots ─────────────────────────────────────
create table if not exists public.value_snapshots (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  total_value numeric(12,2) not null,
  total_spent numeric(12,2) not null,
  comic_count integer not null,
  recorded_at timestamptz default now()
);
alter table public.value_snapshots enable row level security;
do $$ begin
  create policy "Users view own snapshots"   on public.value_snapshots for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users insert own snapshots" on public.value_snapshots for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
create index if not exists snapshots_user_date_idx on public.value_snapshots(user_id, recorded_at desc);

-- ── Barcode cache ──────────────────────────────────────────────
create table if not exists public.barcode_cache (
  barcode      text primary key,
  comic_id     uuid references public.comics(id) on delete set null,
  title        text,
  issue_number text,
  publisher    text,
  cover_url    text,
  resolved_at  timestamptz default now()
);
alter table public.barcode_cache enable row level security;
do $$ begin
  create policy "Barcode cache public read"  on public.barcode_cache for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth users insert barcodes" on public.barcode_cache for insert with check (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth users update barcodes" on public.barcode_cache for update using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

-- ── Fix collection RLS: replace split policies with one unified policy ──
-- The original schema.sql had two SELECT policies on collection which caused
-- Postgres to evaluate them independently. Only the owner could ever see their
-- own rows because the simpler policy shadowed the friends one.
-- This migration consolidates them into a single inclusive policy.
do $$ begin
  drop policy if exists "Users view own collection"  on public.collection;
  drop policy if exists "Friends can view collection" on public.collection;
exception when undefined_object then null; end $$;

do $$ begin
  create policy "Users and friends can view collection" on public.collection for select
    using (
      auth.uid() = user_id or
      exists (
        select 1 from public.friendships
        where status = 'accepted'
        and ((requester = auth.uid() and addressee = user_id)
          or (addressee = auth.uid() and requester = user_id))
      )
    );
exception when duplicate_object then null; end $$;
