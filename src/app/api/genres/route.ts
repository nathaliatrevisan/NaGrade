import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET /api/genres — autocomplete de gêneros no catálogo compartilhado.
 * Sem `q`, devolve os mais comuns para sugerir de cara.
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  let query = supabase.from('genres').select('name').order('name').limit(10)
  if (q.length >= 1) query = query.ilike('name', `%${q}%`)

  const { data, error } = await query
  if (error) {
    console.error('[/api/genres]', error)
    return NextResponse.json({ genres: [] })
  }

  return NextResponse.json({ genres: (data ?? []).map((g) => g.name) })
}
