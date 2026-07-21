'use client'

import { useState } from 'react'
import type { Slice } from '@/lib/stats'

/**
 * Gráficos em SVG/CSS puro — sem biblioteca externa.
 * Todos são interativos: destaque no hover, tooltip com detalhes e
 * suporte a toque (no celular não existe hover, então o toque seleciona).
 */

export const PALETTE = [
  '#8B5CF6', // roxo
  '#A78BFA', // roxo claro
  '#7C4DF0', // roxo hover
  '#C4B5FD', // roxo muito claro
  '#6D28D9', // roxo escuro
  '#DDD6FE',
  '#4C1D95',
  '#3A3547', // muted
]

function pct(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

// ─── Barras verticais ────────────────────────────────────────────────────────

export function BarChart({
  data,
  formatValue,
  unit,
  showPercent = false,
  height = 150,
}: {
  data: Slice[]
  formatValue?: (v: number) => string
  unit?: string
  showPercent?: boolean
  height?: number
}) {
  const [active, setActive] = useState<number | null>(null)

  if (data.length === 0) return <EmptyChart />

  const max = Math.max(...data.map((d) => d.value), 1)
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex items-end gap-1.5 sm:gap-2.5 relative" style={{ height }}>
      {data.map((d, i) => {
        const heightPct = (d.value / max) * 100
        const isActive = active === i
        const dim = active !== null && !isActive

        return (
          <div
            key={d.label}
            className="flex-1 flex flex-col items-center justify-end h-full min-w-0 relative cursor-pointer"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onClick={() => setActive(isActive ? null : i)}
          >
            {/* Tooltip */}
            {isActive && (
              <div className="absolute bottom-full mb-2 z-20 pointer-events-none">
                <div className="bg-surface-2 border border-white/[0.12] rounded-lg px-3 py-2 shadow-2xl whitespace-nowrap">
                  <p className="text-[11px] text-papel/50 leading-none mb-1">{d.label}</p>
                  <p className="text-sm font-medium text-papel leading-none">
                    {formatValue ? formatValue(d.value) : d.value}
                    {unit && <span className="text-papel/50 font-normal"> {unit}</span>}
                  </p>
                  {showPercent && total > 0 && (
                    <p className="text-[11px] text-roxo-luz leading-none mt-1">
                      {pct(d.value, total)}% do total
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Valor sobre a barra */}
            <span
              className={`font-title text-xs sm:text-sm mb-1 leading-none transition-colors ${
                isActive ? 'text-papel' : 'text-roxo-luz'
              }`}
            >
              {d.value > 0 ? (formatValue ? formatValue(d.value) : d.value) : ''}
            </span>

            {/* Barra */}
            <div
              className={`w-full rounded-t-md min-h-[2px] transition-all duration-150 ${
                isActive ? 'bg-roxo-luz' : dim ? 'bg-roxo/35' : 'bg-roxo/80'
              }`}
              style={{ height: `${Math.max(heightPct, 1)}%` }}
            />

            {/* Rótulo */}
            <span
              className={`text-[10px] sm:text-[11px] mt-1.5 truncate w-full text-center transition-colors ${
                isActive ? 'text-papel' : 'text-papel/40'
              }`}
            >
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Barras horizontais ──────────────────────────────────────────────────────

export function HorizontalBars({
  data,
  formatValue,
  caption,
}: {
  data: { label: string; value: number; hint?: string }[]
  formatValue?: (v: number) => string
  caption?: (item: { label: string; value: number; hint?: string }) => string
}) {
  const [active, setActive] = useState<number | null>(null)

  if (data.length === 0) return <EmptyChart />

  const max = Math.max(...data.map((d) => d.value), 1)
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="space-y-1">
      {data.map((d, i) => {
        const isActive = active === i
        const dim = active !== null && !isActive
        const color = PALETTE[i % PALETTE.length]

        return (
          <div
            key={d.label}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onClick={() => setActive(isActive ? null : i)}
            className={`rounded-xl px-3 py-2.5 -mx-3 cursor-pointer transition-colors ${
              isActive ? 'bg-white/[0.04]' : ''
            }`}
          >
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span className={`text-sm truncate transition-colors ${isActive ? 'text-papel' : 'text-papel/80'}`}>
                {d.label}
              </span>
              <span className="font-title text-sm text-roxo-luz shrink-0">
                {formatValue ? formatValue(d.value) : d.value}
              </span>
            </div>

            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${Math.max((d.value / max) * 100, 2)}%`,
                  backgroundColor: color,
                  opacity: dim ? 0.4 : 1,
                }}
              />
            </div>

            {/* Detalhes: sempre visíveis, com reforço no hover */}
            <div className="flex items-center justify-between gap-3 mt-1.5">
              {caption && (
                <p className={`text-[11px] transition-colors ${isActive ? 'text-papel/55' : 'text-papel/30'}`}>
                  {caption(d)}
                </p>
              )}
              {isActive && total > 0 && (
                <p className="text-[11px] text-roxo-luz shrink-0">{pct(d.value, total)}% do total</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Rosca (donut) ───────────────────────────────────────────────────────────

export function DonutChart({
  data,
  unit = 'shows',
}: {
  data: Slice[]
  unit?: string
}) {
  const [active, setActive] = useState<number | null>(null)

  if (data.length === 0) return <EmptyChart />

  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return <EmptyChart />

  const radius = 60
  const stroke = 22
  const circumference = 2 * Math.PI * radius

  let offset = 0
  const segments = data.map((d, i) => {
    const fraction = d.value / total
    const length = fraction * circumference
    const seg = {
      label: d.label,
      value: d.value,
      pct: Math.round(fraction * 100),
      color: PALETTE[i % PALETTE.length],
      dash: `${length} ${circumference - length}`,
      offset: -offset,
    }
    offset += length
    return seg
  })

  const activeSeg = active !== null ? segments[active] : null

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Rosca */}
      <div className="relative shrink-0">
        <svg
          width="170" height="170" viewBox="0 0 170 170"
          role="img"
          aria-label={`Distribuição por ${unit}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}
        >
          <g transform="rotate(-90 85 85)">
            {segments.map((s, i) => {
              const isActive = active === i
              const dim = active !== null && !isActive
              return (
                <circle
                  key={s.label}
                  cx="85" cy="85" r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={isActive ? stroke + 7 : stroke}
                  strokeDasharray={s.dash}
                  strokeDashoffset={s.offset}
                  opacity={dim ? 0.35 : 1}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onClick={() => setActive(isActive ? null : i)}
                />
              )
            })}
          </g>
        </svg>

        {/* Centro: total, ou detalhe do segmento ativo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
          {activeSeg ? (
            <>
              <span className="font-title text-3xl leading-none" style={{ color: activeSeg.color }}>
                {activeSeg.pct}%
              </span>
              <span className="text-[11px] text-papel/70 mt-1 leading-tight line-clamp-2">
                {activeSeg.label}
              </span>
              <span className="text-[10px] text-papel/35 mt-0.5">
                {activeSeg.value} {activeSeg.value === 1 ? unit.replace(/s$/, '') : unit}
              </span>
            </>
          ) : (
            <>
              <span className="font-title text-3xl text-papel leading-none">{total}</span>
              <span className="text-[10px] text-papel/40 mt-0.5">{unit}</span>
            </>
          )}
        </div>
      </div>

      {/* Legenda — sincronizada com a rosca */}
      <div className="flex-1 w-full space-y-0.5">
        {segments.map((s, i) => {
          const isActive = active === i
          const dim = active !== null && !isActive
          return (
            <div
              key={s.label}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive(isActive ? null : i)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 -mx-2.5 rounded-lg cursor-pointer transition-colors ${
                isActive ? 'bg-white/[0.05]' : ''
              }`}
              style={{ opacity: dim ? 0.45 : 1 }}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className={`text-sm flex-1 truncate transition-colors ${isActive ? 'text-papel' : 'text-papel/75'}`}>
                {s.label}
              </span>
              <span className="text-xs text-papel/40 shrink-0">{s.value}</span>
              <span className="font-title text-sm text-roxo-luz shrink-0 w-10 text-right">{s.pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Vazio ───────────────────────────────────────────────────────────────────

function EmptyChart() {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-papel/30">Sem dados suficientes ainda.</p>
    </div>
  )
}

// ─── Card de seção ───────────────────────────────────────────────────────────

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-surface border border-white/[0.06] rounded-2xl p-5 md:p-6">
      <div className="mb-5">
        <h2 className="text-base md:text-lg font-semibold text-papel">{title}</h2>
        {subtitle && <p className="text-xs text-papel/40 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}
