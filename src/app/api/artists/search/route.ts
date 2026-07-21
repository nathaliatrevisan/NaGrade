import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { searchArtists } from '@/lib/setlistfm/client'

// Autocomplete de artistas para o campo de busca.
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() || ''

  if (q.length < 2) return NextResponse.json({ artists: [] })

  try {
    const artists = await searchArtists(q)
    return NextResponse.json({ artists })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    // No autocomplete, falha silenciosa é melhor que erro na cara do usuário
    if (message === 'RATE_LIMIT') return NextResponse.json({ artists: [] })
    console.error('[/api/artists/search]', err)
    return NextResponse.json({ artists: [] })
  }
}
