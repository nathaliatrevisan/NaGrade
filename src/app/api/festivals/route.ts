import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { festivalSchema } from '@/lib/validations/events'

/** Shape achatado devolvido ao front (nome vem do catálogo compartilhado) */
interface UserFestivalRow {
  id: string
  festival_id: string
  ticket_price: number | null
  ticket_type: string | null
  festival_date: string | null
  festivals: { id: string; name: string; city: string | null } | null
}

function flatten(row: UserFestivalRow) {
  return {
    id: row.id,
    festivalId: row.festival_id,
    name: row.festivals?.name ?? '',
    city: row.festivals?.city ?? null,
    ticket_price: row.ticket_price,
    ticket_type: row.ticket_type,
    festival_date: row.festival_date,
  }
}

// ─── GET /api/festivals ────────────────────────────────────────────────────
// Meus ingressos de festival (nome vindo do catálogo compartilhado).
// Com ?venue=&date= sugere o festival de shows já registrados no mesmo local/data.
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const venue = searchParams.get('venue')?.trim()
  const date = searchParams.get('date')?.trim()

  const { data, error } = await supabase
    .from('user_festivals')
    .select(`
      id, festival_id, ticket_price, ticket_type, festival_date,
      festivals ( id, name, city )
    `)
    .eq('user_id', user.id)
    .order('festival_date', { ascending: false })

  if (error) {
    console.error('[/api/festivals GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar festivais.' }, { status: 500 })
  }

  const festivals = ((data ?? []) as unknown as UserFestivalRow[]).map(flatten)

  // Sugestão: já registrei shows nesse mesmo local e data ligados a um festival?
  let suggestion: { id: string; name: string; showCount: number } | null = null

  if (venue && date) {
    const { data: sameDay } = await supabase
      .from('user_events')
      .select('user_festival_id, events!inner ( venue, event_date )')
      .eq('user_id', user.id)
      .not('user_festival_id', 'is', null)
      .eq('events.event_date', date)
      .eq('events.venue', venue)

    if (sameDay && sameDay.length > 0) {
      const counts = new Map<string, number>()
      for (const row of sameDay as unknown as { user_festival_id: string }[]) {
        counts.set(row.user_festival_id, (counts.get(row.user_festival_id) ?? 0) + 1)
      }
      let bestId: string | null = null
      let bestCount = 0
      for (const [id, count] of counts) {
        if (count > bestCount) { bestId = id; bestCount = count }
      }
      const match = festivals.find((f) => f.id === bestId)
      if (match && bestId) suggestion = { id: bestId, name: match.name, showCount: bestCount }
    }
  }

  return NextResponse.json({ festivals, suggestion })
}

// ─── POST /api/festivals ───────────────────────────────────────────────────
// Registra meu ingresso num festival.
// Reaproveita o festival do catálogo compartilhado (por id ou por nome),
// criando um novo só quando ainda não existe.
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = festivalSchema.parse(body)

    // 1. Resolve o festival no catálogo compartilhado
    let festivalId = parsed.festivalId

    if (!festivalId && parsed.name) {
      // Já existe alguém que cadastrou esse festival? (case-insensitive)
      const { data: existing } = await supabase
        .from('festivals')
        .select('id')
        .ilike('name', parsed.name)
        .maybeSingle()

      if (existing) {
        festivalId = existing.id
      } else {
        const { data: created, error: createError } = await supabase
          .from('festivals')
          .insert({
            name: parsed.name,
            city: parsed.city ?? null,
            start_date: parsed.festivalDate ?? null,
            source: 'manual',
          })
          .select('id')
          .single()

        // Corrida: outro usuário criou no meio do caminho — reaproveita
        if (createError) {
          if (createError.code === '23505') {
            const { data: raced } = await supabase
              .from('festivals')
              .select('id')
              .ilike('name', parsed.name)
              .maybeSingle()
            if (!raced) throw createError
            festivalId = raced.id
          } else {
            throw createError
          }
        } else {
          festivalId = created.id
        }
      }
    }

    if (!festivalId) {
      return NextResponse.json({ error: 'Festival não identificado.' }, { status: 422 })
    }

    // 2. Cria (ou reaproveita) o MEU ingresso nesse festival
    const { data: mine, error: mineError } = await supabase
      .from('user_festivals')
      .insert({
        user_id: user.id,
        festival_id: festivalId,
        ticket_price: parsed.ticketPrice ?? null,
        ticket_type: parsed.ticketType ?? null,
        festival_date: parsed.festivalDate ?? null,
      })
      .select(`
        id, festival_id, ticket_price, ticket_type, festival_date,
        festivals ( id, name, city )
      `)
      .single()

    if (mineError) {
      // 23505 = já tenho ingresso nesse festival
      if (mineError.code === '23505') {
        const { data: existingMine } = await supabase
          .from('user_festivals')
          .select(`
            id, festival_id, ticket_price, ticket_type, festival_date,
            festivals ( id, name, city )
          `)
          .eq('user_id', user.id)
          .eq('festival_id', festivalId)
          .maybeSingle()

        if (existingMine) {
          return NextResponse.json(
            { festival: flatten(existingMine as unknown as UserFestivalRow) },
            { status: 200 }
          )
        }
      }
      throw mineError
    }

    return NextResponse.json(
      { festival: flatten(mine as unknown as UserFestivalRow) },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: err.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[/api/festivals POST]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
