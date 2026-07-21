'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Campo de gênero com autocomplete no catálogo compartilhado.
 * Sugere gêneros já existentes enquanto o usuário digita; se não houver,
 * ele pode usar o que digitou (a normalização final ocorre no servidor).
 */
export function GenrePicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const justPicked = useRef(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (justPicked.current) { justPicked.current = false; return }
    const q = value.trim()

    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/genres?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        const list: string[] = data.genres ?? []
        // Não sugere o valor exato já digitado
        const filtered = list.filter((g) => g.toLowerCase() !== q.toLowerCase())
        setSuggestions(filtered)
        setOpen(filtered.length > 0)
        setHighlight(-1)
      } catch {
        setSuggestions([])
      }
    }, 250)

    return () => clearTimeout(t)
  }, [value])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(g: string) {
    justPicked.current = true
    onChange(g)
    setOpen(false)
    setSuggestions([])
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && highlight >= 0) { e.preventDefault(); pick(suggestions[highlight]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => { justPicked.current = false; onChange(e.target.value) }}
        onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
        onKeyDown={onKeyDown}
        placeholder="ex: Rock, Metalcore…"
        autoComplete="off"
        className={className}
      />

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-surface-2 border border-white/[0.1] rounded-xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto">
          {suggestions.map((g, i) => (
            <button
              key={g}
              type="button"
              onClick={() => pick(g)}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                i === highlight ? 'bg-roxo/20 text-papel' : 'text-papel/80 hover:bg-white/[0.04]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
