<template>
  <q-page class="page-analysis">

    <!-- Header -->
    <div class="an-title">{{ $t('analysis.title') }}</div>

    <!-- Period pills -->
    <div class="an-pills">
      <span
        v-for="opt in periodModeOptions"
        :key="opt.value"
        :class="['an-pill', { 'an-pill-on': periodMode === opt.value, 'an-pill-locked': opt.disable }]"
        @click="!opt.disable && selectPeriod(opt.value)"
      >
        <q-icon v-if="opt.disable" name="lock" size="10px" style="margin-right:2px" />
        {{ opt.label }}
      </span>
    </div>

    <!-- Period navigation -->
    <div v-if="periodMode !== 'all'" class="an-period-nav">
      <i class="ti ti-chevron-left an-chevron" @click="prevPeriod" />
      <span class="an-period-label">{{ periodLabel }}</span>
      <i
        class="ti ti-chevron-right an-chevron"
        :class="isCurrentPeriod ? 'an-chevron-disabled' : ''"
        @click="!isCurrentPeriod && nextPeriod()"
      />
    </div>

    <!-- Stat tiles -->
    <div class="an-stats">
      <div class="an-stat">
        <div class="an-stat-label">{{ $t('analysis.total_income') }}</div>
        <div class="an-stat-value an-positive">{{ formatCurrency(periodTotalIngresos) }}</div>
      </div>
      <div class="an-stat">
        <div class="an-stat-label">{{ $t('analysis.total_expenses') }}</div>
        <div class="an-stat-value an-negative">{{ formatCurrency(periodTotalGastos) }}</div>
      </div>
    </div>

    <!-- Bar chart: Income vs Expenses -->
    <div class="an-chart-wrap">
      <apexchart
        type="bar"
        :options="flowBarOptions"
        :series="flowBarSeries"
        height="140"
      />
    </div>

    <div class="an-divider" />

    <!-- Category breakdown -->
    <div v-if="gastosPorCategoria.length">
      <div
        v-for="item in gastosPorCategoria"
        :key="item.category"
        class="an-cat-row"
      >
        <div class="an-cat-left">
          <span class="an-cat-dot" :style="{ background: item.color }" />
          <span class="an-cat-name">{{ item.category }}</span>
        </div>
        <div class="an-cat-bar-wrap">
          <div class="an-cat-bar-bg">
            <div
              class="an-cat-bar-fill"
              :style="{ width: (item.ratio * 100) + '%', background: item.color, opacity: 0.5 }"
            />
          </div>
        </div>
        <span class="an-cat-amount">{{ formatCurrency(item.amount) }}</span>
      </div>
    </div>
    <div v-else class="an-empty">{{ $t('analysis.no_expenses') }}</div>

    <!-- Budget section -->
    <div v-if="topExpenses.some(i => i.budget)" class="an-budget-section">
      <div class="an-divider" style="margin-top:16px" />
      <div class="an-subtitle">{{ $t('analysis.budget_title') }}</div>
      <div v-for="item in topExpenses.filter(i => i.budget)" :key="item.category + '-b'" class="an-budget-row">
        <div class="row justify-between items-center q-mb-xs">
          <span class="an-cat-name">{{ item.category }}</span>
          <div>
            <span class="an-cat-amount" :class="item.overBudget ? 'an-negative' : ''">{{ formatCurrency(item.amount) }}</span>
            <span class="an-cat-limit"> / {{ formatCurrency(item.budget) }}</span>
          </div>
        </div>
        <q-linear-progress
          :value="item.ratio"
          size="4px"
          rounded
          :style="{ '--bar-color': item.barColor }"
          class="budget-bar"
        />
        <div class="an-budget-note" :class="item.overBudget ? 'an-negative' : 'an-muted'">
          {{ item.overBudget
            ? $t('analysis.exceeded_by', { amount: formatCurrency(item.amount - item.budget) })
            : $t('analysis.remaining', { amount: formatCurrency(item.budget - item.amount) }) }}
        </div>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import VueApexCharts from 'vue3-apexcharts'
import { useTransactionsStore } from 'src/stores/transactions.store'
import { useSettingsStore } from 'src/stores/settings.store'
import { useCurrency } from 'src/composables/useCurrency'
import { usePlan } from 'src/composables/usePlan'

const apexchart = VueApexCharts
const { t, locale } = useI18n()
const $q = useQuasar()
const { formatCurrency } = useCurrency()

const transactionsStore = useTransactionsStore()
const settingsStore     = useSettingsStore()
const { canUseAdvancedAnalysis } = usePlan()

// ── Period selector ───────────────────────────────────────────────────────────

const periodMode = ref('month')
const cursor     = ref(new Date())

const periodModeOptions = computed(() => [
  { label: t('analysis.period_month'),   value: 'month'   },
  { label: t('analysis.period_quarter'), value: 'quarter', disable: !canUseAdvancedAnalysis.value },
  { label: t('analysis.period_year'),    value: 'year',    disable: !canUseAdvancedAnalysis.value },
  { label: t('analysis.period_all'),     value: 'all',     disable: !canUseAdvancedAnalysis.value },
])

function selectPeriod(val) {
  periodMode.value = val
  resetToCurrentPeriod()
}

function resetToCurrentPeriod() { cursor.value = new Date() }

function prevPeriod() {
  const d = new Date(cursor.value)
  if (periodMode.value === 'month')   d.setMonth(d.getMonth() - 1)
  if (periodMode.value === 'quarter') d.setMonth(d.getMonth() - 3)
  if (periodMode.value === 'year')    d.setFullYear(d.getFullYear() - 1)
  cursor.value = d
}

function nextPeriod() {
  const d = new Date(cursor.value)
  if (periodMode.value === 'month')   d.setMonth(d.getMonth() + 1)
  if (periodMode.value === 'quarter') d.setMonth(d.getMonth() + 3)
  if (periodMode.value === 'year')    d.setFullYear(d.getFullYear() + 1)
  cursor.value = d
}

const isCurrentPeriod = computed(() => {
  const now = new Date()
  const c   = cursor.value
  if (periodMode.value === 'month')   return c.getFullYear() === now.getFullYear() && c.getMonth() === now.getMonth()
  if (periodMode.value === 'quarter') return c.getFullYear() === now.getFullYear() && Math.floor(c.getMonth() / 3) === Math.floor(now.getMonth() / 3)
  if (periodMode.value === 'year')    return c.getFullYear() === now.getFullYear()
  return true
})

const periodBounds = computed(() => {
  const c   = cursor.value
  const y   = c.getFullYear()
  const m   = c.getMonth()
  const now = new Date()
  const cap = (d) => isCurrentPeriod.value && d > now ? now : d

  if (periodMode.value === 'month')   return { from: new Date(y, m, 1),      to: cap(new Date(y, m + 1, 0)) }
  if (periodMode.value === 'quarter') {
    const q = Math.floor(m / 3)
    return { from: new Date(y, q * 3, 1), to: cap(new Date(y, q * 3 + 3, 0)) }
  }
  if (periodMode.value === 'year')    return { from: new Date(y, 0, 1),      to: cap(new Date(y, 11, 31)) }
  return null
})

const periodLabel = computed(() => {
  if (periodMode.value === 'all') return t('analysis.period_all')
  const c    = cursor.value
  const lang = locale.value === 'en-US' ? 'en-US' : 'es-MX'
  if (periodMode.value === 'month')   return c.toLocaleDateString(lang, { month: 'long', year: 'numeric' }).replace(/^\w/, ch => ch.toUpperCase())
  if (periodMode.value === 'quarter') return `Q${Math.floor(c.getMonth() / 3) + 1} ${c.getFullYear()}`
  if (periodMode.value === 'year')    return String(c.getFullYear())
  return ''
})

// ── Period transactions ───────────────────────────────────────────────────────

const periodTransactions = computed(() => {
  if (!periodBounds.value) return transactionsStore.transactions
  const fromStr = periodBounds.value.from.toISOString().split('T')[0]
  const toStr   = periodBounds.value.to.toISOString().split('T')[0]
  return transactionsStore.transactions.filter(t => t.date >= fromStr && t.date <= toStr)
})

const periodTotalIngresos = computed(() =>
  periodTransactions.value.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
)
const periodTotalGastos = computed(() =>
  periodTransactions.value.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)
)

// ── Charts ────────────────────────────────────────────────────────────────────

const flowBarSeries = computed(() => [{
  name: t('analysis.income_label'),
  data: [periodTotalIngresos.value, periodTotalGastos.value],
}])

const flowBarOptions = computed(() => ({
  chart:    { toolbar: { show: false }, fontFamily: 'inherit', foreColor: '#888780', sparkline: { enabled: false } },
  colors:   ['#3B6D11', '#A32D2D'],
  plotOptions: { bar: { distributed: true, borderRadius: 4, columnWidth: '40%' } },
  xaxis:    { categories: [t('analysis.income_label'), t('analysis.expenses_label')], labels: { style: { fontSize: '11px' } } },
  yaxis:    { labels: { formatter: (v) => `$${(v / 1000).toFixed(0)}k`, style: { fontSize: '10px' } } },
  grid:     { borderColor: '#F1EFE8', strokeDashArray: 4 },
  legend:   { show: false },
  dataLabels: { enabled: false },
  tooltip:  { theme: $q.dark.isActive ? 'dark' : 'light', y: { formatter: (v) => formatCurrency(v) } },
}))

// ── Category data ─────────────────────────────────────────────────────────────

const gastosPorCategoria = computed(() => {
  const map = {}
  periodTransactions.value
    .filter(t => t.type === 'gasto')
    .forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount })
  const total = Object.values(map).reduce((s, v) => s + v, 0)
  return Object.entries(map)
    .map(([category, amount]) => {
      const cat = settingsStore.categories.find(c => c.name === category)
      return { category, amount, color: cat?.color ?? '#64748b', ratio: total ? amount / total : 0 }
    })
    .sort((a, b) => b.amount - a.amount)
})

const topExpenses = computed(() => {
  const maxAmount = Math.max(...gastosPorCategoria.value.map(g => g.amount), 1)
  return gastosPorCategoria.value.map(item => {
    const cat        = settingsStore.categories.find(c => c.name === item.category)
    const budget     = cat?.budget ?? null
    const overBudget = budget !== null && item.amount > budget
    const pct        = budget !== null ? Math.min(item.amount / budget, 1) : item.amount / maxAmount
    let barColor = item.color
    if (budget !== null) {
      if (overBudget)     barColor = '#A32D2D'
      else if (pct >= 0.8) barColor = '#f59e0b'
      else                 barColor = '#3B6D11'
    }
    return { ...item, budget, overBudget, ratio: pct, barColor }
  })
})
</script>

<style scoped lang="scss">
.page-analysis {
  padding: 20px 20px 24px;
  background: #fff;
}

.an-title {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a18;
  margin-bottom: 12px;
}

.an-pills {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.an-pill {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  border: 0.5px solid #E8E6E0;
  color: #888780;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
}
.an-pill-on { background: #1a1a18; color: #fff; border-color: #1a1a18; }
.an-pill-locked { opacity: 0.4; cursor: default; }

.an-period-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.an-chevron { font-size: 16px; color: #C8C6BE; cursor: pointer; }
.an-chevron-disabled { opacity: 0.3; cursor: default; }
.an-period-label { font-size: 13px; font-weight: 500; color: #1a1a18; text-transform: capitalize; }

.an-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.an-stat {
  flex: 1;
  background: #F8F7F4;
  border-radius: 10px;
  padding: 10px;
}
.an-stat-label { font-size: 11px; color: #C8C6BE; margin-bottom: 4px; }
.an-stat-value { font-size: 16px; font-weight: 500; color: #1a1a18; letter-spacing: -0.5px; }
.an-positive { color: #3B6D11; }
.an-negative { color: #A32D2D; }

.an-chart-wrap { margin-bottom: 4px; }

.an-divider { height: 0.5px; background: #F1EFE8; margin-bottom: 12px; }
.an-subtitle { font-size: 13px; font-weight: 500; color: #1a1a18; margin-bottom: 10px; }

.an-cat-row {
  display: flex;
  align-items: center;
  padding: 5px 0;
  border-bottom: 0.5px solid #F1EFE8;
}
.an-cat-row:last-child { border-bottom: none; }

.an-cat-left { display: flex; align-items: center; width: 100px; flex-shrink: 0; }
.an-cat-dot { width: 7px; height: 7px; border-radius: 50%; margin-right: 5px; flex-shrink: 0; }
.an-cat-name { font-size: 12px; color: #1a1a18; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.an-cat-bar-wrap { flex: 1; margin: 0 8px; }
.an-cat-bar-bg { height: 2px; background: #F1EFE8; border-radius: 2px; }
.an-cat-bar-fill { height: 2px; border-radius: 2px; }

.an-cat-amount { font-size: 12px; color: #888780; flex-shrink: 0; }
.an-cat-limit  { font-size: 11px; color: #C8C6BE; }

.an-budget-section { }
.an-budget-row { margin-bottom: 10px; }
.an-budget-note { font-size: 11px; margin-top: 3px; }
.an-muted { color: #C8C6BE; }

.an-empty { text-align: center; font-size: 13px; color: #C8C6BE; padding: 32px 0; }

.budget-bar :deep(.q-linear-progress__track) { background: #F1EFE8; opacity: 1; }
.budget-bar :deep(.q-linear-progress__model) { background: var(--bar-color); }
</style>
