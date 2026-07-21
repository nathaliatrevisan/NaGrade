-- =============================================================================
-- Migration 002 — Novos tipos de ingresso
-- Adiciona: pista_premium, cadeira_inferior, cadeira_superior
-- Execute no SQL Editor do Supabase SE você já rodou o schema.sql antes.
-- =============================================================================

alter table public.user_events
  drop constraint if exists user_events_ticket_type_check;

alter table public.user_events
  add constraint user_events_ticket_type_check
  check (ticket_type in (
    'pista',
    'pista_premium',
    'cadeira',
    'cadeira_inferior',
    'cadeira_superior',
    'vip',
    'camarote',
    'outro'
  ));
