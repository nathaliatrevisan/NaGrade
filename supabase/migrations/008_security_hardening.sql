-- =============================================================================
-- Migration 008 — Endurecimento de segurança (warnings do linter)
--
-- 1. Bucket de avatares: remove a listagem pública. O bucket continua público
--    para SERVIR as fotos por URL (isso não passa por RLS), mas listar
--    arquivos passa a ser permitido só na própria pasta — antes, qualquer
--    pessoa podia enumerar todos os arquivos (e os IDs de usuários).
--
-- 2. Catálogos compartilhados: constraints de sanidade no nível do banco.
--    O INSERT aberto para autenticados é intencional (design do catálogo),
--    mas alguém chamando a API do Supabase direto pularia a validação Zod
--    do backend. Estes CHECKs garantem limites mesmo nesse caso.
--
-- Execute no SQL Editor do Supabase.
-- =============================================================================

-- ─── 1. Avatares: listagem só da própria pasta ──────────────────────────────
drop policy if exists "Avatares são publicamente legíveis" on storage.objects;

create policy "Usuário lista apenas a própria pasta de avatar"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── 2. Constraints de sanidade nos catálogos compartilhados ────────────────
-- (mesmos limites do Zod no backend, agora garantidos pelo banco)

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'events_artist_len') then
    alter table public.events
      add constraint events_artist_len  check (char_length(artist) between 1 and 200),
      add constraint events_venue_len   check (char_length(venue) between 1 and 200),
      add constraint events_city_len    check (char_length(city) between 1 and 100),
      add constraint events_country_len check (char_length(country) = 2);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'festivals_name_len') then
    alter table public.festivals
      add constraint festivals_name_len check (char_length(name) between 1 and 120);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'genres_name_len') then
    alter table public.genres
      add constraint genres_name_len check (char_length(name) between 1 and 60);
  end if;
end $$;
