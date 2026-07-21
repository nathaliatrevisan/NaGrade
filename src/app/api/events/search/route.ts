import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { searchShows } from '@/lib/setlistfm/client'

export async function GET(request: Request) {
  // 1. Autenticação obrigatória
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const artist = searchParams.get('artist')?.trim() || ''
  const artistMbid = searchParams.get('artistMbid') || undefined
  const year = searchParams.get('year') || undefined
  const date = searchParams.get('date') || undefined
  const cityName = searchParams.get('city') || undefined
  const countryCode = searchParams.get('country') || undefined
  const venueName = searchParams.get('venue') || undefined
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))

  // Exige ao menos o artista OU um filtro relevante (a API do setlist.fm
  // não aceita busca totalmente vazia)
  const hasAnyFilter = !!artistMbid || artist.length >= 2 || cityName || venueName || (countryCode && date)

  if (!hasAnyFilter) {
    return NextResponse.json(
      { error: 'Digite ao menos o artista (2+ caracteres) ou combine outros filtros.' },
      { status: 422 }
    )
  }

  try {
    const result = await searchShows({
      artistName: artist,
      artistMbid,
      year,
      date,
      cityName,
      countryCode,
      venueName,
      page,
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : ''

    if (message === 'RATE_LIMIT') {
      return NextResponse.json(
        { error: 'Muitas buscas em sequência. Aguarde um momento e tente novamente.' },
        { status: 429 }
      )
    }

    if (message.includes('SETLISTFM_API_KEY')) {
      return NextResponse.json(
        { error: 'API do setlist.fm não configurada. Adicione SETLISTFM_API_KEY no .env.local.' },
        { status: 503 }
      )
    }

    console.error('[/api/events/search]', err)
    return NextResponse.json({ error: 'Erro ao buscar shows.' }, { status: 500 })
  }
}
