/**
 * ATENÇÃO: server-only — a SETLISTFM_API_KEY nunca deve chegar ao browser.
 * Importe apenas em Route Handlers e Server Components.
 */
import 'server-only'
import type { SetlistSearchResponse, ShowResult } from './types'

const BASE_URL = 'https://api.setlist.fm/rest/1.0'

/** Converte DD-MM-YYYY (formato do setlist.fm) para YYYY-MM-DD */
function parseSetlistDate(date: string): string {
  const [dd, mm, yyyy] = date.split('-')
  return `${yyyy}-${mm}-${dd}`
}

/** Conta músicas de um setlist (desconta bis, considera todos os sets) */
function countSongs(sets: { set: Array<{ song: Array<unknown> }> }): number {
  return sets.set.reduce((total, s) => total + (s.song?.length ?? 0), 0)
}

/** Detecta se um evento é festival pelo nome do venue ou set */
function detectFestival(venueName: string): boolean {
  const festivalKeywords = ['festival', 'rock in rio', 'lollapalooza', 'primavera', 'coachella', 'glastonbury', 'tomorrowland', 'ultra']
  return festivalKeywords.some((kw) => venueName.toLowerCase().includes(kw))
}

async function setlistFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const apiKey = process.env.SETLISTFM_API_KEY
  if (!apiKey) throw new Error('SETLISTFM_API_KEY não configurada')

  const res = await fetch(url.toString(), {
    headers: {
      'x-api-key': apiKey,
      'Accept': 'application/json',
    },
    next: { revalidate: 300 }, // cache 5 minutos no servidor
  })

  if (res.status === 404) return { setlist: [], total: 0, page: 1, itemsPerPage: 20 } as T
  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`setlist.fm ${res.status}`)

  return res.json()
}

export interface SearchFilters {
  artistName: string
  artistMbid?: string  // ID único do artista — busca mais precisa que o nome
  year?: string
  date?: string       // YYYY-MM-DD (convertido para dd-MM-yyyy na chamada)
  cityName?: string
  countryCode?: string
  venueName?: string
  page?: number
}

export interface ArtistSuggestion {
  mbid: string
  name: string
  disambiguation: string  // ex: "US pop singer" — ajuda a diferenciar homônimos
}

interface ArtistSearchResponse {
  artist?: Array<{ mbid: string; name: string; disambiguation?: string }>
  total?: number
}

/**
 * Autocomplete de artistas — usado enquanto o usuário digita.
 * Retorna os mais relevantes primeiro.
 */
export async function searchArtists(name: string): Promise<ArtistSuggestion[]> {
  const q = name.trim()
  if (q.length < 2) return []

  const data = await setlistFetch<ArtistSearchResponse>('/search/artists', {
    artistName: q,
    p: '1',
    sort: 'relevance',
  })

  return (data.artist ?? []).slice(0, 8).map((a) => ({
    mbid: a.mbid,
    name: a.name,
    disambiguation: a.disambiguation ?? '',
  }))
}

/** Converte YYYY-MM-DD para dd-MM-yyyy (formato exigido pelo setlist.fm) */
function toSetlistDate(date: string): string {
  const [yyyy, mm, dd] = date.split('-')
  return `${dd}-${mm}-${yyyy}`
}

export async function searchShows(
  filters: SearchFilters
): Promise<{ shows: ShowResult[]; total: number; page: number; itemsPerPage: number }> {
  const { artistName, artistMbid, year, date, cityName, countryCode, venueName, page = 1 } = filters

  const params: Record<string, string> = {
    p: String(page),
  }

  // mbid é mais preciso; se veio de uma sugestão, usamos ele no lugar do nome
  if (artistMbid?.trim()) params.artistMbid = artistMbid.trim()
  else if (artistName?.trim()) params.artistName = artistName.trim()
  if (date) params.date = toSetlistDate(date)   // data exata tem prioridade sobre ano
  else if (year) params.year = year
  if (cityName?.trim()) params.cityName = cityName.trim()
  if (countryCode?.trim()) params.countryCode = countryCode.trim().toUpperCase()
  if (venueName?.trim()) params.venueName = venueName.trim()

  const data = await setlistFetch<SetlistSearchResponse>('/search/setlists', params)

  const shows: ShowResult[] = (data.setlist ?? []).map((s) => ({
    setlistfmId: s.id,
    artist: s.artist.name,
    venue: s.venue.name,
    city: s.venue.city.name,
    state: s.venue.city.state ?? '',
    country: s.venue.city.country.code,
    eventDate: parseSetlistDate(s.eventDate),
    festival: detectFestival(s.venue.name) || !!s.tour?.name,
    tourName: s.tour?.name ?? '',
    setlistfmUrl: s.url,
    songCount: countSongs(s.sets),
  }))

  return {
    shows,
    total: data.total ?? 0,
    page: data.page ?? 1,
    itemsPerPage: data.itemsPerPage ?? 20,
  }
}
