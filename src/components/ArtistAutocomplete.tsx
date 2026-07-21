'use client'

import { useEffect, useRef, useState } from 'react'

interface Suggestion {
  mbid: string
  name: string
  disambiguation: string
}

/**
 * Campo de artista com autocomplete.
 * Busca sugestões no setlist.fm enquanto o usuário digita (com debounce).
 * `onSelect` recebe o nome + mbid (id único) para uma busca precisa.
 */
export function ArtistAutocomplete({
  value,
  onValueChange,
  onSelect,
  onSubmitEnter,
  placeholder,
  className,
}: {
  value: string
  onValueChange: (name: string) => void
  onSelect: (name: string, mbid: string) => void
  onSubmitEnter?: () => void
  placeholder?: string
  className?: string
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const justSelected = useRef(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // Busca com debounce
  useEffect(() => {
    if (justSelected.current) { justSelected.current = false; return }
    const q = value.trim()
    if (q.length < 2) { setSuggestions([]); setOpen(false); return }

    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/artists/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setSuggestions(data.artists ?? [])
        setOpen((data.artists ?? []).length > 0)
        setHighlight(-1)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(t)
  }, [value])

  // Fecha ao clicar fora
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(s: Suggestion) {
    justSelected.current = true
    onSelect(s.name, s.mbid)
    setOpen(false)
    setSuggestions([])
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Enter' && onSubmitEnter) { e.preventDefault(); onSubmitEnter() }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlight >= 0) pick(suggestions[highlight])
      else if (onSubmitEnter) onSubmitEnter()
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => { justSelected.current = false; onValueChange(e.target.value) }}
        onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />

      {/* Indicador de carregando */}
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-papel/30 text-xs">…</span>
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-surface-2 border border-white/[0.1] rounded-xl overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={s.mbid}
              type="button"
              onClick={() => pick(s)}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full text-left px-4 py-2.5 transition-colors ${
                i === highlight ? 'bg-roxo/20' : 'hover:bg-white/[0.04]'
              }`}
            >
              <div className="text-sm text-papel truncate">{s.name}</div>
              {s.disambiguation && (
                <div className="text-[11px] text-papel/40 truncate">{s.disambiguation}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
