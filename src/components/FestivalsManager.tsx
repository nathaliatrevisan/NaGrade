'use client'

import { useState, FormEvent, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TICKET_TYPES, ticketTypeLabel } from '@/lib/ticketTypes'

export interface ManagedFestival {
  id: string            // meu ingresso
  festivalId: string    // catálogo compartilhado
  name: string
  ticket_price: number | null
  ticket_type: string | null
  festival_date: string | null
  showCount: number
}

interface CatalogFestival {
  id: string
  name: string
  city: string | null
}

export function FestivalsManager({ festivals }: { festivals: ManagedFestival[] }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<ManagedFestival | null>(null)
  const [confirming, setConfirming] = useState<ManagedFestival | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(f: ManagedFestival) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/festivals/${f.id}`, { method: 'DELETE' })
      if (res.ok) { setConfirming(null); router.refresh() }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-papel/45">
          {festivals.length} {festivals.length === 1 ? 'festival' : 'festivais'}
        </p>
        <button
          onClick={() => setAdding(true)}
          className="bg-roxo hover:bg-roxo-hover text-papel font-medium text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          + Adicionar festival
        </button>
      </div>

      {festivals.length === 0 ? (
        <div className="bg-surface border border-white/[0.05] rounded-2xl px-6 py-14 text-center">
          <h2 className="text-lg font-semibold text-papel mb-1.5">Nenhum festival ainda</h2>
          <p className="text-sm text-papel/45 max-w-[320px] mx-auto">
            Cadastre um festival com o preço do seu ingresso. Depois é só vincular
            os shows que você viu nele.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {festivals.map((f) => (
            <div key={f.id} className="bg-surface border border-white/[0.05] rounded-2xl px-4 py-4 md:px-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-papel truncate">{f.name}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {f.festival_date && (
                    <span className="text-[11px] text-papel/35">
                      {new Date(f.festival_date + 'T12:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                  )}
                  <Chip>{f.showCount} {f.showCount === 1 ? 'show' : 'shows'}</Chip>
                  {f.ticket_type && <Chip>{ticketTypeLabel(f.ticket_type)}</Chip>}
                  {f.ticket_price != null && f.showCount > 0 && (
                    <Chip>R$ {(f.ticket_price / f.showCount).toFixed(0)} por show</Chip>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                {f.ticket_price != null ? (
                  <>
                    <span className="font-title text-2xl text-roxo-luz leading-none">
                      R$ {f.ticket_price.toFixed(0)}
                    </span>
                    <p className="text-[9px] text-papel/25 mt-0.5">seu ingresso</p>
                  </>
                ) : (
                  <span className="text-xs text-papel/25">sem preço</span>
                )}
              </div>

              <div className="shrink-0 flex gap-1">
                <button
                  onClick={() => setEditing(f)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-papel/40 hover:text-papel hover:bg-white/[0.05] transition-colors"
                  aria-label="Editar"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4Z" />
                  </svg>
                </button>
                <button
                  onClick={() => setConfirming(f)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-papel/40 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                  aria-label="Excluir"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <AddFestivalModal
          onClose={() => setAdding(false)}
          onSaved={() => { setAdding(false); router.refresh() }}
        />
      )}

      {editing && (
        <EditFestivalModal
          festival={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh() }}
        />
      )}

      {confirming && (
        <Overlay onClose={deleting ? () => {} : () => setConfirming(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-surface border border-white/[0.08] rounded-2xl p-5">
            <h3 className="font-medium text-papel mb-2">Excluir festival?</h3>
            <p className="text-sm text-papel/55 leading-relaxed mb-5">
              &quot;{confirming.name}&quot; sai da sua lista e o preço deixa de contar no seu gasto.
              {confirming.showCount > 0 && ` Os ${confirming.showCount} shows vinculados continuam no seu histórico, mas sem festival.`}
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setConfirming(null)} disabled={deleting} className="flex-1 py-3 rounded-xl border border-white/[0.1] text-papel/60 hover:text-papel text-sm font-medium transition-colors disabled:opacity-40">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirming)} disabled={deleting} className="flex-1 py-3 rounded-xl bg-red-500/90 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-medium transition-colors">
                {deleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </>
  )
}

// ─── Adicionar (com autocomplete no catálogo compartilhado) ──────────────────

function AddFestivalModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<CatalogFestival | null>(null)
  const [matches, setMatches] = useState<CatalogFestival[]>([])
  const [showMatches, setShowMatches] = useState(false)
  const [price, setPrice] = useState('')
  const [type, setType] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const justPicked = useRef(false)

  useEffect(() => {
    if (justPicked.current) { justPicked.current = false; return }
    const q = name.trim()
    if (q.length < 2) { setMatches([]); setShowMatches(false); return }

    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/festivals/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setMatches(data.festivals ?? [])
        setShowMatches((data.festivals ?? []).length > 0)
      } catch { setMatches([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [name])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!picked && !name.trim()) { setError('Dê um nome ao festival.'); return }
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/festivals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festivalId: picked?.id,
          name: picked ? undefined : name.trim(),
          ticketPrice: price ? parseFloat(price) : null,
          ticketType: type || null,
          festivalDate: date || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar.'); return }
      onSaved()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Overlay onClose={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-surface border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="font-medium text-papel">Adicionar festival</h3>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="relative">
            <label className="block text-xs text-papel/45 mb-1.5">Nome do festival *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { justPicked.current = false; setName(e.target.value); setPicked(null) }}
              onFocus={() => { if (matches.length > 0) setShowMatches(true) }}
              placeholder="ex: Rock in Rio 2024"
              autoComplete="off"
              className={inputCls}
            />
            {showMatches && matches.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-surface-2 border border-white/[0.1] rounded-xl overflow-hidden shadow-2xl">
                <p className="px-3 py-1.5 text-[10px] text-papel/35 border-b border-white/[0.06]">Já existe no catálogo</p>
                {matches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { justPicked.current = true; setPicked(m); setName(m.name); setShowMatches(false) }}
                    className="w-full text-left px-3 py-2 hover:bg-white/[0.05] transition-colors"
                  >
                    <span className="text-sm text-papel">{m.name}</span>
                    {m.city && <span className="text-[11px] text-papel/40 ml-1.5">{m.city}</span>}
                  </button>
                ))}
              </div>
            )}
            {picked && (
              <p className="text-[11px] text-roxo-luz mt-1.5">
                Usando &quot;{picked.name}&quot; do catálogo compartilhado.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-papel/45 mb-1.5">Preço do seu ingresso</label>
              <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="600" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-papel/45 mb-1.5">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                <option value="">Selecionar</option>
                {TICKET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-papel/45 mb-1.5">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>

          <p className="text-[11px] text-papel/30">
            O nome é compartilhado; <strong className="text-papel/50">o preço é só seu</strong>.
            Informe o valor total do ingresso (inteira, meia, VIP…).
          </p>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06] flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/[0.1] text-papel/60 hover:text-papel text-sm font-medium transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-roxo hover:bg-roxo-hover disabled:opacity-40 text-papel text-sm font-medium transition-colors">
            {saving ? 'Salvando…' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Overlay>
  )
}

// ─── Editar meu ingresso ─────────────────────────────────────────────────────

function EditFestivalModal({
  festival, onClose, onSaved,
}: {
  festival: ManagedFestival
  onClose: () => void
  onSaved: () => void
}) {
  const [price, setPrice] = useState(festival.ticket_price != null ? String(festival.ticket_price) : '')
  const [type, setType] = useState(festival.ticket_type ?? '')
  const [date, setDate] = useState(festival.festival_date ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/festivals/${festival.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketPrice: price ? parseFloat(price) : null,
          ticketType: type || null,
          festivalDate: date || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar.'); return }
      onSaved()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Overlay onClose={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-surface border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="font-medium text-papel">Editar ingresso</h3>
          <p className="text-xs text-papel/45 mt-0.5 truncate">{festival.name}</p>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-papel/45 mb-1.5">Preço do seu ingresso</label>
              <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="600" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-papel/45 mb-1.5">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                <option value="">Selecionar</option>
                {TICKET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-papel/45 mb-1.5">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>

          <p className="text-[11px] text-papel/30">
            O nome vem do catálogo compartilhado e não é editado aqui — mudá-lo
            afetaria todos os usuários.
          </p>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06] flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/[0.1] text-papel/60 hover:text-papel text-sm font-medium transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-roxo hover:bg-roxo-hover disabled:opacity-40 text-papel text-sm font-medium transition-colors">
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Overlay>
  )
}

// ─── Auxiliares ──────────────────────────────────────────────────────────────

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 text-papel/45 capitalize">
      {children}
    </span>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-surface-2 border border-white/[0.08] rounded-xl px-3.5 py-3 text-sm text-papel placeholder:text-papel/25 focus:outline-none focus:border-roxo/50 focus:ring-1 focus:ring-roxo/20 transition-colors'
