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

    <!-- Filter pills -->
    <div class="hm-pills">
      <span
        v-for="opt in typeOptions"
        :key="opt.value"
        :class="['hm-pill', { 'hm-pill-on': filterType === opt.value }]"
        @click="filterType = opt.value"
      >{{ opt.label }}</span>
    </div>

    <!-- Transacciones agrupadas por día -->
    <template v-if="filteredGrouped.length">
      <template v-for="group in filteredGrouped" :key="group.date">
        <div class="hm-day-label">{{ group.label }}</div>
        <div v-for="tx in group.transactions" :key="tx.id" class="hm-tx">
          <div class="hm-tx-left">
            <div class="hm-tx-name">{{ tx.description || tx.category }}</div>
            <div class="hm-tx-cat">
              {{ tx.category }}
              <template v-if="tx.account_name">
                · {{ tx.destination_account_name
                  ? `${tx.account_name} → ${tx.destination_account_name}`
                  : tx.account_name }}
              </template>
            </div>
          </div>
          <div class="hm-tx-right">
            <div :class="['hm-tx-amount', tx.type === 'ingreso' ? 'hm-tx-positive' : tx.type === 'transferencia' ? 'hm-tx-transfer' : '']">
              {{ tx.type === 'ingreso' ? '+' : tx.type === 'transferencia' ? '⇄ ' : '−' }}{{ tx.amount.toLocaleString('es-MX') }}
            </div>
            <q-btn flat round dense icon="more_vert" size="9px" color="grey-4">
              <q-menu anchor="bottom right" self="top right" class="hm-menu">
                <q-item v-if="!tx.installment_plan_id" v-close-popup clickable @click="startEdit(tx)">
                  <q-item-section side><i class="ti ti-edit hm-menu-icon" /></q-item-section>
                  <q-item-section>Editar</q-item-section>
                </q-item>
                <q-item v-close-popup clickable class="hm-menu-delete" @click="confirmDelete(tx)">
                  <q-item-section side><i class="ti ti-trash hm-menu-icon" /></q-item-section>
                  <q-item-section>Eliminar</q-item-section>
                </q-item>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </template>
    </template>
    <div v-else class="hm-empty">Sin movimientos este mes</div>

    <!-- Edit form -->
    <TransactionForm v-model="showForm" :transaction="editingTransaction" @update:model-value="onFormClose" />

    <!-- Delete confirm -->
    <q-dialog v-model="showConfirm">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">{{ $t('transactions.delete_title') }}</div>
          <div class="text-body2 q-mt-sm text-grey-7">
            {{ $t('transactions.delete_confirm') }} <strong>{{ toDelete?.description || toDelete?.category }}</strong>?
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" v-close-popup />
          <q-btn flat :label="$t('common.delete')" color="negative" @click="handleDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useAccountsStore } from 'stores/accounts.store'
import { useTransactionsStore } from 'stores/transactions.store'
import { useCurrency } from 'src/composables/useCurrency'
import TransactionForm from 'components/transactions/TransactionForm.vue'

const { t } = useI18n()
const $q = useQuasar()
const { formatCurrency } = useCurrency()
const accountsStore     = useAccountsStore()
const transactionsStore = useTransactionsStore()

// ── Account carousel ──────────────────────────────────────────────────────────

const activeIdx = ref(0)
const hidden    = ref(false)

const accounts        = computed(() => accountsStore.accounts)
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

// ── Filter pills ──────────────────────────────────────────────────────────────

const filterType = ref('all')

const typeOptions = computed(() => [
  { label: t('transactions.filter_all'),   value: 'all'     },
  { label: t('transactions.type_income'),  value: 'ingreso' },
  { label: t('transactions.type_expense'), value: 'gasto'   },
])

// ── Filtered + grouped ────────────────────────────────────────────────────────

const filteredGrouped = computed(() => {
  const groups  = []
  const map     = {}
  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const sorted = transactionsStore.transactions
    .filter(t => {
      if (t.date < periodFrom.value || t.date > periodTo.value) return false
      if (filterType.value !== 'all' && t.type !== filterType.value) return false
      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  for (const tx of sorted) {
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

// ── Edit / Delete ─────────────────────────────────────────────────────────────

const showForm           = ref(false)
const editingTransaction = ref(null)
const showConfirm        = ref(false)
const toDelete           = ref(null)

function startEdit(tx) {
  if (tx.installment_plan_id) return
  editingTransaction.value = tx
  showForm.value = true
}

function onFormClose(val) {
  showForm.value = val
  if (!val) editingTransaction.value = null
}

function confirmDelete(tx) {
  toDelete.value = tx
  showConfirm.value = true
}

function handleDelete() {
  transactionsStore.deleteTransaction(toDelete.value.id)
  showConfirm.value = false
  $q.notify({ message: t('notify.transaction_deleted'), color: 'negative', icon: 'delete', position: 'bottom', timeout: 2500 })
  toDelete.value = null
}
</script>

<style scoped lang="scss">
.page-home {
  padding: 20px 20px 80px;
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
  span { font-size: 11px; color: #C8C6BE; }
}

.hm-divider {
  height: 0.5px;
  background: #F1EFE8;
  margin-bottom: 12px;
}

// ── Filter pills ──────────────────────────────────────────────────────────────
.hm-pills {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.hm-pill {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  border: 0.5px solid #E8E6E0;
  color: #888780;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s;
}
.hm-pill-on {
  background: #1a1a18;
  color: #fff;
  border-color: #1a1a18;
}

// ── Day label ─────────────────────────────────────────────────────────────────
.hm-day-label {
  font-size: 11px;
  color: #C8C6BE;
  margin-bottom: 4px;
  margin-top: 8px;
}

// ── Transaction row ───────────────────────────────────────────────────────────
.hm-tx {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 0.5px solid #F1EFE8;
  &:last-of-type { border-bottom: none; }
}

.hm-tx-left { flex: 1; min-width: 0; }
.hm-tx-name {
  font-size: 14px;
  color: #1a1a18;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hm-tx-cat {
  font-size: 11px;
  color: #C8C6BE;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hm-tx-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.hm-tx-amount   { font-size: 14px; color: #1a1a18; }
.hm-tx-positive { color: #3B6D11; }
.hm-tx-transfer { color: #888780; }

.hm-menu {
  min-width: 130px;
  border-radius: 10px !important;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;

  .q-item {
    font-size: 13px;
    color: #1a1a18;
    min-height: 38px;
    padding: 0 14px 0 10px;
  }
  .q-item__section--side { min-width: unset; padding-right: 8px; }
}
.hm-menu-icon { font-size: 14px; color: #888780; }
.hm-menu-delete {
  color: #C0392B;
  .hm-menu-icon { color: #C0392B; }
}

.hm-empty {
  text-align: center;
  font-size: 13px;
  color: #C8C6BE;
  padding: 24px 0;
}
</style>
