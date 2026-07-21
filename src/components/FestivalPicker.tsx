'use client'

import { useEffect, useRef, useState } from 'react'
import { TICKET_TYPES } from '@/lib/ticketTypes'

export interface UserFestival {
  id: string            // id do MEU ingresso (user_festivals)
  festivalId: string    // id no catálogo compartilhado
  name: string
  city: string | null
  ticket_price: number | null
  ticket_type: string | null
  festival_date: string | null
}

interface CatalogFestival {
  id: string
  name: string
  city: string | null
  start_date: string | null
}

/**
 * Escolhe um festival já cadastrado pelo usuário, ou registra o ingresso
 * em um festival do catálogo compartilhado (com autocomplete, para evitar
 * que cada usuário crie um "Rock in Rio 2024" diferente).
 */
export function FestivalPicker({
  value,
  onChange,
  suggestName,
  venue,
  date,
}: {
  value: string | null                 // id do MEU ingresso selecionado
  onChange: (id: string | null) => void
  suggestName?: string
  venue?: string
  date?: string
}) {
  const [festivals, setFestivals] = useState<UserFestival[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [suggestion, setSuggestion] = useState<{ id: string; name: string; showCount: number } | null>(null)

  // Formulário de novo ingresso
  const [name, setName] = useState(suggestName ?? '')
  const [pickedFromCatalog, setPickedFromCatalog] = useState<CatalogFestival | null>(null)
  const [matches, setMatches] = useState<CatalogFestival[]>([])
  const [showMatches, setShowMatches] = useState(false)
  const [price, setPrice] = useState('')
  const [type, setType] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const justPicked = useRef(false)

  // Carrega meus festivais + sugestão por local/data
  useEffect(() => {
    let active = true
    const params = new URLSearchParams()
    if (venue) params.set('venue', venue)
    if (date) params.set('date', date)

    fetch(`/api/festivals?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data) return
        setFestivals(data.festivals ?? [])
        setSuggestion(data.suggestion ?? null)
        if (data.suggestion && !value) onChange(data.suggestion.id)
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue, date])

  // Autocomplete no catálogo compartilhado enquanto digita o nome
  useEffect(() => {
    if (!creating) return
    if (justPicked.current) { justPicked.current = false; return }

    const q = name.trim()
    if (q.length < 2) { setMatches([]); setShowMatches(false); return }

    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/festivals/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        const found: CatalogFestival[] = data.festivals ?? []
        setMatches(found)
        setShowMatches(found.length > 0)
      } catch {
        setMatches([])
      }
    }, 300)

    return () => clearTimeout(t)
  }, [name, creating])

  async function handleCreate() {
    if (!pickedFromCatalog && !name.trim()) { setError('Dê um nome ao festival.'); return }
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/festivals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festivalId: pickedFromCatalog?.id,
          name: pickedFromCatalog ? undefined : name.trim(),
          ticketPrice: price ? parseFloat(price) : null,
          ticketType: type || null,
          festivalDate: date || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao registrar festival.'); return }

      const created: UserFestival = data.festival
      setFestivals((prev) => (prev.some((f) => f.id === created.id) ? prev : [created, ...prev]))
      onChange(created.id)
      resetForm()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setCreating(false)
    setName(''); setPrice(''); setType('')
    setPickedFromCatalog(null); setMatches([]); setShowMatches(false)
  }

  function pickCatalog(f: CatalogFestival) {
    justPicked.current = true
    setPickedFromCatalog(f)
    setName(f.name)
    setShowMatches(false)
  }

  const selected = festivals.find((f) => f.id === value)

  if (loading) return <p className="text-xs text-papel/30 py-2">Carregando festivais…</p>

  return (
    <div className="space-y-3">
      {/* Detecção automática por local + data */}
      {suggestion && value === suggestion.id && (
        <p className="text-[11px] text-roxo-luz bg-roxo/10 rounded-lg px-3 py-2">
          Você já registrou {suggestion.showCount} {suggestion.showCount === 1 ? 'show' : 'shows'} nesse
          mesmo local e data em <strong>{suggestion.name}</strong> — vinculamos automaticamente.
        </p>
      )}

      {!creating ? (
        <>
          <label className="block text-xs text-papel/45 mb-1.5">
            Seus ingressos de festival
          </label>
          <select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            className={inputCls}
          >
            <option value="">Selecionar festival…</option>
            {festivals.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}{f.ticket_price != null ? ` — você pagou R$ ${f.ticket_price.toFixed(0)}` : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => { setCreating(true); setName(suggestName ?? '') }}
            className="text-xs text-roxo-luz hover:text-papel transition-colors"
          >
            + Adicionar festival
          </button>

          {selected && (
            <p className="text-[11px] text-papel/35">
              O ingresso deste show faz parte do ingresso do festival
              {selected.ticket_price != null ? ` (R$ ${selected.ticket_price.toFixed(2)})` : ''}.
            </p>
          )}
        </>
      ) : (
        <div className="bg-bg/40 rounded-xl p-3.5 space-y-3">
          {/* Nome com autocomplete no catálogo compartilhado */}
          <div className="relative">
            <label className="block text-xs text-papel/45 mb-1.5">Nome do festival *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                justPicked.current = false
                setName(e.target.value)
                setPickedFromCatalog(null)
              }}
              onFocus={() => { if (matches.length > 0) setShowMatches(true) }}
              placeholder="ex: Rock in Rio 2024"
              autoComplete="off"
              className={inputCls}
            />

            {showMatches && matches.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-surface-2 border border-white/[0.1] rounded-xl overflow-hidden shadow-2xl">
                <p className="px-3 py-1.5 text-[10px] text-papel/35 border-b border-white/[0.06]">
                  Já existe no catálogo
                </p>
                {matches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => pickCatalog(m)}
                    className="w-full text-left px-3 py-2 hover:bg-white/[0.05] transition-colors"
                  >
                    <span className="text-sm text-papel">{m.name}</span>
                    {m.city && <span className="text-[11px] text-papel/40 ml-1.5">{m.city}</span>}
                  </button>
                ))}
              </div>
            )}

            {pickedFromCatalog && (
              <p className="text-[11px] text-roxo-luz mt-1.5">
                Usando &quot;{pickedFromCatalog.name}&quot; do catálogo — o mesmo que outras pessoas usam.
              </p>
            )}

            {suggestName && name !== suggestName && (
              <button
                type="button"
                onClick={() => { setName(suggestName); setPickedFromCatalog(null) }}
                className="text-[11px] text-roxo-luz hover:text-papel transition-colors mt-1.5"
              >
                Usar &quot;{suggestName}&quot; (do setlist.fm)
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-papel/45 mb-1.5">Preço do ingresso</label>
              <input
                type="number" min="0" step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="600"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-papel/45 mb-1.5">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                <option value="">Selecionar</option>
                {TICKET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <p className="text-[11px] text-papel/30">
            O nome do festival é compartilhado, mas <strong className="text-papel/50">o preço é só seu</strong> —
            ninguém mais vê quanto você pagou. Informe o valor total do seu ingresso
            (inteira, meia, VIP…): ele conta uma vez só, mesmo com vários shows.
          </p>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { resetForm(); setError(null) }}
              className="flex-1 py-2.5 rounded-lg border border-white/[0.1] text-papel/60 hover:text-papel text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-roxo hover:bg-roxo-hover disabled:opacity-40 text-papel text-xs font-medium transition-colors"
            >
              {saving ? 'Salvando…' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full bg-surface-2 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-papel placeholder:text-papel/25 focus:outline-none focus:border-roxo/50 focus:ring-1 focus:ring-roxo/20 transition-colors'
