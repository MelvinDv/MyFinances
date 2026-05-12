<template>
  <q-page class="page-tx">

    <!-- Header -->
    <div class="tx-header">
      <span class="tx-title">{{ $t('transactions.title') }}</span>
      <q-btn flat dense round icon="tune" size="11px" color="grey-5">
        <q-badge v-if="activeFiltersCount > 0" color="dark" floating rounded>
          {{ activeFiltersCount }}
        </q-badge>
        <q-menu style="width: 290px" max-height="80vh">
          <div class="q-pa-md column q-gutter-md">
            <q-select
              v-model="filters.account"
              :options="accountOptions"
              :label="$t('transactions.filter_account')"
              outlined dense clearable hide-bottom-space
            />
            <q-select
              v-model="filters.category"
              :options="categoryOptions"
              :label="$t('transactions.filter_category')"
              outlined dense clearable hide-bottom-space
            />
            <q-input
              :model-value="dateRangeLabel"
              :label="$t('transactions.filter_date')"
              outlined dense readonly hide-bottom-space
            >
              <template #prepend>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="filters.dateRange" mask="YYYY-MM-DD" range minimal>
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="OK" color="dark" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
              <template v-if="filters.dateRange" #append>
                <q-icon name="close" class="cursor-pointer" size="xs" @click.stop="filters.dateRange = null" />
              </template>
            </q-input>
            <q-input
              v-model="filters.search"
              :placeholder="$t('transactions.search_placeholder')"
              outlined dense clearable hide-bottom-space
            >
              <template #prepend>
                <q-icon name="search" color="grey-5" />
              </template>
            </q-input>
            <q-btn
              v-if="hasActiveFilters"
              flat dense icon="close"
              :label="$t('transactions.clear_filters')"
              color="grey-6" no-caps
              @click="clearFilters"
            />
          </div>
        </q-menu>
      </q-btn>
    </div>

    <!-- Filter pills -->
    <div class="tx-pills">
      <span
        v-for="opt in typeOptions"
        :key="opt.value"
        :class="['tx-pill', { 'tx-pill-on': filters.type === opt.value }]"
        @click="filters.type = opt.value"
      >{{ opt.label }}</span>
    </div>

    <!-- Transaction groups -->
    <template v-if="groupedFiltered.length">
      <template v-for="group in groupedFiltered" :key="group.date">
        <div class="tx-day-label">{{ group.label }}</div>
        <q-slide-item
          v-for="tx in group.transactions"
          :key="tx.id"
          class="tx-slide"
          right-color="negative"
          :left-color="tx.installment_plan_id ? '' : 'grey-2'"
          @right="({ reset }) => onSlideDelete(tx, reset)"
          @left="({ reset }) => onSlideEdit(tx, reset)"
        >
          <template v-if="!tx.installment_plan_id" #left>
            <q-icon name="edit" color="grey-7" />
          </template>
          <template #right>
            <q-icon name="delete" />
          </template>

          <div class="tx-row" @click="startEdit(tx)">
            <div class="tx-row-left">
              <div class="tx-row-name">{{ tx.description || tx.category }}</div>
              <div class="tx-row-sub">
                {{ tx.category }}
                <template v-if="tx.account_name"> · {{ tx.destination_account_name
                  ? `${tx.account_name} → ${tx.destination_account_name}`
                  : tx.account_name }}</template>
              </div>
            </div>
            <div class="tx-row-right">
              <div
                :class="['tx-row-amount', tx.type === 'ingreso' ? 'tx-positive' : tx.type === 'transferencia' ? 'tx-transfer' : '']"
              >
                {{ tx.type === 'ingreso' ? '+' : tx.type === 'transferencia' ? '⇄ ' : '−' }}{{ tx.amount.toLocaleString('es-MX') }}
              </div>
            </div>
          </div>
        </q-slide-item>
      </template>
    </template>
    <div v-else class="tx-empty">{{ $t('transactions.no_data') }}</div>

    <!-- Dialogs -->
    <TransactionForm v-model="showForm" :transaction="editingTransaction" @update:model-value="onFormClose" />

    <q-dialog v-model="showConfirm">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">
            {{ toDelete?.installment_plan_id ? $t('installments.delete_title') : $t('transactions.delete_title') }}
          </div>
          <div class="text-body2 q-mt-sm text-grey-7">
            <template v-if="toDelete?.installment_plan_id">
              {{ $t('installments.delete_confirm', { months: toDelete.installment_total_months }) }}
            </template>
            <template v-else>
              {{ $t('transactions.delete_confirm') }} <strong>{{ toDelete?.description }}</strong>?
            </template>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useTransactionsStore } from 'stores/transactions.store'
import { useAccountsStore } from 'stores/accounts.store'
import { useSettingsStore } from 'stores/settings.store'
import { useTour } from 'src/composables/useTour'
import TransactionForm from 'components/transactions/TransactionForm.vue'

const { t } = useI18n()
const $q    = useQuasar()
const store = useTransactionsStore()
const accountsStore  = useAccountsStore()
const settingsStore  = useSettingsStore()
const { getPhase, runSteps3and4 } = useTour()

onMounted(async () => {
  if (getPhase() === 'transactions') {
    await nextTick()
    runSteps3and4(t)
  }
})

const showForm           = ref(false)
const showConfirm        = ref(false)
const toDelete           = ref(null)
const editingTransaction = ref(null)

function startEdit(transaction) {
  if (transaction.installment_plan_id) return
  editingTransaction.value = transaction
  showForm.value = true
}

function onFormClose(val) {
  showForm.value = val
  if (!val) editingTransaction.value = null
}

// ── Filters ───────────────────────────────────────────────────────────────────

function currentMonthRange() {
  const now  = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
}

const filters = ref({
  type:      'all',
  account:   null,
  category:  null,
  dateRange: currentMonthRange(),
  search:    '',
})

const typeOptions = computed(() => [
  { label: t('transactions.filter_all'),   value: 'all'     },
  { label: t('transactions.type_income'),  value: 'ingreso' },
  { label: t('transactions.type_expense'), value: 'gasto'   },
])

const accountOptions  = computed(() => accountsStore.accounts.map(a => a.name))
const categoryOptions = computed(() => settingsStore.categories.map(c => c.name))

const activeFiltersCount = computed(() => {
  const { from, to } = currentMonthRange()
  const range = filters.value.dateRange
  let count = 0
  if (filters.value.type !== 'all') count++
  if (filters.value.account) count++
  if (filters.value.category) count++
  if (!range || range.from !== from || range.to !== to) count++
  return count
})

const hasActiveFilters = computed(() => {
  const { from, to } = currentMonthRange()
  const range = filters.value.dateRange
  return (
    filters.value.type !== 'all' ||
    filters.value.account ||
    filters.value.category ||
    filters.value.search ||
    !range || range.from !== from || range.to !== to
  )
})

function clearFilters() {
  filters.value = { type: 'all', account: null, category: null, dateRange: currentMonthRange(), search: '' }
}

// ── Filtered + grouped ────────────────────────────────────────────────────────

const filteredTransactions = computed(() => {
  const range  = filters.value.dateRange
  const search = filters.value.search?.toLowerCase().trim()
  return store.transactions.filter(t => {
    if (filters.value.type !== 'all' && t.type !== filters.value.type) return false
    if (filters.value.account && t.account_name !== filters.value.account) return false
    if (filters.value.category && t.category !== filters.value.category) return false
    if (range?.from && t.date < range.from) return false
    if (range?.to   && t.date > range.to)   return false
    if (search) {
      const hay = [t.description, t.category, t.account_name, t.destination_account_name]
        .filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })
})

const groupedFiltered = computed(() => {
  const groups = []
  const map    = {}
  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const sorted    = [...filteredTransactions.value].sort((a, b) => b.date.localeCompare(a.date))

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

const dateRangeLabel = computed(() => {
  const range = filters.value.dateRange
  if (!range) return ''
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  if (range.from && range.to) return `${fmt(range.from)} – ${fmt(range.to)}`
  if (range.from) return fmt(range.from)
  return ''
})

function onSlideEdit(tx, reset) {
  reset()
  startEdit(tx)
}

function onSlideDelete(tx, reset) {
  reset()
  confirmDelete(tx)
}

function confirmDelete(transaction) {
  toDelete.value = transaction
  showConfirm.value = true
}

function handleDelete() {
  store.deleteTransaction(toDelete.value.id)
  showConfirm.value = false
  $q.notify({ message: t('notify.transaction_deleted'), color: 'negative', icon: 'delete', position: 'bottom', timeout: 2500 })
  toDelete.value = null
}
</script>

<style scoped lang="scss">
.page-tx {
  padding: 20px 20px 24px;
  background: #fff;
}

.tx-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.tx-title { font-size: 16px; font-weight: 500; color: #1a1a18; }

.tx-pills {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.tx-pill {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  border: 0.5px solid #E8E6E0;
  color: #888780;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s;
}
.tx-pill-on {
  background: #1a1a18;
  color: #fff;
  border-color: #1a1a18;
}

.tx-new-row {
  margin-bottom: 12px;
}

.tx-day-label {
  font-size: 11px;
  color: #C8C6BE;
  margin-bottom: 6px;
  margin-top: 8px;
}

.tx-slide {
  border-bottom: 0.5px solid #F1EFE8;
  &:last-of-type { border-bottom: none; }
}

.tx-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  cursor: pointer;
  background: #fff;
}

.tx-row-left { flex: 1; min-width: 0; }
.tx-row-name {
  font-size: 14px;
  color: #1a1a18;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tx-row-sub {
  font-size: 11px;
  color: #C8C6BE;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-row-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.tx-row-amount { font-size: 14px; color: #1a1a18; }
.tx-positive   { color: #3B6D11; }
.tx-transfer   { color: #888780; }

.tx-empty {
  text-align: center;
  font-size: 13px;
  color: #C8C6BE;
  padding: 32px 0;
}
</style>
