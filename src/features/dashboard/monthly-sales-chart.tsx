'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BarChart3,
  PackageMinus,
  Table as TableIcon,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ModernSelect } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatCompactRupiah, formatNumberId, formatRupiah } from '@/src/lib/format'
import type { MonthlySalesPoint, MonthlySalesSummary } from '@/src/lib/validation/reports'

type MetricType = 'revenue' | 'units' | 'profit'
type ViewMode = 'chart' | 'table'

export function MonthlySalesChart({
  salesSummary,
  categories,
}: {
  salesSummary: MonthlySalesSummary
  categories: Array<{ id: string; name: string }>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [metric, setMetric] = useState<MetricType>('revenue')
  const [viewMode, setViewMode] = useState<ViewMode>('chart')
  const [hoveredMonth, setHoveredMonth] = useState<MonthlySalesPoint | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<MonthlySalesPoint | null>(null)

  const { year, availableYears, categoryId, reason, monthlyData, annualSummary } = salesSummary

  function handleFilterChange(updates: {
    salesYear?: number
    salesCategory?: string
    salesReason?: string
  }) {
    const params = new URLSearchParams(searchParams.toString())

    if (updates.salesYear !== undefined) {
      params.set('salesYear', String(updates.salesYear))
    }
    if (updates.salesCategory !== undefined) {
      if (updates.salesCategory) {
        params.set('salesCategory', updates.salesCategory)
      } else {
        params.delete('salesCategory')
      }
    }
    if (updates.salesReason !== undefined) {
      if (updates.salesReason === 'ALL_OUT') {
        params.set('salesReason', 'ALL_OUT')
      } else {
        params.delete('salesReason')
      }
    }

    const qs = params.toString()
    router.push(qs ? `/dashboard?${qs}` : '/dashboard', { scroll: false })
  }

  // Determine max value for chart scale based on selected metric
  const metricValues = monthlyData.map((d) => {
    if (metric === 'revenue') return d.revenue
    if (metric === 'units') return d.units
    return Math.max(0, d.profit)
  })

  const rawMax = Math.max(...metricValues, 0)
  // Give 15% headroom above highest bar
  const chartMax = rawMax > 0 ? (metric === 'units' ? Math.ceil(rawMax * 1.15) : rawMax * 1.15) : 100

  // 4 Y-axis ticks
  const yTicks = [
    chartMax,
    chartMax * 0.75,
    chartMax * 0.5,
    chartMax * 0.25,
    0,
  ]

  function formatTickLabel(val: number): string {
    if (metric === 'units') return formatNumberId(Math.round(val))
    return formatCompactRupiah(val)
  }

  // Active tooltip target: either hovered or selected month
  const activeDetail = hoveredMonth || selectedMonth || (annualSummary.peakMonth ? monthlyData[annualSummary.peakMonth.month - 1] : null)

  // SVG dimensions
  const svgWidth = 720
  const svgHeight = 220
  const paddingLeft = 65
  const paddingRight = 20
  const paddingTop = 25
  const paddingBottom = 35

  const plotWidth = svgWidth - paddingLeft - paddingRight
  const plotHeight = svgHeight - paddingTop - paddingBottom
  const barSlotWidth = plotWidth / 12
  const barWidth = Math.min(32, barSlotWidth * 0.65)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border bg-card px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Grafik Penjualan Bulanan ({year})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pantau tren nominal penjualan, laba kotor, dan volume pengeluaran barang per bulan.
                </p>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tahun */}
            <div className="w-28">
              <ModernSelect
                ariaLabel="Pilih tahun penjualan"
                value={String(year)}
                onValueChange={(val) => handleFilterChange({ salesYear: Number(val) })}
                options={availableYears.map((y) => ({
                  value: String(y),
                  label: `Tahun ${y}`,
                }))}
                className="w-full text-xs"
              />
            </div>

            {/* Filter Kategori */}
            <div className="w-40 sm:w-44">
              <ModernSelect
                ariaLabel="Filter kategori penjualan"
                value={categoryId ?? ''}
                onValueChange={(val) => handleFilterChange({ salesCategory: val })}
                options={[
                  { value: '', label: 'Semua Kategori' },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
                className="w-full text-xs"
              />
            </div>

            {/* Filter Sumber Data */}
            <div className="w-44">
              <ModernSelect
                ariaLabel="Filter jenis stok keluar"
                value={reason}
                onValueChange={(val) => handleFilterChange({ salesReason: val })}
                options={[
                  { value: 'SALE', label: 'Hanya Penjualan (SALE)' },
                  { value: 'ALL_OUT', label: 'Semua Stok Keluar' },
                ]}
                className="w-full text-xs"
              />
            </div>

            {/* Toggle Tampilan Chart vs Tabel */}
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('chart')}
                aria-pressed={viewMode === 'chart'}
                title="Tampilan grafik"
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                  viewMode === 'chart'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <BarChart3 className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Grafik</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-pressed={viewMode === 'table'}
                title="Tampilan tabel"
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                  viewMode === 'table'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <TableIcon className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="inline-flex rounded-lg border border-border bg-background p-1 text-xs">
            <button
              type="button"
              onClick={() => setMetric('revenue')}
              aria-pressed={metric === 'revenue'}
              className={cn(
                'rounded-md px-3 py-1 font-medium transition-colors',
                metric === 'revenue'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Nominal Penjualan (Rp)
            </button>
            <button
              type="button"
              onClick={() => setMetric('units')}
              aria-pressed={metric === 'units'}
              className={cn(
                'rounded-md px-3 py-1 font-medium transition-colors',
                metric === 'units'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Volume Barang (Unit)
            </button>
            <button
              type="button"
              onClick={() => setMetric('profit')}
              aria-pressed={metric === 'profit'}
              className={cn(
                'rounded-md px-3 py-1 font-medium transition-colors',
                metric === 'profit'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Estimasi Laba Kotor
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-xs bg-primary" />
              <span>
                {metric === 'revenue'
                  ? 'Total Penjualan'
                  : metric === 'units'
                    ? 'Unit Terjual'
                    : 'Laba Kotor'}
              </span>
            </div>
            {annualSummary.peakMonth ? (
              <div className="hidden sm:flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-3.5" aria-hidden="true" />
                <span>Puncak: {annualSummary.peakMonth.fullMonthLabel}</span>
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {/* KPI Summary Cards */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-muted/20 p-3.5">
            <p className="text-xs font-medium text-muted-foreground">Total Penjualan ({year})</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {formatRupiah(annualSummary.totalRevenue)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatNumberId(annualSummary.totalTransactions)} transaksi dicatat
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-3.5">
            <p className="text-xs font-medium text-muted-foreground">Total Unit Terjual</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {formatNumberId(annualSummary.totalUnits)} unit
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Rata-rata: {formatNumberId(Math.round(annualSummary.totalUnits / 12))} unit/bln
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-3.5">
            <p className="text-xs font-medium text-muted-foreground">Rata-rata Penjualan / Bln</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {formatRupiah(annualSummary.averageMonthlyRevenue)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Basis 12 bulan kalender</p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 dark:border-emerald-400/20">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              Bulan Penjualan Tertinggi
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-emerald-700 dark:text-emerald-400 sm:text-xl">
              {annualSummary.peakMonth ? annualSummary.peakMonth.fullMonthLabel : '—'}
            </p>
            <p className="mt-0.5 text-xs text-emerald-600/80 dark:text-emerald-400/80">
              {annualSummary.peakMonth
                ? `${formatRupiah(annualSummary.peakMonth.revenue)} (${formatNumberId(annualSummary.peakMonth.units)} unit)`
                : 'Belum ada transaksi'}
            </p>
          </div>
        </div>

        {/* View Mode: SVG Chart */}
        {viewMode === 'chart' ? (
          <div>
            <div className="relative overflow-x-auto rounded-xl border border-border bg-background p-3">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full min-w-[580px] select-none overflow-visible"
              >
                {/* Horizontal Gridlines & Y-Axis Labels */}
                {yTicks.map((val, idx) => {
                  const y = paddingTop + (plotHeight * idx) / (yTicks.length - 1)
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={svgWidth - paddingRight}
                        y2={y}
                        stroke="currentColor"
                        className="text-border/60"
                        strokeDasharray={idx === yTicks.length - 1 ? undefined : '3 3'}
                        strokeWidth="1"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        className="fill-muted-foreground font-mono text-[10px]"
                      >
                        {formatTickLabel(val)}
                      </text>
                    </g>
                  )
                })}

                {/* Bars & Interactive Columns */}
                {monthlyData.map((d, i) => {
                  const currentVal =
                    metric === 'revenue'
                      ? d.revenue
                      : metric === 'units'
                        ? d.units
                        : Math.max(0, d.profit)

                  const barHeight = chartMax > 0 ? (currentVal / chartMax) * plotHeight : 0
                  const x = paddingLeft + i * barSlotWidth + (barSlotWidth - barWidth) / 2
                  const y = paddingTop + plotHeight - barHeight

                  const isHovered = hoveredMonth?.month === d.month
                  const isSelected = selectedMonth?.month === d.month
                  const isPeak = annualSummary.peakMonth?.month === d.month

                  return (
                    <g
                      key={d.month}
                      className="cursor-pointer transition-all focus:outline-none"
                      onMouseEnter={() => setHoveredMonth(d)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      onClick={() =>
                        setSelectedMonth((prev) => (prev?.month === d.month ? null : d))
                      }
                      tabIndex={0}
                      role="button"
                      aria-label={`${d.fullMonthLabel}: ${formatRupiah(d.revenue)}, ${d.units} unit`}
                    >
                      {/* Transparent Hover Hit Area */}
                      <rect
                        x={paddingLeft + i * barSlotWidth}
                        y={paddingTop}
                        width={barSlotWidth}
                        height={plotHeight}
                        fill="transparent"
                      />

                      {/* Active column background highlight */}
                      {isHovered || isSelected ? (
                        <rect
                          x={paddingLeft + i * barSlotWidth + 2}
                          y={paddingTop}
                          width={barSlotWidth - 4}
                          height={plotHeight}
                          className="fill-muted/40"
                          rx="4"
                        />
                      ) : null}

                      {/* Bar */}
                      <rect
                        x={x}
                        y={barHeight > 0 ? y : paddingTop + plotHeight - 2}
                        width={barWidth}
                        height={barHeight > 0 ? barHeight : 2}
                        rx="4"
                        ry="4"
                        className={cn(
                          'transition-all duration-200',
                          barHeight === 0
                            ? 'fill-muted-foreground/30'
                            : isPeak
                              ? 'fill-primary hover:opacity-90'
                              : 'fill-primary/80 hover:fill-primary',
                          isSelected && 'stroke-primary stroke-2 ring-2 ring-primary/20',
                        )}
                      />

                      {/* Top indicator dot on peak month */}
                      {isPeak && barHeight > 0 ? (
                        <circle
                          cx={x + barWidth / 2}
                          cy={y - 6}
                          r="3"
                          className="fill-emerald-500 animate-pulse"
                        />
                      ) : null}

                      {/* Month Label on X-axis */}
                      <text
                        x={x + barWidth / 2}
                        y={svgHeight - 12}
                        textAnchor="middle"
                        className={cn(
                          'text-[11px] font-medium transition-colors',
                          isHovered || isSelected
                            ? 'fill-foreground font-semibold'
                            : 'fill-muted-foreground',
                        )}
                      >
                        {d.monthLabel}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Interactive Details Card for active/hovered month */}
            {activeDetail ? (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-primary/25 dark:bg-primary/10">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-xs">
                    {activeDetail.monthLabel}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-foreground">
                        {activeDetail.fullMonthLabel} {year}
                      </p>
                      {annualSummary.peakMonth?.month === activeDetail.month ? (
                        <Badge variant="success" className="text-[10px] py-0 px-1.5">
                          Bulan Tertinggi
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Kontribusi:{' '}
                      <span className="font-medium text-foreground">
                        {annualSummary.totalRevenue > 0
                          ? `${((activeDetail.revenue / annualSummary.totalRevenue) * 100).toFixed(1)}%`
                          : '0%'}
                      </span>{' '}
                      dari total omset tahun {year}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs sm:gap-6">
                  <div>
                    <span className="text-muted-foreground">Total Penjualan:</span>
                    <p className="font-semibold text-sm text-foreground">
                      {formatRupiah(activeDetail.revenue)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unit Terjual:</span>
                    <p className="font-semibold text-sm text-foreground">
                      {formatNumberId(activeDetail.units)} pcs
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estimasi Laba:</span>
                    <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">
                      {formatRupiah(activeDetail.profit)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Transaksi:</span>
                    <p className="font-semibold text-sm text-foreground">
                      {formatNumberId(activeDetail.transactionCount)}x
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* View Mode: Data Table */
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Bulan</TableHead>
                  <TableHead className="text-right">Total Penjualan (Rp)</TableHead>
                  <TableHead className="text-right">Unit Terjual</TableHead>
                  <TableHead className="text-right">Estimasi Laba</TableHead>
                  <TableHead className="text-right">Transaksi</TableHead>
                  <TableHead className="text-right">Kontribusi (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((m) => {
                  const contribution =
                    annualSummary.totalRevenue > 0
                      ? ((m.revenue / annualSummary.totalRevenue) * 100).toFixed(1)
                      : '0.0'
                  const isPeak = annualSummary.peakMonth?.month === m.month

                  return (
                    <TableRow key={m.month}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {m.month.toString().padStart(2, '0')}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{m.fullMonthLabel}</span>
                          {isPeak ? (
                            <Badge variant="success" className="text-[10px] py-0 px-1.5">
                              Puncak
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        {formatRupiah(m.revenue)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {formatNumberId(m.units)} unit
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(m.profit)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {formatNumberId(m.transactionCount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {contribution}%
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Empty state alert when zero sales in the year */}
        {annualSummary.totalRevenue === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center sm:px-6">
            <PackageMinus className="size-8 text-muted-foreground/60" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-foreground">
              Belum ada penjualan tercatat di tahun {year}
            </p>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              {categoryId
                ? 'Tidak ada transaksi penjualan untuk kategori yang dipilih. Coba pilih "Semua Kategori" atau catat penjualan baru.'
                : 'Catat transaksi stok keluar dengan alasan "Penjualan" agar grafik omset otomatis terisi.'}
            </p>
            <Link
              href="/inventory/stock-out"
              className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <PackageMinus className="size-3.5" aria-hidden="true" />
              Catat Penjualan (Stok Keluar)
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
