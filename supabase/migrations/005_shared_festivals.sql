-- =============================================================================
-- Migration 005 — Catálogo COMPARTILHADO de festivais
--
-- Mesmo princípio já usado em events/user_events:
--   festivals       → a identidade do festival (compartilhada por todos)
--   user_festivals  → o MEU ingresso naquele festival (preço e tipo, pessoal)
--
-- Sem isso, cada usuário criaria seu próprio "Rock in Rio 2024" e a fase
-- social ("quais amigos foram no mesmo festival") exigiria matching por texto.
--
-- Execute DEPOIS da migration 004.
-- =============================================================================

-- ─── Catálogo compartilhado ─────────────────────────────────────────────────
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

-- Evita duplicata óbvia por diferença de maiúsculas/minúsculas
create unique index if not exists festivals_name_unique_idx
  on public.festivals (lower(name));

create index if not exists festivals_name_search_idx
  on public.festivals (lower(name) text_pattern_ops);

-- ─── Vínculo do ingresso pessoal com o festival compartilhado ───────────────
alter table public.user_festivals
  add column if not exists festival_id uuid references public.festivals(id) on delete cascade;

-- ─── Migra os festivais pessoais existentes para o catálogo ─────────────────
-- distinct on (lower(name)) garante um único registro por nome no catálogo
insert into public.festivals (name, start_date)
select distinct on (lower(uf.name))
  uf.name,
  uf.festival_date
from public.user_festivals uf
where uf.name is not null and uf.name <> ''
order by lower(uf.name), uf.festival_date nulls last
on conflict do nothing;

-- Liga cada ingresso pessoal ao festival correspondente no catálogo
update public.user_festivals uf
set festival_id = f.id
from public.festivals f
where lower(f.name) = lower(uf.name)
  and uf.festival_id is null;

-- ─── Ajuste das constraints ─────────────────────────────────────────────────
-- Antes: um usuário não repetia o NOME. Agora: não repete o FESTIVAL.
alter table public.user_festivals
  drop constraint if exists user_festivals_user_id_name_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_festivals_user_festival_key'
  ) then
    alter table public.user_festivals
      add constraint user_festivals_user_festival_key unique (user_id, festival_id);
  end if;
end $$;

create index if not exists user_festivals_festival_idx
  on public.user_festivals (festival_id);

-- ─── RLS do catálogo compartilhado (mesma lógica de events) ─────────────────
alter table public.festivals enable row level security;

drop policy if exists "Usuários autenticados podem ler festivais" on public.festivals;
create policy "Usuários autenticados podem ler festivais"
  on public.festivals for select
  to authenticated
  using (true);

drop policy if exists "Usuários autenticados podem criar festivais" on public.festivals;
create policy "Usuários autenticados podem criar festivais"
  on public.festivals for insert
  to authenticated
  with check (true);
