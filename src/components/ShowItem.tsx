'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { TICKET_TYPES, ticketTypeLabel } from '@/lib/ticketTypes'
import { FestivalPicker } from './FestivalPicker'
import { GenrePicker } from './GenrePicker'

export interface ShowItemData {
  id: string
  rating: number | null
  ticket_price: number | null
  ticket_type: string | null
  genre: string | null
  notes: string | null
  festival: boolean
  festival_name: string | null
  user_festival_id: string | null
  user_festivals?: {
    id: string
    ticket_price: number | null
    ticket_type: string | null
    festivals: { id: string; name: string } | null
  } | null
  events: {
    artist: string
    venue: string
    city: string
    state: string | null
    event_date: string
    festival: boolean
    source: string
  }
}

export function ShowItem({ show }: { show: ShowItemData }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const s = show
  const date = new Date(s.events.event_date + 'T12:00:00')
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  const location = [s.events.city, s.events.state].filter(Boolean).join(', ')
  const festivalLabel = s.user_festivals?.festivals?.name ?? s.festival_name ?? (s.festival ? 'Festival' : null)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/user-events/${s.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        setDeleting(false)
        setConfirming(false)
      }
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="bg-surface border border-white/[0.05] rounded-2xl px-4 py-3.5 md:px-5 md:py-4 relative">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-papel truncate">{s.events.artist}</div>
          <div className="text-xs text-papel/40 mt-0.5 truncate">
            {s.events.venue} · {location}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[11px] text-papel/35">{dateStr}</span>

            {/* Festival: prioriza o cadastrado (com ingresso próprio) */}
            {festivalLabel && <Chip highlight>{festivalLabel}</Chip>}

            {/* Ingresso: do festival quando vinculado, senão o do próprio show */}
            {s.user_festivals
              ? (
                <>
                  {s.user_festivals.ticket_type && <Chip>{ticketTypeLabel(s.user_festivals.ticket_type)}</Chip>}
                  <Chip>ingresso do festival</Chip>
                </>
              )
              : (
                <>
                  {s.ticket_type && <Chip>{ticketTypeLabel(s.ticket_type)}</Chip>}
                  {s.ticket_price != null && <Chip>R$ {s.ticket_price.toFixed(0)}</Chip>}
                </>
              )}

            {s.genre && <Chip>{s.genre}</Chip>}
          </div>
          {s.notes && (
            <p className="text-xs text-papel/35 mt-2 line-clamp-2">{s.notes}</p>
          )}
        </div>

        {s.rating != null && (
          <div className="shrink-0 flex flex-col items-center">
            <span className="font-title text-2xl text-roxo-luz leading-none">{s.rating}</span>
            <span className="text-[9px] text-papel/25 mt-0.5">nota</span>
          </div>
        )}

        {/* Menu kebab */}
        <div className="shrink-0 relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Opções"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-papel/40 hover:text-papel hover:bg-white/[0.05] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
            </svg>
          </button>

          {menuOpen && (
            <>
              {/* Backdrop pra fechar ao clicar fora */}
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-20 w-36 bg-surface-2 border border-white/[0.08] rounded-xl overflow-hidden shadow-xl">
                <button
                  onClick={() => { setMenuOpen(false); setEditing(true) }}
                  className="w-full px-4 py-2.5 text-left text-sm text-papel/80 hover:bg-white/[0.05] transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setConfirming(true) }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-400/90 hover:bg-red-500/5 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de edição */}
      {editing && (
        <EditModal
          show={s}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); router.refresh() }}
        />
      )}

      {/* Confirmação de exclusão */}
      {confirming && (
        <ConfirmDialog
          title="Excluir show?"
          message={`"${s.events.artist}" será removido do seu histórico. Essa ação não pode ser desfeita.`}
          confirmLabel={deleting ? 'Excluindo...' : 'Excluir'}
          busy={deleting}
          onCancel={() => setConfirming(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

function Chip({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
      highlight ? 'bg-roxo/15 text-roxo-luz' : 'bg-surface-2 text-papel/45'
    }`}>
      {children}
    </span>
  )
}

// ─── Modal de edição ─────────────────────────────────────────────────────────

function EditModal({
  show, onClose, onSaved,
}: {
  show: ShowItemData
  onClose: () => void
  onSaved: () => void
}) {
  const [rating, setRating] = useState(show.rating != null ? String(show.rating) : '')
  const [ticketPrice, setTicketPrice] = useState(show.ticket_price != null ? String(show.ticket_price) : '')
  const [ticketType, setTicketType] = useState(show.ticket_type ?? '')
  const [genre, setGenre] = useState(show.genre ?? '')
  const [notes, setNotes] = useState(show.notes ?? '')
  const [festival, setFestival] = useState(show.festival)
  const [userFestivalId, setUserFestivalId] = useState<string | null>(show.user_festival_id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/user-events/${show.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: rating ? parseInt(rating) : null,
          ticketPrice: ticketPrice ? parseFloat(ticketPrice) : null,
          ticketType: ticketType || null,
          genre: genre || null,
          notes: notes || null,
          festival,
          userFestivalId: festival ? userFestivalId : null,
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
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-surface border border-white/[0.08] rounded-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="font-medium text-papel">Editar show</h3>
          <p className="text-xs text-papel/45 mt-0.5 truncate">{show.events.artist}</p>
        </div>

        <div className="px-5 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-papel/45 mb-1.5">Nota (1–10)</label>
              <input type="number" min="1" max="10" step="0.5" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="9.5" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-papel/45 mb-1.5">Gênero</label>
              <GenrePicker value={genre} onChange={setGenre} className={inputCls} />
            </div>
          </div>

          {/* Preço só quando o show não pertence a um festival */}
          {userFestivalId && (
            <p className="text-[11px] text-papel/40 bg-surface-2/40 rounded-xl px-3.5 py-3">
              O preço não é informado aqui: o ingresso pertence ao festival e é contado
              uma vez só. Para ajustar o valor, edite o festival.
            </p>
          )}
          {!userFestivalId && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-papel/45 mb-1.5">Preço (R$)</label>
                <input type="number" min="0" step="0.01" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} placeholder="320" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-papel/45 mb-1.5">Tipo de ingresso</label>
                <select value={ticketType} onChange={(e) => setTicketType(e.target.value)} className={inputCls}>
                  <option value="">Selecionar</option>
                  {TICKET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Festival */}
          <div className="bg-surface-2/40 rounded-xl px-3.5 py-3">
            <label className="flex items-center gap-2.5 text-sm text-papel/70 cursor-pointer">
              <input
                type="checkbox"
                checked={festival}
                onChange={(e) => {
                  setFestival(e.target.checked)
                  if (!e.target.checked) setUserFestivalId(null)
                }}
                className="accent-roxo w-4 h-4"
              />
              Faz parte de um festival?
            </label>
            {festival && (
              <div className="mt-3">
                <FestivalPicker
                  value={userFestivalId}
                  onChange={(id) => {
                    setUserFestivalId(id)
                    // Vinculou? O ingresso passa a ser do festival
                    if (id) { setTicketPrice(''); setTicketType('') }
                  }}
                  suggestName={show.festival_name ?? undefined}
                  venue={show.events.venue}
                  date={show.events.event_date}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-papel/45 mb-1.5">Observações</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Lembranças, setlist favorito..." className={`${inputCls} resize-none`} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06] flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/[0.1] text-papel/60 hover:text-papel text-sm font-medium transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-roxo hover:bg-roxo-hover disabled:opacity-40 text-papel text-sm font-medium transition-colors">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Overlay>
  )
}

// ─── Confirmação genérica ────────────────────────────────────────────────────

function ConfirmDialog({
  title, message, confirmLabel, busy, onCancel, onConfirm,
}: {
  title: string
  message: string
  confirmLabel: string
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Overlay onClose={busy ? () => {} : onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-surface border border-white/[0.08] rounded-2xl p-5">
        <h3 className="font-medium text-papel mb-2">{title}</h3>
        <p className="text-sm text-papel/55 leading-relaxed mb-5">{message}</p>
        <div className="flex gap-2.5">
          <button onClick={onCancel} disabled={busy} className="flex-1 py-3 rounded-xl border border-white/[0.1] text-papel/60 hover:text-papel text-sm font-medium transition-colors disabled:opacity-40">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={busy} className="flex-1 py-3 rounded-xl bg-red-500/90 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-medium transition-colors">
            {confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-surface-2 border border-white/[0.08] rounded-xl px-3.5 py-3 text-sm text-papel placeholder:text-papel/25 focus:outline-none focus:border-roxo/50 focus:ring-1 focus:ring-roxo/20 transition-colors'
