-- =============================================================================
-- Migration 004 — Festival como entidade com ingresso próprio
--
-- Problema resolvido: num festival você compra UM ingresso para vários shows.
-- Guardar o preço em cada show inflava o gasto total. Agora o ingresso pertence
-- ao festival, e os shows apenas se vinculam a ele.
--
-- Execute no SQL Editor do Supabase.
-- =============================================================================

-- ─── Tabela de festivais do usuário ─────────────────────────────────────────
create table if not exists public.user_festivals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  ticket_price  numeric(10, 2) check (ticket_price >= 0),
  ticket_type   text check (ticket_type in (
                  'pista', 'pista_premium', 'cadeira', 'cadeira_inferior',
                  'cadeira_superior', 'vip', 'camarote', 'outro')),
  festival_date date,
  created_at    timestamptz not null default now(),

  -- O mesmo usuário não repete o nome do festival
  unique (user_id, name)
);

create index if not exists user_festivals_user_idx on public.user_festivals (user_id);

-- ─── Vínculo do show com o festival ─────────────────────────────────────────
alter table public.user_events
  add column if not exists user_festival_id uuid
  references public.user_festivals(id) on delete set null;

create index if not exists user_events_festival_idx on public.user_events (user_festival_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.user_festivals enable row level security;

drop policy if exists "Usuários veem apenas seus próprios festivais" on public.user_festivals;
create policy "Usuários veem apenas seus próprios festivais"
  on public.user_festivals for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Usuários criam apenas seus próprios festivais" on public.user_festivals;
create policy "Usuários criam apenas seus próprios festivais"
  on public.user_festivals for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Usuários atualizam apenas seus próprios festivais" on public.user_festivals;
create policy "Usuários atualizam apenas seus próprios festivais"
  on public.user_festivals for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuários deletam apenas seus próprios festivais" on public.user_festivals;
create policy "Usuários deletam apenas seus próprios festivais"
  on public.user_festivals for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================================================
-- MIGRAÇÃO DOS DADOS EXISTENTES
-- Cada festival_name já cadastrado vira um registro em user_festivals.
-- O preço adotado é o MAIOR valor encontrado entre os shows daquele festival
-- (assumindo que é o valor real do ingresso, e não uma divisão).
-- =============================================================================

insert into public.user_festivals (user_id, name, ticket_price, ticket_type, festival_date)
select
  ue.user_id,
  ue.festival_name,
  max(ue.ticket_price)                              as ticket_price,
  (array_agg(ue.ticket_type order by ue.ticket_price desc nulls last))[1] as ticket_type,
  min(e.event_date)                                 as festival_date
from public.user_events ue
join public.events e on e.id = ue.event_id
where ue.festival_name is not null
  and ue.festival_name <> ''
group by ue.user_id, ue.festival_name
on conflict (user_id, name) do nothing;

-- Vincula os shows aos festivais recém-criados
update public.user_events ue
set user_festival_id = uf.id
from public.user_festivals uf
where uf.user_id = ue.user_id
  and uf.name = ue.festival_name
  and ue.user_festival_id is null;

-- Zera o preço individual dos shows que agora pertencem a um festival,
-- evitando contar o mesmo ingresso duas vezes no gasto total.
update public.user_events
set ticket_price = null,
    ticket_type  = null
where user_festival_id is not null;
