import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { updateUserEventSchema } from '@/lib/validations/events'
import { resolveGenre } from '@/lib/genres'

// ─── PATCH /api/user-events/[id] ───────────────────────────────────────────
// Edita os detalhes pessoais de um show registrado pelo usuário.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = updateUserEventSchema.parse(body)

    // Monta o update apenas com os campos enviados (converte undefined → sem alteração)
    const update: {
      rating?: number | null
      ticket_price?: number | null
      ticket_type?: string | null
      genre?: string | null
      notes?: string | null
      festival?: boolean
      festival_name?: string | null
      user_festival_id?: string | null
    } = {}
    if ('rating' in parsed) update.rating = parsed.rating ?? null
    if ('ticketPrice' in parsed) update.ticket_price = parsed.ticketPrice ?? null
    if ('ticketType' in parsed) update.ticket_type = parsed.ticketType ?? null
    if ('genre' in parsed) update.genre = await resolveGenre(supabase, parsed.genre)
    if ('notes' in parsed) update.notes = parsed.notes ?? null
    if ('festival' in parsed) update.festival = parsed.festival ?? false
    if ('festivalName' in parsed) update.festival_name = parsed.festivalName ?? null
    if ('userFestivalId' in parsed) update.user_festival_id = parsed.userFestivalId ?? null

    // Vinculou a um festival? O ingresso passa a ser do festival —
    // zera o preço individual para não contar duas vezes.
    if (update.user_festival_id) {
      update.ticket_price = null
      update.ticket_type = null
      update.festival = true
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 422 })
    }

    // A cláusula eq('user_id') garante que o usuário só edita o próprio registro
    // (o RLS reforça isso no banco como segunda camada).
    const { data, error } = await supabase
      .from('user_events')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Show não encontrado.' }, { status: 404 })
    }

    return NextResponse.json({ id: data.id })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: err.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[/api/user-events/[id] PATCH]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// ─── DELETE /api/user-events/[id] ──────────────────────────────────────────
// Remove o vínculo do usuário com o show (não apaga o evento do catálogo).
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_events')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[/api/user-events/[id] DELETE]', error)
    return NextResponse.json({ error: 'Erro ao excluir.' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Show não encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
