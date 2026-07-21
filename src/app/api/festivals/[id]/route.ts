import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { updateFestivalTicketSchema } from '@/lib/validations/events'

// ─── PATCH /api/festivals/[id] ─────────────────────────────────────────────
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
    const parsed = updateFestivalTicketSchema.parse(body)

    // O nome vive no catálogo compartilhado e não é editado aqui —
    // alterar afetaria todos os usuários. Aqui só muda o MEU ingresso.
    const update: {
      ticket_price?: number | null
      ticket_type?: string | null
      festival_date?: string | null
    } = {}
    if ('ticketPrice' in parsed) update.ticket_price = parsed.ticketPrice ?? null
    if ('ticketType' in parsed) update.ticket_type = parsed.ticketType ?? null
    if ('festivalDate' in parsed) update.festival_date = parsed.festivalDate ?? null

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 422 })
    }

    const { data, error } = await supabase
      .from('user_festivals')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, festival_id, ticket_price, ticket_type, festival_date, festivals ( id, name, city )')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Festival não encontrado.' }, { status: 404 })

    return NextResponse.json({ festival: data })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: err.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[/api/festivals/[id] PATCH]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// ─── DELETE /api/festivals/[id] ────────────────────────────────────────────
// Os shows vinculados não são apagados — apenas perdem o vínculo (on delete set null).
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_festivals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[/api/festivals/[id] DELETE]', error)
    return NextResponse.json({ error: 'Erro ao excluir.' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Festival não encontrado.' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
