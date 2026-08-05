-- Football Career Simulator - Schema inicial
-- Ejecutar en el SQL editor de Supabase.

-- =====================================================
-- 1. PROFILES (extiende auth.users)
-- =====================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Trigger para crear profile automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================
-- 2. CAREERS
-- =====================================================
create table if not exists public.careers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  share_slug text unique,
  is_public boolean default false,
  player_name text not null,
  nationality text not null,
  position text not null,
  difficulty text not null default 'normal',
  current_team_id text,
  current_league_id text,
  age int not null default 18,
  overall int not null default 65,
  potential int not null default 80,
  reputation int not null default 20,
  morale int not null default 80,
  fitness int not null default 100,
  season_number int not null default 1,
  week int not null default 1,
  is_retired boolean not null default false,
  attributes jsonb not null default '{}'::jsonb,
  totals jsonb not null default '{"goals":0,"assists":0,"apps":0,"motm":0}'::jsonb,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists careers_user_id_idx on public.careers(user_id);
create index if not exists careers_share_slug_idx on public.careers(share_slug);

alter table public.careers enable row level security;

drop policy if exists "Owners read their careers" on public.careers;
create policy "Owners read their careers" on public.careers for select using (auth.uid() = user_id);

drop policy if exists "Public careers readable by anyone" on public.careers;
create policy "Public careers readable by anyone" on public.careers for select using (is_public = true);

drop policy if exists "Owners insert their careers" on public.careers;
create policy "Owners insert their careers" on public.careers for insert with check (auth.uid() = user_id);

drop policy if exists "Owners update their careers" on public.careers;
create policy "Owners update their careers" on public.careers for update using (auth.uid() = user_id);

drop policy if exists "Owners delete their careers" on public.careers;
create policy "Owners delete their careers" on public.careers for delete using (auth.uid() = user_id);

-- =====================================================
-- 3. SEASONS (histórico por temporada)
-- =====================================================
create table if not exists public.career_seasons (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers(id) on delete cascade,
  season_number int not null,
  team_id text not null,
  team_name text not null,
  league_id text not null,
  team_league_finish int,
  apps int not null default 0,
  goals int not null default 0,
  assists int not null default 0,
  motm int not null default 0,
  avg_rating numeric(3,2),
  trophies jsonb not null default '[]'::jsonb,
  individual_awards jsonb not null default '[]'::jsonb,
  national_team_apps int not null default 0,
  national_team_goals int not null default 0,
  world_cup_participated text,
  created_at timestamptz default now(),
  unique (career_id, season_number)
);

alter table public.career_seasons enable row level security;

drop policy if exists "Season read via career" on public.career_seasons;
create policy "Season read via career" on public.career_seasons for select using (
  exists (select 1 from public.careers c where c.id = career_id and (c.user_id = auth.uid() or c.is_public))
);

drop policy if exists "Season write by owner" on public.career_seasons;
create policy "Season write by owner" on public.career_seasons for all using (
  exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid())
) with check (
  exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid())
);

-- =====================================================
-- 4. CONTRACTS
-- =====================================================
create table if not exists public.career_contracts (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers(id) on delete cascade,
  team_id text not null,
  team_name text not null,
  season_start int not null,
  season_end int not null,
  wage_weekly int not null,
  transfer_fee int not null default 0,
  release_clause int,
  signed_at timestamptz default now()
);

alter table public.career_contracts enable row level security;

drop policy if exists "Contract read via career" on public.career_contracts;
create policy "Contract read via career" on public.career_contracts for select using (
  exists (select 1 from public.careers c where c.id = career_id and (c.user_id = auth.uid() or c.is_public))
);

drop policy if exists "Contract write by owner" on public.career_contracts;
create policy "Contract write by owner" on public.career_contracts for all using (
  exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid())
) with check (
  exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid())
);

-- =====================================================
-- 5. EVENTS (decisiones de temporada)
-- =====================================================
create table if not exists public.career_events (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers(id) on delete cascade,
  season_number int not null,
  week int not null,
  event_key text not null,
  title text not null,
  description text not null,
  choice_key text,
  choice_label text,
  outcome jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists career_events_career_id_idx on public.career_events(career_id);

alter table public.career_events enable row level security;

drop policy if exists "Event read via career" on public.career_events;
create policy "Event read via career" on public.career_events for select using (
  exists (select 1 from public.careers c where c.id = career_id and (c.user_id = auth.uid() or c.is_public))
);

drop policy if exists "Event write by owner" on public.career_events;
create policy "Event write by owner" on public.career_events for all using (
  exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid())
) with check (
  exists (select 1 from public.careers c where c.id = career_id and c.user_id = auth.uid())
);

-- =====================================================
-- Trigger updated_at en careers
-- =====================================================
-- `set search_path` fija el esquema: sin él, la función se puede secuestrar
-- creando objetos con el mismo nombre en un esquema que se resuelva antes.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists careers_touch on public.careers;
create trigger careers_touch before update on public.careers
  for each row execute function public.touch_updated_at();

-- =====================================================
-- Endurecido
-- =====================================================
-- Las dos funciones anteriores son disparadores, no API. Al vivir en el
-- esquema `public` quedan expuestas como RPC en /rest/v1/rpc/… y ejecutables
-- por cualquiera. Se revoca el permiso: los triggers siguen funcionando
-- porque se ejecutan como el propietario, no como quien hace la petición.
revoke all on function public.handle_new_user() from anon, authenticated, public;
revoke all on function public.touch_updated_at() from anon, authenticated, public;
