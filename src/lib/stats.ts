import type { ShowItemData } from '@/components/ShowItem'
import { ticketTypeLabel } from '@/lib/ticketTypes'

export interface Slice {
  label: string
  value: number
}

/** Festival do usuário — o ingresso pertence a ele, não aos shows */
export interface FestivalRecord {
  id: string        // id do meu ingresso (user_festivals)
  name: string      // nome vindo do catálogo compartilhado
  ticket_price: number | null
  ticket_type: string | null
  festival_date: string | null
}

/** Shape cru vindo do Supabase (nome aninhado no catálogo compartilhado) */
export interface RawFestival {
  id: string
  ticket_price: number | null
  ticket_type: string | null
  festival_date: string | null
  festivals: { id: string; name: string } | null
}

export function toFestivalRecord(r: RawFestival): FestivalRecord {
  return {
    id: r.id,
    name: r.festivals?.name ?? '',
    ticket_price: r.ticket_price,
    ticket_type: r.ticket_type,
    festival_date: r.festival_date,
  }
}

/**
 * Gasto total correto: soma o preço dos shows avulsos + o ingresso de cada
 * festival (uma vez só). Shows vinculados a festival não têm preço próprio.
 */
export function totalSpent(shows: ShowItemData[], festivals: FestivalRecord[]): number {
  const showsSpend = shows.reduce((sum, s) => sum + (s.ticket_price ?? 0), 0)
  const festivalsSpend = festivals.reduce((sum, f) => sum + (f.ticket_price ?? 0), 0)
  return showsSpend + festivalsSpend
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' })

// ─── Por ano ─────────────────────────────────────────────────────────────────

/** Quantidade de shows por ano, do mais antigo ao mais recente (bom pra linha do tempo) */
export function showsByYear(shows: ShowItemData[]): Slice[] {
  const map = new Map<string, number>()
  for (const s of shows) {
    const y = s.events.event_date.slice(0, 4)
    map.set(y, (map.get(y) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/** Gasto total por ano — inclui os ingressos de festival, contados uma vez */
export function spendByYear(shows: ShowItemData[], festivals: FestivalRecord[] = []): Slice[] {
  const map = new Map<string, number>()

  for (const s of shows) {
    if (s.ticket_price == null) continue
    const y = s.events.event_date.slice(0, 4)
    map.set(y, (map.get(y) ?? 0) + s.ticket_price)
  }

  // O ano do festival vem da sua data; sem data, usa o primeiro show vinculado
  for (const f of festivals) {
    if (f.ticket_price == null) continue
    const linked = shows.find((s) => s.user_festival_id === f.id)
    const y = f.festival_date?.slice(0, 4) ?? linked?.events.event_date.slice(0, 4)
    if (!y) continue
    map.set(y, (map.get(y) ?? 0) + f.ticket_price)
  }

  return [...map.entries()]
    .map(([label, value]) => ({ label, value: Math.round(value) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

// ─── Gênero ──────────────────────────────────────────────────────────────────

/** Distribuição por gênero, do mais frequente ao menos */
export function genreDistribution(shows: ShowItemData[]): Slice[] {
  const map = new Map<string, number>()
  for (const s of shows) {
    if (!s.genre) continue
    map.set(s.genre, (map.get(s.genre) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || collator.compare(a.label, b.label))
}

// ─── Notas ───────────────────────────────────────────────────────────────────

/** Histograma de notas de 1 a 10 (inclui zeros para manter o eixo completo) */
export function ratingDistribution(shows: ShowItemData[]): Slice[] {
  const counts = new Array(10).fill(0) as number[]
  for (const s of shows) {
    if (s.rating == null) continue
    const i = Math.round(s.rating) - 1
    if (i >= 0 && i < 10) counts[i] += 1
  }
  return counts.map((value, i) => ({ label: String(i + 1), value }))
}

// ─── Festival ────────────────────────────────────────────────────────────────

export interface FestivalStat {
  id: string
  name: string
  count: number
  spend: number
  costPerShow: number | null
  avgRating: number | null
}

/**
 * Estatísticas por festival cadastrado.
 * O gasto é o preço do ingresso do festival (uma vez), e o custo por show
 * divide esse valor pela quantidade de shows que o usuário realmente viu —
 * métrica que só faz sentido com o ingresso no festival.
 */
export function festivalStats(
  shows: ShowItemData[],
  festivals: FestivalRecord[]
): FestivalStat[] {
  return festivals
    .map((f) => {
      const linked = shows.filter((s) => s.user_festival_id === f.id)
      const ratings = linked.map((s) => s.rating).filter((r): r is number => r != null)
      const spend = f.ticket_price ?? 0

      return {
        id: f.id,
        name: f.name,
        count: linked.length,
        spend: Math.round(spend),
        costPerShow: spend > 0 && linked.length > 0
          ? Math.round(spend / linked.length)
          : null,
        avgRating: ratings.length
          ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
          : null,
      }
    })
    .sort((a, b) => b.count - a.count || collator.compare(a.name, b.name))
}

// ─── Tipo de ingresso ────────────────────────────────────────────────────────

export interface TicketTypeStat {
  label: string
  avg: number
  count: number
}

/** Preço médio por tipo de ingresso (só considera shows com preço informado) */
export function priceByTicketType(shows: ShowItemData[]): TicketTypeStat[] {
  const map = new Map<string, number[]>()
  for (const s of shows) {
    if (!s.ticket_type || s.ticket_price == null) continue
    const arr = map.get(s.ticket_type) ?? []
    arr.push(s.ticket_price)
    map.set(s.ticket_type, arr)
  }
  return [...map.entries()]
    .map(([type, prices]) => ({
      label: ticketTypeLabel(type),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      count: prices.length,
    }))
    .sort((a, b) => b.avg - a.avg)
}

// ─── Retrospectiva ───────────────────────────────────────────────────────────

export interface YearRecap {
  year: string
  totalShows: number
  totalArtists: number
  totalSpent: number
  avgRating: number | null
  topGenre: { label: string; count: number } | null
  topFestival: { label: string; count: number } | null
  bestShow: { artist: string; rating: number; venue: string } | null
  busiestMonth: { label: string; count: number } | null
  topCity: { label: string; count: number } | null
}

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function topOf(map: Map<string, number>): { label: string; count: number } | null {
  let best: { label: string; count: number } | null = null
  for (const [label, count] of map) {
    if (!best || count > best.count) best = { label, count }
  }
  return best
}

/** Resumo do ano — base da retrospectiva estilo "wrapped" */
export function yearRecap(
  shows: ShowItemData[],
  year: string,
  festivals: FestivalRecord[] = []
): YearRecap {
  const inYear = shows.filter((s) => s.events.event_date.startsWith(year))

  const genres = new Map<string, number>()
  const festivalCounts = new Map<string, number>()
  const months = new Map<string, number>()
  const cities = new Map<string, number>()

  // Nome do festival: prioriza o cadastrado, com fallback no texto antigo
  const festivalNameById = new Map(festivals.map((f) => [f.id, f.name]))

  let spent = 0
  const ratings: number[] = []
  let best: YearRecap['bestShow'] = null

  for (const s of inYear) {
    if (s.genre) genres.set(s.genre, (genres.get(s.genre) ?? 0) + 1)

    const fName = (s.user_festival_id && festivalNameById.get(s.user_festival_id)) || s.festival_name
    if (fName) festivalCounts.set(fName, (festivalCounts.get(fName) ?? 0) + 1)

    if (s.events.city) cities.set(s.events.city, (cities.get(s.events.city) ?? 0) + 1)

    const monthIdx = parseInt(s.events.event_date.slice(5, 7)) - 1
    const monthLabel = MONTHS[monthIdx] ?? ''
    if (monthLabel) months.set(monthLabel, (months.get(monthLabel) ?? 0) + 1)

    spent += s.ticket_price ?? 0

    if (s.rating != null) {
      ratings.push(s.rating)
      if (!best || s.rating > best.rating) {
        best = { artist: s.events.artist, rating: s.rating, venue: s.events.venue }
      }
    }
  }

  // Soma os ingressos dos festivais daquele ano (uma vez cada)
  const yearFestivalIds = new Set(
    inYear.map((s) => s.user_festival_id).filter((id): id is string => !!id)
  )
  for (const f of festivals) {
    if (f.ticket_price == null) continue
    const belongsToYear = f.festival_date
      ? f.festival_date.startsWith(year)
      : yearFestivalIds.has(f.id)
    if (belongsToYear) spent += f.ticket_price
  }

  return {
    year,
    totalShows: inYear.length,
    totalArtists: new Set(inYear.map((s) => s.events.artist.toLowerCase())).size,
    totalSpent: Math.round(spent),
    avgRating: ratings.length
      ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
      : null,
    topGenre: topOf(genres),
    topFestival: topOf(festivalCounts),
    bestShow: best,
    busiestMonth: topOf(months),
    topCity: topOf(cities),
  }
}

/** Anos disponíveis nos dados, do mais recente ao mais antigo */
export function availableYears(shows: ShowItemData[]): string[] {
  return [...new Set(shows.map((s) => s.events.event_date.slice(0, 4)))]
    .sort((a, b) => b.localeCompare(a))
}

/** Formata valores em reais de forma compacta (R$ 3.2k / R$ 450) */
export function formatBRL(value: number): string {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`
  return `R$ ${value.toFixed(0)}`
}
