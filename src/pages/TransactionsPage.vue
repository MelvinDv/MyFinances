<template>
  <q-page class="q-pa-lg">
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">Transacciones</div>
        <div class="text-caption text-grey-6">Administra tus ingresos y gastos</div>
      </div>
      <q-btn
        color="dark"
        icon="add"
        label="Nueva Transacción"
        unelevated
        @click="showForm = true"
      />
    </div>

    <!-- Resumen rápido -->
    <div class="row q-gutter-md q-mb-lg">
      <q-card flat bordered class="col">
        <q-card-section class="q-py-sm">
          <div class="text-caption text-grey-6">Ingresos</div>
          <div class="text-h6 text-positive text-weight-bold">
            +{{ formatCurrency(store.totalIngresos) }}
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="col">
        <q-card-section class="q-py-sm">
          <div class="text-caption text-grey-6">Gastos</div>
          <div class="text-h6 text-negative text-weight-bold">
            -{{ formatCurrency(store.totalGastos) }}
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="col">
        <q-card-section class="q-py-sm">
          <div class="text-caption text-grey-6">Balance</div>
          <div
            class="text-h6 text-weight-bold"
            :class="store.balance >= 0 ? 'text-positive' : 'text-negative'"
          >
            {{ formatCurrency(store.balance) }}
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Tabla de transacciones -->
    <q-card flat bordered>
      <q-table
        :rows="store.transactions"
        :columns="columns"
        row-key="id"
        flat
        :pagination="{ rowsPerPage: 10 }"
        no-data-label="No hay transacciones aún"
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
              :label="props.row.type === 'ingreso' ? 'Ingreso' : 'Gasto'"
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
          <div class="text-h6">Eliminar transacción</div>
          <div class="text-body2 q-mt-sm text-grey-7">
            ¿Estás seguro que deseas eliminar <strong>{{ toDelete?.description }}</strong
            >?
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Eliminar" color="negative" @click="handleDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useTransactionsStore } from 'stores/transactions.store'
import TransactionForm from 'components/transactions/TransactionForm.vue'

const store = useTransactionsStore()
const showForm = ref(false)
const showConfirm = ref(false)
const toDelete = ref(null)

const columns = [
  { name: 'date', label: 'Fecha', field: 'date', align: 'left', sortable: true },
  { name: 'type', label: 'Tipo', field: 'type', align: 'left' },
  { name: 'amount', label: 'Monto', field: 'amount', align: 'left', sortable: true },
  { name: 'category', label: 'Categoría', field: 'category', align: 'left' },
  { name: 'account_name', label: 'Método', field: 'account_name', align: 'left' },
  { name: 'description', label: 'Descripción', field: 'description', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
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
  toDelete.value = null
}
</script>
