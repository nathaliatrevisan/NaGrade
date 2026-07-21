-- =============================================================================
-- Migration 003 — Festival como propriedade pessoal do registro
-- Move a informação de festival para user_events (por usuário), permitindo
-- marcar se foi festival e qual, sem afetar o catálogo compartilhado.
-- Execute no SQL Editor do Supabase.
-- =============================================================================

alter table public.user_events
  add column if not exists festival boolean not null default false;

alter table public.user_events
  add column if not exists festival_name text;

-- Backfill: registros de eventos já marcados como festival herdam o flag
update public.user_events ue
set festival = true
from public.events e
where ue.event_id = e.id
  and e.festival = true
  and ue.festival = false;
