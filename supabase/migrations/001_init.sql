-- TripPot initial schema (Supabase-ready).
-- Amounts are USD cents. No real money movement in v1.
-- Apply with: supabase db reset   OR paste into the SQL editor.
-- RLS below is a sketch: tighten invite-by-code before production.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables (users/profiles, groups, memberships, contributions, invites, mock_spends)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  apple_id text,
  email text not null default '',
  display_name text not null default '',
  push_token text,
  tz text not null default 'America/New_York',
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  goal_cents integer not null check (goal_cents >= 0),
  trip_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  muted boolean not null default false,
  unique (group_id, user_id)
);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  code text not null unique,
  expires_at timestamptz not null,
  created_by uuid not null references public.profiles (id) on delete restrict
);

-- Display-only mock card activity. Post-MVP: Highnote/Unit issuing.
create table if not exists public.mock_spends (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists memberships_user_id_idx on public.memberships (user_id);
create index if not exists memberships_group_id_idx on public.memberships (group_id);
create index if not exists contributions_group_id_idx on public.contributions (group_id);
create index if not exists contributions_created_at_idx on public.contributions (created_at);
create index if not exists invites_code_idx on public.invites (code);
create index if not exists mock_spends_group_id_idx on public.mock_spends (group_id);

-- ---------------------------------------------------------------------------
-- Auth → profile
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, tz)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'tz', 'America/New_York')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Owner is always a member of a group they create.
create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.memberships (group_id, user_id, role, muted)
  values (new.id, new.owner_id, 'owner', false)
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();

-- ---------------------------------------------------------------------------
-- RLS helpers (security definer to avoid recursive policy checks)
-- ---------------------------------------------------------------------------

create or replace function public.is_group_member(_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships
    where group_id = _group_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_owner(_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groups
    where id = _group_id
      and owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security sketches
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.memberships enable row level security;
alter table public.contributions enable row level security;
alter table public.invites enable row level security;
alter table public.mock_spends enable row level security;

-- profiles: owner can CRUD self; members of shared groups can read each other
drop policy if exists "profiles_select_self_or_comember" on public.profiles;
create policy "profiles_select_self_or_comember"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.memberships mine
      join public.memberships theirs on mine.group_id = theirs.group_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
    )
  );

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_delete_self" on public.profiles;
create policy "profiles_delete_self"
  on public.profiles for delete
  to authenticated
  using (id = auth.uid());

-- groups: members read; owner writes
drop policy if exists "groups_select_member" on public.groups;
create policy "groups_select_member"
  on public.groups for select
  to authenticated
  using (public.is_group_member(id));

drop policy if exists "groups_insert_owner" on public.groups;
create policy "groups_insert_owner"
  on public.groups for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "groups_update_owner" on public.groups;
create policy "groups_update_owner"
  on public.groups for update
  to authenticated
  using (public.is_group_owner(id))
  with check (public.is_group_owner(id));

drop policy if exists "groups_delete_owner" on public.groups;
create policy "groups_delete_owner"
  on public.groups for delete
  to authenticated
  using (public.is_group_owner(id));

-- memberships: members read; join as self; update own muted; owner can manage
drop policy if exists "memberships_select_member" on public.memberships;
create policy "memberships_select_member"
  on public.memberships for select
  to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "memberships_insert_self_or_owner" on public.memberships;
create policy "memberships_insert_self_or_owner"
  on public.memberships for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or public.is_group_owner(group_id)
  );

drop policy if exists "memberships_update_self_or_owner" on public.memberships;
create policy "memberships_update_self_or_owner"
  on public.memberships for update
  to authenticated
  using (user_id = auth.uid() or public.is_group_owner(group_id))
  with check (user_id = auth.uid() or public.is_group_owner(group_id));

drop policy if exists "memberships_delete_self_or_owner" on public.memberships;
create policy "memberships_delete_self_or_owner"
  on public.memberships for delete
  to authenticated
  using (user_id = auth.uid() or public.is_group_owner(group_id));

-- contributions: members read; member inserts own row (honor-system deposit)
drop policy if exists "contributions_select_member" on public.contributions;
create policy "contributions_select_member"
  on public.contributions for select
  to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "contributions_insert_self_member" on public.contributions;
create policy "contributions_insert_self_member"
  on public.contributions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_group_member(group_id)
  );

-- invites: members manage; join-by-code should become a security definer RPC
drop policy if exists "invites_select_member" on public.invites;
create policy "invites_select_member"
  on public.invites for select
  to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "invites_insert_member" on public.invites;
create policy "invites_insert_member"
  on public.invites for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.is_group_member(group_id)
  );

drop policy if exists "invites_delete_owner" on public.invites;
create policy "invites_delete_owner"
  on public.invites for delete
  to authenticated
  using (public.is_group_owner(group_id));

-- mock_spends: members read; owner logs demo spend (not real money)
drop policy if exists "mock_spends_select_member" on public.mock_spends;
create policy "mock_spends_select_member"
  on public.mock_spends for select
  to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "mock_spends_insert_owner" on public.mock_spends;
create policy "mock_spends_insert_owner"
  on public.mock_spends for insert
  to authenticated
  with check (public.is_group_owner(group_id));

drop policy if exists "mock_spends_delete_owner" on public.mock_spends;
create policy "mock_spends_delete_owner"
  on public.mock_spends for delete
  to authenticated
  using (public.is_group_owner(group_id));

-- Realtime: client hook in src/hooks/useContributionsRealtime.ts
do $$
begin
  execute 'alter publication supabase_realtime add table public.contributions';
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

comment on table public.profiles is 'App user profile; 1:1 with auth.users';
comment on table public.mock_spends is 'Preview-only card spend. Real issuing (Highnote/Unit) is post-MVP.';
comment on column public.memberships.muted is 'When true, skip daily deposit reminders for this member+group.';
