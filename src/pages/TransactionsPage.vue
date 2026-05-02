<template>
  <q-page class="q-pa-lg">

    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">{{ $t('transactions.title') }}</div>
        <div class="text-caption text-grey-6">{{ $t('transactions.subtitle') }}</div>
      </div>
      <q-btn
        color="dark"
        icon="add"
        :label="$t('transactions.new')"
        unelevated
        @click="editingTransaction = null; showForm = true"
      />
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section class="q-py-sm">

        <!-- Desktop -->
        <div v-if="$q.screen.gt.xs" class="row items-center q-gutter-sm">
          <q-btn-toggle
            v-model="filters.type"
            :options="typeOptions"
            unelevated
            toggle-color="dark"
            color="white"
            text-color="grey-7"
            no-caps
            dense
            class="filter-toggle"
          />
          <q-select
            v-model="filters.account"
            :options="accountOptions"
            :label="$t('transactions.filter_account')"
            outlined dense clearable hide-bottom-space
            style="min-width: 160px"
          />
          <q-select
            v-model="filters.category"
            :options="categoryOptions"
            :label="$t('transactions.filter_category')"
            outlined dense clearable hide-bottom-space
            style="min-width: 160px"
          />
          <q-input
            :model-value="dateRangeLabel"
            :label="$t('transactions.filter_date')"
            outlined dense readonly hide-bottom-space
            style="min-width: 190px"
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
            style="min-width: 190px"
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

        <!-- Mobile -->
        <div v-else class="row items-center q-gutter-sm">

          <!-- Buscador -->
          <q-input
            v-model="filters.search"
            :placeholder="$t('transactions.search_placeholder')"
            outlined dense clearable hide-bottom-space
            class="col"
          >
            <template #prepend>
              <q-icon name="search" color="grey-5" />
            </template>
          </q-input>

          <!-- Botón Filtros -->
          <q-btn
            unelevated
            :color="hasActiveFilters ? 'dark' : 'grey-2'"
            :text-color="hasActiveFilters ? 'white' : 'grey-8'"
            icon="tune"
            :label="$t('transactions.filters_btn')"
            no-caps
            dense
            class="q-px-sm"
          >
            <q-badge v-if="activeFiltersCount > 0" color="negative" floating rounded>
              {{ activeFiltersCount }}
            </q-badge>
            <q-menu style="width: 280px" max-height="80vh">
              <div class="q-pa-md column q-gutter-md">

                <q-btn-toggle
                  v-model="filters.type"
                  :options="typeOptions"
                  unelevated
                  toggle-color="dark"
                  color="white"
                  text-color="grey-7"
                  no-caps
                  dense
                  spread
                  class="filter-toggle"
                />

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

      </q-card-section>
    </q-card>

    <!-- Resumen rápido (totales filtrados) -->
    <div class="row q-gutter-xs q-mb-lg">
      <q-card flat bordered class="col">
        <q-card-section class="q-py-sm q-px-sm">
          <div class="text-caption text-grey-6">{{ $t('transactions.income') }}</div>
          <div class="summary-amount text-positive text-weight-bold">
            +{{ formatCurrency(filteredTotalIngresos) }}
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="col">
        <q-card-section class="q-py-sm q-px-sm">
          <div class="text-caption text-grey-6">{{ $t('transactions.expenses') }}</div>
          <div class="summary-amount text-negative text-weight-bold">
            -{{ formatCurrency(filteredTotalGastos) }}
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="col">
        <q-card-section class="q-py-sm q-px-sm">
          <div class="text-caption text-grey-6">{{ $t('transactions.balance') }}</div>
          <div
            class="summary-amount text-weight-bold"
            :class="filteredBalance >= 0 ? 'text-positive' : 'text-negative'"
          >
            {{ formatCurrency(filteredBalance) }}
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Tabla de transacciones -->
    <q-card flat bordered>
      <q-table
        :rows="filteredTransactions"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :pagination="{ rowsPerPage: 50, sortBy: 'date', descending: true }"
        :rows-per-page-options="rowsPerPageOptions"
        :rows-per-page-label="$t('transactions.rows_per_page')"
        :no-data-label="$t('transactions.no_data')"
      >
        <!-- Fecha -->
        <template #body-cell-date="props">
          <q-td :props="props">
            {{ formatDate(props.row.date) }}
          </q-td>
        </template>

        <!-- Tipo (badge) -->
        <template #body-cell-type="props">
          <q-td :props="props">
            <q-chip
              :color="typeChip(props.row.type).color"
              :text-color="typeChip(props.row.type).textColor"
              :label="typeChip(props.row.type).label"
              class="text-capitalize q-px-sm q-py-xs text-bold"
            />
          </q-td>
        </template>

        <!-- Monto -->
        <template #body-cell-amount="props">
          <q-td :props="props">
            <span
              class="text-weight-bold"
              :class="props.row.type === 'ingreso' ? 'text-positive' : props.row.type === 'transferencia' ? 'text-grey-6' : 'text-negative'"
            >
              {{ props.row.type === 'ingreso' ? '+' : props.row.type === 'transferencia' ? '⇄ ' : '-' }}{{ formatCurrency(props.row.amount) }}
            </span>
          </q-td>
        </template>

        <!-- Método (cuenta) -->
        <template #body-cell-account_name="props">
          <q-td :props="props">
            <q-chip dense outline color="grey-7" class="q-ma-none">
              {{ props.row.destination_account_name
                ? `${props.row.account_name} → ${props.row.destination_account_name}`
                : props.row.account_name }}
            </q-chip>
          </q-td>
        </template>

        <!-- Descripción -->
        <template #body-cell-description="props">
          <q-td :props="props">
            <div class="row items-center q-gutter-xs no-wrap">
              <q-chip
                v-if="props.row.installment_month"
                dense
                size="xs"
                color="blue-1"
                text-color="blue-9"
                class="q-ma-none"
              >
                Cuota {{ props.row.installment_month }}/{{ props.row.installment_total_months }}
              </q-chip>
              <q-chip
                v-if="props.row.recurring_transaction_id"
                dense
                size="xs"
                color="purple-1"
                text-color="purple-9"
                icon="repeat"
                class="q-ma-none"
              >
                {{ $t('recurring.badge') }}
              </q-chip>
              <span>{{ props.row.description }}</span>
            </div>
          </q-td>
        </template>

        <!-- Acciones -->
        <template #body-cell-actions="props">
          <q-td :props="props" auto-width>
            <q-btn
              v-if="!props.row.installment_plan_id"
              flat
              round
              dense
              icon="edit"
              color="grey-5"
              @click="startEdit(props.row)"
            />
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="grey-5"
              @click="confirmDelete(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Modal: Nueva / Editar Transacción -->
    <TransactionForm v-model="showForm" :transaction="editingTransaction" @update:model-value="onFormClose" />

    <!-- Confirmación eliminar -->
    <q-dialog v-model="showConfirm">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">
            {{ toDelete?.installment_plan_id
              ? $t('installments.delete_title')
              : $t('transactions.delete_title') }}
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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useTransactionsStore } from 'stores/transactions.store'
import { useAccountsStore } from 'stores/accounts.store'
import { useSettingsStore } from 'stores/settings.store'
import { useCurrency } from 'src/composables/useCurrency'
import TransactionForm from 'components/transactions/TransactionForm.vue'

const { t } = useI18n()
const { formatCurrency } = useCurrency()
const $q = useQuasar()
const store = useTransactionsStore()
const accountsStore = useAccountsStore()
const settingsStore = useSettingsStore()

const showForm = ref(false)
const showConfirm = ref(false)
const toDelete = ref(null)
const editingTransaction = ref(null)

function startEdit(transaction) {
  editingTransaction.value = transaction
  showForm.value = true
}

function onFormClose(val) {
  showForm.value = val
  if (!val) editingTransaction.value = null
}

// ── Filtros ───────────────────────────────────────────────────────────────────

function currentMonthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    from: from.toISOString().split('T')[0],
    to:   now.toISOString().split('T')[0],
  }
}

const filters = ref({
  type:      'all',
  account:   null,
  category:  null,
  dateRange: currentMonthRange(),
  search:    '',
})

const typeOptions = computed(() => [
  { label: t('transactions.filter_all'),      value: 'all' },
  { label: t('transactions.type_income'),     value: 'ingreso' },
  { label: t('transactions.type_expense'),    value: 'gasto' },
])

const accountOptions = computed(() =>
  accountsStore.accounts.map(a => a.name)
)

const categoryOptions = computed(() =>
  settingsStore.categories.map(c => c.name)
)

const rowsPerPageOptions = computed(() => [
  50, 100, 200,
  { label: t('transactions.pagination_all'), value: 0 },
])

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
    !range ||
    range.from !== from ||
    range.to !== to
  )
})

function clearFilters() {
  filters.value = { type: 'all', account: null, category: null, dateRange: currentMonthRange(), search: '' }
}

// ── Transacciones filtradas ───────────────────────────────────────────────────

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
      const haystack = [t.description, t.category, t.account_name, t.destination_account_name]
        .filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
})

const filteredTotalIngresos = computed(() =>
  filteredTransactions.value
    .filter(t => t.type === 'ingreso')
    .reduce((sum, t) => sum + t.amount, 0)
)

const filteredTotalGastos = computed(() =>
  filteredTransactions.value
    .filter(t => t.type === 'gasto')
    .reduce((sum, t) => sum + t.amount, 0)
)

const filteredBalance = computed(() => filteredTotalIngresos.value - filteredTotalGastos.value)

// ── Tabla ─────────────────────────────────────────────────────────────────────

const columns = computed(() => [
  { name: 'date',         label: t('transactions.col_date'),        field: 'date',         align: 'left', sortable: true },
  { name: 'type',         label: t('transactions.col_type'),        field: 'type',         align: 'left' },
  { name: 'amount',       label: t('transactions.col_amount'),      field: 'amount',       align: 'left', sortable: true },
  { name: 'category',     label: t('transactions.col_category'),    field: 'category',     align: 'left' },
  { name: 'account_name', label: t('transactions.col_method'),      field: 'account_name', align: 'left' },
  { name: 'description',  label: t('transactions.col_description'), field: 'description',  align: 'left' },
  { name: 'actions',      label: '',                                 field: 'actions',      align: 'right' },
])

const dateRangeLabel = computed(() => {
  const range = filters.value.dateRange
  if (!range) return ''
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  if (range.from && range.to) return `${fmt(range.from)} – ${fmt(range.to)}`
  if (range.from) return fmt(range.from)
  return ''
})

function typeChip(type) {
  if (type === 'ingreso')       return { color: 'green-1', textColor: 'green',  label: t('transactions.type_income') }
  if (type === 'transferencia') return { color: 'blue-1',  textColor: 'blue-9', label: t('transactions.type_transfer') }
  return                               { color: 'red-1',   textColor: 'red-9',  label: t('transactions.type_expense') }
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
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

<style scoped>
.filter-toggle {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.summary-amount {
  font-size: clamp(13px, 2.5vw, 20px);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
