'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ShowItem, type ShowItemData } from './ShowItem'
import { ticketTypeLabel } from '@/lib/ticketTypes'
import type { FestivalRecord } from '@/lib/stats'

type SortKey = 'recent' | 'oldest' | 'rating_desc' | 'rating_asc' | 'price_desc'

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigos' },
  { value: 'rating_desc', label: 'Maior nota' },
  { value: 'rating_asc', label: 'Menor nota' },
  { value: 'price_desc', label: 'Mais caros' },
]

/** Valor especial do filtro de festival: qualquer show marcado como festival */
const ANY_FESTIVAL = '__festivais__'

export function ShowsExplorer({
  shows,
  festivals: festivalRecords = [],
}: {
  shows: ShowItemData[]
  festivals?: FestivalRecord[]
}) {
  const [q, setQ] = useState('')
  const [year, setYear] = useState('')
  const [festival, setFestival] = useState('')
  const [genre, setGenre] = useState('')
  const [ticketType, setTicketType] = useState('')
  const [city, setCity] = useState('')
  const [sort, setSort] = useState<SortKey>('recent')

  // ── Opções derivadas dos próprios dados ──────────────────────────────────
  const options = useMemo(() => {
    const years = new Set<string>()
    const festivals = new Set<string>()
    const genres = new Set<string>()
    const types = new Set<string>()
    const cities = new Set<string>()

    for (const s of shows) {
      years.add(s.events.event_date.slice(0, 4))
      const fName = s.user_festivals?.festivals?.name ?? s.festival_name
      if (fName) festivals.add(fName)
      if (s.genre) genres.add(s.genre)
      const tType = s.user_festivals?.ticket_type ?? s.ticket_type
      if (tType) types.add(tType)
      if (s.events.city) cities.add(s.events.city)
    }

    const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' })
    return {
      years: [...years].sort((a, b) => b.localeCompare(a)),
      festivals: [...festivals].sort(collator.compare),
      genres: [...genres].sort(collator.compare),
      types: [...types].sort(collator.compare),
      cities: [...cities].sort(collator.compare),
      hasAnyFestival: shows.some((s) => s.festival),
    }
  }, [shows])

  // ── Filtro + ordenação ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()

    const result = shows.filter((s) => {
      const fName = s.user_festivals?.festivals?.name ?? s.festival_name
      const tType = s.user_festivals?.ticket_type ?? s.ticket_type

      if (term) {
        const haystack = [
          s.events.artist,
          s.events.venue,
          s.events.city,
          fName ?? '',
          s.genre ?? '',
          s.notes ?? '',
        ].join(' ').toLowerCase()
        if (!haystack.includes(term)) return false
      }
      if (year && !s.events.event_date.startsWith(year)) return false
      if (festival) {
        if (festival === ANY_FESTIVAL) { if (!s.festival) return false }
        else if (fName !== festival) return false
      }
      if (genre && s.genre !== genre) return false
      if (ticketType && tType !== ticketType) return false
      if (city && s.events.city !== city) return false
      return true
    })

    // Sem valor sempre vai pro fim, independente da direção
    const low = (v: number | null) => (v == null ? -Infinity : v)   // usado em ordem decrescente
    const high = (v: number | null) => (v == null ? Infinity : v)   // usado em ordem crescente

    return result.sort((a, b) => {
      switch (sort) {
        case 'oldest': return a.events.event_date.localeCompare(b.events.event_date)
        case 'rating_desc': return low(b.rating) - low(a.rating)
        case 'rating_asc': return high(a.rating) - high(b.rating)
        case 'price_desc': return low(b.ticket_price) - low(a.ticket_price)
        default: return b.events.event_date.localeCompare(a.events.event_date)
      }
    })
  }, [shows, q, year, festival, genre, ticketType, city, sort])

  // ── Estatísticas do resultado filtrado ───────────────────────────────────
  const stats = useMemo(() => {
    const totalShows = filtered.length
    const artists = new Set(filtered.map((s) => s.events.artist.toLowerCase())).size

    // Gasto = shows avulsos + ingresso de cada festival presente no resultado
    // (contado uma vez só, mesmo com vários shows do mesmo festival)
    const showsSpend = filtered.reduce((sum, s) => sum + (s.ticket_price ?? 0), 0)
    const festivalIds = new Set(
      filtered.map((s) => s.user_festival_id).filter((id): id is string => !!id)
    )
    const festivalsSpend = festivalRecords
      .filter((f) => festivalIds.has(f.id))
      .reduce((sum, f) => sum + (f.ticket_price ?? 0), 0)
    const spent = showsSpend + festivalsSpend

    const rated = filtered.filter((s) => s.rating != null)
    const avg = rated.length
      ? (rated.reduce((sum, s) => sum + (s.rating ?? 0), 0) / rated.length).toFixed(1)
      : '—'
    return { totalShows, artists, spent, avg }
  }, [filtered, festivalRecords])

  const activeCount = [q, year, festival, genre, ticketType, city].filter(Boolean).length

  function clearAll() {
    setQ(''); setYear(''); setFestival(''); setGenre(''); setTicketType(''); setCity('')
  }

  return (
    <>
      {/* ── Estatísticas (refletem o filtro) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard value={String(stats.totalShows)} label={activeCount > 0 ? 'shows (filtrado)' : 'shows'} />
        <StatCard value={String(stats.artists)} label="artistas" />
        <StatCard
          value={stats.spent > 0 ? `R$${stats.spent >= 1000 ? (stats.spent / 1000).toFixed(1) + 'k' : stats.spent.toFixed(0)}` : 'R$0'}
          label="gasto total"
        />
        <StatCard value={stats.avg} label="nota média" />
      </div>

      {/* ── Cabeçalho + busca ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-papel">Seus shows</h2>
        <Link href="/shows/adicionar" className="sm:hidden text-sm font-medium text-roxo-luz hover:text-papel transition-colors">
          + Adicionar
        </Link>
      </div>

      <div className="bg-surface border border-white/[0.06] rounded-2xl p-4 mb-5 space-y-3">
        {/* Busca livre */}
        <div className="relative">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por artista, local, festival…"
            className={`${inputCls} pl-9`}
          />
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-papel/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
          <Select value={year} onChange={setYear} label="Ano">
            {options.years.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>

          {(options.festivals.length > 0 || options.hasAnyFestival) && (
            <Select value={festival} onChange={setFestival} label="Festival">
              {options.hasAnyFestival && <option value={ANY_FESTIVAL}>Somente festivais</option>}
              {options.festivals.map((f) => <option key={f} value={f}>{f}</option>)}
            </Select>
          )}

          {options.genres.length > 0 && (
            <Select value={genre} onChange={setGenre} label="Gênero">
              {options.genres.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          )}

          {options.types.length > 0 && (
            <Select value={ticketType} onChange={setTicketType} label="Ingresso">
              {options.types.map((t) => <option key={t} value={t}>{ticketTypeLabel(t)}</option>)}
            </Select>
          )}

          {options.cities.length > 1 && (
            <Select value={city} onChange={setCity} label="Cidade">
              {options.cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          )}

          {/* Ordenação */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={inputCls}
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Resumo do filtro */}
        {activeCount > 0 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-papel/40">
              {filtered.length} de {shows.length} {shows.length === 1 ? 'show' : 'shows'}
            </span>
            <button onClick={clearAll} className="text-xs text-roxo-luz hover:text-papel transition-colors">
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* ── Lista ── */}
      {filtered.length === 0 ? (
        <div className="bg-surface border border-white/[0.05] rounded-2xl px-6 py-14 text-center">
          <h3 className="text-base font-semibold text-papel mb-1.5">Nenhum show encontrado</h3>
          <p className="text-sm text-papel/45 mb-5">Tente ajustar ou limpar os filtros.</p>
          <button onClick={clearAll} className="text-sm font-medium text-roxo-luz hover:text-papel transition-colors">
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-3">
          {filtered.map((s) => (
            <ShowItem key={s.id} show={s} />
          ))}
        </div>
      )}
    </>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-surface rounded-2xl px-4 py-5 md:px-5 md:py-6">
      <div className="font-title text-3xl md:text-4xl text-roxo-luz leading-none">{value}</div>
      <div className="text-xs md:text-sm text-papel/40 mt-2">{label}</div>
    </div>
  )
}

function Select({
  value, onChange, label, children,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} ${value ? 'border-roxo/40 text-papel' : ''}`}
    >
      <option value="">{label}</option>
      {children}
    </select>
  )
}

const inputCls = 'w-full bg-surface-2 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-papel placeholder:text-papel/25 focus:outline-none focus:border-roxo/50 focus:ring-1 focus:ring-roxo/20 transition-colors'
