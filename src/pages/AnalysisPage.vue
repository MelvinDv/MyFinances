<template>
  <q-page class="q-pa-lg">

    <!-- Header -->
    <div class="text-h4 text-weight-bold q-mb-xs">Análisis</div>
    <div class="text-body2 text-grey-6 q-mb-lg">Visualiza tus hábitos financieros</div>

    <!-- Summary cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-card flat bordered class="analysis-card">
          <q-card-section>
            <div class="text-body2 text-weight-bold q-mb-md">Ingresos Totales</div>
            <div class="text-h4 text-weight-bold text-positive">
              {{ formatCurrency(transactionsStore.totalIngresos) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card flat bordered class="analysis-card">
          <q-card-section>
            <div class="text-body2 text-weight-bold q-mb-md">Gastos Totales</div>
            <div class="text-h4 text-weight-bold text-negative">
              {{ formatCurrency(transactionsStore.totalGastos) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card flat bordered class="analysis-card">
          <q-card-section>
            <div class="text-body2 text-weight-bold q-mb-md">Balance Neto</div>
            <div
              class="text-h4 text-weight-bold"
              :class="transactionsStore.balance >= 0 ? 'text-positive' : 'text-negative'"
            >
              {{ formatCurrency(transactionsStore.balance) }}
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
            <div class="text-subtitle1 text-weight-bold">Gastos por Categoría</div>
            <div class="text-caption text-grey-6 q-mb-sm">Distribución de tus gastos</div>
            <apexchart
              v-if="pieSeries.length"
              type="pie"
              :options="pieOptions"
              :series="pieSeries"
              height="300"
            />
            <div v-else class="empty-chart text-grey-5 text-body2">Sin gastos registrados</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Bar: Ingresos vs Gastos -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="analysis-card">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">Ingresos vs Gastos</div>
            <div class="text-caption text-grey-6 q-mb-sm">Comparación de flujo de dinero</div>
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
            <div class="text-subtitle1 text-weight-bold">Gastos por Cuenta</div>
            <div class="text-caption text-grey-6 q-mb-sm">Distribución de gastos entre tus cuentas</div>
            <apexchart
              v-if="accountBarSeries[0].data.length"
              type="bar"
              :options="accountBarOptions"
              :series="accountBarSeries"
              height="300"
            />
            <div v-else class="empty-chart text-grey-5 text-body2">Sin gastos registrados</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Progress bars: Mayores Gastos -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="analysis-card">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">Mayores Gastos</div>
            <div class="text-caption text-grey-6 q-mb-md">Top categorías de gasto</div>
            <div v-if="topExpenses.length" class="column q-gutter-md">
              <div v-for="item in topExpenses" :key="item.category">
                <div class="row justify-between q-mb-xs">
                  <span class="text-body2 text-weight-medium">{{ item.category }}</span>
                  <span class="text-body2">{{ formatCurrency(item.amount) }}</span>
                </div>
                <q-linear-progress
                  :value="item.ratio"
                  size="8px"
                  rounded
                  class="progress-bar"
                  :style="{ '--bar-color': item.color }"
                />
              </div>
            </div>
            <div v-else class="empty-chart text-grey-5 text-body2">Sin gastos registrados</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useTransactionsStore } from 'src/stores/transactions.store'
import { useAccountsStore } from 'src/stores/accounts.store'
import { useSettingsStore } from 'src/stores/settings.store'

const apexchart = VueApexCharts

const transactionsStore = useTransactionsStore()
const accountsStore = useAccountsStore()
const settingsStore = useSettingsStore()

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

const baseChartOptions = {
  chart: { toolbar: { show: false }, fontFamily: 'inherit' },
  grid: {
    borderColor: '#e5e7eb',
    strokeDashArray: 4,
  },
  dataLabels: { enabled: false },
  tooltip: { y: { formatter: (v) => formatCurrency(v) } },
}

// ── Gastos por Categoría (Pie) ────────────────────────────────────────────────

const gastosPorCategoria = computed(() => {
  const map = {}
  transactionsStore.transactions
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

const pieSeries = computed(() => gastosPorCategoria.value.map(g => g.amount))

const pieOptions = computed(() => ({
  ...baseChartOptions,
  labels: gastosPorCategoria.value.map(g => g.category),
  colors: gastosPorCategoria.value.map(g => g.color),
  legend: { position: 'right', fontSize: '13px' },
  tooltip: {
    y: { formatter: (v) => formatCurrency(v) },
  },
}))

// ── Ingresos vs Gastos (Bar) ──────────────────────────────────────────────────

const flowBarSeries = computed(() => [{
  name: 'Monto',
  data: [transactionsStore.totalIngresos, transactionsStore.totalGastos],
}])

const flowBarOptions = {
  ...baseChartOptions,
  colors: ['#10b981', '#ef4444'],
  plotOptions: {
    bar: { distributed: true, borderRadius: 6, columnWidth: '45%' },
  },
  xaxis: { categories: ['Ingresos', 'Gastos'] },
  yaxis: { labels: { formatter: (v) => `$${(v / 1000).toFixed(0)}k` } },
  legend: { show: false },
}

// ── Gastos por Cuenta (Bar) ───────────────────────────────────────────────────

const gastosPorCuenta = computed(() => {
  const map = {}
  transactionsStore.transactions
    .filter(t => t.type === 'gasto')
    .forEach(t => { map[t.account_name] = (map[t.account_name] || 0) + t.amount })

  return Object.entries(map).map(([name, amount]) => {
    const account = accountsStore.accounts.find(a => a.name === name)
    return { name, amount, color: account?.color ?? '#64748b' }
  })
})

const accountBarSeries = computed(() => [{
  name: 'Gastos',
  data: gastosPorCuenta.value.map(g => g.amount),
}])

const accountBarOptions = computed(() => ({
  ...baseChartOptions,
  colors: gastosPorCuenta.value.map(g => g.color),
  plotOptions: {
    bar: { distributed: true, borderRadius: 6, columnWidth: '45%' },
  },
  xaxis: { categories: gastosPorCuenta.value.map(g => g.name) },
  yaxis: { labels: { formatter: (v) => `$${v}` } },
  legend: { show: false },
}))

// ── Mayores Gastos (Progress bars) ───────────────────────────────────────────

const topExpenses = computed(() => gastosPorCategoria.value)
</script>

<style scoped>
.analysis-card {
  border-radius: 12px;
}

.empty-chart {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-bar {
  background: #e5e7eb;
}

.progress-bar :deep(.q-linear-progress__track) {
  background: #e5e7eb;
  opacity: 1;
}

.progress-bar :deep(.q-linear-progress__model) {
  background: var(--bar-color);
}
</style>
