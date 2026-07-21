import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { StatsView } from '@/components/StatsView'
import type { ShowItemData } from '@/components/ShowItem'
import { toFestivalRecord, type RawFestival } from '@/lib/stats'

export default async function EstatisticasPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: userEvents }, { data: userFestivals }] = await Promise.all([
    supabase
      .from('user_events')
      .select(`
        id, rating, ticket_price, ticket_type, genre, notes, festival, festival_name,
        user_festival_id, created_at,
        events ( id, artist, venue, city, state, event_date, festival, source ),
        user_festivals ( id, ticket_price, ticket_type, festivals ( id, name ) )
      `)
      .eq('user_id', user.id)
      .limit(1000),
    supabase
      .from('user_festivals')
      .select('id, ticket_price, ticket_type, festival_date, festivals ( id, name )')
      .eq('user_id', user.id),
  ])

  const shows = (userEvents ?? []) as unknown as ShowItemData[]
  const festivals = ((userFestivals ?? []) as unknown as RawFestival[]).map(toFestivalRecord)

  return (
    <div className="min-h-screen bg-bg text-papel">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-5 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-papel">Estatísticas</h1>
          <p className="text-sm text-papel/45 mt-1">Seus padrões, em números.</p>
        </div>

        {shows.length === 0 ? (
          <div className="bg-surface border border-white/[0.05] rounded-2xl px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-papel mb-1.5">Ainda sem dados</h2>
            <p className="text-sm text-papel/45 mb-6 max-w-[280px] mx-auto">
              Registre alguns shows e suas estatísticas aparecem aqui.
            </p>
            <Link
              href="/shows/adicionar"
              className="inline-flex items-center bg-roxo hover:bg-roxo-hover text-papel font-medium text-sm px-6 py-3 rounded-xl transition-colors"
            >
              Registrar show
            </Link>
          </div>
        ) : (
          <StatsView shows={shows} festivals={festivals} />
        )}
      </main>
    </div>
  )
}
