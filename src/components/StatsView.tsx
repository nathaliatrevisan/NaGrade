'use client'

import { useMemo, useState } from 'react'
import type { ShowItemData } from './ShowItem'
import { BarChart, DonutChart, HorizontalBars, ChartCard } from './charts/Charts'
import { YearRecapCard } from './YearRecap'
import {
  showsByYear, spendByYear, genreDistribution, ratingDistribution,
  festivalStats, priceByTicketType, yearRecap, availableYears, formatBRL,
  type FestivalRecord,
} from '@/lib/stats'

export function StatsView({
  shows,
  festivals: festivalRecords,
}: {
  shows: ShowItemData[]
  festivals: FestivalRecord[]
}) {
  const years = useMemo(() => availableYears(shows), [shows])
  const [selectedYear, setSelectedYear] = useState(years[0] ?? String(new Date().getFullYear()))

  const byYear = useMemo(() => showsByYear(shows), [shows])
  const spend = useMemo(() => spendByYear(shows, festivalRecords), [shows, festivalRecords])
  const genres = useMemo(() => genreDistribution(shows), [shows])
  const ratings = useMemo(() => ratingDistribution(shows), [shows])
  const festivals = useMemo(() => festivalStats(shows, festivalRecords), [shows, festivalRecords])
  const prices = useMemo(() => priceByTicketType(shows), [shows])
  const recap = useMemo(
    () => yearRecap(shows, selectedYear, festivalRecords),
    [shows, selectedYear, festivalRecords]
  )

  const ratedCount = ratings.reduce((sum, r) => sum + r.value, 0)

  return (
    <div className="space-y-4 md:space-y-5">

      {/* Retrospectiva */}
      <YearRecapCard recap={recap} years={years} onYearChange={setSelectedYear} />

      {/* Shows por ano */}
      <ChartCard title="Shows por ano" subtitle="Sua linha do tempo — passe o mouse ou toque para detalhes">
        <BarChart data={byYear} unit="shows" showPercent />
      </ChartCard>

      {/* Gênero */}
      {genres.length > 0 && (
        <ChartCard title="Por gênero musical" subtitle="Onde seu gosto se concentra">
          <DonutChart data={genres} unit="shows" />
        </ChartCard>
      )}

      {/* Notas */}
      {ratedCount > 0 && (
        <ChartCard
          title="Suas notas"
          subtitle={`Como você avalia — ${ratedCount} ${ratedCount === 1 ? 'show avaliado' : 'shows avaliados'}`}
        >
          <BarChart data={ratings} unit="shows com essa nota" showPercent />
        </ChartCard>
      )}

      {/* Gasto por ano */}
      {spend.length > 0 && (
        <ChartCard title="Gasto por ano" subtitle="Quanto você investiu em música ao vivo">
          <BarChart
            data={spend}
            formatValue={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            unit="reais"
            showPercent
          />
        </ChartCard>
      )}

      {/* Festivais */}
      {festivals.length > 0 && (
        <ChartCard title="Por festival" subtitle="Quanto rendeu cada ingresso de festival">
          <HorizontalBars
            data={festivals.map((f) => ({
              label: f.name,
              value: f.count,
              hint: [
                f.spend > 0 ? formatBRL(f.spend) : null,
                f.costPerShow != null ? `${formatBRL(f.costPerShow)} por show` : null,
                f.avgRating != null ? `nota ${f.avgRating}` : null,
              ].filter(Boolean).join(' · '),
            }))}
            formatValue={(v) => `${v} ${v === 1 ? 'show' : 'shows'}`}
            caption={(item) => item.hint ?? ''}
          />
        </ChartCard>
      )}

      {/* Preço por tipo de ingresso */}
      {prices.length > 0 && (
        <ChartCard title="Preço médio por tipo de ingresso" subtitle="Quanto costuma custar cada setor">
          <HorizontalBars
            data={prices.map((p) => ({
              label: p.label,
              value: p.avg,
              hint: `${p.count} ${p.count === 1 ? 'compra' : 'compras'}`,
            }))}
            formatValue={(v) => formatBRL(v)}
            caption={(item) => item.hint ?? ''}
          />
        </ChartCard>
      )}
    </div>
  )
}
