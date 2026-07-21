/**
 * ATENÇÃO: server-only — usado nos Route Handlers ao salvar shows.
 */
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './supabase/types'

type Client = SupabaseClient<Database>

/**
 * Resolve o gênero pelo catálogo compartilhado (find-or-create).
 * Recebe o texto digitado e devolve o nome CANÔNICO já existente, ou cria um
 * novo. Isso garante que "Pop Punk" e "pop punk" convirjam para um só valor.
 *
 * Retorna o nome canônico, ou null quando não há gênero.
 */
export async function resolveGenre(
  supabase: Client,
  raw: string | null | undefined
): Promise<string | null> {
  const name = raw?.trim()
  if (!name) return null

  // Já existe? (case-insensitive)
  const { data: existing } = await supabase
    .from('genres')
    .select('name')
    .ilike('name', name)
    .maybeSingle()

  if (existing) return existing.name

  // Cria no catálogo
  const { data: created, error } = await supabase
    .from('genres')
    .insert({ name })
    .select('name')
    .single()

  if (error) {
    // Corrida: outro usuário criou no meio do caminho — reaproveita
    if (error.code === '23505') {
      const { data: raced } = await supabase
        .from('genres')
        .select('name')
        .ilike('name', name)
        .maybeSingle()
      return raced?.name ?? name
    }
    // Em qualquer outra falha, não bloqueia o salvamento do show
    console.error('[resolveGenre]', error)
    return name
  }

  return created.name
}
