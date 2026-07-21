import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Autocomplete no catálogo COMPARTILHADO de festivais.
 * É o que evita cada usuário criar seu próprio "Rock in Rio 2024".
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ festivals: [] })

  const { data, error } = await supabase
    .from('festivals')
    .select('id, name, city, start_date')
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(8)

  if (error) {
    console.error('[/api/festivals/search]', error)
    return NextResponse.json({ festivals: [] })
  }

  return NextResponse.json({ festivals: data ?? [] })
}
