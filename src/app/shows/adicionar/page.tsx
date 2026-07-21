'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { ArtistAutocomplete } from '@/components/ArtistAutocomplete'
import { FestivalPicker } from '@/components/FestivalPicker'
import { GenrePicker } from '@/components/GenrePicker'
import { COUNTRIES } from '@/lib/countries'
import { TICKET_TYPES } from '@/lib/ticketTypes'
import type { ShowResult } from '@/lib/setlistfm/types'

// ─── Tipos locais ────────────────────────────────────────────────────────────

interface DetailForm {
  rating: string
  ticketPrice: string
  ticketType: string
  genre: string
  notes: string
  festival: boolean
  userFestivalId: string | null
}

const emptyDetail = (): DetailForm => ({
  rating: '', ticketPrice: '', ticketType: '', genre: '', notes: '',
  festival: false, userFestivalId: null,
})

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i)

// ─── Componente principal ────────────────────────────────────────────────────

export default function AdicionarShowPage() {
  const router = useRouter()

  // Busca — filtros
  const [artist, setArtist] = useState('')
  const [artistMbid, setArtistMbid] = useState('')
  const [year, setYear] = useState('')
  const [date, setDate] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [venue, setVenue] = useState('')

  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [results, setResults] = useState<ShowResult[] | null>(null)
  const [searchPage, setSearchPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)

  // Seleção e detalhes
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailForm>(emptyDetail())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Cadastro manual
  const [showManual, setShowManual] = useState(false)
  const [manual, setManual] = useState({
    artist: '', venue: '', city: '', state: '', country: 'BR', eventDate: '', festival: false,
  })
  const [manualDetail, setManualDetail] = useState<DetailForm>(emptyDetail())
  const [savingManual, setSavingManual] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)

  // ── Busca ──
  async function handleSearch(e: FormEvent, page = 1) {
    e.preventDefault()
    setSearchError(null)
    setSearching(true)
    setSelectedId(null)
    if (page === 1) setResults(null)

    try {
      const params = new URLSearchParams({ page: String(page) })
      if (artistMbid) params.set('artistMbid', artistMbid)
      if (artist) params.set('artist', artist)
      if (date) params.set('date', date)
      else if (year) params.set('year', year)
      if (city) params.set('city', city)
      if (country) params.set('country', country)
      if (venue) params.set('venue', venue)

      const res = await fetch(`/api/events/search?${params}`)
      const data = await res.json()
      if (!res.ok) { setSearchError(data.error); return }
      setResults(data.shows)
      setTotalResults(data.total)
      setSearchPage(page)
    } catch {
      setSearchError('Erro de conexão. Tente novamente.')
    } finally {
      setSearching(false)
    }
  }

  function clearFilters() {
    setYear(''); setDate(''); setCity(''); setCountry(''); setVenue('')
  }
  const activeFilterCount = [year, date, city, country, venue].filter(Boolean).length

  // Digitar manualmente invalida a seleção anterior (mbid); selecionar preenche os dois
  function handleArtistText(v: string) { setArtist(v); setArtistMbid('') }
  function handleArtistPick(name: string, mbid: string) { setArtist(name); setArtistMbid(mbid) }

  // ── Salvar (setlist.fm) ──
  async function handleSaveShow(show: ShowResult) {
    setSaveError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/user-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'setlistfm',
          setlistfmId: show.setlistfmId,
          artist: show.artist, venue: show.venue, city: show.city,
          state: show.state || undefined, country: show.country,
          eventDate: show.eventDate, festival: detail.festival,
          userFestivalId: detail.userFestivalId || undefined,
          rating: detail.rating ? parseInt(detail.rating) : undefined,
          ticketPrice: detail.ticketPrice ? parseFloat(detail.ticketPrice) : undefined,
          ticketType: detail.ticketType || undefined,
          genre: detail.genre || undefined,
          notes: detail.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error); return }
      router.push('/dashboard')
    } catch {
      setSaveError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // ── Salvar (manual) ──
  async function handleSaveManual(e: FormEvent) {
    e.preventDefault()
    setManualError(null)
    setSavingManual(true)
    try {
      const res = await fetch('/api/user-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'manual', ...manual, state: manual.state || undefined,
          festival: manualDetail.festival,
          userFestivalId: manualDetail.userFestivalId || undefined,
          rating: manualDetail.rating ? parseInt(manualDetail.rating) : undefined,
          ticketPrice: manualDetail.ticketPrice ? parseFloat(manualDetail.ticketPrice) : undefined,
          ticketType: manualDetail.ticketType || undefined,
          genre: manualDetail.genre || undefined,
          notes: manualDetail.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setManualError(data.error); return }
      router.push('/dashboard')
    } catch {
      setManualError('Erro de conexão. Tente novamente.')
    } finally {
      setSavingManual(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-papel">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-5 py-8 md:py-10">

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-papel">Registrar show</h1>
          <p className="text-sm text-papel/45 mt-1">Busque no setlist.fm ou cadastre manualmente.</p>
        </div>

        {/* ── Busca ── */}
        <form onSubmit={(e) => handleSearch(e, 1)} className="bg-surface border border-white/[0.06] rounded-2xl p-4 md:p-5 mb-5 space-y-4">

          {/* Artista com autocomplete */}
          <Field label="Artista">
            <ArtistAutocomplete
              value={artist}
              onValueChange={handleArtistText}
              onSelect={handleArtistPick}
              onSubmitEnter={() => handleSearch(new Event('submit') as unknown as FormEvent, 1)}
              placeholder="Comece a digitar: Camila Cabello…"
              className={inputCls}
            />
          </Field>

          {/* Filtros principais — sempre visíveis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Cidade">
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="ex: São Paulo" className={inputCls} />
            </Field>
            <Field label="Local / venue">
              <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="ex: Allianz Parque" className={inputCls} />
            </Field>
            <Field label="País">
              <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls}>
                <option value="">Qualquer país</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </Field>
            <Field label={date ? 'Data exata' : 'Ano'}>
              {date ? (
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
              ) : (
                <select value={year} onChange={(e) => setYear(e.target.value)} className={inputCls}>
                  <option value="">Qualquer ano</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              )}
            </Field>
          </div>

          {/* Alternância ano ↔ data exata */}
          <button
            type="button"
            onClick={() => { if (date) { setDate('') } else { setYear(''); setDate(new Date().toISOString().slice(0, 10)) } }}
            className="text-xs text-papel/40 hover:text-papel/70 transition-colors"
          >
            {date ? 'Usar ano em vez de data exata' : 'Buscar por data exata'}
          </button>

          {/* Ações */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={searching}
              className="flex-1 sm:flex-none bg-roxo hover:bg-roxo-hover disabled:opacity-40 text-papel font-medium text-sm px-8 py-3 rounded-xl transition-colors"
            >
              {searching ? 'Buscando…' : 'Buscar'}
            </button>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters} className="text-xs text-papel/40 hover:text-papel/70 transition-colors">
                Limpar filtros
              </button>
            )}
          </div>

          {searchError && <p className="text-red-400 text-sm">{searchError}</p>}
        </form>

        {/* ── Resultados ── */}
        {results !== null && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-papel/40">
                {totalResults} resultado{totalResults !== 1 ? 's' : ''}
              </p>
              <a href="https://www.setlist.fm" target="_blank" rel="noopener noreferrer" className="text-[10px] text-papel/25 hover:text-papel/45 transition-colors">
                dados: setlist.fm ↗
              </a>
            </div>

            {results.length === 0 ? (
              <div className="bg-surface border border-white/[0.06] rounded-2xl p-8 text-center">
                <p className="text-papel/50 text-sm">Nenhum show encontrado.</p>
                <button onClick={() => setShowManual(true)} className="mt-3 text-roxo-luz text-sm font-medium hover:text-papel transition-colors">
                  Cadastrar manualmente
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {results.map((show) => (
                  <ShowCard
                    key={show.setlistfmId}
                    show={show}
                    isSelected={selectedId === show.setlistfmId}
                    detail={detail}
                    saving={saving}
                    saveError={saveError}
                    onSelect={() => { setSelectedId(show.setlistfmId); setDetail({ ...emptyDetail(), festival: show.festival }); setSaveError(null) }}
                    onDeselect={() => setSelectedId(null)}
                    onDetailChange={(field, value) => setDetail((d) => ({ ...d, [field]: value }))}
                    onSave={() => handleSaveShow(show)}
                  />
                ))}

                {totalResults > 20 && (
                  <div className="flex justify-center gap-3 pt-3">
                    {searchPage > 1 && (
                      <button onClick={(e) => handleSearch(e as unknown as FormEvent, searchPage - 1)} className="text-sm text-papel/50 hover:text-papel px-4 py-2 border border-white/[0.08] rounded-xl transition-colors">
                        Anterior
                      </button>
                    )}
                    {searchPage * 20 < totalResults && (
                      <button onClick={(e) => handleSearch(e as unknown as FormEvent, searchPage + 1)} className="text-sm text-papel/50 hover:text-papel px-4 py-2 border border-white/[0.08] rounded-xl transition-colors">
                        Próxima
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Manual ── */}
        <div className="border-t border-white/[0.06] pt-6">
          <button
            type="button"
            onClick={() => setShowManual(!showManual)}
            className="text-sm text-papel/50 hover:text-papel/80 transition-colors"
          >
            {showManual ? 'Fechar cadastro manual' : 'Não encontrou? Cadastrar manualmente'}
          </button>

          {showManual && (
            <form onSubmit={handleSaveManual} className="bg-surface border border-white/[0.06] rounded-2xl p-4 mt-4 space-y-4">
              <div className="space-y-3">
                <Field label="Artista *">
                  <input type="text" required value={manual.artist} onChange={(e) => setManual((m) => ({ ...m, artist: e.target.value }))} placeholder="ex: Metallica" className={inputCls} />
                </Field>
                <Field label="Local / venue *">
                  <input type="text" required value={manual.venue} onChange={(e) => setManual((m) => ({ ...m, venue: e.target.value }))} placeholder="ex: Allianz Parque" className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cidade *">
                    <input type="text" required value={manual.city} onChange={(e) => setManual((m) => ({ ...m, city: e.target.value }))} placeholder="São Paulo" className={inputCls} />
                  </Field>
                  <Field label="Estado / UF">
                    <input type="text" value={manual.state} onChange={(e) => setManual((m) => ({ ...m, state: e.target.value }))} placeholder="SP" className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="País *">
                    <select required value={manual.country} onChange={(e) => setManual((m) => ({ ...m, country: e.target.value }))} className={inputCls}>
                      {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Data *">
                    <input type="date" required value={manual.eventDate} onChange={(e) => setManual((m) => ({ ...m, eventDate: e.target.value }))} className={inputCls} />
                  </Field>
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-4">
                <p className="text-xs text-papel/40 mb-3">Seus detalhes (opcional)</p>
                <DetailFields
                  detail={manualDetail}
                  onChange={(f, v) => setManualDetail((d) => ({ ...d, [f]: v }))}
                  venue={manual.venue || undefined}
                  date={manual.eventDate || undefined}
                />
              </div>

              {manualError && <p className="text-red-400 text-sm">{manualError}</p>}

              <button type="submit" disabled={savingManual} className="w-full bg-roxo hover:bg-roxo-hover disabled:opacity-40 text-papel font-medium text-sm py-3.5 rounded-xl transition-colors">
                {savingManual ? 'Salvando...' : 'Salvar show'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

const inputCls = 'w-full bg-surface-2 border border-white/[0.08] rounded-xl px-3.5 py-3 text-sm text-papel placeholder:text-papel/25 focus:outline-none focus:border-roxo/50 focus:ring-1 focus:ring-roxo/20 transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-papel/45 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function DetailFields({
  detail, onChange, suggestName, venue, date,
}: {
  detail: DetailForm
  onChange: (field: keyof DetailForm, value: string | boolean | null) => void
  suggestName?: string
  venue?: string
  date?: string
}) {
  const linkedToFestival = !!detail.userFestivalId

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nota (1–10)">
          <input type="number" min="1" max="10" step="0.5" value={detail.rating} onChange={(e) => onChange('rating', e.target.value)} placeholder="9.5" className={inputCls} />
        </Field>
        <Field label="Gênero">
          <GenrePicker value={detail.genre} onChange={(v) => onChange('genre', v)} className={inputCls} />
        </Field>
      </div>

      {/* Preço só faz sentido quando o show NÃO faz parte de um festival */}
      {linkedToFestival ? (
        <p className="text-[11px] text-papel/40 bg-surface-2/40 rounded-xl px-3.5 py-3">
          O preço não é informado aqui: o ingresso pertence ao festival e é contado
          uma vez só. Para ajustar o valor, edite o festival.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Preço (R$)">
            <input type="number" min="0" step="0.01" value={detail.ticketPrice} onChange={(e) => onChange('ticketPrice', e.target.value)} placeholder="320" className={inputCls} />
          </Field>
          <Field label="Tipo de ingresso">
            <select value={detail.ticketType} onChange={(e) => onChange('ticketType', e.target.value)} className={inputCls}>
              <option value="">Selecionar</option>
              {TICKET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
        </div>
      )}

      {/* Festival */}
      <div className="bg-surface-2/40 rounded-xl px-3.5 py-3">
        <label className="flex items-center gap-2.5 text-sm text-papel/70 cursor-pointer">
          <input
            type="checkbox"
            checked={detail.festival}
            onChange={(e) => {
              onChange('festival', e.target.checked)
              if (!e.target.checked) onChange('userFestivalId', null)
            }}
            className="accent-roxo w-4 h-4"
          />
          Faz parte de um festival?
        </label>

        {detail.festival && (
          <div className="mt-3">
            <FestivalPicker
              value={detail.userFestivalId}
              onChange={(id) => {
                onChange('userFestivalId', id)
                // Vinculou? O preço passa a ser do festival — limpa o que estava digitado
                if (id) { onChange('ticketPrice', ''); onChange('ticketType', '') }
              }}
              suggestName={suggestName}
              venue={venue}
              date={date}
            />
          </div>
        )}
      </div>

      <Field label="Observações">
        <textarea value={detail.notes} onChange={(e) => onChange('notes', e.target.value)} placeholder="Lembranças, setlist favorito..." rows={2} className={`${inputCls} resize-none`} />
      </Field>
    </div>
  )
}

function ShowCard({
  show, isSelected, detail, saving, saveError,
  onSelect, onDeselect, onDetailChange, onSave,
}: {
  show: ShowResult
  isSelected: boolean
  detail: DetailForm
  saving: boolean
  saveError: string | null
  onSelect: () => void
  onDeselect: () => void
  onDetailChange: (field: keyof DetailForm, value: string | boolean | null) => void
  onSave: () => void
}) {
  const date = new Date(show.eventDate + 'T12:00:00')
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  const location = [show.city, show.state].filter(Boolean).join(', ')

  return (
    <div className={`bg-surface border rounded-2xl overflow-hidden transition-colors ${isSelected ? 'border-roxo/50' : 'border-white/[0.05]'}`}>
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-papel truncate">{show.artist}</div>
            <div className="text-xs text-papel/40 mt-0.5 truncate">{show.venue} · {location}</div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[11px] text-papel/35">{dateStr}</span>
              {show.festival && <span className="text-[10px] px-2 py-0.5 rounded-full bg-roxo/15 text-roxo-luz">Festival</span>}
              {show.songCount > 0 && <span className="text-[11px] text-papel/25">{show.songCount} músicas</span>}
            </div>
          </div>
        </div>

        <button
          onClick={isSelected ? onDeselect : onSelect}
          className={`w-full mt-3 text-sm font-medium py-2.5 rounded-xl transition-colors ${
            isSelected ? 'bg-surface-2 text-papel/60' : 'bg-roxo/15 text-roxo-luz hover:bg-roxo/25'
          }`}
        >
          {isSelected ? 'Cancelar' : 'Fui nesse show'}
        </button>
      </div>

      {isSelected && (
        <div className="border-t border-white/[0.06] px-4 py-4 bg-surface-2/30">
          <p className="text-xs text-papel/40 mb-3">Seus detalhes (opcional)</p>
          <DetailFields
            detail={detail}
            onChange={onDetailChange}
            suggestName={show.tourName || undefined}
            venue={show.venue}
            date={show.eventDate}
          />

          {saveError && <p className="text-red-400 text-sm mt-3">{saveError}</p>}

          <div className="flex gap-2.5 mt-4">
            <button onClick={onSave} disabled={saving} className="flex-1 bg-roxo hover:bg-roxo-hover disabled:opacity-40 text-papel font-medium text-sm py-3 rounded-xl transition-colors">
              {saving ? 'Salvando...' : 'Salvar show'}
            </button>
            <a href={show.setlistfmUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-3 border border-white/[0.08] text-papel/40 hover:text-papel/70 text-xs rounded-xl transition-colors flex items-center">
              setlist ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
