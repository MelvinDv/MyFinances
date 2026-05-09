<template>
  <q-page class="page-home">

    <!-- Month navigation -->
    <div class="hm-month-row">
      <i class="ti ti-chevron-left hm-chevron" @click="prevMonth" />
      <span class="hm-month-label">{{ monthLabel }}</span>
      <i class="ti ti-chevron-right hm-chevron" @click="nextMonth" />
    </div>

    <!-- Balance principal -->
    <div class="hm-balance">{{ hidden ? '••••••' : formatCurrency(displayBalance) }}</div>
    <div class="hm-account-name">{{ selectedAccount?.label ?? '—' }}</div>

    <!-- Dots: selector de cuenta -->
    <div class="hm-dots">
      <div
        v-for="(acc, i) in accounts"
        :key="acc.id"
        :class="['hm-dot', { 'hm-dot-active': i === activeIdx }]"
        @click="activeIdx = i"
      />
    </div>

    <!-- Barra de crédito (solo TDC con límite) -->
    <div v-if="selectedAccount?.type === 'tarjeta_credito' && selectedAccount?.credit_limit" class="hm-bar-wrap">
      <div class="hm-bar">
        <div class="hm-bar-fill" :style="{ width: Math.min(creditUsedPct, 100) + '%' }" />
      </div>
      <div class="hm-bar-row">
        <span>{{ formatCurrency(monthSpent) }} gastado</span>
        <span>{{ formatCurrency(selectedAccount.credit_limit) }} límite</span>
      </div>
    </div>

    <div class="hm-divider" />

    <!-- Transacciones recientes agrupadas por día -->
    <template v-if="recentGrouped.length">
      <template v-for="group in recentGrouped" :key="group.date">
        <div class="hm-day-label">{{ group.label }}</div>
        <div v-for="tx in group.transactions" :key="tx.id" class="hm-tx">
          <div>
            <div class="hm-tx-name">{{ tx.description || tx.category }}</div>
            <div class="hm-tx-cat">{{ tx.category }}</div>
          </div>
          <div :class="['hm-tx-amount', tx.type === 'ingreso' ? 'hm-tx-positive' : '']">
            {{ tx.type === 'ingreso' ? '+' : '−' }}{{ tx.amount.toLocaleString('es-MX') }}
          </div>
        </div>
      </template>
    </template>
    <div v-else class="hm-empty">Sin movimientos este mes</div>

    <!-- Botón agregar -->
    <div class="hm-add-row">
      <div class="hm-add-btn" @click="showForm = true">
        <i class="ti ti-plus" />
      </div>
    </div>

    <TransactionForm v-model="showForm" :transaction="null" />
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAccountsStore } from 'stores/accounts.store'
import { useTransactionsStore } from 'stores/transactions.store'
import { useCurrency } from 'src/composables/useCurrency'
import TransactionForm from 'components/transactions/TransactionForm.vue'

const { formatCurrency } = useCurrency()
const accountsStore     = useAccountsStore()
const transactionsStore = useTransactionsStore()

// ── Account carousel ─────────────────────────────────────────────────────────

const activeIdx = ref(0)
const hidden    = ref(false)

const accounts       = computed(() => accountsStore.accounts)
const selectedAccount = computed(() => accounts.value[activeIdx.value] ?? null)

// ── Month navigation ──────────────────────────────────────────────────────────

const cursor = ref(new Date())

function prevMonth() {
  const d = new Date(cursor.value)
  d.setMonth(d.getMonth() - 1)
  cursor.value = d
}
function nextMonth() {
  const d = new Date(cursor.value)
  d.setMonth(d.getMonth() + 1)
  cursor.value = d
}

const monthLabel = computed(() =>
  cursor.value.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
)

// ── Period bounds ─────────────────────────────────────────────────────────────

const periodFrom = computed(() => {
  const y = cursor.value.getFullYear()
  const m = cursor.value.getMonth()
  return new Date(y, m, 1).toISOString().split('T')[0]
})
const periodTo = computed(() => {
  const y = cursor.value.getFullYear()
  const m = cursor.value.getMonth()
  return new Date(y, m + 1, 0).toISOString().split('T')[0]
})

// ── Credit bar ────────────────────────────────────────────────────────────────

const monthSpent = computed(() =>
  transactionsStore.transactions
    .filter(t =>
      t.type === 'gasto' &&
      t.date >= periodFrom.value &&
      t.date <= periodTo.value &&
      t.account_id === selectedAccount.value?.id
    )
    .reduce((s, t) => s + t.amount, 0)
)

const creditUsedPct = computed(() => {
  const limit = selectedAccount.value?.credit_limit
  if (!limit) return 0
  return (monthSpent.value / limit) * 100
})

const displayBalance = computed(() => selectedAccount.value?.balance ?? 0)

// ── Recent transactions (grouped) ─────────────────────────────────────────────

const recentTransactions = computed(() =>
  transactionsStore.transactions
    .filter(t => t.date >= periodFrom.value && t.date <= periodTo.value)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 40)
)

const recentGrouped = computed(() => {
  const groups = []
  const map    = {}
  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  for (const tx of recentTransactions.value) {
    let label
    if (tx.date === today)          label = 'hoy'
    else if (tx.date === yesterday) label = 'ayer'
    else label = new Date(tx.date + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long' })

    if (!map[tx.date]) {
      map[tx.date] = { date: tx.date, label, transactions: [] }
      groups.push(map[tx.date])
    }
    map[tx.date].transactions.push(tx)
  }
  return groups
})

const showForm = ref(false)
</script>

<style scoped lang="scss">
.page-home {
  padding: 20px 20px 24px;
  background: #fff;
  min-height: 100vh;
}

.hm-month-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.hm-chevron {
  font-size: 14px;
  color: #C8C6BE;
  cursor: pointer;
  padding: 4px;
}
.hm-month-label { font-size: 11px; color: #888780; }

.hm-balance {
  font-size: 36px;
  font-weight: 500;
  color: #1a1a18;
  letter-spacing: -1.5px;
  text-align: center;
  line-height: 1;
  margin-bottom: 4px;
}
.hm-account-name {
  font-size: 11px;
  color: #B4B2A9;
  text-align: center;
  margin-bottom: 10px;
}

.hm-dots {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-bottom: 12px;
}
.hm-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #D3D1C7;
  cursor: pointer;
  transition: all 0.2s;
}
.hm-dot-active {
  background: #1a1a18;
  width: 14px;
  border-radius: 3px;
}

.hm-bar-wrap { margin-bottom: 12px; }
.hm-bar {
  height: 2px;
  background: #F1EFE8;
  border-radius: 2px;
  margin-bottom: 4px;
}
.hm-bar-fill {
  height: 2px;
  border-radius: 2px;
  background: #1a1a18;
  transition: width 0.3s;
}
.hm-bar-row {
  display: flex;
  justify-content: space-between;
}
.hm-bar-row span { font-size: 11px; color: #C8C6BE; }

.hm-divider {
  height: 0.5px;
  background: #F1EFE8;
  margin-bottom: 12px;
}

.hm-day-label {
  font-size: 11px;
  color: #C8C6BE;
  margin-bottom: 6px;
  margin-top: 4px;
}
.hm-tx {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 5px 0;
}
.hm-tx-name { font-size: 14px; color: #1a1a18; }
.hm-tx-cat  { font-size: 11px; color: #C8C6BE; }
.hm-tx-amount { font-size: 14px; color: #1a1a18; }
.hm-tx-positive { color: #3B6D11; }

.hm-empty {
  text-align: center;
  font-size: 13px;
  color: #C8C6BE;
  padding: 24px 0;
}

.hm-add-row {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.hm-add-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 0.5px solid #E8E6E0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.hm-add-btn i { font-size: 16px; color: #1a1a18; }
</style>
