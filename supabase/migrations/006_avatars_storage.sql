-- =============================================================================
-- Migration 006 — Storage para foto de perfil
--
-- Bucket público (a foto aparece no app sem URL assinada), mas com escrita
-- restrita: cada usuário só grava dentro da própria pasta {user_id}/.
--
-- Execute no SQL Editor do Supabase.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ─── Leitura: pública (as fotos são exibidas no app) ────────────────────────
drop policy if exists "Avatares são publicamente legíveis" on storage.objects;
create policy "Avatares são publicamente legíveis"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ─── Escrita: apenas na própria pasta ───────────────────────────────────────
-- O caminho é sempre {user_id}/arquivo, então comparamos a 1ª pasta com o uid.
drop policy if exists "Usuário envia avatar na própria pasta" on storage.objects;
create policy "Usuário envia avatar na própria pasta"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Usuário atualiza o próprio avatar" on storage.objects;
create policy "Usuário atualiza o próprio avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Usuário apaga o próprio avatar" on storage.objects;
create policy "Usuário apaga o próprio avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
