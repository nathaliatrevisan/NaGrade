-- =============================================================================
-- Migration 007 — Catálogo compartilhado de gêneros musicais
--
-- Gênero é uma etiqueta reutilizável (não um evento único). Vira um vocabulário
-- compartilhado: se já existe, o usuário reaproveita; se não, cadastra.
-- A normalização acontece no servidor ao salvar o show, evitando duplicatas
-- como "Pop Punk" vs "pop punk".
--
-- O gênero continua guardado como TEXTO em user_events — mas sempre o nome
-- canônico vindo deste catálogo.
--
-- Execute no SQL Editor do Supabase.
-- =============================================================================

create table if not exists public.genres (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- Evita duplicata por diferença de maiúsculas/minúsculas
create unique index if not exists genres_name_unique_idx on public.genres (lower(name));
create index if not exists genres_name_search_idx on public.genres (lower(name) text_pattern_ops);

-- ─── Seed a partir dos gêneros já usados ────────────────────────────────────
insert into public.genres (name)
select distinct trim(genre)
from public.user_events
where genre is not null and trim(genre) <> ''
on conflict do nothing;

-- ─── RLS: catálogo compartilhado (mesma lógica de events/festivals) ─────────
alter table public.genres enable row level security;

drop policy if exists "Usuários autenticados podem ler gêneros" on public.genres;
create policy "Usuários autenticados podem ler gêneros"
  on public.genres for select
  to authenticated
  using (true);

drop policy if exists "Usuários autenticados podem criar gêneros" on public.genres;
create policy "Usuários autenticados podem criar gêneros"
  on public.genres for insert
  to authenticated
  with check (true);
