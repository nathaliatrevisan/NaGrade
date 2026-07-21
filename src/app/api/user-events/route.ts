import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { linkSetlistEventSchema, createManualEventSchema } from '@/lib/validations/events'
import { resolveGenre } from '@/lib/genres'

// Detalhes pessoais compartilhados pelos dois fluxos
interface UserDetails {
  rating?: number
  ticketPrice?: number
  ticketType?: string
  genre?: string
  notes?: string
  festival?: boolean
  festivalName?: string
  userFestivalId?: string
}

// ─── POST /api/user-events ─────────────────────────────────────────────────
// Vincula o usuário autenticado a um evento.
// Body: { source: 'setlistfm' | 'manual', ...dadosDoEvento, ...detalhesUsuário }
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  try {
    const body = await request.json()
    const { source = 'setlistfm', ...rest } = body

    // 1. Valida com o schema correto e cria/encontra o evento no catálogo
    let eventId: string
    let details: UserDetails

    if (source === 'manual') {
      const parsed = createManualEventSchema.parse(rest)
      details = parsed

      const { data: created, error: createError } = await supabase
        .from('events')
        .insert({
          artist: parsed.artist,
          venue: parsed.venue,
          city: parsed.city,
          state: parsed.state ?? null,
          country: parsed.country,
          event_date: parsed.eventDate,
          festival: parsed.festival ?? false,
          source: 'manual',
        })
        .select('id')
        .single()

      if (createError) throw createError
      eventId = created.id
    } else {
      const parsed = linkSetlistEventSchema.parse(rest)
      details = parsed

      // Tenta reaproveitar evento já existente pelo ID do setlist.fm
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('setlistfm_id', parsed.setlistfmId)
        .maybeSingle()

      if (existing) {
        eventId = existing.id
      } else {
        const { data: created, error: createError } = await supabase
          .from('events')
          .insert({
            artist: parsed.artist,
            venue: parsed.venue,
            city: parsed.city,
            state: parsed.state ?? null,
            country: parsed.country,
            event_date: parsed.eventDate,
            festival: parsed.festival ?? false,
            setlistfm_id: parsed.setlistfmId,
            source: 'setlistfm',
          })
          .select('id')
          .single()

        if (createError) throw createError
        eventId = created.id
      }
    }

    // Normaliza o gênero pelo catálogo compartilhado (find-or-create)
    const genre = await resolveGenre(supabase, details.genre)

    // 2. Cria o vínculo pessoal (user_events)
    const { data: userEvent, error: linkError } = await supabase
      .from('user_events')
      .insert({
        user_id: user.id,
        event_id: eventId,
        rating: details.rating ?? null,
        // Show vinculado a festival não guarda preço próprio: o ingresso
        // pertence ao festival, e repetir aqui inflaria o gasto total.
        ticket_price: details.userFestivalId ? null : (details.ticketPrice ?? null),
        ticket_type: details.userFestivalId ? null : (details.ticketType ?? null),
        genre,
        notes: details.notes ?? null,
        festival: details.userFestivalId ? true : (details.festival ?? false),
        festival_name: details.festivalName ?? null,
        user_festival_id: details.userFestivalId ?? null,
      })
      .select('id')
      .single()

    if (linkError) {
      // Código 23505 = unique constraint (já registrou esse show)
      if (linkError.code === '23505') {
        return NextResponse.json(
          { error: 'Você já registrou esse show.' },
          { status: 409 }
        )
      }
      throw linkError
    }

    return NextResponse.json({ id: userEvent.id, eventId }, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: err.flatten().fieldErrors },
        { status: 422 }
      )
    }

    console.error('[/api/user-events POST]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// ─── GET /api/user-events ──────────────────────────────────────────────────
// Retorna os shows registrados pelo usuário autenticado.
export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_events')
    .select(`
      id,
      rating,
      ticket_price,
      ticket_type,
      genre,
      notes,
      created_at,
      events (
        id,
        artist,
        venue,
        city,
        state,
        country,
        event_date,
        festival,
        source
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[/api/user-events GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar shows.' }, { status: 500 })
  }

  return NextResponse.json({ shows: data })
}
