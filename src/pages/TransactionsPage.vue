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
        @click="showForm = true"
      />
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section class="q-py-sm">
        <div class="row items-center q-gutter-sm">

          <!-- Tipo -->
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

          <!-- Cuenta -->
          <q-select
            v-model="filters.account"
            :options="accountOptions"
            :label="$t('transactions.filter_account')"
            outlined
            dense
            clearable
            hide-bottom-space
            style="min-width: 160px"
          />

          <!-- Categoría -->
          <q-select
            v-model="filters.category"
            :options="categoryOptions"
            :label="$t('transactions.filter_category')"
            outlined
            dense
            clearable
            hide-bottom-space
            style="min-width: 160px"
          />

          <!-- Fecha desde -->
          <q-input
            v-model="filters.dateFrom"
            :label="$t('transactions.filter_from')"
            outlined
            dense
            clearable
            readonly
            hide-bottom-space
            style="min-width: 140px"
          >
            <template #prepend>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="filters.dateFrom" mask="YYYY-MM-DD" minimal>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="OK" color="dark" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <!-- Fecha hasta -->
          <q-input
            v-model="filters.dateTo"
            :label="$t('transactions.filter_to')"
            outlined
            dense
            clearable
            readonly
            hide-bottom-space
            style="min-width: 140px"
          >
            <template #prepend>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="filters.dateTo" mask="YYYY-MM-DD" minimal>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="OK" color="dark" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <!-- Limpiar filtros -->
          <q-btn
            v-if="hasActiveFilters"
            flat
            dense
            icon="close"
            :label="$t('transactions.clear_filters')"
            color="grey-6"
            no-caps
            @click="clearFilters"
          />

        </div>
      </q-card-section>
    </q-card>

    <!-- Resumen rápido (totales filtrados) -->
    <div class="row q-gutter-md q-mb-lg">
      <q-card flat bordered class="col">
        <q-card-section class="q-py-sm">
          <div class="text-caption text-grey-6">{{ $t('transactions.income') }}</div>
          <div class="text-h6 text-positive text-weight-bold">
            +{{ formatCurrency(filteredTotalIngresos) }}
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="col">
        <q-card-section class="q-py-sm">
          <div class="text-caption text-grey-6">{{ $t('transactions.expenses') }}</div>
          <div class="text-h6 text-negative text-weight-bold">
            -{{ formatCurrency(filteredTotalGastos) }}
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="col">
        <q-card-section class="q-py-sm">
          <div class="text-caption text-grey-6">{{ $t('transactions.balance') }}</div>
          <div
            class="text-h6 text-weight-bold"
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
        :pagination="{ rowsPerPage: 10 }"
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
              :color="props.row.type === 'ingreso' ? 'green-1' : 'red-1'"
              :text-color="props.row.type === 'ingreso' ? 'green' : 'red-9'"
              :label="props.row.type === 'ingreso' ? $t('transactions.type_income') : $t('transactions.type_expense')"
              class="text-capitalize q-px-sm q-py-xs text-bold"
            />
          </q-td>
        </template>

        <!-- Monto -->
        <template #body-cell-amount="props">
          <q-td :props="props">
            <span
              class="text-weight-bold"
              :class="props.row.type === 'ingreso' ? 'text-positive' : 'text-negative'"
            >
              {{ props.row.type === 'ingreso' ? '+' : '-' }}{{ formatCurrency(props.row.amount) }}
            </span>
          </q-td>
        </template>

        <!-- Método (cuenta) -->
        <template #body-cell-account_name="props">
          <q-td :props="props">
            <q-chip dense outline color="grey-7" class="q-ma-none">
              {{ props.row.account_name }}
            </q-chip>
          </q-td>
        </template>

        <!-- Eliminar -->
        <template #body-cell-actions="props">
          <q-td :props="props" auto-width>
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

    <!-- Modal: Nueva Transacción -->
    <TransactionForm v-model="showForm" />

    <!-- Confirmación eliminar -->
    <q-dialog v-model="showConfirm">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">{{ $t('transactions.delete_title') }}</div>
          <div class="text-body2 q-mt-sm text-grey-7">
            {{ $t('transactions.delete_confirm') }} <strong>{{ toDelete?.description }}</strong>?
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
import { useTransactionsStore } from 'stores/transactions.store'
import { useAccountsStore } from 'stores/accounts.store'
import { useSettingsStore } from 'stores/settings.store'
import { useCurrency } from 'src/composables/useCurrency'
import TransactionForm from 'components/transactions/TransactionForm.vue'

const { t } = useI18n()
const { formatCurrency } = useCurrency()
const store = useTransactionsStore()
const accountsStore = useAccountsStore()
const settingsStore = useSettingsStore()

const showForm = ref(false)
const showConfirm = ref(false)
const toDelete = ref(null)

// ── Filtros ───────────────────────────────────────────────────────────────────

const filters = ref({
  type:     'all',
  account:  null,
  category: null,
  dateFrom: null,
  dateTo:   null,
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

const hasActiveFilters = computed(() =>
  filters.value.type !== 'all' ||
  filters.value.account ||
  filters.value.category ||
  filters.value.dateFrom ||
  filters.value.dateTo
)

function clearFilters() {
  filters.value = { type: 'all', account: null, category: null, dateFrom: null, dateTo: null }
}

// ── Transacciones filtradas ───────────────────────────────────────────────────

const filteredTransactions = computed(() => {
  return store.transactions.filter(t => {
    if (filters.value.type !== 'all' && t.type !== filters.value.type) return false
    if (filters.value.account && t.account_name !== filters.value.account) return false
    if (filters.value.category && t.category !== filters.value.category) return false
    if (filters.value.dateFrom && t.date < filters.value.dateFrom) return false
    if (filters.value.dateTo && t.date > filters.value.dateTo) return false
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
  toDelete.value = null
}
</script>

<style scoped>
.filter-toggle {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}
</style>
