'use client'

import { formatBRL, type YearRecap as Recap } from '@/lib/stats'

/**
 * Retrospectiva do ano — estilo "wrapped", feita pra printar e compartilhar.
 * Visual de ingresso, coerente com a marca.
 */
export function YearRecapCard({
  recap,
  years,
  onYearChange,
}: {
  recap: Recap
  years: string[]
  onYearChange: (year: string) => void
}) {
  const empty = recap.totalShows === 0

  return (
    <section className="relative overflow-hidden rounded-2xl border border-roxo/25 bg-surface">
      {/* Brilho de fundo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.18) 0%, transparent 70%)' }}
      />

      <div className="relative p-5 md:p-7">
        {/* Cabeçalho: canhoto + seletor de ano */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="inline-flex items-stretch rounded-md overflow-hidden shadow-lg">
            <div className="bg-roxo px-2.5 flex items-center">
              <span
                className="font-title text-papel text-[9px] tracking-[0.14em]"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                RETROSPECTIVA
              </span>
            </div>
            <div className="bg-papel ticket-perforation px-4 py-2.5 flex items-center">
              <span className="font-display text-[#100F0D] text-3xl md:text-4xl leading-none">
                {recap.year}
              </span>
            </div>
          </div>

          <select
            value={recap.year}
            onChange={(e) => onYearChange(e.target.value)}
            className="bg-surface-2 border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-papel focus:outline-none focus:border-roxo/50 transition-colors"
            aria-label="Escolher ano"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {empty ? (
          <p className="text-sm text-papel/45 py-6 text-center">
            Você não registrou shows em {recap.year}.
          </p>
        ) : (
          <>
            {/* Números principais */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Big value={String(recap.totalShows)} label={recap.totalShows === 1 ? 'show' : 'shows'} />
              <Big value={String(recap.totalArtists)} label="artistas" />
              <Big value={recap.totalSpent > 0 ? formatBRL(recap.totalSpent) : '—'} label="investido" />
              <Big value={recap.avgRating != null ? String(recap.avgRating) : '—'} label="nota média" />
            </div>

            {/* Destaques */}
            <div className="space-y-2.5">
              {recap.bestShow && (
                <Highlight
                  label="Melhor show do ano"
                  value={recap.bestShow.artist}
                  detail={`${recap.bestShow.venue} · nota ${recap.bestShow.rating}`}
                />
              )}
              {recap.topGenre && (
                <Highlight
                  label="Seu gênero"
                  value={recap.topGenre.label}
                  detail={`${recap.topGenre.count} ${recap.topGenre.count === 1 ? 'show' : 'shows'}`}
                />
              )}
              {recap.topFestival && (
                <Highlight
                  label="Festival que você mais curtiu"
                  value={recap.topFestival.label}
                  detail={`${recap.topFestival.count} ${recap.topFestival.count === 1 ? 'show' : 'shows'}`}
                />
              )}
              {recap.busiestMonth && (
                <Highlight
                  label="Mês mais movimentado"
                  value={capitalize(recap.busiestMonth.label)}
                  detail={`${recap.busiestMonth.count} ${recap.busiestMonth.count === 1 ? 'show' : 'shows'}`}
                />
              )}
              {recap.topCity && (
                <Highlight
                  label="Cidade"
                  value={recap.topCity.label}
                  detail={`${recap.topCity.count} ${recap.topCity.count === 1 ? 'show' : 'shows'}`}
                />
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function Big({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-bg/40 rounded-xl px-4 py-4">
      <div className="font-title text-3xl md:text-4xl text-roxo-luz leading-none">{value}</div>
      <div className="text-[11px] text-papel/40 mt-1.5">{label}</div>
    </div>
  )
}

function Highlight({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-bg/40 rounded-xl px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] text-papel/35">{label}</p>
        <p className="text-sm font-medium text-papel truncate mt-0.5">{value}</p>
      </div>
      <span className="text-xs text-roxo-luz shrink-0 text-right">{detail}</span>
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
