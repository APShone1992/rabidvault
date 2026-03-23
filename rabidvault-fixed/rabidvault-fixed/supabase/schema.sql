-- ================================================================
-- THE RABID VAULT DATABASE SCHEMA
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- PROFILES (extends Supabase auth.users)
-- ----------------------------------------------------------------
create table public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  username     text unique not null,
  avatar_url   text,
  bio          text,
  created_at   timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------
-- COMICS (master reference table, shared across all users)
-- ----------------------------------------------------------------
create table public.comics (
  id              uuid default uuid_generate_v4() primary key,
  title           text not null,
  issue_number    text,
  publisher       text,
  cover_url       text,
  comicvine_id    text unique,
  description     text,
  publish_date    date,
  created_at      timestamptz default now()
);

-- ----------------------------------------------------------------
-- COLLECTION (user's owned comics)
-- ----------------------------------------------------------------
create table public.collection (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  comic_id        uuid references public.comics(id) on delete cascade not null,
  grade           text not null default 'Near Mint',
  paid_price      numeric(10,2) default 0,
  current_value   numeric(10,2) default 0,
  notes           text,
  read_at         timestamptz default null,
  added_at        timestamptz default now(),
  unique(user_id, comic_id, grade)
);

-- ----------------------------------------------------------------
-- PRICE HISTORY (track value changes over time)
-- ----------------------------------------------------------------
create table public.price_history (
  id          uuid default uuid_generate_v4() primary key,
  comic_id    uuid references public.comics(id) on delete cascade not null,
  grade       text not null,
  price       numeric(10,2) not null,
  source      text default 'comicvine',
  recorded_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- WISHLIST
-- ----------------------------------------------------------------
create table public.wishlist (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  title           text not null,
  issue_number    text,
  publisher       text,
  cover_url       text,
  target_price    numeric(10,2) default 0,
  priority        text default 'Medium' check (priority in ('High','Medium','Low')),
  alert_enabled   boolean default false,
  notes           text,
  added_at        timestamptz default now()
);

-- ----------------------------------------------------------------
-- FRIENDS (mutual follows)
-- ----------------------------------------------------------------
create table public.friendships (
  id          uuid default uuid_generate_v4() primary key,
  requester   uuid references public.profiles(id) on delete cascade not null,
  addressee   uuid references public.profiles(id) on delete cascade not null,
  status      text default 'pending' check (status in ('pending','accepted','blocked')),
  created_at  timestamptz default now(),
  unique(requester, addressee)
);

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- Users can only read/write their own data
-- ----------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.collection   enable row level security;
alter table public.wishlist     enable row level security;
alter table public.friendships  enable row level security;
alter table public.comics       enable row level security;
alter table public.price_history enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Public profiles are viewable by all" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Comics: everyone can read, authenticated users can insert
create policy "Comics are public" on public.comics for select using (true);
create policy "Authenticated users can insert comics" on public.comics for insert with check (auth.role() = 'authenticated');

-- Collection: users manage their own
create policy "Users insert own collection" on public.collection for insert with check (auth.uid() = user_id);
create policy "Users update own collection" on public.collection for update using (auth.uid() = user_id);
create policy "Users delete own collection" on public.collection for delete using (auth.uid() = user_id);

-- Users AND accepted friends can view a collection
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

-- Wishlist: private to owner
create policy "Users manage own wishlist" on public.wishlist for all using (auth.uid() = user_id);

-- Friendships
create policy "Users view own friendships" on public.friendships for select using (auth.uid() = requester or auth.uid() = addressee);
create policy "Users send friend requests" on public.friendships for insert with check (auth.uid() = requester);
create policy "Users update own friendships" on public.friendships for update using (auth.uid() = requester or auth.uid() = addressee);

-- Price history: public read
create policy "Price history is public" on public.price_history for select using (true);
create policy "Authenticated users insert price history" on public.price_history for insert with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- HELPFUL INDEXES
-- ----------------------------------------------------------------
create index on public.collection(user_id);
create index on public.price_history(comic_id, recorded_at desc);
create index on public.friendships(requester, status);
create index on public.friendships(addressee, status);
