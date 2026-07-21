-- =============================================================================
-- Migration 001 — Adiciona coluna `state` (estado/UF) na tabela events
-- Execute no SQL Editor do Supabase SE você já rodou o schema.sql antes.
-- Se for a primeira vez, o schema.sql já inclui essa coluna — pule esta migration.
-- =============================================================================

alter table public.events
  add column if not exists state text;
