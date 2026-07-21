import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { ShowsExplorer } from '@/components/ShowsExplorer'
import type { ShowItemData } from '@/components/ShowItem'
import { toFestivalRecord, type RawFestival } from '@/lib/stats'

export default async function DashboardPage() {
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
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('user_festivals')
      .select('id, ticket_price, ticket_type, festival_date, festivals ( id, name )')
      .eq('user_id', user.id),
  ])

  const shows = (userEvents ?? []) as unknown as ShowItemData[]
  const festivals = ((userFestivals ?? []) as unknown as RawFestival[]).map(toFestivalRecord)
  const name = (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'você'

  return (
    <div className="min-h-screen bg-bg text-papel">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-5 py-8 md:py-12">

        {/* Saudação */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-papel/45">Olá,</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-papel mt-0.5">{name}</h1>
          </div>
          <Link
            href="/shows/adicionar"
            className="hidden sm:inline-flex items-center bg-roxo hover:bg-roxo-hover text-papel font-medium text-sm px-5 py-3 rounded-xl transition-colors"
          >
            + Registrar show
          </Link>
        </div>

        {shows.length === 0 ? (
          <EmptyState />
        ) : (
          <ShowsExplorer shows={shows} festivals={festivals} />
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-surface border border-white/[0.05] rounded-2xl px-6 py-14 md:py-20 text-center">
      <div className="inline-flex items-stretch rounded-md overflow-hidden opacity-25 mb-5">
        <div className="bg-roxo px-2 flex items-center">
          <span className="font-title text-papel text-[8px] tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>GRADE</span>
        </div>
        <div className="bg-papel ticket-perforation px-3 py-2 flex items-center">
          <span className="font-display text-[#100F0D] text-lg leading-none">NA GRADE</span>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-papel mb-1.5">Nada por aqui ainda</h3>
      <p className="text-sm text-papel/45 mb-6 max-w-[260px] mx-auto">
        Registre o primeiro show da sua história e comece a montar seu diário.
      </p>
      <Link
        href="/shows/adicionar"
        className="inline-flex items-center bg-roxo hover:bg-roxo-hover text-papel font-medium text-sm px-6 py-3 rounded-xl transition-colors"
      >
        Registrar primeiro show
      </Link>
    </div>
  )
}
