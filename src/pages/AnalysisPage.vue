<template>
  <q-page class="q-pa-lg">

    <!-- Header -->
    <div class="text-h4 text-weight-bold q-mb-xs">{{ $t('analysis.title') }}</div>
    <div class="text-body2 text-grey-6 q-mb-lg">{{ $t('analysis.subtitle') }}</div>

    <!-- Selector de período -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section class="q-py-sm">
        <div class="row items-center justify-between">

          <!-- Modos -->
          <q-btn-toggle
            v-model="periodMode"
            :options="periodModeOptions"
            unelevated
            toggle-color="dark"
            color="white"
            text-color="grey-7"
            no-caps
            dense
            class="period-toggle"
            @update:model-value="resetToCurrentPeriod"
          />

          <!-- Navegación -->
          <div class="row items-center q-gutter-sm">
            <q-btn
              flat
              round
              dense
              icon="chevron_left"
              color="grey-7"
              :disable="periodMode === 'all'"
              @click="prevPeriod"
            />
            <div class="period-label text-weight-bold">{{ periodLabel }}</div>
            <q-btn
              flat
              round
              dense
              icon="chevron_right"
              color="grey-7"
              :disable="periodMode === 'all' || isCurrentPeriod"
              @click="nextPeriod"
            />
          </div>

        </div>
      </q-card-section>
    </q-card>

    <!-- Summary cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-card flat bordered class="analysis-card">
          <q-card-section>
            <div class="text-body2 text-weight-bold q-mb-md">{{ $t('analysis.total_income') }}</div>
            <div class="text-h4 text-weight-bold text-positive">
              {{ formatCurrency(periodTotalIngresos) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card flat bordered class="analysis-card">
          <q-card-section>
            <div class="text-body2 text-weight-bold q-mb-md">{{ $t('analysis.total_expenses') }}</div>
            <div class="text-h4 text-weight-bold text-negative">
              {{ formatCurrency(periodTotalGastos) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card flat bordered class="analysis-card">
          <q-card-section>
            <div class="text-body2 text-weight-bold q-mb-md">{{ $t('analysis.net_balance') }}</div>
            <div
              class="text-h4 text-weight-bold"
              :class="periodBalance >= 0 ? 'text-positive' : 'text-negative'"
            >
              {{ formatCurrency(periodBalance) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Charts row 1 -->
    <div class="row q-col-gutter-lg q-mb-lg">

      <!-- Pie: Gastos por Categoría -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="analysis-card">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">{{ $t('analysis.expenses_by_category') }}</div>
            <div class="text-caption text-grey-6 q-mb-sm">{{ $t('analysis.expenses_distribution') }}</div>
            <apexchart
              v-if="pieSeries.length"
              type="pie"
              :options="pieOptions"
              :series="pieSeries"
              height="300"
            />
            <div v-else class="empty-chart text-grey-5 text-body2">{{ $t('analysis.no_expenses') }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Bar: Ingresos vs Gastos -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="analysis-card">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">{{ $t('analysis.income_vs_expenses') }}</div>
            <div class="text-caption text-grey-6 q-mb-sm">{{ $t('analysis.flow_comparison') }}</div>
            <apexchart
              type="bar"
              :options="flowBarOptions"
              :series="flowBarSeries"
              height="300"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Charts row 2 -->
    <div class="row q-col-gutter-lg">

      <!-- Bar: Gastos por Cuenta -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="analysis-card">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">{{ $t('analysis.expenses_by_account') }}</div>
            <div class="text-caption text-grey-6 q-mb-sm">{{ $t('analysis.account_distribution') }}</div>
            <apexchart
              v-if="accountBarSeries[0].data.length"
              type="bar"
              :options="accountBarOptions"
              :series="accountBarSeries"
              height="300"
            />
            <div v-else class="empty-chart text-grey-5 text-body2">{{ $t('analysis.no_expenses') }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Progress bars: Presupuesto por Categoría -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="analysis-card">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">{{ $t('analysis.budget_title') }}</div>
            <div class="text-caption text-grey-6 q-mb-md">{{ $t('analysis.budget_subtitle') }}</div>
            <div v-if="topExpenses.length" class="column q-gutter-md">
              <div v-for="item in topExpenses" :key="item.category">
                <div class="row justify-between items-center q-mb-xs">
                  <div class="row items-center q-gutter-xs">
                    <span class="text-body2 text-weight-medium">{{ item.category }}</span>
                    <q-chip
                      v-if="item.budget && item.overBudget"
                      dense
                      size="xs"
                      color="red-1"
                      text-color="red-9"
                      class="q-ma-none"
                    >
                      {{ $t('analysis.over_budget') }}
                    </q-chip>
                  </div>
                  <div class="text-right">
                    <span class="text-body2 text-weight-bold" :class="item.budget && item.overBudget ? 'text-negative' : ''">
                      {{ formatCurrency(item.amount) }}
                    </span>
                    <span v-if="item.budget" class="text-caption text-grey-5">
                      / {{ formatCurrency(item.budget) }}
                    </span>
                  </div>
                </div>
                <q-linear-progress
                  :value="item.ratio"
                  size="8px"
                  rounded
                  class="progress-bar"
                  :style="{ '--bar-color': item.barColor }"
                />
                <div v-if="item.budget" class="text-caption q-mt-xs" :class="item.overBudget ? 'text-negative' : 'text-grey-5'">
                  {{ item.overBudget
                    ? $t('analysis.exceeded_by', { amount: formatCurrency(item.amount - item.budget) })
                    : $t('analysis.remaining', { amount: formatCurrency(item.budget - item.amount) })
                  }}
                </div>
              </div>
            </div>
            <div v-else class="empty-chart text-grey-5 text-body2">{{ $t('analysis.no_expenses') }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import VueApexCharts from 'vue3-apexcharts'
import { useTransactionsStore } from 'src/stores/transactions.store'
import { useAccountsStore } from 'src/stores/accounts.store'
import { useSettingsStore } from 'src/stores/settings.store'
import { useCurrency } from 'src/composables/useCurrency'

const apexchart = VueApexCharts
const { t, locale } = useI18n()
const { formatCurrency } = useCurrency()

const transactionsStore = useTransactionsStore()
const accountsStore = useAccountsStore()
const settingsStore = useSettingsStore()

// ── Selector de período ───────────────────────────────────────────────────────

const periodMode = ref('month')
const cursor = ref(new Date())

const periodModeOptions = computed(() => [
  { label: t('analysis.period_month'),   value: 'month' },
  { label: t('analysis.period_quarter'), value: 'quarter' },
  { label: t('analysis.period_year'),    value: 'year' },
  { label: t('analysis.period_all'),     value: 'all' },
])

function resetToCurrentPeriod() {
  cursor.value = new Date()
}

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
  const c = cursor.value
  if (periodMode.value === 'month')   return c.getFullYear() === now.getFullYear() && c.getMonth() === now.getMonth()
  if (periodMode.value === 'quarter') return c.getFullYear() === now.getFullYear() && Math.floor(c.getMonth() / 3) === Math.floor(now.getMonth() / 3)
  if (periodMode.value === 'year')    return c.getFullYear() === now.getFullYear()
  return true
})

const periodBounds = computed(() => {
  const c = cursor.value
  const y = c.getFullYear()
  const m = c.getMonth()

  if (periodMode.value === 'month') {
    return {
      from: new Date(y, m, 1),
      to:   new Date(y, m + 1, 0),
    }
  }
  if (periodMode.value === 'quarter') {
    const q = Math.floor(m / 3)
    return {
      from: new Date(y, q * 3, 1),
      to:   new Date(y, q * 3 + 3, 0),
    }
  }
  if (periodMode.value === 'year') {
    return {
      from: new Date(y, 0, 1),
      to:   new Date(y, 11, 31),
    }
  }
  return null
})

const periodLabel = computed(() => {
  if (periodMode.value === 'all') return t('analysis.period_all')

  const c = cursor.value
  const lang = locale.value === 'en-US' ? 'en-US' : 'es-MX'

  if (periodMode.value === 'month') {
    return c.toLocaleDateString(lang, { month: 'long', year: 'numeric' })
      .replace(/^\w/, ch => ch.toUpperCase())
  }
  if (periodMode.value === 'quarter') {
    const q = Math.floor(c.getMonth() / 3) + 1
    return `Q${q} ${c.getFullYear()}`
  }
  if (periodMode.value === 'year') {
    return String(c.getFullYear())
  }
  return ''
})

// ── Transacciones del período ─────────────────────────────────────────────────

const periodTransactions = computed(() => {
  if (!periodBounds.value) return transactionsStore.transactions

  const { from, to } = periodBounds.value
  const fromStr = from.toISOString().split('T')[0]
  const toStr   = to.toISOString().split('T')[0]

  return transactionsStore.transactions.filter(t => t.date >= fromStr && t.date <= toStr)
})

const periodTotalIngresos = computed(() =>
  periodTransactions.value.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
)
const periodTotalGastos = computed(() =>
  periodTransactions.value.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)
)
const periodBalance = computed(() => periodTotalIngresos.value - periodTotalGastos.value)

// ── Helpers ───────────────────────────────────────────────────────────────────

const baseChartOptions = {
  chart: { toolbar: { show: false }, fontFamily: 'inherit' },
  grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
  dataLabels: { enabled: false },
  tooltip: { y: { formatter: (v) => formatCurrency(v) } },
}

// ── Gastos por Categoría (Pie) ────────────────────────────────────────────────

const gastosPorCategoria = computed(() => {
  const map = {}
  periodTransactions.value
    .filter(t => t.type === 'gasto')
    .forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount })

  const total = Object.values(map).reduce((s, v) => s + v, 0)

  return Object.entries(map)
    .map(([category, amount]) => {
      const cat = settingsStore.categories.find(c => c.name === category)
      return { category, amount, color: cat?.color ?? '#64748b', ratio: amount / total }
    })
    .sort((a, b) => b.amount - a.amount)
})

const pieSeries  = computed(() => gastosPorCategoria.value.map(g => g.amount))
const pieOptions = computed(() => ({
  ...baseChartOptions,
  labels:  gastosPorCategoria.value.map(g => g.category),
  colors:  gastosPorCategoria.value.map(g => g.color),
  legend:  { position: 'right', fontSize: '13px' },
  tooltip: { y: { formatter: (v) => formatCurrency(v) } },
}))

// ── Ingresos vs Gastos (Bar) ──────────────────────────────────────────────────

const flowBarSeries = computed(() => [{
  name: t('analysis.income_label'),
  data: [periodTotalIngresos.value, periodTotalGastos.value],
}])

const flowBarOptions = computed(() => ({
  ...baseChartOptions,
  colors: ['#10b981', '#ef4444'],
  plotOptions: { bar: { distributed: true, borderRadius: 6, columnWidth: '45%' } },
  xaxis:  { categories: [t('analysis.income_label'), t('analysis.expenses_label')] },
  yaxis:  { labels: { formatter: (v) => `$${(v / 1000).toFixed(0)}k` } },
  legend: { show: false },
}))

// ── Gastos por Cuenta (Bar) ───────────────────────────────────────────────────

const gastosPorCuenta = computed(() => {
  const map = {}
  periodTransactions.value
    .filter(t => t.type === 'gasto')
    .forEach(t => { map[t.account_name] = (map[t.account_name] || 0) + t.amount })

  return Object.entries(map).map(([name, amount]) => {
    const account = accountsStore.accounts.find(a => a.name === name)
    return { name, amount, color: account?.color ?? '#64748b' }
  })
})

const accountBarSeries = computed(() => [{
  name: t('analysis.expenses_label'),
  data: gastosPorCuenta.value.map(g => g.amount),
}])

const accountBarOptions = computed(() => ({
  ...baseChartOptions,
  colors: gastosPorCuenta.value.map(g => g.color),
  plotOptions: { bar: { distributed: true, borderRadius: 6, columnWidth: '45%' } },
  xaxis:  { categories: gastosPorCuenta.value.map(g => g.name) },
  yaxis:  { labels: { formatter: (v) => `$${v}` } },
  legend: { show: false },
}))

// ── Presupuesto por Categoría ─────────────────────────────────────────────────

const topExpenses = computed(() => {
  const maxAmount = Math.max(...gastosPorCategoria.value.map(g => g.amount), 1)

  return gastosPorCategoria.value.map(item => {
    const cat        = settingsStore.categories.find(c => c.name === item.category)
    const budget     = cat?.budget ?? null
    const overBudget = budget !== null && item.amount > budget
    const pct        = budget !== null
      ? Math.min(item.amount / budget, 1)
      : item.amount / maxAmount

    let barColor = item.color
    if (budget !== null) {
      if (overBudget)          barColor = '#ef4444'
      else if (pct >= 0.8)     barColor = '#f59e0b'
      else                     barColor = '#10b981'
    }

    return { ...item, budget, overBudget, ratio: pct, barColor }
  })
})
</script>

<style scoped>
.analysis-card {
  border-radius: 12px;
}

.period-toggle {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.period-label {
  min-width: 140px;
  text-align: center;
  font-size: 15px;
  text-transform: capitalize;
}

.empty-chart {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-bar { background: #e5e7eb; }

.progress-bar :deep(.q-linear-progress__track) {
  background: #e5e7eb;
  opacity: 1;
}

.progress-bar :deep(.q-linear-progress__model) {
  background: var(--bar-color);
}
</style>
