-- =============================================================================
-- Na Grade — Schema inicial do banco de dados
-- Execute este arquivo no SQL Editor do Supabase:
-- https://app.supabase.com > seu projeto > SQL Editor
-- =============================================================================

-- Habilitar extensão para UUIDs (já vem ativada no Supabase, mas garantindo)
create extension if not exists "pgcrypto";

-- =============================================================================
-- TABELA: events
-- Catálogo compartilhado de shows/festivais.
-- Usuários não criam eventos duplicados — todo mundo aponta pro mesmo registro.
-- =============================================================================
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  artist      text not null,
  venue       text not null,
  city        text not null,
  state       text,
  country     text not null default 'BR',
  event_date  date not null,
  festival    boolean not null default false,
  setlistfm_id text unique,  -- ID do setlist.fm para evitar duplicatas da fonte externa
  source      text not null default 'manual' check (source in ('setlistfm', 'manual')),
  created_at  timestamptz not null default now()
);

-- Índices para buscas comuns
create index if not exists events_artist_idx on public.events (lower(artist));
create index if not exists events_date_idx   on public.events (event_date);

-- =============================================================================
-- TABELA: genres
-- Vocabulário COMPARTILHADO de gêneros musicais. O usuário reaproveita um
-- gênero existente ou cadastra um novo; a normalização evita duplicatas.
-- =============================================================================
create table if not exists public.genres (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists genres_name_unique_idx on public.genres (lower(name));
create index if not exists genres_name_search_idx on public.genres (lower(name) text_pattern_ops);

-- =============================================================================
-- TABELA: festivals
-- Catálogo COMPARTILHADO de festivais — mesma lógica de `events`.
-- Um "Rock in Rio 2024" só, para todos os usuários. Isso é o que permite,
-- na fase social, saber quais amigos foram ao mesmo festival.
-- =============================================================================
create table if not exists public.festivals (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text,
  country     text not null default 'BR',
  start_date  date,
  end_date    date,
  source      text not null default 'manual' check (source in ('manual', 'setlistfm')),
  created_at  timestamptz not null default now()
);

create unique index if not exists festivals_name_unique_idx on public.festivals (lower(name));
create index if not exists festivals_name_search_idx on public.festivals (lower(name) text_pattern_ops);

-- =============================================================================
-- TABELA: user_festivals
-- O ingresso PESSOAL do usuário num festival do catálogo.
-- O preço é pessoal (cada um paga um valor); a identidade é compartilhada.
-- =============================================================================
create table if not exists public.user_festivals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  festival_id   uuid not null references public.festivals(id) on delete cascade,
  name          text,  -- cópia histórica; a fonte da verdade é festivals.name
  ticket_price  numeric(10, 2) check (ticket_price >= 0),
  ticket_type   text check (ticket_type in (
                  'pista', 'pista_premium', 'cadeira', 'cadeira_inferior',
                  'cadeira_superior', 'vip', 'camarote', 'outro')),
  festival_date date,
  created_at    timestamptz not null default now(),

  constraint user_festivals_user_festival_key unique (user_id, festival_id)
);

create index if not exists user_festivals_user_idx on public.user_festivals (user_id);
create index if not exists user_festivals_festival_idx on public.user_festivals (festival_id);

-- =============================================================================
-- TABELA: user_events
-- Vínculo pessoal entre usuário e evento.
-- Cada linha = "eu fui nesse show, com essas características pessoais".
-- =============================================================================
create table if not exists public.user_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  event_id     uuid not null references public.events(id) on delete cascade,
  rating       smallint check (rating >= 1 and rating <= 10),
  ticket_price numeric(10, 2) check (ticket_price >= 0),
  ticket_type  text check (ticket_type in ('pista', 'pista_premium', 'cadeira', 'cadeira_inferior', 'cadeira_superior', 'vip', 'camarote', 'outro')),
  genre        text,
  notes        text,
  festival     boolean not null default false,
  festival_name text,
  user_festival_id uuid references public.user_festivals(id) on delete set null,
  created_at   timestamptz not null default now(),

  -- Um usuário não pode registrar o mesmo show duas vezes
  unique (user_id, event_id)
);

-- Índices para listagem do histórico do usuário
create index if not exists user_events_user_idx on public.user_events (user_id);
create index if not exists user_events_festival_idx on public.user_events (user_festival_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Segunda camada de defesa — mesmo que o back-end tenha um bug de autorização,
-- o banco nega o acesso diretamente.
-- =============================================================================

-- Ativar RLS em todas as tabelas
alter table public.events         enable row level security;
alter table public.user_events    enable row level security;
alter table public.genres         enable row level security;
alter table public.festivals      enable row level security;
alter table public.user_festivals enable row level security;

-- GENRES: catálogo compartilhado — todos leem e podem cadastrar
create policy "Usuários autenticados podem ler gêneros"
  on public.genres for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem criar gêneros"
  on public.genres for insert
  to authenticated
  with check (true);

-- FESTIVALS: catálogo compartilhado — todos leem e podem cadastrar
create policy "Usuários autenticados podem ler festivais"
  on public.festivals for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem criar festivais"
  on public.festivals for insert
  to authenticated
  with check (true);

-- USER_FESTIVALS: cada usuário só enxerga e manipula os próprios festivais
create policy "Usuários veem apenas seus próprios festivais"
  on public.user_festivals for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Usuários criam apenas seus próprios festivais"
  on public.user_festivals for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Usuários atualizam apenas seus próprios festivais"
  on public.user_festivals for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuários deletam apenas seus próprios festivais"
  on public.user_festivals for delete
  to authenticated
  using (auth.uid() = user_id);

-- EVENTS: qualquer usuário autenticado pode ler o catálogo compartilhado
create policy "Usuários autenticados podem ler eventos"
  on public.events for select
  to authenticated
  using (true);

-- EVENTS: qualquer usuário autenticado pode criar um evento (cadastro manual)
create policy "Usuários autenticados podem criar eventos"
  on public.events for insert
  to authenticated
  with check (true);

-- USER_EVENTS: cada usuário só vê seus próprios registros
create policy "Usuários veem apenas seus próprios registros"
  on public.user_events for select
  to authenticated
  using (auth.uid() = user_id);

-- USER_EVENTS: cada usuário só insere registros com seu próprio user_id
create policy "Usuários inserem apenas seus próprios registros"
  on public.user_events for insert
  to authenticated
  with check (auth.uid() = user_id);

-- USER_EVENTS: cada usuário só atualiza seus próprios registros
create policy "Usuários atualizam apenas seus próprios registros"
  on public.user_events for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- USER_EVENTS: cada usuário só deleta seus próprios registros
create policy "Usuários deletam apenas seus próprios registros"
  on public.user_events for delete
  to authenticated
  using (auth.uid() = user_id);
