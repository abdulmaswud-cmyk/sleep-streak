-- Sleep Streaks schema for Supabase
-- Run this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'Sleeper',
  bedtime_goal time not null default time '22:00',
  wake_goal time not null default time '07:00',
  target_sleep_hours numeric(3,1) not null default 9.0,
  theme text not null default 'twilight',
  reminder_time time not null default time '21:45',
  nudges_enabled boolean not null default true,
  bedtime_alarm text not null default 'default-chime',
  wake_alarm text not null default 'default-bell',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_target_sleep_hours_check
    check (target_sleep_hours >= 4 and target_sleep_hours <= 12),
  constraint user_profiles_theme_check
    check (theme in ('twilight', 'dawn', 'midnight'))
);

create table if not exists public.sleep_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_key date not null,
  bedtime_on_time boolean,
  wake_on_time boolean,
  bedtime_checked_at timestamptz,
  wake_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sleep_checkins_user_day_unique unique (user_id, day_key)
);

create index if not exists sleep_checkins_user_day_idx
  on public.sleep_checkins(user_id, day_key desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_sleep_checkins_updated_at on public.sleep_checkins;
create trigger trg_sleep_checkins_updated_at
before update on public.sleep_checkins
for each row
execute function public.set_updated_at();

-- Optional helper: create an empty profile automatically when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.user_profiles enable row level security;
alter table public.sleep_checkins enable row level security;

drop policy if exists "profiles_select_own" on public.user_profiles;
create policy "profiles_select_own"
on public.user_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.user_profiles;
create policy "profiles_insert_own"
on public.user_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.user_profiles;
create policy "profiles_update_own"
on public.user_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "profiles_delete_own" on public.user_profiles;
create policy "profiles_delete_own"
on public.user_profiles
for delete
using (auth.uid() = user_id);

drop policy if exists "checkins_select_own" on public.sleep_checkins;
create policy "checkins_select_own"
on public.sleep_checkins
for select
using (auth.uid() = user_id);

drop policy if exists "checkins_insert_own" on public.sleep_checkins;
create policy "checkins_insert_own"
on public.sleep_checkins
for insert
with check (auth.uid() = user_id);

drop policy if exists "checkins_update_own" on public.sleep_checkins;
create policy "checkins_update_own"
on public.sleep_checkins
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "checkins_delete_own" on public.sleep_checkins;
create policy "checkins_delete_own"
on public.sleep_checkins
for delete
using (auth.uid() = user_id);
