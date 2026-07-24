-- BuilderOS builder profile table (Phase 1, Step 7)

create table if not exists public.builder_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  avatar text,
  bio text not null default '',
  github_username text not null,
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists builder_profiles_username_idx
  on public.builder_profiles (username);

create index if not exists builder_profiles_github_username_idx
  on public.builder_profiles (github_username);

alter table public.builder_profiles enable row level security;

create policy "Builder profiles are publicly readable"
  on public.builder_profiles
  for select
  using (true);

create policy "Users can create their own builder profile"
  on public.builder_profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update their own builder profile"
  on public.builder_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.set_builder_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists builder_profiles_set_updated_at on public.builder_profiles;

create trigger builder_profiles_set_updated_at
before update on public.builder_profiles
for each row
execute function public.set_builder_profiles_updated_at();
