import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { FestivalsManager, type ManagedFestival } from '@/components/FestivalsManager'

interface RawRow {
  id: string
  festival_id: string
  ticket_price: number | null
  ticket_type: string | null
  festival_date: string | null
  festivals: { id: string; name: string } | null
}

export default async function FestivaisPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rows }, { data: links }] = await Promise.all([
    supabase
      .from('user_festivals')
      .select('id, festival_id, ticket_price, ticket_type, festival_date, festivals ( id, name )')
      .eq('user_id', user.id)
      .order('festival_date', { ascending: false }),
    supabase
      .from('user_events')
      .select('user_festival_id')
      .eq('user_id', user.id)
      .not('user_festival_id', 'is', null),
  ])

  // Conta quantos shows estão vinculados a cada ingresso
  const counts = new Map<string, number>()
  for (const l of (links ?? []) as { user_festival_id: string }[]) {
    counts.set(l.user_festival_id, (counts.get(l.user_festival_id) ?? 0) + 1)
  }

  const festivals: ManagedFestival[] = ((rows ?? []) as unknown as RawRow[]).map((r) => ({
    id: r.id,
    festivalId: r.festival_id,
    name: r.festivals?.name ?? '',
    ticket_price: r.ticket_price,
    ticket_type: r.ticket_type,
    festival_date: r.festival_date,
    showCount: counts.get(r.id) ?? 0,
  }))

  return (
    <div className="min-h-screen bg-bg text-papel">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-5 py-8 md:py-12">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-semibold text-papel">Festivais</h1>
          <p className="text-sm text-papel/45 mt-1">
            O ingresso do festival vale por todos os shows que você viu nele.
          </p>
        </div>

        <FestivalsManager festivals={festivals} />
      </main>
    </div>
  )
}
